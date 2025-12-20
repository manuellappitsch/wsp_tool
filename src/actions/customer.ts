"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createCustomer(prevState: any, formData: FormData) {
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const product = formData.get("product") as string;
    const careLevel = parseInt(formData.get("careLevel") as string) || 2;

    let credits = 0;
    let subscriptionEndDate: string | null = null; // ISO String for Supabase

    // Calculate Product Logic
    if (product) {
        switch (product) {
            case "BLOCK_10": credits = 10; break;
            case "BLOCK_20": credits = 20; break;
            case "BLOCK_30": credits = 30; break;
            case "ABO_6":
                const d6 = new Date();
                d6.setMonth(d6.getMonth() + 6);
                subscriptionEndDate = d6.toISOString();
                break;
            case "ABO_12":
                const d12 = new Date();
                d12.setMonth(d12.getMonth() + 12);
                subscriptionEndDate = d12.toISOString();
                break;
        }
    }

    if (!firstName || !lastName || !email) {
        return { success: false, message: "Bitte alle Pflichtfelder ausfüllen." };
    }

    try {
        const { error } = await supabaseAdmin.from("b2c_customers").insert({
            firstName,
            lastName,
            email,
            phone,
            notes,
            credits,
            careLevel,
            subscriptionEndDate
        });

        if (error) {
            console.error(error);
            if (error.code === "23505") { // Unique violation
                return { success: false, message: "E-Mail Adresseexistiert bereits." };
            }
            return { success: false, message: "Datenbank Fehler." };
        }

        revalidatePath("/admin/customers");
        return { success: true, message: "Kunde erfolgreich angelegt." };

    } catch (e) {
        return { success: false, message: "Server Fehler." };
    }
}

export async function updateCustomer(prevState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const credits = parseInt(formData.get("credits") as string) || 0;
    const careLevel = parseInt(formData.get("careLevel") as string) || 2;

    try {
        const { error } = await supabaseAdmin
            .from("b2c_customers")
            .update({
                firstName,
                lastName,
                email,
                phone,
                notes,
                credits,
                careLevel
            })
            .eq("id", id);

        if (error) {
            console.error(error);
            return { success: false, message: "Fehler beim Aktualisieren." };
        }

        revalidatePath("/admin/customers");
        return { success: true, message: "Kunde aktualisiert." };
    } catch (e) {
        return { success: false, message: "Server Fehler." };
    }
}

export async function deleteCustomer(id: string) {
    try {
        const { error } = await supabaseAdmin.from("b2c_customers").delete().eq("id", id);

        if (error) {
            console.error(error);
            return { success: false, message: "Fehler beim Löschen." };
        }

        revalidatePath("/admin/customers");
        return { success: true, message: "Kunde gelöscht." };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Server Fehler." };
    }
}

export async function getCustomersForBooking() {
    const { data, error } = await supabaseAdmin
        .from('b2c_customers')
        .select('id, firstName, lastName, careLevel')
        .order('lastName');

    if (error) {
        console.error("Error fetching customers:", error);
        return [];
    }
    return data;
}

export async function getB2BUsersForBooking() {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, firstName, lastName, email')
        .order('lastName');

    if (error) {
        console.error("Error fetching users:", error);
        return [];
    }
    return data;
}

export async function addCustomerProduct(prevState: any, formData: FormData) {
    const customerId = formData.get("customerId") as string;
    const product = formData.get("product") as string;

    if (!customerId || !product) {
        return { success: false, message: "Fehler beim Hinzufügen (Missing Data)." };
    }

    try {
        // Fetch current state
        const { data: customer } = await supabaseAdmin.from("b2c_customers").select("*").eq("id", customerId).single();
        if (!customer) return { success: false, message: "Kunde nicht gefunden." };

        let updateData: any = {};

        switch (product) {
            case "BLOCK_10": updateData.credits = customer.credits + 10; break;
            case "BLOCK_20": updateData.credits = customer.credits + 20; break;
            case "BLOCK_30": updateData.credits = customer.credits + 30; break;
            case "ABO_6":
                const d6 = new Date();
                d6.setMonth(d6.getMonth() + 6);
                updateData.subscriptionEndDate = d6.toISOString();
                break;
            case "ABO_12":
                const d12 = new Date();
                d12.setMonth(d12.getMonth() + 12);
                updateData.subscriptionEndDate = d12.toISOString();
                break;
        }

        const { error } = await supabaseAdmin
            .from("b2c_customers")
            .update(updateData)
            .eq("id", customerId);

        if (error) throw error;

        revalidatePath("/admin/customers");
        return { success: true, message: "Produkt erfolgreich hinzugefügt." };

    } catch (e) {
        console.error(e);
        return { success: false, message: "Server Fehler." };
    }
}
