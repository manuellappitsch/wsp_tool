"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockKeyhole, Eye, EyeOff, Save, Loader2, RotateCcw } from "lucide-react";
import { updateB2CCustomer, resetB2CCustomerPassword } from "@/actions/b2c-customer";
import { toast } from "sonner";
import { format } from "date-fns";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";

interface CustomerData {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    credits: number;
    initialPassword?: string | null;
    subscriptionEndDate: Date | null;
    subscriptionType: string | null;
    subscriptionStartDate: Date | null;
    isActive: boolean;
}

export function EditCustomerDialog({ customer }: { customer: CustomerData }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState(customer.firstName);
    const [lastName, setLastName] = useState(customer.lastName);
    const [email, setEmail] = useState(customer.email);
    const [phone, setPhone] = useState(customer.phone || "");
    const [credits, setCredits] = useState(customer.credits);

    // Subscription State
    const [subscriptionType, setSubscriptionType] = useState(customer.subscriptionType || "NONE");
    const [subscriptionStartDate, setSubscriptionStartDate] = useState(
        customer.subscriptionStartDate ? format(new Date(customer.subscriptionStartDate), "yyyy-MM-dd") : ""
    );

    // Security State
    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState<string | null>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("customerId", customer.id);
            formData.append("firstName", firstName || "");
            formData.append("lastName", lastName || "");
            formData.append("email", email || "");
            formData.append("phone", phone);
            formData.append("credits", credits.toString());

            // Append Subscription Data
            formData.append("subscriptionType", subscriptionType);
            if (subscriptionStartDate) formData.append("subscriptionStartDate", subscriptionStartDate);

            const result = await updateB2CCustomer(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Kundendaten gespeichert!");
                setOpen(false);
            }
        } catch (err) {
            toast.error("Fehler beim Speichern.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setIsLoading(true);
        setNewPassword(null);
        try {
            const result = await resetB2CCustomerPassword(customer.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Passwort zurückgesetzt & gesendet!");
                setNewPassword(result.password || "Unbekannt");
            }
        } catch (err) {
            toast.error("Fehler beim Reset.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900" title="Details & Sicherheit bearbeiten">
                    <LockKeyhole className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-xl text-[#163B40]">
                        {customer.lastName}, {customer.firstName} bearbeiten
                    </DialogTitle>
                    <DialogDescription>
                        Verwalte Daten, Zugangsdaten und Status des Kunden.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                    <div className="px-6 border-b">
                        <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
                            <TabsTrigger
                                value="details"
                                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Details
                            </TabsTrigger>
                            <TabsTrigger
                                value="security"
                                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Sicherheit
                            </TabsTrigger>
                            <TabsTrigger
                                value="status"
                                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                                Status
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* TAB: DETAILS */}
                    <TabsContent value="details" className="p-6 m-0 focus-visible:outline-none">
                        <form id="customer-form" onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Vorname</Label>
                                    <Input id="firstName" value={firstName || ""} onChange={e => setFirstName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nachname</Label>
                                    <Input id="lastName" value={lastName || ""} onChange={e => setLastName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail Adresse {` `}
                                    <span className="text-xs text-gray-400 font-normal">
                                        (Ausfüllen zum "Online"-Schalten)
                                    </span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email || ""}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder={customer.email ? "" : "Für Login ausfüllen..."}
                                    required={false} // Backend validates based on Offline status
                                />
                                {!customer.email && (
                                    <p className="text-xs text-amber-600">
                                        Kund:in ist aktuell <strong>Offline</strong>. E-Mail eintragen, um Zugangsdaten zu senden.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefonnummer (Optional)</Label>
                                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+43 ..." />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={isLoading} className="bg-[#163B40] hover:bg-[#163B40]/90">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Speichern
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    {/* TAB: SECURITY */}
                    <TabsContent value="security" className="p-6 m-0 focus-visible:outline-none space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-amber-900 font-semibold">Initial-Passwort</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                    {showPassword ? "Verbergen" : "Anzeigen"}
                                </Button>
                            </div>

                            <div className={`text-lg font-mono text-center p-3 rounded bg-white border border-amber-100 ${showPassword ? "" : "blur-sm select-none"}`}>
                                {customer.initialPassword ? (
                                    showPassword ? customer.initialPassword : "••••••••••••"
                                ) : (
                                    <span className="text-gray-400 italic text-sm font-sans">Passwort wurde geändert oder ist nicht verfügbar</span>
                                )}
                            </div>
                            <p className="text-xs text-amber-700">
                                <strong>Hinweis:</strong> Dies ist das automatisch generierte Start-Passwort. Sollte der Kunde es geändert haben, ist es hier nicht sichtbar.
                            </p>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Passwort vergessen?</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Du kannst das Passwort zurücksetzen. Der Kunde erhält sofort eine E-Mail mit dem neuen Passwort.
                            </p>

                            {newPassword && (
                                <div className="bg-green-50 border border-green-200 text-green-900 p-4 rounded-md mb-4 text-center">
                                    <strong>Neues Passwort:</strong>
                                    <div className="font-mono text-xl mt-1">{newPassword}</div>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                onClick={handleResetPassword}
                                disabled={isLoading}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Passwort zurücksetzen & E-Mail senden
                            </Button>
                        </div>
                    </TabsContent>

                    {/* TAB: STATUS */}
                    <TabsContent value="status" className="p-6 m-0 focus-visible:outline-none space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <Label className="text-gray-500 block mb-1">Verfügbare Credits</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={credits}
                                        onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                                        className="text-2xl font-bold text-[#163B40] h-12 w-full"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Hier kannst du Credits manuell korrigieren (auch abziehen).</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <Label className="text-gray-500 block mb-1">Abo Status</Label>
                                {customer.subscriptionEndDate && new Date(customer.subscriptionEndDate) > new Date() ? (
                                    <>
                                        <div className="text-xl font-bold text-green-600 mb-1">Aktiv</div>
                                        <div className="text-sm text-gray-600">
                                            Bis {format(new Date(customer.subscriptionEndDate), "dd.MM.yyyy")}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-xl font-bold text-gray-400">Kein aktives Abo</div>
                                )}
                            </div>
                        </div>

                        {/* Subscription Management */}
                        <div className="bg-white p-4 rounded-lg border space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-2">Abo Verwaltung</h4>

                            <div className="space-y-2">
                                <Label>Abo Typ wählen</Label>
                                <Select value={subscriptionType} onValueChange={setSubscriptionType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wähle ein Abo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">Kein Abo</SelectItem>
                                        {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id}>
                                                {plan.name} ({plan.price.toFixed(2)}€)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {subscriptionType !== "NONE" && (
                                <div className="space-y-2">
                                    <Label>Startdatum</Label>
                                    <Input
                                        type="date"
                                        value={subscriptionStartDate}
                                        onChange={e => setSubscriptionStartDate(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-gray-500">Das Enddatum wird automatisch berechnet.</p>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end">
                                <Button onClick={handleUpdate} disabled={isLoading} className="bg-[#163B40] hover:bg-[#163B40]/90">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Abo & Status Speichern
                                </Button>
                            </div>
                        </div>

                        <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Bestellhistorie</h4>
                            <p className="text-sm text-blue-700">
                                Die detaillierte Bestellhistorie wird in Kürze verfügbar sein.
                                Aktuell werden Guthaben und Abos direkt über die API oder den "Produkt hinzufügen" Dialog gesteuert.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
