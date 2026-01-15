"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
    Check,
    Trash2,
    Bell,
    Info,
    AlertTriangle,
    XCircle,
    CheckCircle2,
    MailOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead
} from "@/actions/notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
}

interface NotificationListProps {
    initialNotifications: Notification[];
}

export function NotificationList({ initialNotifications }: NotificationListProps) {
    // Optimistic update could be complex, for now we rely on server action + router.refresh (via revalidatePath in action)
    // But to make it snappy, we can assume success locally or just trust the action returns fast.
    // Actually, Server Actions with revalidatePath re-renders the server component, but we are inside a client component receiving props.
    // The parent page will re-render, passing new props.

    // However, to avoid "flash" we can use optimistic state merely for UI feedback if needed, 
    // but standard Next.js flow is: Action -> Server Revalidate -> Page Update -> New Props.

    // Let's use local state for immediate feedback
    const [optimisticIds, setOptimisticIds] = useState<string[]>([]); // IDs being processed

    const getIcon = (type: string) => {
        switch (type) {
            case "CANCEL": return <XCircle className="w-5 h-5 text-red-500" />;
            case "WARNING": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case "SUCCESS": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const handleMarkRead = async (id: string) => {
        setOptimisticIds(prev => [...prev, id]);
        await markNotificationAsRead(id);
        setOptimisticIds(prev => prev.filter(pid => pid !== id));
        toast.success("Als gelesen markiert");
    };

    const handleDelete = async (id: string) => {
        setOptimisticIds(prev => [...prev, id]);
        await deleteNotification(id);
        setOptimisticIds(prev => prev.filter(pid => pid !== id));
        toast.success("Benachrichtigung gelöscht");
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead();
        toast.success("Alle als gelesen markiert");
    };

    if (initialNotifications.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Keine Benachrichtigungen</h3>
                <p className="text-gray-500">Alles erledigt! Du bist auf dem neuesten Stand.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <MailOpen className="w-4 h-4 mr-2" />
                    Alle als gelesen markieren
                </Button>
            </div>

            <div className="space-y-3">
                {initialNotifications.map((notification) => {
                    const isProcessing = optimisticIds.includes(notification.id);

                    return (
                        <div
                            key={notification.id}
                            className={cn(
                                "group flex gap-4 p-4 rounded-xl border transition-all duration-200",
                                notification.isRead ? "bg-white border-gray-100" : "bg-blue-50/50 border-blue-100 shadow-sm",
                                isProcessing && "opacity-50 pointer-events-none"
                            )}
                        >
                            <div className="mt-1 flex-shrink-0">
                                {getIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className={cn(
                                        "text-sm font-semibold truncate pr-20",
                                        notification.isRead ? "text-gray-700" : "text-gray-900"
                                    )}>
                                        {notification.title}
                                    </h4>
                                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                        {format(new Date(notification.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                                    </span>
                                </div>

                                <p className={cn(
                                    "text-sm mt-1",
                                    notification.isRead ? "text-gray-500" : "text-gray-800"
                                )}>
                                    {notification.message}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 items-end justify-start opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                                {!notification.isRead && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                        onClick={() => handleMarkRead(notification.id)}
                                        title="Als gelesen markieren"
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(notification.id)}
                                    title="Löschen"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
