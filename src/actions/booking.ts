"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // We need server-side auth
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

export async function getAvailableSlots(date: Date) {
    try {
        // Fix: Use strict YYYY-MM-DD filtering to avoid timezone overlaps
        const dateStr = format(date, "yyyy-MM-dd");

        // Create a UTC date at noon to ensure we hit the correct day in DB regardless of small offsets
        // Postgres DATE type stores YYYY-MM-DD. Prisma maps JS Date to that.
        const queryDate = new Date(`${dateStr}T12:00:00Z`);

        const slots = await db.timeslot.findMany({
            where: {
                date: queryDate,
                isBlocked: false,
                type: 'NORMAL', // Only show normal slots to users/B2C
                // Removed database-level startTime check due to 1970 date issue
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        // Current time for filtering
        const now = new Date();

        // Map to simple strings "HH:mm" and filter past slots strictly in memory
        return slots
            .filter(slot => {
                // Construct Full Date for the Slot
                // slot.date is the day (e.g. 2026-01-22)
                // slot.startTime is the time (on 1970-01-01)

                const slotDateTime = new Date(slot.date);
                const timeComponent = new Date(slot.startTime);

                slotDateTime.setHours(
                    timeComponent.getUTCHours(),
                    timeComponent.getUTCMinutes(),
                    0,
                    0
                );

                // Only keep slots in the future
                return slotDateTime > now;
            })
            .map(slot => ({
                id: slot.id,
                // Force UTC extraction to avoid timezone shifts (Server Time vs Display Time)
                time: slot.startTime.toISOString().substring(11, 16),
                available: (slot.bookedCount < slot.globalCapacity) // Simple check
            }));

    } catch (error) {
        console.error("Error fetching slots:", error);
        return [];
    }
}

export async function bookSlot(slotId: string) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return { error: "Nicht eingeloggt." };
        }

        const { BookingService } = await import("@/lib/booking-service");

        // Unified User ID (Profile)
        const userId = session.user.id;

        const result = await BookingService.createBooking({ userId }, slotId);

        if (result.success) {
            // Create Admin Notification (Safe Mode)
            try {
                const { createAdminNotification } = await import("@/actions/notifications");
                const { format } = await import("date-fns"); // Ensure available

                const newBooking = await db.booking.findUnique({
                    where: { id: result.bookingId },
                    include: { timeslot: true, user: { include: { tenant: true } } }
                });

                if (newBooking) {
                    const name = `${newBooking.user?.firstName || ''} ${newBooking.user?.lastName || ''}`;
                    const tenantName = newBooking.user?.tenant?.companyName ? ` (${newBooking.user.tenant.companyName})` : '';

                    const dateStr = format(newBooking.timeslot.date, "dd.MM.yyyy");
                    const timeStr = format(newBooking.timeslot.startTime, "HH:mm");

                    await createAdminNotification({
                        title: `✅ Neue Buchung: ${name}${tenantName}`,
                        message: `Termin am ${dateStr} um ${timeStr} Uhr wurde gebucht.`,
                        type: "SUCCESS"
                    });
                }
            } catch (notifError) {
                console.error("Failed to send admin notification for booking:", notifError);
            }

            revalidatePath("/user/booking");
            revalidatePath("/user/dashboard");
            revalidatePath("/b2c/dashboard");
            revalidatePath("/admin"); // Refresh admin dashboard stats
            return { success: true, bookingId: result.bookingId };
        } else {
            // Map internal error codes to user friendly messages if needed
            let msg = result.reason || "Buchung fehlgeschlagen.";
            if (result.code === "SUBSCRIPTION_LIMIT_REACHED") msg = result.reason;
            if (result.code === "INSUFFICIENT_CREDITS") msg = "Kein Guthaben und kein aktives Abo vorhanden.";
            if (result.code === "USER_ALREADY_BOOKED" || result.code === "DUPLICATE_BOOKING") msg = "Du hast diesen Termin bereits gebucht.";

            return { error: msg };
        }

    } catch (error) {
        console.error("Booking Error:", error);
        return { error: "Systemfehler bei der Buchung." };
    }
}

