"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Loader2, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cancelSlot } from "@/actions/booking";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BookingActionButtonsProps {
    bookingId: string;
    variant?: "compact" | "full";
}

export function BookingActionButtons({ bookingId, variant = "full" }: BookingActionButtonsProps) {
    const router = useRouter();
    const [actionLoading, setActionLoading] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

    const handleCancel = async () => {
        setActionLoading(true);
        const result = await cancelSlot(bookingId);
        setActionLoading(false);
        setShowCancelDialog(false);

        if (result.success) {
            toast.success("Termin erfolgreich storniert.");
            router.refresh();
        } else {
            toast.error(result.error || "Fehler beim Stornieren.");
        }
    };

    const handleReschedule = async () => {
        // Technically just cancel and redirect
        setActionLoading(true);
        const result = await cancelSlot(bookingId);

        if (result.success) {
            toast.success("Termin storniert. Bitte wähle nun einen neuen Termin.");
            router.push("/b2c/booking"); // Redirect to booking
            // No need to set loading false as we redirect
        } else {
            setActionLoading(false);
            toast.error(result.error || "Fehler beim Verschieben.");
        }
        setShowRescheduleDialog(false);
    };

    if (variant === "compact") {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-200 hover:text-white hover:bg-teal-800/50">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowRescheduleDialog(true)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Termin verschieben
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowCancelDialog(true)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Stornieren
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Dialogs
                    showCancel={showCancelDialog} setShowCancel={setShowCancelDialog} onCancelConfirm={handleCancel}
                    showReschedule={showRescheduleDialog} setShowReschedule={setShowRescheduleDialog} onRescheduleConfirm={handleReschedule}
                    loading={actionLoading}
                />
            </>
        );
    }

    // Default "full" view (buttons side-by-side or styled)
    return (
        <div className="flex gap-2 mt-4">
            <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setShowRescheduleDialog(true)}
                disabled={actionLoading}
            >
                <Edit2 className="w-4 h-4 mr-2" />
                Verschieben
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="bg-red-500/10 text-red-200 border-red-500/20 hover:bg-red-500/20 hover:text-red-100"
                onClick={() => setShowCancelDialog(true)}
                disabled={actionLoading}
            >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>

            <Dialogs
                showCancel={showCancelDialog} setShowCancel={setShowCancelDialog} onCancelConfirm={handleCancel}
                showReschedule={showRescheduleDialog} setShowReschedule={setShowRescheduleDialog} onRescheduleConfirm={handleReschedule}
                loading={actionLoading}
            />
        </div>
    );
}

function Dialogs({ showCancel, setShowCancel, onCancelConfirm, showReschedule, setShowReschedule, onRescheduleConfirm, loading }: any) {
    return (
        <>
            <AlertDialog open={showCancel} onOpenChange={setShowCancel}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Termin stornieren?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchtest du diesen Termin wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); onCancelConfirm(); }} className="bg-red-600 hover:bg-red-700">
                            {loading ? "Storniere..." : "Ja, stornieren"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showReschedule} onOpenChange={setShowReschedule}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Termin verschieben?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Um den Termin zu verschieben, müssen wir den aktuellen Termin stornieren. Du wirst anschließend zur Buchungsseite weitergeleitet, um einen neuen Termin zu wählen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); onRescheduleConfirm(); }}>
                            {loading ? "Verarbeite..." : "Fortfahren"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
