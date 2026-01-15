"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CheckInSearchResult {
    id: string; // Booking ID
    name: string;
    time: string; // HH:mm
    status: string; // CONFIRMED, COMPLETED
    userType: "B2B" | "B2C";
    companyName?: string;
    userAvatar?: string;
}

export async function searchCheckInUsers(query: string): Promise<{ success: boolean; results?: CheckInSearchResult[]; error?: string }> {
    try {
        const results = await getTodaysCheckins(query);
        // Map to Interface
        const mapped = results.map(r => ({
            id: r.id,
            name: r.name,
            time: r.time ? r.time.toISOString().substring(11, 16) : "",
            status: r.status,
            userType: (r.role === 'B2C_CUSTOMER' ? "B2C" : "B2B") as "B2C" | "B2B",
            companyName: r.company,
            userAvatar: undefined
        }));
        return { success: true, results: mapped };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getUpcomingCheckIns(): Promise<{ success: boolean; results?: CheckInSearchResult[]; error?: string }> {
    try {
        const results = await getTodaysCheckins();

        const mapped = results.map(r => ({
            id: r.id,
            name: r.name,
            time: r.time ? r.time.toISOString().substring(11, 16) : "",
            status: r.status,
            userType: (r.role === 'B2C_CUSTOMER' ? "B2C" : "B2B") as "B2C" | "B2B",
            companyName: r.company
        }));

        return { success: true, results: mapped };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function performCheckIn(bookingId: string) {
    try {
        await db.booking.update({
            where: { id: bookingId },
            data: { status: "COMPLETED" }
        });
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("CheckIn Error", error);
        return { success: false, error: "Fehler beim Check-In" };
    }
}

// Internal Logic reused
async function getTodaysCheckins(query?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
        timeslot: {
            date: {
                gte: today,
                lt: tomorrow
            }
        },
        status: { not: "CANCELLED" }
    };

    if (query) {
        where.OR = [
            { user: { lastName: { contains: query, mode: "insensitive" } } },
            { user: { firstName: { contains: query, mode: "insensitive" } } },
            { guestName: { contains: query, mode: "insensitive" } }
        ];
    }

    const bookings = await db.booking.findMany({
        where,
        include: {
            user: {
                include: { tenant: true }
            },
            timeslot: true
        },
        orderBy: {
            timeslot: { startTime: "asc" }
        }
    });

    return bookings.map(b => ({
        id: b.id,
        time: b.timeslot.startTime, // Date object
        name: b.guestName || `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim(),
        company: b.user?.tenant?.companyName,
        status: b.status,
        role: b.user?.role,
    }));
}
