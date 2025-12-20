
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("--- AUTH DIAGNOSTIC ---")
    console.log("Connecting to DB...")

    try {
        const admin = await prisma.globalAdmin.findUnique({
            where: { email: 'admin@wsp.com' }
        })

        if (!admin) {
            console.log("❌ User 'admin@wsp.com' NOT FOUND in GlobalAdmin table.")
            // Check User table just in case
            const user = await prisma.user.findUnique({ where: { email: 'admin@wsp.com' } })
            if (user) console.log("⚠️ Found 'admin@wsp.com' in User table instead (Wrong table?)")
        } else {
            console.log("✅ User found in GlobalAdmin table.")
            console.log("Stored Hash:", admin.passwordHash)

            const valid = await bcrypt.compare('password123', admin.passwordHash)
            console.log("Password 'password123' match:", valid ? "✅ YES" : "❌ NO")

            // Check Tenant Admin
            const tenantAdmin = await prisma.tenantAdmin.findUnique({ where: { email: 'chef@musterfirma.com' } })
            if (tenantAdmin) {
                console.log("✅ Tenant Admin found.")
            } else {
                console.log("❌ Tenant Admin NOT Found.")
            }
        }

    } catch (e) {
        console.error("DB Connection Failed:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
