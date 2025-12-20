"use client";

import React, { useState, useTransition } from "react";
import { Search, Loader2, CheckCircle, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchCheckInUsers, performCheckIn, getUpcomingCheckIns, type CheckInSearchResult } from "@/actions/check-in";
import { toast } from "sonner";

export function CheckInWidget() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CheckInSearchResult[]>([]);
    const [upcomingResults, setUpcomingResults] = useState<CheckInSearchResult[]>([]);
    const [isSearching, startSearchTransition] = useTransition();
    const [isCheckingIn, startCheckInTransition] = useTransition();

    // Fetch upcoming on mount
    React.useEffect(() => {
        getUpcomingCheckIns().then(res => {
            if (res.success && res.results) setUpcomingResults(res.results);
        });
    }, []);

    // Debounced Search Effect
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 1) {
                startSearchTransition(async () => {
                    const { success, results, error } = await searchCheckInUsers(query);
                    if (success && results) {
                        setResults(results);
                    } else {
                        // Silent fail on privacy mode type-ahead
                        console.error(error);
                    }
                });
            } else {
                setResults([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Manual search (keep for button click)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // The effect handles the search, but if user forces it, we can trigger immediate
        if (query.length >= 1) {
            startSearchTransition(async () => {
                const { success, results, error } = await searchCheckInUsers(query);
                if (success && results) setResults(results);
            });
        }
    };

    const handleCheckIn = (bookingId: string) => {
        startCheckInTransition(async () => {
            const { success, error } = await performCheckIn(bookingId);
            if (success) {
                toast.success("Check-In erfolgreich!");
                // Refresh list locally
                const updateList = (list: CheckInSearchResult[]) => list.map(r => r.id === bookingId ? { ...r, status: "COMPLETED" } : r);
                setResults(prev => updateList(prev));
                setUpcomingResults(prev => updateList(prev));
            } else {
                toast.error(error || "Check-In fehlgeschlagen");
            }
        });
    };

    // Decide what to show: Search Results OR Upcoming
    const displayResults = query.length >= 1 ? results : upcomingResults;
    const showHeader = query.length < 1 && upcomingResults.length > 0;
    const isEmpty = displayResults.length === 0;

    return (
        <Card className="col-span-4 lg:col-span-3 border border-gray-100 shadow-lg bg-white overflow-hidden flex flex-col h-full min-h-[500px] rounded-2xl">
            {/* Header Section */}
            <div className="bg-[#163B40] p-6 pb-20 relative">
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <h3 className="text-white text-xl font-bold flex items-center gap-2">
                            <UserCheck className="h-6 w-6 text-[#2CC8C5]" />
                            Check-In
                        </h3>
                        <p className="text-blue-100/80 text-sm mt-1">
                            Heutige Termine verwalten.
                        </p>
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <UserCheck className="h-24 w-24 text-white transform rotate-12" />
                </div>
            </div>

            {/* Floating Search Bar Section */}
            <div className="px-6 -mt-8 relative z-20">
                <form onSubmit={handleSearch} className="relative shadow-lg rounded-xl bg-white">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Mitglied suchen..."
                        className="pl-11 h-14 bg-white border-none rounded-xl text-lg text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#163B40]"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-[#2CC8C5] hover:bg-[#25a09e] text-[#163B40] font-bold rounded-lg h-10 px-4"
                        >
                            Suchen
                        </Button>
                    </div>
                </form>
            </div>

            {/* Results List */}
            <CardContent className="flex-1 p-0 overflow-y-auto mt-4">
                {isSearching ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-[#163B40]" />
                        <span className="text-sm font-medium">Durchsuche Datenbank...</span>
                    </div>
                ) : !isEmpty ? (
                    <div className="divide-y divide-gray-100">
                        {showHeader && (
                            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bereit zum Check In (nächste 2h)</span>
                            </div>
                        )}
                        {displayResults.map((res) => (
                            <div key={res.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white
                                        ${res.userType === 'B2B' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {res.userAvatar ? (
                                            <img src={res.userAvatar} alt={res.name} className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            <span>{res.name.charAt(0)}{res.name.split(' ')[1]?.charAt(0)}</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <p className="font-bold text-gray-900 text-base">{res.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border
                                                ${res.userType === 'B2B' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                {res.userType}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                • {res.time} Uhr
                                            </span>
                                            {res.companyName && (
                                                <span className="text-xs text-gray-400 max-w-[150px] truncate hidden sm:inline-block">
                                                    • {res.companyName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="pl-4">
                                    {res.status === 'COMPLETED' ? (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Checked In
                                            </span>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => handleCheckIn(res.id)}
                                            disabled={isCheckingIn}
                                            className="bg-white border-2 border-[#163B40] text-[#163B40] hover:bg-[#163B40] hover:text-white font-bold rounded-xl transition-all shadow-sm"
                                        >
                                            {isCheckingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check In"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Footer for list end */}
                        <div className="p-6 text-center">
                            <p className="text-xs text-gray-400">{query.length > 0 ? "Keine weiteren Ergebnisse." : "Keine weiteren Termine in Kürze."}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-4">
                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                            <Search className="h-8 w-8 text-gray-300" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-500">Bereit zum Check In</p>
                            <p className="text-xs mt-1 max-w-[200px] mx-auto">Suche nach Mitgliedern oder warte auf anstehende Termine.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
