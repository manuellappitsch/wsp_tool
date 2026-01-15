"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Trash2, Pencil, CheckCircle } from "lucide-react";
import { useActionState } from "react";
import { createAdminBooking, cancelBooking, moveBooking } from "@/actions/admin-booking";
import { getCustomersForBooking, getB2BUsersForBooking } from "@/actions/customer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Initial State for Server Action
const initialState = {
    success: false,
    message: ""
};

interface UserOption {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    tenant?: {
        name: string;
    };
}

interface CustomerOption {
    id: string;
    firstName: string;
    lastName: string;
    care_level: number;
    credits: number;
}

interface Props {
    timeslotId: string;
    isOpen: boolean;
    onClose: () => void;
    currentLoad: number;
    capacity: number;
    existingBookings?: any[];
    availableSlots?: { id: string; startTime: string | Date }[];
}

export function BookingDialog({ timeslotId, isOpen, onClose, currentLoad, capacity, existingBookings = [], availableSlots = [] }: Props) {
    const [state, formAction] = useActionState(createAdminBooking, initialState);

    // Track selected timeslot (initially from prop)
    const [selectedSlotId, setSelectedSlotId] = useState(timeslotId);

    // Sync when prop changes
    useEffect(() => {
        setSelectedSlotId(timeslotId);
    }, [timeslotId]);

    // Helper to format time for display
    const formatSlotTime = (t: string | Date) => {
        if (t instanceof Date) {
            // Force UTC Face Value logic if needed, or simple format if local match
            // Assuming t is UTC (Prisma), we want HH:mm
            const h = t.getUTCHours().toString().padStart(2, '0');
            const m = t.getUTCMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
        }
        if (typeof t === 'string') {
            return t.substring(0, 5);
        }
        return "??:??";
    };

    // UI State
    const [activeTab, setActiveTab] = useState<"B2C" | "B2B">("B2C");
    const [duration, setDuration] = useState("30");
    const [loading, setLoading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Reschedule State
    const [isMoving, setIsMoving] = useState(false);
    const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");

    // Search State
    const [customerSearch, setCustomerSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    // Data State
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [b2bUsers, setB2bUsers] = useState<UserOption[]>([]);

    // Selection State
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

    // Fetch data on open
    useEffect(() => {
        if (isOpen) {
            setLoading(true);

            // Reset Selections
            setSelectedCustomer(null);
            setSelectedUser(null);
            setCustomerSearch("");
            setUserSearch("");
            setDuration("30");
            setIsCancelling(false);

            Promise.all([
                getCustomersForBooking(),
                getB2BUsersForBooking()
            ]).then(([c, u]) => {
                setCustomers(c.map((cust: any) => ({
                    ...cust,
                    care_level: cust.careLevel || cust.care_level || 0,
                    credits: cust.credits || 0
                })));
                setB2bUsers(u.map((user: any) => ({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    tenant: user.tenant ? { name: user.tenant.name } : undefined
                })));
                setLoading(false);
            });
        }
    }, [isOpen]);

    // Handle Success
    useEffect(() => {
        if (state.success) {
            onClose();
        }
    }, [state.success, onClose]);

    const handleSubmit = async (formData: FormData) => {
        if (loading) return;
        await formAction(formData);
    };

    const handleCancel = async (bookingId: string) => {
        setIsCancelling(true);
        const res = await cancelBooking(bookingId);
        setIsCancelling(false);

        if (res.success) {
            onClose();
        } else {
            alert(res.message);
        }
    };

    const handleMove = async () => {
        if (!editingBookingId || !newDate || !newTime) return;
        setLoading(true);
        const res = await moveBooking(editingBookingId, newDate, newTime);
        setLoading(false);

        if (res.success) {
            onClose();
        } else {
            alert(res.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Terminverwaltung</DialogTitle>
                    <div className="flex gap-2 text-sm text-gray-500">
                        <Badge variant="outline" className={currentLoad >= capacity ? "bg-red-50 text-red-700 hover:bg-red-50" : "bg-green-50 text-green-700 hover:bg-green-50"}>
                            Auslastung: {currentLoad}/{capacity}
                        </Badge>
                    </div>
                </DialogHeader>

                {/* EXISTING BOOKINGS LIST */}
                {existingBookings.length > 0 && (
                    <div className="mb-6 bg-gray-50 border rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Gebuchte Teilnehmer ({existingBookings.length})</h4>
                        <div className="space-y-2">
                            {existingBookings.map((booking) => {
                                const name = booking.b2cCustomer
                                    ? `${booking.b2cCustomer.firstName} ${booking.b2cCustomer.lastName}`
                                    : (booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : "Unbekannt");
                                const level = booking.care_level_snapshot || booking.b2cCustomer?.careLevel || 0;
                                const isCompany = !!booking.user;

                                return (
                                    <div key={booking.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">{name}</div>
                                            <div className="text-xs text-gray-500">
                                                {isCompany ? "Firmenkunde" : "Privatkunde"} • Lvl {level}
                                                {booking.status === "COMPLETED" && (
                                                    <span className="ml-2 inline-flex items-center text-green-600 font-bold">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Eingecheckt
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                                                onClick={() => {
                                                    setEditingBookingId(booking.id);
                                                    setIsMoving(true);
                                                    setNewDate("");
                                                    setNewTime("");
                                                }}
                                                disabled={isCancelling || isMoving}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleCancel(booking.id)}
                                                disabled={isCancelling || isMoving}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            {isMoving ? "Termin verschieben" : "Neue Buchung hinzufügen"}
                        </span>
                    </div>
                </div>

                {/* MOVE FORM or CREATE FORM */}
                {isMoving ? (
                    <div className="space-y-4 pt-4 bg-blue-50 p-4 rounded-md border border-blue-100">
                        <div className="text-sm font-medium text-blue-800">Neuen Zeitpunkt wählen:</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Datum</Label>
                                <Input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Uhrzeit</Label>
                                <Select value={newTime} onValueChange={setNewTime}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Zeit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 76 }).map((_, i) => {
                                            const startHour = 7;
                                            const startMin = 30;

                                            const totalMinutes = i * 10;
                                            const hour = startHour + Math.floor((startMin + totalMinutes) / 60);
                                            const min = (startMin + totalMinutes) % 60;

                                            const time = `${hour < 10 ? '0' : ''}${hour}:${min < 10 ? '0' : ''}${min}`;

                                            if (hour > 20 || (hour === 20 && min > 0)) return null;

                                            return (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => { setIsMoving(false); setEditingBookingId(null); }}
                            >
                                Abbrechen
                            </Button>
                            <Button
                                type="button"
                                onClick={handleMove}
                                disabled={!newDate || !newTime}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Speichern
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Time Selector (Only if alternative slots provided) */}
                        {availableSlots.length > 0 && !isMoving && (
                            <div className="space-y-2 bg-gray-50 p-3 rounded border mt-4">
                                <Label>Genau Startzeit wählen</Label>
                                <Select value={selectedSlotId} onValueChange={setSelectedSlotId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Zeit wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSlots.map(slot => (
                                            <SelectItem key={slot.id} value={slot.id}>
                                                {formatSlotTime(slot.startTime)} Uhr
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <form action={handleSubmit} className="space-y-4 pt-4">
                            <input type="hidden" name="timeslotId" value={selectedSlotId} />
                            <input type="hidden" name="type" value={activeTab} />

                            {/* Duration Selection */}
                            <div className="space-y-2">
                                <Label>Dauer</Label>
                                <Select name="duration" value={duration} onValueChange={setDuration}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Dauer wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 Minuten (1 Einheit)</SelectItem>
                                        <SelectItem value="60">60 Minuten (2 Einheiten)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "B2C" | "B2B")} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="B2C">B2C (Privat)</TabsTrigger>
                                    <TabsTrigger value="B2B">B2B (Firmen)</TabsTrigger>
                                </TabsList>

                                {/* B2C TAB */}
                                <TabsContent value="B2C" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>B2C Kunde Suchen</Label>
                                        <input type="hidden" name="b2cCustomerId" value={selectedCustomer?.id || ""} />
                                        <input type="hidden" name="careLevel" value={selectedCustomer?.care_level || 2} />

                                        <div className="border rounded-md p-2 space-y-2">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Name suchen..."
                                                    className="pl-8"
                                                    value={customerSearch}
                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-[150px] overflow-y-auto space-y-1">
                                                {customers
                                                    .filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(customerSearch.toLowerCase()))
                                                    .map(customer => (
                                                        <div
                                                            key={customer.id}
                                                            onClick={() => setSelectedCustomer(customer)}
                                                            className={`p-2 text-sm rounded cursor-pointer flex justify-between items-center ${selectedCustomer?.id === customer.id ? 'bg-[#163B40] text-white' : 'hover:bg-gray-100'}`}
                                                        >
                                                            <div>
                                                                <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                                                                <div className={`text-xs ${selectedCustomer?.id === customer.id ? 'text-gray-300' : 'text-gray-500'}`}>
                                                                    Level: {customer.care_level} | Verfügbar: {customer.credits} Credits
                                                                </div>
                                                            </div>
                                                            {selectedCustomer?.id === customer.id && <div className="text-xs">Ausgewählt</div>}
                                                        </div>
                                                    ))}
                                                {customers.length === 0 && <div className="text-xs text-gray-500 text-center p-2">Keine Kunden gefunden</div>}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* B2B TAB */}
                                <TabsContent value="B2B" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Mitarbeiter Suchen</Label>
                                        <input type="hidden" name="userId" value={selectedUser?.id || ""} />

                                        <div className="border rounded-md p-2 space-y-2">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Mitarbeiter suchen..."
                                                    className="pl-8"
                                                    value={userSearch}
                                                    onChange={(e) => setUserSearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-[150px] overflow-y-auto space-y-1">
                                                {b2bUsers
                                                    .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()))
                                                    .map(user => (
                                                        <div
                                                            key={user.id}
                                                            onClick={() => setSelectedUser(user)}
                                                            className={`p-2 text-sm rounded cursor-pointer flex justify-between items-center ${selectedUser?.id === user.id ? 'bg-[#163B40] text-white' : 'hover:bg-gray-100'}`}
                                                        >
                                                            <div>
                                                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                                                <div className={`text-xs ${selectedUser?.id === user.id ? 'text-gray-300' : 'text-gray-500'}`}>
                                                                    {user.tenant?.name || "Keine Firma"}
                                                                </div>
                                                            </div>
                                                            {selectedUser?.id === user.id && <div className="text-xs">Ausgewählt</div>}
                                                        </div>
                                                    ))}
                                                {b2bUsers.length === 0 && <div className="text-xs text-gray-500 text-center p-2">Keine Mitarbeiter gefunden</div>}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {state.message && (
                                <div className={`text-sm font-medium ${state.success ? 'text-green-600' : 'text-red-500'} bg-gray-50 p-2 rounded text-center`}>
                                    {state.message}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
                                <Button type="submit" className="bg-[#163B40] hover:bg-[#163B40]/90">
                                    Termin Buchen
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
