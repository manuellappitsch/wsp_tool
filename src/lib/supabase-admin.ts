import { createClient } from '@supabase/supabase-js'

// TODO: Revert to process.env later!
const supabaseUrl = "https://dylocjiremrejotlrwdo.supabase.co"
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bG9jamlyZW1yZWpvdGxyd2RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTcwODkzMiwiZXhwIjoyMDgxMjg0OTMyfQ.YtwuLaUdo80GLMHWSwXHUpNh2JlrwiuRXrjTEtQDG3k"

if (!supabaseUrl) throw new Error("SUPABASE_ADMIN_ERR: NEXT_PUBLIC_SUPABASE_URL is missing.");
// Validation removed for hardcoded fix

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
