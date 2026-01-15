import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminNotifications } from "@/actions/notifications";
import { NotificationList } from "@/components/admin/NotificationList";
import { redirect } from "next/navigation";

export default async function AdminNotificationsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "GLOBAL_ADMIN") {
        return redirect("/");
    }

    const notifications = await getAdminNotifications();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#163B40]">Benachrichtigungen</h1>
                <p className="text-gray-500">System-Meldungen und wichtige Ereignisse.</p>
            </div>

            <NotificationList initialNotifications={notifications} />
        </div>
    );
}
