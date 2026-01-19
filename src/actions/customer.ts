"use server";

import { revalidatePath } from "next/cache";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import { addMonths } from "date-fns";
import { db } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createId } from "@paralleldrive/cuid2";

import { EmailTemplates } from "@/lib/email-templates";
import { sendEmail, EMAIL_SENDER_SUPPORT } from "@/lib/resend";

function generatePassword(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let ret = "";
    for (let i = 0; i < length; ++i) {
        ret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ret;
}

export async function createCustomer(prevState: any, formData: FormData) {
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const isOffline = formData.get("isOffline") === "on";
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const product = formData.get("product") as string;
    const careLevel = parseInt(formData.get("careLevel") as string) || 2;

    let email = formData.get("email") as string;
    let credits = 0;
    let subscriptionEndDate: Date | null = null;

    // Calculate Product Logic
    if (product) {
        switch (product) {
            case "BLOCK_10": credits = 10; break;
            case "BLOCK_20": credits = 20; break;
            case "BLOCK_30": credits = 30; break;
            case "ABO_6":
                subscriptionEndDate = addMonths(new Date(), 6);
                break;
            case "ABO_12":
                subscriptionEndDate = addMonths(new Date(), 12);
                break;
        }
    }

    if (isOffline) {
        // Generate pseudo-email for offline users to satisfy Supabase Auth
        // Ensure uniqueness with timestamp + random
        email = `offline_${Date.now()}_${Math.floor(Math.random() * 1000)}@local.b2c`;
    } else {
        if (!email) {
            return { success: false, message: "E-Mail ist erforderlich (außer für Offline-Kunden)." };
        }
    }

    if (!firstName || !lastName) {
        return { success: false, message: "Bitte Namen ausfüllen." };
    }

    try {
        // 1. Create Supabase Auth User
        // Use auto-confirm so they exist immediately
        const initialPassword = isOffline ? createId() : generatePassword();

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: initialPassword,
            email_confirm: true,
            user_metadata: { firstName, lastName, role: 'B2C_CUSTOMER', isOffline }
        });

        if (authError) {
            console.error("Auth Create Error:", authError);
            if (authError.message.includes("already registered")) {
                return { success: false, message: "E-Mail existiert bereits." };
            }
            return { success: false, message: "Auth Error: " + authError.message };
        }

        const userId = authUser.user!.id;

        // 2. Create Profile in Prisma
        await db.profile.create({
            data: {
                id: userId,
                firstName,
                lastName,
                email,
                phone,
                notes,
                credits,
                careLevel,
                subscriptionEndDate,
                isOffline,
                role: 'B2C_CUSTOMER',
                emailNotifications: !isOffline,
                isActive: true
            }
        });

        // 3. Send Invite Email (if Online)
        if (!isOffline) {
            const emailHtml = EmailTemplates.accountCredentials(`${firstName} ${lastName}`, email, initialPassword);
            await sendEmail({
                to: email,
                subject: "Willkommen im WSP Portal – Deine Zugangsdaten",
                html: emailHtml,
                from: EMAIL_SENDER_SUPPORT
            });
        }

        revalidatePath("/admin/customers");
        return { success: true, message: "Kunde erfolgreich angelegt. Einladung gesendet." };

    } catch (e: any) {
        console.error("Create Customer Error:", e);
        return { success: false, message: "Server Fehler: " + e.message };
    }
}

export async function updateCustomer(prevState: any, formData: FormData) {
    const id = formData.get("id") as string; // This is the UUID
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const credits = parseInt(formData.get("credits") as string) || 0;
    const careLevel = parseInt(formData.get("careLevel") as string) || 2;

    try {
        // Update Profile
        // Note: Changing Email in Supabase Auth is complex. 
        // For now, we update the Profile email field. 
        // Syncing to Auth User would require another call.

        await db.profile.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email, // If changed, Profile email changes. Auth email stays unless we sync.
                phone,
                notes,
                credits,
                careLevel
            }
        });

        // Optional: Sync email to Auth if needed
        if (email) {
            await supabaseAdmin.auth.admin.updateUserById(id, { email });
        }

        revalidatePath("/admin/customers");
        return { success: true, message: "Kunde aktualisiert." };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Server Fehler." };
    }
}

export async function deleteCustomer(id: string) {
    try {
        // Delete from Supabase Auth (cascade should handle profile? Or we delete manually)
        // Prisma Schema says onDelete: Cascade?
        // Let's check schema. Usually Auth deletion doesn't cascade to public schema automatically unless triggers exist.
        // Safer to delete User via Admin API -> This deletes Auth User.
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (error) {
            // Fallback: Delete profile manually if Auth user not found
            await db.profile.delete({ where: { id } }).catch(() => { });
        } else {
            // In case of no cascade
            await db.profile.delete({ where: { id } }).catch(() => { });
        }

        revalidatePath("/admin/customers");
        return { success: true, message: "Kunde gelöscht." };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Server Fehler." };
    }
}

export async function getCustomersForBooking() {
    try {
        const customers = await db.profile.findMany({
            where: { role: 'B2C_CUSTOMER', isActive: true },
            select: { id: true, firstName: true, lastName: true, careLevel: true },
            orderBy: { lastName: 'asc' }
        });
        return customers;
    } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
    }
}

export async function getB2BUsersForBooking() {
    try {
        const users = await db.profile.findMany({
            where: { role: 'USER', isActive: true },
            select: { id: true, firstName: true, lastName: true, email: true },
            orderBy: { lastName: 'asc' }
        });
        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function addCustomerProduct(prevState: any, formData: FormData) {
    const customerId = formData.get("customerId") as string;
    const product = formData.get("product") as string;

    if (!customerId || !product) {
        return { success: false, message: "Fehler beim Hinzufügen (Missing Data)." };
    }

    try {
        const customer = await db.profile.findUnique({ where: { id: customerId } });
        if (!customer) return { success: false, message: "Kunde nicht gefunden." };

        let updateData: any = {};

        if (product.startsWith("BLOCK_")) {
            const amount = parseInt(product.split("_")[1]);
            updateData.credits = { increment: amount };
        } else if (product in SUBSCRIPTION_PLANS) {
            const plan = SUBSCRIPTION_PLANS[product as keyof typeof SUBSCRIPTION_PLANS];
            const startDate = new Date();
            const endDate = addMonths(startDate, plan.durationMonths);

            updateData.subscriptionType = plan.id;
            updateData.subscriptionStartDate = startDate;
            updateData.subscriptionEndDate = endDate;
        } else {
            return { success: false, message: "Ungültiges Produkt." };
        }

        await db.profile.update({
            where: { id: customerId },
            data: updateData
        });

        revalidatePath("/admin/customers");
        return { success: true, message: "Produkt erfolgreich hinzugefügt." };

    } catch (e) {
        console.error(e);
        return { success: false, message: "Server Fehler." };
    }
}
