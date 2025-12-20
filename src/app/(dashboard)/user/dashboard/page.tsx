"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import {
    Calendar,
    ShoppingBag,
    PlayCircle,
    ArrowRight,
    Zap,
    Droplets,
    Activity
} from "lucide-react";

export default function UserDashboardPage() {
    const { data: session } = useSession();
    // Mock user data fallback
    const user = { name: "Sportler" };

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
            {/* Header / Greeting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#163B40]">
                        Hey {session?.user?.name || user.name}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Bist du bereit, dich gut zu fühlen?
                    </p>
                </div>

                {/* Streak / Level - Minimalist */}
                <div className="bg-white border border-[#EAF8F7] px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
                    <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                        <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Streak</p>
                        <p className="text-sm font-bold text-[#163B40]">3 Wochen</p>
                    </div>
                    <div className="h-8 w-px bg-gray-100 mx-2" />
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Level</p>
                        <p className="text-sm font-bold text-[#163B40]">Rücken-Rookie</p>
                    </div>
                </div>
            </div>

            {/* Hero: Quick Pain Check - Deep Teal Brand Color */}
            <div className="bg-[#163B40] rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden shadow-lg shadow-[#163B40]/20">
                {/* Abstract Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#2CC8C5] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-[#2CC8C5]/20 text-[#2CC8C5] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 border border-[#2CC8C5]/30">
                        <Activity className="w-3 h-3" /> Soforthilfe
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="max-w-lg">
                            <h2 className="text-2xl md:text-3xl font-bold mb-3">
                                Wo zwickt es heute?
                            </h2>
                            <p className="text-gray-300">
                                Wähle einen Bereich für eine schnelle 2-Minuten Übung direkt am Arbeitsplatz.
                            </p>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            {['Nacken', 'Unterer Rücken', 'Schultern'].map((area) => (
                                <button
                                    key={area}
                                    className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white hover:text-[#163B40] hover:border-white transition-all font-medium text-sm"
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Daily Health Hack - Light Brand Color */}
                <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-8 h-full flex flex-col items-start">
                        <div className="h-12 w-12 rounded-2xl bg-[#EAF8F7] flex items-center justify-center text-[#2CC8C5] mb-6 group-hover:scale-110 transition-transform">
                            <Droplets className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Daily Health Hack</p>
                        <h3 className="text-xl font-bold text-[#163B40] mb-3">
                            "Trink jetzt ein großes Glas Wasser!"
                        </h3>
                        <p className="text-gray-500 text-sm mb-auto">
                            Dein Bandscheiben bestehen zu 80% aus Wasser. Keep them hydrated.
                        </p>
                        <Button variant="outline" className="mt-6 rounded-full w-full border-gray-200 hover:border-[#2CC8C5] hover:text-[#2CC8C5]">
                            Erledigt (+10 Pkt)
                        </Button>
                    </CardContent>
                </Card>

                {/* 2. Booking CTA - Coral Accent for Urgency/Action */}
                <Card className="rounded-[2rem] border-none shadow-sm bg-[#FF6F61] text-white overflow-hidden relative group hover:shadow-lg hover:shadow-[#FF6F61]/30 transition-all lg:col-span-2">
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-10 transition-opacity" />
                    <CardContent className="p-8 h-full flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="space-y-4 max-w-md">
                            <div className="flex items-center gap-2 text-white/90">
                                <Calendar className="w-5 h-5" />
                                <span className="font-bold">Dein Rücken vermisst dich!</span>
                            </div>
                            <h3 className="text-2xl font-bold leading-tight">
                                Kein Termin in Sicht. Tu jetzt etwas für deine Gesundheit!
                            </h3>
                        </div>
                        <Button className="bg-white text-[#FF6F61] hover:bg-gray-50 rounded-full px-8 py-6 font-bold text-lg shadow-xl shadow-black/10 shrink-0 w-full md:w-auto">
                            Jetzt Slot sichern <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Shop & Content Teasers - Subtle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/user/shop" className="group">
                    <div className="bg-white p-6 rounded-[2rem] flex items-center gap-6 border border-transparent hover:border-[#EAF8F7] hover:shadow-sm transition-all">
                        <div className="h-16 w-16 rounded-2xl bg-[#EAF8F7] flex items-center justify-center text-[#2CC8C5] group-hover:rotate-6 transition-transform">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-[#163B40]">Fuel your Body.</h4>
                            <p className="text-sm text-gray-500">Hol dir dein Protein oder Magnesium direkt im Studio.</p>
                        </div>
                        <div className="ml-auto">
                            <span className="text-xs font-bold text-[#2CC8C5] bg-[#EAF8F7] px-3 py-1 rounded-full group-hover:bg-[#2CC8C5] group-hover:text-white transition-colors">
                                Zum Shop
                            </span>
                        </div>
                    </div>
                </Link>

                <Link href="/user/content" className="group">
                    <div className="bg-white p-6 rounded-[2rem] flex items-center gap-6 border border-transparent hover:border-[#EAF8F7] hover:shadow-sm transition-all">
                        <div className="h-16 w-16 rounded-2xl bg-[#EAF8F7] flex items-center justify-center text-[#2CC8C5] group-hover:rotate-6 transition-transform">
                            <PlayCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-[#163B40]">Lerne von den Profis.</h4>
                            <p className="text-sm text-gray-500">Neue Videos zu Nackenschmerzen verfügbar.</p>
                        </div>
                        <div className="ml-auto">
                            <span className="text-xs font-bold text-[#2CC8C5] bg-[#EAF8F7] px-3 py-1 rounded-full group-hover:bg-[#2CC8C5] group-hover:text-white transition-colors">
                                Ansehen
                            </span>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
