import { db } from "@/lib/db";
import { startOfDay, endOfDay, differenceInMonths, addMonths } from "date-fns";
import { createId } from "@paralleldrive/cuid2";
import { SubscriptionType } from "@prisma/client";
import { getSubscriptionLimit } from "@/config/subscriptions";
import { EmailTemplates } from "@/lib/email-templates"; // Dynamic imports in method to avoid cycles if any? No, static here is fine.
import { sendEmail, EMAIL_SENDER_SUPPORT } from "@/lib/resend";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export type BookingResult =
    | { success: true; bookingId: string }
    | { success: false; reason: string; code: string };

export class BookingService {
    /**
     * Validates if a Profile can book a specific timeslot.
     * Handles both B2B (Tenant Quotas) and B2C (Subscriptions/Credits).
     */
    static async validateBookingEligibility(
        { userId }: { userId: string },
        timeslotId: string,
        careLevel: number = 2
    ): Promise<{ valid: boolean; error?: string; code?: string }> {

        // 1. Fetch Timeslot
        const timeslot = await db.timeslot.findUnique({
            where: { id: timeslotId }
        });

        if (!timeslot) {
            return { valid: false, error: `Timeslot not found (ID: ${timeslotId})`, code: "SLOT_INVALID" };
        }

        if (timeslot.isBlocked) {
            return { valid: false, error: "Timeslot is blocked", code: "SLOT_BLOCKED" };
        }

        // Check if slot is in the past
        const slotDate = new Date(timeslot.date);
        const slotTime = new Date(timeslot.startTime);

        // Robust combination of Date and Time to support both Full DateTime and Time-Only formats
        const realStart = new Date(slotDate);
        realStart.setHours(slotTime.getUTCHours(), slotTime.getUTCMinutes(), 0, 0);

        // Adjust for potential timezone mismatch if DB stores date as UTC midnight but time as UTC
        // Ideally we trust Prisma Date objects. 
        // If realStart is wildly off (e.g. 1970), it means slotDate was wrong, but slotDate is usually correct.

        if (realStart < new Date()) {
            return { valid: false, error: "Termine in der Vergangenheit können nicht gebucht werden.", code: "SLOT_IN_PAST" };
        }

        // 2. Global Capacity Check (Points)
        const capacityPoints = timeslot.capacity_points || 20;

        // Sum existing bookings points
        // Aggregate specific field
        const result = await db.booking.aggregate({
            _sum: {
                care_level_snapshot: true
            },
            where: {
                timeslotId: timeslotId,
                status: { not: "CANCELLED" }
            }
        });

        const currentPoints = result._sum.care_level_snapshot || 0;

        if (currentPoints + careLevel > capacityPoints) {
            return { valid: false, error: "Global capacity reached for this slot", code: "GLOBAL_CAPACITY_FULL" };
        }

        // 3. Fetch Profile
        const profile = await db.profile.findUnique({
            where: { id: userId },
            include: { tenant: true }
        });

        if (!profile) return { valid: false, error: "User profile not found", code: "USER_INVALID" };

        const isB2B = profile.role === "USER" || profile.role === "TENANT_ADMIN";
        const isB2C = profile.role === "B2C_CUSTOMER";

        // --- B2B Specific Logic ---
        if (isB2B) {
            const tenant = profile.tenant;
            if (!tenant) return { valid: false, error: "Tenant not found for employee", code: "USER_INVALID" };

            // Determine Quota Strategy
            const quotaType = tenant.quotaType || "NORMAL";
            const bookingDate = timeslot.date;

            if (quotaType === "SPECIAL") {
                // SPECIAL: Max 1 Booking per DAY (User)
                // Filter slots on SAME DAY
                const count = await db.booking.count({
                    where: {
                        userId: userId,
                        status: { not: "CANCELLED" },
                        timeslot: {
                            date: bookingDate // Exact match on date
                        }
                    }
                });

                if (count >= 1) {
                    return { valid: false, error: "Ihr 'Special' Kontingent erlaubt nur 1 Training pro Tag.", code: "USER_QUOTA_EXCEEDED_DAILY" };
                }
            } else {
                // NORMAL: Max 4 Bookings per MONTH (User)
                const startOfMonth = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), 1);
                const endOfMonth = new Date(bookingDate.getFullYear(), bookingDate.getMonth() + 1, 0, 23, 59, 59);

                const count = await db.booking.count({
                    where: {
                        userId: userId,
                        status: { not: "CANCELLED" },
                        timeslot: {
                            date: {
                                gte: startOfMonth,
                                lte: endOfMonth
                            }
                        }
                    }
                });

                if (count >= 4) {
                    return { valid: false, error: "Ihr Kontingent ist erschöpft (Max. 4 Trainings pro Monat).", code: "USER_QUOTA_EXCEEDED_MONTHLY" };
                }
            }

            // Check Company Global Daily Limit (Regardless of User Type)
            const tenantCount = await db.booking.count({
                where: {
                    timeslot: {
                        date: bookingDate
                    },
                    status: { not: "CANCELLED" },
                    user: {
                        tenantId: tenant.id
                    }
                }
            });

