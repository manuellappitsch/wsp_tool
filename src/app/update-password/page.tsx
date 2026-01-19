"use client";

import React, { useState, useTransition, Suspense } from "react";
import { DualBrandLogo } from "@/components/branding/DualBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { resetPasswordWithToken } from "@/actions/auth";
import { useSearchParams, useRouter } from "next/navigation";

function PasswordUpdateForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setResult(null);
        startTransition(async () => {
            const res = await resetPasswordWithToken(formData);
            setResult(res);
            if (res.success) {
                setTimeout(() => {
                    router.push("/");
                }, 3000);
            }
        });
    };

    if (!token) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-red-600">
                    Ungültiger Link. Bitte fordern Sie ein neues Passwort an.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="pt-8 pb-4 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-[#163B40]">Neues Passwort</h2>
                <p className="text-gray-500 text-sm mt-2">
                    Bitte vergeben Sie ein neues Passwort.
                </p>
            </CardHeader>
            <CardContent className="px-8 pb-10">
                {result?.success ? (
                    <div className="text-center py-6">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-[#163B40] mb-2">Passwort geändert!</h3>
                        <p className="text-gray-600 mb-6">
                            Sie werden in Kürze zum Login weitergeleitet...
                        </p>
                        <Link href="/">
                            <Button className="w-full">Jetzt Anmelden</Button>
                        </Link>
                    </div>
                ) : (
                    <form action={handleSubmit} className="space-y-5">
                        <input type="hidden" name="token" value={token} />

                        {result && !result.success && (
                            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Fehler</AlertTitle>
                                <AlertDescription>{result.message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-600 font-medium ml-1">Neues Passwort (min. 8 Zeichen)</Label>
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
                                        Passwort speichern
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

export default function UpdatePasswordPage() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9FAFB] p-4 relative">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />

            <div className="w-full max-w-md z-10">
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <DualBrandLogo customerName="Portal" />
                </div>

                <Suspense fallback={
                    <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-[2rem] p-8 text-center text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                        Lade Formular...
                    </Card>
                }>
                    <PasswordUpdateForm />
                </Suspense>
            </div>
        </div>
    );
}
