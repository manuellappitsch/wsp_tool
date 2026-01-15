'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Need to ensure Textarea exists, if not use Input
import { requestQuotaIncrease } from "@/actions/tenant-quota";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";

interface QuotaRequestDialogProps {
    currentLimit: number;
}

export function QuotaRequestDialog({ currentLimit }: QuotaRequestDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const res = await requestQuotaIncrease(formData);

        if (res.success) {
            toast.success("Anfrage erfolgreich gesendet!");
            setOpen(false);
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Kontingent anfragen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Kontingent erhöhen</DialogTitle>
                    <DialogDescription>
                        Senden Sie eine Anfrage an Ihren WSP-Betreuer. Aktuelles Limit: {currentLimit}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="requestedAmount">Gewünschtes neues Tages-Limit</Label>
                        <Input
                            id="requestedAmount"
                            name="requestedAmount"
                            type="number"
                            min={currentLimit + 1}
                            defaultValue={currentLimit + 5}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="message">Nachricht / Begründung</Label>
                        <Textarea
                            id="message"
                            name="message"
                            placeholder="Wir stellen neue Mitarbeiter ein und benötigen mehr Kapazität..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                        <Button type="submit" disabled={loading} className="bg-[#1e3a5f]">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Anfrage senden
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
