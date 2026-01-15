"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAnalysisBooking } from "@/actions/admin-booking";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    timeslotId: string;
    startTime: string; // HH:mm
}

export function BookAnalysisDialog({ isOpen, onClose, timeslotId, startTime }: Props) {
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const res = await createAnalysisBooking(formData);
            if (res.success) {
                toast.success("Analyse erfolgreich gebucht!");
                onClose();
            } else {
                toast.error(res.message);
            }
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Biomechanische Analyse buchen</DialogTitle>
                    <DialogDescription>
                        Startzeit: {startTime} Uhr. Dauer: 60 Minuten.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="space-y-4 py-4">
                    <input type="hidden" name="timeslotId" value={timeslotId} />

                    <div className="space-y-2">
                        <Label htmlFor="name">Name des Gastes</Label>
                        <Input id="name" name="name" placeholder="Max Mustermann" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-Mail (Optional)</Label>
                        <Input id="email" name="email" type="email" placeholder="max@example.com" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon (Optional)</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="+49 123 45678" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
                        <Button type="submit" disabled={isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Buchen
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
