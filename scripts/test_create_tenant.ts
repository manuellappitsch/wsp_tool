
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is missing!");
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testCreateTenant() {
    console.log("Starting Tenant Creation Test (with Adapter)...");

    const email = `test.admin.${Date.now()}@example.com`;
    const companyName = "Test Company " + Date.now();

    try {
        console.log(`Hashing password...`);
        const passwordHash = await bcrypt.hash("password123", 10);

        console.log(`Creating Tenant and Admin in transaction...`);
        await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    companyName,
                    dailyKontingent: 5,
                    billingAddress: "Test Str. 1",
                    admins: {
                        create: {
                            email,
                            firstName: "Test",
                            lastName: "Admin",
                            passwordHash,
                            inviteStatus: "PENDING"
                        }
                    }
                }
            });
            console.log(`✅ Tenant created: ${tenant.id} - ${tenant.companyName}`);
        });

    } catch (error) {
        console.error("❌ Error creating tenant:", error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

testCreateTenant();
