
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting Dashboard Data Seeding...");

    // ==========================================
    // 1. Ensure at least 6 Tenants
    // ==========================================
    const currentTenants = await prisma.tenant.findMany();
    console.log(`found ${currentTenants.length} existing tenants.`);

    const targetTenantCount = 6;
    const tenantsToCreate = Math.max(0, targetTenantCount - currentTenants.length);

    const fictiveCompanies = [
        "Alpha Solutions GmbH",
        "Beta Innovations KG",
        "Gamma Logistics AG",
        "Delta Systems",
        "Epsilon Health",
        "Zeta Future Corp",
        "Omega Trading",
        "Nexus Dynamics"
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    for (let i = 0; i < tenantsToCreate; i++) {
        const companyName = fictiveCompanies[i % fictiveCompanies.length] + ` ${Math.floor(Math.random() * 100)}`;
        const emailPrefix = companyName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        const adminEmail = `admin@${emailPrefix}${Math.floor(Math.random() * 1000)}.com`;

        console.log(`Creating Tenant: ${companyName}`);

        await prisma.tenant.create({
            data: {
                companyName,
                dailyKontingent: Math.floor(Math.random() * 15) + 5, // 5-20
                billingCity: "Musterstadt",
                admins: {
                    create: {
                        email: adminEmail,
                        firstName: "Admin",
                        lastName: "Muster",
                        passwordHash,
                        initialPassword: "password123",
                        inviteStatus: "ACCEPTED"
                    }
                }
            }
        });
    }

    // Reload tenants
    const allTenants = await prisma.tenant.findMany();
    console.log(`✅ Total Tenants: ${allTenants.length}`);

    // ==========================================
    // 2. Ensure 5+ Employees per Tenant
    // ==========================================
    for (const tenant of allTenants) {
        const userCount = await prisma.user.count({ where: { tenantId: tenant.id } });
        const missingUsers = Math.max(0, 5 - userCount);

        if (missingUsers > 0) {
            console.log(`Tenant ${tenant.companyName} needs ${missingUsers} more users.`);
            for (let j = 0; j < missingUsers; j++) {
                const firstName = "Mitarbeiter";
                const lastName = `Nr. ${userCount + j + 1}`;
                const email = `user_${tenant.companyName.substring(0, 3).toLowerCase()}_${Date.now()}_${j}@test.com`.replace(/\s/g, '');

                await prisma.user.create({
                    data: {
                        tenantId: tenant.id,
                        firstName,
                        lastName,
                        email,
                        passwordHash,
                        initialPassword: "password123",
                        isActive: true,
                        inviteStatus: "ACCEPTED"
                    }
                });
            }
        }
    }
    console.log("✅ All tenants have at least 5 users.");

    // ==========================================
    // 3. Ensure Timeslots (Past & Future)
    // ==========================================
    // Create slots for last 7 days and next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = -7; d <= 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);

        // 5 slots per day: 09:00 - 14:00
        for (let h = 9; h < 14; h++) {
            const start = new Date(date);
            start.setHours(h, 0, 0, 0);
            const end = new Date(start);
            end.setHours(h + 1, 0, 0, 0);

            await prisma.timeslot.upsert({
                where: {
                    date_startTime: {
                        date: date,
                        startTime: start
                    }
                },
                update: {},
                create: {
                    date: date,
                    startTime: start,
                    endTime: end,
                    globalCapacity: 20
                }
            });
        }
    }
    console.log("✅ Timeslots prepared for +/- 7 days.");

    // ==========================================
    // 4. Create ~10 Bookings per Tenant
    // ==========================================
    const allTimeslots = await prisma.timeslot.findMany();

    for (const tenant of allTenants) {
        // Get tenant users
        const users = await prisma.user.findMany({ where: { tenantId: tenant.id } });
        if (users.length === 0) continue;

        // Check existing bookings to avoid over-seeding if run multiple times
        const existingBookings = await prisma.booking.count({
            where: { user: { tenantId: tenant.id } }
        });

        const bookingsNeeded = Math.max(0, 10 - existingBookings);

        if (bookingsNeeded > 0) {
            console.log(`Generating ${bookingsNeeded} bookings for ${tenant.companyName}...`);

            for (let k = 0; k < bookingsNeeded; k++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const randomSlot = allTimeslots[Math.floor(Math.random() * allTimeslots.length)];

                // Determine status based on date
                let status = "CONFIRMED";
                const now = new Date();

                if (randomSlot.startTime < now) {
                    status = Math.random() > 0.8 ? "NO_SHOW" : "COMPLETED"; // mostly completed
                } else {
                    status = Math.random() > 0.9 ? "CANCELLED" : "CONFIRMED";
                }

                // Check if slot already booked by this user (simple check, try catch implicit via no duplicate logic here but keeping it simple)
                // We'll just try/catch the create
                try {
                    await prisma.booking.create({
                        data: {
                            userId: randomUser.id,
                            timeslotId: randomSlot.id,
                            // @ts-ignore
                            status: status
                        }
                    });
                    // Update stats
                    await prisma.timeslot.update({
                        where: { id: randomSlot.id },
                        data: { bookedCount: { increment: 1 } }
                    });
                } catch (e) {
                    // Ignore unique constraint violations or similar
                }
            }
        }
    }

    console.log("✅ Bookings generated.");
    console.log("🎉 Seeding complete!");
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
