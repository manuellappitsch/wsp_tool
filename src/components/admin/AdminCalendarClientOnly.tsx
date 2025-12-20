"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Props as AdminCalendarManagerProps } from "./AdminCalendarManager";

const AdminCalendarManager = dynamic(
    () => import("./AdminCalendarManager").then(mod => mod.AdminCalendarManager),
    {
        ssr: false,
        loading: () => (
            <div className="flex justify-center items-center h-[600px] w-full bg-white rounded-xl shadow-sm border border-gray-200">
                <Loader2 className="h-8 w-8 animate-spin text-[#2CC8C5]" />
            </div>
        )
    }
);

export function AdminCalendarClientOnly(props: AdminCalendarManagerProps) {
    return <AdminCalendarManager {...props} />;
}
