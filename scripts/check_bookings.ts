
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
            const user = Array.isArray(b.user) ? b.user[0] : b.user;
            const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
            const who = user ? `User: ${user.firstName} ${user.lastName}` : (customer ? `Customer: ${customer.firstName} ${customer.lastName}` : "Unknown");
            console.log(`[${b.createdAt}] Slot: ${b.timeslotId} - ${who} - Level: ${b.care_level_snapshot}`);
        });
    }
}

main();
