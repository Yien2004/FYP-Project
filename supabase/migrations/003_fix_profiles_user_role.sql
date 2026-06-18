-- ============================================================
-- FIX: "cannot change name of view column" error
--
-- The previous view was created WITHOUT user_role, so Postgres
-- locked the column order. CREATE OR REPLACE cannot reorder or
-- rename view columns — we must DROP and recreate it instead.
--
-- Run this entire script in:
--   Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- STEP 1: Add user_role column to the real table (safe if already exists)
alter table public.patient_profiles
  add column if not exists user_role text default 'Patient';

-- STEP 2: Drop the old view entirely (column layout was locked from migration 002)
drop view if exists public.profiles;

-- STEP 3: Recreate the view fresh — now includes user_role
create view public.profiles as
  select
    id,
    user_id,
    email,
    full_name,
    avatar_url,
    user_role,
    created_at,
    updated_at
  from public.patient_profiles;

-- STEP 4: Re-grant permissions
grant select on public.profiles         to anon, authenticated;
grant all    on public.patient_profiles  to anon, authenticated;

-- ============================================================
-- VERIFY (run separately after the above succeeds):
-- ============================================================
-- select column_name, ordinal_position
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles'
--   order by ordinal_position;
--
-- Expected columns (in order):
--   id, user_id, email, full_name, avatar_url,
--   user_role, created_at, updated_at
