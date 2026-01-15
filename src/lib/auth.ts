import { NextAuthOptions } from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

// Use Supabase Adapter (API Mode) to bypass direct DB port 5432
// This allows auth to work even if DB DNS is missing, as long as API is up.
const adapter = SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dylocjiremrejotlrwdo.supabase.co",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bG9jamlyZW1yZWpvdGxyd2RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTcwODkzMiwiZXhwIjoyMDgxMjg0OTMyfQ.YtwuLaUdo80GLMHWSwXHUpNh2JlrwiuRXrjTEtQDG3k",
});

export const authOptions: NextAuthOptions = {
    adapter: adapter as any,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                // 1. Verify Credentials via Supabase Auth API
                // We use the REST API to avoid needing the Supabase Client in this specific context if tricky,
                // BUT we can use a basic fetch to the token endpoint.
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dylocjiremrejotlrwdo.supabase.co";
                const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

                try {
                    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "apikey": apiKey,
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    if (!authResponse.ok) {
                        const error = await authResponse.json();
                        console.error("Supabase Auth Error:", error);
                        // Map error messages if needed
                        return null;
                    }

                    const authData = await authResponse.json();
                    const userId = authData.user.id; // This is the Auth UUID

                    // 2. Fetch Profile from Database
                    // We check our local 'Profile' table which mirrors Auth Users + Metadata
                    const profile = await db.profile.findUnique({
                        where: { id: userId },
                        include: { tenant: true } // Need tenant info for active check
                    });

                    if (!profile) {
                        // Profile missing (migration issue or corruption)
                        console.error(`Profile not found for Auth ID: ${userId}`);
                        return null;
                    }

                    if (!profile.isActive) {
                        throw new Error("Account inactive");
                    }

                    if (profile.tenantId && profile.tenant && !profile.tenant.isActive) {
                        throw new Error("Tenant account inactive");
                    }

                    // 3. Return User Object
                    return {
                        id: profile.id,
                        email: profile.email,
                        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
                        role: profile.role,
                        tenantId: profile.tenantId || undefined,
                    };
                } catch (e) {
                    console.error("Authorize Exception:", e);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.tenantId = user.tenantId;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.tenantId = token.tenantId as string | undefined;
            }
            return session;
        },
    },
    debug: process.env.NODE_ENV === "development",
};
