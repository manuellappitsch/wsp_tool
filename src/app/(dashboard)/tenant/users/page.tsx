

import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default async function TenantUsersPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.email) return null;

    // 1. Resolve Tenant Context
    let tenantId;

    // Check Users table
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('tenantId')
        .eq('email', session.user.email)
        .single();

    if (user) {
        tenantId = user.tenantId;
    } else {
        // Check TenantAdmin table
        const { data: admin } = await supabaseAdmin
            .from('tenant_admins')
            .select('tenantId')
            .eq('email', session.user.email)
            .single();

        if (admin) {
            tenantId = admin.tenantId;
        }
    }

    if (!tenantId) return <div className="p-8">Zugriff verweigert. Kein Partner-Account gefunden.</div>;

    // 2. Fetch Users
    const { data: employees, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('tenantId', tenantId)
        .order('lastName', { ascending: true });

    if (error) {
        return <div className="p-8">Fehler beim Laden der Mitarbeiter.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-[#163B40]">Mitarbeiter</h1>
                    <p className="text-muted-foreground">Verwalten Sie hier Ihr Team.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Team Übersicht</CardTitle>
                    <CardDescription>
                        {employees?.length || 0} Mitarbeiter im System
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!employees || employees.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p>Noch keine Mitarbeiter angelegt.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">E-Mail</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Registriert am</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y bg-white">
                                    {employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-[#163B40]">
                                                {emp.firstName} {emp.lastName}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 opacity-50" />
                                                    {emp.email}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={emp.isActive ? "secondary" : "destructive"} className="font-normal">
                                                    {emp.isActive ? "Aktiv" : "Inaktiv"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Calendar className="h-3 w-3 opacity-50" />
                                                    {format(new Date(emp.createdAt), 'dd.MM.yyyy', { locale: de })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
