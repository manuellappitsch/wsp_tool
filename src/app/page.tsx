"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { DualBrandLogo } from "@/components/branding/DualBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Ungültige E-Mail Adresse oder Passwort.");
        setIsLoading(false);
      } else if (result?.ok) {
        // Fetch the session to determind role
        const session = await getSession();
        if (session?.user?.role === "GLOBAL_ADMIN") {
          router.push("/admin");
        } else if (session?.user?.role === "TENANT_ADMIN") {
          router.push("/tenant/dashboard");
        } else if (session?.user?.role === "B2C_CUSTOMER") {
          router.push("/b2c/dashboard");
        } else {
          router.push("/user/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9FAFB] p-4 relative">

      {/* Background Decor - Subtle, clean */}
      <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-10 space-y-4">
          <DualBrandLogo customerName="B2B Partner" />
          <p className="text-muted-foreground font-medium text-center max-w-xs">
            Schmerzfrei durch den Alltag –<br />Willkommen im Partner-Portal.
          </p>
        </div>

        <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="space-y-1 text-center pt-8 pb-4">
            <h2 className="text-2xl font-bold tracking-tight text-[#163B40]">Login</h2>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">

              {error && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Fehler</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-600 font-medium ml-1">E-Mail Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@firma.com"
                  className="bg-gray-50 border-gray-100 focus:border-primary focus:ring-primary/20 rounded-xl h-12 px-4"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-gray-600 font-medium">Passwort</Label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Passwort vergessen?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border-gray-100 focus:border-primary focus:ring-primary/20 rounded-xl h-12 px-4"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-full font-bold text-white bg-primary hover:bg-[#25B0AD] shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Anmelden
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center mt-2">
                <p className="text-sm text-gray-500">
                  Noch keinen Account?{" "}
                  <Link href="/register" className="text-primary font-bold hover:underline">
                    Jetzt registrieren
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Links (like screenshot) */}
        <div className="mt-8 flex justify-center space-x-6 text-sm text-gray-400">
          <a href="#" className="hover:text-primary transition-colors">Impressum</a>
          <a href="#" className="hover:text-primary transition-colors">Datenschutz</a>
          <a href="#" className="hover:text-primary transition-colors">Hilfe</a>
        </div>

      </motion.div>
    </div>
  );
}
