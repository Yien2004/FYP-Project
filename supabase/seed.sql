-- ============================================================
-- CarePoint Patient Portal — Demo Seed Data
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- CLINICIANS (Doctors)
-- ============================================================
insert into clinicians (id, name, specialty, rating, reviews_count, image, availability, hospital) values
  ('doc-1', 'Dr. Sarah Mitchell',  'Family Medicine & Chief Medical Officer', 4.9, 312,
   'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
   'Mon - Fri, 9:00 AM - 4:00 PM', 'CarePoint Specialist KL'),
  ('doc-2', 'Dr. Adrian Rahman',   'Cardiologist',   4.8, 184,
   'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
   'Tue, Thu, 10:00 AM - 3:00 PM', 'CarePoint Medical City Ampang'),
  ('doc-3', 'Dr. Ling Wey Shuan',  'Pediatrician',   4.9, 228,
   'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300',
   'Mon, Wed, Fri, 8:30 AM - 1:00 PM', 'CarePoint Clinic Damansara'),
  ('doc-4', 'Dr. Amira Yusuf',     'Dermatologist',  4.7, 142,
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
   'Wed, Sat, 2:00 PM - 6:00 PM', 'CarePoint Clinic Subang Jaya')
on conflict (id) do nothing;

-- ============================================================
-- FACILITIES (Clinics)
-- ============================================================
insert into facilities (id, name, address, phone, hours, distance, lat, lng, featured, zip_code) values
  ('clinic-1', 'CarePoint Clinic Damansara',
   'Level 1, Block C, Damansara Heights, 50490 Kuala Lumpur, Malaysia',
   '+60 3-2094 8800', '8:00 AM - 10:00 PM Daily', '1.2 km away',
   3.149200, 101.654100, true, '50490'),
  ('clinic-2', 'CarePoint Clinic Subang Jaya',
   'A-03-G, Sunway Geo Avenue, Jalan Lagoon Selatan, 47500 Subang Jaya, Selangor, Malaysia',
   '+60 3-5612 1122', '24 Hours Express Emergency Care', '12.4 km away',
   3.064500, 101.609400, true, '47500'),
  ('clinic-3', 'CarePoint Specialist Centre Ampang',
   '24 Jalan Ampang Utama, Centrio Ampang, 68000 Ampang, Selangor, Malaysia',
   '+60 3-4251 9000', '8:30 AM - 8:00 PM (Closed Sundays)', '6.8 km away',
   3.159800, 101.751100, false, '68000'),
  ('clinic-4', 'CarePoint Clinic KL Sentral',
   'Lot 5, Departure Hall Level, Stesen Sentral KL, 50470 Kuala Lumpur, Malaysia',
   '+60 3-2274 3344', '7:00 AM - 11:00 PM Daily', '4.1 km away',
   3.134200, 101.686500, false, '50470'),
  ('clinic-5', 'CarePoint Clinic Cheras',
   'No. 88, Jalan Cheras Mewah, Taman Cheras, 56100 Kuala Lumpur, Malaysia',
   '+60 3-9133 4455', '8:00 AM - 10:00 PM Daily', '9.3 km away',
   3.098800, 101.740200, false, '56100')
on conflict (id) do nothing;

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
