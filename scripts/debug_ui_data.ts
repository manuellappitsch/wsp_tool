
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugUiData() {
    console.log("--- DEBUGGING UI DATA FETCH ---");

    // Date Range: Next Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = (8 - dayOfWeek) % 7 || 7;
    const nextMonday = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
    // nextMonday.setUTCHours(0,0,0,0); // Use 00:00 UTC
    // Actually, let's use the exact query range used by frontend (Local Start of Week -> End of Week)
    // But simplified to just Monday coverage.

    // Frontend uses:
    // startOfWeek(currentDate, { weekStartsOn: 1 }) -> Local midnight?
    // If running in script (local timezone?), it might differ from Server.
    // Let's assume input is ISO string for 00:00 UTC to 23:59 UTC.

    const start = new Date(nextMonday);
    start.setHours(0, 0, 0, 0); // Local Midnight (Script env)
    const end = new Date(nextMonday);
    end.setHours(23, 59, 59, 999);

    console.log(`Querying for range: ${start.toISOString()} to ${end.toISOString()}`);

    // Mimic getAdminCalendarData logic
    const { data: slots, error } = await supabaseAdmin
        .from("timeslots")
        .select(`
                id, date, startTime, endTime, capacity_points, type,
                bookings (
                    id, status, care_level_snapshot
                )
            `)
        .gte("date", start.toISOString())
        .lte("date", end.toISOString());

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${slots.length} slots.`);

    if (slots.length > 0) {
        // Check Analysis Slots
        const analysis = slots.filter((s: any) => s.type === 'ANALYSIS');
        console.log(`Analysis Slots: ${analysis.length}`);

        // Mock Formatting Logic
        const formatBerlinTime = (dateStr: string) => {
            if (!dateStr) return "00:00";
            if (dateStr.length <= 8 && dateStr.includes(':')) return dateStr.substring(0, 5);
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr.substring(0, 5);
            return d.toLocaleTimeString('de-DE', {
                timeZone: 'Europe/Berlin',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        };

        analysis.slice(0, 5).forEach((s: any) => {
            const fmt = formatBerlinTime(s.startTime);
            console.log(`Slot ID: ${s.id}`);
            console.log(`  Raw StartTime: ${s.startTime}`);
            console.log(`  Fmt StartTime: ${fmt}`);
            console.log(`  Raw Date: ${s.date}`);

            // Check isSameDay match
            // Frontend: isSameDay(new Date(t.date), day)
            // day is loop iterator. 
            // If day is Monday.

            const slotDateObj = new Date(s.date);
            console.log(`  JS Date(s.date): ${slotDateObj.toString()}`);

            // Check against 'start'
            const isSame = slotDateObj.getDate() === start.getDate();
            console.log(`  Matches Query Day? ${isSame}`);
        });
    }
}

debugUiData();
