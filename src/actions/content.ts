"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

import { createId } from "@paralleldrive/cuid2";

// ... existing code ...

// --- COURSE ACTIONS ---

export async function createCourse(prevState: any, formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const thumbnailUrl = formData.get("thumbnailUrl") as string;

    if (!title) {
        return { success: false, message: "Titel ist erforderlich." };
    }

    try {
        const { error } = await supabaseAdmin.from("courses").insert({
            id: createId(),
            title,
            description,
            thumbnailUrl,
            isActive: true,
            updatedAt: new Date().toISOString()
        });

        if (error) throw error;

        revalidatePath("/admin/settings");
        return { success: true, message: "Kurs erfolgreich erstellt." };
    } catch (e) {
        console.error("Create Course Error:", e);
        return { success: false, message: "Fehler beim Erstellen des Kurses." };
    }
}

export async function deleteCourse(id: string) {
    try {
        const { error } = await supabaseAdmin.from("courses").delete().eq("id", id);
        if (error) throw error;
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (e) {
        console.error("Delete Course Error:", e);
        return { success: false };
    }
}

export async function updateCourseVisibility(id: string, publishedForAdmin: boolean, publishedForUser: boolean) {
    try {
        const { error } = await supabaseAdmin
            .from("courses")
            .update({
                published_for_admin: publishedForAdmin,
                published_for_user: publishedForUser
            })
            .eq("id", id);

        if (error) throw error;
        revalidatePath("/admin/settings");
        revalidatePath("/admin/content");
        return { success: true };
    } catch (e: any) {
        console.error("Update Course Visibility Error:", e);
        return { success: false, message: e.message };
    }
}

export async function getCourses() {
    const { data: courses, error } = await supabaseAdmin
        .from("courses")
        .select(`
            *,
            contents (*)
        `)
        .order("sortOrder", { ascending: true });

    if (error) {
        console.error("Fetch Courses Error:", error);
        return [];
    }

    // Sort contents by sortOrder within each course
    courses.forEach((course: any) => {
        if (course.contents) {
            course.contents.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
        }
    });

    return courses;
}

// --- VIDEO ACTIONS ---

export async function createVideo(prevState: any, formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const url = formData.get("url") as string;
    const thumbnailUrl = formData.get("thumbnailUrl") as string;
    const courseId = formData.get("courseId") as string; // Optional Relation

    if (!title || !url) {
        return { success: false, message: "Titel und URL sind erforderlich." };
    }

    try {
        const { error } = await supabaseAdmin.from("contents").insert({
            id: createId(),
            title,
            description,
            url,
            thumbnailUrl,
            type: "VIDEO",
            courseId: courseId || null,
            isActive: true,
            isPremium: false,
            updatedAt: new Date().toISOString()
        });

        if (error) {
            console.error("Create Video Error:", error);
            return { success: false, message: "Datenbank Fehler." };
        }

        revalidatePath("/admin/settings");
        return { success: true, message: "Video erfolgreich erstellt." };
    } catch (e) {
        console.error("Create Video Exception:", e);
        return { success: false, message: "Server Fehler." };
    }
}
// ... existing code ...

export async function deleteContent(id: string) {
    try {
        const { error } = await supabaseAdmin.from("contents").delete().eq("id", id);
        if (error) throw error;
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (e) {
        console.error("Delete Content Error:", e);
        return { success: false };
    }
}

export async function toggleContentStatus(id: string, isActive: boolean) {
    try {
        const { error } = await supabaseAdmin
            .from("contents")
            .update({ isActive })
            .eq("id", id);

        if (error) throw error;
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (e) {
        console.error("Toggle Status Error:", e);
        return { success: false };
    }
}
