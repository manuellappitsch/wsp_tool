'use server'

import { BookingService } from "@/lib/booking-service";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export async function createAdminBooking(prevState: any, formData: FormData) {
    const timeslotId = (formData.get("timeslotId") as string || "").trim();
    const type = formData.get("type") as "B2C" | "B2B";
    const careLevel = parseInt(formData.get("careLevel") as string || "2");

    if (!timeslotId) {
        return { success: false, message: "Interner Fehler: Keine Timeslot ID übertragen." };
    }

    // B2C Customer ID (Profile ID)
    const b2cCustomerId = formData.get("b2cCustomerId") as string;
    // B2B User ID (Profile ID)
    const userId = formData.get("userId") as string;

    const duration = parseInt(formData.get("duration") as string || "30");
    const notes = formData.get("notes") as string || "Admin Booking";

    console.log(`Booking Request: ID=${timeslotId}, Duration=${duration}`);

    // If duration is 60, we need to find the next timeslot
    let timeslotIds = [timeslotId];

    if (duration === 60) {
        // Find current slot to get time
        const currentSlot = await db.timeslot.findUnique({ where: { id: timeslotId } });
        if (currentSlot) {
            // Find next slot (30 mins later)
            const nextSlot = await db.timeslot.findFirst({
                where: {
                    date: currentSlot.date,
                    startTime: currentSlot.endTime // endTime of current is startTime of next
                }
            });

            if (nextSlot) {
                timeslotIds.push(nextSlot.id);
            } else {
                return { success: false, message: "Folgetermin für 60-Minuten-Buchung nicht verfügbar." };
            }
        }
    }

    try {
        for (const tid of timeslotIds) {
            let result;
            if (type === "B2C") {
                if (!b2cCustomerId) return { success: false, message: "Bitte wählen Sie einen Kunden aus." };

                result = await BookingService.createBooking(
                    { userId: b2cCustomerId },
                    tid,
                    `${notes} (${duration}min)`
                );
            } else {
                // B2B
                if (!userId) return { success: false, message: "Bitte wählen Sie einen B2B User aus." };

                result = await BookingService.createBooking(
                    { userId },
                    tid,
                    `${notes} (${duration}min)`
                );
            }

            if (!result.success) {
                return { success: false, message: `Fehler bei Slot ${tid}: ${result.reason}` };
            }
        }

        revalidatePath("/admin/calendar");
        return { success: true, message: "Buchung(en) erfolgreich erstellt!" };

    } catch (e: any) {
        console.error("Server Action Error:", e);
        return { success: false, message: "Systemfehler: " + e.message };
    }
}