export async function cancelSlot(bookingId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return { error: "Nicht eingeloggt." };
        }

        const userId = session.user.id;

        // Verify Ownership
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                timeslot: true,
                user: { include: { tenant: true } },
            }
        });

        if (!booking) return { error: "Buchung nicht gefunden." };

        // Check ownership
        if (booking.userId !== userId) {
            // Maybe Admin can cancel any? Or Tenant Admin?
            // For now specific "cancelSlot" action implies User Action.
            // Admins probably use a different action or we allow if Role is Admin.
            // Let's stick to Owner Only for this action as it's typically used in User Dashboard.
            return { error: "Nicht autorisiert." };
        }

        if (booking.status === "CANCELLED") {
            return { error: "Bereits storniert." };
        }

        // 1. Update Booking Status
        await db.booking.update({
            where: { id: bookingId },
            data: { status: "CANCELLED" }
        });

        // 2. Decrement Timeslot bookedCount
        await db.timeslot.update({
            where: { id: booking.timeslotId },
            data: { bookedCount: { decrement: 1 } }
        });

        // 3. Logic: Refund Credit? (Only B2C Customers)
        const profile = booking.user;
        if (profile.role === "B2C_CUSTOMER") {
            const slotDate = new Date(booking.timeslot.date);
            const slotTime = new Date(booking.timeslot.startTime);
            const now = new Date();

            // Calculate hours until start
            const diffInMilliseconds = slotTime.getTime() - now.getTime();
            const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

            const subEndDate = profile.subscriptionEndDate ? new Date(profile.subscriptionEndDate) : null;
            const isCoveredBySubscription = subEndDate && subEndDate >= slotDate;

            if (!isCoveredBySubscription) {
                // Was paid by Credit -> Refund ONLY if > 24h
                if (diffInHours > 24) {
                    await db.profile.update({
                        where: { id: profile.id },
                        data: { credits: { increment: 1 } }
                    });
                }
                // Else: Credit forfeited (Penalty)
            }
        }

        // 4. Create Admin Notification
        const name = `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`;
        const dateStr = format(booking.timeslot.date, "dd.MM.yyyy");
        const timeStr = format(booking.timeslot.startTime, "HH:mm");

        const { createAdminNotification } = await import("@/actions/notifications");

        await createAdminNotification({
            title: `❌ Stornierung: ${name}`,
            message: `Der Termin am ${dateStr} um ${timeStr} Uhr wurde vom Benutzer storniert.`,
            type: "CANCEL"
        });

        // 5. EMAIL NOTIFICATION TO USER
        const recipient = booking.user;
        if (recipient && recipient.email && booking.timeslot) {
            try {
                if (recipient.emailNotifications === false) {
                    // Skip
                } else {
                    const { sendEmail, EMAIL_SENDER_SUPPORT } = await import("@/lib/resend");
                    const { EmailTemplates } = await import("@/lib/email-templates");
                    const { de } = await import("date-fns/locale");

                    const d = format(booking.timeslot.date, "dd.MM.yyyy", { locale: de });
                    const t = format(booking.timeslot.startTime, "HH:mm", { locale: de });
                    const dateString = `${d} um ${t}`;

                    await sendEmail({
                        to: recipient.email,
                        subject: "Schade – Dein Training wurde storniert",
                        html: EmailTemplates.cancellation(recipient.firstName || "Kunde", dateString),
                        from: EMAIL_SENDER_SUPPORT
                    });
                }
            } catch (e) {
                console.error("Failed to send cancellation email:", e);
            }
        }

        revalidatePath("/user/booking");
        revalidatePath("/user/dashboard");
        revalidatePath("/b2c/dashboard");
        revalidatePath("/admin/tasks");
        revalidatePath("/admin/calendar");

        return { success: true };

    } catch (error) {
        console.error("Cancellation Error:", error);
        return { error: "Fehler beim Stornieren." };
    }
}

export async function getMyFutureBookings() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return [];

        const userId = session.user.id;

        const bookings = await db.booking.findMany({
            where: {
                userId: userId,
                status: { not: "CANCELLED" },
                timeslot: {
                    date: { gt: new Date() }
                }
            },
            include: {
                timeslot: true
            },
            orderBy: {
                timeslot: { date: "asc" }
            }
        });

        // Clean up for Client
        return bookings.map(b => ({
            id: b.id,
            date: b.timeslot.date, // Date Object
            time: b.timeslot.startTime, // Date Object
            status: b.status,
            formattedDate: format(b.timeslot.date, "dd.MM.yyyy"),
            formattedTime: format(b.timeslot.startTime, "HH:mm"),
            timeslotId: b.timeslotId
        }));

    } catch (e) {
        console.error("Fetch Future Bookings Error:", e);
        return [];
    }
}
