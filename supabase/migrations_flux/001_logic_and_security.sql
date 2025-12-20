-- =============================================================================
-- FLUX: Database Security & Logic Layer
-- Description: Implements RLS, Role detection, and Quota algorithms.
-- Context: Works on top of the Prisma-defined schema (Tables: tenants, users, etc.)
-- =============================================================================

-- Enable RLS on core tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_admins ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER: Identify User Role & Context based on Email (Bridging Supabase Auth <-> Prisma CUIDs)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text AS $$
    SELECT auth.jwt() ->> 'email';
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS text AS $$
DECLARE
    v_email text := public.get_current_user_email();
    v_tenant_id text;
BEGIN
    -- Check if User
    SELECT "tenantId" INTO v_tenant_id FROM public.users WHERE email = v_email;
    IF v_tenant_id IS NOT NULL THEN RETURN v_tenant_id; END IF;

    -- Check if Tenant Admin
    SELECT "tenantId" INTO v_tenant_id FROM public.tenant_admins WHERE email = v_email;
    IF v_tenant_id IS NOT NULL THEN RETURN v_tenant_id; END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.global_admins WHERE email = public.get_current_user_email()
    );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_tenant_admin_for(p_tenant_id text)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_admins 
        WHERE email = public.get_current_user_email() AND "tenantId" = p_tenant_id
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- 1. TENANTS
-- Global Admin: View/Edit all
CREATE POLICY "Global Admin all tenants" ON tenants
    FOR ALL
    USING (public.is_global_admin());

-- Tenant Admin: View OWN tenant
CREATE POLICY "Tenant Admin view own tenant" ON tenants
    FOR SELECT
    USING (id = public.get_my_tenant_id());

-- User: View OWN tenant (necessary to see company details)
CREATE POLICY "User view own tenant" ON tenants
    FOR SELECT
    USING (id = public.get_my_tenant_id());


-- 2. USERS (Employees)
-- Global Admin: View/Edit all
CREATE POLICY "Global Admin all users" ON users
    FOR ALL
    USING (public.is_global_admin());

-- Tenant Admin: View/Edit users in OWN tenant
CREATE POLICY "Tenant Admin manage own users" ON users
    FOR ALL
    USING ("tenantId" = public.get_my_tenant_id());

-- User: View SELF
CREATE POLICY "User view self" ON users
    FOR SELECT
    USING (email = public.get_current_user_email());


-- 3. BOOKINGS
-- Global Admin: View all
CREATE POLICY "Global Admin all bookings" ON bookings
    FOR ALL
    USING (public.is_global_admin());

-- Tenant Admin: View bookings of OWN tenant's users
CREATE POLICY "Tenant Admin view tenant bookings" ON bookings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = bookings."userId" AND u."tenantId" = public.get_my_tenant_id()
        )
    );

-- User: View OWN bookings
CREATE POLICY "User manage own bookings" ON bookings
    FOR ALL
    USING (
        "userId" IN (SELECT id FROM users WHERE email = public.get_current_user_email())
    );


-- =============================================================================
-- LOGIC: Quota & Booking Algorithm
-- =============================================================================

-- Function to check quota availability for a specific tenant on a date
CREATE OR REPLACE FUNCTION public.check_tenant_quota(p_tenant_id text, p_date date)
RETURNS boolean AS $$
DECLARE
    v_daily_limit int;
    v_current_usage int;
BEGIN
    -- Get Tenant Limit
    SELECT "dailyKontingent" INTO v_daily_limit FROM tenants WHERE id = p_tenant_id;
    
    -- Count confirmed bookings for this tenant on this date
    SELECT count(*) INTO v_current_usage
    FROM bookings b
    JOIN users u ON b."userId" = u.id
    JOIN timeslots t ON b."timeslotId" = t.id
    WHERE u."tenantId" = p_tenant_id
      AND t.date = p_date
      AND b.status IN ('CONFIRMED', 'COMPLETED');
      
    RETURN v_current_usage < v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Secure Booking Endpoint (Transactional + Locking)
