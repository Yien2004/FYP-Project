-- ============================================================
-- Migration 004: Strict Single-Hospital Ecosystem (Penang Only)
-- Aligns with Academic Scope Directive & Figures 3.9 / 3.10
-- ============================================================

-- Ensure clinics table exists
CREATE TABLE IF NOT EXISTS clinics (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  address           TEXT,
  city              TEXT,
  state             TEXT,
  latitude          NUMERIC(9,6),
  longitude         NUMERIC(9,6),
  operational_hours TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Clean up old external hospital records
DELETE FROM clinics WHERE city NOT IN ('Penang', 'Bayan Lepas', 'Georgetown', 'Bayan Baru', 'Ayer Itam') 
  OR (state NOT IN ('Pulau Pinang', 'Penang') AND state IS NOT NULL);

-- 2. Upsert the 4 authorized Penang facilities with precise GPS coordinates
INSERT INTO clinics (id, name, address, city, state, latitude, longitude, operational_hours)
VALUES
(
  1,
  'Pantai Hospital Penang (Main Hospital)',
  '82, Jalan Tengah, Bandar Bayan Baru, 11950 Bayan Lepas, Pulau Pinang',
  'Bayan Lepas',
  'Pulau Pinang',
  5.321389,
  100.284722,
  'Open 24 hours, 7 days a week (Tertiary Inpatient & 24/7 A&E)'
),
(
  2,
  'Pantai Heart & Wellness Pavilion',
  '128, Jalan Burma, 10050 Georgetown, Pulau Pinang',
  'Georgetown',
  'Pulau Pinang',
  5.420800,
  100.320100,
  'Mon–Fri: 8:30 AM – 5:30 PM | Sat: 8:30 AM – 1:00 PM'
),
(
  3,
  'Pantai Premier Clinic & Day Surgery',
  '1-1-15, Tingkat Mahsuri, 11950 Bayan Baru, Pulau Pinang',
  'Bayan Baru',
  'Pulau Pinang',
  5.326200,
  100.290500,
  'Mon–Sat: 8:00 AM – 9:00 PM | Sun: 9:00 AM – 1:00 PM'
),
(
  4,
  'Pantai Specialist Centre',
  '588, Jalan Air Itam, 11500 Ayer Itam, Pulau Pinang',
  'Ayer Itam',
  'Pulau Pinang',
  5.405100,
  100.282900,
  'Mon–Sat: 8:00 AM – 8:00 PM | Sun: Closed'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  operational_hours = EXCLUDED.operational_hours;

-- Ensure doctors table exists if referenced
CREATE TABLE IF NOT EXISTS doctors (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  specialty       TEXT,
  department      TEXT,
  clinic_id       INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
  hospital        TEXT,
  availability    TEXT,
  rating          NUMERIC(2,1) DEFAULT 4.9,
  reviews_count   INTEGER DEFAULT 120,
  image           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure all doctors belong strictly to clinic_id IN (1, 2, 3, 4)
UPDATE doctors
SET clinic_id = 1
WHERE clinic_id NOT IN (1, 2, 3, 4) OR clinic_id IS NULL;

-- 4. Clean up and synchronize facilities table for compatibility with existing schema
DELETE FROM facilities WHERE id NOT IN ('ph-penang', 'pantai-pavilion', 'pantai-premier', 'pantai-specialist');

INSERT INTO facilities (id, name, address, phone, hours, distance, lat, lng, featured, zip_code)
VALUES
(
  'ph-penang',
  'Pantai Hospital Penang (Main Hospital)',
  '82, Jalan Tengah, Bandar Bayan Baru, 11950 Bayan Lepas, Pulau Pinang',
  '04-643 3888',
  'Open 24 hours, 7 days a week (Tertiary Inpatient & 24/7 A&E)',
  '1.2 km away',
  5.321389,
  100.284722,
  true,
  '11950'
),
(
  'pantai-pavilion',
  'Pantai Heart & Wellness Pavilion',
  '128, Jalan Burma, 10050 Georgetown, Pulau Pinang',
  '04-226 7888',
  'Mon–Fri: 8:30 AM – 5:30 PM | Sat: 8:30 AM – 1:00 PM',
  '9.5 km away',
  5.420800,
  100.320100,
  true,
  '10050'
),
(
  'pantai-premier',
  'Pantai Premier Clinic & Day Surgery',
  '1-1-15, Tingkat Mahsuri, 11950 Bayan Baru, Pulau Pinang',
  '04-641 2288',
  'Mon–Sat: 8:00 AM – 9:00 PM | Sun: 9:00 AM – 1:00 PM',
  '1.6 km away',
  5.326200,
  100.290500,
  true,
  '11950'
),
(
  'pantai-specialist',
  'Pantai Specialist Centre',
  '588, Jalan Air Itam, 11500 Ayer Itam, Pulau Pinang',
  '04-828 5588',
  'Mon–Sat: 8:00 AM – 8:00 PM | Sun: Closed',
  '8.2 km away',
  5.405100,
  100.282900,
  true,
  '11500'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  hours = EXCLUDED.hours,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;
