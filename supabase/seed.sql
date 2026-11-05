-- ============================================================
-- CarePoint Patient Portal — Demo Seed Data
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- CLINICIANS (Doctors)
-- ============================================================
insert into clinicians (id, name, specialty, rating, reviews_count, image, availability, hospital) values
  ('doc-1', 'Dr. Ainol Shareha Binti Sahar', 'Cardiology & Internal Medicine', 4.9, 203,
   'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
   'Mon–Fri: 9:00 AM – 5:00 PM', 'Pantai Hospital Penang (Main Hospital)'),
  ('doc-2', 'Dr. Simon Lo', 'Cardiology & Interventional Catheterization', 4.9, 289,
   'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
   'Mon–Fri: 8:30 AM – 5:30 PM', 'Pantai Heart & Wellness Pavilion'),
  ('doc-3', 'Dr. Sarah Lim', 'Dermatology & Day Surgery', 4.8, 217,
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
   'Mon–Sat: 8:00 AM – 9:00 PM', 'Pantai Premier Clinic & Day Surgery'),
  ('doc-4', 'Dr. Siti Aminah', 'Orthopedic Surgery & Sports Medicine', 4.9, 284,
   'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300',
   'Mon–Sat: 8:00 AM – 8:00 PM', 'Pantai Specialist Centre')
on conflict (id) do update set
  name = excluded.name,
  specialty = excluded.specialty,
  hospital = excluded.hospital;

-- ============================================================
-- FACILITIES (Clinics — Penang Single-Hospital Directive)
-- ============================================================
insert into facilities (id, name, address, phone, hours, distance, lat, lng, featured, zip_code) values
  ('ph-penang', 'Pantai Hospital Penang (Main Hospital)',
   '82, Jalan Tengah, Bandar Bayan Baru, 11950 Bayan Lepas, Pulau Pinang',
   '04-643 3888', 'Open 24 hours, 7 days a week (Tertiary Inpatient & 24/7 A&E)', '1.2 km away',
   5.321389, 100.284722, true, '11950'),
  ('pantai-pavilion', 'Pantai Heart & Wellness Pavilion',
   '128, Jalan Burma, 10050 Georgetown, Pulau Pinang',
   '04-226 7888', 'Mon–Fri: 8:30 AM – 5:30 PM | Sat: 8:30 AM – 1:00 PM', '9.5 km away',
   5.420800, 100.320100, true, '10050'),
  ('pantai-premier', 'Pantai Premier Clinic & Day Surgery',
   '1-1-15, Tingkat Mahsuri, 11950 Bayan Baru, Pulau Pinang',
   '04-641 2288', 'Mon–Sat: 8:00 AM – 9:00 PM | Sun: 9:00 AM – 1:00 PM', '1.6 km away',
   5.326200, 100.290500, true, '11950'),
  ('pantai-specialist', 'Pantai Specialist Centre',
   '588, Jalan Air Itam, 11500 Ayer Itam, Pulau Pinang',
   '04-828 5588', 'Mon–Sat: 8:00 AM – 8:00 PM | Sun: Closed', '8.2 km away',
   5.405100, 100.282900, true, '11500')
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  hours = excluded.hours,
  lat = excluded.lat,
  lng = excluded.lng;

-- ============================================================
-- REVIEWS
-- ============================================================
insert into reviews (doctor_id, doctor_name, author, rating, text) values
  ('doc-1', 'Dr. Sarah Mitchell', 'Hafiz Othman',      5.0, 'Dr. Mitchell is extremely thorough and professional. She explained everything clearly and made me feel at ease.'),
  ('doc-1', 'Dr. Sarah Mitchell', 'Priya Nair',        4.8, 'Very experienced physician. Annual checkup was smooth and comprehensive. Highly recommend for family health.'),
  ('doc-2', 'Dr. Adrian Rahman',  'Lim Wei Jian',      5.0, 'Excellent cardiologist. My ECG results were explained in full detail. Very reassuring and knowledgeable.'),
  ('doc-2', 'Dr. Adrian Rahman',  'Nora binti Hassan', 4.7, 'Kind and professional. Waited a bit long but consultation was worth it.'),
  ('doc-3', 'Dr. Ling Wey Shuan', 'Tan Mei Ling',      5.0, 'Amazing pediatrician! She is so gentle and good with children. My daughter loves her.'),
  ('doc-3', 'Dr. Ling Wey Shuan', 'Azlan Razali',      4.8, 'Highly recommended for kids checkups. Very detailed and caring.'),
  ('doc-4', 'Dr. Amira Yusuf',    'Kavitha Pillai',    4.7, 'Great dermatologist. Addressed my eczema concerns and gave practical skincare advice.'),
  ('doc-4', 'Dr. Amira Yusuf',    'Farid Ibrahim',     4.6, 'Professional and knowledgeable. The clinic is clean and well-organized.');

