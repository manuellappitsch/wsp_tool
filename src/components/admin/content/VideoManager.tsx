"use client";

import React from "react";
import { VideoCard } from "./VideoCard";
import { AddVideoDialog } from "./AddVideoDialog";
import { Film } from "lucide-react";

interface Video {
    id: string;
    title: string;
    description?: string | null;
    url: string;
    thumbnailUrl?: string | null;
    isActive: boolean;
}

interface Props {
    videos: Video[];
    showHeader?: boolean;
    courseId?: string; // Context for AddVideoDialog
}

export function VideoManager({ videos, showHeader = true, courseId }: Props) {
    return (
        <div className="space-y-6">
            {showHeader && (
                <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Film className="w-5 h-5 text-[#163B40]" />
                            Alle Videos
                        </h2>
                        <p className="text-sm text-gray-500">
                            Gesamte Bibliothek (ohne Kurs-Zuordnung).
                        </p>
                    </div>
                </div>
            )}

            {/* Action Bar if Header is hidden (inside Course Detail) */}
            {!showHeader && (
                <div className="flex justify-end">
                    <AddVideoDialog courseId={courseId} />
                </div>
            )}

            {videos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Noch keine Videos in diesem Bereich.</p>
                    <div className="mt-2">
                        <AddVideoDialog courseId={courseId} />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </div>
    );
}
