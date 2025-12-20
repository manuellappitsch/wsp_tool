import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/content/[id]/complete - Mark content as completed/viewed
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params are promises in Next.js 15+, checking generic usage
) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Await params in case we are on newer Next.js version or it's just good practice
        const id = (await params).id;

        // Use upsert to handle both first view and re-completion
        const progress = await db.userContentProgress.upsert({
            where: {
                userId_contentId: {
                    userId: session.user.id,
                    contentId: id,
                },
            },
            update: {
                completed: true,
                viewedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                contentId: id,
                completed: true,
            },
        });

        return NextResponse.json(progress);
    } catch (error) {
        console.error("Content progress error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