export async function getAdminCalendarData(start: Date, end: Date) {
    try {
        const slots = await db.timeslot.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                bookings: {
                    include: {
                        user: {
                            include: {
                                tenant: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { date: 'asc' },
                { startTime: 'asc' }
            ]
        });

        // Helper for consistent Timezone (Use UTC Face Value to match DB storage)
        const formatBerlinTime = (date: Date | string) => {
            if (!date) return "00:00";
            if (typeof date === 'string') {
                if (date.length <= 8 && date.includes(':')) {
                    return date.substring(0, 5);
                }
                const d = new Date(date);
                if (isNaN(d.getTime())) return date.substring(0, 5);
                // Fallback to Date obj handling below
                date = d;
            }
            // Date object
            const h = date.getUTCHours().toString().padStart(2, '0');
            const m = date.getUTCMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        // Process slots to calculate load
        const processedSlots = slots.map((slot: any) => {
            // Filter out CANCELLED bookings
            const activeBookings = slot.bookings ? slot.bookings.filter((b: any) => b.status !== 'CANCELLED') : [];

            // Prisma uses camelCase: care_level_snapshot -> careLevelSnapshot
            const currentLoad = activeBookings.reduce((acc: number, b: any) => acc + (b.care_level_snapshot || b.careLevelSnapshot || 0), 0);
            // Prisma uses camelCase: capacity_points -> capacityPoints
            const capacity = slot.capacity_points || slot.capacityPoints || 20;
            const usageRatio = currentLoad / capacity;

            let trafficLight = "green";
            if (usageRatio >= 0.9) trafficLight = "red";
            else if (usageRatio >= 0.6) trafficLight = "yellow";

            return {
                ...slot,
                capacity_points: capacity, // Ensure both formats available
                startTime: formatBerlinTime(slot.startTime),
                endTime: formatBerlinTime(slot.endTime),
                currentLoad,
                capacity,
                trafficLight,
                bookings: activeBookings.map((b: any) => ({
                    ...b,
                    care_level_snapshot: b.care_level_snapshot || b.careLevelSnapshot,
                    user: b.user,
                    b2cCustomer: (b.user && b.user.role === 'B2C_CUSTOMER') ? b.user : null
                }))
            };
        });

        return { success: true, data: processedSlots };

    } catch (error: any) {
        console.error("Error fetching calendar data:", error?.message, error?.code, error?.details);
        return { success: false, error: error.message };
    }
}

export async function cancelBooking(bookingId: string) {
    try {
        // Fetch Booking with User (Profile)
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: true,
                timeslot: true
            }
        });

        if (!booking) throw new Error("Buchung nicht gefunden.");

        // Update status
        await db.booking.update({
            where: { id: bookingId },
            data: { status: "CANCELLED" }
        });

        // CREDIT REFUND LOGIC (Copy of User Logic)
        const profile = booking.user;
        if (profile && profile.role === "B2C_CUSTOMER") {
            const slotDate = new Date(booking.timeslot.date); // Not really used if we use startTime
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
                    console.log(`Refunded credit to ${profile.email} (Admin Cancel > 24h)`);
                } else {
                    console.log(`Credit forfeited for ${profile.email} (Admin Cancel <= 24h)`);
                }
            }
        }

        // EMAIL LOGIC
        const recipient = booking.user;
        const timeslot = booking.timeslot;

        if (recipient && recipient.email && timeslot) {
            try {
                if (recipient.emailNotifications !== false) {
                    const { sendEmail, EMAIL_SENDER_SUPPORT } = await import("@/lib/resend");
                    const { EmailTemplates } = await import("@/lib/email-templates");

                    const formattedDate = format(timeslot.date, "dd.MM.yyyy", { locale: de });
                    const formattedTime = format(timeslot.startTime, "HH:mm", { locale: de });
                    const dateString = `${formattedDate} um ${formattedTime}`;

                    await sendEmail({
                        to: recipient.email,
                        subject: "Schade – Dein Training wurde storniert",
                        html: EmailTemplates.cancellation(recipient.firstName || "Kunde", dateString),
                        from: EMAIL_SENDER_SUPPORT
                    });
                }
            } catch (e) {
                console.error("Failed to send admin cancellation email:", e);
            }
        }

        revalidatePath("/admin/calendar");
        return { success: true, message: "Buchung erfolgreich storniert." };
    } catch (error: any) {
        console.error("Error cancelling booking:", error);
        return { success: false, message: "Fehler beim Stornieren: " + error.message };
    }
}

