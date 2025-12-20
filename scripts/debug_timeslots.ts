
import "dotenv/config";
import { supabaseAdmin } from "../src/lib/supabase-admin";

async function main() {
    console.log("Fetching Timeslots...");

    const { data, error } = await supabaseAdmin
        .from("timeslots")
        .select("*")
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Timeslots:", data);
    }
}

main();
