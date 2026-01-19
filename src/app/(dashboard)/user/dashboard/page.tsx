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
import { ArrowRight, Calendar as CalendarIcon, CheckCircle2, Clock, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getAvailableSlots, bookSlot } from "@/actions/booking";
import { useSession } from "next-auth/react";

export default function UserDashboardPage() {
    const { data: session } = useSession();
    const userFirstName = session?.user?.name?.split(' ')[0] || "Sportler";

    // State
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<{ id: string, time: string, available: boolean }[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Fetch slots when date changes
    React.useEffect(() => {
        if (date) {
            setIsLoadingSlots(true);
            setSelectedSlot(null); // Reset selection
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

    // Success View (Step 2 & 3)
    if (isSuccess) {
        return (
            <div className="max-w-3xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8 md:p-12 text-center space-y-8">
                        {/* Step 2: Confirmation */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-[#163B40]">Buchung bestätigt!</h2>
                            <p className="text-gray-500 text-lg">
                                Dein Termin für <span className="font-semibold text-[#163B40]">{date && format(date, "EEEE, d. MMMM", { locale: de })}</span> ist reserviert.
                            </p>
                        </div>

                        <div className="h-px w-full bg-gray-100" />

                        {/* Step 3: On-Site Info */}
                        <div className="text-left bg-[#EAF8F7] p-6 rounded-2xl border border-[#2CC8C5]/20">
                            <h3 className="flex items-center gap-2 font-bold text-[#163B40] text-lg mb-4">
                                <MapPin className="w-5 h-5 text-[#2CC8C5]" />
                                Schritt 3: Dein Termin vor Ort
                            </h3>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex gap-3">
                                    <span className="font-bold text-[#2CC8C5]">•</span>
                                    <span>Bitte komme <strong>10 Minuten vor Beginn</strong> ins Studio.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-[#2CC8C5]">•</span>
                                    <span>Trainingkleidung und Handtuch werden bereitgestellt.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-[#2CC8C5]">•</span>
                                    <span>Melde dich einfach am Empfang mit deinem Namen.</span>
                                </li>
                            </ul>
                        </div>

                        <Button
                            onClick={resetBooking}
                            className="w-full md:w-auto px-8 rounded-full h-12 text-base font-bold bg-[#163B40] hover:bg-[#163B40]/90 shadow-lg shadow-[#163B40]/20"
                        >
                            Zurück zur Übersicht
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Default View (Booking Flow)
    return (
        <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
            {/* Header / Intro */}
            <div className="space-y-4 text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-[#163B40]">
                    Hey {userFirstName}! 👋
                </h1>
                <p className="text-gray-500 max-w-2xl text-lg">
                    Hier kannst du ganz einfach dein nächstes Training buchen.
                    Folge den Schritten unten.
                </p>

                {/* Process Steps Indicator (Visual Only) */}
                <div className="flex flex-wrap gap-4 md:gap-8 pt-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-[#163B40] font-bold">
                        <div className="w-8 h-8 rounded-full bg-[#163B40] text-white flex items-center justify-center text-sm">1</div>
                        Termin wählen
                    </div>
                    <div className="hidden md:block w-12 h-px bg-gray-200" />
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm">2</div>
                        Bestätigung
                    </div>
                    <div className="hidden md:block w-12 h-px bg-gray-200" />
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm">3</div>
                        Training vor Ort
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Step 1: Calendar */}
                <Card className="lg:col-span-5 border-none shadow-lg shadow-gray-100 bg-white rounded-[2rem] overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <CalendarIcon className="w-5 h-5 text-[#2CC8C5]" />
                            <h2 className="font-bold text-lg text-[#163B40]">Schritt 1: Datum</h2>
                        </div>

                        <div className="flex justify-center">
                            <BookingCalendar date={date} setDate={setDate} />
                        </div>

                        {date && (
                            <div className="mt-6 bg-[#EAF8F7] text-[#163B40] px-4 py-3 rounded-xl text-center text-sm font-bold animate-in fade-in">
                                {format(date, "EEEE, d. MMMM yyyy", { locale: de })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 1.5: Slots & Action */}
                <Card className={`lg:col-span-7 border-none shadow-lg shadow-gray-100 bg-white rounded-[2rem] overflow-hidden transition-all duration-500 ${!date ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                    <CardContent className="p-6 md:p-8 min-h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-[#2CC8C5]" />
                                <h2 className="font-bold text-lg text-[#163B40]">Schritt 2: Uhrzeit</h2>
                            </div>
                            {availableSlots.length > 0 && date && (
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                                    {availableSlots.length} Frei
                                </span>
                            )}
                        </div>

                        {!date ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center p-8">
                                <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
                                <p>Bitte wähle zuerst ein Datum im Kalender links aus.</p>
                            </div>
                        ) : isLoadingSlots ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#2CC8C5]" />
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-center p-8">
                                <p className="text-gray-500">Keine Termine für diesen Tag verfügbar.</p>
                            </div>
                        ) : (
                            <div className="flex-1">
                                <BookingSlotPicker
                                    slots={availableSlots.filter(s => s.available).map(s => s.time)}
                                    selectedSlot={availableSlots.find(s => s.id === selectedSlot)?.time || null}
                                    onSelectSlot={(time) => {
                                        const slot = availableSlots.find(s => s.time === time);
                                        if (slot) setSelectedSlot(slot.id);
                                    }}
                                />
                            </div>
                        )}

                        <div className="pt-8 mt-auto border-t border-gray-50">
                            <Button
                                className="w-full rounded-full h-14 text-lg font-bold shadow-xl shadow-[#2CC8C5]/20 bg-[#163B40] hover:bg-[#1C4A50] disabled:opacity-50 transition-all"
                                disabled={!selectedSlot || isSubmitting || !date}
                                onClick={handleBooking}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Wird gebucht...
                                    </>
                                ) : (
                                    <>
                                        Termin jetzt buchen
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>
                            {selectedSlot && (
                                <p className="text-center text-xs text-gray-400 mt-3">
                                    Mit dem Klick akzeptierst du die Buchung verbindlich.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
