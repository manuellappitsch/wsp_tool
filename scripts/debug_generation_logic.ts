const { PrismaClient } = require("@prisma/client");
const { format, addDays, startOfDay, addMinutes, isBefore } = require("date-fns");
const { toZonedTime, fromZonedTime } = require("date-fns-tz");
const dotenv = require("dotenv");

dotenv.config();
const prisma = new PrismaClient();
const TIME_ZONE = "Europe/Berlin";

function extractTime(iso) {
    return iso.toISOString().substr(11, 5);
}

async function main() {
    console.log("--- Debugging Opening Hours ---");
    const hours = await prisma.openingHours.findMany({
        orderBy: { dayOfWeek: 'asc' }
    });

    for (const h of hours) {
        console.log(`Day ${h.dayOfWeek}:`);
        console.log(`  Raw Open:  ${h.openTime.toISOString()}`);
        console.log(`  Raw Close: ${h.closeTime.toISOString()}`);

        const openStr = extractTime(h.openTime);
        const closeStr = extractTime(h.closeTime);
        console.log(`  Extracted: ${openStr} - ${closeStr}`);

        // Simulate Generation Logic
        const today = startOfDay(new Date());
        // Use tomorrow to be safe/standard
        const dayDate = addDays(today, 1);
        const dayStr = format(dayDate, "yyyy-MM-dd");

        console.log(`  Simulating for ${dayStr} (Berlin):`);

        const dayStartUTC = fromZonedTime(`${dayStr} ${openStr}`, TIME_ZONE);
        const dayEndUTC = fromZonedTime(`${dayStr} ${closeStr}`, TIME_ZONE);

        console.log(`  Calculated Start (UTC): ${dayStartUTC.toISOString()}`);
        console.log(`  Calculated End   (UTC): ${dayEndUTC.toISOString()}`);

        let currentSlot = dayStartUTC;
        let count = 0;

        // Loop simulation
        while (isBefore(currentSlot, dayEndUTC)) {
            const slotEnd = addMinutes(currentSlot, 30);

            // Convert to Berlin for display
            const slotBerlin = toZonedTime(currentSlot, TIME_ZONE);
            const slotTimeStr = format(slotBerlin, "HH:mm");

            if (slotTimeStr >= "16:00" && slotTimeStr <= "20:00") {
                console.log(`    Slot generated: ${slotTimeStr} (Berlin) -> ${currentSlot.toISOString()} (UTC)`);
            }

            count++;
            currentSlot = slotEnd;
            if (count > 50) break; // Safety
        }
        console.log(`  Total Slots: ${count}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
