
import React from "react";

import { KPICard } from "@/components/dashboard/KPICard";
import { CheckInWidget } from "@/components/dashboard/CheckInWidget";
import { Activity, Users, CheckCircle, AlertCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    // 1. Determine "Today" (Midnight) - Timezone Safe
    const now = new Date();
    const berlinDateStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" }); // YYYY-MM-DD

    // Construct range in UTC (assuming DB dates are stored as UTC Midnight)
    const start = new Date(`${berlinDateStr}T00:00:00.000Z`);
    const end = new Date(`${berlinDateStr}T23:59:59.999Z`);

    // 2. Fetch Metrics in Parallel
    const [
        expectedBookings,
        cancelledBookings,
        completedBookings,
        lowCreditCustomers
    ] = await Promise.all([
        // Metric 1: Expected (Confirmed + Completed)
        db.booking.count({
            where: {
                timeslot: {
                    date: { gte: start, lte: end }
                },
                status: { in: ['CONFIRMED', 'COMPLETED'] }
            }
        }),
        // Metric 2: Cancelled
        db.booking.count({
            where: {
                timeslot: {
                    date: { gte: start, lte: end }
                },
                status: { in: ['CANCELLED', 'NO_SHOW'] }
            }
        }),
        // Metric 3: Appeared (Completed)
        db.booking.count({
            where: {
                timeslot: {
                    date: { gte: start, lte: end }
                },
                status: 'COMPLETED'
            }
        }),
        // Metric 4: Low Credit B2C Customers Training Today
        db.booking.findMany({
            where: {
                timeslot: {
                    date: { gte: start, lte: end }
                },
                b2cCustomer: {
                    credits: { lte: 2 }
                }
            },
            include: {
                b2cCustomer: true,
                timeslot: true
            },
            take: 5 // Limit list size
        })
    ]);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#163B40]">Dashboard</h2>
                    <p className="text-muted-foreground">Tagesübersicht für den {format(now, "dd. MMMM yyyy", { locale: de })}.</p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <KPICard
                    title="Erwartet Heute"
                    value={expectedBookings.toString()}
                    description="Anmeldungen (ohne Storno)"
                    icon={Users}
                    // @ts-ignore
                    trend="neutral"
                />
                <KPICard
                    title="Absagen"
                    value={cancelledBookings.toString()}
                    description="Storniert oder No-Show"
                    icon={AlertCircle}
                    // @ts-ignore
                    trend="down" // Red indicator for visual alert
                    className="border-red-100 bg-red-50/30"
                />
                <KPICard
                    title="Erschienen"
                    value={completedBookings.toString()}
                    description="Bereits eingecheckt"
                    icon={CheckCircle}
                    // @ts-ignore
                    trend="up"
                />
            </div>

            {/* Main Visuals Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Key Action Area: Low Credits - Takes up 3 columns */}
                <div className="col-span-3">
                    <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-red-50 bg-red-50/30 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-red-900 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    Handlungsbedarf: Guthaben
                                </h3>
                                <p className="text-xs text-red-700 mt-1">Kunden im Training mit ≤ 2 Credits</p>
                            </div>
                            <Badge variant="outline" className="bg-white text-red-700 border-red-200">
                                {lowCreditCustomers.length} Akut
                            </Badge>
                        </div>

                        <div className="p-0 flex-1 overflow-y-auto">
                            {lowCreditCustomers.length === 0 ? (
                                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                                    Keine kritischen Guthaben-Stände heute.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {lowCreditCustomers.map((booking) => (
                                        <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-red-50/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs ring-2 ring-white">
                                                    {booking.b2cCustomer?.credits}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {booking.b2cCustomer?.firstName} {booking.b2cCustomer?.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Activity className="h-3 w-3" />
                                                        {booking.timeslot.startTime ? format(new Date(booking.timeslot.startTime), 'HH:mm', { locale: de }) : '??:??'} Uhr
                                                    </p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                Aufladen <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chart - Takes up 4 columns */}
                <CheckInWidget />
            </div>
        </div>
    );
}

