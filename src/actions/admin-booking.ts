'use server'

import { BookingService } from "@/lib/booking-service";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createAdminBooking(prevState: any, formData: FormData) {
    const timeslotId = (formData.get("timeslotId") as string || "").trim();
    const type = formData.get("type") as "B2C" | "B2B";
    const careLevel = parseInt(formData.get("careLevel") as string || "2");

    if (!timeslotId) {
        return { success: false, message: "Interner Fehler: Keine Timeslot ID übertragen." };
    }

    // B2C Data
    const b2cCustomerId = formData.get("b2cCustomerId") as string;

    // B2B Data
    const userId = formData.get("userId") as string;

    const duration = parseInt(formData.get("duration") as string || "30");
    const notes = formData.get("notes") as string || "Admin Booking";

    console.log(`Booking Request: ID=${timeslotId}, Duration=${duration}`);

    // If duration is 60, we need to find the next timeslot
    let timeslotIds = [timeslotId];

    if (duration === 60) {
        // Find current slot to get time
        const { data: currentSlot } = await supabaseAdmin.from("timeslots").select("*").eq("id", timeslotId).single();
        if (currentSlot) {
            // Find next slot (30 mins later)
            // Assumption: Next slot starts when this one ends.
            // Robust way: Find slot where startTime == currentSlot.endTime AND date == currentSlot.date
            const { data: nextSlot } = await supabaseAdmin
                .from("timeslots")
                .select("id")
                .eq("date", currentSlot.date)
                .eq("startTime", currentSlot.endTime) // endTime of current is startTime of next
                .single();

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
                    { b2cCustomerId },
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
        const { data: slots, error } = await supabaseAdmin
            .from("timeslots")
            .select(`
                id, date, startTime, endTime, capacity_points,
                bookings (
                    id, status, care_level_snapshot,
                    users ( firstName, lastName, email, tenantId ),
                    b2c_customers ( firstName, lastName, careLevel )
                )
            `)
            .gte("date", start.toISOString())
            .lte("date", end.toISOString());

        if (error) throw error;

        // Helper for consistent Timezone (Europe/Berlin)
        const formatBerlinTime = (dateStr: string) => {
            if (!dateStr) return "00:00";

            // Check if already HH:MM or HH:MM:SS format (e.g. from raw SQL time column)
            if (dateStr.length <= 8 && dateStr.includes(':')) {
                return dateStr.substring(0, 5);
            }

            const d = new Date(dateStr);
            if (isNaN(d.getTime())) {
                // Return original substring if parsing fails
                return dateStr.substring(0, 5);
            }

            return d.toLocaleTimeString('de-DE', {
                timeZone: 'Europe/Berlin',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        };

        // Process slots to calculate load
        const processedSlots = slots.map((slot: any) => {
            const currentLoad = slot.bookings.reduce((acc: number, b: any) => acc + (b.care_level_snapshot || 0), 0);
            const capacity = slot.capacity_points || 20; // Default 20
            const usageRatio = currentLoad / capacity;

            let trafficLight = "green";
            if (usageRatio >= 0.9) trafficLight = "red";
            else if (usageRatio >= 0.6) trafficLight = "yellow";

            return {
                ...slot,
                // FORCE OVERRIDE: Normalize Times to Berlin Time "HH:MM"
                startTime: formatBerlinTime(slot.startTime),
                endTime: formatBerlinTime(slot.endTime),
                currentLoad,
                capacity,
                trafficLight,
                bookings: slot.bookings.map((b: any) => ({
                    ...b,
                    user: b.users,
                    b2cCustomer: b.b2c_customers
                }))
            };
        });

        return { success: true, data: processedSlots };

    } catch (error: any) {
        console.error("Error fetching calendar data:", error);
        return { success: false, error: error.message };
    }
}

export async function cancelBooking(bookingId: string) {
    try {
        const { error } = await supabaseAdmin
            .from("bookings")
            .update({ status: "CANCELLED" })
            .eq("id", bookingId);

        if (error) throw error;

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

        // 1. Find the target timeslot
        // We typically store timeslots by date (ISO partial) and startTime "HH:MM:00"
        // newDateStr should be YYYY-MM-DD
        // startTime should be HH:MM:00

        // Supabase date matching can be tricky with timezones.
        // Assuming timeslot.date is stored as 2025-12-16T00:00:00+00:00 (Midnight UTC)
        // And startTime is "09:00:00"

        // We need to match how we query.
        // If we query just date column with eq, we need exact string.
        // Let's rely on date range or strict match if we know format.

        // Safer approach: Query slots on that day range
        const targetDate = new Date(newDateStr);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const { data: possibleSlots } = await supabaseAdmin
            .from("timeslots")
            .select("id, startTime, capacity_points, bookings(care_level_snapshot)")
            .gte("date", targetDate.toISOString())
            .lt("date", nextDay.toISOString());

        // Find exact match in JS to avoid DB query complex timezone issues
        const targetSlot = possibleSlots?.find(s => s.startTime.startsWith(newTimeStr));

        if (!targetSlot) {
            return { success: false, message: "Ziel-Slot existiert nicht." };
        }

        // 2. Check Capacity
        const load = targetSlot.bookings.reduce((acc: number, b: any) => acc + (b.care_level_snapshot || 0), 0);
        const capacity = targetSlot.capacity_points || 20;

        // We don't know the exact points of THIS booking without fetching it, but for Move we often assume there's space if not full.
        // Let's be strict: > capacity is full.
        if (load >= capacity) {
            return { success: false, message: "Ziel-Slot ist voll." };
        }

        // 3. Update Booking
        const { error } = await supabaseAdmin
            .from("bookings")
            .update({ timeslotId: targetSlot.id })
            .eq("id", bookingId);

        if (error) throw error;

        revalidatePath("/admin/calendar");
        return { success: true, message: "Buchung erfolgreich verschoben." };

    } catch (error: any) {
        console.error("Error moving booking:", error);
        return { success: false, message: "Systemfehler beim Verschieben: " + error.message };
    }
}
