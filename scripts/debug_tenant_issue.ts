
import { db } from "../src/lib/db";

async function main() {
    console.log("Searching for DeinRanking tenant...");

    // Case Insensitive Search usually requires raw query or text search mode, 
    // but Prisma `contains` is usually case-insensitive in Postgres IF configured or using mode 'insensitive'
    // Here we just use what was there but updated for Profile
    const tenant = await db.tenant.findFirst({
        where: { companyName: { contains: "DeinRanking", mode: 'insensitive' } },
        include: { profiles: true }
    });

    if (!tenant) {
        console.error("Not found.");
        return;
    }

    console.log("Found Tenant:", tenant.companyName, tenant.id);
    console.log("Profiles:", tenant.profiles.length);
    tenant.profiles.forEach(u => console.log(` - ${u.firstName} ${u.lastName} (${u.email}) [${u.role}]`));
}

main();
