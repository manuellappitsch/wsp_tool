"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { addDays, addMinutes, format, getDay, isBefore, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { TimeslotType } from "@prisma/client";

// Types for the UI
export interface DaySchedule {
    dayOfWeek: number; // 0=Sun, 1=Mon...
    startTime: string; // "08:00"
    endTime: string;   // "18:00"
    isClosed: boolean;
    breaks: {
        startTime: string;
        endTime: string;
    }[];
}

const TIME_ZONE = "Europe/Berlin";

export async function saveOpeningHours(schedule: DaySchedule[]) {
    try {
        await db.$transaction(async (tx) => {
            for (const day of schedule) {
                // Upsert Opening Hours
                const start = new Date(`1970-01-01T${day.startTime}:00.000Z`);
                const end = new Date(`1970-01-01T${day.endTime}:00.000Z`);

                const openingHours = await tx.openingHours.upsert({
                    where: { dayOfWeek: day.dayOfWeek },
                    update: {
                        openTime: start,
                        closeTime: end,
                        isClosed: day.isClosed
                    },
                    create: {
                        dayOfWeek: day.dayOfWeek,
                        openTime: start,
                        closeTime: end,
                        isClosed: day.isClosed
                    }
                });

                // Replace Breaks
                await tx.openingBreak.deleteMany({
                    where: { openingHoursId: openingHours.id }
                });

                if (day.breaks.length > 0) {
                    await tx.openingBreak.createMany({
                        data: day.breaks.map(b => ({
                            openingHoursId: openingHours.id,
                            startTime: new Date(`1970-01-01T${b.startTime}:00.000Z`),
                            endTime: new Date(`1970-01-01T${b.endTime}:00.000Z`),
                            name: "Pause"
                        }))
                    });
                }
            }
        });

        // AUTO-GENERATE SLOTS immediately after saving settings
        await generateTimeslotsForMonth();

        revalidatePath("/admin/settings");
        revalidatePath("/admin/calendar");
        return { success: true };
    } catch (error) {
        console.error("Save Schedule Error:", error);
        return { error: "Fehler beim Speichern der Zeiten." };
    }
}

