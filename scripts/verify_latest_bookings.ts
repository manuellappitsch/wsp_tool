import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🔍 Checking last 3 bookings...");

    const bookings = await prisma.booking.findMany({
        take: 3,
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            timeslot: true,
            user: {
                select: { email: true, firstName: true, lastName: true }
            },
            b2cCustomer: {
                select: { email: true, firstName: true, lastName: true, careLevel: true }
            }
        }
    }) as any[];

    if (bookings.length === 0) {
        console.log("❌ No bookings found in database.");
        return;
    }

    console.log(`✅ Found ${bookings.length} recent bookings:`);

    bookings.forEach((b, i) => {
        const who = b.user
            ? `B2B User: ${b.user.firstName} ${b.user.lastName} (${b.user.email})`
            : b.b2cCustomer
                ? `B2C Customer: ${b.b2cCustomer.firstName} ${b.b2cCustomer.lastName} (Level ${b.b2cCustomer.careLevel})`
                : "Unknown User";

        const time = b.timeslot
            ? `${b.timeslot.date.toISOString().split('T')[0]} at ${b.timeslot.startTime.toISOString().split('T')[1].substring(0, 5)}`
            : "No Timeslot Linked";

        console.log(`\n[${i + 1}] ID: ${b.id}`);
        console.log(`    Status: ${b.status}`);
        console.log(`    Created: ${b.createdAt.toISOString()}`);
        console.log(`    Who: ${who}`);
        console.log(`    When: ${time}`);
        console.log(`    Snapshot Level: ${b.care_level_snapshot}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
