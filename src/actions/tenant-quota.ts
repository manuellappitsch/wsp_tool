"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getQuotaUsage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) return null;

    // 1. Resolve Profile & Tenant
    const profile = await db.profile.findUnique({
        where: { id: session.user.id },
        select: { tenantId: true }
    });

    if (!profile || !profile.tenantId) return null;

    const tenantId = profile.tenantId;

    // 2. Fetch Limit
    const tenant = await db.tenant.findUnique({
        where: { id: tenantId },
        select: { dailyKontingent: true, companyName: true }
    });

    if (!tenant) return null;

    // 3. Calculate Usage for TODAY
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const usageCount = await db.booking.count({
        where: {
            user: {
                tenantId: tenantId
            },
            timeslot: {
                date: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            status: {
                in: ['CONFIRMED', 'COMPLETED', 'NO_SHOW']
            }
        }
    });

    return {
        limit: tenant.dailyKontingent,
        used: usageCount,
        companyName: tenant.companyName
    };
}

export async function requestQuotaIncrease(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, message: "Nicht authentifiziert" };

        const requestedAmount = formData.get("requestedAmount") as string;
        const message = formData.get("message") as string;

        // Fetch Tenant Info for the message
        const quotaData = await getQuotaUsage();
        if (!quotaData) return { success: false, message: "Tenant nicht gefunden" };

        const title = `Kontingent-Anfrage: ${quotaData.companyName}`;
        const description = `
**Anfrage von:** ${session.user.name} (${session.user.email})
**Firma:** ${quotaData.companyName}
**Aktuelles Limit:** ${quotaData.limit}
**Gewünscht:** ${requestedAmount}

**Nachricht:**
${message}
        `;

        // Create Kanban Task
        await db.kanbanTask.create({
            data: {
                title: title,
                description: description.trim(),
                status: "TODO",
                priority: "MEDIUM",
                assignee: "System"
            }
        });

        return { success: true, message: "Anfrage erfolgreich gesendet! Ein Admin wird sich melden." };

    } catch (error: any) {
        console.error("Quota Request Error:", error);
        return { success: false, message: "Fehler beim Senden: " + error.message };
    }
}
