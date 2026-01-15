"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DaySchedule, saveOpeningHours } from "@/actions/schedule";

const DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

interface Props {
    initialData: DaySchedule[];
}

export function OpeningHoursEditor({ initialData }: Props) {
    // Ensure all 7 days exist in state, even if DB is empty
    const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
        const fullWeek = Array.from({ length: 7 }).map((_, i) => {
            const existing = initialData.find(d => d.dayOfWeek === i);
            return existing || {
                dayOfWeek: i,
                startTime: "08:00",
                endTime: "20:00",
                isClosed: i === 0 || i === 6, // Closed on weekends by default
                breaks: []
            };
        });
        return fullWeek.sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek)); // Sort Mon-Sun
    });

    const [isPending, startTransition] = useTransition();

    const updateDay = (dayIndex: number, updates: Partial<DaySchedule>) => {
        setSchedule(prev => prev.map(day =>
            day.dayOfWeek === dayIndex ? { ...day, ...updates } : day
        ));
    };

    const addBreak = (dayIndex: number) => {
        setSchedule(prev => prev.map(day => {
            if (day.dayOfWeek === dayIndex) {
                return {
                    ...day,
                    breaks: [...day.breaks, { startTime: "12:00", endTime: "13:00" }]
                };
            }
            return day;
        }));
    };

    const removeBreak = (dayIndex: number, breakIndex: number) => {
        setSchedule(prev => prev.map(day => {
            if (day.dayOfWeek === dayIndex) {
                return {
                    ...day,
                    breaks: day.breaks.filter((_, i) => i !== breakIndex)
                };
            }
            return day;
        }));
    };

    const updateBreak = (dayIndex: number, breakIndex: number, field: "startTime" | "endTime", value: string) => {
        setSchedule(prev => prev.map(day => {
            if (day.dayOfWeek === dayIndex) {
                const newBreaks = [...day.breaks];
                newBreaks[breakIndex] = { ...newBreaks[breakIndex], [field]: value };
                return { ...day, breaks: newBreaks };
            }
            return day;
        }));
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await saveOpeningHours(schedule);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Öffnungszeiten gespeichert!");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {schedule.map((day) => {
                    const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;

                    return (
                        <div key={day.dayOfWeek} className={`p-4 rounded-xl border ${day.isClosed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={!day.isClosed}
                                        onCheckedChange={(checked) => updateDay(day.dayOfWeek, { isClosed: !checked })}
                                    />
                                    <span className={`font-medium ${isWeekend ? 'text-[#163B40]' : 'text-gray-900'}`}>
                                        {DAYS[day.dayOfWeek]}
                                    </span>
                                    {day.isClosed && <span className="text-xs text-red-500 font-medium ml-2">Geschlossen</span>}
                                </div>
                                {!day.isClosed && (
                                    <Button variant="ghost" size="sm" onClick={() => addBreak(day.dayOfWeek)} className="text-xs text-blue-600 h-7">
                                        + Pause
                                    </Button>
                                )}
                            </div>

                            {!day.isClosed && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            step="600" // 10 minutes
                                            value={day.startTime}
                                            onChange={(e) => updateDay(day.dayOfWeek, { startTime: e.target.value })}
                                            className="w-32 h-8 text-sm"
                                        />
                                        <span className="text-gray-400">-</span>
                                        <Input
                                            type="time"
                                            step="600" // 10 minutes
                                            value={day.endTime}
                                            onChange={(e) => updateDay(day.dayOfWeek, { endTime: e.target.value })}
                                            className="w-32 h-8 text-sm"
                                        />
                                    </div>

                                    {/* Breaks */}
                                    {day.breaks.map((brk, idx) => (
                                        <div key={idx} className="flex items-center gap-2 ml-4 animate-in slide-in-from-left-2">
                                            <span className="text-xs text-gray-400 w-12">Pause:</span>
                                            <Input
                                                type="time"
                                                step="600" // 10 minutes
                                                value={brk.startTime}
                                                onChange={(e) => updateBreak(day.dayOfWeek, idx, "startTime", e.target.value)}
                                                className="w-28 h-7 text-xs bg-gray-50"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <Input
                                                type="time"
                                                step="600" // 10 minutes
                                                value={brk.endTime}
                                                onChange={(e) => updateBreak(day.dayOfWeek, idx, "endTime", e.target.value)}
                                                className="w-28 h-7 text-xs bg-gray-50"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeBreak(day.dayOfWeek, idx)}
                                                className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-transparent"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4 border-t sticky bottom-0 bg-white/80 backdrop-blur-md p-4 -mx-4 -mb-4 rounded-b-xl">
                <Button onClick={handleSave} className="bg-[#163B40] w-full md:w-auto" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Speichern & Übernehmen
                </Button>
            </div>
        </div>
    );
}
