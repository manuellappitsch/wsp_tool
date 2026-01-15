"use server";

import { db } from "@/lib/db";
import { EmailTemplates } from "@/lib/email-templates";
import { sendEmail, EMAIL_SENDER_SUPPORT } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import { addMonths } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase-admin";

function generatePassword(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let ret = "";
    for (let i = 0; i < length; ++i) {
        ret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ret;
}

export async function resetB2CCustomerPassword(customerId: string) {
    try {
        const customer = await db.profile.findUnique({ where: { id: customerId } });
        if (!customer) return { error: "Kunde nicht gefunden." };
        if (customer.role !== "B2C_CUSTOMER") return { error: "Kein B2C Kunde." };

        if (customer.isOffline) {
            return { error: "Offline-Kunden haben kein Passwort." };
        }

        const plainPassword = generatePassword();

        const { error } = await supabaseAdmin.auth.admin.updateUserById(customerId, {
            password: plainPassword
        });

        if (error) {
            return { error: "Fehler beim Reset im Auth System." };
        }

        // Send Email
        if (customer.email) {
            const emailHtml = EmailTemplates.accountCredentials(`${customer.firstName} ${customer.lastName}`, customer.email, plainPassword);
            await sendEmail({
                to: customer.email,
                subject: "Dein neues Passwort für das WSP Portal",
                html: emailHtml,
                from: EMAIL_SENDER_SUPPORT
            });
        }

        revalidatePath("/admin/customers");
        return { success: true, password: plainPassword };
    } catch (error) {
        console.error("Reset B2C Password Error:", error);
        return { error: "Fehler beim Zurücksetzen des Passworts." };
    }
}

export async function updateB2CCustomer(formData: FormData) {
    const customerId = formData.get("customerId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    let email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    // Subscription Fields
    const subscriptionType = formData.get("subscriptionType") as string | null;
    const subscriptionStartDateStr = formData.get("subscriptionStartDate") as string | null;

    if (!customerId || !firstName || !lastName) {
        return { error: "Name ist erforderlich." };
    }

    // Sanitize empty email to null
    if (!email || email.trim() === "") {
        email = null as any;
    }

    try {
        const currentCustomer = await db.profile.findUnique({ where: { id: customerId } });
        if (!currentCustomer) return { error: "Kunde nicht gefunden." };

        // Validation: If Online, Email is required
        if (!currentCustomer.isOffline && !email) {
            return { error: "E-Mail ist für Online-Kunden erforderlich." };
        }

        // Check email uniqueness if valid email provided AND changed
        if (email && email !== currentCustomer.email) {
            const existing = await db.profile.findUnique({
                where: { email }
            });
            if (existing && existing.id !== customerId) {
                return { error: "E-Mail wird bereits von einem anderen Kunden verwendet." };
            }
        }

        // Calculate End Date if Type is set
        let subscriptionStartDate = currentCustomer.subscriptionStartDate;
        let subscriptionEndDate = undefined; // Will be set if subscription logic runs

        // ... Existing subscription logic ...
        if (subscriptionType && subscriptionType !== "NONE") {
            // Logic repeated from original file, adapted slightly
            // If type changed OR date changed, recalc
            // Just recalc always if type is present?
            if (!subscriptionStartDateStr && !currentCustomer.subscriptionStartDate) {
                return { error: "Startdatum für Abo ist erforderlich." };
            }

            if (subscriptionStartDateStr) {
                subscriptionStartDate = new Date(subscriptionStartDateStr);
            }

            // Calculate Duration using Config
            const plan = SUBSCRIPTION_PLANS[subscriptionType as keyof typeof SUBSCRIPTION_PLANS];
            let months = 12;
            if (plan) {
                months = plan.durationMonths;
            }

            if (subscriptionStartDate) {
                subscriptionEndDate = addMonths(subscriptionStartDate, months);
            }
        }

        let subData: any = {};
        if (subscriptionType === "NONE") {
            subData.subscriptionType = null;
            subData.subscriptionStartDate = null;
            subData.subscriptionEndDate = null;
        } else if (subscriptionType) {
            subData.subscriptionType = subscriptionType;
            subData.subscriptionStartDate = subscriptionStartDate;
            subData.subscriptionEndDate = subscriptionEndDate;
        }

        // HANDLE PROMOTION: Offline -> Online (if email is added)
        if (currentCustomer.isOffline && email) {
            // Need to migrate to Auth User!
            const plainPassword = generatePassword();

            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: plainPassword,
                email_confirm: true,
                user_metadata: { firstName, lastName }
            });

            if (authError || !authUser.user) {
                return { error: `Auth Create Error: ${authError?.message}` };
            }

            const newId = authUser.user.id;

            // Transaction: Move Data and Swap Profile
            await db.$transaction(async (tx) => {
                // 1. Move Bookings
                await tx.booking.updateMany({
                    where: { userId: customerId },
                    data: { userId: newId }
                });
                // 2. Move Orders
                await tx.order.updateMany({
                    where: { userId: customerId },
                    data: { userId: newId }
                });
                // 3. Move Progress
                await tx.userContentProgress.updateMany({
                    where: { userId: customerId },
                    data: { userId: newId }
                });

                // 4. Delete Old Profile
                await tx.profile.delete({ where: { id: customerId } });

                // 5. Create New Profile
                await tx.profile.create({
                    data: {
                        id: newId,
                        email,
                        firstName,
                        lastName,
                        phone,
                        credits: currentCustomer.credits, // Copy credits!
                        // companyName removed as it doesn't exist on Profile
                        role: "B2C_CUSTOMER",
                        isOffline: false,
                        inviteStatus: "ACCEPTED",
                        isActive: true,
                        // Subscription
                        ...subData
                    }
                });
            });

            // Send Welcome Email
            const emailHtml = EmailTemplates.accountCredentials(`${firstName} ${lastName}`, email, plainPassword);
            await sendEmail({
                to: email,
                subject: "Willkommen im WSP Portal – Deine Zugangsdaten",
                html: emailHtml,
                from: EMAIL_SENDER_SUPPORT
            });

        } else {
            // Normal Update (no id change)
            await db.profile.update({
                where: { id: customerId },
                data: {
                    firstName,
                    lastName,
                    email,
                    phone,
                    ...subData
                }
            });

            // If email changed for Online User, update Auth?
            if (!currentCustomer.isOffline && email && email !== currentCustomer.email) {
                await supabaseAdmin.auth.admin.updateUserById(customerId, { email });
            }

            // Manually updating credits was in original?
            const creditsStr = formData.get("credits");
            if (creditsStr !== null) {
                const credits = parseInt(creditsStr as string) || 0;
                await db.profile.update({ where: { id: customerId }, data: { credits } });
            }
        }

        revalidatePath("/admin/customers");
        return { success: true };
    } catch (error) {
        console.error("Update B2C Error:", error);
        return { error: "Fehler beim Aktualisieren des Kunden." };
    }
}
