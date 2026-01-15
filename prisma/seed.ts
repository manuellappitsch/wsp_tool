import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'

// Setup Database Connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Setup Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dylocjiremrejotlrwdo.supabase.co"
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!serviceRoleKey) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing. Cannot seed auth users.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAuthUser(email: string, password: string, id?: string) {
    // Check if exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);

    if (existing) {
        console.log(`Auth User ${email} already exists.`);
        return existing.id;
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {},
        ...(id ? { id } : {})
    });

    if (error) {
        console.error(`Error creating auth user ${email}:`, error.message);
        throw error;
    }
    console.log(`✅ Created Auth User: ${email}`);
    return data.user.id;
}


async function main() {
    console.log("🌱 Seeding Database...");

    // IDs (UUIDs)
    const GLOBAL_ADMIN_ID = "00000000-0000-0000-0000-000000000001";
    const TENANT_ID = "11111111-1111-1111-1111-111111111111"; // Valid UUID
    const TENANT_ADMIN_ID = "00000000-0000-0000-0000-000000000002";
    const USER_ID = "00000000-0000-0000-0000-000000000003";

    // 1. Create Auth Users
    const adminAuthId = await createAuthUser('admin@wsp.com', 'password123', GLOBAL_ADMIN_ID);
    const tenantAdminAuthId = await createAuthUser('chef@musterfirma.com', 'password123', TENANT_ADMIN_ID);
    const userAuthId = await createAuthUser('mitarbeiter@musterfirma.com', 'password123', USER_ID);

    // 2. Create Global Admin Profile
    await prisma.profile.upsert({
        where: { email: 'admin@wsp.com' },
        update: {},
        create: {
            id: adminAuthId,
            email: 'admin@wsp.com',
            firstName: 'Super',
            lastName: 'Admin',
            role: 'GLOBAL_ADMIN',
            isActive: true
        }
    });

    // 3. Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: TENANT_ID },
        update: {},
        create: {
            id: TENANT_ID,
            companyName: 'Musterfirma GmbH',
            dailyKontingent: 5,
            primaryColor: '#000000',
        }
    });

    // 4. Create Tenant Admin Profile
    await prisma.profile.upsert({
        where: { email: 'chef@musterfirma.com' },
        update: {},
        create: {
            id: tenantAdminAuthId,
            email: 'chef@musterfirma.com',
            firstName: 'Max',
            lastName: 'Musterchef',
            role: 'TENANT_ADMIN',
            tenantId: tenant.id,
            isActive: true
        }
    });

    // 5. Create Employee Profile
    await prisma.profile.upsert({
        where: { email: 'mitarbeiter@musterfirma.com' },
        update: {},
        create: {
            id: userAuthId,
            email: 'mitarbeiter@musterfirma.com',
            firstName: 'Erika',
            lastName: 'Mustermann',
            role: 'USER',
            tenantId: tenant.id,
            isActive: true
        }
    });

    console.log("✅ Seeded Profiles & Tenant");

    // 6. Create Timeslots
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 9; i < 14; i++) {
        const start = new Date(today)
        start.setHours(i, 0, 0, 0)
        const end = new Date(start)
        end.setHours(i, 45, 0, 0) // 45 min slots

        await prisma.timeslot.upsert({
            where: {
                date_startTime: {
                    date: today,
                    startTime: start
                }
            },
            update: {},
            create: {
                date: today,
                startTime: start,
                endTime: end,
                globalCapacity: 10
            }
        })
    }
    console.log("✅ Seeded TimeSlots");
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
