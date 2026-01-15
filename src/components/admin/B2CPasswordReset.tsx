"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react"; // Or similar icon
import { resetB2CCustomerPassword } from "@/actions/b2c-customer";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function B2CPasswordReset({ customerId, customerName, email }: { customerId: string, customerName: string, email: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newPassword, setNewPassword] = useState<string | null>(null);

    const handleReset = async () => {
        setIsLoading(true);
        setNewPassword(null);
        try {
            const result = await resetB2CCustomerPassword(customerId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Passwort zurückgesetzt & E-Mail gesendet!");
                setNewPassword(result.password || "Unbekannt");
            }
        } catch (e) {
            toast.error("Ein Fehler ist aufgetreten.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900">
                    <span className="sr-only">Passwort zurücksetzen</span>
                    <LockKeyhole className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Passwort zurücksetzen: {customerName}</DialogTitle>
                    <DialogDescription>
                        Bist du sicher? Dem Kunden wird ein neues zufälliges Passwort per E-Mail ({email}) gesendet.
                    </DialogDescription>
                </DialogHeader>

                {newPassword && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4 text-green-900 font-mono text-center">
                        {newPassword}
                    </div>
                )}

                <DialogFooter>
                    {!newPassword ? (
                        <>
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Abbrechen</Button>
                            <Button onClick={handleReset} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {isLoading ? "Wird zurückgesetzt..." : "Ja, Passwort zurücksetzen"}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setOpen(false)}>Schließen</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
