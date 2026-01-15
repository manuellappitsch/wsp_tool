"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getUserProfile, toggleEmailNotifications } from "@/actions/profile";
import { toast } from "sonner";
import { Loader2, Settings } from "lucide-react";

export function ProfileSettingsDialog({ children, open, onOpenChange }: {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [loading, setLoading] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [userData, setUserData] = useState<any>(null);

    // Fetch data when dialog opens
    useEffect(() => {
        if (open) {
            setLoading(true);
            getUserProfile()
                .then((data) => {
                    if (data) {
                        setUserData(data);
                        setEmailEnabled(data.emailNotifications);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [open]);

    const handleToggle = async (checked: boolean) => {
        // Optimistic update
        setEmailEnabled(checked);

        const result = await toggleEmailNotifications(checked);
        if (result.error) {
            toast.error(result.error);
            // Revert
            setEmailEnabled(!checked);
        } else {
            toast.success("Einstellungen gespeichert");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Profileinstellungen</DialogTitle>
                    <DialogDescription>
                        Verwalte deine Benachrichtigungen und Kontoeinstellungen.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-base">E-Mail Benachrichtigungen</Label>
                                    <p className="text-sm text-gray-500">
                                        Terminbestätigungen, Erinnerungen & Stornierungen erhalten.
                                    </p>
                                </div>
                                <Switch
                                    checked={emailEnabled}
                                    onCheckedChange={handleToggle}
                                />
                            </div>
                        </div>

                        {userData && (
                            <div className="text-xs text-gray-400">
                                Angemeldet als: {userData.firstName} {userData.lastName} ({userData.email})
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
