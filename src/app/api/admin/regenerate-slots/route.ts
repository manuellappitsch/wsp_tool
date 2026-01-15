import { NextResponse } from "next/server";
import { generateTimeslotsForMonth } from "@/actions/schedule";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Fix Booked Counts
        const slots = await db.timeslot.findMany({
            where: {
                date: {
                    gte: new Date()
                }
            },
            include: {
                _count: {
                    select: { bookings: { where: { status: { not: "CANCELLED" } } } }
                }
            }
        });

        let updatedCount = 0;
        for (const slot of slots) {
            const realCount = slot._count.bookings;
            if (slot.bookedCount !== realCount) {
                await db.timeslot.update({
                    where: { id: slot.id },
                    data: { bookedCount: realCount }
                });
                updatedCount++;
            }
        }

        // 2. Regenerate from Settings
        // This will now use the updated logic (start of month)
        const result = await generateTimeslotsForMonth();

        return NextResponse.json({
            fixedCounts: updatedCount,
            regeneration: result
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
