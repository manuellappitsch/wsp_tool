import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function check() {
    // Check for tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    console.log(`Checking slots for ${dateStr}...`);

    const slots = await prisma.timeslot.findMany({
        where: {
            date: {
                gte: new Date(`${dateStr}T00:00:00.000Z`),
                lt: new Date(`${dateStr}T23:59:59.000Z`),
            }
        },
        orderBy: { startTime: 'asc' }
    });

    console.log(`Found ${slots.length} slots.`);

    // Group by Hour
    const counts: Record<string, number> = {};
    slots.forEach(s => {
        const h = s.startTime.toISOString().split('T')[1].split(':')[0];
        counts[h] = (counts[h] || 0) + 1;
    });

    console.log("Slots per Hour:");
    Object.keys(counts).sort().forEach(h => {
        console.log(`${h}:00 -> ${counts[h]} slots`);
    });
}

check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
