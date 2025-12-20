import { NextAuthOptions } from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Use Supabase Adapter (API Mode) to bypass direct DB port 5432
// This allows auth to work even if DB DNS is missing, as long as API is up.
const adapter = SupabaseAdapter({
    url: "https://dylocjiremrejotlrwdo.supabase.co",
    secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bG9jamlyZW1yZWpvdGxyd2RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTcwODkzMiwiZXhwIjoyMDgxMjg0OTMyfQ.YtwuLaUdo80GLMHWSwXHUpNh2JlrwiuRXrjTEtQDG3k",
});

export const authOptions: NextAuthOptions = {
    adapter: adapter as any, // Cast to any because next-auth v4 types might mismatch
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

                // NOTE: We now fetch via Supabase API (No-SQL style)
                // We check "GlobalAdmin" table first -> 'global_admins'
                const { data: globalAdmin } = await supabaseAdmin
                    .from('global_admins')
                    .select('*')
                    .eq('email', credentials.email)
                    .single();

                if (globalAdmin) {
                    if (!globalAdmin.isActive) throw new Error("Account inactive");

                    const isValid = await bcrypt.compare(
                        credentials.password,
                        globalAdmin.passwordHash
                    );

                    if (!isValid) throw new Error("Invalid password");

                    return {
                        id: globalAdmin.id,
                        email: globalAdmin.email,
                        name: `${globalAdmin.firstName} ${globalAdmin.lastName}`,
                        role: "GLOBAL_ADMIN",
                        isGlobalAdmin: true,
                    };
                }

                // 2. Check if it's a Tenant Admin -> 'tenant_admins'
                const { data: tenantAdmin } = await supabaseAdmin
                    .from('tenant_admins')
                    .select('*, tenant:tenants(*)')
                    .eq('email', credentials.email)
                    .single();

                if (tenantAdmin) {
                    // Check tenant status (nested object in supabase response)
                    // @ts-ignore
                    const tenant = tenantAdmin.tenant;
                    if (!tenantAdmin.isActive || (tenant && !tenant.isActive)) {
                        throw new Error("Account inactive");
                    }

                    if (!tenantAdmin.passwordHash) throw new Error("Account not setup");

                    const isValid = await bcrypt.compare(
                        credentials.password,
                        tenantAdmin.passwordHash
                    );

                    if (!isValid) throw new Error("Invalid password");

                    return {
                        id: tenantAdmin.id,
                        email: tenantAdmin.email,
                        name: `${tenantAdmin.firstName} ${tenantAdmin.lastName}`,
                        role: "TENANT_ADMIN",
                        tenantId: tenantAdmin.tenantId,
                    };
                }

                // 3. User -> 'users'
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('*, tenant:tenants(*)')
                    .eq('email', credentials.email)
                    .single();

                if (user) {
                    // @ts-ignore
                    const tenant = user.tenant;
                    if (!user.isActive || (tenant && !tenant.isActive)) {
                        throw new Error("Account inactive");
                    }

                    if (!user.passwordHash) throw new Error("Account not setup");

                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.passwordHash
                    );

                    if (!isValid) throw new Error("Invalid password");

                    return {
                        id: user.id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        role: "USER",
                        tenantId: user.tenantId,
                    };
                }

                return null; // User not found
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
