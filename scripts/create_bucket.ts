
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    console.log("🛠 Creating 'videos' bucket...");
    const { data, error } = await supabase.storage.createBucket('videos', {
        public: true
    });

    if (error) {
        console.error("Error creating bucket:", error);
    } else {
        console.log("✅ Bucket 'videos' created:", data);
    }
}

main();
