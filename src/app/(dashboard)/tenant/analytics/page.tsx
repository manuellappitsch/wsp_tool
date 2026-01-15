import React from "react";

export default function TenantAnalyticsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-[#1e3a5f]">Analysen & ROI</h1>
            <p className="text-muted-foreground">
                In diesem Bereich werden zukünftig detaillierte Auswertungen zur Gesundheit Ihres Teams angezeigt.
            </p>

            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-gray-50/50">
                <p className="text-gray-400 font-medium">Momentan keine Daten verfügbar.</p>
            </div>
        </div>
    );
}
