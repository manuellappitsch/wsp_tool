import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Calendar } from "lucide-react";
import { getQuotaUsage } from "@/actions/tenant-quota";
import { QuotaRequestDialog } from "@/components/tenant/QuotaRequestDialog";

export default async function TenantDashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.email) return null;

    // 1. Resolve Tenant Context via Profile
    const profile = await db.profile.findFirst({
        where: { email: session.user.email },
        select: {
            tenantId: true,
            firstName: true,
            tenant: {
                select: {
                    companyName: true,
                    quotaType: true
                }
            }
        }
    });

    if (!profile || !profile.tenantId || !profile.tenant) {
        return <div className="p-8">Access Denied: No Tenant Associated</div>;
    }

    const { tenantId, firstName, tenant } = profile;

    // 2. Data Fetching
    const employeeCount = await db.profile.count({
        where: {
            tenantId: tenantId,
            role: "USER",
            isActive: true
        }
    });

    // 3. Quota Usage (Real Data)
    const quotaData = await getQuotaUsage();
    // Default fallback if something fails
    const usedQuota = quotaData?.used || 0;
    const limit = quotaData?.limit || 0;
    const usagePercent = limit > 0 ? Math.round((usedQuota / limit) * 100) : 0;
    const isCritical = usagePercent >= 90;

    return (
        <div className="space-y-8 pb-10">

            {/* 1. VISUAL HERO SECTION */}
            <div className="relative rounded-3xl overflow-hidden bg-[#1e3a5f] text-white shadow-2xl">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2500&auto=format&fit=crop"
                        alt="Gym Background"
                        className="w-full h-full object-cover opacity-20 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f]/80 to-transparent" />
                </div>

                <div className="relative z-10 p-8 md:p-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider border border-white/20 text-blue-200">
                                <Activity className="w-3 h-3" />
                                <span>Health Performance Dashboard</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                Willkommen, {firstName || session.user.name} 👋
                            </h1>
                            <p className="text-lg text-blue-100/80 font-medium">
                                Schön, Sie wiederzusehen! Hier ist Ihr {tenant.companyName} Überblick.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. KPI METRICS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Employees */}
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

                {/* Quota Type Badge */}
                <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Vertragsmodell</CardTitle>
                        <Activity className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-[#1e3a5f]">
                                {tenant.quotaType === "SPECIAL" ? "SPECIAL" : "STANDARD"}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${tenant.quotaType === "SPECIAL" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                                {tenant.quotaType === "SPECIAL" ? "1x Tag / User" : "4x Monat / User"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {tenant.quotaType === "SPECIAL"
                                ? "Mitarbeiter können täglich buchen."
                                : "Standard-Kontingent für Mitarbeiter."}
                        </p>
                    </CardContent>
                </Card>

                {/* Quota Usage */}
                <Card className={`border-l-4 hover:shadow-md transition-shadow ${isCritical ? 'border-l-red-500' : 'border-l-green-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Auslastung (Heute)</CardTitle>
                        <Calendar className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <div className={`text-3xl font-bold ${isCritical ? 'text-red-600' : 'text-gray-800'}`}>
                                {usedQuota} <span className="text-lg text-gray-400 font-normal">/ {limit}</span>
                            </div>
                            {/* Request Button Component */}
                            <QuotaRequestDialog currentLimit={limit} />
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-gray-500">{usagePercent}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Gebuchte Termine heute.
                        </p>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
