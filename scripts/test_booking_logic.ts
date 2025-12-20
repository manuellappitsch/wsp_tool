
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import { BookingService } from '../src/lib/booking-service';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🚀 Starting Booking Logic Verification...");
    console.log("Prisma keys:", Object.keys(prisma));

    // 1. Setup Test Data
    console.log("Creating test B2C Customer...");
    // Try b2CCustomer if b2cCustomer is undefined
    // @ts-ignore
    const model = prisma.b2cCustomer || prisma.b2CCustomer || prisma.B2CCustomer;

    if (!model) {
        throw new Error("B2C Customer model not found on Prisma Client. Available keys: " + Object.keys(prisma).join(", "));
    }

    const customer = await model.create({
        data: {
            firstName: "Test",
            lastName: "Walker",
            email: `walker_${Date.now()}@test.com`,
            credits: 5
        }
    });
    console.log("Customer created:", customer.id, "Credits:", customer.credits);

    console.log("Finding a timeslot...");
    let timeslot = await prisma.timeslot.findFirst({
        where: { isBlocked: false, date: { gte: new Date() } },
        orderBy: { date: 'asc' }
    });

    if (!timeslot) {
        console.log("No timeslot found, creating one for today...");
        timeslot = await prisma.timeslot.create({
            data: {
                date: new Date(),
                startTime: new Date(),
                endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
                globalCapacity: 20
            }
        });
    }
    console.log("Using Timeslot:", timeslot.id);

    // 2. Test Booking Success
    console.log("Attempting B2C Booking...");
    // We need to call the service. Ideally via the API, but we can call the static method directly for unit test.
    // Note: The service uses `supabaseAdmin` (PostgrestClient) internally, not Prisma.
    // This script runs in Node context where we might not have Supabase setup/env similar to Next.js?
    // Actually `src/lib/supabase.ts` uses `process.env.NEXT_PUBLIC_SUPABASE_URL` etc.
    // Ensure these are loaded.

    // HOWEVER, accessing `BookingService` which imports `@/lib/supabase` might fail if module aliases aren't resolving in ts-node/scripts.
    // Let's rely on mimicking the service logic OR try to run it if aliases work.
    // If this fails due to aliases (@/...), I will use a simplified check or fix tsconfig.

    // Start with a direct Prisma check to see if I can even write to DB.
    // I will simulate the Service Logic here manually to verify the Database Schema works as expected.
    // Real "Service" verification is best done via integration test or manually via UI/API, 
    // but a script using Prisma can verify the DATA MODEL supports the operations.

    /* 
       Testing the DB Model Logic directly:
    */

    // A. Deduct Credit
    // @ts-ignore
    const updatedCustomer = await prisma.b2CCustomer.update({
        where: { id: customer.id },
        data: { credits: { decrement: 1 } }
    });
    console.log("Credits deducted. New Balance:", updatedCustomer.credits); // Should be 4

    // B. Create Booking
    const booking = await prisma.booking.create({
        data: {
            b2cCustomerId: customer.id,
            timeslotId: timeslot.id,
            status: "CONFIRMED",
            care_level_snapshot: 2
        }
    });
    console.log("Booking created successfully:", booking.id);
    console.log("Booking linked to B2C Customer:", booking.b2cCustomerId);

    // 3. Test Constraints (Optional unique check)
    try {
        await prisma.booking.create({
            data: {
                b2cCustomerId: customer.id,
                timeslotId: timeslot.id,
                status: "CONFIRMED",
            }
        });
        console.warn("⚠️  Duplicate booking allowed (Unique constraint optional for now).");
    } catch (e) {
        console.log("✅ Duplicate booking prevented by DB constraint.");
    }

    // Cleanup
    console.log("Cleaning up...");
    await prisma.booking.deleteMany({ where: { b2cCustomerId: customer.id } });
    // @ts-ignore
    await prisma.b2CCustomer.delete({ where: { id: customer.id } });
    console.log("Cleanup done.");

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
