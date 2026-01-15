
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import { addDays, subDays, startOfWeek } from "date-fns";

dotenv.config();

// We need to bypass the standard 'today = now' logic in the main function.
// Or we can just mock 'today' if we were calling it.
// But since I can't easily change the source code execution context for 'generateTimeslotsForMonth' (it uses new Date() internally),
// I will replicate the logic here but with a forced start date.

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function backfillMonday() {
    console.log("--- BACKFILLING MONDAY JAN 12 ---");

    // Target Day: Jan 12, 2026
    const targetDate = new Date("2026-01-12T00:00:00Z"); // Use UTC Noon to be safe? 
    // Logic uses Face Value: Date.UTC(y,m,d) = Midnight UTC
    const dayDate = new Date(Date.UTC(2026, 0, 12)); // Jan 12

    console.log(`Generating for: ${dayDate.toISOString()}`);

    // 1. Get Rules
    const openingHours = await db.openingHours.findMany({ include: { breaks: true } });
    const analysisSchedules = await db.analysisSchedule.findMany({ where: { isActive: true } });

    const dayOfWeek = 1; // Monday
    const rules = openingHours.find(oh => oh.dayOfWeek === dayOfWeek);
    const dayAnalysis = analysisSchedules.filter(s => s.dayOfWeek === dayOfWeek);

    // Helpers
    const extractTime = (iso: Date): string => {
        const h = iso.getUTCHours().toString().padStart(2, '0');
        const m = iso.getUTCMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    // Limits
    let earliestStartStr = "23:59";
    let latestEndStr = "00:00";

    if (rules && !rules.isClosed) {
        earliestStartStr = extractTime(rules.openTime);
        latestEndStr = extractTime(rules.closeTime);
    }

    for (const sched of dayAnalysis) {
        const start = extractTime(sched.startTime);
        const end = extractTime(sched.endTime);
        if (start < earliestStartStr) earliestStartStr = start;
        if (end > latestEndStr) latestEndStr = end;
    }

    console.log(`Range: ${earliestStartStr} - ${latestEndStr}`);

    // Create Slots
    const [openH, openM] = earliestStartStr.split(':').map(Number);
    const [closeH, closeM] = latestEndStr.split(':').map(Number);

    const dayStartUTC = new Date(Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), openH, openM));
    const dayEndUTC = new Date(Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), closeH, closeM));

    let currentSlot = dayStartUTC;
    const slotsToCreate = [];

    // Clear existing for safety (though count was 0)
    await db.timeslot.deleteMany({
        where: {
            date: dayDate,
            bookings: { none: {} }
        }
    });

    while (currentSlot < dayEndUTC) {
        const slotEnd = new Date(currentSlot.getTime() + 10 * 60000); // +10 mins
        const slotStartStr = extractTime(currentSlot);

        let isAnalysis = false;
        const matchingAnalysis = dayAnalysis.find(sched => {
            const s = extractTime(sched.startTime);
            const e = extractTime(sched.endTime);
            return slotStartStr >= s && slotStartStr < e;
        });
        if (matchingAnalysis) isAnalysis = true;

        let isNormal = false;
        if (rules && !rules.isClosed) {
            const regularOpen = extractTime(rules.openTime);
            const regularClose = extractTime(rules.closeTime);
            const inRegularHours = (slotStartStr >= regularOpen && slotStartStr < regularClose);

            const isBreak = rules.breaks.some(brk => {
                const bs = extractTime(brk.startTime);
                const be = extractTime(brk.endTime);
                return slotStartStr >= bs && slotStartStr < be;
            });
            if (inRegularHours && !isBreak) isNormal = true;
        }

        let slotType = null;
        if (isAnalysis) slotType = "ANALYSIS";
        else if (isNormal) slotType = "NORMAL";

        if (slotType) {
            slotsToCreate.push({
                date: dayDate,
                startTime: currentSlot,
                endTime: slotEnd,
                globalCapacity: slotType === "ANALYSIS" ? 1 : 6,
                type: slotType as any
            });
        }

        currentSlot = slotEnd;
    }

    if (slotsToCreate.length > 0) {
        console.log(`Creating ${slotsToCreate.length} slots...`);
        await db.timeslot.createMany({
            data: slotsToCreate,
            skipDuplicates: true
        });
        console.log("Done.");
    } else {
        console.log("No slots to create.");
    }

    await db.$disconnect();
}

backfillMonday();