-- logic: Lock -> Check Quota -> Check Global Capacity -> Insert Booking
CREATE OR REPLACE FUNCTION public.book_training_slot(p_timeslot_id text, p_user_email text)
RETURNS json AS $$
DECLARE
    v_user_id text;
    v_tenant_id text;
    v_date date;
    v_booking_id text;
    v_daily_limit int;
    v_current_usage int;
    v_global_capacity int;
    v_global_booked int;
BEGIN
    -- 1. Resolve User & Tenant
    SELECT id, "tenantId" INTO v_user_id, v_tenant_id 
    FROM users WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    -- 2. Resolve Timeslot Date & Capacity
    SELECT date, "globalCapacity" INTO v_date, v_global_capacity 
    FROM timeslots WHERE id = p_timeslot_id;
    
    IF v_date IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Timeslot not found');
    END IF;

    -- =========================================================================
    -- 🔒 CRITICAL SECURITY LOCK
    -- Acquire an exclusive lock on the 'bookings' table partition or use advisory lock
    -- to prevent race conditions during the count-then-write cycle.
    -- For high performance, we use advisory locks based on Hashes, but for absolute safety
    -- here we lock the rows involved by locking the timeslot explicitly via FOR UPDATE 
    -- if we were updating it, but we are inserting into bookings.
    -- Better approach: Lock the Tenant for Quota Check AND Lock the Timeslot for Capacity Check.
    -- =========================================================================
    
    -- Lock 1: Serialize Tenant Bookings (Prevents Quota Race Condition)
    -- Using pg_advisory_xact_lock with a hash of the tenant_id
    PERFORM pg_advisory_xact_lock(hashtext(v_tenant_id));

    -- Lock 2: Serialize Timeslot Bookings (Prevents Global Capacity Race Condition)
    -- Using pg_advisory_xact_lock with a hash of the timeslot_id
    PERFORM pg_advisory_xact_lock(hashtext(p_timeslot_id));

    -- 3. Check Tenant Quota (Now Safe due to Lock 1)
    SELECT "dailyKontingent" INTO v_daily_limit FROM tenants WHERE id = v_tenant_id;
    
    SELECT count(*) INTO v_current_usage
    FROM bookings b
    JOIN users u ON b."userId" = u.id
    JOIN timeslots t ON b."timeslotId" = t.id
    WHERE u."tenantId" = v_tenant_id
      AND t.date = v_date
      AND b.status IN ('CONFIRMED', 'COMPLETED');
      
    IF v_current_usage >= v_daily_limit THEN
        RETURN json_build_object('success', false, 'error', 'Daily quota exceeded for company');
    END IF;

    -- 4. Check Global Capacity (Now Safe due to Lock 2)
    SELECT count(*) INTO v_global_booked
    FROM bookings 
    WHERE "timeslotId" = p_timeslot_id
    AND status IN ('CONFIRMED', 'COMPLETED');

    IF v_global_booked >= v_global_capacity THEN
        RETURN json_build_object('success', false, 'error', 'Timeslot is fully booked');
    END IF;

    -- 5. Create Booking
    -- Using gen_random_uuid() which returns UUID type, cast to text for Prisma compatibility
    INSERT INTO bookings (id, "userId", "timeslotId", "status", "updatedAt")
    VALUES (gen_random_uuid()::text, v_user_id, p_timeslot_id, 'CONFIRMED', now())
    RETURNING id INTO v_booking_id;
    
    -- 6. Update Timeslot Counter (Optional denormalization, helps performance later)
    UPDATE timeslots 
    SET "bookedCount" = "bookedCount" + 1 
    WHERE id = p_timeslot_id;
    
    RETURN json_build_object('success', true, 'bookingId', v_booking_id);

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
