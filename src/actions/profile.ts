"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleEmailNotifications(enabled: boolean) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return { error: "Nicht eingeloggt" };
        }

        const userId = session.user.id;

        await db.profile.update({
            where: { id: userId },
            data: { emailNotifications: enabled }
        });

        // Revalidate all potential dashboards
        revalidatePath("/b2c/dashboard");
        revalidatePath("/user/dashboard");
        revalidatePath("/admin");

        return { success: true };
    } catch (error) {
        console.error("Toggle Notifications Error:", error);
        return { error: "Fehler beim Speichern der Einstellungen." };
    }
}

export async function getUserProfile() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    const userId = session.user.id;

    return db.profile.findUnique({
        where: { id: userId },
        select: { emailNotifications: true, firstName: true, lastName: true, email: true }
    });
}