            if (tenantCount >= tenant.dailyKontingent) {
                return { valid: false, error: "Tages-Kontingent Ihrer Firma ist erschöpft.", code: "TENANT_QUOTA_EXCEEDED" };
            }
        }
        // --- B2C Specific Logic ---
        else if (isB2C) {

            if (!profile.isActive) {
                return { valid: false, error: "Customer account is inactive", code: "CUSTOMER_INACTIVE" };
            }

            // Check Subscription Status for this specific SLOT
            const slotDate = timeslot.date;
            const subEndDate = profile.subscriptionEndDate;
            const isCoveredBySubscription = subEndDate && subEndDate >= slotDate;

            if (isCoveredBySubscription && profile.subscriptionStartDate && profile.subscriptionType) {
                // --- SUBSCRIPTION QUOTA LOGIC ---
                const startDate = profile.subscriptionStartDate;

                // Calculate which "Contract Month" this slot belongs to
                // Note: differenceInMonths might return integer, check fractional?
                // Using start of contract logic
                const slotMonthIndex = differenceInMonths(slotDate, startDate);

                const limit = getSubscriptionLimit(profile.subscriptionType, slotMonthIndex);

                const intervalStart = addMonths(startDate, slotMonthIndex);
                const intervalEnd = addMonths(startDate, slotMonthIndex + 1);

                const usageCount = await db.booking.count({
                    where: {
                        userId: userId,
                        status: { not: "CANCELLED" },
                        timeslot: {
                            date: {
                                gte: intervalStart,
                                lt: intervalEnd
                            }
                        }
                    }
                });

                if (usageCount >= limit) {
                    return { valid: false, error: `Monatslimit erreicht (${usageCount}/${limit} Trainings)`, code: "SUBSCRIPTION_LIMIT_REACHED" };
                }

            } else {
                // --- FALLBACK TO CREDITS ---
                if ((profile.credits || 0) < 1) {
                    return { valid: false, error: "Kein Guthaben und kein aktives Abo für diesen Termin", code: "INSUFFICIENT_CREDITS" };
                }
            }
        }

        // Check User Duplicates (Double Booking)
        const existing = await db.booking.findFirst({
            where: {
                timeslotId: timeslotId,
                userId: userId,
                status: { not: "CANCELLED" }
            }
        });

        if (existing) {
            return { valid: false, error: "Du hast diesen Termin bereits gebucht", code: "DUPLICATE_BOOKING" };
        }

        return { valid: true };
    }

    /**
     * Executes the booking transaction
     */
    static async createBooking(
        { userId }: { userId: string },
        timeslotId: string,
        notes?: string
    ): Promise<BookingResult> {
        const careLevel = 2; // Default

        // 1. Validate First (Read-only check)
        const eligibility = await this.validateBookingEligibility({ userId }, timeslotId, careLevel);
        if (!eligibility.valid) {
            return { success: false, reason: eligibility.error!, code: eligibility.code! };
        }

        try {
            // Transaction
            const result = await db.$transaction(async (tx) => {
                // Optimistic Lock Check: Re-fetch Capacity
                // We can't easily lock properly without raw SQL, but transaction helps atomicity.

                const timeslot = await tx.timeslot.findUniqueOrThrow({ where: { id: timeslotId } });
                const capacityPoints = timeslot.capacity_points || 20;

                const pointResult = await tx.booking.aggregate({
                    _sum: { care_level_snapshot: true },
                    where: { timeslotId, status: { not: "CANCELLED" } }
                });
                const currentPoints = pointResult._sum.care_level_snapshot || 0;

                if (currentPoints + careLevel > capacityPoints) {
                    throw new Error("GLOBAL_CAPACITY_FULL");
                }

                // Increment Booked Count (Legacy)
                await tx.timeslot.update({
                    where: { id: timeslotId },
                    data: { bookedCount: { increment: 1 } }
                });

                // Fetch Profile for Credit Check
                const profile = await tx.profile.findUniqueOrThrow({ where: { id: userId } });
                const isB2C = profile.role === "B2C_CUSTOMER";

                if (isB2C) {
                    const slotDate = timeslot.date;
                    const subEndDate = profile.subscriptionEndDate;
                    const isCoveredBySubscription = subEndDate && subEndDate >= slotDate;

                    if (!isCoveredBySubscription) {
                        // Deduct Credit
                        if (profile.credits < 1) throw new Error("INSUFFICIENT_CREDITS");
                        await tx.profile.update({
                            where: { id: userId },
                            data: { credits: { decrement: 1 } }
                        });
                    }
                }

                // Create Booking
                const booking = await tx.booking.create({
                    data: {
                        userId,
                        timeslotId,
                        status: "CONFIRMED",
                        notes,
                        care_level_snapshot: careLevel
                    },
                    include: {
                        user: true,
                        timeslot: true
                    }
                });

                return booking;
            });

            // Post-Transaction: Send Email
            if (result.user.email && result.user.emailNotifications) {
                try {
                    const dateObj = result.timeslot.date;
                    const timeObj = result.timeslot.startTime;
                    const formattedDate = format(dateObj, "dd.MM.yyyy", { locale: de });
                    const formattedTime = format(timeObj, "HH:mm", { locale: de });

                    await sendEmail({
                        to: result.user.email,
                        subject: "Training bestätigt! ✅",
                        html: EmailTemplates.bookingConfirmation(result.user.firstName || "Kunde", formattedDate, formattedTime),
                        from: EMAIL_SENDER_SUPPORT
                    });
                } catch (e) {
                    console.error("Failed to send email", e);
                }
            }

            return { success: true, bookingId: result.id };

        } catch (error: any) {
            console.error("Booking Transaction Failed:", error);
            if (error.message === "GLOBAL_CAPACITY_FULL") {
                return { success: false, reason: "Slot became full during booking", code: "GLOBAL_CAPACITY_FULL" };
            }
            if (error.message === "INSUFFICIENT_CREDITS") {
                return { success: false, reason: "Kein Guthaben und kein aktives Abo", code: "INSUFFICIENT_CREDITS" };
            }
            return { success: false, reason: "Internal System Error", code: "SYSTEM_ERROR" };
        }
    }
}
