import { PrismaClient } from '@prisma/client'
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const db = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: ['warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
