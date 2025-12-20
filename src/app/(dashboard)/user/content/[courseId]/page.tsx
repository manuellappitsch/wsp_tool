"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_COURSES } from "@/lib/mock-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, PlayCircle, Clock, CheckCircle } from "lucide-react";

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
    // Unwrap params using React.use() for Future Next.js compatibility or simple await if async component
    // Since this is a client component ('use client'), we can't await params directly in the component body easily without `use`.
    // However, normally for client components, params are passed as props. 
    // But to be safe and simple, let's assume standard behavior.

    // NOTE: In Next.js 15 client components, params is a promise.
    const resolvedParams = use(params);
    const courseId = resolvedParams.courseId;
    const course = MOCK_COURSES.find((c) => c.id === courseId);

    if (!course) {
        return notFound();
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Navigation */}
            <Link href="/user/content">
                <Button variant="ghost" className="pl-0 text-gray-500 hover:text-[#163B40] hover:bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zurück zur Übersicht
                </Button>
            </Link>

            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <span className="bg-[#EAF8F7] text-[#2CC8C5] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {course.category}
                    </span>
                </div>
                <h1 className="text-4xl font-extrabold text-[#163B40]">{course.title}</h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                    {course.description}
                </p>
            </div>

            {/* Modules List */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#163B40] border-b border-gray-100 pb-2">
                    Kursinhalte ({course.modules.length} Lektionen)
                </h2>

                <div className="grid gap-4">
                    {course.modules.map((module, index) => (
                        <Card key={module.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                            <CardContent className="p-0 flex flex-col md:flex-row">
                                {/* Thumbnail */}
                                <div className="w-full md:w-64 h-48 md:h-auto bg-gray-100 relative items-center justify-center flex flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                                    {/* Pseudo Thumbnail */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#163B40]/80 to-[#2CC8C5]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <PlayCircle className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="text-gray-400 font-medium">Video {index + 1}</div>
                                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {module.duration}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col justify-center space-y-2">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-lg font-bold text-[#163B40] group-hover:text-[#2CC8C5] transition-colors">
                                            {index + 1}. {module.title}
                                        </h3>
                                        <CheckCircle className="w-5 h-5 text-gray-200" />
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        {module.description}
                                    </p>
                                    <div className="pt-2">
                                        <span className="text-xs font-semibold text-[#2CC8C5] group-hover:underline">
                                            Jetzt ansehen
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {course.modules.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <p>Inhalte werden bald hinzugefügt.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
