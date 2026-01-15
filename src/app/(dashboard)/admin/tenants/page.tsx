import React from "react";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, ExternalLink, BarChart } from "lucide-react";
import Link from "next/link";
import { CreateTenantDialog } from "@/components/admin/CreateTenantDialog";
import { TenantSettingsDialog } from "@/components/admin/TenantSettingsDialog";

interface PageProps {
    searchParams: Promise<{ showArchived?: string }>;
}

export default async function AdminTenantsPage({ searchParams }: PageProps) {
    const { showArchived } = await searchParams;
    const isArchivedView = showArchived === "true";

    const whereStatus = isArchivedView ? false : true;

    // Fetch tenants with all profiles (employees + admins)
    const tenantsData = await db.tenant.findMany({
        where: {
            isActive: whereStatus
        },
        include: {
            profiles: true // Fetch all associated profiles to count them and pass to settings
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Map the result
    const tenants = tenantsData.map((tenant) => ({
        ...tenant,
        // Count all profiles associated with this tenant
        _count: { users: tenant.profiles.length },
        // For compatibility with TenantSettingsDialog which expects 'users' and 'admins' arrays 
        // derived from legacy tables, we map 'profiles' to satisfy the interface if needed.
        // Or better: Update TenantSettingsDialog to accept 'profiles'.
        // For now, let's pass 'users' as profiles.
        users: tenant.profiles
    }));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#163B40]">Partner Verwaltung</h1>
                    <p className="text-muted-foreground">Übersicht aller B2B Kunden und deren Status.</p>
                </div>
                <div className="flex gap-3">
                    <Link href={isArchivedView ? "/admin/tenants" : "/admin/tenants?showArchived=true"}>
                        <Button variant="outline" className={`${isArchivedView ? 'bg-gray-100' : ''}`}>
                            {isArchivedView ? "Aktive Partner anzeigen" : "Archiv anzeigen"}
                        </Button>
                    </Link>
                    <CreateTenantDialog />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.map((tenant) => (
                    <Card key={tenant.id} className={`shadow-md hover:shadow-lg transition-shadow border-none ${!tenant.isActive ? 'opacity-75 bg-gray-50' : ''}`}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 text-[#163B40]">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
                                    {tenant.logoUrl ? (
                                        <img src={tenant.logoUrl} alt={tenant.companyName} className="h-full w-full object-cover" />
                                    ) : (
                                        <Building2 className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{tenant.companyName}</CardTitle>
                                    <CardDescription>Seit {format(new Date(tenant.createdAt), 'dd.MM.yyyy', { locale: de })} dabei</CardDescription>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${tenant.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {tenant.isActive ? 'Aktiv' : 'Inaktiv'}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 mt-2">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                        <Users className="h-3 w-3" /> Mitarbeiter
                                    </div>
                                    <span className="text-lg font-bold text-[#163B40]">{tenant._count.users}</span>
                                </div>
                                <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                        <BarChart className="h-3 w-3" /> Kontingent
                                    </div>
                                    <span className="text-lg font-bold text-[#163B40]">{tenant.dailyKontingent} <span className="text-xs font-normal text-gray-400">/ Tag</span></span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t p-4 bg-gray-50/50 rounded-b-xl gap-2">
                            <TenantSettingsDialog tenant={tenant} />

                            <Link href={`/admin/tenants/${tenant.id}/dashboard`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full gap-2 bg-white hover:bg-gray-50">
                                    Dashboard öffnen <ExternalLink className="h-3 w-3" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}


                {/* Empty State / Add New Placeholder Card */}
                {tenants.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Noch keine Partner angelegt</h3>
                        <p className="text-gray-500 mb-6">Starten Sie jetzt mit dem ersten B2B Kunden.</p>
                        <CreateTenantDialog trigger={<Button>Ersten Partner erstellen</Button>} />
                    </div>
                )}
            </div>
        </div>
    );
}
