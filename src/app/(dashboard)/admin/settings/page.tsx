import React from "react";
import { SettingsClient } from "@/components/admin/SettingsClient";
import { getOpeningHours } from "@/actions/schedule";
import { getAnalysisSchedules } from "@/actions/analysis-schedule";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCourses } from "@/actions/content";

export default async function AdminSettingsPage() {
    // Fetch data server-side
    const openingHours = await getOpeningHours();
    const analysisSchedules = await getAnalysisSchedules();
    const courses = await getCourses();

    // Fetch orphan videos
    const { data: orphanVideos } = await supabaseAdmin
        .from("contents")
        .select("*")
        .eq("type", "VIDEO")
        .is("courseId", null)
        .order("createdAt", { ascending: false });

    return <SettingsClient openingHours={openingHours} analysisSchedules={analysisSchedules} courses={courses || []} orphanVideos={orphanVideos || []} />;
}
