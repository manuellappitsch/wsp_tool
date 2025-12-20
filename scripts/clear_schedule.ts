
import "dotenv/config";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function main() {
    console.log("⚠️  Clearing ALL timeslots and bookings...");

    // Delete all timeslots (cascade should handle bookings if configured, but let's be safe)
    // First bookings
    const { error: bookingsError } = await supabaseAdmin.from('bookings').delete().neq('id', '000000');
    if (bookingsError) console.error("Error clearing bookings:", bookingsError);
    else console.log("✅ Bookings cleared.");

    // Then timeslots
    const { error: slotsError } = await supabaseAdmin.from('timeslots').delete().neq('id', '000000');
    if (slotsError) console.error("Error clearing timeslots:", slotsError);
    else console.log("✅ Timeslots cleared.");
}

main();
