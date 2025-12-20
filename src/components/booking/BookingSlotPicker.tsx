"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface BookingSlotPickerProps {
    slots: string[];
    selectedSlot: string | null;
    onSelectSlot: (slot: string) => void;
}

export function BookingSlotPicker({ slots, selectedSlot, onSelectSlot }: BookingSlotPickerProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {slots.map((slot, index) => (
                <motion.div
                    key={`${slot}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Button
                        variant={selectedSlot === slot ? "default" : "outline"}
                        className={`w-full rounded-full h-11 font-medium transition-all ${selectedSlot === slot
                            ? "bg-primary text-white shadow-md scale-105"
                            : "hover:border-primary hover:text-primary bg-white"
                            }`}
                        onClick={() => onSelectSlot(slot)}
                    >
                        {slot}
                    </Button>
                </motion.div>
            ))}
        </div>
    );
}
