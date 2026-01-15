
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { addDays, startOfDay, format } from "date-fns";

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
    console.log("🔍 Checking for Duplicate Slots...");

    const dateStr = "2026-01-13";
    const date = new Date(dateStr);

    const slots = await prisma.timeslot.findMany({
        where: {
            date: {
                gte: startOfDay(date),
                lt: startOfDay(addDays(date, 1))
            }
        },
        orderBy: { startTime: 'asc' }
    });

    console.log(`Found ${slots.length} slots for ${dateStr}.`);

    const timeMap = new Map<string, number>();

    slots.forEach(slot => {
        const time = format(new Date(slot.startTime), 'HH:mm');
        const count = timeMap.get(time) || 0;
        timeMap.set(time, count + 1);

        if (count > 0) {
            console.log(`⚠️ Duplicate found: ${time} (ID: ${slot.id})`);
        }
    });

    console.log("Summary of counts:");
    Array.from(timeMap.entries()).filter(([_, c]) => c > 1).forEach(([time, count]) => {
        console.log(`${time}: ${count} copies`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
