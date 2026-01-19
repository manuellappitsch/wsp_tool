"use client";

import React, { useEffect } from "react";
import { DualBrandLogo } from "@/components/branding/DualBrandLogo";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9FAFB] p-4 relative">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />

            <div className="w-full max-w-md z-10">
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <DualBrandLogo customerName="Portal" />
                </div>

                <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-[2rem] overflow-hidden text-center">
                    <CardHeader className="pt-8 pb-4">
                        <h2 className="text-2xl font-bold tracking-tight text-[#163B40]">Registrierung geschlossen</h2>
                    </CardHeader>
                    <CardContent className="px-8 pb-10 space-y-4">
                        <p className="text-gray-500">
                            Die öffentliche Registrierung ist derzeit deaktiviert.
                            <br />
                            Bitte wenden Sie sich an Ihren Administrator oder Trainer, um einen Account zu erhalten.
                        </p>
                        <div className="pt-4">
                            <Link href="/" className="text-primary font-bold hover:underline flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Zurück zum Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
