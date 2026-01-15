import { db } from "@/lib/db";
import { EmailTemplates } from "@/lib/email-templates";
import { sendEmail, EMAIL_SENDER_SUPPORT } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

function generatePassword(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let ret = "";
    for (let i = 0; i < length; ++i) {
        ret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ret;
}

export interface UpsertCustomerParams {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    // Actions
    addCredits?: number; // If present, adds to existing. If new user, sets initial.
    setSubscriptionMonths?: number; // Extends current end date or starts now
    // Or fixed date?
    subscriptionEndDate?: string; // ISO Date string
}

export async function upsertB2CCustomer(params: UpsertCustomerParams) {
    const {
        email,
        firstName,
        lastName,
        phone,
        addCredits = 0,
        setSubscriptionMonths,
        subscriptionEndDate
    } = params;

    if (!email) {
        return { error: "E-Mail ist erforderlich." };
    }

    try {
        // 1. Check if customer exists (Profile)
        const existingCustomer = await db.profile.findUnique({
            where: { email },
        });

        // Calculate new values
        let newCredits = (existingCustomer?.credits || 0);
        if (addCredits) {
            newCredits += addCredits;
        }

        let newSubscriptionEndDate = existingCustomer?.subscriptionEndDate;

        // Logic for subscription
        if (subscriptionEndDate) {
            // Hard overwrite if specific date provided
            newSubscriptionEndDate = new Date(subscriptionEndDate);
        } else if (setSubscriptionMonths && setSubscriptionMonths > 0) {
            // Logic: If currently active, extend from current end date.
            // If expired or null, extend from NOW.
            const now = new Date();
            const currentEnd = existingCustomer?.subscriptionEndDate
                ? new Date(existingCustomer.subscriptionEndDate)
                : null;

            let baseDate = now;
            if (currentEnd && currentEnd > now) {
                baseDate = currentEnd;
            }

            // Create new date by adding months
            const nextDate = new Date(baseDate);
            nextDate.setMonth(nextDate.getMonth() + setSubscriptionMonths);
            newSubscriptionEndDate = nextDate;
        }

        // 2. Create or Update
        let customerId = existingCustomer?.id;
        let plainPassword = "";
        let isNew = false;

        if (!existingCustomer) {
            // New Customer -> Create Auth User
            isNew = true;
            plainPassword = generatePassword();
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: plainPassword,
                email_confirm: true,
                user_metadata: { firstName, lastName }
            });

            if (authError || !authUser.user) {
                return { error: `Auth Error: ${authError?.message}` };
            }

            customerId = authUser.user.id;

            // Create Profile
            await db.profile.create({
                data: {
                    id: customerId,
                    email,
                    firstName,
                    lastName,
                    phone,
                    role: "B2C_CUSTOMER",
                    credits: newCredits,
                    subscriptionEndDate: newSubscriptionEndDate,
                    isActive: true,
                    inviteStatus: "ACCEPTED"
                }
            });

        } else {
            // Update Existing
            await db.profile.update({
                where: { id: customerId },
                data: {
                    firstName,
                    lastName,
                    phone,
                    credits: newCredits,
                    ...(newSubscriptionEndDate ? { subscriptionEndDate: newSubscriptionEndDate } : {})
                }
            });
        }

        // 4. Send Email only if NEW customer created
        if (isNew && plainPassword) {
            const emailHtml = EmailTemplates.accountCredentials(`${firstName} ${lastName}`, email, plainPassword);
            await sendEmail({
                to: email,
                subject: "Dein Zugang zum WSP Portal",
                html: emailHtml,
                from: EMAIL_SENDER_SUPPORT
            });
        }

        return {
            success: true,
            customer: {
                id: customerId,
                email: email,
                credits: newCredits,
                subscriptionEndDate: newSubscriptionEndDate
            }
        };

    } catch (error: any) {
        console.error("Upsert Customer Error:", error);
        return { error: "Fehler beim Verarbeiten des Kunden." };
    }
}
