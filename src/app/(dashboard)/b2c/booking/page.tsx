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
import { Clock, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getAvailableSlots, bookSlot } from "@/actions/booking";
import Link from "next/link";


export default function B2CBookingPage() {
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
            setSelectedSlot(null);
            getAvailableSlots(date).then((slots) => {
                setAvailableSlots(slots);
                setIsLoadingSlots(false);
            });
        }
    }, [date]);

    const handleBooking = async () => {
        if (!date || !selectedSlot) return;

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
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/b2c/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-[#163B40]">
                        Training buchen
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    Wähle einen freien Termin für dein EMS-Training.
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
                                    <h3 className="font-semibold text-lg text-[#163B40]">
                                        Verfügbare Zeiten {format(date, "d.M.", { locale: de })}
                                    </h3>
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
                                        <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-2">
                                            <span>Keine Termine verfügbar.</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <Button
                                        className="w-full rounded-full h-12 text-base font-bold shadow-lg shadow-primary/20 bg-[#163B40] hover:bg-[#163B40]/90 text-white"
                                        disabled={!selectedSlot || isSubmitting}
                                        onClick={handleBooking}
                                    >
                                        {isSubmitting ? "Wird gebucht..." : "Termin jetzt verbindlich buchen"}
                                    </Button>
                                    <p className="text-xs text-gray-400 text-center mt-3">
                                        Das Training wird von deinem Abo oder Guthaben abgezogen.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center text-gray-400 bg-gray-50/50">
                            <div>
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Bitte wähle zuerst ein Datum im Kalender aus.</p>
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
                    <div className="text-center mb-4">
                        <p className="text-lg font-semibold text-[#163B40]">Training gebucht!</p>
                        <p className="text-gray-500 text-sm">Bestätigung wurde per E-Mail gesendet.</p>
                    </div>
                    <div className="flex flex-col gap-3 justify-center pb-6">
                        <Button onClick={resetBooking} className="rounded-full bg-[#163B40] hover:bg-[#163B40]/90 w-full">
                            Weiteren Termin buchen
                        </Button>
                        <Link href="/b2c/dashboard" className="w-full">
                            <Button variant="outline" className="rounded-full border-gray-200 w-full">
                                Zurück zum Dashboard
                            </Button>
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
