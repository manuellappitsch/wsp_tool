
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BookingService } from "@/lib/booking-service";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const adminBookingSchema = z.object({
    timeslotId: z.string().min(1),
    userId: z.string().min(1, "User ID Required"),
    notes: z.string().optional(),
    careLevel: z.number().optional().default(2)
});

// POST /api/admin/bookings - Admin creates a booking
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { timeslotId, userId, notes } = adminBookingSchema.parse(body);

        // Unified Booking Service Call
        const result = await BookingService.createBooking(
            { userId },
            timeslotId,
            notes
        );

        if (!result.success) {
            return new NextResponse(JSON.stringify({ error: result.reason, code: result.code }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return NextResponse.json({ success: true, bookingId: result.bookingId });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 400 });
        }
        console.error("Admin Booking API error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
