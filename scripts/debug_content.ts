
import "dotenv/config";
import { supabaseAdmin } from "../src/lib/supabase-admin";
import { createId } from "@paralleldrive/cuid2";

async function main() {
    console.log("Testing Content Creation...");

    const testContent = {
        id: createId(),
        title: "Debug Video",
        description: "Test Description",
        url: "https://youtube.com/watch?v=123",
        thumbnailUrl: null,
        type: "VIDEO",
        isActive: true,
        isPremium: false
    };

    console.log("Payload:", testContent);

    const { data, error } = await supabaseAdmin.from("contents").insert(testContent).select();

    if (error) {
        console.error("❌ Insert Failed:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Insert Success:", data);

        // Cleanup
        await supabaseAdmin.from("contents").delete().eq("id", testContent.id);
    }
}

main();
