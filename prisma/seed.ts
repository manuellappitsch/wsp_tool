import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10)

    // 1. Create Global Admin
    const admin = await prisma.globalAdmin.upsert({
        where: { email: 'admin@wsp.com' },
        update: {},
        create: {
            email: 'admin@wsp.com',
            passwordHash,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN'
        },
    })

    console.log({ admin })

    // 2. Create Demo Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'demo-tenant' },
        update: {},
        create: {
            id: 'demo-tenant',
            companyName: 'Musterfirma GmbH',
            dailyKontingent: 5,
            primaryColor: '#000000',
        }
    })

    // 3. Create Tenant Admin
    const tenantAdmin = await prisma.tenantAdmin.upsert({
        where: { email: 'chef@musterfirma.com' },
        update: {},
        create: {
            email: 'chef@musterfirma.com',
            passwordHash,
            firstName: 'Max',
            lastName: 'Musterchef',
            tenantId: tenant.id
        }
    })

    // 4. Create Employee (User)
    const employee = await prisma.user.upsert({
        where: { email: 'mitarbeiter@musterfirma.com' },
        update: {},
        create: {
            email: 'mitarbeiter@musterfirma.com',
            passwordHash,
            firstName: 'Erika',
            lastName: 'Mustermann',
            tenantId: tenant.id
        }
    })

    console.log({ tenant, tenantAdmin, employee })

    // 5. Create Timeslots for Today and Tomorrow
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Create 5 slots for today
    for (let i = 9; i < 14; i++) {
        const start = new Date(today)
        start.setHours(i, 0, 0, 0)
        const end = new Date(start)
        end.setHours(i + 1, 0, 0, 0)

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
    console.log("✅ Seeded TimeSlots")
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
