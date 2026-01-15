
import { db } from "@/lib/db";

async function main() {
    console.log("Testing AdminNotification creation...");

    if (!db.adminNotification) {
        console.error("ERROR: db.adminNotification is UNDEFINED.");
        process.exit(1);
    }

    try {
        const n = await db.adminNotification.create({
            data: {
                title: "Test Notification",
                message: "This is a direct test from script.",
                type: "INFO"
            }
        });
        console.log("SUCCESS: Created notification", n.id);
    } catch (e) {
        console.error("FAILURE:", e);
    }
}

main();
