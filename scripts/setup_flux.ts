import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log('🚀 Starting Flux Logic Deployment (via pg)...');

    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations_flux', '001_logic_and_security.sql');

    if (!fs.existsSync(sqlPath)) {
        console.error(`❌ SQL file not found at: ${sqlPath}`);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Parse DATABASE_URL from environment
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is missing in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for some Supabase connection modes or locally if self-signed
        }
    });

    try {
        console.log('📡 Connecting to database...');
        await client.connect();

        console.log('⚡ Executing SQL...');
        await client.query(sqlContent);

        console.log('✅ Flux Logic & Security Policies successfully applied!');
    } catch (error) {
        console.error('❌ Error executing SQL:', error);
        console.log('\n💡 Tip: If this fails, copy content of supabase/migrations_flux/001_logic_and_security.sql to Supabase Dashboard.');
    } finally {
        await client.end();
    }
}

main();
