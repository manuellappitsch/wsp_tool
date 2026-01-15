
import { db } from "@/lib/db";

async function findCustomer() {
    const users = await db.b2CCustomer.findMany({
        where: {
            OR: [
                { lastName: { contains: "Weber", mode: 'insensitive' } },
                { firstName: { contains: "Lukas", mode: 'insensitive' } }
            ]
        }
    });

    console.log("Found customers:", JSON.stringify(users, null, 2));
}

findCustomer();
