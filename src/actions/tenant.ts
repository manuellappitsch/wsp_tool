"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { EmailTemplates } from "@/lib/email-templates";
import { sendEmail, EMAIL_SENDER_SUPPORT } from "@/lib/resend";
import { uploadLogoInternal, createTenantCore } from "@/lib/tenant-service";
import { supabaseAdmin } from "@/lib/supabase-admin";

function generatePassword(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let ret = "";
    for (let i = 0; i < length; ++i) {
        ret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ret;
}

export async function createTenant(formData: FormData) {

    const companyName = formData.get("companyName") as string;
    const email = formData.get("email") as string;
    const dailyKontingent = parseInt(formData.get("dailyKontingent") as string) || 1;

    // Logo
    const logoFile = formData.get("logo") as File | null;

    // CEO / Admin Name
    const firstName = (formData.get("firstName") as string) || "Geschäftsführer";
    const lastName = (formData.get("lastName") as string) || "";

    // Billing (Optional)
    const billingAddress = formData.get("billingAddress") as string | null;
    const billingZip = formData.get("billingZip") as string | null;
    const billingCity = formData.get("billingCity") as string | null;
    const billingEmail = formData.get("billingEmail") as string | null;

    const result = await createTenantCore({
        companyName,
        email,
        firstName,
        lastName,
        dailyKontingent,
        billingAddress,
        billingZip,
        billingCity,
        billingEmail,
        logoFile
    });

    if (result.success) {
        revalidatePath("/admin/tenants");
        return result;
    } else {
        return { error: result.error };
    }
}

export async function updateTenant(formData: FormData) {
    const tenantId = formData.get("tenantId") as string;
    const companyName = formData.get("companyName") as string;
    const dailyKontingent = parseInt(formData.get("dailyKontingent") as string) || 1;

    // Logo
    const logoFile = formData.get("logo") as File | null;

    // Billing
    const billingAddress = formData.get("billingAddress") as string | null;
    const billingZip = formData.get("billingZip") as string | null;
    const billingCity = formData.get("billingCity") as string | null;
    const billingEmail = formData.get("billingEmail") as string | null;

    try {
        let logoUrl: string | undefined = undefined;
        if (logoFile && logoFile.size > 0) {

            const uploadResult = await uploadLogoInternal(logoFile, companyName);
            if (uploadResult.error) {
                console.error("SERVER: Logo upload failed", uploadResult.error);
                return { error: uploadResult.error }; // Return specific error to UI
            }
            if (uploadResult.url) {
                logoUrl = uploadResult.url;

            }
        }

        await db.tenant.update({
            where: { id: tenantId },
            data: {
                companyName,
                dailyKontingent,
                quotaType: formData.get("quotaType") as "NORMAL" | "SPECIAL" || "NORMAL",
                billingAddress,
                billingZip,
                billingCity,
                billingEmail,
                ...(logoUrl ? { logoUrl } : {})
            }
        });
        revalidatePath("/admin/tenants");
        return { success: true };
    } catch (error: any) {
        console.error("Update Tenant Error:", error);
        return { error: `Fehler beim Aktualisieren: ${error.message || String(error)}` };
    }
}

export async function deleteUser(userId: string) {
    try {
        // Delete from Supabase Auth
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
            console.error("Supabase Delete Error:", error);
        }

        // Clean up Profile
        try {
            await db.profile.delete({ where: { id: userId } });
        } catch (e) {
            // Ignore if already deleted
        }

        revalidatePath("/admin/tenants");
        return { success: true };
    } catch (error) {
        console.error("Delete User Error:", error);
        return { error: "Fehler beim Löschen des Mitarbeiters." };
    }
}

export async function archiveTenant(tenantId: string, isActive: boolean) {
    try {
        await db.tenant.update({
            where: { id: tenantId },
            data: { isActive }
        });
        revalidatePath("/admin/tenants");
        return { success: true };
    } catch (error) {
        console.error("Archive Tenant Error:", error);
        return { error: "Fehler beim Ändern des Status." };
    }
}


