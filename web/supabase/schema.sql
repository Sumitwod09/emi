-- EMI Lock Database Schema v2.0
-- No Firebase. Lock delivery via Supabase Realtime.
-- Run this against your Supabase project.

CREATE TABLE stores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT,
  phone         TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE store_users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID REFERENCES stores(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  email             TEXT UNIQUE NOT NULL,
  role              TEXT CHECK (role IN ('owner', 'employee')) DEFAULT 'employee',
  expo_push_token   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID REFERENCES stores(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  aadhaar_last4 TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE devices (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_id             UUID REFERENCES customers(id),
  imei_hash               TEXT NOT NULL UNIQUE,
  model                   TEXT NOT NULL,
  supabase_device_key     TEXT,
  hmac_secret             TEXT NOT NULL,
  status                  TEXT CHECK (status IN ('active','locked','deregistered')) DEFAULT 'active',
  lock_payload            JSONB,
  device_owner_confirmed  BOOLEAN DEFAULT FALSE,
  registered_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emi_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id         UUID REFERENCES devices(id) ON DELETE CASCADE,
  total_amount      NUMERIC(10,2) NOT NULL,
  down_payment      NUMERIC(10,2) DEFAULT 0,
  emi_amount        NUMERIC(10,2) NOT NULL,
  tenure_months     INTEGER NOT NULL,
  start_date        DATE NOT NULL,
  grace_period_days INTEGER DEFAULT 3,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emi_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emi_plan_id     UUID REFERENCES emi_plans(id) ON DELETE CASCADE,
  due_date        DATE NOT NULL,
  paid_date       TIMESTAMPTZ,
  amount_due      NUMERIC(10,2) NOT NULL,
  amount_paid     NUMERIC(10,2),
  status          TEXT CHECK (status IN ('pending','paid','missed')) DEFAULT 'pending',
  payment_method  TEXT,
  recorded_by     UUID REFERENCES store_users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lock_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID REFERENCES devices(id),
  locked_at       TIMESTAMPTZ DEFAULT NOW(),
  lock_reason     TEXT,
  emi_payment_id  UUID REFERENCES emi_payments(id),
  unlocked_at     TIMESTAMPTZ,
  unlocked_by     UUID REFERENCES store_users(id)
);

-- Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lock_events ENABLE ROW LEVEL SECURITY;

-- Store users see only their own store's data
-- Service role key (used in API routes) bypasses RLS entirely
-- These policies apply to anon/authenticated roles

CREATE POLICY "store_users_own_store" ON store_users
  FOR ALL USING (store_id = (
    SELECT store_id FROM store_users WHERE email = auth.email()
  ));

CREATE POLICY "customers_own_store" ON customers
  FOR ALL USING (store_id = (
    SELECT store_id FROM store_users WHERE email = auth.email()
  ));

CREATE POLICY "devices_own_store" ON devices
  FOR ALL USING (store_id = (
    SELECT store_id FROM store_users WHERE email = auth.email()
  ));

-- Android device can read its own row (for Realtime + WorkManager polling)
-- The device authenticates using Supabase anon key; device_id stored in JWT metadata
CREATE POLICY "device_reads_own_row" ON devices
  FOR SELECT USING (id = (auth.jwt() ->> 'device_id')::uuid);

-- Enable Realtime on devices table (required for Supabase Realtime subscriptions)
-- Run in Supabase Dashboard → Database → Replication → Tables → enable devices
