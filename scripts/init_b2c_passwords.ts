import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
    console.error("❌ No DATABASE_URL found.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase from Node script often
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
    console.log("🔍 Searching for B2C Customers without password...");

    const customers = await db.b2CCustomer.findMany({
        where: {
            OR: [
                { passwordHash: { equals: null } },      // Explicit equals null for clarity
                { initialPassword: { equals: null } }
            ]
        }
    });

    console.log(`Found ${customers.length} customers to update.`);

    for (const customer of customers) {
        // Generate a random 8-char password
        const password = Math.random().toString(36).slice(-8);
        const hash = await bcrypt.hash(password, 10);

        await db.b2CCustomer.update({
            where: { id: customer.id },
            data: {
                initialPassword: password,
                passwordHash: hash
            }
        });

        console.log(`✅ Updated ${customer.firstName} ${customer.lastName} (${customer.email}) -> Password: ${password}`);
    }

    console.log("\n🚀 All customers updated. You can now reveal these passwords in the Admin UI.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
