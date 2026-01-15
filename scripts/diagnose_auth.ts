
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Diagnosing Auth...")

    try {
        const admin = await prisma.profile.findUnique({
            where: { email: 'admin@wsp.com' }
        })

        if (!admin) {
            console.log("❌ Admin Profile NOT FOUND in DB.")
        } else {
            console.log("✅ Admin Profile FOUND:", admin.id, admin.role)
        }

    } catch (e) {
        console.error("DB Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
