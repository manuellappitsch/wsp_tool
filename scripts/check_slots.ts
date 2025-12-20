
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const start = new Date("2025-12-15T00:00:00.000Z");
    const end = new Date("2025-12-21T23:59:59.000Z");

    console.log(`Checking slots between ${start.toISOString()} and ${end.toISOString()}`);

    const count = await prisma.timeslot.count({
        where: {
            date: {
                gte: start,
                lte: end
            }
        }
    });

    console.log(`Found ${count} timeslots.`);

    if (count > 0) {
        const sample = await prisma.timeslot.findFirst({
            where: {
                date: {
                    gte: start,
                    lte: end
                }
            }
        });
        console.log("Sample slot:", sample);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
