"use client";

import React from "react";
import { ArrowLeft, Film, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoManager } from "./VideoManager";

interface Course {
    id: string;
    title: string;
    description?: string;
    contents: any[];
}

interface Props {
    course: Course;
    onBack: () => void;
    currentVideos: any[]; // The videos belonging to this course
}

export function CourseDetail({ course, onBack, currentVideos }: Props) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-500">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{course.title}</h1>
                    {course.description && <p className="text-gray-500">{course.description}</p>}
                </div>
            </div>

            {/* Video Manager (Filtered/Scoped) */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Kursinhalte</h2>
                    {/* Add Video Button Logic is inside AddVideoDialog, which VideoManager likely uses or we expose here */}
                </div>

                {/* Reusing VideoManager but we might need to pass courseId context to AddVideoDialog */}
                <VideoManager videos={currentVideos} showHeader={false} courseId={course.id} />
            </div>
        </div>
    );
}
