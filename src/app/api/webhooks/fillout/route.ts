import { NextRequest, NextResponse } from "next/server";
import { createTenantCore } from "@/lib/tenant-service";
import { z } from "zod";

// Define the expected schema for the webhook payload
// We will ask the user to map their Fillout questions to these keys in the JSON payload
const FilloutPayloadSchema = z.object({
    companyName: z.string().min(1, "Firmenname fehlt"),
    firstName: z.string().min(1, "Vorname fehlt"),
    lastName: z.string().min(1, "Nachname fehlt"),
    email: z.string().email("Ungültige E-Mail"),

    // Optional fields
    dailyKontingent: z.coerce.number().optional().default(1),
    billingAddress: z.string().optional(),
    billingZip: z.string().optional(),
    billingCity: z.string().optional(),
    billingEmail: z.string().email().optional(),

    // Fillout might send files as a list of objects, we usually just need one URL
    // Or we might just ask for a direct URL string if they use a Hidden Field calculation
    logoUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Security Check
        // We look for a query param 'token' matching our secret env var
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");
        const secret = process.env.FILLOUT_WEBHOOK_SECRET;

        // If a secret is set in env, enforce it. If not, log a warning (or block, strict is better).
        if (secret && token !== secret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await req.json();
        const validation = FilloutPayloadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid payload",
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // 3. Create Tenant
        // logic reused from our core service
        const result = await createTenantCore({
            companyName: data.companyName,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            dailyKontingent: data.dailyKontingent,
            billingAddress: data.billingAddress,
            billingZip: data.billingZip,
            billingCity: data.billingCity,
            billingEmail: data.billingEmail,
            logoUrlRaw: data.logoUrl
        });

        if (result.error) {
            // Already handled logging inside service, but we return 400/500
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // 4. Success
        return NextResponse.json({
            success: true,
            message: "Tenant created successfully",
            tenantEmail: data.email
        }, { status: 200 });

    } catch (error: any) {
        console.error("Fillout Webhook Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error.message
        }, { status: 500 });
    }
}
