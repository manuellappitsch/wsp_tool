"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type CheckInSearchResult = {
    id: string; // Booking ID!
    userType: "B2B" | "B2C";
    name: string;
    email: string | null;
    time: string;
    status: string;
    credits?: number;
    userAvatar?: string | null;
    companyName?: string | null;
};

// Helper to get robust Today range in Berlin Time
function getTodayDateRange() {
    // 1. Get current time in Berlin
    const now = new Date();
    const berlinDateStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" }); // YYYY-MM-DD

    // 2. Construct range in UTC (assuming DB dates are stored as UTC Midnight)
    const start = new Date(`${berlinDateStr}T00:00:00.000Z`);
    const end = new Date(`${berlinDateStr}T23:59:59.999Z`);

    return { start, end };
}

// Helper: Format Time from Date or String
function formatPrismaTime(timeVal: Date | string): string {
    if (timeVal instanceof Date) {
        return timeVal.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
    }
    // Fallback for HH:mm:ss strings
    return String(timeVal).substring(0, 5);
}

export async function searchCheckInUsers(query: string): Promise<{ success: boolean, results?: CheckInSearchResult[], error?: string }> {
    if (!query || query.length < 1) return { success: false, results: [] };

    const { start, end } = getTodayDateRange();

    try {
        const bookings = await db.booking.findMany({
            where: {
                timeslot: {
                    date: {
                        gte: start,
                        lte: end
                    }
                },
                OR: [
                    { b2cCustomer: { lastName: { contains: query, mode: "insensitive" } } },
                    { b2cCustomer: { firstName: { contains: query, mode: "insensitive" } } },
                    { user: { lastName: { contains: query, mode: "insensitive" } } },
                    { user: { firstName: { contains: query, mode: "insensitive" } } }
                ]
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

        const results: CheckInSearchResult[] = bookings.map(b => {
            const timeStr = formatPrismaTime(b.timeslot.startTime);

            if (b.user) {
                return {
                    id: b.id,
                    userType: "B2B",
                    name: `${b.user.firstName} ${b.user.lastName}`,
                    email: b.user.email,
                    time: timeStr,
                    status: b.status,
                    companyName: b.user.tenant.companyName,
                };
            } else if (b.b2cCustomer) {
                return {
                    id: b.id,
                    userType: "B2C",
                    name: `${b.b2cCustomer.firstName} ${b.b2cCustomer.lastName}`,
                    email: b.b2cCustomer.email,
                    time: timeStr,
                    status: b.status,
                    credits: b.b2cCustomer.credits
                };
            }
            return null;
        }).filter(Boolean) as CheckInSearchResult[];

        return { success: true, results };

    } catch (error) {
        console.error("Check-in Search Error:", error);
        return { success: false, error: "Datenbankfehler bei der Suche." };
    }
}

export async function getUpcomingCheckIns(): Promise<{ success: boolean, results?: CheckInSearchResult[] }> {
    const { start, end } = getTodayDateRange();

    const now = new Date();
    // Window: -2 Hours to +2 Hours
    const startWindow = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Helper to create 1970-01-01 Dates for Prisma Time Comparison
    const toPrismaTime = (d: Date) => {
        // Create date at 1970-01-01
        // We need to preserve the "Local Time" (Berlin) hour/minute value, 
        // but construct a UTC Date that matches what Prisma expects/stores.

        // Strategy: Get Berlin Hours/Minutes
        const berlinTimeParts = d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hour12: false }).split(':');
        const hours = parseInt(berlinTimeParts[0], 10);
        const minutes = parseInt(berlinTimeParts[1], 10);

        // Construct 1970 Date. 
        // Note: new Date(1970, 0, 1, hours, minutes) creates a Local Date.
        // If server is UTC, this creates 1970-01-01 HH:mm UTC.
        // If DB stores 1970-01-01 HH:mm UTC, this matches.
        const prismaDate = new Date(0);
        prismaDate.setFullYear(1970, 0, 1);
        prismaDate.setHours(hours, minutes, 0, 0);
        return prismaDate;
    };

    const startTimeDate = toPrismaTime(startWindow);
    const endTimeDate = toPrismaTime(endWindow);

    console.log(`Searching Upcoming: Today (Berlin) = ${start.toISOString()}`);
    console.log(`Time Window: ${startTimeDate.toISOString()} (${startWindow.toLocaleTimeString()}) - ${endTimeDate.toISOString()} (${endWindow.toLocaleTimeString()})`);

    try {
        const bookings = await db.booking.findMany({
            where: {
                timeslot: {
                    date: {
                        gte: start,
                        lte: end
                    },
                    startTime: {
                        gte: startTimeDate,
                        lte: endTimeDate
                    }
                },
                status: {
                    not: "COMPLETED",
                    in: ["CONFIRMED"]
                }
            },
            include: {
                user: { include: { tenant: true } },
                b2cCustomer: true,
                timeslot: true
            },
            orderBy: {
                timeslot: { startTime: 'asc' }
            },
            take: 20
        });

        const results: CheckInSearchResult[] = bookings.map(b => {
            const timeStr = formatPrismaTime(b.timeslot.startTime);

            if (b.user) {
                return {
                    id: b.id,
                    userType: "B2B",
                    name: `${b.user.firstName} ${b.user.lastName}`,
                    email: b.user.email,
                    time: timeStr,
                    status: b.status,
                    companyName: b.user.tenant.companyName,
                };
            } else if (b.b2cCustomer) {
                return {
                    id: b.id,
                    userType: "B2C",
                    name: `${b.b2cCustomer.firstName} ${b.b2cCustomer.lastName}`,
                    email: b.b2cCustomer.email,
                    time: timeStr,
                    status: b.status,
                    credits: b.b2cCustomer.credits
                };
            }
            return null;
        }).filter(Boolean) as CheckInSearchResult[];

        return { success: true, results };
    } catch (error) {
        console.error("Upcoming Fetch Error:", error);
        return { success: false, results: [] };
    }
}

export async function performCheckIn(bookingId: string) {
    try {
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { b2cCustomer: true }
        });

        if (!booking) throw new Error("Buchung nicht gefunden.");

        // Update Status
        await db.booking.update({
            where: { id: bookingId },
            data: { status: "COMPLETED" }
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Check-in Error:", error);
        return { success: false, error: "Check-in fehlgeschlagen." };
    }
}
