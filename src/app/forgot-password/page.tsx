"use client";

import React, { useState, useTransition } from "react";
import { DualBrandLogo } from "@/components/branding/DualBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";

export default function ForgotPasswordPage() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setResult(null);
        startTransition(async () => {
            const res = await requestPasswordReset(formData);
            setResult(res);
        });
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9FAFB] p-4 relative">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />

            <div className="w-full max-w-md z-10">
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <DualBrandLogo customerName="Portal" />
                </div>

                <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-[2rem] overflow-hidden">
                    <CardHeader className="pt-8 pb-4 text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-[#163B40]">Passwort vergessen?</h2>
                        <p className="text-gray-500 text-sm mt-2">
                            Geben Sie Ihre E-Mail Adresse ein.<br />Wir senden Ihnen einen Link zum Zurücksetzen.
                        </p>
                    </CardHeader>
                    <CardContent className="px-8 pb-10">
                        {result?.success ? (
                            <div className="text-center py-6">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-[#163B40] mb-2">E-Mail versendet!</h3>
                                <p className="text-gray-600 mb-6">
                                    {result.message}
                                </p>
                                <Link href="/">
                                    <Button variant="outline" className="w-full">Zurück zum Login</Button>
                                </Link>
                            </div>
                        ) : (
                            <form action={handleSubmit} className="space-y-5">
                                {result && !result.success && (
                                    <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Fehler</AlertTitle>
                                        <AlertDescription>{result.message}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-600 font-medium ml-1">E-Mail Adresse</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="name@firma.com"
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
                                                Link anfordern
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {!result?.success && (
                            <div className="mt-8 text-center bg-transparent">
                                <Link href="/" className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Zurück zum Login
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
