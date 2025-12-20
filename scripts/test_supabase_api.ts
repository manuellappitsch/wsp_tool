
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testApi() {
    console.log("Testing Supabase API with SERVICE ROLE Key (sb_secret...)...")



    const tables = ['users', 'global_admins', 'tenants', 'bookings'];

    for (const t of tables) {
        process.stdout.write(`Checking '${t}' (SELECT * limit 1)... `);
        const { data, error } = await supabase.from(t).select('*').limit(1);

        if (error) {
            console.log(`❌ (${error.code}) ${error.message}`);
        } else {
            console.log(`✅ OK`);
            if (data && data.length > 0) {
                console.log(`   Keys for ${t}:`, Object.keys(data[0]).join(', '));
            } else {
                console.log(`   (Table empty)`);
            }
        }
    }
}

testApi()
