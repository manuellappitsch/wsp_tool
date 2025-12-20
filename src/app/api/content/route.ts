import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentSchema } from "@/lib/validators";
import { z } from "zod";

// GET /api/content - List content with progress for current user
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // Note: We might want to allow public access for some content? 
    // For now, let's require login to track progress.
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const content = await db.content.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
                progress: {
                    where: { userId: session.user.id },
                    select: { completed: true, viewedAt: true }
                }
            }
        });

        // Transform response to flatter structure for frontend
        const enrichedContent = content.map(item => ({
            ...item,
            isCompleted: item.progress.length > 0 && item.progress[0].completed,
            viewedAt: item.progress.length > 0 ? item.progress[0].viewedAt : null,
            progress: undefined // Remove array
        }));

        return NextResponse.json(enrichedContent);
    } catch (error) {
        console.error("Content fetch error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST /api/content - Create new content (Global Admin only)
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    /* @ts-ignore - Check for custom role property */
    if (session?.user?.role !== "GLOBAL_ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const data = contentSchema.parse(body);

        const newContent = await db.content.create({
            data: {
                ...data,
            }
        });

        return NextResponse.json(newContent);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 400 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
