"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSignedUploadUrl(bucket: string, path: string) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { error: "Unauthorized" };
    }

    try {
        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .createSignedUploadUrl(path);

        if (error) throw error;

        return { data };
    } catch (error) {
        console.error("Error creating signed url:", error);
        return { error: "Failed to generate upload token" };
    }
}
