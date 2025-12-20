import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WeeklyUsageChart } from "@/components/analytics/WeeklyUsageChart";
import { ArrowDown, TrendingUp, Users } from "lucide-react";

export default function TenantAnalyticsPage() {
    return (
        <div className="space-y-8 p-8">
            <header>
                <h1 className="text-3xl font-bold text-[#1e3a5f]">Analyse & ROI</h1>
                <p className="text-gray-500">Datenbasierte Einblicke in die Gesundheit Ihres Teams.</p>
            </header>

            {/* ROI HIGHLIGHTS */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            Gesundheits-Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-[#1e3a5f]">94/100</div>
                        <p className="text-xs text-green-600 font-bold mt-1">+12% vs Vormonat</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Aktive Teilnehmer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-[#1e3a5f]">82</div>
                        <p className="text-xs text-gray-400 mt-1">von 120 Mitarbeitern</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#1e3a5f] text-white border-none shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
                            <ArrowDown className="w-4 h-4" />
                            Est. Krankentage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-white">-18%</div>
                        <p className="text-xs text-blue-200 mt-1">prognostizierte Reduktion</p>
                    </CardContent>
                </Card>
            </div>

            {/* CHART SECTION */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Wöchentliche Aktivität</CardTitle>
                        <CardDescription>Anzahl der Trainingssessions pro Wochentag</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <WeeklyUsageChart />
                    </CardContent>
                </Card>

                {/* UPSELL SIDEBAR */}
                <Card className="bg-gray-50 border-dashed border-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Top Performer</CardTitle>
                        <CardDescription>Abteilungen mit höchster Beteiligung</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { name: "Vertrieb", score: 92 },
                                { name: "IT / Dev", score: 88 },
                                { name: "HR", score: 75 },
                                { name: "Marketing", score: 60 },
                            ].map((dept, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-white border text-gray-500'}`}>
                                            {i + 1}
                                        </div>
                                        <span className="font-medium text-gray-700">{dept.name}</span>
                                    </div>
                                    <span className="font-mono font-bold text-[#1e3a5f]">{dept.score}%</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="font-bold text-sm mb-2">Tipp:</h4>
                            <p className="text-xs text-gray-500 mb-4">
                                Veranstalten Sie eine "Health Challenge" zwischen den Abteilungen, um die Motivation zu steigern.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
