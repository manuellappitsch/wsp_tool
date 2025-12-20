
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase in many envs
});

async function test() {
    console.log("Testing RAW Postgres Connection to:", process.env.DATABASE_URL?.split('@')[1]); // Mask password
    try {
        await client.connect();
        console.log("✅ SUCCESS: Connected to Supabase via 'pg' client!");
        const res = await client.query('SELECT NOW()');
        console.log("Updated at:", res.rows[0].now);
        await client.end();
    } catch (err) {
        console.error("❌ FAILURE: Could not connect.", err.message);
        if (err.code) console.error("Code:", err.code);
    }
}

// ... existing code ...
async function checkInternet() {
    console.log("Checking Internet (dns.lookup google.com)...");
    require('dns').lookup('google.com', (err) => {
        if (err) console.error("❌ Internet Check Failed:", err.code);
        else console.log("✅ Internet Check Success: google.com resolved.");
    });
}

test();
checkInternet();
