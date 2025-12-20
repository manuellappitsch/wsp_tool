import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    console.log("Checking slots for week Dec 15 2025...");

    const { data: slots, error } = await supabase
        .from('timeslots')
        .select('*')
        .gte('date', '2025-12-15')
        .lte('date', '2025-12-21');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${slots?.length} slots.`);
    if (slots && slots.length > 0) {
        console.log("Sample Slot:", slots[0]);
        console.log("Sample Date Type:", typeof slots[0].date, slots[0].date);
        console.log("Sample Time Type:", typeof slots[0].startTime, slots[0].startTime);
    } else {
        console.log("No slots found! You need to seed them.");
    }
}

check();
