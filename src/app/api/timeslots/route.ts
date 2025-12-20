import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";

// GET /api/timeslots?date=2023-12-24
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
        return new NextResponse("Date parameter required", { status: 400 });
    }

    const parsedDate = parseISO(dateStr);
    if (!isValid(parsedDate)) {
        return new NextResponse("Invalid date format", { status: 400 });
    }

    try {
        const start = startOfDay(parsedDate);
        const end = endOfDay(parsedDate);

        // Fetch timeslots via API
        // Query: date is within today.
        // Assuming date column is saved as full ISO timestamp in DB (mapped from Prisma datetime).
        // Supabase filtering: gte, lte on string format.

        const { data: timeslots, error } = await supabaseAdmin
            .from('timeslots')
            .select(`
                *,
                bookings (count)
            `)
            .gte('date', start.toISOString())
            .lte('date', end.toISOString())
            .eq('isBlocked', false)
            .order('startTime', { ascending: true });

        if (error) throw error;

        const mappedSlots = timeslots?.map((slot: any) => ({
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            globalCapacity: slot.globalCapacity,
            bookedCount: slot.bookedCount, // Use the real count from DB row
            isFull: slot.bookedCount >= slot.globalCapacity,
            date: slot.date
        })) || [];

        return NextResponse.json(mappedSlots);

    } catch (error) {
        console.error("Timeslots fetch error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
