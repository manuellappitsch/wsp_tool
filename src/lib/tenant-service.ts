import { db } from "@/lib/db";

import { EmailTemplates } from "@/lib/email-templates";
import { sendEmail, EMAIL_SENDER_PARTNER } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface CreateTenantParams {
    companyName: string;
    email: string;
    firstName: string; // Admin First Name
    lastName: string;  // Admin Last Name
    dailyKontingent?: number;
    billingAddress?: string | null;
    billingZip?: string | null;
    billingCity?: string | null;
    billingEmail?: string | null;
    logoFile?: File | null; // Optional: For manual upload via FormData
    logoUrlRaw?: string | null; // Optional: If a URL is already provided (e.g. from Webhook)
}

function generatePassword(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let ret = "";
    for (let i = 0; i < length; ++i) {
        ret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ret;
}

export async function uploadLogoInternal(file: File, tenantName: string): Promise<{ url: string | null, error?: string }> {
    if (!file || file.size === 0) {
        return { url: null };
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${tenantName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabaseAdmin
            .storage
            .from('logos')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error("SERVER: Supabase Upload Error:", uploadError);
            return { url: null, error: `Upload Fehler: ${uploadError.message}` };
        }

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('logos')
            .getPublicUrl(filePath);

        return { url: publicUrl };
    } catch (e: any) {
        console.error("SERVER: Logo Upload Exception:", e);
        return { url: null, error: `Upload Exception: ${e.message}` };
    }
}

/**
 * Core Logic to create a tenant and the first admin user.
 * Can be called from Server Actions (FormData) or API Routes (JSON).
 */
// Core Logic to create a tenant and the first admin user.
export async function createTenantCore(params: CreateTenantParams) {
    const {
        companyName,
        email,
        firstName,
        lastName,
        dailyKontingent = 1,
        billingAddress,
        billingZip,
        billingCity,
        billingEmail,
        logoFile,
        logoUrlRaw
    } = params;

    if (!companyName || !email) {
        return { error: "Firmenname und E-Mail sind erforderlich." };
    }

    try {
        // 1. Check if email exists (in DB Profile or Supabase Auth?)
        // Best to check Profile.
        const existingProfile = await db.profile.findUnique({ where: { email } });
        if (existingProfile) return { error: "Diese E-Mail wird bereits verwendet." };

        // 2. Handle Logo
        let finalLogoUrl: string | null = null;
        if (logoFile && logoFile.size > 0) {
            const uploadResult = await uploadLogoInternal(logoFile, companyName);
            if (uploadResult.error) return { error: uploadResult.error };
            finalLogoUrl = uploadResult.url;
        } else if (logoUrlRaw) {
            finalLogoUrl = logoUrlRaw;
        }

        // 3. Create User in Supabase Auth
        const plainPassword = generatePassword();

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: plainPassword,
            email_confirm: true,
            user_metadata: { firstName, lastName }
        });

        if (authError || !authUser.user) {
            console.error("Supabase Create User Error:", authError);
            return { error: `Auth Error: ${authError?.message}` };
        }

        const userId = authUser.user.id; // UUID

        // 4. Create Tenant and Profile in DB
        try {
            await db.$transaction(async (tx) => {
                // Create Tenant
                const tenant = await tx.tenant.create({
                    data: {
                        companyName,
                        logoUrl: finalLogoUrl,
                        dailyKontingent,
                        billingAddress,
                        billingZip,
                        billingCity,
                        billingEmail,
                    }
                });

                // Create Profile linked to Auth ID and Tenant
                await tx.profile.create({
                    data: {
                        id: userId,
                        email,
                        firstName: firstName || "Geschäftsführer",
                        lastName: lastName || "",
                        role: "TENANT_ADMIN",
                        tenantId: tenant.id,
                        inviteStatus: "ACCEPTED"
                    }
                });
            });
        } catch (dbError: any) {
            console.error("DB Create Tenant Error:", dbError);
            // Rollback: Delete Auth User if DB creation failed
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return { error: "Datenbankfehler beim Erstellen des Partners." };
        }

        // 5. Send Email
        const emailHtml = EmailTemplates.partnerWelcome(companyName, `${firstName} ${lastName}`, email, plainPassword);
        await sendEmail({
            to: email,
            subject: "Willkommen als Partner beim WSP!",
            html: emailHtml,
            from: EMAIL_SENDER_PARTNER
        });

        return { success: true, password: plainPassword };
    } catch (error) {
        console.error("Create Tenant Core Error:", error);
        return { error: "Unbekannter Fehler beim Erstellen des Partners." };
    }
}
