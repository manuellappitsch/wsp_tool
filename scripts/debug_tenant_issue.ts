
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Analyzing Duplicate Slots...");
    // Group by date/time to find duplicates
    const distinctSlots = await prisma.timeslot.groupBy({
        by: ['startTime'],
        _count: {
            id: true
        }
    });

    const duplicates = distinctSlots.filter((s: any) => s._count.id > 1);
    console.log(`Found ${duplicates.length} timestamps with duplicate slots.`);
    if (duplicates.length > 0) {
        console.log("Example:", duplicates[0]);
    }

    console.log("\nAnalyzing DeinRanking GmbH Tenant...");
    const tenant = await prisma.tenant.findFirst({
        where: { companyName: { contains: "DeinRanking" } },
        include: { users: true }
    });

    if (!tenant) {
        console.log("Tenant 'DeinRanking GmbH' not found.");
        return;
    }

    console.log(`Tenant: ${tenant.companyName} (${tenant.id})`);
    console.log(`Daily Limit: ${tenant.dailyKontingent}`);
    console.log(`Users: ${tenant.users.length}`);

    console.log("\nChecking Bookings for this Tenant (Next 3 Days)...");
    const bookings = await prisma.booking.findMany({
        where: {
            user: { tenantId: tenant.id },
            timeslot: {
                startTime: {
                    gte: new Date() // From now
                }
            }
        },
        include: {
            timeslot: true,
            user: true
        },
        orderBy: { timeslot: { startTime: 'asc' } }
    });

    bookings.forEach(b => {
        console.log(`- ${b.timeslot.startTime.toISOString()} | User: ${b.user ? b.user.email : 'Unknown'} | Status: ${b.status}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
