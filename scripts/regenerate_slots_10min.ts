
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { addDays, setHours, setMinutes, startOfDay, addMinutes, format } from "date-fns";

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
    console.error("❌ No DATABASE_URL found.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🔄 Regenerating Timeslots (10-min interval, 07:30-20:00, Cap 1)...");

    const today = new Date();
    const startDate = startOfDay(addDays(today, 1)); // Start from Tomorrow
    const daysToSeed = 90; // Generate for next 3 months

    console.log(`📅 Starting from: ${format(startDate, 'yyyy-MM-dd')}`);

    for (let i = 0; i < daysToSeed; i++) {
        const currentDate = addDays(startDate, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // 1. Delete empty future slots for this day
        const deleteResult = await prisma.timeslot.deleteMany({
            where: {
                date: {
                    gte: startOfDay(currentDate),
                    lt: startOfDay(addDays(currentDate, 1))
                },
                bookedCount: 0 // Only delete empty ones
            }
        });

        if (i === 0) console.log(`   Deleted ${deleteResult.count} empty slots for ${dateStr}`);

        // 2. Generate new slots
        // Start: 07:30
        let pointer = setMinutes(setHours(currentDate, 7), 30);
        // End: 20:00 (Last slot starts at 19:50? Or 20:00? User said "bis um 20:00 Uhr ... Termin gebucht werden kann". 
        // Usually means last bookable slot is 20:00. Let's include 20:00.)
        const endTimeBoundary = setMinutes(setHours(currentDate, 20), 0);

        let createdCount = 0;

        while (pointer <= endTimeBoundary) {
            const slotStart = pointer;
            const slotEnd = addMinutes(slotStart, 10); // Duration 10 mins

            // Check if a slot already exists (e.g. one with bookings that wasn't deleted)
            const existing = await prisma.timeslot.findFirst({
                where: {
                    date: {
                        gte: startOfDay(currentDate),
                        lt: startOfDay(addDays(currentDate, 1))
                    },
                    startTime: slotStart
                }
            });

            if (!existing) {
                await prisma.timeslot.create({
                    data: {
                        date: currentDate,
                        startTime: slotStart,
                        endTime: slotEnd,
                        globalCapacity: 1, // New Capacity
                        capacity_points: 0 // Not strictly used for logic right now, mostly legacy or simplified
                    } as any
                });
                createdCount++;
            }

            // Advance by 10 minutes
            pointer = addMinutes(pointer, 10);
        }

        if (i % 10 === 0) process.stdout.write(".");
    }

    console.log("\n✅ Done! Slots updated.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
