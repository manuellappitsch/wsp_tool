"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface Activity {
    id: string;
    name: string;
    action: string;
    time: string;
}

const MOCK_ACTIVITIES: Activity[] = [
    { id: "1", name: "Lukas M.", action: "hat gerade 1 Slot gebucht", time: "jetzt" },
    { id: "2", name: "Sarah K.", action: "hat ein Training absolviert", time: "vor 2 Min" },
    { id: "3", name: "Michael B.", action: "nutzt den Videokurs", time: "vor 5 Min" },
    { id: "4", name: "Julia W.", action: "hat 1 Slot gebucht", time: "vor 12 Min" },
    { id: "5", name: "Tim S.", action: "hat ein Training absolviert", time: "vor 15 Min" },
];

export function LiveTicker() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % MOCK_ACTIVITIES.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const current = MOCK_ACTIVITIES[index];

    return (
        <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full py-2 px-4 shadow-sm inline-flex items-center gap-3 overflow-hidden min-w-[300px]">
            <div className="flex items-center gap-1.5 min-w-fit">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Activity</span>
            </div>

            <div className="h-5 w-[1px] bg-gray-200"></div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-sm text-gray-700 truncate"
                >
                    <CheckCircle2 className="w-4 h-4 text-[#1e3a5f]" />
                    <span className="font-bold">{current.name}</span>
                    <span className="text-gray-500">{current.action}</span>
                    <span className="text-xs text-gray-400">({current.time})</span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
