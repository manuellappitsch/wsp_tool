
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL not found in environment variables.");
    process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function debugMonday() {
    console.log("--- DEBUGGING MONDAY (Day 1) ---");

    // 1. Check Opening Hours
    const openingHours = await db.openingHours.findFirst({
        where: { dayOfWeek: 1 }
    });
    console.log("\n1. Opening Hours for Monday:");
    console.log(openingHours);

    // 2. Check Analysis Schedules
    const analysisSchedules = await db.analysisSchedule.findMany({
        where: { dayOfWeek: 1, isActive: true }
    });
    console.log(`\n2. Active Analysis Schedules for Monday (${analysisSchedules.length}):`);
    analysisSchedules.forEach(s => {
        console.log(`- ID: ${s.id}, Start: ${s.startTime.toISOString()}, End: ${s.endTime.toISOString()}`);
    });

    // 3. Check Generated Slots for next Monday
    const today = new Date();
    // Find next Monday
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
    nextMonday.setHours(0, 0, 0, 0);

    const nextMondayEnd = new Date(nextMonday);
    nextMondayEnd.setHours(23, 59, 59, 999);

    console.log(`\nChecking slots for: ${nextMonday.toISOString()}`);

    // Find slots in DB
    const slots = await db.timeslot.findMany({
        where: {
            date: {
                gte: nextMonday.toISOString(),
                lte: nextMondayEnd.toISOString()
            }
        },
        orderBy: { startTime: 'asc' }
    });

    console.log(`\n3. Generated Slots for Next Monday (${nextMonday.toISOString()}):`);
    console.log(`Total Slots: ${slots.length}`);

    const normalSlots = slots.filter(s => s.type === 'NORMAL');
    const analysisSlots = slots.filter(s => s.type === 'ANALYSIS');
    const blockedSlots = slots.filter(s => s.isBlocked);

    console.log(`- NORMAL: ${normalSlots.length}`);
    console.log(`- ANALYSIS: ${analysisSlots.length}`);
    console.log(`- BLOCKED: ${blockedSlots.length}`);

    if (slots.length > 0) {
        console.log("\nSample Slots:");
        // First 3
        slots.slice(0, 3).forEach(s => console.log(`  ${s.startTime.toISOString().split('T')[1].substr(0, 5)} UTC -> ${s.type} (Blocked: ${s.isBlocked})`));
        console.log("  ...");
        // Middle (Analysis time?)
        const midIndex = Math.floor(slots.length / 2);
        slots.slice(midIndex, midIndex + 3).forEach(s => console.log(`  ${s.startTime.toISOString().split('T')[1].substr(0, 5)} UTC -> ${s.type} (Blocked: ${s.isBlocked})`));
        console.log("  ...");
        // Last 3
        slots.slice(-3).forEach(s => console.log(`  ${s.startTime.toISOString().split('T')[1].substr(0, 5)} UTC -> ${s.type} (Blocked: ${s.isBlocked})`));
    } else {
        console.log("NO SLOTS FOUND!");
    }

    // Check for overlaps in schedules
    console.log("\n4. Overlap Check:");
    for (let i = 0; i < analysisSchedules.length; i++) {
        for (let j = i + 1; j < analysisSchedules.length; j++) {
            const s1 = analysisSchedules[i];
            const s2 = analysisSchedules[j];

            // Simple overlap check
            if (s1.startTime < s2.endTime && s1.endTime > s2.startTime) {
                console.log(`WARN: Overlap detected between Schedule ${s1.id} (${s1.startTime.toISOString().split('T')[1]}) and ${s2.id} (${s2.startTime.toISOString().split('T')[1]})`);
            }
        }
    }
}

debugMonday()
    .catch(console.error)
    .finally(() => db.$disconnect());
