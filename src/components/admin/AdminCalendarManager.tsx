"use client";

import React, { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, subDays } from "date-fns";
import { de } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { AdminCalendarGrid } from "./AdminCalendarGrid";
import { AdminDailyView } from "./AdminDailyView";
import { getAdminCalendarData } from "@/actions/admin-booking";
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List } from "lucide-react";

export interface Props {
    initialStart: Date;
    initialEnd: Date;
    initialData: any[]; // The raw processed slots from server
}

export function AdminCalendarManager({ initialStart, initialEnd, initialData }: Props) {
    const [viewMode, setViewMode] = useState<"week" | "day">("week");

    // Ensure Dates are Dates (Next.js serialization safety)
    // We use the Server-provided start/end as the source of truth for the initial view
    // to prevent Hydration Mismatch and ensure initialData matches the view.
    const start = new Date(initialStart);
    const end = new Date(initialEnd);

    // Initialize currentDate to the start of the fetched week (or today if inside that week? Keep it simple: Start of week)
    const [currentDate, setCurrentDate] = useState(start);
    const [weekStart, setWeekStart] = useState(start);
    const [weekEnd, setWeekEnd] = useState(end);

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);

    // Track if we have already initialized (to skip the first data fetch effect)
    const hasInitialized = React.useRef(false);

    // Sync Week with Date when switching
    useEffect(() => {
        // Skip the very first run because we have initialData
        // But we DO need to update week identifiers if viewMode changes later.
        // Solution: Only skip if it matches initial state, but simpler to just skip first mounting effect if logic allows.

        if (!hasInitialized.current) {
            hasInitialized.current = true;
            return;
        }

        if (viewMode === "week") {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            setWeekStart(start);
            setWeekEnd(end);
            fetchData(start, end);
        } else {
            // Day View
            const dayStart = startOfWeek(currentDate, { weekStartsOn: 1 });
            const dayEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
            fetchData(dayStart, dayEnd);
        }
    }, [viewMode, currentDate]); // Added currentDate dependency for navigation

    const fetchData = async (start: Date, end: Date) => {
        setLoading(true);
        const res = await getAdminCalendarData(start, end);
        if (res.success && res.data) {
            setData(res.data);
        }
        setLoading(false);
    };

    const handlePrevious = () => {
        if (viewMode === "week") {
            const newStart = subWeeks(weekStart, 1);
            const newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
            setWeekStart(newStart);
            setWeekEnd(newEnd);
            fetchData(newStart, newEnd);
        } else {
            const newDate = subDays(currentDate, 1);
            setCurrentDate(newDate);
            // Optimization: If newDate is in current data range, don't fetch?
            // For now, simple: fetch week of new date
            const start = startOfWeek(newDate, { weekStartsOn: 1 });
            const end = endOfWeek(newDate, { weekStartsOn: 1 });
            fetchData(start, end);
        }
    };

    const handleNext = () => {
        if (viewMode === "week") {
            const newStart = addWeeks(weekStart, 1);
            const newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
            setWeekStart(newStart);
            setWeekEnd(newEnd);
            fetchData(newStart, newEnd);
        } else {
            const newDate = addDays(currentDate, 1);
            setCurrentDate(newDate);
            const start = startOfWeek(newDate, { weekStartsOn: 1 });
            const end = endOfWeek(newDate, { weekStartsOn: 1 });
            fetchData(start, end);
        }
    };

    const handleToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setWeekStart(startOfWeek(now, { weekStartsOn: 1 }));
        setWeekEnd(endOfWeek(now, { weekStartsOn: 1 }));
        fetchData(startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }));
    };

    // Transform Data for Grid (it expects specific shape)
    const bookingsMap: Record<string, any[]> = {};
    const timeslots = data.map((s: any) => {
        bookingsMap[s.id] = s.bookings || [];
        return {
            id: s.id,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            capacity_points: s.capacity
        };
    });

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg border shadow-sm gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#163B40]">
                        {viewMode === "week"
                            ? `KW ${format(toZonedTime(weekStart, 'Europe/Berlin'), "w")} • ${format(toZonedTime(weekStart, 'Europe/Berlin'), "dd.MM")} - ${format(toZonedTime(weekEnd, 'Europe/Berlin'), "dd.MM.yyyy")}`
                            : `${format(toZonedTime(currentDate, 'Europe/Berlin'), "EEEE, dd. MMMM yyyy", { locale: de })}`
                        }
                    </h2>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </div>

                <div className="flex items-center gap-2">
                    {/* Navigation */}
                    <div className="flex items-center border rounded-md mr-4">
                        <Button variant="ghost" size="icon" onClick={handlePrevious}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={handleToday} className="px-3 text-sm font-medium">
                            Heute
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* View Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-md">
                        <button
                            onClick={() => setViewMode("week")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === "week" ? "bg-white text-[#163B40] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Woche
                        </button>
                        <button
                            onClick={() => {
                                setCurrentDate(new Date());
                                setViewMode("day");
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === "day" ? "bg-white text-[#163B40] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            <List className="h-4 w-4" />
                            Tag
                        </button>
                    </div>
                </div>
            </div>

            {/* Content View */}
            <div className="min-h-[500px]">
                {viewMode === "week" ? (
                    <AdminCalendarGrid
                        weekStart={weekStart}
                        timeslots={timeslots}
                        bookingsMap={bookingsMap}
                    />
                ) : (
                    <AdminDailyView
                        slots={data} // Pass full data to DailyView
                        currentDate={currentDate}
                    />
                )}
            </div>
        </div>
    );
}
