
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { differenceInMonths, addMonths, format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { CalendarDays, Dumbbell, TrendingUp } from "lucide-react";
import { BookingActionButtons } from "@/components/booking/BookingActionButtons";
import { formatTimeUTC } from "@/lib/date-utils";

export default async function B2CDashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) return null;

    // Fetch Full Customer Profile
    const customer = await db.profile.findUnique({
        where: { id: session.user.id }
    });

    if (!customer) return <div>Kundenprofil nicht gefunden.</div>;

    // Calculate Stats
    const now = new Date();
    const hasActiveSubscription = customer.subscriptionEndDate && new Date(customer.subscriptionEndDate) > now;

    let usageCount = 0;
    const limit = 0; // Default 0 to avoid TS strict errors if not assigned, but logic below overrides it
    let periodEndStr = "";
    let calculatedLimit = 0;

    if (hasActiveSubscription && customer.subscriptionStartDate && customer.subscriptionType) {
        const startDate = new Date(customer.subscriptionStartDate);
        const monthIndex = differenceInMonths(now, startDate);

        calculatedLimit = 4;
        if (customer.subscriptionType.startsWith("INTENSE") && monthIndex < 2) {
            calculatedLimit = 8;
        }

        const periodStart = addMonths(startDate, monthIndex);
        const periodEnd = addMonths(startDate, monthIndex + 1);
        periodEndStr = format(periodEnd, "dd.MM.yyyy");

        // Count Bookings in Period
        // Note: Ideally we use a server function or raw query, but here we do it lightly via API for the view
        const { data: slotsInRange } = await supabaseAdmin
            .from('timeslots')
            .select('id')
            .gte('date', periodStart.toISOString())
            .lt('date', periodEnd.toISOString());

        const slotIds = slotsInRange?.map(s => s.id) || [];

        if (slotIds.length > 0) {
            const { count } = await supabaseAdmin
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .in('timeslotId', slotIds)
                .eq('userId', customer.id) // Corrected field
                .neq('status', 'CANCELLED');
            usageCount = count || 0;
        }
    }

    // Limit fetch is fine for list, but for calculation we need ALL future bookings
    // We already fetch 10. Let's fetch ALL for calculation.
    const allFutureBookings = await db.booking.findMany({
        where: { userId: customer.id, status: { not: "CANCELLED" }, timeslot: { date: { gt: now } } },
        include: { timeslot: true }
    });

    // Logic for Reserved Credits
    let reservedCredits = 0;
    const subEndDateObj = customer.subscriptionEndDate ? new Date(customer.subscriptionEndDate) : null;

    for (const b of allFutureBookings) {
        const isCovered = subEndDateObj && subEndDateObj >= b.timeslot.date;
        if (!isCovered) {
            reservedCredits++;
        }
    }

    const availableCredits = customer.credits;
    const totalCredits = availableCredits + reservedCredits;

    // Use the fetched list for display (slice it)
    const nextBooking = allFutureBookings[0];
    const upcomingBookings = allFutureBookings.slice(1, 6);

    // ... (rest of logic for usageCount stays same)

    const lastBooking = await db.booking.findFirst({
        where: {
            userId: customer.id, // Corrected field
            status: { not: "CANCELLED" },
            timeslot: {
                date: { lt: now }
            }
        },
        include: { timeslot: true },
        orderBy: { timeslot: { date: "desc" } }
    });


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[#163B40] mb-2">Hallo, {customer.firstName}! 👋</h1>
                <p className="text-gray-600">Willkommen in deinem persönlichen Trainings-Bereich.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ABO STATUS */}
                <Card className="shadow-sm border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Dein Abo Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {hasActiveSubscription ? (
                            <div>
                                <div className="text-2xl font-bold text-[#163B40] mb-1">
                                    {customer.subscriptionType?.replace("_", " ")}
                                </div>
                                <div className="text-sm text-gray-500 mb-4">
                                    Aktiv bis {format(new Date(customer.subscriptionEndDate!), "dd.MM.yyyy")}
                                </div>

                                <div className="bg-gray-100 rounded-full h-4 w-full overflow-hidden mb-2">
                                    <div
                                        className="bg-primary h-full transition-all duration-500"
                                        style={{ width: `${Math.min((usageCount / calculatedLimit) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                    <span>{usageCount} trainiert</span>
                                    <span className="text-gray-500">von {calculatedLimit} diesen Monat</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Nächster Monat ab {periodEndStr}</p>
                            </div>
                        ) : (
                            <div>
                                <div className="text-xl font-bold text-gray-400 mb-2">Kein aktives Abo</div>
                                <div className="text-sm text-gray-600">Nutze Credits oder schließe ein Abo ab.</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* CREDITS */}
                <Card className="shadow-sm border-l-4 border-l-orange-400">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
                            <Dumbbell className="w-5 h-5 text-orange-400" />
                            Guthaben
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <div className="text-4xl font-bold text-[#163B40]">{availableCredits}</div>
                            {reservedCredits > 0 && (
                                <div className="text-lg font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-md">
                                    + {reservedCredits} reserviert
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Verfügbar:</span>
                                <span className="font-bold text-green-600">{availableCredits} Units</span>
                            </div>
                            {reservedCredits > 0 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Gebucht (Reserviert):</span>
                                    <span className="font-bold text-yellow-600">{reservedCredits} Units</span>
                                </div>
                            )}
                            <div className="border-t pt-1 mt-1 flex justify-between text-xs font-medium">
                                <span>Gesamt:</span>
                                <span>{totalCredits} Units</span>
                            </div>
                        </div>

                        {!hasActiveSubscription && customer.credits === 0 && reservedCredits === 0 && (
                            <Button variant="link" className="px-0 text-orange-600 h-auto mt-2">Guthaben aufladen</Button>
                        )}
                    </CardContent>
                </Card>

                {/* NEXT TRAINING & BOOKINGS */}
                <Card className="shadow-sm bg-[#163B40] text-white border-0 flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-teal-400" />
                            Nächstes Training
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        {nextBooking ? (
                            <div className="mb-4">
                                <p className="text-teal-300 text-xs font-bold uppercase tracking-wide mb-1">Bevorstehend</p>
                                <div className="text-2xl font-bold">
                                    {format(new Date(nextBooking.timeslot.date), "dd.MM.yyyy", { locale: de })}
                                </div>

                                <div className="text-lg text-gray-300 mb-4">
                                    {formatTimeUTC(nextBooking.timeslot.startTime)} Uhr
                                </div>

                                <BookingActionButtons bookingId={nextBooking.id} />

                                {/* List Subsequent Bookings */}
                                {upcomingBookings.length > 0 && (
                                    <div className="bg-[#1C4A50] rounded-xl p-3 space-y-2 mb-4 mt-4 border border-teal-800/50">
                                        <p className="text-[10px] uppercase font-bold text-teal-300 tracking-wider mb-2">Weitere Termine</p>
                                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar-dark">
                                            {upcomingBookings.map(booking => (
                                                <div key={booking.id} className="flex justify-between items-center text-sm border-b border-teal-900/50 pb-2 last:border-0 last:pb-0">
                                                    <div>
                                                        <span className="text-gray-200 block">{format(new Date(booking.timeslot.date), "dd.MM.yyyy")}</span>
                                                        <span className="font-mono text-teal-200 text-xs">{formatTimeUTC(booking.timeslot.startTime)} Uhr</span>
                                                    </div>
                                                    <BookingActionButtons bookingId={booking.id} variant="compact" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-300 mb-6 text-sm">
                                Buche Jetzt dein nächstes Training im Wirbelsäulenstützpunkt.
                            </p>
                        )}

                        <div className="mt-auto pt-4 border-t border-white/10">
                            {lastBooking ? (
                                <p className="text-xs text-gray-400">
                                    Letztes Training: <span className="text-white">{format(new Date(lastBooking.timeslot.date), "dd.MM.yyyy")}</span>
                                </p>
                            ) : (
                                <p className="text-xs text-gray-400">Noch kein Training absolviert.</p>
                            )}
                        </div>

                        <Link href="/b2c/booking" className="mt-4">
                            <Button className="w-full bg-white text-[#163B40] hover:bg-gray-100 font-bold">
                                {nextBooking ? "Weiteren Termin buchen" : "Jetzt Termin buchen"}
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
