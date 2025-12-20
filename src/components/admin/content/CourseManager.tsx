"use client";

import React, { useState } from "react";
import { FolderPlus, ChevronRight, MoreVertical, Edit, Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AddCourseDialog } from "./AddCourseDialog";
import { CoursePublishingDialog } from "./CoursePublishingDialog";

interface Course {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    published_for_admin?: boolean;
    published_for_user?: boolean;
    contents: any[];
}

interface Props {
    courses: Course[];
    onSelectCourse: (course: Course) => void;
    onDeleteCourse: (id: string) => void;
}

export function CourseManager({ courses, onSelectCourse, onDeleteCourse }: Props) {
    const [publishingCourse, setPublishingCourse] = useState<Course | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-[#163B40]" />
                        Videokurse
                    </h2>
                    <p className="text-sm text-gray-500">
                        Organisieren Sie Ihre Videos in strukturierte Kurse.
                    </p>
                </div>
                <AddCourseDialog />
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Noch keine Kurse vorhanden.</p>
                    <AddCourseDialog trigger={<Button variant="link">Erstellen Sie den ersten Kurs</Button>} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course.id} className="group bg-white rounded-lg border shadow-sm hover:shadow-md transition-all relative">
                            {/* Badges */}
                            <div className="absolute top-2 left-2 flex gap-1 z-10">
                                {course.published_for_admin && (
                                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-medium border border-purple-200">
                                        B2B
                                    </span>
                                )}
                                {course.published_for_user && (
                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium border border-blue-200">
                                        App
                                    </span>
                                )}
                            </div>

                            {/* Thumbnail / Header */}
                            <div
                                className="h-32 bg-gray-100 rounded-t-lg relative cursor-pointer overflow-hidden"
                                onClick={() => onSelectCourse(course)}
                            >
                                {course.thumbnailUrl ? (
                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-300">
                                        <FolderPlus className="w-10 h-10" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3
                                        className="font-semibold text-gray-900 line-clamp-1 cursor-pointer hover:text-[#163B40]"
                                        onClick={() => onSelectCourse(course)}
                                    >
                                        {course.title}
                                    </h3>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setPublishingCourse(course)}>
                                                <Edit className="w-4 h-4 mr-2 text-blue-600" />
                                                Veröffentlichen
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { }}>
                                                <Edit className="w-4 h-4 mr-2" /> Bearbeiten
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-600"
                                                onClick={() => onDeleteCourse(course.id)}
                                            >
                                                <Trash className="w-4 h-4 mr-2" /> Löschen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <p className="text-xs text-gray-500 line-clamp-2 min-h-[2.5em]">
                                    {course.description || "Keine Beschreibung."}
                                </p>

                                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                                        {course.contents?.length || 0} Videos
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[#163B40] hover:text-[#163B40] p-0 h-auto hover:bg-transparent"
                                        onClick={() => onSelectCourse(course)}
                                    >
                                        Öffnen <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {publishingCourse && (
                <CoursePublishingDialog
                    course={publishingCourse}
                    isOpen={!!publishingCourse}
                    onClose={() => setPublishingCourse(null)}
                />
            )}
        </div>
    );
}
