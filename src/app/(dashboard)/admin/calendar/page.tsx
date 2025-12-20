import React from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfWeek, endOfWeek, addDays, format } from "date-fns";
import { de } from "date-fns/locale";
import { AdminCalendarClientOnly } from "@/components/admin/AdminCalendarClientOnly";

export default async function AdminCalendarPage() {
    // 1. Determine Week Range (Default: Current Week)
    // TODO: Add searchParam for week navigation
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });

    // 2. Fetch Data using Server Action (Centralized Logic)
    const { getAdminCalendarData } = await import("@/actions/admin-booking");
    const res = await getAdminCalendarData(start, end);
    const slots = res.success && res.data ? res.data : [];

    // 3. Transform for Grid - NOT NEEDED HERE ANYMORE (Handled in Manager)
    // We pass raw slots to Manager

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#163B40]">Kalender & Auslastung</h1>
            </div>

            {/* Client Component replacing static grid */}
            <AdminCalendarClientOnly
                initialStart={start}
                initialEnd={end}
                initialData={slots}
            />
        </div>
    );
}
