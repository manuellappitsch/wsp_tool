'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createEmployee, updateEmployee } from "@/actions/tenant-user";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
}

interface EmployeeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeeToEdit?: Employee | null;
}

export function EmployeeDialog({ open, onOpenChange, employeeToEdit }: EmployeeDialogProps) {
    const [loading, setLoading] = useState(false);
    const [passwordResult, setPasswordResult] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setPasswordResult(null);

        const formData = new FormData(event.currentTarget);

        // Handle Checkbox for Update
        if (employeeToEdit) {
            // "isActive" checkbox is only sent if checked.
            // But we need to be explicit.
            // The formData.get("isActive") will be "on" or null.
            const isActive = formData.get("isActive") === "on";
            formData.set("isActive", String(isActive));
            formData.append("id", employeeToEdit.id);

            const res = await updateEmployee(formData);
            if (res.success) {
                toast.success("Mitarbeiter aktualisiert");
                onOpenChange(false);
            } else {
                toast.error(res.message);
            }
        } else {
            // Create
            const res = await createEmployee(formData);
            if (res.success) {
                toast.success("Mitarbeiter angelegt!");
                if (res.initialPassword) {
                    setPasswordResult(res.initialPassword);
                    // Do NOT close dialog yet, let user see password
                } else {
                    onOpenChange(false);
                }
            } else {
                toast.error(res.message);
            }
        }
        setLoading(false);
    }

    // Reset password view when dialog closes
    const handleClose = (open: boolean) => {
        if (!open) setPasswordResult(null);
        onOpenChange(open);
    };

    if (passwordResult) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-green-600">Mitarbeiter erfolgreich angelegt!</DialogTitle>
                        <DialogDescription>
                            Bitte teilen Sie dem Mitarbeiter dieses Initial-Passwort mit. Es wird nur einmal angezeigt.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-gray-100 rounded-lg border text-center">
                        <p className="text-sm text-gray-500 mb-2">Initial Passwort:</p>
                        <p className="text-2xl font-mono font-bold tracking-wider select-all">{passwordResult}</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => handleClose(false)}>Schließen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{employeeToEdit ? "Mitarbeiter bearbeiten" : "Neuer Mitarbeiter"}</DialogTitle>
                    <DialogDescription>
                        {employeeToEdit ? "Ändern Sie die Stammdaten des Mitarbeiters." : "Legen Sie einen neuen Mitarbeiter an. Ein Passwort wird generiert."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">Vorname</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                defaultValue={employeeToEdit?.firstName}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Nachname</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                defaultValue={employeeToEdit?.lastName}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">E-Mail Adresse</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={employeeToEdit?.email}
                            required
                        />
                    </div>

                    {employeeToEdit && (
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="isActive"
                                name="isActive"
                                defaultChecked={employeeToEdit.isActive}
                            />
                            <Label htmlFor="isActive" className="font-normal cursor-pointer">
                                Benutzer ist aktiv (Login erlaubt)
                            </Label>
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>Abbrechen</Button>
                        <Button type="submit" disabled={loading} className="bg-[#1e3a5f]">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {employeeToEdit ? "Speichern" : "Anlegen"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
