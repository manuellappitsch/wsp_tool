"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Calendar,
    ShoppingBag,
    Settings,
    FileText,
    Video,
    LogOut,
    Building2,
    Newspaper,
    ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

interface SidebarProps {
    userRole: string; // GLOBAL_ADMIN, TENANT_ADMIN, USER
    className?: string;
}

export function Sidebar({ userRole, className }: SidebarProps) {
    const pathname = usePathname();

    const getNavItems = () => {
        switch (userRole) {
            case "GLOBAL_ADMIN":
                return [
                    { name: "Übersicht", href: "/admin", icon: LayoutDashboard },
                    { name: "Kalender", href: "/admin/calendar", icon: Calendar },
                    { name: "Aufgaben", href: "/admin/tasks", icon: ClipboardList },
                    { name: "B2B Kunden", href: "/admin/tenants", icon: Building2 },
                    { name: "Privatkunden", href: "/admin/customers", icon: Users },
                    { name: "Einstellungen", href: "/admin/settings", icon: Settings },
                ];
            case "TENANT_ADMIN":
                return [
                    { name: "Dashboard", href: "/tenant/dashboard", icon: LayoutDashboard },
                    // { name: "Kalender", href: "/tenant/calendar", icon: Calendar }, // Removed from Tenant
                    { name: "Mitarbeiter", href: "/tenant/users", icon: Users },
                    { name: "Analysen", href: "/tenant/analytics", icon: BarChart3 },
                    { name: "Content", href: "/tenant/content", icon: Video },
                    { name: "News", href: "/tenant/news", icon: Newspaper },
                    { name: "Einstellungen", href: "/tenant/settings", icon: Settings },
                ];
            case "USER":
                return [
                    { name: "Mein Training", href: "/user/dashboard", icon: Calendar },
                    { name: "Termine Buchen", href: "/user/booking", icon: Calendar }, // Or merge?
                    { name: "Shop", href: "/user/shop", icon: ShoppingBag },
                    { name: "Wissen", href: "/user/content", icon: FileText },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    return (
        <div className={cn("flex flex-col h-full bg-white border-r w-64", className)}>
            <div className="p-6">
                {/* Branding is in Header really, but could be here too. */}
                <h2 className="text-lg font-bold text-[#163B40]">Menu</h2>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-[#163B40] text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Abmelden
                </button>
            </div>
        </div>
    );
}
