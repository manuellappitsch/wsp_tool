"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { BookingSlotPicker } from "@/components/booking/BookingSlotPicker";
import { BookingSuccess } from "@/components/booking/BookingSuccess";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAvailableSlots, bookSlot } from "@/actions/booking";

// Mock Data


export default function BookingPage() {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for real data
    const [availableSlots, setAvailableSlots] = useState<{ id: string, time: string, available: boolean }[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Fetch slots when date changes
    React.useEffect(() => {
        if (date) {
            setIsLoadingSlots(true);
            getAvailableSlots(date).then((slots) => {
                setAvailableSlots(slots);
                setIsLoadingSlots(false);
            });
        }
    }, [date]);

    const handleBooking = async () => {
        if (!date || !selectedSlot) return; // selectedSlot is now the ID

        setIsSubmitting(true);
        const result = await bookSlot(selectedSlot);
        setIsSubmitting(false);

        if (result.success) {
            setIsSuccess(true);
            toast.success("Termin erfolgreich gebucht!");
        } else {
            toast.error(result.error || "Fehler bei der Buchung.");
        }
    };

    const resetBooking = () => {
        setIsSuccess(false);
        setDate(undefined);
        setSelectedSlot(null);
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-[#163B40]">
                    Training buchen
                </h1>
                <p className="text-muted-foreground">
                    Wählen Sie einen freien Termin für Ihr WSP-Training.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Calendar */}
                <div className="lg:col-span-5 space-y-4">
                    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm rounded-[2rem]">
                        <CardContent className="p-0">
                            <BookingCalendar date={date} setDate={setDate} />
                        </CardContent>
                    </Card>

                    {date && (
                        <div className="bg-[#EAF8F7] text-[#163B40] px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-center animate-in fade-in slide-in-from-top-2">
                            <Clock className="w-4 h-4 mr-2" />
                            {format(date, "EEEE, d. MMMM yyyy", { locale: de })}
                        </div>
                    )}
                </div>

                {/* Right Column: Slots */}
                <div className="lg:col-span-7">
                    {date ? (
                        <Card className="border-none shadow-sm bg-white rounded-[2rem] h-full animate-in fade-in slide-in-from-right-4 duration-500">
                            <CardContent className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg text-[#163B40]">Verfügbare Zeiten</h3>
                                    <span className="text-xs font-medium bg-gray-100 px-2.5 py-1 rounded-full text-gray-500">
                                        {availableSlots.length} Slots
                                    </span>
                                </div>

                                <div className="min-h-[200px]">
                                    {isLoadingSlots ? (
                                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
                                    ) : availableSlots.length > 0 ? (
                                        <BookingSlotPicker
                                            slots={availableSlots.filter(s => s.available).map(s => s.time)}
                                            selectedSlot={availableSlots.find(s => s.id === selectedSlot)?.time || null}
                                            onSelectSlot={(time) => {
                                                const slot = availableSlots.find(s => s.time === time);
                                                if (slot) setSelectedSlot(slot.id);
                                            }}
                                        />
                                    ) : (
                                        <div className="text-center py-10 text-gray-400">Keine Termine für diesen Tag.</div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <Button
                                        className="w-full rounded-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                                        disabled={!selectedSlot || isSubmitting}
                                        onClick={handleBooking}
                                    >
                                        {isSubmitting ? "Wird gebucht..." : "Termin jetzt buchen"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center text-gray-400">
                            <div>
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Wählen Sie zuerst ein Datum aus.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Dialog */}
            <Dialog open={isSuccess} onOpenChange={(open) => !open && resetBooking()}>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-none">
                    <DialogTitle className="sr-only">Buchung Erfolgreich</DialogTitle>
                    <BookingSuccess />
                    <div className="flex justify-center pb-6">
                        <Button variant="outline" onClick={resetBooking} className="rounded-full border-gray-200">
                            Weiteren Termin buchen
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
