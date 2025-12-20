
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables manually
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function updateBucket() {
    console.log("Updating 'logos' bucket config...");

    // Using updateBucket is not fully exposed in all client versions types, but works in JS
    const { data, error } = await supabaseAdmin
        .storage
        .updateBucket('logos', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
            fileSizeLimit: 2097152 // 2MB
        });

    if (error) {
        console.error("❌ Update failed:", error);
        process.exit(1);
    }

    console.log("✅ Bucket updated successfully:", data);
}

updateBucket();
