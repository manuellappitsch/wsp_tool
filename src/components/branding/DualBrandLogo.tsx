"use client";

import React from "react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

interface DualBrandLogoProps {
    customerLogoUrl?: string;
    customerName?: string;
}

export const DualBrandLogo: React.FC<DualBrandLogoProps> = ({
    customerLogoUrl,
    customerName,
}) => {
    const showPartner = !!customerName || !!customerLogoUrl;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center space-x-6"
        >
            {/* WSP Logo (Placeholder) */}
            <div className="flex flex-col items-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-primary">
                    WSP
                </h1>
            </div>

            {showPartner && (
                <>
                    {/* Separator */}
                    <div className="h-10 w-px bg-border/60 rotate-12" />

                    {/* Customer Logo */}
                    <div className="flex items-center justify-center">
                        {customerLogoUrl ? (
                            <img
                                src={customerLogoUrl}
                                alt={`${customerName} Logo`}
                                className="h-10 w-auto object-contain"
                            />
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-xl font-semibold text-foreground">
                                    {customerName}
                                </span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
};