export async function createTenantUser(formData: FormData) {
    const tenantId = formData.get("tenantId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;

    if (!tenantId || !firstName || !lastName || !email) {
        return { error: "Alle Felder sind erforderlich." };
    }

    try {
        // Check email in Profile
        const existing = await db.profile.findUnique({ where: { email } });
        if (existing) return { error: "E-Mail bereits verwendet." };

        // Generate random password
        const plainPassword = generatePassword();

        // Create in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: plainPassword,
            email_confirm: true,
            user_metadata: { firstName, lastName }
        });

        if (authError || !authUser.user) {
            return { error: `Auth Error: ${authError?.message}` };
        }

        // Create Profile in DB using Auth ID
        await db.profile.create({
            data: {
                id: authUser.user.id,
                tenantId,
                firstName,
                lastName,
                email,
                role: "USER",
                inviteStatus: "ACCEPTED",
                isActive: true
            }
        });

        // Send Email
        const emailHtml = EmailTemplates.accountCredentials(`${firstName} ${lastName}`, email, plainPassword);
        await sendEmail({
            to: email,
            subject: "Willkommen im WSP Portal - Deine Zugangsdaten",
            html: emailHtml,
            from: EMAIL_SENDER_SUPPORT
        });

        revalidatePath("/admin/tenants");
        // Return success AND the password so the admin can see it once
        return { success: true, password: plainPassword };
    } catch (error) {
        console.error("Create User Error:", error);
        return { error: "Fehler beim Erstellen des Mitarbeiters." };
    }
}

export async function updateTenantUser(formData: FormData) {
    const userId = formData.get("userId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const isActive = formData.get("isActive") === "true";

    if (!userId || !firstName || !lastName || !email) {
        return { error: "Alle Felder sind erforderlich." };
    }

    try {
        // Update Profile
        await db.profile.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                email,
                isActive
            }
        });

        // Update Auth Email
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { email });
        if (error) {
            console.error("Auth Email Update Error:", error);
        }

        revalidatePath("/admin/tenants");
        return { success: true };
    } catch (error) {
        console.error("Update User Error:", error);
        return { error: "Fehler beim Aktualisieren des Mitarbeiters." };
    }
}

export async function resetTenantUserPassword(userId: string) {
    try {
        const user = await db.profile.findUnique({ where: { id: userId } });
        if (!user) return { error: "Mitarbeiter nicht gefunden." };

        const plainPassword = generatePassword();

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: plainPassword
        });

        if (error) {
            return { error: "Fehler beim Setzen des Passworts im Auth System." };
        }

        // Send Email
        const emailHtml = EmailTemplates.accountCredentials(`${user.firstName} ${user.lastName}`, user.email, plainPassword);
        await sendEmail({
            to: user.email,
            subject: "Dein neues Passwort für das WSP Portal",
            html: emailHtml
        });

        return { success: true, password: plainPassword };
    } catch (error) {
        console.error("Reset Password Error:", error);
        return { error: "Fehler beim Zurücksetzen des Passworts." };
    }
}

export async function resetTenantAdminPassword(adminId: string) {
    return resetTenantUserPassword(adminId);
}

export async function deleteTenant(tenantId: string) {
    try {
        const tenant = await db.tenant.findUnique({
            where: { id: tenantId },
            include: { profiles: true }
        });

        if (!tenant) return { error: "Partner nicht gefunden." };

        // 1. Delete all users
        // We iterate and wait properly
        for (const profile of tenant.profiles) {
            await deleteUser(profile.id);
        }

        // 2. Delete Tenant
        await db.tenant.delete({ where: { id: tenantId } });

        revalidatePath("/admin/tenants");
        return { success: true };
    } catch (error) {
        console.error("Delete Tenant Error:", error);
        return { error: "Fehler beim Löschen des Partners." };
    }
}
