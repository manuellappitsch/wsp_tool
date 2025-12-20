"use client";

import React, { useState, useEffect, useActionState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCustomer } from "@/actions/customer";
import { Plus } from "lucide-react";

const initialState = {
    success: false,
    message: ""
};

export function CreateCustomerDialog() {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(createCustomer, initialState);

    useEffect(() => {
        if (state.success) {
            setOpen(false);
            // Optionally toast success
        }
    }, [state.success]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#163B40] hover:bg-[#163B40]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Kunde
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Neuen Privatkunden anlegen</DialogTitle>
                </DialogHeader>

                <form action={formAction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Vorname *</Label>
                            <Input id="firstName" name="firstName" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nachname *</Label>
                            <Input id="lastName" name="lastName" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-Mail *</Label>
                        <Input id="email" name="email" type="email" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" name="phone" type="tel" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">Produkt wählen</Label>
                            <Select name="product" defaultValue="NONE">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">Kein Produkt</SelectItem>
                                    <SelectItem value="BLOCK_10">10er Block</SelectItem>
                                    <SelectItem value="BLOCK_20">20er Block</SelectItem>
                                    <SelectItem value="BLOCK_30">30er Block</SelectItem>
                                    <SelectItem value="ABO_6">6 Monate Abo</SelectItem>
                                    <SelectItem value="ABO_12">12 Monate Abo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="careLevel">Aufwandsklasse</Label>
                            <Select name="careLevel" defaultValue="2">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Level 1 (Leicht)</SelectItem>
                                    <SelectItem value="2">Level 2 (Standard)</SelectItem>
                                    <SelectItem value="3">Level 3 (Mittel)</SelectItem>
                                    <SelectItem value="5">Level 5 (Intensiv)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notizen</Label>
                        <Textarea id="notes" name="notes" />
                    </div>

                    {state.message && (
                        <div className={`text-sm font-medium ${state.success ? 'text-green-600' : 'text-red-500'}`}>
                            {state.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                        <Button type="submit" className="bg-[#163B40] hover:bg-[#163B40]/90">Speichern</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
