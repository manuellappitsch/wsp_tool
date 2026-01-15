"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, AlertCircle, Loader2, Edit2, Check, X } from "lucide-react";
import { createAnalysisSchedule, deleteAnalysisSchedule, updateAnalysisSchedule } from "@/actions/analysis-schedule";
import { toast } from "sonner";
import { format } from "date-fns";

interface AnalysisSchedule {
    id: string;
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
}

interface Props {
    schedules: AnalysisSchedule[];
}

const DAYS = [
    { value: 1, label: "Montag" },
    { value: 2, label: "Dienstag" },
    { value: 3, label: "Mittwoch" },
    { value: 4, label: "Donnerstag" },
    { value: 5, label: "Freitag" },
    { value: 6, label: "Samstag" },
    { value: 0, label: "Sonntag" },
];

export function AnalysisSettings({ schedules }: Props) {
    const [isPending, startTransition] = useTransition();

    // New Schedule Form State
    const [selectedDay, setSelectedDay] = useState<string>("1");
    const [startTime, setStartTime] = useState("10:00");
    const [endTime, setEndTime] = useState("11:00");

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ startTime: "", endTime: "" });

    const handleStartEdit = (sched: AnalysisSchedule) => {
        setEditingId(sched.id);
        setEditForm({
            startTime: new Date(sched.startTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
            endTime: new Date(sched.endTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({ startTime: "", endTime: "" });
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        startTransition(async () => {
            const result = await updateAnalysisSchedule(editingId, editForm.startTime, editForm.endTime);
            if (result.success) {
                toast.success("Analyse-Zeitfenster aktualisiert.");
                setEditingId(null);
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleAdd = () => {
        startTransition(async () => {
            const result = await createAnalysisSchedule(parseInt(selectedDay), startTime, endTime);
            if (result.success) {
                toast.success("Analyse-Zeitfenster hinzugefügt.");
                const val = result as any;
                if (val.debug && Array.isArray(val.debug) && val.debug.length > 0) {
                    console.log("Server Debug Logs:", val.debug);
                    alert("DEBUG: \n" + val.debug.join("\n"));
                }
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Wirklich löschen?")) return;
        startTransition(async () => {
            console.log("Deleting schedule:", id);
            const result = await deleteAnalysisSchedule(id);
            if (result.success) {
                toast.success("Zeitfenster entfernt.");
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex gap-2 text-purple-800 mb-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <h3 className="font-semibold">Wichtiger Hinweis</h3>
                </div>
                <p className="text-sm text-purple-700">
                    Diese Zeitfenster sind <strong>exklusiv</strong> für Biomechanische Analysen reserviert.
                    Normale Mitglieder können in dieser Zeit keine Slots buchen.
                    Die Erstellung eines Fensters generiert die Slots sofort neu (kann einige Sekunden dauern).
                </p>
            </div>

            {/* List */}
            <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Aktive Fenster</h4>
                {schedules.length === 0 ? (
                    <p className="text-gray-500 italic text-sm">Keine Analyse-Zeiten definiert.</p>
                ) : (
                    <div className="grid gap-3">
                        {schedules.map(sched => {
                            const isEditing = editingId === sched.id;
                            const dayName = DAYS.find(d => d.value === sched.dayOfWeek)?.label || "Unbekannt";

                            // For display
                            const startStr = new Date(sched.startTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
                            const endStr = new Date(sched.endTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

                            return (
                                <div key={sched.id} className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="font-semibold text-[#163B40] w-24">{dayName}</div>

                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    className="w-24 h-8"
                                                    value={editForm.startTime}
                                                    onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                                                />
                                                <span>-</span>
                                                <Input
                                                    type="time"
                                                    className="w-24 h-8"
                                                    value={editForm.endTime}
                                                    onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                                                />
                                            </div>
                                        ) : (
                                            <div className="font-mono text-gray-600">
                                                {startStr} - {endStr} Uhr
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {isEditing ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleSaveEdit}
                                                    disabled={isPending}
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleCancelEdit}
                                                    disabled={isPending}
                                                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStartEdit(sched)}
                                                disabled={isPending}
                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(sched.id)}
                                            disabled={isPending}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Form */}
            <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-4">Neues Fenster hinzufügen</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                        <Label>Wochentag</Label>
                        <Select value={selectedDay} onValueChange={setSelectedDay}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DAYS.map(day => (
                                    <SelectItem key={day.value} value={day.value.toString()}>
                                        {day.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Startzeit</Label>
                        <Input
                            type="time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Endzeit</Label>
                        <Input
                            type="time"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                        />
                    </div>
                    <div>
                        <Button
                            onClick={handleAdd}
                            disabled={isPending}
                            className="w-full bg-[#163B40] hover:bg-[#163B40]/90"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Hinzufügen
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
