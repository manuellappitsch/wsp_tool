"use client";

import React, { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTenant } from "@/actions/tenant";

export function CreateTenantDialog({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [successData, setSuccessData] = useState<{ password: string, email: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        startTransition(async () => {
            console.log("Submitting form...");
            // @ts-ignore
            const result = await createTenant(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Partner erfolgreich erstellt!");
                // @ts-ignore
                if (result.password) {
                    // @ts-ignore
                    setSuccessData({ password: result.password, email });
                } else {
                    setOpen(false);
                }
            }
        });
    };

    const handleClose = () => {
        setSuccessData(null);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose();
            else setOpen(true);
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-[#163B40] hover:bg-[#0e2629]">
                        <Plus className="mr-2 h-4 w-4" />
                        Neuen Partner anlegen
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Neuen B2B Partner anlegen</DialogTitle>
                    <DialogDescription>
                        Erstellen Sie einen neuen Firmenzugang.
                    </DialogDescription>
                </DialogHeader>

                {successData ? (
                    <div className="py-6 space-y-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Plus className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-[#163B40]">Partner erfolgreich erstellt!</h3>
                            <p className="text-sm text-gray-500">
                                Die Zugangsdaten wurden an <strong>{successData.email}</strong> gesendet.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border max-w-sm mx-auto space-y-2 text-left">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Initial-Passwort</p>
                            <div className="flex items-center justify-between bg-white p-2 rounded border">
                                <code className="text-lg font-mono text-[#163B40]">{successData.password}</code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        navigator.clipboard.writeText(successData.password);
                                        toast.success("Kopiert!");
                                    }}
                                >
                                    Kopieren
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button onClick={handleClose} className="bg-[#163B40]">
                                Schließen & Fertig
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        {/* Basis Daten */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-[#163B40] border-b pb-2">Firmendaten</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="companyName">Firmenname *</Label>
                                    <Input id="companyName" name="companyName" placeholder="Z.B. Musterfirma GmbH" required />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="logo">Firmenlogo</Label>
                                    <Input id="logo" name="logo" type="file" accept="image/png, image/jpeg, image/webp" className="cursor-pointer" />
                                    <p className="text-[10px] text-gray-500">Empfohlen: PNG oder SVG, max 2MB.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dailyKontingent">Tgl. Kontingent *</Label>
                                    <Input id="dailyKontingent" name="dailyKontingent" type="number" defaultValue="5" min="1" required />
                                </div>
                            </div>
                        </div>

                        {/* Admin / CEO */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-[#163B40] border-b pb-2">Administrator / CEO</h3>
                            <div className="space-y-2">
                                <Label htmlFor="email">Admin E-Mail *</Label>
                                <Input id="email" name="email" type="email" placeholder="admin@firma.com" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Vorname (CEO)</Label>
                                    <Input id="firstName" name="firstName" placeholder="Max" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nachname (CEO)</Label>
                                    <Input id="lastName" name="lastName" placeholder="Mustermann" />
                                </div>
                            </div>
                        </div>

                        {/* Rechnungsdaten (Optional) */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-[#163B40] border-b pb-2">Rechnungsdaten (Optional)</h3>
                            <div className="space-y-2">
                                <Label htmlFor="billingAddress">Straße & Hausnr.</Label>
                                <Input id="billingAddress" name="billingAddress" placeholder="Musterstraße 1" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2 col-span-1">
                                    <Label htmlFor="billingZip">PLZ</Label>
                                    <Input id="billingZip" name="billingZip" placeholder="12345" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="billingCity">Ort</Label>
                                    <Input id="billingCity" name="billingCity" placeholder="Musterstadt" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billingEmail">Rechnungs E-Mail</Label>
                                <Input id="billingEmail" name="billingEmail" type="email" placeholder="buchhaltung@firma.com" />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                            <Button type="submit" className="bg-[#163B40]" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Partner erstellen"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
