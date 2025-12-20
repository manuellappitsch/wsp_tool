
import { addMinutes, format, isBefore, setHours, setMinutes } from "date-fns";

// MOCK LOGIC from src/actions/schedule.ts
// We want to test if the "Break Skipping" works.

async function testAlgorithm() {
    console.log("Starting Scheduler Algorithm Test...");

    // 1. Setup Mock Rules
    const rules = {
        openTime: new Date("1970-01-01T08:00:00"),
        closeTime: new Date("1970-01-01T10:00:00"),
        breaks: [
            {
                startTime: new Date("1970-01-01T09:00:00"),
                endTime: new Date("1970-01-01T09:30:00") // 30 min break
            }
        ]
    };

    console.log(`Rules: Open ${format(rules.openTime, 'HH:mm')} - ${format(rules.closeTime, 'HH:mm')}`);
    console.log(`Break: ${format(rules.breaks[0].startTime, 'HH:mm')} - ${format(rules.breaks[0].endTime, 'HH:mm')}`);

    // 2. Run Logic
    const slots = [];
    const openHour = parseInt(format(rules.openTime, "HH"));
    const openMin = parseInt(format(rules.openTime, "mm"));
    const closeHour = parseInt(format(rules.closeTime, "HH"));
    const closeMin = parseInt(format(rules.closeTime, "mm"));

    const currentDate = new Date(); // Today
    let currentSlot = setMinutes(setHours(currentDate, openHour), openMin);
    const dayEnd = setMinutes(setHours(currentDate, closeHour), closeMin);

    while (isBefore(currentSlot, dayEnd)) {
        const slotEnd = addMinutes(currentSlot, 30);

        // Break Check
        const slotStartStr = format(currentSlot, "HH:mm");
        const slotEndStr = format(slotEnd, "HH:mm");

        const isBlockedByBreak = rules.breaks.some(brk => {
            const brkStart = format(brk.startTime, "HH:mm");
            const brkEnd = format(brk.endTime, "HH:mm");
            return (slotStartStr >= brkStart && slotStartStr < brkEnd);
        });

        if (!isBlockedByBreak) {
            slots.push(format(currentSlot, "HH:mm"));
        } else {
            console.log(`Skipped Slot: ${slotStartStr} (Break Intersection)`);
        }

        currentSlot = slotEnd;
    }

    // 3. Assert
    console.log("Generated Slots:", slots);

    // Context: 08:00-10:00 = 08:00, 08:30, 09:00, 09:30.
    // Break 09:00-09:30 blocks the 09:00 slot.
    // Expected: 08:00, 08:30, 09:30.
    const expected = ["08:00", "08:30", "09:30"];

    if (JSON.stringify(slots) === JSON.stringify(expected)) {
        console.log("✅ SUCCESS: Logic correctly skipped the break slot.");
    } else {
        console.error("❌ FAILURE: Generated slots do not match expected.");
        console.error("Expected:", expected);
        console.error("Got:", slots);
        process.exit(1);
    }
}

testAlgorithm();
