const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env");
let connectionString = "postgresql://postgres:postgres@localhost:5432/wsp_b2b_portal";

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/DATABASE_URL=(.*)/);
    if (match && match[1]) {
        connectionString = match[1].replace(/"/g, "").trim();
    }
}

const client = new Client({ connectionString });

async function main() {
    try {
        await client.connect();

        console.log("--- Timeslots Check (Next 10 Slots) ---");
        // Get slots for tomorrow (Thu 12-18 or Fri 12-19)
        const d = new Date(); // now
        d.setDate(d.getDate() + 1);
        const dateStr = d.toISOString().split('T')[0];

        const slotsRes = await client.query(`
            SELECT * FROM "timeslots" 
            WHERE date >= $1::timestamp 
            ORDER BY "date" ASC, "startTime" ASC 
            LIMIT 50
        `, [dateStr]);

        console.log(`Slots starting from ${dateStr}:`);
        for (const s of slotsRes.rows) {
            let startRaw = s.startTime;
            // pg returns string for TIME type usually
            console.log(`  Date: ${new Date(s.date).toISOString().split('T')[0]} | Start: ${startRaw} (Type: ${typeof startRaw})`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

main();
