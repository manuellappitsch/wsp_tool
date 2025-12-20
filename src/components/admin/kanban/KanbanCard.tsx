import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MoreHorizontal, Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface KanbanTask {
    id: string;
    title: string;
    description?: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    dueDate?: Date | string;
    assignee?: string;
}

interface ItemProps {
    task: KanbanTask;
    onEdit?: (task: KanbanTask) => void;
    onDelete?: (id: string) => void;
    // Dnd specific
    style?: React.CSSProperties;
    attributes?: any;
    listeners?: any;
    setNodeRef?: (node: HTMLElement | null) => void;
    isOverlay?: boolean;
}

// 1. Pure UI Component
export function KanbanCard({ task, onEdit, onDelete, style, attributes, listeners, setNodeRef, isOverlay }: ItemProps) {
    const getPriorityColor = (p: string) => {
        switch (p) {
            case "HIGH": return "bg-red-100 text-red-700 border-red-200";
            case "MEDIUM": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "LOW": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div
            id={task.id}
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`mb-3 focus:outline-none ${isOverlay ? "cursor-grabbing" : ""}`}
        >
            <Card
                className={`hover:shadow-md transition-shadow group border-l-4 border-l-transparent hover:border-l-[#163B40] hover:bg-gray-50/50 ${isOverlay ? "shadow-2xl border-l-[#163B40] bg-white cursor-grabbing" : "cursor-grab active:cursor-grabbing"
                    }`}
                onClick={() => onEdit?.(task)}
            >
                <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold px-1.5 py-0 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority === "HIGH" ? "Hoch" : task.priority === "MEDIUM" ? "Mittel" : "Niedrig"}
                        </Badge>

                        {/* Hide Dropdown in Overlay to keep it clean */}
                        {!isOverlay && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit?.(task)}>
                                        Bearbeiten
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete?.(task.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                        Löschen
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <h4 className="font-semibold text-sm text-gray-800 leading-tight mb-2">{task.title}</h4>

                    {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                            {task.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                        {task.dueDate ? (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className={new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : ""}>
                                    {format(new Date(task.dueDate), "dd. MMM", { locale: de })}
                                </span>
                            </div>
                        ) : <span></span>}

                        {task.assignee && (
                            <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                <User className="h-3 w-3" />
                                <span className="max-w-[80px] truncate font-medium text-gray-600">{task.assignee}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// 2. Sortable Logic Wrapper
export function SortableKanbanCard({ task, onEdit, onDelete }: { task: KanbanTask, onEdit: (t: KanbanTask) => void, onDelete: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id, data: { ...task } });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // Dim original when dragging
    };

    return (
        <KanbanCard
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            style={style}
            attributes={attributes}
            listeners={listeners}
            setNodeRef={setNodeRef}
        />
    );
}
