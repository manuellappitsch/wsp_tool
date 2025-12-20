import { supabaseAdmin } from "@/lib/supabase-admin";
import { startOfDay, endOfDay } from "date-fns";
import { createId } from "@paralleldrive/cuid2";

export type BookingResult =
    | { success: true; bookingId: string }
    | { success: false; reason: string; code: string };

export class BookingService {
    /**
     * Validates if a user (B2B) or Customer (B2C) can book a specific timeslot.
     * 1. If B2B (userId provided): Check Tenant Quota & User Duplicates.
     * 2. If B2C (b2cCustomerId provided): Check Credits.
     * 3. Always: Check Global Capacity (Points System).
     */
    static async validateBookingEligibility(
        { userId, b2cCustomerId }: { userId?: string, b2cCustomerId?: string },
        timeslotId: string,
        careLevel: number = 2
    ): Promise<{ valid: boolean; error?: string; code?: string }> {

        const { data: timeslot, error: slotError } = await supabaseAdmin
            .from('timeslots')
            .select('*')
            .eq('id', timeslotId)
            .single();

        if (slotError) console.error("BookingService: Slot Lookup Error:", slotError);

        if (!timeslot) {
            return { valid: false, error: `Timeslot not found (ID: ${timeslotId})`, code: "SLOT_INVALID" };
        }
        if (timeslot.isBlocked) {
            return { valid: false, error: "Timeslot is blocked", code: "SLOT_BLOCKED" };
        }

        // Global Capacity Check (Points)
        const capacityPoints = timeslot.capacity_points || 20;
        const { data: slotBookings } = await supabaseAdmin
            .from('bookings')
            .select('care_level_snapshot')
            .eq('timeslotId', timeslotId)
            .neq('status', 'CANCELLED');

        const currentPoints = slotBookings?.reduce((sum, b) => sum + (b.care_level_snapshot || 2), 0) || 0;

        if (currentPoints + careLevel > capacityPoints) {
            return { valid: false, error: "Global capacity reached for this slot", code: "GLOBAL_CAPACITY_FULL" };
        }

        // --- 2. B2B Specific Logic ---
        if (userId) {
            const { data: user } = await supabaseAdmin
                .from('users')
                .select('*, tenant:tenants(*)')
                .eq('id', userId)
                .single();

            // @ts-ignore
            const tenant = user?.tenant;
            if (!tenant) return { valid: false, error: "Tenant not found", code: "USER_INVALID" };

            // Check Daily Limit (User)
            // ... (Same logic as before for user today) ...
            // Simplified check for now:
            const { data: userBookingToday } = await supabaseAdmin
                .from('bookings')
                .select('id, timeslot:timeslots!inner(date)')
                .eq('userId', userId)
                .eq('timeslot.date', timeslot.date) // This works if we trust exact string match, better use ID filter
                .neq('status', 'CANCELLED')
                .maybeSingle(); // Use maybeSingle to avoid 406 error if multiple (shouldn't happen but safe) but we want just one check.

            // Actually, we need to be careful with nested filtering in Supabase.
            // Let's use the Date-Time Slots lookup pattern again for safety.
            const { data: slotsOnDate } = await supabaseAdmin.from('timeslots').select('id').eq('date', timeslot.date);
            const slotIds = slotsOnDate?.map(s => s.id) || [];

            const { count } = await supabaseAdmin
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .in('timeslotId', slotIds)
                .eq('userId', userId)
                .neq('status', 'CANCELLED');

            if (count && count > 0) return { valid: false, error: "User already booked today", code: "USER_ALREADY_BOOKED" };

            // Check Company Quota
            const { count: tenantCount } = await supabaseAdmin
                .from('bookings')
                .select('*, user:users!inner(tenantId)', { count: 'exact', head: true })
                .in('timeslotId', slotIds)
                .eq('user.tenantId', tenant.id)
                .neq('status', 'CANCELLED');

            if ((tenantCount || 0) >= tenant.dailyKontingent) {
                return { valid: false, error: "Company quota reached", code: "TENANT_QUOTA_EXCEEDED" };
            }
        }
        // --- 3. B2C Specific Logic ---
        else if (b2cCustomerId) {
            const { data: customer } = await supabaseAdmin
                .from('b2c_customers')
                .select('*')
                .eq('id', b2cCustomerId)
                .single();

            if (!customer) {
                return { valid: false, error: "B2C Customer not found", code: "CUSTOMER_INVALID" };
            }

            if (!customer.isActive) {
                return { valid: false, error: "Customer account is inactive", code: "CUSTOMER_INACTIVE" };
            }

            if (customer.credits < 1) {
                // Check if Subscription covers it
                const hasActiveSubscription = customer.subscriptionEndDate && new Date(customer.subscriptionEndDate) > new Date();

                if (!hasActiveSubscription) {
                    return { valid: false, error: "Not enough credits and no active subscription", code: "INSUFFICIENT_CREDITS" };
                }
            }

            // Check B2C Duplicates? (Optional, maybe allowed for paying customers)
            // Let's prevent double booking same slot at least.
            const { data: existingBooking } = await supabaseAdmin
                .from('bookings')
                .select('id')
                .eq('timeslotId', timeslotId)
                .eq('b2cCustomerId', b2cCustomerId)
                .neq('status', 'CANCELLED')
                .single();

            if (existingBooking) {
                return { valid: false, error: "Customer already booked this slot", code: "DUPLICATE_BOOKING" };
            }

        }

        return { valid: true };
    }

