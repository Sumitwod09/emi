-- ─────────────────────────────────────────────────────────────
-- Super Admin Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Create super_admins table
CREATE TABLE IF NOT EXISTS super_admins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. Lock it down — only the service role (server) can read/write
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_public_access" ON super_admins USING (false);

-- 3. Insert your super admin record
--    (Create the Supabase Auth user first via Dashboard → Authentication → Users → Add user)
INSERT INTO super_admins (email, name)
VALUES ('wodsumit@gmail.com', 'Sumit')
ON CONFLICT (email) DO NOTHING;

-- 4. Add 'manager' role option to store_users if not already present
--    (Postgres check constraint — adjust if you used an enum instead)
ALTER TABLE store_users DROP CONSTRAINT IF EXISTS store_users_role_check;
ALTER TABLE store_users ADD CONSTRAINT store_users_role_check
  CHECK (role IN ('owner', 'manager', 'employee'));
