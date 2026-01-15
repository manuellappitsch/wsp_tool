
import { db } from "@/lib/db";
import { config } from "dotenv";
config(); // Load env

async function main() {
    console.log("Testing AdminNotification creation with env loaded...");

    if (!db.adminNotification) {
        // This check might fail if types aren't loaded, but runtime might work if client is generated
        console.error("ERROR: db.adminNotification property missing on client.");
    } else {
        console.log("db.adminNotification property exists.");
    }

    try {
        const n = await db.adminNotification.create({
            data: {
                title: "System Check",
                message: "Notifications are working.",
                type: "INFO"
            }
        });
        console.log("SUCCESS: Created notification", n.id);
    } catch (e) {
        console.error("FAILURE:", e);
    }
}

main();
