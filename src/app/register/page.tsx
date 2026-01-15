"use client";

import React, { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DualBrandLogo } from "@/components/branding/DualBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { registerB2CCustomer } from "@/actions/auth";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            const result = await registerB2CCustomer(formData);
            if (result.success) {
                toast.success("Registrierung erfolgreich!", {
                    description: "Bitte melde dich jetzt mit deinen Daten an."
                });
                router.push("/");
            } else {
                setError(result.message || "Fehler bei der Registrierung.");
            }
        });
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9FAFB] p-4 relative">

            {/* Background Decor */}
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-lg z-10"
            >
                {/* Branding Header */}
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <DualBrandLogo customerName="B2B Partner" />
                    <p className="text-muted-foreground font-medium text-center max-w-xs">
                        Registrierung für Privatkunden
                    </p>
                </div>

                <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-[2rem] overflow-hidden">
                    <CardHeader className="space-y-1 text-center pt-8 pb-4">
                        <h2 className="text-2xl font-bold tracking-tight text-[#163B40]">Account erstellen</h2>
                    </CardHeader>
                    <CardContent className="px-8 pb-10">
                        <form action={handleSubmit} className="space-y-5">

                            {error && (
                                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Fehler</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-gray-600 font-medium ml-1">Vorname</Label>
                                    <Input id="firstName" name="firstName" placeholder="Max" className="bg-gray-50 border-gray-100 rounded-xl h-11" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-gray-600 font-medium ml-1">Nachname</Label>
                                    <Input id="lastName" name="lastName" placeholder="Mustermann" className="bg-gray-50 border-gray-100 rounded-xl h-11" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-600 font-medium ml-1">E-Mail Adresse</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@beispiel.de"
                                    className="bg-gray-50 border-gray-100 focus:border-primary focus:ring-primary/20 rounded-xl h-11 px-4"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-600 font-medium ml-1">Passwort (min. 8 Zeichen)</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-gray-50 border-gray-100 focus:border-primary focus:ring-primary/20 rounded-xl h-11 px-4"
                                    required
                                    pattern=".{8,}"
                                    title="Mindestens 8 Zeichen"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-gray-600 font-medium ml-1">Passwort wiederholen</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-gray-50 border-gray-100 focus:border-primary focus:ring-primary/20 rounded-xl h-11 px-4"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full h-12 rounded-full font-bold text-white bg-primary hover:bg-[#25B0AD] shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Kostenlos Registrieren
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-8 text-center">
                            <Link href="/" className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Zurück zum Login
                            </Link>
                        </div>

                    </CardContent>
                </Card>

                {/* Footer Links */}
                <div className="mt-8 flex justify-center space-x-6 text-sm text-gray-400">
                    <a href="#" className="hover:text-primary transition-colors">Impressum</a>
                    <a href="#" className="hover:text-primary transition-colors">Datenschutz</a>
                </div>

            </motion.div>
        </div>
    );
}
