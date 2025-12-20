
import "dotenv/config";
import { BookingService } from "../src/lib/booking-service";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function main() {
    // 1. Get a Timeslot
    const { data: slots } = await supabaseAdmin.from("timeslots").select("id").limit(1);
    const timeslotId = slots?.[0]?.id;
    console.log("Testing with Timeslot ID:", timeslotId);

    // 2. Get a Customer
    const { data: customers } = await supabaseAdmin.from("b2c_customers").select("id").limit(1);
    const customerId = customers?.[0]?.id;
    console.log("Testing with Customer ID:", customerId);

    if (!timeslotId || !customerId) {
        console.error("Missing test data.");
        return;
    }

    // 3. Test Booking Service CREATION
    console.log("Calling BookingService.createBooking...");
    const result = await BookingService.createBooking(
        { b2cCustomerId: customerId },
        timeslotId,
        "DEBUG BOOKING"
    );

    console.log("Result:", result);
}

main();
