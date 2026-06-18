-- ============================================================
-- CarePoint Patient Portal — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: patient_profiles
-- ============================================================
create table if not exists patient_profiles (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  email           text unique not null,
  full_name       text,
  my_kad_or_passport text,
  date_of_birth   text,
  gender          text,
  phone           text,
  nationality     text,
  blood_type      text,
  allergies       text[] default '{}',
  chronic_conditions text[] default '{}',
  insurance_provider text,
  insurance_policy_number text,
  primary_physician text,
  avatar_url      text,
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

-- ============================================================
-- TABLE: appointments
-- ============================================================
create table if not exists appointments (
  id              uuid default uuid_generate_v4() primary key,
  patient_id      uuid references patient_profiles(id) on delete cascade,
  patient_name    text,
  doctor_id       text,
  doctor_name     text,
  specialty       text,
  doctor_image    text,
  date            text,
  time_slot       text,
  status          text default 'Upcoming',
  type            text,
  symptoms        text,
  clinical_notes  text,
  prescription    text,
  created_at      timestamp with time zone default now()
);

-- ============================================================
-- TABLE: vital_signs
-- ============================================================
create table if not exists vital_signs (
  id                  uuid default uuid_generate_v4() primary key,
  patient_id          uuid references patient_profiles(id) on delete cascade,
  timestamp           text,
  heart_rate          integer,
  blood_pressure_sys  integer,
  blood_pressure_dia  integer,
  temperature         numeric(4,1),
  weight              numeric(5,1),
  oxygen_saturation   integer,
  created_at          timestamp with time zone default now()
);

-- ============================================================
-- TABLE: messages
-- ============================================================
create table if not exists messages (
  id          uuid default uuid_generate_v4() primary key,
  thread_id   text not null,
  sender      text not null,
  sender_name text,
  content     text,
  timestamp   text,
  created_at  timestamp with time zone default now()
);
create index if not exists idx_messages_thread_id on messages(thread_id);

-- ============================================================
-- TABLE: chat_threads
-- ============================================================
create table if not exists chat_threads (
  id          text primary key,
  patient_id  uuid references patient_profiles(id) on delete cascade,
  last_message text,
  time        text,
  unread      boolean default false,
  created_at  timestamp with time zone default now()
);

-- ============================================================
-- TABLE: reviews
-- ============================================================
create table if not exists reviews (
  id          uuid default uuid_generate_v4() primary key,
  doctor_id   text,
  doctor_name text,
  author      text,
  rating      numeric(2,1),
  text        text,
  created_at  timestamp with time zone default now()
);

-- ============================================================
-- TABLE: clinicians (doctors directory)
-- ============================================================
create table if not exists clinicians (
  id            text primary key,
  name          text,
  specialty     text,
  rating        numeric(2,1),
  reviews_count integer,
  image         text,
  availability  text,
  hospital      text
);

-- ============================================================
-- TABLE: facilities (clinics)
-- ============================================================
create table if not exists facilities (
  id       text primary key,
  name     text,
  address  text,
  phone    text,
  hours    text,
  distance text,
  lat      numeric(9,6),
  lng      numeric(9,6),
  featured boolean default false,
  zip_code text
);

-- ============================================================
-- TABLE: system_logs
-- ============================================================
create table if not exists system_logs (
  id        uuid default uuid_generate_v4() primary key,
  message   text,
  level     text default 'info',
  timestamp timestamp with time zone default now()
);

-- ============================================================
-- DISABLE ROW LEVEL SECURITY (Development Mode)
-- The Express backend acts as a trusted intermediary.
-- Re-enable and add policies before production deployment.
-- ============================================================
alter table patient_profiles    disable row level security;
alter table appointments        disable row level security;
alter table vital_signs         disable row level security;
alter table messages            disable row level security;
alter table chat_threads        disable row level security;
alter table reviews             disable row level security;
alter table clinicians          disable row level security;
alter table facilities          disable row level security;
alter table system_logs         disable row level security;

-- Grant full access to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to anon, authenticated;
grant all privileges on all functions in schema public to anon, authenticated;

-- ============================================================
-- UPDATED_AT trigger for patient_profiles
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_patient_profiles_updated_at on patient_profiles;
create trigger set_patient_profiles_updated_at
  before update on patient_profiles
  for each row execute function update_updated_at_column();