-- ============================================================
-- DEMO PATIENT PROFILE
-- NOTE: After a user signs up via the app with email
-- ahmad.danish@carepoint.my, the profile below will be
-- automatically upserted/linked. You can also manually
-- insert it here for testing with a placeholder user_id.
-- ============================================================

-- Insert demo patient profile (user_id will be linked on first login)
insert into patient_profiles (
  email, full_name, my_kad_or_passport, date_of_birth, gender,
  phone, nationality, blood_type, allergies, chronic_conditions,
  insurance_provider, insurance_policy_number, primary_physician, avatar_url
) values (
  'ahmad.danish@carepoint.my',
  'Ahmad Danish Bin Razali',
  '940822-14-5543',
  '1994-08-22',
  'Male',
  '+60 12-345 6789',
  'Malaysian',
  'O+',
  ARRAY['Penicillin', 'Peanuts'],
  ARRAY['Asthma (Mild)', 'Seasonal Rhinitis'],
  'Allianz Health Malaysia',
  'ALZ-88942-004',
  'Dr. Sarah Mitchell',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
) on conflict (email) do nothing;

-- ============================================================
-- DEMO APPOINTMENTS (linked to the demo patient)
-- ============================================================
do $$
declare
  p_id uuid;
begin
  select id into p_id from patient_profiles where email = 'ahmad.danish@carepoint.my';
  if p_id is not null then
    -- Upcoming appointment
    insert into appointments (patient_id, patient_name, doctor_id, doctor_name, specialty, doctor_image, date, time_slot, status, type, symptoms)
    values (
      p_id, 'Ahmad Danish Bin Razali',
      'doc-1', 'Dr. Sarah Mitchell', 'Family Medicine & Chief Medical Officer',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      '2026-10-12', '10:30 AM', 'Upcoming', 'In-Clinic',
      'Mild asthma flare-ups during early morning runs and dry coughing fits over the past 3 days.'
    ) on conflict do nothing;

    -- Completed appointment 1
    insert into appointments (patient_id, patient_name, doctor_id, doctor_name, specialty, doctor_image, date, time_slot, status, type, symptoms, clinical_notes, prescription)
    values (
      p_id, 'Ahmad Danish Bin Razali',
      'doc-3', 'Dr. Ling Wey Shuan', 'Pediatrician',
      'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300',
      '2026-05-14', '11:00 AM', 'Completed', 'Video Consultation',
      'Annual health physical consultation & wellness advice regarding vitamins dosage.',
      'Patient displays optimal health parameters. Advised maintaining physical exercise regime and recommended standard Vitamin D3 supplementation (1000 IU daily).',
      'Ventolin Inhaler (Albuterol) - 100mcg - 1 unit (PRN, as required for asthma bronchospasms)'
    ) on conflict do nothing;

    -- Completed appointment 2
    insert into appointments (patient_id, patient_name, doctor_id, doctor_name, specialty, doctor_image, date, time_slot, status, type, symptoms, clinical_notes, prescription)
    values (
      p_id, 'Ahmad Danish Bin Razali',
      'doc-2', 'Dr. Adrian Rahman', 'Cardiologist',
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      '2025-11-20', '03:15 PM', 'Completed', 'In-Clinic',
      'Chest tightness evaluation post high-intensity cardio exercises.',
      'ECG results show normal sinus rhythm. Structural safety validated. Encouraged active cool-down cycles post rigorous workouts.',
      'Coenzyme Q10 - 150mg - 30 capsules - 1 daily'
    ) on conflict do nothing;

    -- Demo vital signs
    insert into vital_signs (patient_id, timestamp, heart_rate, blood_pressure_sys, blood_pressure_dia, temperature, weight, oxygen_saturation)
    values
      (p_id, 'June 04, 2026',  72, 118, 79, 36.6, 74.5, 99),
      (p_id, 'May 14, 2026',   69, 115, 75, 36.5, 74.2, 98),
      (p_id, 'Nov 20, 2025',   78, 122, 81, 36.8, 75.0, 99);

    -- Demo welcome message thread
    insert into chat_threads (id, patient_id, last_message, time, unread)
    values ('chat-' || p_id::text, p_id, 'Hello Ahmad, your diagnostic ledger looks great!', 'Today, 09:30 AM', false)
    on conflict (id) do nothing;

    insert into messages (thread_id, sender, sender_name, content, timestamp)
    values (
      'chat-' || p_id::text,
      'doctor', 'Dr. Sarah Jenkins',
      'Hello Ahmad. I have compiled your digital diagnostic ledger from your annual health physical screening checkup last month. Both blood pressure (BP) and pulse parameters look great. Keep up the high physical regimental checks!',
      'Today, 09:30 AM'
    );
  end if;
end $$;
