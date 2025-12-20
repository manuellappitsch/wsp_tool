"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { updateCourseVisibility } from "@/actions/content";
import { Eye, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
    course: {
        id: string;
        title: string;
        published_for_admin?: boolean;
        published_for_user?: boolean;
    };
    isOpen: boolean;
    onClose: () => void;
}

export function CoursePublishingDialog({ course, isOpen, onClose }: Props) {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(course.published_for_admin || false);
    const [isUser, setIsUser] = useState(course.published_for_user || false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await updateCourseVisibility(course.id, isAdmin, isUser);
            if (res.success) {
                router.refresh(); // Refresh Data
                onClose();
            } else {
                alert("Fehler beim Speichern");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Veröffentlichung: {course.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* B2B Admin Option */}
                    <div className="flex items-center justify-between space-x-4 border p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center space-x-3">
                            <ShieldCheck className="w-5 h-5 text-purple-600" />
                            <div className="space-y-0.5">
                                <Label className="text-base">B2B Geschäftsführer</Label>
                                <p className="text-xs text-gray-500">Sichtbar im B2B Admin Bereich</p>
                            </div>
                        </div>
                        <Switch
                            checked={isAdmin}
                            onCheckedChange={setIsAdmin}
                        />
                    </div>

                    {/* Employee Option */}
                    <div className="flex items-center justify-between space-x-4 border p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center space-x-3">
                            <Users className="w-5 h-5 text-blue-600" />
                            <div className="space-y-0.5">
                                <Label className="text-base">Mitarbeiter App</Label>
                                <p className="text-xs text-gray-500">Sichtbar für alle Mitarbeiter</p>
                            </div>
                        </div>
                        <Switch
                            checked={isUser}
                            onCheckedChange={setIsUser}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Abbrechen</Button>
                    <Button onClick={handleSave} className="bg-[#163B40] hover:bg-[#163B40]/90" disabled={saving}>
                        {saving ? "Speichere..." : "Speichern"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
