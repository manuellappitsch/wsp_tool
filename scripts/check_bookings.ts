
import "dotenv/config";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function main() {
    console.log("Checking recent bookings...");

    const { data: bookings, error } = await supabaseAdmin
        .from('bookings')
        .select(`
            id, 
            timeslotId,
            status, 
            care_level_snapshot,
            createdAt,
            user:users(firstName, lastName),
            customer:b2c_customers(firstName, lastName)
        `)
        .order('createdAt', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Recent Bookings:");
        bookings?.forEach(b => {
            const who = b.user ? `User: ${b.user.firstName} ${b.user.lastName}` : (b.customer ? `Customer: ${b.customer.firstName} ${b.customer.lastName}` : "Unknown");
            console.log(`[${b.createdAt}] Slot: ${b.timeslotId} - ${who} - Level: ${b.care_level_snapshot}`);
        });
    }
}

main();
