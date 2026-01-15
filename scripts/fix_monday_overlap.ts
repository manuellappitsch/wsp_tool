
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL not found.");
    process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function fixOverlap() {
    const idToDelete = "cmkcle45k0002toryjuphpb52"; // 12:00 - 13:00 (Redundant)

    console.log(`Checking schedule: ${idToDelete}...`);
    try {
        const schedule = await db.analysisSchedule.findUnique({ where: { id: idToDelete } });
        if (schedule) {
            await db.analysisSchedule.delete({
                where: { id: idToDelete }
            });
            console.log("Deleted.");
        } else {
            console.log("Schedule already deleted.");
        }

        console.log("Regenerating slots...");
        // Dynamic import to ensure dotenv is loaded first
        const { generateTimeslotsForMonth } = await import("../src/actions/schedule");

        await generateTimeslotsForMonth();
        console.log("Regeneration complete.");

    } catch (error) {
        console.error("Error during fix:", error);
    } finally {
        await db.$disconnect();
    }
}

fixOverlap();
