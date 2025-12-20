"use client";

import React, { useState, useEffect } from "react";
import {
    DndContext,
    pointerWithin,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    MeasuringStrategy,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { TaskDialog } from "./TaskDialog";
import { getKanbanTasks, moveKanbanTask, deleteKanbanTask, KanbanStatus } from "@/actions/kanban";
import { Button } from "@/components/ui/button";
import { Plus, RotateCw } from "lucide-react";
import { toast } from "sonner";

export function KanbanBoard() {
    // Data State
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<any>(null);
    const [defaultStatus, setDefaultStatus] = useState<KanbanStatus>("TODO");

    // Drag State
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Drag only starts after 5px movement
            },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Initial Fetch
    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        const res = await getKanbanTasks();
        if (res.success && res.data) {
            setTasks(res.data);
        }
        setLoading(false);
    };

    // Columns Definition
    const columns: { id: KanbanStatus, title: string, color: string }[] = [
        { id: "TODO", title: "Zu erledigen (Offen)", color: "bg-gray-100" },
        { id: "PROGRESS", title: "In Arbeit", color: "bg-blue-50" },
        { id: "REVIEW", title: "In Prüfung / Review", color: "bg-purple-50" },
        { id: "DONE", title: "Erledigt", color: "bg-green-50" }
    ];

    // Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id); // Can be a column ID or a card ID

        // Find the task
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // Find new status
        let newStatus = activeTask.status;

        // Is over a column?
        if (columns.some(c => c.id === overId)) {
            newStatus = overId;
        } else {
            // Is over another task?
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (activeTask.status !== newStatus) {
            // Optimistic Update
            setTasks(prev => prev.map(t =>
                t.id === activeId ? { ...t, status: newStatus } : t
            ));

            // Server Sync
            await moveKanbanTask(activeId, newStatus, 0); // Position 0 for now
        }
    };

    const handleAddTask = (status: KanbanStatus = "TODO") => {
        setTaskToEdit(null);
        setDefaultStatus(status);
        setIsDialogOpen(true);
    };

    const handleEditTask = (task: any) => {
        setTaskToEdit(task);
        setIsDialogOpen(true);
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm("Sicher löschen?")) return;

        // Optimistic
        setTasks(prev => prev.filter(t => t.id !== id));

        const res = await deleteKanbanTask(id);
        if (!res.success) {
            toast.error("Löschen fehlgeschlagen");
            loadTasks(); // Revert
        } else {
            toast.success("Gelöscht");
        }
    };

    // Filter tasks by column
    const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <Button onClick={() => handleAddTask("TODO")} className="bg-[#163B40] hover:bg-[#163B40]/90">
                        <Plus className="mr-2 h-4 w-4" /> Neue Aufgabe
                    </Button>
                    <Button variant="outline" size="icon" onClick={loadTasks} title="Refresh">
                        <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Board Area */}
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always,
                    },
                }}
            >
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex h-full gap-6 min-w-max">
                        {columns.map(col => (
                            <KanbanColumn
                                key={col.id}
                                id={col.id}
                                title={col.title}
                                colorClass={col.color}
                                tasks={getTasksByStatus(col.id)}
                                onAddTask={handleAddTask}
                                onEditTask={handleEditTask}
                                onDeleteTask={handleDeleteTask}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay adjustScale={false}>
                    {/* Fixed width to match column card width (approx 300px column - padding) */}
                    <div className="cursor-grabbing" style={{ width: "276px" }}>
                        <KanbanCard
                            task={activeTask}
                            isOverlay
                        />
                    </div>
                </DragOverlay>
            </DndContext>

            <TaskDialog
                isOpen={isDialogOpen}
                onClose={() => { setIsDialogOpen(false); loadTasks(); }}
                taskToEdit={taskToEdit}
                defaultStatus={defaultStatus}
            />
        </div>
    );
}
