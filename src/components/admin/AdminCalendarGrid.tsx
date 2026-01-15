"use client";

import React, { useState } from "react";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, Zap } from "lucide-react";
import { BookingDialog } from "./BookingDialog";
import { BookAnalysisDialog } from "./BookAnalysisDialog";

interface Props {
    weekStart: Date;
    timeslots: any[];
    bookingsMap: Record<string, any[]>;
}

export function AdminCalendarGrid({ weekStart, timeslots, bookingsMap }: Props) {
    const days = [0, 1, 2, 3, 4, 5, 6].map(offset => addDays(weekStart, offset));

    // Dynamic Hours Calculation
    let minHour = 7;
    let maxHour = 20;

    if (timeslots.length > 0) {
        minHour = 24;
        maxHour = 0;
        timeslots.forEach(t => {
            let h = 0;
            if (typeof t.startTime === 'string') {
                h = parseInt(t.startTime.split(':')[0], 10);
            } else {
                try {
                    h = toZonedTime(new Date(t.startTime), 'Europe/Berlin').getHours();
                } catch (e) { }
            }
            if (h < minHour) minHour = h;
            if (h > maxHour) maxHour = h;
        });

        // Add buffer
        if (maxHour < 20) maxHour = 20;
        if (minHour > 7) minHour = 7;
    }

    const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => i + minHour);

    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [relatedSlots, setRelatedSlots] = useState<any[]>([]); // SIBLINGS
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);

    const handleSlotClick = (slot: any, siblings: any[] = []) => {
        setSelectedSlot(slot);
        setRelatedSlots(siblings);
        if (slot.type === 'ANALYSIS') {
            setIsAnalysisDialogOpen(true);
        } else {
            setIsDialogOpen(true);
        }
    };

    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const currentHour = parseInt(format(toZonedTime(currentTime, 'Europe/Berlin'), 'H'));
    const currentMinute = parseInt(format(toZonedTime(currentTime, 'Europe/Berlin'), 'm'));

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
                {/* Header Row */}
                <div className="grid grid-cols-8 gap-2 mb-4 sticky top-0 bg-[#F8FAFC] z-10 pb-2">
                    <div className="font-bold text-gray-400 pt-8 text-center">Zeit</div>
                    {days.map(day => (
                        <div key={day.toISOString()} className={`text-center p-2 rounded-t-lg border-b-2 ${isSameDay(day, new Date()) ? "bg-white border-[#2CC8C5] shadow-sm" : "border-transparent"}`}>
                            <div className="font-bold text-[#163B40] text-lg">{format(toZonedTime(day, 'Europe/Berlin'), "EEEE", { locale: de })}</div>
                            <div className="text-sm text-gray-400 font-medium">{format(toZonedTime(day, 'Europe/Berlin'), "dd.MM")}</div>
                        </div>
                    ))}
                </div>

                {/* Grid */}
                {hours.map(hour => {
                    const isCurrentHour = hour === currentHour;
                    const topPercent = (currentMinute / 60) * 100;

                    return (
                        <div key={hour} className="grid grid-cols-8 gap-2 mb-2 relative min-h-[100px]">
                            {/* Time Line */}
                            {isCurrentHour && (
                                <div className="absolute left-0 w-full z-20 flex items-center pointer-events-none" style={{ top: `${topPercent}%` }}>
                                    <div className="w-[12.5%] pr-2 flex justify-end">
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                            {format(currentTime, 'HH:mm')}
                                        </span>
                                    </div>
                                    <div className="flex-1 h-[2px] bg-red-400/80 shadow-sm relative">
                                        <div className="absolute -left-1 -top-[3px] w-2 h-2 bg-red-500 rounded-full" />
                                    </div>
                                </div>
                            )}

                            {/* Time Label */}
                            <div className="text-center font-medium text-gray-400 pt-2 text-sm">
                                {hour}:00
                            </div>

                            {/* Days - One Cell per Hour */}
                            {days.map(day => {
                                // Find all slots in this hour
                                const slotsInHour = timeslots.filter(t => {
                                    const dayStr = format(toZonedTime(day, 'Europe/Berlin'), 'yyyy-MM-dd');

                                    // Robust Date Check
                                    let slotDateStr = "";
                                    if (t.date instanceof Date) {
                                        slotDateStr = format(t.date, 'yyyy-MM-dd');
                                    } else if (typeof t.date === 'string') {
                                        slotDateStr = t.date.substring(0, 10);
                                    }

                                    if (slotDateStr !== dayStr) return false;

                                    let h = -1;
                                    if (typeof t.startTime === 'string') {
                                        h = parseInt(t.startTime.split(':')[0], 10);
                                    } else {
                                        try {
                                            const d = new Date(t.startTime);
                                            h = toZonedTime(d, 'Europe/Berlin').getHours();
                                        } catch (e) { }
                                    }
                                    return h === hour;
                                }).sort((a, b) => {
                                    // Sort by minutes
                                    const getMin = (t: any) => {
                                        if (typeof t.startTime === 'string') return parseInt(t.startTime.split(':')[1], 10);
                                        return new Date(t.startTime).getMinutes();
                                    };
                                    return getMin(a) - getMin(b);
                                });

                                // Calculate Stats
                                let totalBookings = 0;
                                let maxCapacity = slotsInHour.length * 1; // Assuming cap 1 per slot

                                const bookedSlots = slotsInHour.filter(slot => {
                                    const bookings = bookingsMap[slot.id] || [];
                                    if (bookings.length > 0) totalBookings += bookings.length;
                                    return bookings.length > 0;
                                });

                                // Special Handling: If any slot in this hour is ANALYSIS type, treat the rendering differently
                                // Analysis slots are typically 10 mins but booked as 60 mins blocks usually?
                                // Actually, our logic generates 10 min slots. 
                                // In Daily View we show 10 mins. Here we show slots in the hour list.
                                // We should style them purple if type=ANALYSIS.

                                return (
                                    <div key={day.toISOString() + hour} className="bg-white border border-gray-100 rounded-xl p-2 relative flex flex-col gap-1 shadow-sm h-full group">
                                        {/* Header: Occupancy */}
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-[10px] font-bold text-gray-400">
                                                {slotsInHour.length > 0 ? (
                                                    <span className={totalBookings > 0 ? "text-[#163B40]" : ""}>{totalBookings} / {slotsInHour.length} Slots</span>
                                                ) : (
                                                    "-"
                                                )}
                                            </div>
                                            {/* Quick Add Button (opens first empty slot?) */}
                                            {slotsInHour.length > 0 && totalBookings < slotsInHour.length && slotsInHour.some(s => {
                                                const [h, m] = s.startTime.split(':').map(Number);
                                                const slotDate = new Date(day);
                                                slotDate.setHours(h, m, 0, 0);
                                                return slotDate > new Date();
                                            }) && (
                                                    <button
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all"
                                                        onClick={() => {
                                                            // Find first empty FUTURE slot
                                                            const firstEmpty = slotsInHour.find(s => {
                                                                const [h, m] = s.startTime.split(':').map(Number);
                                                                const slotDate = new Date(day);
                                                                slotDate.setHours(h, m, 0, 0);
                                                                return (!bookingsMap[s.id] || bookingsMap[s.id].length === 0) && slotDate > new Date();
                                                            });
                                                            if (firstEmpty) handleSlotClick(firstEmpty, slotsInHour);
                                                        }}
                                                    >
                                                        <Plus className="w-3 h-3 text-gray-500" />
                                                    </button>
                                                )}
                                        </div>

                                        {/* List Bookings */}
                                        <div className="flex flex-col gap-1.5 overflow-hidden">
                                            {slotsInHour.map(slot => {
                                                const bookings = bookingsMap[slot.id] || [];
                                                const isAnalysis = slot.type === 'ANALYSIS';
                                                const isBooked = bookings.length > 0;

                                                // If Analysis and NOT booked, we might want to show it distinctly too?
                                                // Or just show booked ones? 
                                                // Current UX: "List Bookings" section usually only showed booked.
                                                // But user wants to see "Booking available".
                                                // In the original code, `bookedSlots.map` was used.
                                                // Let's iterate all slots if meaningful, or maybe just grouped?
                                                // If we list EVERY 10 min slot it will overflow.
                                                // Strategy: Show Booked Slots + "Free Analysis" Blocks? 
                                                // Simplify: Keep listing BOOKED items + maybe a "Analyse verfügbar" badge?
                                                // Actually, if I click "plus", I get the dialog.

                                                if (!isBooked) return null;

                                                // Get Time string
                                                let timeStr = "";
                                                if (typeof slot.startTime === 'string') timeStr = slot.startTime;
                                                else timeStr = format(toZonedTime(new Date(slot.startTime), 'Europe/Berlin'), 'HH:mm');

                                                return bookings.map((b: any) => {
                                                    const name = b.b2cCustomer ? b.b2cCustomer.lastName : (b.user ? b.user.lastName : (b.guestName || "Geist"));
                                                    const baseClasses = isAnalysis
                                                        ? "bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200"
                                                        : "bg-[#EAF8F7] text-[#163B40] border-[#2CC8C5]/20 hover:bg-[#2CC8C5]/10";

                                                    return (
                                                        <button
                                                            key={b.id}
                                                            onClick={(e) => { e.stopPropagation(); handleSlotClick(slot, slotsInHour); }}
                                                            className={`text-[10px] border px-1.5 py-1 rounded w-full text-left truncate flex items-center gap-1 ${baseClasses}`}
                                                        >
                                                            <span className="font-mono opacity-70 text-[9px]">{timeStr}</span>
                                                            <span className="font-medium truncate">{name}</span>
                                                        </button>
                                                    );
                                                });
                                            })}

                                            {/* Special Analysis Indicator if Hour has Analysis Slots but no bookings */}
                                            {slotsInHour.some(s => s.type === 'ANALYSIS') && totalBookings === 0 && (
                                                <button
                                                    onClick={() => {
                                                        const first = slotsInHour.find(s => s.type === 'ANALYSIS');
                                                        if (first) handleSlotClick(first, slotsInHour);
                                                    }}
                                                    className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 border-dashed px-2 py-2 rounded-md w-full text-center hover:bg-purple-100 transition-colors"
                                                >
                                                    Analyse<br />verfügbar
                                                </button>
                                            )}

                                            {totalBookings === 0 && !slotsInHour.some(s => s.type === 'ANALYSIS') && slotsInHour.length > 0 && (
                                                <div className="flex-1 flex items-center justify-center text-gray-300 text-xs italic">
                                                    Leer
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Dialogs */}
            {selectedSlot && (
                <>
                    <BookingDialog
                        key={`booking-${selectedSlot.id}`}
                        timeslotId={selectedSlot.id}
                        isOpen={isDialogOpen}
                        onClose={() => setIsDialogOpen(false)}
                        currentLoad={bookingsMap[selectedSlot.id]?.length || 0}
                        capacity={selectedSlot.capacity_points || 1}
                        existingBookings={bookingsMap[selectedSlot.id] || []}
                        availableSlots={relatedSlots}
                    />

                    <BookAnalysisDialog
                        key={`analysis-${selectedSlot.id}`}
                        isOpen={isAnalysisDialogOpen}
                        onClose={() => setIsAnalysisDialogOpen(false)}
                        timeslotId={selectedSlot.id}
                        startTime={typeof selectedSlot.startTime === 'string' ? selectedSlot.startTime : format(toZonedTime(new Date(selectedSlot.startTime), 'Europe/Berlin'), 'HH:mm')}
                    />
                </>
            )}
        </div>
    );
}
