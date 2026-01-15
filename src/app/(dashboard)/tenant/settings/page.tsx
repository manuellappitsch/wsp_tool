
import React from "react";
import { getTenantSettings } from "@/actions/tenant-settings";
import { SettingsForm } from "@/components/tenant/SettingsForm";

export default async function TenantSettingsPage() {
    // Fetch data server-side
    const settings = await getTenantSettings();

    if (!settings) {
        return <div className="p-8">Daten konnten nicht geladen werden.</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-bold text-[#163B40]">Einstellungen</h1>
                <p className="text-muted-foreground">Verwalten Sie hier Firmendaten, Rechnungsanschrift und Kontaktinformationen.</p>
            </div>

            <SettingsForm settings={settings} />
        </div>
    );
}
