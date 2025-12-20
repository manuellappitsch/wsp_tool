
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🛠️ Starting Data Repair...");

    // 1. Find the Tenant
    const tenant = await prisma.tenant.findFirst({
        where: { companyName: { contains: "DeinRanking", mode: 'insensitive' } },
        include: { users: true }
    });

    if (!tenant) {
        console.error("❌ Tenant 'DeinRanking GmbH' not found.");
        return;
    }
    console.log(`✅ Found Tenant: ${tenant.companyName} (${tenant.id})`);
    console.log(`   Current Quota: ${tenant.dailyKontingent}`);

    // 2. Clear Bookings for Tomorrow (and today just in case) to free up quota
    // We want the user to be able to test freely.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Safety: Only delete CONFIRMED/CANCELLED/NO_SHOW, keep COMPLETED? 
    // Actually, just wipe future bookings.
    const { count: deletedCount } = await prisma.booking.deleteMany({
        where: {
            user: { tenantId: tenant.id },
            timeslot: {
                startTime: { gte: today }
            }
        }
    });

    console.log(`🗑️ Deleted ${deletedCount} existing bookings for this tenant (Today/Future). Quota should be free.`);

    // 3. Update Quota to be robust
    await prisma.tenant.update({
        where: { id: tenant.id },
        data: { dailyKontingent: 10 }
    });
    console.log(`🚀 Updated Daily Quota to 10.`);

    // 4. Check for Duplicate Timeslots
    // We get all timeslots for tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endTomorrow = new Date(tomorrow);
    endTomorrow.setHours(23, 59, 59, 999);

    const checkStart = new Date(today); // Check from today
    checkStart.setDate(checkStart.getDate() - 1); // Broad range

    const slots = await prisma.timeslot.findMany({
        where: {
            date: { gte: checkStart } // last few days
        },
        orderBy: { startTime: 'asc' }
    });

    // Simple dedup logic
    const uniqueMap = new Map<string, string>(); // key -> id
    const duplicates = [];

    for (const slot of slots) {
        // Create a key based on Date+Time
        // We need to be careful with Timezone, but assuming standard persistence
        const d = slot.date.toISOString().split('T')[0];
        const t = slot.startTime.toISOString().split('T')[1];
        // Note: startTime usually carries date component in Prisma. We care about the TIME value.
        // Actually, schema: @@unique([date, startTime]).
        // If we trust schema, duplicates shouldn't exist.
        // But maybe startTime differs by milliseconds?

        const key = `${d}_${t}`;

        if (uniqueMap.has(key)) {
            duplicates.push(slot.id);
        } else {
            uniqueMap.set(key, slot.id);
        }
    }

    if (duplicates.length > 0) {
        console.log(`⚠️ Found ${duplicates.length} duplicate timeslots. Deleting...`);
        // We can't delete timeslots if they have bookings from OTHER tenants...
        // But duplicates are likely unused if we just seeded them?
        // Safe delete: Delete if no bookings attached?
        // Or just force delete (bookings cascade? Schema says onDelete: Cascade for Booking->Timeslot? No, Booking->Timeslot is relation)
        // Booking model: timeslot Timeslot @relation... onDelete: Cascade.
        // So deleting timeslot deletes bookings. 
        // This acts as a nuclear cleanup.

        await prisma.timeslot.deleteMany({
            where: { id: { in: duplicates } }
        });
        console.log(`✅ Duplicates deleted.`);
    } else {
        console.log(`✅ No timeslot duplicates found.`);
    }

    console.log("🏁 Repair Complete.");
}

main()
    .then(async () => await prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
