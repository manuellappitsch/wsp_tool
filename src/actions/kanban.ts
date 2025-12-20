"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type KanbanStatus = "TODO" | "PROGRESS" | "REVIEW" | "DONE";
export type KanbanPriority = "LOW" | "MEDIUM" | "HIGH";

export async function getKanbanTasks() {
    try {
        const tasks = await db.kanbanTask.findMany({
            orderBy: { position: 'asc' }
        });
        return { success: true, data: tasks };
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return { success: false, error: "Failed to fetch tasks" };
    }
}

export async function createKanbanTask(data: {
    title: string;
    description?: string;
    status: KanbanStatus;
    priority: KanbanPriority;
    assignee?: string;
    dueDate?: Date;
}) {
    try {
        // Calculate new position (append to end of list for that status)
        // Or simpler: global position.
        const count = await db.kanbanTask.count({ where: { status: data.status } });

        await db.kanbanTask.create({
            data: {
                ...data,
                position: count
            }
        });

        revalidatePath("/admin/tasks");
        return { success: true };
    } catch (error) {
        console.error("Error creating task:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function updateKanbanTask(id: string, data: Partial<{
    title: string;
    description: string;
    priority: KanbanPriority;
    assignee: string;
    dueDate: Date;
}>) {
    try {
        await db.kanbanTask.update({
            where: { id },
            data
        });
        revalidatePath("/admin/tasks");
        return { success: true };
    } catch (error) {
        console.error("Error updating task:", error);
        return { success: false, error: "Failed to update task" };
    }
}

export async function moveKanbanTask(id: string, newStatus: string, newPosition: number) {
    try {
        // 1. Get current task
        const task = await db.kanbanTask.findUnique({ where: { id } });
        if (!task) throw new Error("Task not found");

        const oldStatus = task.status;
        const oldPosition = task.position;

        // Note: Full positional reordering is complex (linked lists or bulk updates).
        // For simplicity in this iteration: Update the task status.
        // If sorting is critical, we would need to shift other items.
        // Let's implement a simple status update first. Drag & Drop in Frontend will likely just update Status.
        // If position is supplied, we try to honor it, but let's stick to Status change for MVP robustness.

        if (oldStatus !== newStatus) {
            await db.kanbanTask.update({
                where: { id },
                data: { status: newStatus }
            });
        }

        // TODO: Implement sophisticated reordering logic if requested.

        revalidatePath("/admin/tasks");
        return { success: true };
    } catch (error) {
        console.error("Error moving task:", error);
        return { success: false, error: "Failed to move task" };
    }
}

export async function deleteKanbanTask(id: string) {
    try {
        await db.kanbanTask.delete({ where: { id } });
        revalidatePath("/admin/tasks");
        return { success: true };
    } catch (error) {
        console.error("Error deleting task:", error);
        return { success: false, error: "Failed to delete task" };
    }
}
