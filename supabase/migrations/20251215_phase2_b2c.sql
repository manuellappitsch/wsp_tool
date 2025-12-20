-- 1. Create B2C Customers Table
-- Stores offline/elderly clients managed by staff
CREATE TABLE IF NOT EXISTS b2c_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    insurance_number TEXT, -- For Krankenkasse lists
    hubspot_id TEXT,       -- CRM Sync
    credits_remaining INTEGER DEFAULT 0, -- "10er Block" counter
    care_level INTEGER DEFAULT 1,        -- 1=Basic (2pts), 2=Medium (3pts), 3=High (5pts)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Extend Timeslots Table
-- Add 'capacity_points' to support weighted booking logic alongside simple 'capacity'
ALTER TABLE timeslots 
ADD COLUMN IF NOT EXISTS capacity_points INTEGER DEFAULT 20;

-- 3. Extend Bookings Table
-- Link to B2C customers and store snapshot of weight/attendance
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS b2c_customer_id UUID REFERENCES b2c_customers(id),
ADD COLUMN IF NOT EXISTS care_level_snapshot INTEGER DEFAULT 1, -- Store weight at time of booking (e.g. 2, 3, or 5)
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE; -- For Check-In / Insurance proof

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_bookings_b2c_customer_id ON bookings(b2c_customer_id);
CREATE INDEX IF NOT EXISTS idx_b2c_customers_hubspot_id ON b2c_customers(hubspot_id);

-- 5. RLS Policies (Optional but recommended if RLS is on)
-- Allow Service Role (Admin) full access
ALTER TABLE b2c_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access" ON b2c_customers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- (If you want logged-in admins to read this via client-side Supabase, you'd add 'authenticated' policies here too)
