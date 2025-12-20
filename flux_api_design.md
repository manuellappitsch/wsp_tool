# Flux API & Database Design

**Role:** Backend/Database Specialist (Flux)
**Consumer:** Application Logic (Agent Prisma)

## 1. Security Architecture (RLS)

All data access is gated by **Row Level Security (RLS)**.
The database automatically filters data based on the authenticated user's `email` (mapped from Supabase Auth).

### Context Setting
When connecting via "Agent Prisma" (Prisma ORM):
-   **Service Key**: Bypasses RLS (Use for Admin jobs only).
-   **Auth Context**: To respect RLS, you must set the PostgreSQL configuration parameter `request.jwt.claim.email` or use Supabase Client which handles `auth.uid()`.
    -   *Flux Implementation*: My policies use `auth.jwt() ->> 'email'`.
    -   *Prisma Usage*: Middleware required to set `current_setting` if not using Supabase Auth directly.

## 2. Core Logic Endpoints (RPCs)

Instead of complex client-side validation, call these database functions.

### `rpc/check_tenant_quota`
Checks if a tenant has remaining slots for a specific date.
-   **Params:** `tenant_id` (UUID/String), `date` (YYYY-MM-DD)
-   **Returns:** `boolean` (true = available, false = quota exceeded)
-   **SQL:** `SELECT * FROM check_tenant_quota('tenant_123', '2025-01-01');`

### `rpc/book_training_slot`
**The Semantic Way to Book.** Performs Validation (Quota) + Execution (Insert) in one atomic transaction.
-   **Params:** `p_timeslot_id`, `p_user_email`
-   **Returns:** JSON `{ success: boolean, bookingId: string, error: string }`
-   **Usage:**
    ```typescript
    const { data, error } = await supabase.rpc('book_training_slot', {
      p_timeslot_id: 'slot_xyz',
      p_user_email: 'employee@company.com'
    })
    ```

## 3. Data Available via Standard API (RLS Filtered)

Simply query these tables. RLS ensures strict tenant isolation.

-   **`GET /tenants`**
    -   *Admins*: See all.
    -   *Users*: See ONLY their own company.
-   **`GET /bookings`**
    -   *Admins*: See all.
    -   *Company Admin*: See all bookings for their company.
    -   *Employee*: See ONLY their own bookings.
-   **`GET /timeslots`** (Public/Shared)
    -   Visible to all authenticated users.
    -   Contains `globalCapacity` and `bookedCount`.

## 4. Quota Algorithm Details
The quota is calculated dynamically:
`Remaining = Tenant.dailyKontingent - COUNT(Bookings for Tenant on Date)`

> **Constraint:** A user cannot book if `Remaining <= 0`.
> This is enforced inside `book_training_slot`.
