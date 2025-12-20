
import React from "react";
import { KanbanBoard } from "@/components/admin/kanban/KanbanBoard";

export const metadata = {
    title: "Aufgabenverwaltung | WSP Admin",
};

export default function AdminTasksPage() {
    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#163B40]">Aufgaben (Kanban)</h1>
                    <p className="text-muted-foreground">Verwalte hier To-dos für das Admin-Team.</p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-6">
                <KanbanBoard />
            </div>
        </div>
    );
}
