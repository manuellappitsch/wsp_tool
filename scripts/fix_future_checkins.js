
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
    console.log("--- FIXING FUTURE CHECK-INS ---");
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const now = new Date();
        // Berlin "Now" logic for comparison
        // We need to compare specific times today.
        // Simplest: Iterate all COMPLETED today, parse their start time, compare to now.

        const berlinDateStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
        const start = new Date(`${berlinDateStr}T00:00:00.000Z`);
        const end = new Date(`${berlinDateStr}T23:59:59.999Z`);

        const completedToday = await prisma.booking.findMany({
            where: {
                timeslot: {
                    date: { gte: start, lte: end }
                },
                status: "COMPLETED"
            },
            include: { timeslot: true }
        });

        console.log(`Found ${completedToday.length} COMPLETED bookings today.`);

        // Berlin Time Now Parts
        const berlinNowParts = now.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(':');
        // Convert to minutes for easy comparison
        const nowMinutes = parseInt(berlinNowParts[0]) * 60 + parseInt(berlinNowParts[1]);

        for (const booking of completedToday) {
            let bookingMinutes = 0;
            let timeStr = "";

            if (booking.timeslot.startTime instanceof Date) {
                const tParts = booking.timeslot.startTime.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }).split(':');
                bookingMinutes = parseInt(tParts[0]) * 60 + parseInt(tParts[1]);
                timeStr = `${tParts[0]}:${tParts[1]}`;
            } else {
                // assume string HH:mm:ss
                const sParts = String(booking.timeslot.startTime).split(':');
                bookingMinutes = parseInt(sParts[0]) * 60 + parseInt(sParts[1]);
                timeStr = `${sParts[0]}:${sParts[1]}`;
            }

            // If Booking Time is > Now (with buffer? say 5 mins), reset it.
            // Actually, strict future: if booking is at 10:30 and now is 09:40, it CANNOT be completed (unless time travel).
            if (bookingMinutes > nowMinutes) {
                console.log(`Resetting Future Booking ID ${booking.id} at ${timeStr} (Status: COMPLETED -> CONFIRMED)`);
                await prisma.booking.update({
                    where: { id: booking.id },
                    data: { status: "CONFIRMED" }
                });
            }
        }

    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
    console.log("--- FIX COMPLETE ---");
}

main().catch(console.error);
