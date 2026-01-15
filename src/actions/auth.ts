"use server";

import { db } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function registerB2CCustomer(formData: FormData) {
    try {
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        // 1. Validation
        if (!firstName || !lastName || !email || !password) {
            return { success: false, message: "Bitte alle Felder ausfüllen." };
        }

        if (password !== confirmPassword) {
            return { success: false, message: "Passwörter stimmen nicht überein." };
        }

        if (password.length < 8) {
            return { success: false, message: "Passwort muss mindestens 8 Zeichen lang sein." };
        }

        // 2. Check Existing User in DB (Fast check)
        const existingProfile = await db.profile.findUnique({ where: { email } });
        if (existingProfile) {
            return { success: false, message: "E-Mail wird bereits verwendet." };
        }

        // 3. Create User in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for simplicity, or false if email verification desired
            user_metadata: { firstName, lastName, role: 'B2C_CUSTOMER' }
        });

        if (authError || !authUser.user) {
            console.error("Auth Register Error:", authError);
            return { success: false, message: "Fehler bei der Registrierung: " + (authError?.message || "Unbekannt") };
        }

        // 4. Create Profile
        try {
            await db.profile.create({
                data: {
                    id: authUser.user.id,
                    email,
                    firstName,
                    lastName,
                    role: 'B2C_CUSTOMER',
                    isActive: true,
                    // B2C Defaults
                    credits: 0,
                    careLevel: 2
                }
            });
        } catch (dbError: any) {
            // Rollback Auth
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            console.error("DB Register Error:", dbError);
            return { success: false, message: "Datenbankfehler: " + dbError.message };
        }

        return { success: true, message: "Registrierung erfolgreich! Bitte einloggen." };

    } catch (error: any) {
        console.error("Registration Error:", error);
        return { success: false, message: "Systemfehler: " + error.message };
    }
}
