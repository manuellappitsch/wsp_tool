"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createKanbanTask, updateKanbanTask, KanbanStatus, KanbanPriority } from "@/actions/kanban";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    taskToEdit?: any; // If null -> Create Mode
    defaultStatus?: KanbanStatus;
}

export function TaskDialog({ isOpen, onClose, taskToEdit, defaultStatus = "TODO" }: Props) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<KanbanStatus>(defaultStatus);
    const [priority, setPriority] = useState<KanbanPriority>("MEDIUM");
    const [assignee, setAssignee] = useState("");
    const [dueDate, setDueDate] = useState("");

    // Reset/Load on Open
    useEffect(() => {
        if (isOpen) {
            if (taskToEdit) {
                setTitle(taskToEdit.title);
                setDescription(taskToEdit.description || "");
                setStatus(taskToEdit.status);
                setPriority(taskToEdit.priority);
                setAssignee(taskToEdit.assignee || "");
                // Format Date for Input type="date"
                if (taskToEdit.dueDate) {
                    const d = new Date(taskToEdit.dueDate);
                    setDueDate(d.toISOString().split('T')[0]);
                } else {
                    setDueDate("");
                }
            } else {
                // Create Mode
                setTitle("");
                setDescription("");
                setStatus(defaultStatus);
                setPriority("MEDIUM");
                setAssignee("");
                setDueDate("");
            }
        }
    }, [isOpen, taskToEdit, defaultStatus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        const data = {
            title,
            description,
            status,
            priority,
            assignee,
            dueDate: dueDate ? new Date(dueDate) : undefined
        };

        let res;
        if (taskToEdit) {
            res = await updateKanbanTask(taskToEdit.id, data);
        } else {
            res = await createKanbanTask(data);
        }

        if (res.success) {
            toast.success(taskToEdit ? "Aufgabe aktualisiert" : "Aufgabe erstellt");
            onClose();
        } else {
            toast.error(res.error || "Fehler beim Speichern");
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{taskToEdit ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}</DialogTitle>
                    <DialogDescription>
                        Erstelle oder bearbeite Aufgaben für das Team.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titel <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            placeholder="z.B. Fehlerbericht prüfen"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v: KanbanStatus) => setStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODO">Offen</SelectItem>
                                    <SelectItem value="PROGRESS">In Arbeit</SelectItem>
                                    <SelectItem value="REVIEW">Review</SelectItem>
                                    <SelectItem value="DONE">Erledigt</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Priorität</Label>
                            <Select value={priority} onValueChange={(v: KanbanPriority) => setPriority(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Niedrig</SelectItem>
                                    <SelectItem value="MEDIUM">Mittel</SelectItem>
                                    <SelectItem value="HIGH">Hoch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desc">Beschreibung</Label>
                        <Textarea
                            id="desc"
                            placeholder="Details zur Aufgabe..."
                            className="resize-none min-h-[80px]"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="assignee">Zugewiesen an (Name/Kürzel)</Label>
                            <Input
                                id="assignee"
                                placeholder="z.B. ML"
                                value={assignee}
                                onChange={(e) => setAssignee(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due">Fällig am</Label>
                            <Input
                                id="due"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Abbrechen</Button>
                        <Button type="submit" disabled={loading} className="bg-[#163B40] hover:bg-[#163B40]/90">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Speichern
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
