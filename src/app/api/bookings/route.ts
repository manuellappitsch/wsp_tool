import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BookingService } from "@/lib/booking-service";
import { bookingSchema } from "@/lib/validators";
import { z } from "zod";

// POST /api/bookings - Create a booking
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { timeslotId, notes } = bookingSchema.parse(body);

        const result = await BookingService.createBooking({ userId: session.user.id }, timeslotId, notes);

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
        console.error("Booking API error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
