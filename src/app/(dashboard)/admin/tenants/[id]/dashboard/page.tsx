import React from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { TenantSettingsDialog } from "@/components/admin/TenantSettingsDialog";
import { PartnerUtilizationChart } from "@/components/admin/PartnerUtilizationChart";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { de } from "date-fns/locale";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PartnerDashboardPage({ params }: PageProps) {
    const { id } = await params;

    // 1. Fetch Tenant Details
    const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('*, users(*)')
        .eq('id', id)
        .single();

    if (!tenant) return <div>Partner nicht gefunden.</div>;

    // 2. Fetch Employee Count
    const { count: totalEmployees } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenantId', id);

    // 3. Fetch Recent Bookings (Last 30 Days)
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    // We need bookings where the associated timeslot is >= 30 days ago.
    // Deep filtering: bookings -> timeslots
    const { data: recentBookings } = await supabaseAdmin
        .from('bookings')
        .select(`
            id,
            status,
            timeslot:timeslots!inner (
                date
            ),
            user:users!inner (
                tenantId
            )
        `)
        .eq('user.tenantId', id)
        .gte('timeslot.date', thirtyDaysAgo.toISOString())
        .in('status', ['CONFIRMED', 'COMPLETED']);

    const bookingsList = recentBookings || [];

    // --- Analytics Logic ---
    const dailyQuota = tenant.dailyKontingent;
    const monthlyCapacity = dailyQuota * 30; // approx

    const totalBookingsLast30Days = bookingsList.length;

    const utilizationRate = monthlyCapacity > 0
        ? Math.round((totalBookingsLast30Days / monthlyCapacity) * 100)
        : 0;

    // Daily Stats for Chart
    const last30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

    const chartData = last30Days.map(date => {
        // @ts-ignore - Supabase types are lose here
        const bookingsOnDay = bookingsList.filter(b => isSameDay(new Date(b.timeslot.date), date)).length;
        return {
            date: format(date, "dd.MM", { locale: de }),
            bookings: bookingsOnDay,
            capacity: dailyQuota // Show the limit line
        };
    });

    // Profitability Check
    // Low Usage (< 30%) with High Quota is "High Margin" (Good for us financially, maybe bad for churn)
    // High Usage (> 80%) is "High Value" (Good for retention)
    let healthStatus = { label: "Neutral", color: "text-gray-500", bg: "bg-gray-100" };
    if (utilizationRate < 20 && (totalEmployees || 0) > 5) {
        healthStatus = { label: "Wenig Nutzung (Hohe Marge, Risiko Churn)", color: "text-yellow-700", bg: "bg-yellow-50" };
    } else if (utilizationRate > 80) {
        healthStatus = { label: "Hohe Auslastung (Kritischer Erfolg)", color: "text-green-700", bg: "bg-green-50" };
    } else if (utilizationRate === 0 && totalBookingsLast30Days === 0) {
        healthStatus = { label: "Inaktiv (Achtung)", color: "text-red-700", bg: "bg-red-50" };
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/tenants">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#163B40]">{tenant.companyName} Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Partner Details & Analytics</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <TenantSettingsDialog tenant={tenant} />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Mitarbeiter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEmployees || 0}</div>
                        <p className="text-xs text-muted-foreground">Registrierte Nutzer</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Buchungen (30 Tage)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBookingsLast30Days}</div>
                        <p className="text-xs text-muted-foreground">Termine wahrgenommen</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Auslastung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{utilizationRate}%</div>
                        <p className="text-xs text-muted-foreground">des Kontingents genutzt</p>
                    </CardContent>
                </Card>
                <Card className={`${healthStatus.bg} border-none`}>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${healthStatus.color}`}>Status Analyse</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-lg font-bold ${healthStatus.color}`}>{healthStatus.label}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Nutzungsverlauf</CardTitle>
                            <CardDescription>Buchungen der letzten 30 Tage im Vergleich zum täglichen Limit.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <PartnerUtilizationChart data={chartData} />
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Details Side */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vertragsdaten</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Tgl. Kontingent</span>
                                <span className="font-medium">{dailyQuota} Slots</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Rechnungsadresse</span>
                                <span className="font-medium text-right">
                                    {tenant.billingAddress ? (
                                        <>{tenant.billingAddress}<br />{tenant.billingZip} {tenant.billingCity}</>
                                    ) : "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mitglied seit</span>
                                <span className="font-medium">{format(new Date(tenant.createdAt), "dd.MM.yyyy")}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4" /> Analyse
                        </h4>
                        <p className="text-sm text-blue-800">
                            {utilizationRate < 10
                                ? "Kunde nutzt das Angebot kaum. Empfehlung: Customer Success Call vereinbaren."
                                : "Nutzung ist im erwarteten Rahmen."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
