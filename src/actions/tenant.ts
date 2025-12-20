"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { EmailTemplates } from "@/lib/email-templates";
import { sendEmail } from "@/lib/resend";

async function uploadLogo(file: File, tenantName: string): Promise<{ url: string | null, error?: string }> {

    if (!file || file.size === 0) {

        return { url: null };
    }

    try {
        const fileExt = file.name.split('.').pop();
        // Sanitize file name
        const fileName = `${tenantName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;



        const { data, error: uploadError } = await supabaseAdmin
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

    if (!companyName || !email) {
        return { error: "Firmenname und E-Mail sind erforderlich." };
    }

    try {
        // 1. Check if email exists
        const existingAdmin = await db.tenantAdmin.findUnique({ where: { email } });
        if (existingAdmin) return { error: "Diese E-Mail wird bereits verwendet." };

        // 2. Upload Logo if present
        let logoUrl: string | null = null;
        if (logoFile && logoFile.size > 0) {

            const uploadResult = await uploadLogo(logoFile, companyName);
            if (uploadResult.error) {
                return { error: uploadResult.error }; // Return error immediately
            }
            logoUrl = uploadResult.url;

        } else {

        }

        // 3. Hash random password
        const plainPassword = generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        // 4. Transaction: Create Tenant + Admin
        await db.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    companyName,
                    logoUrl,
                    dailyKontingent,
                    billingAddress,
                    billingZip,
                    billingCity,
                    billingEmail,
                    admins: {
                        create: {
                            email,
                            firstName,
                            lastName,
                            passwordHash,
                            initialPassword: plainPassword,
                            inviteStatus: "ACCEPTED" // Direct creation via Admin
                        }
                    }
                }
            });
        });

        // 5. Send Email
        const emailHtml = EmailTemplates.partnerWelcome(companyName, `${firstName} ${lastName}`, email, plainPassword);
        await sendEmail({
            to: email,
            subject: "Willkommen als Partner beim WSP!",
            html: emailHtml
        });

        revalidatePath("/admin/tenants");
        return { success: true, password: plainPassword };
    } catch (error) {
        console.error("Create Tenant Error:", error);
        return { error: "Fehler beim Erstellen des Partners." };
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

            const uploadResult = await uploadLogo(logoFile, companyName);
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
        await db.user.delete({ where: { id: userId } });
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
        // Check email
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) return { error: "E-Mail bereits verwendet." };


        // Generate random password
        const plainPassword = generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        await db.user.create({
            data: {
                tenantId,
                firstName,
                lastName,
                email,
                passwordHash,
                inviteStatus: "ACCEPTED", // Admin created, so active immediately
                isActive: true,
                initialPassword: plainPassword
            }
        });

        // Send Email
        const emailHtml = EmailTemplates.accountCredentials(`${firstName} ${lastName}`, email, plainPassword);
        await sendEmail({
            to: email,
            subject: "Willkommen im WSP Portal - Deine Zugangsdaten",
            html: emailHtml
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
        await db.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                email,
                isActive
            }
        });

        revalidatePath("/admin/tenants");
        return { success: true };
    } catch (error) {
        console.error("Update User Error:", error);
        return { error: "Fehler beim Aktualisieren des Mitarbeiters." };
    }
}

export async function resetTenantUserPassword(userId: string) {
    try {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) return { error: "Mitarbeiter nicht gefunden." };

        const plainPassword = generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        await db.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                initialPassword: plainPassword
            }
        });

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
    try {
        const admin = await db.tenantAdmin.findUnique({ where: { id: adminId } });
        if (!admin) return { error: "Admin nicht gefunden." };

        const plainPassword = generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        await db.tenantAdmin.update({
            where: { id: adminId },
            data: {
                passwordHash,
                initialPassword: plainPassword
            }
        });

        // Send Email
        const emailHtml = EmailTemplates.accountCredentials(`${admin.firstName} ${admin.lastName}`, admin.email, plainPassword);
        await sendEmail({
            to: admin.email,
            subject: "Neues Admin-Passwort für das WSP Portal",
            html: emailHtml
        });

        revalidatePath("/admin/tenants");
        return { success: true, password: plainPassword };
    } catch (error) {
        console.error("Reset Admin Password Error:", error);
        return { error: "Fehler beim Zurücksetzen des Admin-Passworts." };
    }
}
