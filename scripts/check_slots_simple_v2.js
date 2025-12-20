const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("--- Checking Opening Hours ---");
    const hours = await prisma.openingHours.findMany({
        orderBy: { dayOfWeek: 'asc' }
    });

    hours.forEach(h => {
        console.log(`Day ${h.dayOfWeek}: Open ${h.openTime.toISOString()} - Close ${h.closeTime.toISOString()} (Closed: ${h.isClosed})`);
    });

    console.log("\n--- Checking Timeslots for Tomorrow ---");
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const slots = await prisma.timeslot.findMany({
        where: {
            date: {
                gte: new Date(`${dateStr}T00:00:00.000Z`),
                lt: new Date(`${dateStr}T23:59:59.000Z`),
            }
        },
        orderBy: { startTime: 'asc' }
    });

    console.log(`Slots for ${dateStr} (${slots.length} found):`);
    slots.forEach(s => {
        const timeStr = s.startTime.toISOString().split('T')[1].substring(0, 5);
        console.log(` - ${timeStr} (Raw DB: ${s.startTime.toISOString()})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
