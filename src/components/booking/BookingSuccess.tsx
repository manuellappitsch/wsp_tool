"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function BookingSuccess() {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
            <motion.div
                initial={{ scale: 0, shadow: "0px 0px 0px rgba(0,0,0,0)" }}
                animate={{
                    scale: 1,
                    boxShadow: "0px 10px 30px rgba(44, 200, 197, 0.4)"
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-24 h-24 bg-primary rounded-full flex items-center justify-center"
            >
                <Check className="w-12 h-12 text-white stroke-[3px]" />
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="text-2xl font-bold text-[#163B40]">Buchung bestätigt!</h2>
                <p className="text-muted-foreground mt-2">
                    Ihr Termin wurde erfolgreich reserviert.
                    <br />Sie erhalten eine Bestätigung per E-Mail.
                </p>
            </motion.div>
        </div>
    );
}
