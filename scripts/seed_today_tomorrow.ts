
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("📅 Seeding Today & Tomorrow Bookings...");

    const tenants = await prisma.tenant.findMany({ include: { users: true } });
    const allUsers = tenants.flatMap(t => t.users);

    if (allUsers.length === 0) {
        console.error("No users found. Run seed_dashboard_data.ts first.");
        return;
    }

    const targetDays = [new Date(), new Date(new Date().setDate(new Date().getDate() + 1))];

    for (const day of targetDays) {
        day.setHours(0, 0, 0, 0);
        console.log(`Processing ${day.toISOString().split('T')[0]}...`);

        // 1. Ensure slots 08:00 - 18:00
        const slotsToBook = [];
        for (let h = 8; h < 18; h++) {
            const start = new Date(day);
            start.setHours(h, 0, 0, 0);
            const end = new Date(start);
            end.setHours(h + 1, 0, 0, 0);

            const slot = await prisma.timeslot.upsert({
                where: {
                    date_startTime: {
                        date: day,
                        startTime: start
                    }
                },
                update: {},
                create: {
                    date: day,
                    startTime: start,
                    endTime: end,
                    globalCapacity: 20
                }
            });
            slotsToBook.push(slot);
        }

        // 2. Book ~15 random slots
        const bookingsCount = 15;
        console.log(`   - Injecting ${bookingsCount} bookings...`);

        for (let i = 0; i < bookingsCount; i++) {
            const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
            const randomSlot = slotsToBook[Math.floor(Math.random() * slotsToBook.length)];

            // Logic for status
            let status = "CONFIRMED";
            const now = new Date();
            const slotStart = new Date(randomSlot.startTime);

            // Adjust slot date to match 'day' because randomSlot.startTime might be from DB generic or we just use slot object.
            // Actually randomSlot.startTime IS correct ISO from DB.

            if (slotStart < now) {
                // Past
                const rand = Math.random();
                if (rand > 0.9) status = "NO_SHOW";
                else if (rand > 0.8) status = "CANCELLED";
                else status = "COMPLETED";
            } else {
                // Future
                if (Math.random() > 0.95) status = "CANCELLED";
            }

            try {
                await prisma.booking.create({
                    data: {
                        userId: randomUser.id,
                        timeslotId: randomSlot.id,
                        // @ts-ignore
                        status: status
                    }
                });

                await prisma.timeslot.update({
                    where: { id: randomSlot.id },
                    data: { bookedCount: { increment: 1 } }
                });
            } catch (e) {
                // Duplicate booking ignore
            }
        }
    }

    console.log("✅ Done seeding Today & Tomorrow.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
