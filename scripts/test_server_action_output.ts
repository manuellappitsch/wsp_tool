
import { db } from "../src/lib/db";
import { format } from "date-fns";

async function getAvailableSlots(date: Date) {
    try {
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

        return slots.map(slot => ({
            id: slot.id,
            time: format(slot.startTime, "HH:mm"),
            fullDate: slot.startTime.toISOString(),
            dateField: slot.date.toISOString(),
            available: (slot.bookedCount < slot.globalCapacity)
        }));

    } catch (error) {
        console.error("Error fetching slots:", error);
        return [];
    }
}

async function main() {
    console.log("🔍 Testing getAvailableSlots output...");

    // Test for Tomorrow (2026-01-13)
    // Note: Date constructor with string assumes UTC usually, but let's try to match typical client behavior
    // If client sends 2026-01-13T00:00:00 local
    const date = new Date("2026-01-13T12:00:00"); // Midday to be safe from 00:00 shifts for now

    const slots = await getAvailableSlots(date);

    console.log(`Found ${slots.length} slots.`);

    // Check duplicates in output
    const timeMap = new Map<string, number>();
    slots.forEach(s => {
        const count = timeMap.get(s.time) || 0;
        timeMap.set(s.time, count + 1);
        if (count > 0) {
            console.log(`⚠️ Duplicate in output: ${s.time} | IDs: ${s.id} | FullTime: ${s.fullDate} | DateField: ${s.dateField}`);
        }
    });

    if (slots.length === 0) {
        console.log("No slots found. Attempting other dates...");
    }
}

main();
