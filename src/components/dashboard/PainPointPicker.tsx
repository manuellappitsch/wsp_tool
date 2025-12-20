"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, ArrowRight, Zap } from "lucide-react";
import { useState } from "react";

const PAIN_POINTS = [
    {
        id: "neck",
        label: "Nacken",
        videoUrl: "https://www.youtube.com/embed/xyz123?autoplay=1", // Placeholder
        description: "2 Min Express-Mobilisation gegen Nackenverspannung."
    },
    {
        id: "lower_back",
        label: "Unterer Rücken",
        videoUrl: "https://www.youtube.com/embed/abc456?autoplay=1", // Placeholder
        description: "Sofort-Entlastung für die Lendenwirbelsäule."
    },
    {
        id: "shoulders",
        label: "Schultern",
        videoUrl: "https://www.youtube.com/embed/def789?autoplay=1", // Placeholder
        description: "Öffne deine Schultern nach langem Sitzen."
    },
];

export function PainPointPicker() {
    const [selectedPoint, setSelectedPoint] = useState<typeof PAIN_POINTS[0] | null>(null);

    return (
        <div className="w-full bg-[#1e3a5f] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-x-10 -translate-y-10" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-blue-200 border border-white/20">
                        <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span>Soforthilfe</span>
                    </div>
                    <h3 className="text-2xl font-bold">Wo zwickt es heute?</h3>
                    <p className="text-blue-200 text-sm max-w-sm">
                        Wähle einen Bereich für eine schnelle 2-Minuten Übung direkt am Arbeitsplatz.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {PAIN_POINTS.map((point) => (
                        <Dialog key={point.id}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-white/10 border-white/20 hover:bg-white text-white hover:text-[#1e3a5f] h-12 px-6 rounded-xl transition-all hover:scale-105 active:scale-95"
                                >
                                    {point.label}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-[#d32f2f]" />
                                        {point.label} – Soforthilfe
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="aspect-video bg-black rounded-lg overflow-hidden mt-4 relative">
                                    {/* Placeholder for actual Video Embed */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/10 text-white">
                                        <p>Video Embed: {point.videoUrl}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">{point.description}</p>
                                    <Button className="w-full mt-4 bg-[#1e3a5f]">
                                        Übung abgeschlossen <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </div>
        </div>
    );
}
