
import "dotenv/config";
import { db as prisma } from "../src/lib/db";
import { addDays, setHours, setMinutes, isBefore, addMinutes } from "date-fns";
import { createId } from "@paralleldrive/cuid2";

async function main() {
    console.log("Seeding Timeslots...");

    const today = new Date();
    const daysToSeed = 30;

    for (let i = 0; i < daysToSeed; i++) {
        const currentDate = addDays(today, i);

        // Set fixed hours: 08:00 to 18:00
        const startHour = 8;
        const endHour = 18; // Original end time was 18:00

        for (let hour = startHour; hour < endHour; hour++) {
            for (let min = 0; min < 60; min += 30) {
                let startTime = setMinutes(setHours(currentDate, hour), min);
                let endTime = addMinutes(startTime, 30);

                // Check if exists
                const existing = await prisma.timeslot.findFirst({
                    where: {
                        date: currentDate,
                        startTime: startTime
                    }
                });

                if (!existing) {
                    await prisma.timeslot.create({
                        data: {
                            date: currentDate,
                            startTime: startTime,
                            endTime: endTime,
                            globalCapacity: 10,
                            capacity_points: 20
                        } as any
                    });
                    process.stdout.write(".");
                }
            }
        }
    }

    console.log("\nDone!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
