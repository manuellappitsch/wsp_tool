
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function checkDate() {
    console.log("--- Checking Slots in DB ---");

    // Jan 12
    const start12 = new Date("2026-01-12T00:00:00Z");
    const end12 = new Date("2026-01-12T23:59:59Z");

    // Jan 19
    const start19 = new Date("2026-01-19T00:00:00Z");
    const end19 = new Date("2026-01-19T23:59:59Z");

    const slots12 = await db.timeslot.count({
        where: {
            date: {
                gte: start12,
                lte: end12
            }
        }
    });

    const slots19 = await db.timeslot.count({
        where: {
            date: {
                gte: start19,
                lte: end19
            }
        }
    });

    console.log(`Slots for Jan 12 (Yesterday): ${slots12}`);
    console.log(`Slots for Jan 19 (Next Week): ${slots19}`);

    // Also check if we have any slots ANY DAY this week
    const slotsThisWeek = await db.timeslot.count({
        where: {
            date: {
                gte: new Date("2026-01-12T00:00:00Z"),
                lte: new Date("2026-01-18T23:59:59Z")
            }
        }
    });
    console.log(`Slots for This Week (Jan 12-18): ${slotsThisWeek}`);

    await db.$disconnect();
}

checkDate();