// ... helper to extract HH:mm from ISO string (ignoring T/Z, treating as face value)
function extractTime(iso: Date): string {
    // Safer extraction using UTC methods to ensure face value is preserved
    const h = iso.getUTCHours().toString().padStart(2, '0');
    const m = iso.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

export async function getOpeningHours() {
    const hours = await db.openingHours.findMany({
        include: { breaks: true },
        orderBy: { dayOfWeek: "asc" }
    });

    // Transform to UI format
    return hours.map(h => ({
        dayOfWeek: h.dayOfWeek,
        isClosed: h.isClosed,
        startTime: extractTime(h.openTime),
        endTime: extractTime(h.closeTime),
        breaks: h.breaks.map(b => ({
            startTime: extractTime(b.startTime),
            endTime: extractTime(b.endTime)
        }))
    }));
}

export async function generateTimeslotsForMonth() {
    const debugLogs: string[] = [];
    try {
        // Enforce Face Value UTC Date for 'today'
        const now = new Date();
        // Start from beginning of the current month to ensure past days in current view are present
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

        const daysToGenerate = 60; // Generate next 60 days (covers current month + next month)
        const openingHours = await db.openingHours.findMany({ include: { breaks: true } });

        const getRules = (date: Date) => {
            return openingHours.find(oh => oh.dayOfWeek === getDay(date));
        };

        let createdCount = 0;

        await db.$transaction(async (tx) => {
            // Increase timeout if possible, but optimizing code is better.

            // Use 'any' cast to bypass potential type mismatch if client isn't fully regenerated
            const analysisSchedules = await (tx as any).analysisSchedule.findMany({ where: { isActive: true } });
            debugLogs.push(`Found ${analysisSchedules.length} active analysis schedules.`);

            for (let i = 0; i < daysToGenerate; i++) {
                const dayDate = addDays(today, i);
                const dayOfWeek = getDay(dayDate); // 0=Sun, 1=Mon
                const rules = getRules(dayDate);

                if ((!rules || rules.isClosed) && !analysisSchedules.some((s: any) => s.dayOfWeek === dayOfWeek)) continue;

                // 1. Determine Boundaries (Min Start, Max End)
                let earliestStartStr = "23:59";
                let latestEndStr = "00:00";

                // Check Regular Hours
                if (rules && !rules.isClosed) {
                    earliestStartStr = extractTime(rules.openTime);
                    latestEndStr = extractTime(rules.closeTime);
                }

                // Check Analysis Hours (Expand boundaries)
                const dayAnalysis = analysisSchedules.filter((s: any) => s.dayOfWeek === dayOfWeek);
                for (const sched of dayAnalysis) {
                    const start = extractTime(sched.startTime);
                    const end = extractTime(sched.endTime);
                    if (start < earliestStartStr) earliestStartStr = start;
                    if (end > latestEndStr) latestEndStr = end;
                }

                // If effectively no valid time, skip
                if (earliestStartStr >= latestEndStr) continue;

                // 2. Convert to Concrete UTC Start/End (FACE VALUE)
                const [openH, openM] = earliestStartStr.split(':').map(Number);
                const [closeH, closeM] = latestEndStr.split(':').map(Number);

                const dayStartUTC = new Date(Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), openH, openM));
                const dayEndUTC = new Date(Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), closeH, closeM));

                let currentSlot = dayStartUTC;
                const slotsToCreate = [];

                // Delete existing slots for this day to clean up dirty data
                await tx.timeslot.deleteMany({
                    where: {
                        date: dayDate,
                        bookings: { none: {} } // Only delete slots with no bookings
                    }
                });

                // Loop
                while (isBefore(currentSlot, dayEndUTC)) {
                    const slotEnd = addMinutes(currentSlot, 10); // 10 Minute Intervals
                    const slotStartStr = extractTime(currentSlot);

                    // --- Determine Valid Slot Types ---

                    // 1. Is Analysis? (Always allowed if matches analysis schedule)
                    let isAnalysis = false;
                    const matchingAnalysis = dayAnalysis.find((sched: any) => {
                        const s = extractTime(sched.startTime);
                        const e = extractTime(sched.endTime);
                        return slotStartStr >= s && slotStartStr < e;
                    });
                    if (matchingAnalysis) isAnalysis = true;

                    // 2. Is Normal? (Allowed ONLY if Open, Inside Regular Hours, AND Not Break)
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

                        if (inRegularHours && !isBreak) {
                            isNormal = true;
                        }
                    }

                    // --- Decision ---
                    let slotType: TimeslotType | null = null;

                    if (isAnalysis) {
                        // Analysis takes priority (or it's the only valid thing)
                        slotType = "ANALYSIS" as TimeslotType;
                        if (slotStartStr === "13:00") console.log(`[MATCH] Analysis Override at ${slotStartStr}`);
                    } else if (isNormal) {
                        slotType = "NORMAL" as TimeslotType;
                    }

                    if (slotType) {
                        const payload = {
                            date: dayDate,
                            startTime: currentSlot,
                            endTime: slotEnd,
                            globalCapacity: slotType === "ANALYSIS" ? 1 : 6,
                            type: slotType
                        };

                        slotsToCreate.push(payload);
                    }

                    currentSlot = slotEnd;
                }

                if (slotsToCreate.length > 0) {
                    await tx.timeslot.createMany({
                        data: slotsToCreate,
                        skipDuplicates: true
                    });
                    createdCount += slotsToCreate.length;
                }
            }
        }, {
            maxWait: 10000,
            timeout: 20000
        });

        return { success: true, count: createdCount, debugLogs };

    } catch (error: any) {
        console.error("Generate Slots Error:", error);
        return { error: "Fehler bei der Generierung.", details: error.message, debugLogs };
    }
}
