-- ============================================================
-- FIX: "Could not find the table 'public.profiles' in the schema cache"
--
-- This error is caused by Supabase's default `handle_new_user` trigger
-- which tries to INSERT into `public.profiles` on every new sign-up.
-- Our project uses `public.patient_profiles` instead.
--
-- Run this entire script in:
--   Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- STEP 1: Drop the default Supabase trigger that causes the error
-- (It fires on INSERT into auth.users and tries to write to public.profiles)
drop trigger if exists on_auth_user_created on auth.users;

-- STEP 2: Drop the function it called
drop function if exists public.handle_new_user();

-- STEP 3: Create a compatibility VIEW so any leftover code that
-- queries `public.profiles` still works gracefully
create or replace view public.profiles as
  select
    id,
    user_id,
    email,
    full_name,
    avatar_url,
    created_at,
    updated_at
  from public.patient_profiles;

-- STEP 4: Grant access to the view
grant select on public.profiles to anon, authenticated;

-- ============================================================
-- OPTIONAL: If you want a trigger that writes to patient_profiles
-- instead of profiles, add this AFTER running the above:
-- ============================================================

create or replace function public.handle_new_user_patient_profile()
returns trigger as $$
begin
  -- Only insert a patient_profiles row if one doesn't already exist
  insert into public.patient_profiles (user_id, email, full_name, avatar_url, nationality, allergies, chronic_conditions)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      'https://ui-avatars.com/api/?name=' || urlencode(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))) || '&background=0d9488&color=fff'
    ),
    'Malaysian',
    '{}',
    '{}'
  )
  on conflict (email) do nothing;
  return new;
exception
  when others then
    -- Never block auth even if profile insert fails
    return new;
end;
$$ language plpgsql security definer;

-- Only create this trigger if the role is 'Patient' (or no role set)
-- For simplicity we create the profile row for all new users;
-- non-patient roles just won't use this profile.
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_patient_profile();

-- Utility function used in the trigger above
create or replace function urlencode(str text)
returns text as $$
  select replace(replace(replace(str, ' ', '%20'), '@', '%40'), '+', '%2B');
$$ language sql immutable;