export async function moveBooking(bookingId: string, newDateStr: string, newTimeStr: string) {
    try {
        console.log(`Moving Booking ${bookingId} to ${newDateStr} ${newTimeStr}`);

        const targetDate = new Date(newDateStr);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const possibleSlots = await db.timeslot.findMany({
            where: {
                date: {
                    gte: targetDate,
                    lt: nextDay
                }
            },
            include: {
                bookings: true
            }
        });

        // Helper to match time string HH:mm with date object
        const targetSlot = possibleSlots.find(s => {
            const h = s.startTime.getUTCHours().toString().padStart(2, '0');
            const m = s.startTime.getUTCMinutes().toString().padStart(2, '0');
            const time = `${h}:${m}`;
            return time.startsWith(newTimeStr);
        });

        if (!targetSlot) {
            return { success: false, message: "Ziel-Slot existiert nicht (Prisma)." };
        }

        // 2. Check Capacity
        const bookings = targetSlot.bookings || [];
        const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');
        const load = activeBookings.reduce((acc: number, b: any) => acc + (b.care_level_snapshot || 0), 0);
        const capacity = targetSlot.capacity_points || 20;

        if (load >= capacity) {
            return { success: false, message: "Ziel-Slot ist voll." };
        }

        // 3. Update Booking
        await db.booking.update({
            where: { id: bookingId },
            data: { timeslotId: targetSlot.id }
        });

        revalidatePath("/admin/calendar");
        return { success: true, message: "Buchung erfolgreich verschoben." };

    } catch (error: any) {
        console.error("Error moving booking:", error);
        return { success: false, message: "Systemfehler beim Verschieben: " + error.message };
    }
}

export async function createAnalysisBooking(
    formData: FormData
) {
    const timeslotId = (formData.get("timeslotId") as string || "").trim();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    console.log("Create Analysis Booking REQUEST (Prisma):", { timeslotId, name });

    if (!timeslotId) {
        return { success: false, message: "Bitte alle Pflichtfelder ausfüllen." };
    }

    try {
        // Try to assign to the current user (the Admin performing the action)
        const session = await getServerSession(authOptions);
        let adminId = session?.user?.id;

        // Fallback: If no session, look for Global Admin
        if (!adminId) {
            const adminProfile = await db.profile.findFirst({ where: { role: 'GLOBAL_ADMIN' } });
            adminId = adminProfile?.id;
        }

        if (!adminId) {
            return { success: false, message: "Kein Admin-User (oder eingeloggter Nutzer) gefunden für Zuordnung." };
        }

        // 1. Fetch current slot to get time
        console.log("Fetching slot from Prisma:", timeslotId);
        const currentSlot = await db.timeslot.findUnique({ where: { id: timeslotId } });

        if (!currentSlot) {
            console.error("Slot not found for ID:", timeslotId);
            return { success: false, message: `Slot nicht gefunden (ID: ${timeslotId}). Ggf. Datenbank-Inkonsistenz.` };
        }

        // Robust check for past slot
        const slotDate = new Date(currentSlot.date);
        const slotTime = new Date(currentSlot.startTime);
        const realStart = new Date(slotDate);
        realStart.setHours(slotTime.getUTCHours(), slotTime.getUTCMinutes(), 0, 0);

        if (realStart < new Date()) {
            return { success: false, message: "Analysen können nicht in der Vergangenheit gebucht werden." };
        }

        // 2. Find subsequence 5 slots
        const nextSlots = await db.timeslot.findMany({
            where: {
                date: currentSlot.date,
                startTime: {
                    gte: currentSlot.startTime
                }
            },
            orderBy: { startTime: 'asc' },
            take: 6
        });

        const slotIds = nextSlots.map(s => s.id);
        // Fallback if only 1 slot found? No, use what we found.
        if (slotIds.length === 0) slotIds.push(timeslotId);

        // 3. Create Bookings
        for (const [index, slotId] of slotIds.entries()) {
            const isMain = index === 0;

            await db.booking.create({
                data: {
                    id: crypto.randomUUID(), // explicit ID
                    timeslotId: slotId,
                    userId: adminId, // ASSIGN TO ADMIN
                    status: "CONFIRMED",
                    notes: isMain ? "Biomechanische Analyse" : "Analysis Block",
                    guestName: isMain ? name : undefined,
                    guestEmail: isMain ? email : undefined,
                    guestPhone: isMain ? phone : undefined,
                    care_level_snapshot: 0
                }
            });
        }

        revalidatePath("/admin/calendar");
        return { success: true };
    } catch (error: any) {
        console.error("Analysis Booking Error:", error);
        return { success: false, message: "Fehler beim Buchen: " + error.message };
    }
}
