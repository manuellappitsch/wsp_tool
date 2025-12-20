import React from "react";
import { SettingsClient } from "@/components/admin/SettingsClient";
import { getOpeningHours } from "@/actions/schedule";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCourses } from "@/actions/content";

export default async function AdminSettingsPage() {
    // Fetch data server-side
    const openingHours = await getOpeningHours();
    const courses = await getCourses();

    // Fetch orphan videos (no course)
    const { data: orphanVideos } = await supabaseAdmin
        .from("contents")
        .select("*")
        .eq("type", "VIDEO")
        .is("courseId", null) // Only fetch videos not in courses
        .order("createdAt", { ascending: false });

    return <SettingsClient openingHours={openingHours} courses={courses || []} orphanVideos={orphanVideos || []} />;
}
