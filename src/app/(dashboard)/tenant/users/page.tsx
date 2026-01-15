import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersManagementClient } from "@/components/tenant/UsersManagementClient";

export default async function TenantUsersPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.email) return null;

    // 1. Resolve Tenant Context via Profile
    const profile = await db.profile.findFirst({
        where: { email: session.user.email },
        select: { tenantId: true }
    });

    if (!profile || !profile.tenantId) {
        return <div className="p-8">Zugriff verweigert. Kein Partner-Account gefunden.</div>;
    }

    const tenantId = profile.tenantId;

    // 2. Fetch Employees (Role USER, same tenant)
    // We explicitly exclude other Admins if "Users" page implies normal employees.
    const employees = await db.profile.findMany({
        where: {
            tenantId: tenantId,
            role: "USER"
        },
        orderBy: {
            lastName: 'asc'
        }
    });

    return <UsersManagementClient initialEmployees={employees} tenantId={tenantId} />;
}
