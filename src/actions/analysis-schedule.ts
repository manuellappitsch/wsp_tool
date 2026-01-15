"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateTimeslotsForMonth } from "./schedule";

export async function getAnalysisSchedules() {
    try {
        const schedules = await db.analysisSchedule.findMany({
            orderBy: [
                { dayOfWeek: "asc" },
                { startTime: "asc" }
            ]
        });
        return schedules;
    } catch (error) {
        console.error("Fetch Analysis Schedules Error:", error);
        return [];
    }
}

export async function createAnalysisSchedule(dayOfWeek: number, startTimeStr: string, endTimeStr: string) {
    try {
        // Enforce Face Value: 13:00 input -> 13:00 UTC
        const [startH, startM] = startTimeStr.split(":").map(Number);
        const [endH, endM] = endTimeStr.split(":").map(Number);

        const startDate = new Date(Date.UTC(1970, 0, 1, startH, startM, 0));
        const endDate = new Date(Date.UTC(1970, 0, 1, endH, endM, 0));

        await db.analysisSchedule.create({
            data: {
                dayOfWeek,
                startTime: startDate,
                endTime: endDate,
                isActive: true
            }
        });

        // Trigger regeneration
        const genResult = await generateTimeslotsForMonth();
        const debugLogs = (genResult as any).debugLogs || [];

        revalidatePath("/admin/settings");
        return { success: true, debug: debugLogs };
    } catch (error: any) {
        console.error("Create Analysis Schedule Error:", error);
        return { success: false, message: "Fehler beim Erstellen." };
    }
}

export async function deleteAnalysisSchedule(id: string) {
    try {
        await db.analysisSchedule.delete({ where: { id } });

        // Trigger regeneration
        await generateTimeslotsForMonth();

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Delete Analysis Schedule Error:", error);
        return { success: false, message: "Fehler beim Löschen." };
    }
}

export async function updateAnalysisSchedule(id: string, startTimeStr: string, endTimeStr: string) {
    try {
        // Enforce Face Value: 13:00 input -> 13:00 UTC
        const [startH, startM] = startTimeStr.split(":").map(Number);
        const [endH, endM] = endTimeStr.split(":").map(Number);

        const startDate = new Date(Date.UTC(1970, 0, 1, startH, startM, 0));
        const endDate = new Date(Date.UTC(1970, 0, 1, endH, endM, 0));

        await db.analysisSchedule.update({
            where: { id },
            data: {
                startTime: startDate,
                endTime: endDate
            }
        });

        // Trigger regeneration
        await generateTimeslotsForMonth();

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Update Analysis Schedule Error:", error);
        return { success: false, message: "Fehler beim Aktualisieren." };
    }
}
