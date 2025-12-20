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

interface Props {
    weekStart: Date;
    timeslots: any[];
    bookingsMap: Record<string, any[]>;
}

export function AdminCalendarGrid({ weekStart, timeslots, bookingsMap }: Props) {
    const days = [0, 1, 2, 3, 4, 5, 6].map(offset => addDays(weekStart, offset));
    const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00

    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSlotClick = (slot: any) => {
        setSelectedSlot(slot);
        setIsDialogOpen(true);
    };

    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        // Update every minute
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
                    // Calculate percentage position of the red line (approximate for the 2-row grid)
                    // We have gap-2, so perfect % might be slightly off but good enough for visual.
                    const topPercent = (currentMinute / 60) * 100;

                    return (
                        <div key={hour} className="grid grid-cols-8 gap-2 mb-2 relative">
                            {/* Current Time Line Overlay */}
                            {isCurrentHour && (
                                <div
                                    className="absolute left-0 w-full z-20 flex items-center pointer-events-none"
                                    style={{ top: `${topPercent}%` }}
                                >
                                    {/* Time Label on the left in the "Time" column area */}
                                    <div className="w-[12.5%] pr-2 flex justify-end">
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                            {format(currentTime, 'HH:mm')}
                                        </span>
                                    </div>
                                    {/* The Line spanning the rest */}
                                    <div className="flex-1 h-[2px] bg-red-400/80 shadow-sm relative">
                                        <div className="absolute -left-1 -top-[3px] w-2 h-2 bg-red-500 rounded-full" />
                                    </div>
                                </div>
                            )}

                            {/* Time Label */}
                            <div className="text-center font-medium text-gray-400 pt-4 row-span-2">
                                {hour}:00
                            </div>

                            {/* Days - 2 Rows for 30 min slots */}
                            {[0, 30].map(minute => (
                                <React.Fragment key={`${hour}:${minute}`}>
                                    {minute === 30 && <div className="hidden" />} {/* Skip first col for second row/grid alignment if using standard grid logic, but here we invoke grid-cols-8 so correct */}

                                    {days.map(day => {
                                        // Robust Matching Logic for 30 min slots
                                        const slot = timeslots.find((t, index) => {
                                            // 1. Check Date
                                            const slotDate = new Date(t.date);
                                            if (!isSameDay(slotDate, day)) return false;

                                            // 2. Check Time Logic (Fix for String Format "HH:mm")
                                            if (typeof t.startTime === 'string') {
                                                const [hStr, mStr] = t.startTime.split(':');
                                                const h = parseInt(hStr, 10);
                                                const m = parseInt(mStr, 10);
                                                return h === hour && m === minute;
                                            }

                                            // Legacy Fallback (if somehow Date object)
                                            try {
                                                const d = new Date(t.startTime);
                                                const zoned = toZonedTime(d, 'Europe/Berlin');
                                                return zoned.getUTCHours() === hour && zoned.getUTCMinutes() === minute;
                                            } catch (e) { return false; }
                                        });

                                        // If no slot exists in DB/Props for this time:
                                        if (!slot) {
                                            return (
                                                <div key={day.toISOString() + hour + minute} className="h-16 bg-white rounded-xl border border-gray-100 flex items-center justify-center relative">
                                                    {/* Empty State - Clean */}
                                                </div>
                                            );
                                        }

                                        const bookings = bookingsMap[slot.id] || [];
                                        const capacityPoints = slot.capacity_points || 20;
                                        const currentPoints = bookings.reduce((sum: number, b: any) => sum + (b.care_level_snapshot || 0), 0);

                                        // Traffic Light Dot
                                        const usage = currentPoints / capacityPoints;
                                        let dotColor = "bg-green-400";
                                        if (usage > 0.9) dotColor = "bg-red-500";
                                        else if (usage > 0.6) dotColor = "bg-yellow-400";

                                        return (
                                            <button
                                                type="button"
                                                key={slot.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSlotClick(slot);
                                                }}
                                                className={`h-16 w-full text-left bg-white border border-gray-100 rounded-xl p-2 relative flex flex-col justify-start gap-1 shadow-sm hover:shadow-md transition-all cursor-pointer group z-10 ${bookings.length > 0 ? "bg-[#EAF8F7]/10 border-[#2CC8C5]/30" : ""}`}
                                            >
                                                <div className="flex justify-between items-start w-full">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></div>

                                                    {currentPoints > 0 && (
                                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                            Lvl {currentPoints}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Booking Pills */}
                                                <div className="flex flex-col gap-1 overflow-y-auto max-h-[36px] no-scrollbar w-full">
                                                    {bookings.map((b: any) => {
                                                        let pillColor = "bg-gray-100 text-gray-600";
                                                        const level = b.care_level_snapshot || b.b2cCustomer?.careLevel || 0;

                                                        if (level === 2) pillColor = "bg-green-100 text-green-700 font-medium";
                                                        if (level === 3) pillColor = "bg-yellow-100 text-yellow-700 font-medium";
                                                        if (level >= 5) pillColor = "bg-blue-100 text-blue-700 font-medium";

                                                        const name = b.b2cCustomer ? b.b2cCustomer.lastName : (b.user ? b.user.lastName : "Unknown");
                                                        const isCheckedIn = b.status === "COMPLETED";

                                                        return (
                                                            <div key={b.id} className={`text-[10px] px-1 rounded truncate flex items-center gap-1 ${isCheckedIn ? "bg-green-600 text-white font-bold" : pillColor}`}>
                                                                {isCheckedIn && <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />}
                                                                {name}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {currentPoints < capacityPoints && (
                                                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Plus className="h-3 w-3 text-gray-400" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* Dialog */}
            {selectedSlot && (
                <BookingDialog
                    key={selectedSlot.id}
                    timeslotId={selectedSlot.id}
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    currentLoad={bookingsMap[selectedSlot.id]?.reduce((s: number, b: any) => s + (b.care_level_snapshot || 0), 0) || 0}
                    capacity={selectedSlot.capacity_points || 20}
                    existingBookings={bookingsMap[selectedSlot.id] || []}
                />
            )}
        </div>
    );
}
