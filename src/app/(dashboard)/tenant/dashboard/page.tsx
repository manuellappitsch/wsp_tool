import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LiveTicker } from "@/components/sales/LiveTicker";
import { UpgradeBanner } from "@/components/sales/UpgradeBanner";
import { ArrowUpRight, Users, Calendar, Activity } from "lucide-react";

export default async function TenantDashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.email) return null;

    // 1. Resolve Tenant Context
    let tenantId;
    let firstName;

    // Check Users table
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('tenantId, firstName')
        .eq('email', session.user.email)
        .single();

    if (user) {
        tenantId = user.tenantId;
        firstName = user.firstName;
    } else {
        // Check TenantAdmin table
        const { data: admin } = await supabaseAdmin
            .from('tenant_admins')
            .select('tenantId, firstName')
            .eq('email', session.user.email)
            .single();

        if (admin) {
            tenantId = admin.tenantId;
            firstName = admin.firstName; // Use Admin name if user login fails
        }
    }

    if (!tenantId) return <div>Access Denied: No Tenant Associated</div>;

    // 2. Data Fetching
    // A. Employee Count
    const { count: employeeCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenantId', tenantId)
        .eq('isActive', true);

    // B. Tenant Details (Limit)
    const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('dailyKontingent, companyName')
        .eq('id', tenantId)
        .single();

    // C. Quota Usage (Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Needed: End of day?
    // Logic: Find timeslots for today, then count bookings for this tenant in those slots.

    const { data: slotsToday } = await supabaseAdmin
        .from('timeslots')
        .select('id')
        .gte('date', today.toISOString()); // Assuming date is ISO string in DB or timestamp

    const slotIds = slotsToday?.map(s => s.id) || [];
    let usedQuota = 0;

    if (slotIds.length > 0) {
        const { count } = await supabaseAdmin
            .from('bookings')
            .select('*, user:users!inner(tenantId)', { count: 'exact', head: true })
            .in('timeslotId', slotIds)
            .eq('user.tenantId', tenantId)
            .in('status', ['CONFIRMED', 'COMPLETED']);
        usedQuota = count || 0;
    }

    const limit = tenant?.dailyKontingent || 0;
    const usagePercent = limit > 0 ? Math.round((usedQuota / limit) * 100) : 0;
    const isCritical = usagePercent >= 80;

    return (
        <div className="space-y-8 pb-10">

            {/* 1. VISUAL HERO SECTION */}
            <div className="relative rounded-3xl overflow-hidden bg-[#1e3a5f] text-white shadow-2xl">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2500&auto=format&fit=crop"
                        alt="Gym Background"
                        className="w-full h-full object-cover opacity-20 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f]/80 to-transparent" />
                </div>

                <div className="relative z-10 p-8 md:p-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider border border-white/20 text-blue-200">
                                <Activity className="w-3 h-3" />
                                <span>Health Performance Dashboard</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                Willkommen, {firstName || session.user.name} 👋
                            </h1>
                            <p className="text-lg text-blue-100/80 font-medium">
                                Ihr Team "{tenant?.companyName}" ist heute aktiv. <br className="hidden md:block" />
                                Hier sehen Sie, wie sich das Investment in Gesundheit auszahlt.
                            </p>
                        </div>

                        {/* Live Ticker Widget */}
                        <div className="flex-shrink-0">
                            <LiveTicker />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. UPGRADE BANNER (Conditional) */}
            <UpgradeBanner currentUsage={usagePercent} />

            {/* 3. KPI METRICS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-[#1e3a5f] hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Aktive Mitarbeiter</CardTitle>
                        <Users className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#1e3a5f]">{employeeCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registrierte Nutzer</p>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 hover:shadow-md transition-shadow ${isCritical ? 'border-l-red-500' : 'border-l-green-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Auslastung (Heute)</CardTitle>
                        <Calendar className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${isCritical ? 'text-red-600' : 'text-gray-800'}`}>
                            {usedQuota} <span className="text-lg text-gray-400 font-normal">/ {limit}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-500">{usagePercent}%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Placeholder Sales Cards */}
                <Card className="border-dashed border-2 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <CardContent className="flex flex-col items-center justify-center py-6 h-full text-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <ArrowUpRight className="h-5 w-5 text-[#1e3a5f]" />
                        </div>
                        <h3 className="font-bold text-[#1e3a5f]">ROI Report</h3>
                        <p className="text-xs text-gray-500 mt-1 px-4">Wie viele Krankheitstage haben Sie gespart?</p>
                    </CardContent>
                </Card>
            </div>

            {/* 4. CONTENT TEASER (Video) */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#163B40]">WSP Academy für Führungskräfte</h2>
                    <Button variant="ghost" className="text-[#1e3a5f]">Alle ansehen</Button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="md:w-1/3 h-48 md:h-auto bg-gray-200 relative">
                        <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop" alt="Team" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-[#1e3a5f] border-b-[6px] border-b-transparent ml-1" />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 md:w-2/3 flex flex-col justify-center">
                        <div className="text-xs font-bold text-[#d32f2f] uppercase tracking-wider mb-2">Neu</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-[#1e3a5f] transition-colors">Gesunde Führung: Teil 1</h3>
                        <p className="text-gray-600 mb-4">
                            Wie Sie als Führungskraft Vorbild für einen aktiven Lebensstil sind und Ihr Team nachhaltig motivieren.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                            <span>12 Min</span>
                            <span>•</span>
                            <span>Dr. Sport (WSP Coach)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
