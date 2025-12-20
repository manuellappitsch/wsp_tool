
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role to mimic server action
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    console.log("🎬 Attempting to create video...");

    const payload = {
        title: "Test Video",
        description: "Debug Description",
        url: "https://test.com/video.mp4",
        thumbnailUrl: "https://test.com/thumb.jpg",
        type: "VIDEO",
        isActive: true,
        isPremium: false
    };

    console.log("Payload:", payload);

    const { data, error } = await supabase.from("contents").insert(payload).select();

    if (error) {
        console.error("❌ Error creating video:", error);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
        console.error("Message:", error.message);
    } else {
        console.log("✅ Video created successfully:", data);
        // Clean up
        if (data && data[0]?.id) {
            await supabase.from("contents").delete().eq("id", data[0].id);
        }
    }
}

main();