    /**
     * Executes the booking transaction
     */
    static async createBooking(
        { userId, b2cCustomerId }: { userId?: string, b2cCustomerId?: string },
        timeslotId: string,
        notes?: string
    ): Promise<BookingResult> {
        // Standard B2B User Care Level = 2
        // If B2C, we might want to check if they have a specific level or just use default 1/2? 
        // For now, hardcode 2 for safety.
        const careLevel = 2;

        // Run validation first
        const eligibility = await this.validateBookingEligibility({ userId, b2cCustomerId }, timeslotId, careLevel);
        if (!eligibility.valid) {
            return { success: false, reason: eligibility.error!, code: eligibility.code! };
        }

        try {
            // 1. Re-check capacity (Optimistic Lock simulation)
            // Fetch slot and calculate current points again
            const { data: timeslot } = await supabaseAdmin
                .from('timeslots')
                .select('*')
                .eq('id', timeslotId)
                .single();

            const capacityPoints = timeslot.capacity_points || 20;

            const { data: slotBookings } = await supabaseAdmin
                .from('bookings')
                .select('care_level_snapshot')
                .eq('timeslotId', timeslotId)
                .neq('status', 'CANCELLED');

            const currentPoints = slotBookings?.reduce((sum, b) => sum + (b.care_level_snapshot || 2), 0) || 0;

            if (currentPoints + careLevel > capacityPoints) {
                return { success: false, reason: "Slot became full during booking", code: "GLOBAL_CAPACITY_FULL" };
            }

            // 2. Increment global counter (Legacy/Visual support)
            const { error: updateError } = await supabaseAdmin
                .from('timeslots')
                .update({ bookedCount: (timeslot.bookedCount || 0) + 1 })
                .eq('id', timeslotId);

            if (updateError) throw updateError;

            // 2b. Deduct credits if B2C (ONLY if no active subscription)
            if (b2cCustomerId) {
                const { data: customer } = await supabaseAdmin
                    .from('b2c_customers')
                    .select('credits, subscriptionEndDate')
                    .eq('id', b2cCustomerId)
                    .single();

                if (customer) {
                    const hasActiveSubscription = customer.subscriptionEndDate && new Date(customer.subscriptionEndDate) > new Date();

                    if (!hasActiveSubscription) {
                        // Deduct Credit only if no subscription
                        await supabaseAdmin
                            .from('b2c_customers')
                            .update({ credits: customer.credits - 1 })
                            .eq('id', b2cCustomerId);
                    }
                }
            }

            // 3. Create booking
            const { data: booking, error: createError } = await supabaseAdmin
                .from('bookings')
                .insert({
                    id: createId(),
                    userId, // Can be undefined
                    b2cCustomerId, // Can be undefined
                    timeslotId,
                    status: "CONFIRMED",
                    notes,
                    care_level_snapshot: careLevel,
                    updatedAt: new Date().toISOString()
                })
                .select('*, user:users(*), timeslot:timeslots(*)') // Include for email
                .single();

            if (createError) {
                console.error("Booking Insert Failed:", createError);
                throw createError;
            }

            // 4. Send Confirmation Email (Only for B2B Users currently)
            if (booking?.user?.email) {
                try {
                    // @ts-ignore
                    const user = booking.user;
                    // @ts-ignore
                    const timeslot = booking.timeslot;

                    if (user && user.email && timeslot) {
                        const { sendEmail } = await import("@/lib/resend");
                        const { EmailTemplates } = await import("@/lib/email-templates");
                        const { format } = await import("date-fns");
                        const { de } = await import("date-fns/locale");

                        const dateObj = new Date(timeslot.date);
                        const timeObj = new Date(timeslot.startTime);

                        const formattedDate = format(dateObj, "dd.MM.yyyy", { locale: de });
                        const formattedTime = format(timeObj, "HH:mm", { locale: de });

                        await sendEmail({
                            to: user.email,
                            subject: "Dein WSP Training ist bestätigt! 🚀",
                            html: EmailTemplates.bookingConfirmation(user.firstName, formattedDate, formattedTime)
                        });
                    }
                } catch (emailError) {
                    console.error("Failed to send booking confirmation email:", emailError);
                }
            }

            return { success: true, bookingId: booking.id };

        } catch (error: any) {
            console.error("Booking transaction failed:", error);
            return { success: false, reason: "Internal System Error", code: "SYSTEM_ERROR" };
        }
    }
}
