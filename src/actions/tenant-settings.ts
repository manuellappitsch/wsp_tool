"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTenantSettings() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) return null;

    // Resolve Tenant ID via Profile
    const profile = await db.profile.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
    });

    if (!profile || !profile.tenantId) return null;

    const tenant = await db.tenant.findUnique({
        where: { id: profile.tenantId }
    });

    return tenant;
}

export async function updateTenantSettings(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.id) return { success: false, message: "Nicht authentifiziert" };

        const id = formData.get("id") as string;
        if (!id) return { success: false, message: "Tenant ID fehlt" };

        // Verify Access via Profile
        const profile = await db.profile.findUnique({
            where: { id: session.user.id },
            select: { tenantId: true }
        });

        if (!profile || profile.tenantId !== id) {
            return { success: false, message: "Zugriff verweigert." };
        }

        // Extract Data
        const companyName = formData.get("companyName") as string;
        const billingAddress = formData.get("billingAddress") as string;
        const billingZip = formData.get("billingZip") as string;
        const billingCity = formData.get("billingCity") as string;
        const billingEmail = formData.get("billingEmail") as string;
        const vatId = formData.get("vatId") as string;
        const contactEmail = formData.get("contactEmail") as string;
        const contactPhone = formData.get("contactPhone") as string;

        await db.tenant.update({
            where: { id },
            data: {
                companyName,
                billingAddress,
                billingZip,
                billingCity,
                billingEmail,
                vatId,
                contactEmail,
                contactPhone
            }
        });

        revalidatePath("/tenant/settings");
        return { success: true, message: "Einstellungen gespeichert." };

    } catch (error: any) {
        console.error("Update Settings Error:", error);
        return { success: false, message: "Fehler beim Speichern: " + error.message };
    }
}
