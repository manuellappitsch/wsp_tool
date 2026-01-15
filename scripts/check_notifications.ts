
import { db } from "@/lib/db";

async function main() {
    console.log("Checking AdminNotifications...");
    const count = await db.adminNotification.count();
    console.log(`Total Notifications: ${count}`);

    const notifications = await db.adminNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log("Latest 5:", JSON.stringify(notifications, null, 2));
}

main();
