import { Flame } from "lucide-react";

export function StreakDisplay() {
    return (
        <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-400 blur opacity-30 rounded-full animate-pulse" />
                    <div className="bg-orange-100 p-2 rounded-full relative z-10 text-orange-600">
                        <Flame className="w-6 h-6 fill-orange-600" />
                    </div>
                </div>
                <div>
                    <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">Streak</div>
                    <div className="font-bold text-gray-800 text-lg">3 Wochen</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-gray-400">Health Level</div>
                <div className="font-bold text-[#1e3a5f]">Rücken-Rookie</div>
            </div>
        </div>
    );
}
