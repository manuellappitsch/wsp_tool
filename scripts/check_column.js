
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='initialPassword';
        `);
        if (res.rows.length > 0) {
            console.log("✅ Column 'initialPassword' EXISTS in 'users' table.");
        } else {
            console.log("❌ Column 'initialPassword' DOES NOT EXIST in 'users' table.");
        }
        await client.end();
    } catch (err) {
        console.error("Error:", err);
    }
}

check();
