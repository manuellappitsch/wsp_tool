
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    console.log("🔍 Inspecting b2c_customers table...");

    // Attempt to select one record to see keys
    const { data, error } = await supabase.from('b2c_customers').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Keys found:", Object.keys(data[0]));
            console.log("Sample:", data[0]);
        } else {
            console.log("Table exists but is empty (or RLS mismatch, but using anon key).");
            // Try fetching with specific casing guesses if empty
        }
    }
}

main();
