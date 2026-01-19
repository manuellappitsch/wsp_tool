
import 'dotenv/config';
import { db } from "../src/lib/db";

async function main() {
    console.log("🚀 Deploying Supabase Auth Hook (Trigger)...");

    // 1. Create the Function
    // This function will be called by the trigger.
    // It maps auth.users data to public.profiles.
    const createFunction = `
    create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer set search_path = public
    as $$
    begin
        insert into public.profiles (id, email, "firstName", "lastName", role)
        values (
            new.id, 
            new.email, 
            coalesce(new.raw_user_meta_data->>'firstName', ''), 
            coalesce(new.raw_user_meta_data->>'lastName', ''),
            'USER' -- Default Role
        );
        return new;
    end;
    $$;
    `;

    // 2. Create the Trigger
    // It listens for INSERT on auth.users and executes the function.
    const createTrigger = `
    drop trigger if exists on_auth_user_created on auth.users;
    
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
    `;

    try {
        console.log("Installing Function...");
        await db.$executeRawUnsafe(createFunction);
        
        console.log("Installing Trigger...");
        await db.$executeRawUnsafe(createTrigger);
        
        console.log("✅ Trigger deployed successfully.");
        console.log("New users created in Supabase Dashboard will now automatically get a Profile.");
    } catch (e) {
        console.error("❌ Failed to deploy trigger:", e);
    }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
