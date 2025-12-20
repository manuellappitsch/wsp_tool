
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    const { count, error } = await supabase
        .from('b2c_customers')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error counting customers:", error);
    } else {
        console.log(`✅ Found ${count} B2C customers in the database.`);
    }

    const { data } = await supabase.from('b2c_customers').select('firstName, lastName').limit(5);
    console.log("Sample:", data);
}

main();
