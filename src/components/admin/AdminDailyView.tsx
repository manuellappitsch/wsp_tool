"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingDialog } from "./BookingDialog";
import { BookAnalysisDialog } from "./BookAnalysisDialog";
import { CheckCircle, Activity } from "lucide-react";

interface Booking {
    id: string;
    care_level_snapshot?: number;
    status?: string;
    user?: {
        firstName: string;
        lastName: string;
        tenantId?: string;
    };
    b2cCustomer?: {
        firstName: string;
        lastName: string;
        careLevel: number;
    };
}

interface Timeslot {
    id: string;
    date: string | Date;
    startTime: string; // "HH:MM:00"
    endTime: string;
    capacity_points: number;
    bookings: Booking[];
    currentLoad: number;
    type?: "NORMAL" | "ANALYSIS";
}

interface Props {
    slots: Timeslot[];
    currentDate: Date;
}

export function AdminDailyView({ slots, currentDate }: Props) {
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Analysis Dialog State
    const [selectedAnalysisSlot, setSelectedAnalysisSlot] = useState<Timeslot | null>(null);
    const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);

    // Filter slots for the current date AND business hours (08:00+)
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const dailySlots = slots
        .filter(s => {
            const slotDate = new Date(s.date);
            return format(slotDate, "yyyy-MM-dd") === dateStr;
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const getLevelColor = (level: number) => {
        if (level >= 5) return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
        if (level >= 3) return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
    };

    // Debug Log
    React.useEffect(() => {
        if (slots.length > 0) {
            console.log("First slot type:", slots[0].type);
            console.log("All types:", slots.map(s => s.type).filter(t => t));
        }
    }, [slots]);

    const handleSlotClick = (slot: Timeslot) => {
        if (slot.type === "ANALYSIS") {
            setSelectedAnalysisSlot(slot);
            setIsAnalysisDialogOpen(true);
            return;
        }
        setSelectedSlotId(slot.id);
        setIsDialogOpen(true);
    };

    const selectedSlot = slots.find(s => s.id === selectedSlotId);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2"> {/* Reduced gap */}
                {dailySlots.length === 0 ? (
                    <div className="text-center p-12 bg-gray-50 rounded-lg text-gray-500">
                        Keine Slots für diesen Tag konfiguriert.
                    </div>
                ) : (
                    dailySlots.map((slot) => {
                        const timeLabel = slot.startTime.substring(0, 5); // "09:00"

                        return (
                            <div key={slot.id} className="flex gap-2 group"> {/* Reduced gap */}
                                {/* Time Column */}
                                <div className="w-16 pt-2 text-right font-medium text-gray-500 text-sm"> {/* Smaller width */}
                                    {timeLabel}
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 border-l-2 border-gray-100 pl-2 py-1 hover:border-[#163B40] transition-colors relative">
                                    {/* Slot Background / Action Area */}
                                    <div
                                        onClick={() => handleSlotClick(slot)}
                                        className={cn(
                                            "absolute inset-0 cursor-pointer -ml-[2px] border-l-2 border-transparent rounded-r-lg transition-all",
                                            slot.type === "ANALYSIS"
                                                ? "bg-purple-100 hover:bg-purple-200 hover:border-purple-500 border-l-purple-500"
                                                : "hover:bg-gray-50 hover:border-[#163B40]"
                                        )}
                                    />

                                    {/* Analysis Indicator */}
                                    {slot.type === "ANALYSIS" && slot.bookings.length === 0 && (
                                        <div className="absolute right-2 top-2 z-0 opacity-50 pointer-events-none">
                                            <Activity className="h-6 w-6 text-purple-600" />
                                        </div>
                                    )}

                                    {/* Bookings Grid - High Density (up to 8 cols) */}
                                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
                                        {/* Empty State placeholder if no bookings */}
                                        {slot.bookings.length === 0 && (
                                            <div onClick={() => handleSlotClick(slot)} className={cn(
                                                "text-xs p-1.5 cursor-pointer border border-dashed rounded hover:bg-white/50",
                                                slot.type === "ANALYSIS"
                                                    ? "text-purple-700 border-purple-400 font-medium bg-white/50"
                                                    : "text-gray-400 italic"
                                            )}>
                                                {slot.type === "ANALYSIS" ? "Analyse buchen" : "Frei"}
                                            </div>
                                        )}

                                        {slot.bookings.map((booking) => {
                                            const isB2B = !!booking.user;
                                            const name = isB2B
                                                ? `${booking.user?.firstName} ${booking.user?.lastName}`
                                                : `${booking.b2cCustomer?.firstName} ${booking.b2cCustomer?.lastName}`;

                                            // Determine Level
                                            // Fallback logic specific to how data is shaped
                                            const level = booking.care_level_snapshot || booking.b2cCustomer?.careLevel || 0;
                                            const isCheckedIn = booking.status === "COMPLETED";

                                            return (
                                                <div
                                                    key={booking.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Avoid double trigger
                                                        handleSlotClick(slot);
                                                    }}
                                                    className={cn(
                                                        "p-1.5 rounded border shadow-sm cursor-pointer flex flex-col justify-between transition-transform hover:scale-[1.02] relative",
                                                        getLevelColor(level)
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start gap-1">
                                                        <div className="font-semibold text-xs truncate leading-tight mb-1 flex-1">{name}</div>
                                                        {/* Check-in Status Icon */}
                                                        {isCheckedIn ? (
                                                            <CheckCircle className="h-3 w-3 text-green-600 fill-green-100 flex-shrink-0" />
                                                        ) : (
                                                            <CheckCircle className="h-3 w-3 text-black/20 flex-shrink-0" />
                                                        )}
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <Badge variant="secondary" className="text-[9px] px-1 h-4 bg-white/60 border-0 text-black/70">
                                                            {isB2B ? "B2B" : "B2C"}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-[9px] px-1 h-4 bg-white/60 border-0 text-black/70">
                                                            L{level}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Capacity Bar (Bottom of slot row) */}
                                    <div className="mt-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden relative z-10 opacity-50">
                                        <div
                                            className={cn("h-full transition-all duration-300",
                                                slot.currentLoad >= slot.capacity_points ? "bg-gray-300" : "bg-[#163B40]"
                                            )}
                                            style={{
                                                width: slot.capacity_points > 0
                                                    ? `${Math.min((slot.currentLoad / slot.capacity_points) * 100, 100)}%`
                                                    : '0%'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedSlot && (
                <BookingDialog
                    key={selectedSlot.id}
                    timeslotId={selectedSlot.id}
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    currentLoad={selectedSlot.currentLoad}
                    capacity={selectedSlot.capacity_points}
                    existingBookings={selectedSlot.bookings || []}
                />
            )}

            {selectedAnalysisSlot && (
                <BookAnalysisDialog
                    key={selectedAnalysisSlot.id}
                    timeslotId={selectedAnalysisSlot.id}
                    startTime={selectedAnalysisSlot.startTime}
                    isOpen={isAnalysisDialogOpen}
                    onClose={() => setIsAnalysisDialogOpen(false)}
                />
            )}
        </div>
    );
}
