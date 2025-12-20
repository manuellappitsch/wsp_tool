import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface UpgradeBannerProps {
    currentUsage: number;
}

export function UpgradeBanner({ currentUsage }: UpgradeBannerProps) {
    if (currentUsage < 80) return null;

    return (
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#162e4a] text-white p-6 rounded-xl shadow-lg border border-white/10 relative overflow-hidden group">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-400 font-bold tracking-wider text-sm uppercase">
                        <Sparkles className="w-4 h-4" />
                        <span>Growth Potential Unlocked</span>
                    </div>
                    <h3 className="text-2xl font-bold leading-tight">
                        Ihr Team gibt 110%! <br />
                        Die Slots werden knapp.
                    </h3>
                    <p className="text-gray-300 max-w-md">
                        Bereits {currentUsage}% Ihrer Trainings-Slots sind belegt. Um Engpässe zu vermeiden und die Mitarbeiter-Motivation hochzuhalten, empfiehlt sich ein Upgrade.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                    <Button
                        variant="secondary"
                        className="bg-white text-[#1e3a5f] hover:bg-gray-100 font-bold h-12 px-8 rounded-full shadow-xl transition-transform hover:scale-105"
                    >
                        Kontingent erweitern
                    </Button>
                    <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 h-12 px-6 rounded-full"
                    >
                        Bericht ansehen
                    </Button>
                </div>
            </div>
        </div>
    );
}
