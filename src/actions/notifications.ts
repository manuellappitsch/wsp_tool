"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createAdminNotification({
    title,
    message,
    type = "INFO"
}: {
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "CANCEL" | "SUCCESS";
}) {
    try {
        await db.adminNotification.create({
            data: {
                title,
                message,
                type
            }
        });
        revalidatePath("/admin");
    } catch (e) {
        console.error("Failed to create admin notification", e);
    }
}

export async function getAdminNotifications() {
    try {
        return await db.adminNotification.findMany({
            orderBy: { createdAt: 'desc' }
        });
    } catch (e) {
        return [];
    }
}

export async function getUnreadNotificationCount() {
    try {
        return await db.adminNotification.count({
            where: { isRead: false }
        });
    } catch (e) {
        return 0;
    }
}

export async function markNotificationAsRead(id: string) {
    try {
        await db.adminNotification.update({
            where: { id },
            data: { isRead: true }
        });
        revalidatePath("/admin/notifications");
        revalidatePath("/admin", "layout"); // Update layout badge
    } catch (e) {
        console.error("Failed to mark notification read", e);
    }
}

export async function deleteNotification(id: string) {
    try {
        await db.adminNotification.delete({
            where: { id }
        });
        revalidatePath("/admin/notifications");
        revalidatePath("/admin", "layout"); // Update layout badge if unread was deleted
    } catch (e) {
        console.error("Failed to delete notification", e);
    }
}

export async function markAllNotificationsAsRead() {
    try {
        await db.adminNotification.updateMany({
            where: { isRead: false },
            data: { isRead: true }
        });
        revalidatePath("/admin/notifications");
        revalidatePath("/admin", "layout");
    } catch (e) {
        console.error("Failed to mark all read", e);
    }
}
