
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
    console.log("--- DIAGNOSTIC START ---");
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is missing in .env");
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const now = new Date();
        const berlinDateStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
        const start = new Date(`${berlinDateStr}T00:00:00.000Z`);
        const end = new Date(`${berlinDateStr}T23:59:59.999Z`);

        console.log(`\n--- ANALYZING BOOKINGS FOR TODAY (${berlinDateStr}) ---`);
        console.log(`Range: ${start.toISOString()} to ${end.toISOString()}`);

        const bookings = await prisma.booking.findMany({
            where: {
                timeslot: {
                    date: { gte: start, lte: end }
                }
            },
            include: {
                user: { include: { tenant: true } },
                b2cCustomer: true,
                timeslot: true
            },
            orderBy: {
                timeslot: { startTime: 'asc' }
            }
        });

        console.log(`\nFound Total Bookings Today: ${bookings.length}`);

        const byStatus = {};

        bookings.forEach(b => {
            const name = b.user ? `${b.user.firstName} ${b.user.lastName} (B2B)` : `${b.b2cCustomer?.firstName} ${b.b2cCustomer?.lastName} (B2C)`;

            let time = "00:00";
            if (b.timeslot.startTime instanceof Date) {
                time = b.timeslot.startTime.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin' });
            } else {
                time = String(b.timeslot.startTime).substring(0, 5);
            }

            if (!byStatus[b.status]) byStatus[b.status] = [];
            byStatus[b.status].push(`[${time}] ${name} (ID: ${b.id})`);
        });

        console.log("\n--- BREAKDOWN BY STATUS ---");
        Object.keys(byStatus).forEach(status => {
            console.log(`\n### ${status} (${byStatus[status].length})`);
            byStatus[status].forEach(line => console.log(" - " + line));
        });

    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
    console.log("\n--- DIAGNOSTIC END ---");
}

main().catch(console.error);
