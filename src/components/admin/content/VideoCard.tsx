"use client";

import React, { useTransition } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, EyeOff, PlayCircle } from "lucide-react";
import { deleteContent, toggleContentStatus } from "@/actions/content";
import Image from "next/image";

interface VideoProps {
    id: string;
    title: string;
    description?: string | null;
    url: string;
    thumbnailUrl?: string | null;
    isActive: boolean;
}

export function VideoCard({ video }: { video: VideoProps }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("Wirklich löschen?")) {
            startTransition(async () => {
                await deleteContent(video.id);
            });
        }
    };

    const handleToggle = () => {
        startTransition(async () => {
            await toggleContentStatus(video.id, !video.isActive);
        });
    };

    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-gray-100 flex items-center justify-center group">
                {video.thumbnailUrl ? (
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-gray-400">
                        <PlayCircle className="w-12 h-12" />
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="icon" onClick={() => window.open(video.url, '_blank')}>
                        <PlayCircle className="w-5 h-5" />
                    </Button>
                </div>

                <div className="absolute top-2 right-2">
                    {video.isActive ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Aktiv</Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-gray-200 text-gray-700">Entwurf</Badge>
                    )}
                </div>
            </div>

            <CardContent className="p-4 flex-1">
                <h3 className="font-semibold text-lg line-clamp-1 text-[#163B40]">{video.title}</h3>
                {video.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{video.description}</p>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex justify-end gap-2 text-gray-500">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggle}
                    disabled={isPending}
                    title={video.isActive ? "Deaktivieren" : "Veröffentlichen"}
                >
                    {video.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={isPending}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
