import { NextRequest, NextResponse } from "next/server";
import { upsertB2CCustomer } from "@/lib/customer-service";
import { z } from "zod";

// Schema for incoming CRM data
const CrmPayloadSchema = z.object({
    email: z.string().email("Ungültige E-Mail"),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),

    // Actions / Products
    // Example: "10er Block" -> addCredits: 10
    addCredits: z.coerce.number().optional().default(0),

    // Example: "Jahresabo" -> setSubscriptionMonths: 12
    setSubscriptionMonths: z.coerce.number().optional(),

    // Explicit Date override
    subscriptionEndDate: z.string().datetime().optional()
});

export async function POST(req: NextRequest) {
    try {
        // 1. Security Check (Reuse the same secret mechanism or create a new one)
        // Let's reuse FILLOUT_WEBHOOK_SECRET or distinct CRM_WEBHOOK_SECRET if preferred.
        // For simplicity, let's look for a 'token' query param using same variable for now or fallback.
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");
        const secret = process.env.CRM_WEBHOOK_SECRET || process.env.FILLOUT_WEBHOOK_SECRET;

        // If a secret is set in env, enforce it.
        if (secret && token !== secret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await req.json();

        // Validation
        const validation = CrmPayloadSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid payload",
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // 3. Logic
        const result = await upsertB2CCustomer({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            addCredits: data.addCredits,
            setSubscriptionMonths: data.setSubscriptionMonths,
            subscriptionEndDate: data.subscriptionEndDate
        });

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // 4. Success
        return NextResponse.json({
            success: true,
            customer: result.customer
        }, { status: 200 });

    } catch (error: any) {
        console.error("CRM Webhook Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error.message
        }, { status: 500 });
    }
}
