'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { updateTenantSettings } from "@/actions/tenant-settings";
import { Loader2, Save } from "lucide-react";

interface TenantSettings {
    id: string;
    companyName: string;
    billingAddress: string | null;
    billingZip: string | null;
    billingCity: string | null;
    billingEmail: string | null;
    vatId: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
}

interface SettingsFormProps {
    settings: TenantSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const res = await updateTenantSettings(formData);
            if (res.success) {
                toast.success("Einstellungen gespeichert");
            } else {
                toast.error(res.message);
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <input type="hidden" name="id" value={settings.id} />

            <Card>
                <CardHeader>
                    <CardTitle>Firmendaten</CardTitle>
                    <CardDescription>Allgemeine Informationen zu Ihrem Unternehmen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="companyName">Firmenname</Label>
                        <Input id="companyName" name="companyName" defaultValue={settings.companyName} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="vatId">Umsatzsteuer-ID (UID / VAT)</Label>
                        <Input id="vatId" name="vatId" defaultValue={settings.vatId || ""} placeholder="ATU..." />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rechnungsanschrift</CardTitle>
                    <CardDescription>Diese Daten erscheinen auf Ihren Rechnungen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="billingAddress">Straße & Hausnummer</Label>
                        <Input id="billingAddress" name="billingAddress" defaultValue={settings.billingAddress || ""} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2 col-span-1">
                            <Label htmlFor="billingZip">PLZ</Label>
                            <Input id="billingZip" name="billingZip" defaultValue={settings.billingZip || ""} />
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="billingCity">Stadt</Label>
                            <Input id="billingCity" name="billingCity" defaultValue={settings.billingCity || ""} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="billingEmail">Rechnungs-Email</Label>
                        <Input id="billingEmail" name="billingEmail" type="email" defaultValue={settings.billingEmail || ""} placeholder="invoice@example.com" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Kontakt</CardTitle>
                    <CardDescription>Für Rückfragen und allgemeine Kommunikation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="contactEmail">Kontakt E-Mail</Label>
                        <Input id="contactEmail" name="contactEmail" type="email" defaultValue={settings.contactEmail || ""} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contactPhone">Telefonnummer</Label>
                        <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={settings.contactPhone || ""} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending} className="bg-[#1e3a5f] w-full md:w-auto">
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichert...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> Änderungen speichern
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
