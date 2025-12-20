
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding B2C Customers...");

    const dummyCustomers = [
        {
            firstName: "Max",
            lastName: "Mustermann",
            email: "max@privat.de",
            phone: "+49 123 456789",
            credits: 10,
            notes: "Stammkunde, zahlt bar.",
            careLevel: 2
        },
        {
            firstName: "Anna",
            lastName: "Schmidt",
            email: "anna@privat.de",
            phone: "+49 987 654321",
            credits: 3,
            notes: "Neu dabei.",
            careLevel: 1
        },
        {
            firstName: "Lukas",
            lastName: "Weber",
            email: "lukas@privat.de",
            credits: 0,
            notes: "Muss Credits aufladen.",
            careLevel: 5
        }
    ];

    for (const cust of dummyCustomers) {
        // @ts-ignore
        const exists = await prisma.b2CCustomer.findUnique({ where: { email: cust.email } });
        if (!exists) {
            // @ts-ignore
            await prisma.b2CCustomer.create({ data: cust });
            console.log(`Created: ${cust.firstName} ${cust.lastName}`);
        } else {
            console.log(`Skipped (Exists): ${cust.firstName} ${cust.lastName}`);
        }
    }

    console.log("✅ Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
