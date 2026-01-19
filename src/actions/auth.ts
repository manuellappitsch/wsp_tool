"use server";

import { db } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

import { createId } from "@paralleldrive/cuid2";
import { addHours } from "date-fns";
import { EmailTemplates } from "@/lib/email-templates";
import { sendEmail, EMAIL_SENDER_SUPPORT } from "@/lib/resend";

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

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get("email") as string;

    if (!email) {
        return { success: false, message: "E-Mail ist erforderlich." };
    }

    try {
        let user = await db.profile.findUnique({ where: { email } });

        // Self-Healing: If profile missing but User exists in Supabase Auth
        if (!user) {
            console.log("Profile not found in DB, checking Supabase Auth for:", email);
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

            if (!listError && users) {
                const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                if (authUser) {
                    console.log("Found in Auth, creating missing profile for:", authUser.id);
                    // Create Profile from Auth Data
                    user = await db.profile.create({
                        data: {
                            id: authUser.id,
                            email: authUser.email!,
                            firstName: authUser.user_metadata?.firstName || "",
                            lastName: authUser.user_metadata?.lastName || "",
                            role: (authUser.user_metadata?.role as any) || 'USER',
                            isActive: true
                        }
                    });
                }
            }
        }

        // Don't reveal if user exists (Security Best Practice)
        // But for friendly UX in this internal-like tool, maybe we do? 
        // Let's stick to generic success message but LOG error internally.
        if (!user) {
            console.log("Password Reset requested for unknown email:", email);
            return { success: true, message: "Falls ein Account existiert, wurde eine E-Mail gesendet." };
        }

        // Generate Token
        const resetToken = createId();
        const resetTokenExpiry = addHours(new Date(), 1);

        await db.profile.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry }
        });

        // Send Email
        const resetLink = `${process.env.NEXTAUTH_URL}/update-password?token=${resetToken}`;
        const emailHtml = EmailTemplates.passwordReset(user.firstName || "Nutzer", resetLink);

        await sendEmail({
            to: email,
            subject: "Passwort zurücksetzen – WSP Portal",
            html: emailHtml,
            from: EMAIL_SENDER_SUPPORT
        });

        return { success: true, message: "Falls ein Account existiert, wurde eine E-Mail gesendet." };

    } catch (e: any) {
        console.error("Request Password Reset Error:", e);
        return { success: false, message: "Fehler beim Senden der E-Mail." };
    }
}

export async function resetPasswordWithToken(formData: FormData) {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !password) return { success: false, message: "Daten fehlen." };
    if (password !== confirmPassword) return { success: false, message: "Passwörter stimmen nicht überein." };
    if (password.length < 8) return { success: false, message: "Passwort zu kurz (min. 8 Zeichen)." };

    try {
        const user = await db.profile.findUnique({ where: { resetToken: token } });

        if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            return { success: false, message: "Ungültiger oder abgelaufener Link." };
        }

        // Update Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: password
        });

        if (authError) {
            console.error("Auth Update Error:", authError);
            return { success: false, message: "Fehler beim Speichern des Passworts." };
        }

        // Clear Token
        await db.profile.update({
            where: { id: user.id },
            data: { resetToken: null, resetTokenExpiry: null }
        });

        return { success: true, message: "Passwort erfolgreich geändert." };

    } catch (e: any) {
        console.error("Reset Password Error:", e);
        return { success: false, message: "Server Fehler." };
    }
}
