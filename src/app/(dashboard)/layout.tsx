import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { DualBrandLogo } from "@/components/branding/DualBrandLogo";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    // Fetch Tenant Details if user belongs to one
    let tenantName: string | undefined = undefined;
    let tenantLogoUrl = undefined;

    if (session.user.role !== "B2C_CUSTOMER") {
        tenantName = "Partner"; // Default for B2B/Admins
    }

    if (session.user.tenantId) {
        const tenant = await db.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: { companyName: true, logoUrl: true }
        });
        if (tenant) {
            tenantName = tenant.companyName;
            tenantLogoUrl = tenant.logoUrl || undefined;
        }
    }

    // Fetch Unread Notifications for Global Admin
    let unreadCount = 0;
    if (session.user.role === "GLOBAL_ADMIN") {
        const { getUnreadNotificationCount } = await import("@/actions/notifications");
        unreadCount = await getUnreadNotificationCount();
    }

    return (
        <div className="flex h-screen bg-[#F3F4F6]">
            {/* Sidebar (Desktop) */}
            <Sidebar userRole={session.user.role} className="hidden md:flex" unreadNotifications={unreadCount} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm border-b z-10">
                    <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center md:hidden">
                            {/* Mobile menu trigger could go here */}
                            <span className="font-bold text-[#163B40]">WSP Portal</span>
                        </div>
                        <div className="hidden md:flex items-center">
                            {/* Logo might be redundant if we have sidebar menu title, 
                                 but user requested specific Branding. 
                                 Let's keep DualBrandLogo in Header as 'Brand Area' */}
                            <DualBrandLogo
                                customerName={tenantName}
                                customerLogoUrl={tenantLogoUrl}
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700">
                                {session.user.name}
                            </span>
                            {/* Avatar or other controls */}
                        </div>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
