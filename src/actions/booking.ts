"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // We need server-side auth
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

export async function getAvailableSlots(date: Date) {
    try {
        // Format date for query (start and end of day)
        // Adjust for timezone if needed, but for now assuming UTC/ISO strings match
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const slots = await db.timeslot.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                isBlocked: false
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        // Map to simple strings "HH:mm" for the UI, but we also need ID for booking
        // The UI currently expects just a list of strings for the picker, 
        // but we should probably change the UI to handle objects if we want to pass IDs.
        // For now, let's return objects.
        return slots.map(slot => ({
            id: slot.id,
            time: format(slot.startTime, "HH:mm"),
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

        // Call the secure RPC we fixed earlier
        // We use a raw query because Prisma doesn't natively support easy RPC calls with return values typed perfectly
        const result = await db.$queryRaw`
            SELECT * FROM book_training_slot(${slotId}, ${session.user.email})
        `;

        // Result is an array like [{ book_training_slot: { success: true, bookingId: ... } }]
        // Postgres JSON return type often needs parsing or access

        const response: any = result;
        const data = response[0]?.book_training_slot; // Depends on driver, usually it's this or flat

        // If using Prisma w/ pg adapter, it might be slightly different. 
        // Let's safe check.

        if (!data) {
            return { error: "Unbekannter Fehler bei der Buchung." };
        }

        if (data.success) {
            revalidatePath("/user/booking");
            revalidatePath("/user/dashboard");
            return { success: true, bookingId: data.bookingId };
        } else {
            return { error: data.error || "Buchung fehlgeschlagen." };
        }

    } catch (error) {
        console.error("Booking Error:", error);
        return { error: "Systemfehler bei der Buchung." };
    }
}
