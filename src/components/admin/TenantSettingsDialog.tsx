"use client";

import React, { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateTenant, deleteUser, archiveTenant, createTenantUser, updateTenantUser, resetTenantUserPassword, resetTenantAdminPassword } from "@/actions/tenant";
import { Badge } from "@/components/ui/badge";
import { Archive, RotateCcw, Plus, Pencil, X, Save, Key, Copy, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Define simplified type for what we get from Prisma
interface TenantWithUsers {
    id: string;
    companyName: string;
    logoUrl: string | null;
    isActive: boolean;
    dailyKontingent: number;
    billingAddress?: string | null;
    billingZip?: string | null;
    billingCity?: string | null;
    billingEmail?: string | null;
    users: any[];
    admins?: any[];
}

interface Props {
    tenant: TenantWithUsers;
}

export function TenantSettingsDialog({ tenant }: Props) {
    // ... existing hooks
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // ... existing handlers (handleUpdate, etc.) -> No changes needed there, assuming they work generically with formData

    const handleUpdate = async (formData: FormData) => {

        const logoFile = formData.get("logo");


        startTransition(async () => {
            try {
                // Add ID to form data
                formData.append("tenantId", tenant.id);


                const result = await updateTenant(formData);


                if (result.error) {

                    toast.error(result.error);
                } else {

                    toast.success("Einstellungen gespeichert!");
                    setOpen(false);
                }
            } catch (err: any) {

                toast.error("Ein unerwarteter Client-Fehler ist aufgetreten: " + (err.message || String(err)));
            }
        });
    };

    const [userMode, setUserMode] = useState<"list" | "create" | "edit">("list");
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [successData, setSuccessData] = useState<{ password: string, email: string } | null>(null);
    const [copied, setCopied] = useState(false);

    // ... Helper functions
    const handleCreateUser = async (formData: FormData) => {
        // ... existing implementation

        startTransition(async () => {

            formData.append("tenantId", tenant.id);
            const email = formData.get("email") as string;


            try {
                // @ts-ignore
                const result = await createTenantUser(formData);


                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success("Mitarbeiter erstellt.");
                    if (result.password) {
                        setSuccessData({ password: result.password, email });
                    }
                    setUserMode("list");
                }
            } catch (e) {

                toast.error("Ein unerwarteter Fehler ist aufgetreten.");
            }
        });
    };

    // ... keep existing handlers (handleResetPassword, handleCopyPassword, handleUpdateUser, handleDeleteUser, handleArchive)
    const handleResetPassword = async () => {
        if (!editingUser) return;
        if (!confirm("Passwort wirklich zurücksetzen? Der Mitarbeiter erhält eine E-Mail.")) return;

        startTransition(async () => {
            const result = await resetTenantUserPassword(editingUser.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Passwort zurückgesetzt.");
                if (result.password) {
                    setSuccessData({ password: result.password, email: editingUser.email });
                }
            }
        });
    };

    const handleCopyPassword = () => {
        if (successData?.password) {
            navigator.clipboard.writeText(successData.password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Passwort kopiert!");
        }
    };

    const handleUpdateUser = async (formData: FormData) => {
        startTransition(async () => {
            formData.append("userId", editingUser.id);
            // Checkbox handling hack for FormData
            if (!formData.get("isActive")) {
                formData.append("isActive", "false"); // if unchecked not sent
            }

            const result = await updateTenantUser(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Mitarbeiter aktualisiert.");
                setUserMode("list");
                setEditingUser(null);
            }
        });
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Möchten Sie diesen Mitarbeiter wirklich löschen?")) return;

        startTransition(async () => {
            const result = await deleteUser(userId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Mitarbeiter gelöscht.");
            }
        });
    };

    const handleArchive = async () => {
        const action = tenant.isActive ? "archivieren" : "reaktivieren";
        if (!confirm(`Möchten Sie diesen Partner wirklich ${action}?`)) return;

        startTransition(async () => {
            const result = await archiveTenant(tenant.id, !tenant.isActive);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Partner erfolgreich ${tenant.isActive ? 'archiviert' : 'reaktiviert'}.`);
                setOpen(false);
            }
        });
    };
    const [adminPassword, setAdminPassword] = useState<string | null>(null);

    const handleResetAdminPassword = async () => {
        if (!tenant.admins?.[0]) return;
        if (!confirm("Admin-Passwort wirklich zurücksetzen? Der Admin erhält eine E-Mail.")) return;

        startTransition(async () => {
            // @ts-ignore
            const result = await resetTenantAdminPassword(tenant.admins[0].id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Admin-Passwort neu generiert.");
                if (result.password) {
                    setAdminPassword(result.password);
                }
            }
        });
    };

    // Get the first admin (CEO) if available
    const admin = tenant.admins && tenant.admins.length > 0 ? tenant.admins[0] : null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#163B40]">
                    <Settings className="h-4 w-4 mr-2" />
                    Einstellungen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Einstellungen: {tenant.companyName}
                        {!tenant.isActive && <Badge variant="destructive">Archiviert</Badge>}
                    </DialogTitle>
                    <DialogDescription>
                        Bearbeiten Sie Rechnungsdaten, Kontingente und Mitarbeiter.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="master" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="master">Stammdaten & Kontingent</TabsTrigger>
                        <TabsTrigger value="employees">Mitarbeiter ({tenant.users.length})</TabsTrigger>
                    </TabsList>

                    {/* STAMMDATEN */}
                    <TabsContent value="master">
                        <form action={handleUpdate} className="space-y-4 py-4">
                            {/* ADMIN CREDENTIALS DISPLAY */}
                            {admin && (
                                <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4">
                                    <h4 className="flex items-center text-sm font-semibold text-slate-800 mb-2">
                                        <Key className="h-4 w-4 mr-2 text-slate-500" />
                                        Admin Zugang (CEO)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500 block text-xs">E-Mail</span>
                                            <span className="font-medium text-slate-900">{admin.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-xs">Initial-Passwort</span>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-white border rounded px-2 py-0.5 font-mono text-xs">
                                                    {adminPassword || admin.initialPassword || "••••••••"}
                                                </code>
                                                {(adminPassword || admin.initialPassword) && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(adminPassword || admin.initialPassword);
                                                            toast.success("Kopiert");
                                                        }}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    title="Neues Passwort generieren"
                                                    onClick={handleResetAdminPassword}
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Firmenname</Label>
                                    <Input name="companyName" defaultValue={tenant.companyName} required />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Logo ändern</Label>
                                    <div className="flex items-center gap-4">
                                        {tenant.logoUrl && (
                                            <div className="h-10 w-10 border rounded overflow-hidden flex-shrink-0">
                                                <img src={tenant.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <Input name="logo" type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" />
                                    </div>
                                    <p className="text-[10px] text-gray-500">Upload neuer Datei ersetzt das bestehende Logo.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tgl. Kontingent</Label>
                                    <Input name="dailyKontingent" type="number" defaultValue={tenant.dailyKontingent} required />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3 text-sm text-gray-500">Rechnungsdaten</h4>
                                <div className="space-y-2">
                                    <Label>Straße</Label>
                                    <Input name="billingAddress" defaultValue={tenant.billingAddress || ""} placeholder="Straße..." />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2 col-span-1">
                                        <Label>PLZ</Label>
                                        <Input name="billingZip" defaultValue={tenant.billingZip || ""} placeholder="PLZ" />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Ort</Label>
                                        <Input name="billingCity" defaultValue={tenant.billingCity || ""} placeholder="Ort" />
                                    </div>
                                </div>
                                <div className="space-y-2 mt-2">
                                    <Label>Rechnungs E-Mail</Label>
                                    <Input name="billingEmail" type="email" defaultValue={tenant.billingEmail || ""} placeholder="invoice@..." />
                                </div>
                            </div>

                            <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className={`${tenant.isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                                    onClick={handleArchive}
                                >
                                    {tenant.isActive ? (
                                        <>
                                            <Archive className="mr-2 h-4 w-4" />
                                            Archivieren (Kündigung)
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Reaktivieren
                                        </>
                                    )}
                                </Button>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                                    <Button type="submit" className="bg-[#163B40]" disabled={isPending}>
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Speichern"}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    {/* EMPLOYEES */}
                    <TabsContent value="employees">
                        <div className="py-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium">
                                    {userMode === "list" && "Mitarbeiter Liste"}
                                    {userMode === "create" && "Neuer Mitarbeiter"}
                                    {userMode === "edit" && "Mitarbeiter bearbeiten"}
                                </h3>
                                {userMode === "list" && (
                                    <Button size="sm" onClick={() => setUserMode("create")} className="gap-2 bg-[#163B40]">
                                        <Plus className="h-4 w-4" /> Neu
                                    </Button>
                                )}
                                {userMode !== "list" && (
                                    <Button size="sm" variant="ghost" onClick={() => { setUserMode("list"); setEditingUser(null); }}>
                                        <X className="h-4 w-4" /> Abbrechen
                                    </Button>
                                )}
                            </div>

                            {/* SUCCESS PASSWORD VIEW */}
                            {successData ? (
                                <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center space-y-4">
                                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-green-600">
                                        <Key className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-lg text-green-900">Zugangsdaten erstellt</h3>
                                    <p className="text-sm text-green-800">
                                        Der Mitarbeiter <strong>{successData.email}</strong> wurde benachrichtigt.<br />
                                        Hier ist das Passwort zur Sicherheit:
                                    </p>

                                    <div className="flex items-center justify-center gap-2 bg-white p-3 rounded border border-green-200 max-w-xs mx-auto">
                                        <code className="bg-gray-100 px-2 py-1 rounded text-lg font-mono text-gray-800 tracking-wider">
                                            {successData.password}
                                        </code>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500" onClick={handleCopyPassword}>
                                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    <Button onClick={() => setSuccessData(null)} className="bg-green-700 hover:bg-green-800 text-white w-full max-w-xs">
                                        Schließen
                                    </Button>
                                    <p className="text-xs text-green-700 opacity-75">
                                        Dieses Fenster schließt automatisch beim Verlassen.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {userMode === "list" ? (
                                        <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                                            {tenant.users.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">Keine Mitarbeiter gefunden.</div>
                                            ) : (
                                                tenant.users.map((user) => (
                                                    <div key={user.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                                                        <div>
                                                            <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                                                            <p className="text-xs text-gray-500">{user.email}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={user.isActive ? "secondary" : "destructive"} className="text-[10px]">
                                                                {user.isActive ? "Aktiv" : "Inaktiv"}
                                                            </Badge>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-gray-500 hover:text-[#163B40]"
                                                                onClick={() => {
                                                                    setEditingUser(user);
                                                                    setUserMode("edit");
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                disabled={isPending}
                                                                onClick={() => handleDeleteUser(user.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        <form action={userMode === "create" ? handleCreateUser : handleUpdateUser} className="space-y-4 border p-4 rounded-md">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Vorname</Label>
                                                    <Input name="firstName" defaultValue={editingUser?.firstName || ""} required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Nachname</Label>
                                                    <Input name="lastName" defaultValue={editingUser?.lastName || ""} required />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>E-Mail</Label>
                                                <Input name="email" type="email" defaultValue={editingUser?.email || ""} required />
                                            </div>

                                            {userMode === "edit" && (
                                                <div className="space-y-4 pt-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Switch name="isActive" value="true" defaultChecked={editingUser?.isActive} id="active-mode" />
                                                        <Label htmlFor="active-mode">Account ist aktiv</Label>
                                                    </div>

                                                    <div className="border-t pt-2 space-y-3">
                                                        <h4 className="text-xs font-semibold uppercase text-gray-400">Sicherheit</h4>

                                                        {editingUser?.initialPassword && (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                                                                <p className="text-yellow-800 text-xs mb-1 font-semibold">Initial-Passwort:</p>
                                                                <div className="flex items-center justify-between">
                                                                    <code className="text-gray-800 font-mono tracking-wide">{editingUser.initialPassword}</code>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(editingUser.initialPassword);
                                                                            toast.success("Passwort kopiert");
                                                                        }}
                                                                    >
                                                                        <Copy className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                                <p className="text-[10px] text-yellow-700 mt-1">
                                                                    Dies ist das zuletzt generierte Passwort. Wenn der Nutzer es geändert hat, stimmt dies nicht mehr.
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <Button type="button" variant="outline" size="sm" onClick={handleResetPassword} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                                                                <Key className="mr-2 h-4 w-4" />
                                                                Passwort zurücksetzen
                                                            </Button>
                                                            <p className="text-[10px] text-gray-500 mt-1">
                                                                Generiert ein neues Passwort und sendet es per E-Mail.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button type="button" variant="outline" onClick={() => setUserMode("list")}>Abbrechen</Button>
                                                <Button type="submit" disabled={isPending} className="bg-[#163B40]">
                                                    {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save className="h-4 w-4 mr-2" /> Speichern</>}
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                            {userMode === "list" && !successData && (
                                <p className="text-xs text-gray-500">
                                    Hinweis: Neue Mitarbeiter erhalten automatisch eine E-Mail mit ihren Zugangsdaten.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
