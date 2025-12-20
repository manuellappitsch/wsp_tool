"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { addDays } from "date-fns";
import { de } from "date-fns/locale";

interface BookingCalendarProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

export function BookingCalendar({ date, setDate }: BookingCalendarProps) {
    // Mock: Disable weekends
    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    return (
        <div className="flex justify-center w-full">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={de}
                className="rounded-md border-none"
                disabled={(date) => date < new Date() || isWeekend(date)}
                initialFocus
            />
        </div>
    );

}
