"use client";

import React, { useState, useActionState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addCustomerProduct } from "@/actions/customer";
import { ShoppingBag } from "lucide-react";

const initialState = {
    success: false,
    message: ""
};

interface Props {
    customerId: string;
    customerName: string;
}

export function AddProductDialog({ customerId, customerName }: Props) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(addCustomerProduct, initialState);

    useEffect(() => {
        if (state.success) {
            setOpen(false);
        }
    }, [state.success]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-[#163B40]">
                    <ShoppingBag className="w-3 h-3" />
                    Produkt
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Produkt hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-gray-500 mb-4">
                    Kunde: <span className="font-semibold text-gray-900">{customerName}</span>
                </div>

                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="customerId" value={customerId} />

                    <div className="space-y-2">
                        <Label htmlFor="product">Produkt wählen</Label>
                        <Select name="product" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Bitte wählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BLOCK_10">10er Block (+10 Credits)</SelectItem>
                                <SelectItem value="BLOCK_20">20er Block (+20 Credits)</SelectItem>
                                <SelectItem value="BLOCK_30">30er Block (+30 Credits)</SelectItem>
                                <SelectItem value="ABO_6">6 Monate Abo (bis +6 Mo)</SelectItem>
                                <SelectItem value="ABO_12">12 Monate Abo (bis +12 Mo)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {state.message && (
                        <div className={`text-sm font-medium ${state.success ? 'text-green-600' : 'text-red-500'}`}>
                            {state.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                        <Button type="submit" className="bg-[#163B40] hover:bg-[#163B40]/90">Hinzufügen</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
