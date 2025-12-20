
import "dotenv/config";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function main() {
    console.log("Checking Storage Buckets...");

    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();

    if (error) {
        console.error("Error listing buckets:", error);
        return;
    }

    console.log("Buckets found:", buckets.map(b => b.name));

    const targetBucket = "videos";
    const videoBucket = buckets.find(b => b.name === targetBucket);

    if (!videoBucket) {
        console.log(`❌ Bucket '${targetBucket}' does NOT existence.`);

        // Try to create it
        console.log(`Creating bucket '${targetBucket}'...`);
        const { data, error: createError } = await supabaseAdmin.storage.createBucket(targetBucket, {
            public: true,
            fileSizeLimit: 104857600, // 100MB
            allowedMimeTypes: ['video/*', 'image/*']
        });

        if (createError) {
            console.error("Failed to create bucket:", createError);
        } else {
            console.log("✅ Bucket created!");
        }

    } else {
        console.log(`✅ Bucket '${targetBucket}' exists.`);
        console.log("Public:", videoBucket.public);
    }
}

main();
