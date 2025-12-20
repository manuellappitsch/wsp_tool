"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableKanbanCard } from "./KanbanCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    id: string; // The status (TODO, PROGRESS...)
    title: string;
    tasks: any[];
    colorClass: string; // bg color for header/column
    onEditTask: (task: any) => void;
    onDeleteTask: (id: string) => void;
    onAddTask: (status: any) => void;
}

export function KanbanColumn({ id, title, tasks, colorClass, onEditTask, onDeleteTask, onAddTask }: Props) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full w-[300px] flex-shrink-0 bg-gray-50/50 rounded-xl border border-gray-200">
            {/* Header */}
            <div className={cn("p-4 rounded-t-xl border-b border-gray-100 flex justify-between items-center sticky top-0 bg-inherit z-10", colorClass)}>
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-700">{title}</h3>
                    <span className="bg-white/50 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium border border-black/5">
                        {tasks.length}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddTask(id)}>
                    <Plus className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                </Button>
            </div>

            {/* Droppable Area */}
            <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <SortableKanbanCard
                            key={task.id}
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                        />
                    ))}
                    {tasks.length === 0 && (
                        <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">
                            Hierhin ziehen oder + drücken
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
