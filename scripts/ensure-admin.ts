import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=')
        if (parts.length >= 2) {
            const key = parts[0].trim()
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '')
            if (key && !process.env[key]) {
                process.env[key] = value
            }
        }
    })
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    console.error("DATABASE_URL is missing")
    process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Resetting admin credentials...")
    const passwordHash = await bcrypt.hash('password123', 10)

    // Upsert Admin
    await prisma.globalAdmin.upsert({
        where: { email: 'admin@wsp.com' },
        update: { passwordHash },
        create: {
            email: 'admin@wsp.com',
            passwordHash,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN'
        },
    })
    console.log("✅ Admin admin@wsp.com / password123 ensured.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
