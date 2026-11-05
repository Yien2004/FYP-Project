/**
 * db.ts — CarePoint Patient Portal
 * Database layer using Supabase (Auth + PostgreSQL)
 *
 * All DB columns follow snake_case (Postgres convention).
 * Mapping helpers convert rows to camelCase before returning
 * so the rest of the server code stays unchanged.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { allPantaiDoctors } from './src/data/pantaiHospitalsData';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const supabaseUrl  = process.env.SUPABASE_URL  || '';
const supabaseKey  = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  SUPABASE_URL or SUPABASE_ANON_KEY is not set in .env');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. Row-level security protected writes may fail.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,   // server-side: no browser storage
  }
});

export const supabaseAdmin: SupabaseClient = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      }
    })
  : supabase;

console.log('✅  Database: Supabase client initialised');

// ============================================================
// MAPPING HELPERS — DB row (snake_case) → JS object (camelCase)
// ============================================================

function mapProfile(row: any) {
  if (!row) return null;
  
  let language = "English";
  let defaultRegion = "";
  let emailAlerts = true;
  let smsAlerts = true;
  let inAppAlerts = true;
  let prescriptions: any[] = [];
  let attachments: any[] = [];
  let notifications: any[] = [];
  let consentedClinics: string[] = [];
  
  let nationality = row.nationality ?? '';
  let emergencyContactName = "";
  let emergencyContactPhone = "";
  let passwordHash = "";
  let resetToken = "";
  let resetExpiry = "";
  let previousTokens: string[] = [];
  
  if (nationality.startsWith("{") && nationality.endsWith("}")) {
    try {
      const parsed = JSON.parse(nationality);
      nationality = parsed.nationality ?? '';
      emergencyContactName = parsed.emergencyContactName ?? '';
      emergencyContactPhone = parsed.emergencyContactPhone ?? '';
      passwordHash = parsed.passwordHash ?? '';
      resetToken = parsed.resetToken ?? '';
      resetExpiry = parsed.resetExpiry ?? '';
      previousTokens = Array.isArray(parsed.previousTokens) ? parsed.previousTokens : (parsed.previousTokens ? [parsed.previousTokens] : []);
      prescriptions = parsed.prescriptions ?? [];
      attachments = parsed.attachments ?? [];
      language = parsed.language ?? 'English';
      defaultRegion = parsed.defaultRegion ?? '';
      emailAlerts = parsed.emailAlerts !== false;
      smsAlerts = parsed.smsAlerts !== false;
      inAppAlerts = parsed.inAppAlerts !== false;
      notifications = parsed.notifications ?? [];
      consentedClinics = parsed.consentedClinics ?? [];
    } catch (e) {
      // ignore
    }
  }
  
  return {
    id:                    row.id,
    userId:                row.user_id,
    email:                 row.email,
    fullName:              row.full_name              ?? '',
    myKadOrPassport:       row.my_kad_or_passport     ?? '',
    dateOfBirth:           row.date_of_birth          ?? '',
    gender:                row.gender                 ?? '',
    phone:                 row.phone                  ?? '',
    nationality:           nationality,
    bloodType:             row.blood_type             ?? '',
    allergies:             row.allergies              ?? [],
    chronicConditions:     row.chronic_conditions     ?? [],
    insuranceProvider:     row.insurance_provider     ?? '',
    insurancePolicyNumber: row.insurance_policy_number ?? '',
    primaryPhysician:      row.primary_physician      ?? '',
    avatarUrl:             row.avatar_url             ?? '',
    emergencyContactName,
    emergencyContactPhone,
    passwordHash,
    resetToken,
    resetExpiry,
    previousTokens,
    prescriptions,
    attachments,
    language,
    defaultRegion,
    emailAlerts,
    smsAlerts,
    inAppAlerts,
    notifications,
    consentedClinics
  };
}

function mapAppointment(row: any) {
  if (!row) return null;
  let symptoms = row.symptoms ?? '';
  let clinic = '';
  let checkedIn = false;
  let checkInTime = '';
  let queueNumber = '';
  let shareHistory = true;
  let syncCrossFacilityRecords = false;
  let requestRide = false;
  let roomNumber = row.room_number ?? '';
  let doctorEmail = '';
  let facility_id = row.facility_id ?? null;
  let triage = null;
  let storedPatientId = '';
  let patientEmail = '';
  let patientPhone = '';

  if (symptoms.startsWith('{') && symptoms.endsWith('}')) {
    try {
      const parsed = JSON.parse(symptoms);
      symptoms = parsed.symptoms ?? '';
      clinic = parsed.clinic ?? '';
      checkedIn = !!parsed.checkedIn || row.status === 'Checked In' || row.status === 'CHECKED_IN';
      checkInTime = parsed.checkInTime ?? '';
      queueNumber = parsed.queueNumber ?? '';
      shareHistory = parsed.shareHistory !== undefined ? !!parsed.shareHistory : true;
      syncCrossFacilityRecords = !!parsed.syncCrossFacilityRecords;
      requestRide = !!parsed.requestRide;
      if (!roomNumber && parsed.roomNumber) roomNumber = parsed.roomNumber;
      if (parsed.doctorEmail) doctorEmail = parsed.doctorEmail;
      if (!facility_id && parsed.facility_id) facility_id = parsed.facility_id;
      if (parsed.triage) triage = parsed.triage;
      if (parsed.patientId) storedPatientId = parsed.patientId;
      if (parsed.patientEmail) patientEmail = parsed.patientEmail;
      if (parsed.patientPhone) patientPhone = parsed.patientPhone;
    } catch (e) {
      // ignore
    }
  }

  if (row.status === 'Checked In' || row.status === 'CHECKED_IN') {
    checkedIn = true;
  }

  // Fallback tidy queue number if missing
  if (!queueNumber && row.id) {
    const fallbackDept = getDepartmentQueueCode(row.specialty);
    queueNumber = formatQueueNumber(fallbackDept, 1);
  }

  if (!clinic) {
    const docLower = (row.doctor_name || '').toLowerCase();
    if (docLower.includes('adrian') || docLower.includes('simon') || docLower.includes('tan seng')) {
      clinic = 'Pantai Heart & Wellness Pavilion';
    } else if (docLower.includes('mitchell') || docLower.includes('sarah lim')) {
      clinic = 'Pantai Premier Clinic & Day Surgery';
    } else if (docLower.includes('aminah') || docLower.includes('oak')) {
      clinic = 'Pantai Specialist Centre';
    } else {
      clinic = 'Pantai Hospital Penang (Main Hospital)';
    }
  }

  return {
    id:            row.id,
    patientId:     row.patient_id || storedPatientId || '',
    patientName:   row.patient_name    ?? '',
    patientEmail:  patientEmail,
    patientPhone:  patientPhone,
    doctorId:      row.doctor_id       ?? '',
    doctorName:    row.doctor_name     ?? '',
    specialty:     row.specialty       ?? '',
    doctorImage:   row.doctor_image    ?? '',
    date:          row.date            ?? '',
    timeSlot:      row.time_slot       ?? '',
    status:        row.status          ?? 'Upcoming',
    type:          row.type            ?? '',
    symptoms:      symptoms,
    remarks:       symptoms, // Map to remarks for staff system compatibility
    clinic:        clinic,
    checkedIn:     checkedIn,
    checkInTime:   checkInTime,
    queueNumber:   queueNumber ? queueNumber.replace(/^#/, '') : 'Q-101',
    roomNumber:    roomNumber,
    doctorEmail:   doctorEmail,
    facility_id:   facility_id,
    triage:        triage,
    shareHistory:  shareHistory,
    syncCrossFacilityRecords: syncCrossFacilityRecords,
    requestRide:   requestRide,
    clinicalNotes: row.clinical_notes  ?? '',
    prescription:  row.prescription    ?? '',
  };
}

function mapVital(row: any) {
  if (!row) return null;
  return {
    id:                row.id,
    patientId:         row.patient_id,
    timestamp:         row.timestamp           ?? '',
    heartRate:         row.heart_rate          ?? 0,
    bloodPressureSys:  row.blood_pressure_sys  ?? 0,
    bloodPressureDia:  row.blood_pressure_dia  ?? 0,
    temperature:       row.temperature         ?? 0,
    weight:            row.weight              ?? 0,
    oxygenSaturation:  row.oxygen_saturation   ?? 0,
  };
}

function mapMessage(row: any) {
  if (!row) return null;
  return {
    id:         row.id,
    threadId:   row.thread_id,
    sender:     row.sender      ?? 'user',
    senderName: row.sender_name ?? '',
    content:    row.content     ?? '',
    timestamp:  row.timestamp   ?? '',
  };
}

function mapClinician(row: any) {
  if (!row) return null;
  return {
    id:           row.id,
    name:         row.name         ?? '',
    specialty:    row.specialty    ?? '',
    rating:       row.rating       ?? 0,
    reviewsCount: row.reviews_count ?? 0,
    image:        row.image        ?? '',
    availability: row.availability ?? '',
    hospital:     row.hospital     ?? '',
  };
}

function mapFacility(row: any) {
  if (!row) return null;
  let hours = row.hours ?? '';
  let emergencyBypass = false;
  let ambulanceDetour = false;
  let dischargeLock = false;
  if (hours.startsWith('{') && hours.endsWith('}')) {
    try {
      const parsed = JSON.parse(hours);
      hours = parsed.hours ?? '';
      emergencyBypass = !!parsed.emergencyBypass;
      ambulanceDetour = !!parsed.ambulanceDetour;
      dischargeLock = !!parsed.dischargeLock;
    } catch(e) {}
  }
  return {
    id:       row.id,
    name:     row.name     ?? '',
    address:  row.address  ?? '',
    phone:    row.phone    ?? '',
    hours:    hours,
    emergencyBypass,
    ambulanceDetour,
    dischargeLock,
    distance: row.distance ?? '',
    lat:      row.lat      ?? 0,
    lng:      row.lng      ?? 0,
    featured: row.featured ?? false,
    zipCode:  row.zip_code ?? '',
  };
}

function mapReview(row: any) {
  if (!row) return null;
  return {
    id:         row.id,
    doctorId:   row.doctor_id   ?? '',
    doctorName: row.doctor_name ?? '',
    author:     row.author      ?? '',
    rating:     row.rating      ?? 5,
    text:       row.text        ?? '',
  };
}

// ============================================================
// AUTHENTICATION — Supabase Auth
// ============================================================

/** Register a new user with Supabase Auth */
export async function registerUser(
  email: string,
  password: string,
  metadata?: {
    fullName?: string;
    role?: string;
    approved?: boolean;
    hospital?: string;
    facility_id?: number;
    department?: string;
    room_number?: string;
  }
) {
  const fullName = metadata?.fullName ?? email.split('@')[0];
  const role = metadata?.role ?? 'Patient';
  const approved = metadata?.approved ?? (role === 'Patient' || role === 'Admin');
  const hospital = metadata?.hospital ?? '';

  if (supabaseServiceRoleKey) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        approved,
        hospital,
        facility_id: metadata?.facility_id ?? null,
        department: metadata?.department ?? '',
        room_number: metadata?.room_number ?? '',
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Unable to create user.');

    // Sign in after creation — if a trigger error occurs but session was issued, proceed
    const loginResult = await supabase.auth.signInWithPassword({ email, password });
    if (loginResult.data?.session) {
      // Session exists → auth succeeded even if a DB trigger also fired an error
      return { user: data.user, session: loginResult.data.session };
    }
    if (loginResult.error) throw new Error(loginResult.error.message);

    return {
      user: data.user,
      session: loginResult.data.session ?? null,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        approved,
        hospital,
      },
    },
  });
  // If signUp returned a session (or user), succeed even if a trigger error also came back
  if (data?.user) return data;
  if (error) throw new Error(error.message);
  return data; // { user, session }
}

/** Extract role and display name from Supabase auth user metadata */
export function getAuthUserProfile(authUser: { email?: string; user_metadata?: Record<string, unknown> }) {
  const meta = authUser.user_metadata ?? {};
  const email = authUser.email ?? '';
  const role = (meta.role as string) || 'Patient';
  const name =
    (meta.full_name as string) ||
    (meta.fullName as string) ||
    email.split('@')[0];
  const approved = meta.approved === undefined ? (role === 'Patient' || role === 'Admin') : !!meta.approved;
  let hospital = (meta.hospital as string) || '';
  let facility_id = (meta.facility_id as number) ?? (meta.facilityId as number) ?? null;
  let department = (meta.department as string) || '';
  let room_number = (meta.room_number as string) || (meta.roomNumber as string) || '';

  // Fallback: Check nominatedDoctors in admin ops store if hospital or department is missing
  if (role.toLowerCase() === 'doctor') {
    try {
      const store = loadOpsStore();
      const nominated = store.nominatedDoctors?.find(
        (d) => (d.email || '').toLowerCase() === email.toLowerCase()
      );
      if (nominated) {
        if (!hospital && nominated.facility_id) {
          const FAC_MAP: Record<number, string> = {
            1: "Pantai Hospital Penang (Main Hospital)",
            2: "Pantai Heart & Wellness Pavilion",
            3: "Pantai Premier Clinic & Day Surgery",
            4: "Pantai Specialist Centre"
          };
          hospital = FAC_MAP[nominated.facility_id] || "Pantai Hospital Penang (Main Hospital)";
        }
        if (!facility_id && nominated.facility_id) facility_id = nominated.facility_id;
        if (!department && nominated.department) department = nominated.department;
        if (!room_number && nominated.roomNumber) room_number = nominated.roomNumber;
      }
    } catch (e) {
      // ignore
    }
  }

  return { role, name, approved, hospital, facility_id, department, room_number };
}

/**
 * Login with email & password via Supabase Auth.
 *
 * RESILIENT: Supabase triggers (e.g. on_auth_user_created writing to public.profiles)
 * can fire AFTER the JWT is issued and cause an "error" even though auth succeeded.
 * We check for a valid session first — if it exists the login is successful regardless
 * of any trigger-side errors.  Only throw if there is truly no session.
 */
export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Auth succeeded — session + user are present
  if (data?.session && data?.user) {
    return data; // { user, session }
  }

  // Auth genuinely failed (wrong password, email not found, etc.)
  if (error) throw new Error(error.message);

  // Fallback — no session, no error (shouldn't happen, but guard anyway)
  throw new Error('Authentication failed. Please check your credentials.');
}

/** Auto-confirm a user's email using the service-role admin API. Returns the updated user or null if not found. */
export async function confirmUserEmail(email: string) {
  if (!supabaseServiceRoleKey) throw new Error('Service role key not configured');

  // List users (page large enough to include project users)
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error(listError.message || 'Unable to list users');

  // `listData` may be shaped as { users: [...] } or directly an array depending on client
  const users = (listData && (listData as any).users) ? (listData as any).users : (listData as any);
  if (!Array.isArray(users)) throw new Error('Unexpected listUsers response');

  const user = users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!user) return null;

  const uid = user.id;
  if (!uid) return null;

  const { data: updated, error: updErr } = await supabaseAdmin.auth.admin.updateUserById(uid, { email_confirm: true });
  if (updErr) throw new Error(updErr.message || 'Failed to confirm user');
  return updated?.user ?? null;
}

/** Verify a JWT access token and return the Supabase user */
export async function verifyToken(accessToken: string) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) throw new Error(error.message);
  return data.user;
}

// ============================================================
// PATIENT PROFILES
// ============================================================

export async function getPatientProfileByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('patient_profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function getPatientProfileById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('patient_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}

/**
 * Upsert a patient profile by email.
 * Creates the row if it doesn't exist; updates if it does.
 * Accepts camelCase field names from the frontend.
 */
export async function updatePatientProfile(email: string, updates: any, userId?: string) {
  const dbRow: any = { email };

  if (userId)                              dbRow.user_id                 = userId;
  if (updates.fullName        !== undefined) dbRow.full_name              = updates.fullName;
  if (updates.myKadOrPassport !== undefined) dbRow.my_kad_or_passport     = updates.myKadOrPassport;
  if (updates.dateOfBirth     !== undefined) dbRow.date_of_birth          = updates.dateOfBirth;
  if (updates.gender          !== undefined) dbRow.gender                 = updates.gender;
  if (updates.phone           !== undefined) dbRow.phone                  = updates.phone;
  
  if (
    updates.nationality !== undefined ||
    updates.emergencyContactName !== undefined ||
    updates.emergencyContactPhone !== undefined ||
    updates.passwordHash !== undefined ||
    updates.resetToken !== undefined ||
    updates.resetExpiry !== undefined ||
    updates.previousTokens !== undefined ||
    updates.prescriptions !== undefined ||
    updates.attachments !== undefined ||
    updates.language !== undefined ||
    updates.defaultRegion !== undefined ||
    updates.emailAlerts !== undefined ||
    updates.smsAlerts !== undefined ||
    updates.inAppAlerts !== undefined ||
    updates.notifications !== undefined ||
    updates.consentedClinics !== undefined
  ) {
    let currentNationality = "";
    let currentContactName = "";
    let currentContactPhone = "";
    let currentPasswordHash = "";
    let currentResetToken = "";
    let currentResetExpiry = "";
    let currentPreviousTokens: string[] = [];
    let currentPrescriptions: any[] = [];
    let currentAttachments: any[] = [];
    let currentLanguage = "English";
    let currentDefaultRegion = "";
    let currentEmailAlerts = true;
    let currentSmsAlerts = true;
    let currentInAppAlerts = true;
    let currentNotifications: any[] = [];
    let currentConsentedClinics: string[] = [];

    try {
      const existing = await getPatientProfileByEmail(email);
      if (existing) {
        currentNationality = existing.nationality || "";
        currentContactName = existing.emergencyContactName || "";
        currentContactPhone = existing.emergencyContactPhone || "";
        currentPasswordHash = existing.passwordHash || "";
        currentResetToken = existing.resetToken || "";
        currentResetExpiry = existing.resetExpiry || "";
        currentPreviousTokens = Array.isArray(existing.previousTokens) ? existing.previousTokens : [];
        if (existing.resetToken && !currentPreviousTokens.includes(existing.resetToken)) {
          currentPreviousTokens.push(existing.resetToken);
        }
        currentPrescriptions = existing.prescriptions || [];
        currentAttachments = existing.attachments || [];
        currentLanguage = existing.language || "English";
        currentDefaultRegion = existing.defaultRegion || "";
        currentEmailAlerts = existing.emailAlerts !== false;
        currentSmsAlerts = existing.smsAlerts !== false;
        currentInAppAlerts = existing.inAppAlerts !== false;
        currentNotifications = existing.notifications || [];
        currentConsentedClinics = existing.consentedClinics || [];
      }
    } catch (e) {
      // ignore fetch errors
    }

    const nextNationality = updates.nationality !== undefined ? updates.nationality : currentNationality;
    const nextContactName = updates.emergencyContactName !== undefined ? updates.emergencyContactName : currentContactName;
    const nextContactPhone = updates.emergencyContactPhone !== undefined ? updates.emergencyContactPhone : currentContactPhone;
    const nextPasswordHash = updates.passwordHash !== undefined ? updates.passwordHash : currentPasswordHash;
    const nextResetToken = updates.resetToken !== undefined ? updates.resetToken : currentResetToken;
    const nextResetExpiry = updates.resetExpiry !== undefined ? updates.resetExpiry : currentResetExpiry;
    
    let nextPreviousTokens = currentPreviousTokens;
    if (updates.previousTokens !== undefined) {
      nextPreviousTokens = Array.isArray(updates.previousTokens) ? updates.previousTokens : [updates.previousTokens];
    } else if (updates.resetToken && currentResetToken && updates.resetToken !== currentResetToken) {
      if (!nextPreviousTokens.includes(currentResetToken)) {
        nextPreviousTokens.push(currentResetToken);
      }
    }

    const nextPrescriptions = updates.prescriptions !== undefined ? updates.prescriptions : currentPrescriptions;
    const nextAttachments = updates.attachments !== undefined ? updates.attachments : currentAttachments;
    const nextLanguage = updates.language !== undefined ? updates.language : currentLanguage;
    const nextDefaultRegion = updates.defaultRegion !== undefined ? updates.defaultRegion : currentDefaultRegion;
    const nextEmailAlerts = updates.emailAlerts !== undefined ? updates.emailAlerts : currentEmailAlerts;
    const nextSmsAlerts = updates.smsAlerts !== undefined ? updates.smsAlerts : currentSmsAlerts;
    const nextInAppAlerts = updates.inAppAlerts !== undefined ? updates.inAppAlerts : currentInAppAlerts;
    const nextNotifications = updates.notifications !== undefined ? updates.notifications : currentNotifications;
    const nextConsentedClinics = updates.consentedClinics !== undefined ? updates.consentedClinics : currentConsentedClinics;

    dbRow.nationality = JSON.stringify({
      nationality: nextNationality,
      emergencyContactName: nextContactName,
      emergencyContactPhone: nextContactPhone,
      passwordHash: nextPasswordHash,
      resetToken: nextResetToken,
      resetExpiry: nextResetExpiry,
      previousTokens: nextPreviousTokens,
      prescriptions: nextPrescriptions,
      attachments: nextAttachments,
      language: nextLanguage,
      defaultRegion: nextDefaultRegion,
      emailAlerts: nextEmailAlerts,
      smsAlerts: nextSmsAlerts,
      inAppAlerts: nextInAppAlerts,
      notifications: nextNotifications,
      consentedClinics: nextConsentedClinics
    });
  }

  if (updates.bloodType       !== undefined) dbRow.blood_type             = updates.bloodType;
  if (updates.allergies       !== undefined) dbRow.allergies              = updates.allergies;
  if (updates.chronicConditions !== undefined) dbRow.chronic_conditions   = updates.chronicConditions;
  if (updates.insuranceProvider !== undefined) dbRow.insurance_provider   = updates.insuranceProvider;
  if (updates.insurancePolicyNumber !== undefined) dbRow.insurance_policy_number = updates.insurancePolicyNumber;
  if (updates.primaryPhysician !== undefined) dbRow.primary_physician     = updates.primaryPhysician;
  if (updates.avatarUrl       !== undefined) dbRow.avatar_url             = updates.avatarUrl;

  const { data, error } = await supabaseAdmin
    .from('patient_profiles')
    .upsert(dbRow, { onConflict: 'email' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

// ============================================================
// APPOINTMENTS
// ============================================================

function parseAppointmentEndTime(dateStr: string, timeSlot: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (!timeSlot) {
    return new Date(year, month, day, 23, 59, 59);
  }

  // Handle "15:00 - 16:00"
  const range24 = timeSlot.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (range24) {
    const endHrs = parseInt(range24[3], 10);
    const endMins = parseInt(range24[4], 10);
    return new Date(year, month, day, endHrs, endMins, 0);
  }

  // Handle "15:00" single 24h
  const single24 = timeSlot.match(/^(\d{1,2}):(\d{2})$/);
  if (single24) {
    const endHrs = parseInt(single24[1], 10);
    const endMins = parseInt(single24[2], 10);
    return new Date(year, month, day, endHrs, endMins, 0);
  }

  // Handle "10:00 AM - 11:00 AM" or "10:00 - 11:00 AM"
  const range12 = timeSlot.match(/(\d{1,2}):(\d{2})\s*(?:AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (range12) {
    let endHrs = parseInt(range12[3], 10);
    const endMins = parseInt(range12[4], 10);
    const pm = range12[5].toUpperCase() === "PM";
    if (pm && endHrs < 12) endHrs += 12;
    if (!pm && endHrs === 12) endHrs = 0;
    return new Date(year, month, day, endHrs, endMins, 0);
  }

  // Handle "10:30 AM"
  const match12 = timeSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hrs = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const pm = match12[3].toUpperCase() === "PM";
    if (pm && hrs < 12) hrs += 12;
    if (!pm && hrs === 12) hrs = 0;
    return new Date(year, month, day, hrs, mins, 0);
  }

  return new Date(year, month, day, 23, 59, 59);
}

export function getDepartmentQueueCode(deptOrSpecialty?: string): number {
  if (!deptOrSpecialty) return 1;
  const s = deptOrSpecialty.toLowerCase().trim();

  // 1. Internal Medicine
  if (s.includes("internal") || s.includes("nephro") || s.includes("rheumat") || s.includes("endocrin") || s.includes("geriatric")) return 1;

  // 2. Cardiology & Cardiothoracic
  if (s.includes("cardio") || s.includes("heart") || s.includes("electrophysio") || s.includes("vascular")) return 2;

  // 3. General Surgery
  if (s.includes("general surgery") || s.includes("colorectal") || s.includes("git surgery") || s.includes("breast") || s.includes("plastic") || (s.includes("surgery") && !s.includes("ortho") && !s.includes("neuro") && !s.includes("dental") && !s.includes("uro") && !s.includes("cardio"))) return 3;

  // 4. Orthopaedic Surgery
  if (s.includes("orthop") || s.includes("bone") || s.includes("spine") || s.includes("joint") || s.includes("sports medicine") || s.includes("rehab")) return 4;

  // 5. Paediatrics
  if (s.includes("paediat") || s.includes("pediat") || s.includes("child")) return 5;

  // 6. Gastroenterology & Hepatology
  if (s.includes("gastro") || s.includes("hepat") || s.includes("digest") || s.includes("endoscop")) return 6;

  // 7. Dermatology
  if (s.includes("derma") || s.includes("skin")) return 7;

  // 8. Respiratory Medicine
  if (s.includes("respirat") || s.includes("lung") || s.includes("pulmon") || s.includes("chest")) return 8;

  // 9. ENT / Otorhinolaryngology
  if (s.includes("ent") || s.includes("ear") || s.includes("nose") || s.includes("throat") || s.includes("otorhinolaryngology")) return 9;

  // 10. Emergency Medicine / A&E
  if (s.includes("emergenc") || s.includes("a&e") || s.includes("trauma")) return 10;

  // 11. Obstetrics & Gynaecology
  if (s.includes("obstet") || s.includes("gynaec") || s.includes("o&g") || s.includes("women")) return 11;

  // 12. Neurology & Neurosurgery
  if (s.includes("neuro") || s.includes("brain") || s.includes("stroke")) return 12;

  // 13. Oncology
  if (s.includes("oncol") || s.includes("cancer") || s.includes("radiotherap")) return 13;

  // 14. Ophthalmology
  if (s.includes("ophthalm") || s.includes("eye")) return 14;

  // 15. Dentistry
  if (s.includes("dent") || s.includes("oral") || s.includes("orthodont")) return 15;

  // 16. Radiology
  if (s.includes("radiol") || s.includes("imaging") || s.includes("x-ray")) return 16;

  // 17. Anaesthesiology & Critical Care
  if (s.includes("anaesth") || s.includes("anest") || s.includes("critical care") || s.includes("icu")) return 17;

  // 18. Psychiatry
  if (s.includes("psychiat") || s.includes("mental") || s.includes("psychol")) return 18;

  // 19. Urology
  if (s.includes("uro")) return 19;

  // 20. Wellness / Health Screening / General Practice
  if (s.includes("wellness") || s.includes("screening") || s.includes("general") || s.includes("family")) return 20;

  return 1;
}

export function formatQueueNumber(deptCode: number, seq: number): string {
  const seqStr = String(seq).padStart(2, '0');
  return `Q-${deptCode}${seqStr}`;
}

export function parseSlotStartTime(slot?: string): number {
  if (!slot) return 9999;
  const match = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 9999;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;
  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export async function getAppointments(patientId?: string) {
  const query = supabaseAdmin
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const overdueIdsToComplete: string[] = [];
  const overdueIdsToMissing: string[] = [];

  const rawAppointments = (data ?? []).map((row: any) => {
    const apt = mapAppointment(row);
    if (!apt) return null;
    const s = (apt.status || '').toLowerCase().trim();
    
    // Ignore already cancelled or rejected appointments
    if (['cancelled', 'rejected'].includes(s)) {
      return { apt, rawSymptoms: row.symptoms, rowId: row.id };
    }

    // Check if slot has concluded in the past
    const endDateTime = parseAppointmentEndTime(apt.date, apt.timeSlot);
    const isPast = endDateTime ? endDateTime.getTime() < now.getTime() : (apt.date && apt.date < todayStr);

    if (isPast) {
      const isAttended = apt.checkedIn || ['checked in', 'checked_in', 'calling', 'in_consultation', 'in consultation', 'completed', 'done'].includes(s);
      if (isAttended) {
        if (apt.status !== 'Completed' && apt.status !== 'COMPLETED' && apt.status !== 'Done') {
          apt.status = 'Completed';
          if (apt.id) overdueIdsToComplete.push(String(apt.id));
        }
      } else {
        if (apt.status !== 'Missing' && apt.status !== 'MISSING') {
          apt.status = 'Missing';
          if (apt.id) overdueIdsToMissing.push(String(apt.id));
        }
      }
    }
    return { apt, rawSymptoms: row.symptoms, rowId: row.id };
  }).filter(Boolean) as { apt: any; rawSymptoms: any; rowId: any }[];

  // Group by date + deptCode to reconcile queue numbers sequentially
  const groups: Record<string, { date: string; deptCode: number; items: { apt: any; rawSymptoms: any; rowId: any }[] }> = {};
  for (const item of rawAppointments) {
    const apt = item.apt;
    const date = apt.date || todayStr;
    const deptCode = getDepartmentQueueCode(apt.specialty || apt.remarks || apt.symptoms || apt.doctorName);
    const key = `${date}__dept_${deptCode}`;
    if (!groups[key]) groups[key] = { date, deptCode, items: [] };
    groups[key].items.push(item);
  }

  const updatesToSync: { id: string; symptoms: string }[] = [];

  for (const key of Object.keys(groups)) {
    const grp = groups[key];
    grp.items.sort((a, b) => {
      const timeDiff = parseSlotStartTime(a.apt.timeSlot) - parseSlotStartTime(b.apt.timeSlot);
      if (timeDiff !== 0) return timeDiff;
      return String(a.apt.id).localeCompare(String(b.apt.id));
    });

    grp.items.forEach((item, idx) => {
      const correctQueue = formatQueueNumber(grp.deptCode, idx + 1);
      const currentQueue = (item.apt.queueNumber || '').replace(/^#/, '');
      if (currentQueue !== correctQueue) {
        item.apt.queueNumber = correctQueue;
        let sObj: any = {};
        if (typeof item.rawSymptoms === 'string' && item.rawSymptoms.startsWith('{')) {
          try { sObj = JSON.parse(item.rawSymptoms); } catch (_) {}
        } else {
          sObj = { symptoms: item.rawSymptoms || '' };
        }
        sObj.queueNumber = correctQueue;
        updatesToSync.push({ id: String(item.rowId), symptoms: JSON.stringify(sObj) });
      } else {
        item.apt.queueNumber = correctQueue;
      }
    });
  }

  // Asynchronously sync updated queue numbers to DB
  if (updatesToSync.length > 0) {
    (async () => {
      for (const u of updatesToSync) {
        try {
          await supabaseAdmin.from('appointments').update({ symptoms: u.symptoms }).eq('id', u.id);
        } catch (e: any) {
          console.warn('Could not sync queueNumber for apt', u.id, e.message);
        }
      }
      console.log(`✅ Reconciled & synced ${updatesToSync.length} appointment queue numbers in DB.`);
    })();
  }

  // Asynchronously sync overdue appointments in database
  if (overdueIdsToComplete.length > 0) {
    (async () => {
      try {
        await supabaseAdmin
          .from('appointments')
          .update({ status: 'Completed' })
          .in('id', overdueIdsToComplete);
        console.log(`✅ Auto-completed ${overdueIdsToComplete.length} attended past appointments in DB.`);
      } catch (e: any) {
        console.warn('Could not sync completed appointments in DB:', e.message);
      }
    })();
  }

  if (overdueIdsToMissing.length > 0) {
    (async () => {
      try {
        await supabaseAdmin
          .from('appointments')
          .update({ status: 'Missing' })
          .in('id', overdueIdsToMissing);
        console.log(`⚠️ Auto-flagged ${overdueIdsToMissing.length} unattended past appointments as Missing in DB.`);
      } catch (e: any) {
        console.warn('Could not sync missing appointments in DB:', e.message);
      }
    })();
  }

  let appointments = rawAppointments.map(x => x.apt);

  if (patientId) {
    appointments = appointments.filter((apt: any) => 
      apt.patientId === patientId || 
      (apt.patientEmail && apt.patientEmail.toLowerCase() === patientId.toLowerCase())
    );
  }

  return appointments.filter((apt: any) => {
    if (!apt) return false;
    const c = (apt.clinic || '').toLowerCase();
    if (
      c.includes('kuala lumpur') ||
      c.includes('cheras') ||
      c.includes('ampang') ||
      c.includes('klang') ||
      c.includes('ipoh') ||
      c.includes('melaka') ||
      c.includes('batu pahat') ||
      c.includes('manjung') ||
      c.includes('gleneagles') ||
      c.includes('mertajam')
    ) {
      return false;
    }
    return true;
  });
}

export async function getFacilityAppointmentStats(facilityId: number, targetDate?: string) {
  let query = supabaseAdmin.from('appointments').select('id, status, checked_in, facility_id, date, department');
  if (facilityId !== 0) query = query.eq('facility_id', facilityId);
  if (targetDate && targetDate !== 'ALL') query = query.eq('date', targetDate);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data || [];
  const total = rows.length;
  const checkedIn = rows.filter((r: any) => r.checked_in || ['CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED'].includes((r.status || '').toUpperCase())).length;
  const inConsult = rows.filter((r: any) => (r.status || '').toUpperCase() === 'IN_CONSULTATION').length;
  const completed = rows.filter((r: any) => (r.status || '').toUpperCase() === 'COMPLETED').length;

  return {
    totalBookings: total,
    checkedInCount: checkedIn,
    waitingCount: rows.filter((r: any) => r.checked_in && (r.status || '').toUpperCase() !== 'IN_CONSULTATION' && (r.status || '').toUpperCase() !== 'COMPLETED').length,
    inConsultation: inConsult,
    completed: completed,
    checkInRate: total > 0 ? `${((checkedIn / total) * 100).toFixed(1)}%` : '0.0%',
    absentRate: total > 0 ? `${(((total - checkedIn) / total) * 100).toFixed(1)}%` : '0.0%'
  };
}

export async function callNextQueue(appointmentId: string, roomNumber: string, status: string = 'CALLING') {
  const nowTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update({ status, checked_in: true, check_in_time: nowTime })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  await addSystemLog({
    message: `[Queue Engine] Appointment ${appointmentId} called to ${roomNumber}`,
    level: 'info'
  });
  return mapAppointment(data);
}

export async function addAppointment(apt: any) {
  let symptoms = apt.symptoms || apt.remarks || '';
  const clinic = apt.clinic || apt.hospital || '';
  const deptCode = getDepartmentQueueCode(apt.department || apt.doctorSpecialty || apt.specialty || apt.doctorName);
  
  // Generate tidy, sequential queue number if not provided (Q-101, Q-102...)
  let queueNumber = apt.queueNumber ? apt.queueNumber.replace(/^#/, '') : '';
  if (!queueNumber) {
    try {
      const targetDate = apt.date || new Date().toISOString().split('T')[0];
      const { data: dayRows } = await supabaseAdmin
        .from('appointments')
        .select('symptoms, doctor_name, specialty')
        .eq('date', targetDate);

      let maxSeq = 0;
      if (dayRows && dayRows.length > 0) {
        for (const r of dayRows) {
          let rowDeptCode = 1;
          let rowQueue = '';
          if (r.symptoms && r.symptoms.startsWith('{')) {
            try {
              const p = JSON.parse(r.symptoms);
              rowQueue = (p.queueNumber || '').replace(/^#/, '');
              if (p.department || p.doctorSpecialty) {
                rowDeptCode = getDepartmentQueueCode(p.department || p.doctorSpecialty);
              } else if (r.specialty) {
                rowDeptCode = getDepartmentQueueCode(r.specialty);
              }
            } catch (_) {}
          } else if (r.specialty) {
            rowDeptCode = getDepartmentQueueCode(r.specialty);
          }

          if (rowDeptCode === deptCode && rowQueue) {
            const m = rowQueue.match(/Q-(\d+)/i);
            if (m) {
              const numPart = m[1];
              const deptStr = String(deptCode);
              if (numPart.startsWith(deptStr) && numPart.length === deptStr.length + 2) {
                const seq = parseInt(numPart.slice(deptStr.length), 10);
                if (seq > maxSeq) maxSeq = seq;
              }
            }
          }
        }
      }
      queueNumber = formatQueueNumber(deptCode, maxSeq + 1);
    } catch {
      queueNumber = formatQueueNumber(deptCode, 1);
    }
  } else {
    queueNumber = queueNumber.replace(/^#/, '');
  }

  // Validate if patientId is a valid UUID and matches an existing patient_profiles entry
  let validPatientUuid: string | null = null;
  const isUuid = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  if (isUuid(apt.patientId)) {
    try {
      const { data: pData } = await supabaseAdmin
        .from('patient_profiles')
        .select('id')
        .eq('id', apt.patientId)
        .maybeSingle();
      if (pData) validPatientUuid = pData.id;
    } catch (_) {}
  }

  if (!validPatientUuid && (apt.patientEmail || apt.email)) {
    try {
      const emailToMatch = (apt.patientEmail || apt.email).trim().toLowerCase();
      const { data: pData } = await supabaseAdmin
        .from('patient_profiles')
        .select('id')
        .ilike('email', emailToMatch)
        .maybeSingle();
      if (pData && isUuid(pData.id)) validPatientUuid = pData.id;
    } catch (_) {}
  }

  symptoms = JSON.stringify({
    symptoms: symptoms,
    clinic: clinic,
    queueNumber: queueNumber,
    checkedIn: !!apt.checkedIn,
    checkInTime: apt.checkInTime || '',
    shareHistory: apt.shareHistory !== undefined ? !!apt.shareHistory : true,
    syncCrossFacilityRecords: !!apt.syncCrossFacilityRecords,
    requestRide: !!apt.requestRide,
    patientId: apt.patientId || '',
    patientEmail: apt.patientEmail || apt.email || '',
    patientPhone: apt.patientPhone || apt.phone || '',
  });

  const dbRow: any = {
    patient_name:  apt.patientName  ?? '',
    doctor_id:     apt.doctorId     ?? '',
    doctor_name:   apt.doctorName   ?? '',
    specialty:     apt.specialty    ?? '',
    doctor_image:  apt.doctorImage  ?? '',
    date:          apt.date         ?? '',
    time_slot:     apt.timeSlot     ?? '',
    status:        apt.status       ?? 'Upcoming',
    type:          apt.type         ?? '',
    symptoms:      symptoms,
    clinical_notes: apt.clinicalNotes ?? null,
    prescription:  apt.prescription ?? null,
  };
  if (validPatientUuid) {
    dbRow.patient_id = validPatientUuid;
  }

  // Database-level exclusivity conflict lock (Figure 5.51)
  const { data: existingSlotRows } = await supabaseAdmin
    .from('appointments')
    .select('id, status, doctor_name')
    .eq('date', apt.date)
    .eq('time_slot', apt.timeSlot)
    .neq('status', 'Cancelled');

  const cleanDoc = (apt.doctorName || '').toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();
  const dbBookedCount = (existingSlotRows || []).filter((r: any) => {
    const existingDoc = (r.doctor_name || '').toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();
    return existingDoc === cleanDoc;
  }).length;

  const isBufferSlot = (apt.timeSlot || '').includes('11:00') || (apt.timeSlot || '').includes('16:00');
  const slotMaxCap = isBufferSlot ? 2 : 3;

  if (dbBookedCount >= slotMaxCap) {
    throw new Error(`Concurrency Lock: Time slot ${apt.timeSlot} on ${apt.date} is fully booked (${dbBookedCount}/${slotMaxCap}).`);
  }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .insert(dbRow)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAppointment(data);
}

export async function updateAppointment(id: string, updates: any) {
  const dbRow: any = {};
  if (updates.date         !== undefined) dbRow.date          = updates.date;
  if (updates.status       !== undefined) dbRow.status        = updates.status;
  
  if (
    updates.symptoms !== undefined || 
    updates.remarks !== undefined || 
    updates.clinic !== undefined || 
    updates.checkedIn !== undefined || 
    updates.checkInTime !== undefined ||
    updates.queueNumber !== undefined ||
    updates.shareHistory !== undefined || 
    updates.syncCrossFacilityRecords !== undefined ||
    updates.requestRide !== undefined
  ) {
    let existingSymptoms = '';
    let existingClinic = '';
    let existingCheckedIn = false;
    let existingCheckInTime = '';
    let existingQueueNumber = '';
    let existingShareHistory = true;
    let existingSyncCrossFacilityRecords = false;
    let existingRequestRide = false;
    try {
      const { data: existingData } = await supabaseAdmin
        .from('appointments')
        .select('symptoms')
        .eq('id', id)
        .maybeSingle();
      if (existingData && existingData.symptoms) {
        const sym = existingData.symptoms;
        if (sym.startsWith('{') && sym.endsWith('}')) {
          const parsed = JSON.parse(sym);
          existingSymptoms = parsed.symptoms ?? '';
          existingClinic = parsed.clinic ?? '';
          existingCheckedIn = !!parsed.checkedIn;
          existingCheckInTime = parsed.checkInTime ?? '';
          existingQueueNumber = parsed.queueNumber ?? '';
          existingShareHistory = parsed.shareHistory !== undefined ? !!parsed.shareHistory : true;
          existingSyncCrossFacilityRecords = !!parsed.syncCrossFacilityRecords;
          existingRequestRide = !!parsed.requestRide;
        } else {
          existingSymptoms = sym;
        }
      }
    } catch (e) {
      // ignore
    }
    const nextSymptoms = updates.symptoms !== undefined ? updates.symptoms : (updates.remarks !== undefined ? updates.remarks : existingSymptoms);
    const nextClinic = updates.clinic !== undefined ? updates.clinic : existingClinic;
    const nextCheckedIn = updates.checkedIn !== undefined ? updates.checkedIn : existingCheckedIn;
    const nextCheckInTime = updates.checkInTime !== undefined ? updates.checkInTime : existingCheckInTime;
    const nextQueueNumber = updates.queueNumber !== undefined ? updates.queueNumber : existingQueueNumber;
    const nextShareHistory = updates.shareHistory !== undefined ? !!updates.shareHistory : existingShareHistory;
    const nextSyncCross = updates.syncCrossFacilityRecords !== undefined ? !!updates.syncCrossFacilityRecords : existingSyncCrossFacilityRecords;
    const nextRequestRide = updates.requestRide !== undefined ? !!updates.requestRide : existingRequestRide;
    
    dbRow.symptoms = JSON.stringify({
      symptoms: nextSymptoms,
      clinic: nextClinic,
      queueNumber: nextQueueNumber,
      checkedIn: nextCheckedIn,
      checkInTime: nextCheckInTime,
      shareHistory: nextShareHistory,
      syncCrossFacilityRecords: nextSyncCross,
      requestRide: nextRequestRide
    });
  }

  if (updates.clinicalNotes !== undefined) dbRow.clinical_notes = updates.clinicalNotes;
  if (updates.prescription !== undefined) dbRow.prescription  = updates.prescription;
  if (updates.timeSlot     !== undefined) dbRow.time_slot     = updates.timeSlot;

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update(dbRow)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAppointment(data);
}

export async function getAppointmentById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapAppointment(data);
}

export async function deleteAppointment(id: string) {
  const { error } = await supabaseAdmin.from('appointments').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { id };
}

// ============================================================
// VITAL SIGNS
// ============================================================

export async function getVitals(patientId: string) {
  const { data, error } = await supabaseAdmin
    .from('vital_signs')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapVital);
}

export async function addVital(vital: any) {
  const dbRow: any = {
    timestamp:          vital.timestamp          ?? new Date().toLocaleDateString('en-MY', { year:'numeric', month:'long', day:'2-digit' }),
    heart_rate:         vital.heartRate          ?? 0,
    blood_pressure_sys: vital.bloodPressureSys   ?? 0,
    blood_pressure_dia: vital.bloodPressureDia   ?? 0,
    temperature:        vital.temperature        ?? 0,
    weight:             vital.weight             ?? 0,
    oxygen_saturation:  vital.oxygenSaturation   ?? 0,
  };
  if (vital.patientId) dbRow.patient_id = vital.patientId;

  const { data, error } = await supabaseAdmin
    .from('vital_signs')
    .insert(dbRow)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapVital(data);
}

export async function updateVital(id: string | number, vital: any) {
  const dbRow: any = {};
  if (vital.timestamp !== undefined) dbRow.timestamp = vital.timestamp;
  if (vital.heartRate !== undefined) dbRow.heart_rate = vital.heartRate;
  if (vital.bloodPressureSys !== undefined) dbRow.blood_pressure_sys = vital.bloodPressureSys;
  if (vital.bloodPressureDia !== undefined) dbRow.blood_pressure_dia = vital.bloodPressureDia;
  if (vital.temperature !== undefined) dbRow.temperature = vital.temperature;
  if (vital.weight !== undefined) dbRow.weight = vital.weight;
  if (vital.oxygenSaturation !== undefined) dbRow.oxygen_saturation = vital.oxygenSaturation;

  const { data, error } = await supabaseAdmin
    .from('vital_signs')
    .update(dbRow)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapVital(data);
}


// ============================================================
// MESSAGES
// ============================================================

export async function getMessages(threadId: string) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMessage);
}

export async function addMessage(msg: any) {
  const dbRow = {
    thread_id:   msg.threadId,
    sender:      msg.sender      ?? 'user',
    sender_name: msg.senderName  ?? '',
    content:     msg.content || msg.text || '',
    timestamp:   msg.timestamp   ?? new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  };

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert(dbRow)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapMessage(data);
}

export async function deleteMessage(id: string) {
  const { error } = await supabaseAdmin.from('messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { id };
}

// ============================================================
// REVIEWS
// ============================================================

export async function getReviews(doctorId?: string) {
  let query = supabaseAdmin.from('reviews').select('*');
  if (doctorId) query = query.eq('doctor_id', doctorId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapReview);
}

export async function addReview(review: any) {
  const dbRow = {
    doctor_id:   review.doctorId   ?? '',
    doctor_name: review.doctorName ?? '',
    author:      review.author     ?? '',
    rating:      review.rating     ?? 5,
    text:        review.text       ?? '',
  };

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert(dbRow)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapReview(data);
}

// ============================================================
// CLINICIANS
// ============================================================

const staticClinicians = [
  // Cardiology
  {
    id: "doc-ainol-sahar",
    name: "Dr. Ainol Shareha Binti Sahar",
    specialty: "Ischemic Cardiovascular Conditions",
    rating: 4.9,
    reviewsCount: 203,
    image: "https://ui-avatars.com/api/?name=Dr.+Ainol+Shareha&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-simon-lo",
    name: "Dr. Simon Lo",
    specialty: "Coronary Angioplasty & Pacemakers",
    rating: 4.9,
    reviewsCount: 289,
    image: "https://ui-avatars.com/api/?name=Dr.+Simon+Lo&background=0d9488&color=fff",
    availability: "Tue, Thu — 10:00 AM to 3:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },
  {
    id: "doc-tan-seng-hock",
    name: "Dr. Tan Seng Hock",
    specialty: "Heart Valve Disease & Arrhythmias",
    rating: 4.9,
    reviewsCount: 142,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Seng+Hock&background=0d9488&color=fff",
    availability: "Mon, Tue, Thu — 9:00 AM to 4:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },
  {
    id: "doc-lim-boon-yee",
    name: "Dr. Lim Boon Yee",
    specialty: "Heart Failure & Electro-physiology",
    rating: 4.8,
    reviewsCount: 125,
    image: "https://ui-avatars.com/api/?name=Dr.+Lim+Boon+Yee&background=0d9488&color=fff",
    availability: "Mon, Wed — 9:00 AM to 4:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-ramesh-kumar",
    name: "Dr. Ramesh Kumar",
    specialty: "Hypertensive Heart & Preventive Care",
    rating: 4.7,
    reviewsCount: 94,
    image: "https://ui-avatars.com/api/?name=Dr.+Ramesh+Kumar&background=0d9488&color=fff",
    availability: "Tue, Thu — 8:30 AM to 4:30 PM",
    hospital: "Pantai Specialist Centre"
  },

  // Internal Medicine & Infectious Diseases
  {
    id: "doc-azmi-osman",
    name: "Dr. Azmi Bin Osman",
    specialty: "Complex Metabolic Diseases",
    rating: 4.9,
    reviewsCount: 312,
    image: "https://ui-avatars.com/api/?name=Dr.+Azmi+Osman&background=0d9488&color=fff",
    availability: "Mon–Fri — 9:00 AM to 4:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-chow-ting-soo",
    name: "Dr. Chow Ting Soo",
    specialty: "Epidemiology & Viral Containment",
    rating: 4.8,
    reviewsCount: 178,
    image: "https://ui-avatars.com/api/?name=Dr.+Chow+Ting+Soo&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 8:00 AM to 1:00 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-nur-farah-hana",
    name: "Dr. Nur Farah Hana",
    specialty: "Endocrinology & Acute Fevers",
    rating: 4.8,
    reviewsCount: 115,
    image: "https://ui-avatars.com/api/?name=Dr.+Nur+Farah+Hana&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-alan-wong",
    name: "Dr. Alan Wong",
    specialty: "Infectious Diseases & Travel Health",
    rating: 4.9,
    reviewsCount: 136,
    image: "https://ui-avatars.com/api/?name=Dr.+Alan+Wong&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 3:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },

  // Pediatrics
  {
    id: "doc-siti-aminah",
    name: "Dr. Siti Aminah",
    specialty: "Neonatology & Paediatric Emergencies",
    rating: 4.9,
    reviewsCount: 284,
    image: "https://ui-avatars.com/api/?name=Dr.+Siti+Aminah&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 4:30 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-priscilla-ooi",
    name: "Dr. Priscilla Ooi Sze Kee",
    specialty: "Infantile Allergies & Paediatric Nutrition",
    rating: 4.8,
    reviewsCount: 196,
    image: "https://ui-avatars.com/api/?name=Dr.+Priscilla+Ooi&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 9:00 AM to 2:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-wong-lai-kuan",
    name: "Dr. Wong Lai Kuan",
    specialty: "Child Development & Immunisation",
    rating: 4.8,
    reviewsCount: 98,
    image: "https://ui-avatars.com/api/?name=Dr.+Wong+Lai+Kuan&background=0d9488&color=fff",
    availability: "Wed, Fri — 9:00 AM to 1:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },
  {
    id: "doc-chew-wei-lik",
    name: "Dr. Chew Wei Lik",
    specialty: "Asthma & Respiratory Triage",
    rating: 4.7,
    reviewsCount: 87,
    image: "https://ui-avatars.com/api/?name=Dr.+Chew+Wei+Lik&background=0d9488&color=fff",
    availability: "Mon, Tue, Thu — 8:30 AM to 4:30 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-melissa-lim",
    name: "Dr. Melissa Lim",
    specialty: "Neonatal Intensive Care & Development",
    rating: 4.9,
    reviewsCount: 154,
    image: "https://ui-avatars.com/api/?name=Dr.+Melissa+Lim&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 4:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },

  // General Surgery
  {
    id: "doc-mohd-fakhrulsani",
    name: "Dr. Mohd Fakhrulsani",
    specialty: "Emergency Surgery & Trauma",
    rating: 4.8,
    reviewsCount: 167,
    image: "https://ui-avatars.com/api/?name=Dr.+Mohd+Fakhrulsani&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 3:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-tan-chee-khuan",
    name: "Dr. Tan Chee Khuan",
    specialty: "Minimally Invasive Surgery",
    rating: 4.9,
    reviewsCount: 241,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Chee+Khuan&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 2:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-raymond-chew",
    name: "Dr. Raymond Chew",
    specialty: "Laparoscopic & Hernia Surgery",
    rating: 4.9,
    reviewsCount: 95,
    image: "https://ui-avatars.com/api/?name=Dr.+Raymond+Chew&background=0d9488&color=fff",
    availability: "Mon, Wed — 9:00 AM to 4:00 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-hanafiah-harun",
    name: "Dr. Hanafiah Harun",
    specialty: "Trauma & Hepatobiliary Surgery",
    rating: 4.8,
    reviewsCount: 182,
    image: "https://ui-avatars.com/api/?name=Dr.+Hanafiah+Harun&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-ong-keat-jin",
    name: "Dr. Ong Keat Jin",
    specialty: "Colorectal Surgery & Endoscopy",
    rating: 4.9,
    reviewsCount: 121,
    image: "https://ui-avatars.com/api/?name=Dr.+Ong+Keat+Jin&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 3:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },

  // Orthopedics & Sports Medicine
  {
    id: "doc-boon-huck-wee",
    name: "Mr. Boon Huck Wee",
    specialty: "Joint Replacement & Sports Injuries",
    rating: 4.9,
    reviewsCount: 318,
    image: "https://ui-avatars.com/api/?name=Mr.+Boon+Huck+Wee&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 8:00 AM to 1:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-susan-lim",
    name: "Dr. Susan Lim",
    specialty: "Knee & Hip Reconstruction",
    rating: 4.8,
    reviewsCount: 88,
    image: "https://ui-avatars.com/api/?name=Dr.+Susan+Lim&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 10:00 AM to 4:00 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-zulkarnean",
    name: "Dr. Zulkarnean",
    specialty: "Trauma & Fracture Fixation",
    rating: 4.7,
    reviewsCount: 105,
    image: "https://ui-avatars.com/api/?name=Dr.+Zulkarnean&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 5:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-terence-oak",
    name: "Dr. Terence Oak",
    specialty: "Arthroscopy & Ligament Reconstruction",
    rating: 4.9,
    reviewsCount: 147,
    image: "https://ui-avatars.com/api/?name=Dr.+Terence+Oak&background=0d9488&color=fff",
    availability: "Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },

  // Neurology
  {
    id: "doc-sim-bee-fung",
    name: "Dr. Sim Bee Fung",
    specialty: "Stroke Recovery & Neuromuscular Disorders",
    rating: 4.9,
    reviewsCount: 227,
    image: "https://ui-avatars.com/api/?name=Dr.+Sim+Bee+Fung&background=0d9488&color=fff",
    availability: "Mon, Tue, Thu — 9:00 AM to 3:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },
  {
    id: "doc-lee-hock-heng",
    name: "Dr. Lee Hock Heng",
    specialty: "Stroke & Epilepsy Management",
    rating: 4.9,
    reviewsCount: 112,
    image: "https://ui-avatars.com/api/?name=Dr.+Lee+Hock+Heng&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 4:30 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-faridah-kamal",
    name: "Dr. Faridah Kamal",
    specialty: "Parkinson & Degenerative Disorders",
    rating: 4.8,
    reviewsCount: 136,
    image: "https://ui-avatars.com/api/?name=Dr.+Faridah+Kamal&background=0d9488&color=fff",
    availability: "Mon, Wed — 8:30 AM to 4:00 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-tan-kay-seng",
    name: "Dr. Tan Kay Seng",
    specialty: "Neuromuscular & Sleep Diagnostics",
    rating: 4.8,
    reviewsCount: 94,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Kay+Seng&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 3:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },

  // Gastroenterology & Urology
  {
    id: "doc-mohamad-fadli",
    name: "Dr. Mohamad Fadli Bin Abd Rahman",
    specialty: "GI Endoscopy & Liver Pathologies",
    rating: 4.8,
    reviewsCount: 189,
    image: "https://ui-avatars.com/api/?name=Dr.+Mohamad+Fadli&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-ng-cheok-man",
    name: "Dr. Ng Cheok Man",
    specialty: "Renal Stone Extraction & Urology",
    rating: 4.8,
    reviewsCount: 208,
    image: "https://ui-avatars.com/api/?name=Dr.+Ng+Cheok+Man&background=0d9488&color=fff",
    availability: "Tue, Thu — 8:00 AM to 1:00 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-rosli-md-ali",
    name: "Dr. Rosli Md Ali",
    specialty: "Renal Calculi & Prostate Health",
    rating: 4.8,
    reviewsCount: 154,
    image: "https://ui-avatars.com/api/?name=Dr.+Rosli+Md+Ali&background=0d9488&color=fff",
    availability: "Mon, Wed — 9:00 AM to 4:30 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-jeffrey-tan",
    name: "Dr. Jeffrey Tan",
    specialty: "GERD & Colorectal Screening",
    rating: 4.9,
    reviewsCount: 112,
    image: "https://ui-avatars.com/api/?name=Dr.+Jeffrey+Tan&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 4:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },

  // General Practice & Family Medicine
  {
    id: "doc-loganathan",
    name: "Dr. K. Loganathan",
    specialty: "Community Wellness & Outpatient Diagnostics",
    rating: 4.8,
    reviewsCount: 267,
    image: "https://ui-avatars.com/api/?name=Dr.+K.+Loganathan&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-noraini-ahmad",
    name: "Dr. Noraini Ahmad",
    specialty: "Prenatal Care & Child Vaccination",
    rating: 4.9,
    reviewsCount: 341,
    image: "https://ui-avatars.com/api/?name=Dr.+Noraini+Ahmad&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-farah-alwani",
    name: "Dr. Farah Alwani",
    specialty: "Community & Childhood Health",
    rating: 4.7,
    reviewsCount: 132,
    image: "https://ui-avatars.com/api/?name=Dr.+Farah+Alwani&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:30 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-tan-aik-kah",
    name: "Dr. Tan Aik Kah",
    specialty: "Outpatient Triage & Primary Care",
    rating: 4.8,
    reviewsCount: 142,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Aik+Kah&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },
  {
    id: "doc-nor-aziah",
    name: "Dr. Nor Aziah",
    specialty: "Family Health & Triage",
    rating: 4.7,
    reviewsCount: 121,
    image: "https://ui-avatars.com/api/?name=Dr.+Nor+Aziah&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-mohd-razali",
    name: "Dr. Mohd Razali",
    specialty: "Outpatient Medical Care & Triage",
    rating: 4.7,
    reviewsCount: 154,
    image: "https://ui-avatars.com/api/?name=Dr.+Mohd+Razali&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-nurul-huda",
    name: "Dr. Nurul Huda",
    specialty: "Diabetes & Non-Communicable Diseases",
    rating: 4.8,
    reviewsCount: 312,
    image: "https://ui-avatars.com/api/?name=Dr.+Nurul+Huda&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-tan-wei-shen",
    name: "Dr. Tan Wei Shen",
    specialty: "Occupational & Acute Care",
    rating: 4.7,
    reviewsCount: 189,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Wei+Shen&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-lee-shen-rong",
    name: "Dr. Lee Shen Rong",
    specialty: "Family Medicine & Prescriptions",
    rating: 4.7,
    reviewsCount: 201,
    image: "https://ui-avatars.com/api/?name=Dr.+Lee+Shen+Rong&background=0d9488&color=fff",
    availability: "Mon–Sat — 8:00 AM to 6:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },
  {
    id: "doc-jane-lim",
    name: "Dr. Jane Lim",
    specialty: "Adolescent Health & Minor Procedures",
    rating: 4.7,
    reviewsCount: 154,
    image: "https://ui-avatars.com/api/?name=Dr.+Jane+Lim&background=0d9488&color=fff",
    availability: "Mon–Sat — 8:00 AM to 6:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-sarah-lim",
    name: "Dr. Sarah Lim",
    specialty: "Skin Disorders & General Wellness",
    rating: 4.8,
    reviewsCount: 217,
    image: "https://ui-avatars.com/api/?name=Dr.+Sarah+Lim&background=0d9488&color=fff",
    availability: "Mon–Sat — 8:30 AM to 9:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  },
  {
    id: "doc-benjamin-koay",
    name: "Dr. Benjamin Koay",
    specialty: "Preventive Health & Elderly Care",
    rating: 4.8,
    reviewsCount: 198,
    image: "https://ui-avatars.com/api/?name=Dr.+Benjamin+Koay&background=0d9488&color=fff",
    availability: "Mon–Sat — 8:30 AM to 9:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },
  {
    id: "doc-michael-tan",
    name: "Dr. Michael Tan",
    specialty: "Corporate Medicals & Industrial Health",
    rating: 4.8,
    reviewsCount: 176,
    image: "https://ui-avatars.com/api/?name=Dr.+Michael+Tan&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:30 PM",
    hospital: "Pantai Specialist Centre"
  },
  // Emergency Medicine
  {
    id: "doc-marcus-vance",
    name: "Dr. Marcus Vance",
    specialty: "Emergency Medicine & Trauma Care",
    rating: 4.9,
    reviewsCount: 184,
    image: "https://ui-avatars.com/api/?name=Dr.+Marcus+Vance&background=0d9488&color=fff",
    availability: "24/7 Shift Rotation — Call Hospital",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-sarah-mitchell",
    name: "Dr. Sarah Mitchell",
    specialty: "Emergency & Critical Triage",
    rating: 4.9,
    reviewsCount: 142,
    image: "https://ui-avatars.com/api/?name=Dr.+Sarah+Mitchell&background=0d9488&color=fff",
    availability: "24/7 Shift Rotation — Call Hospital",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-kelvin-tan",
    name: "Dr. Kelvin Tan",
    specialty: "Emergency & Resuscitation Care",
    rating: 4.8,
    reviewsCount: 96,
    image: "https://ui-avatars.com/api/?name=Dr.+Kelvin+Tan&background=0d9488&color=fff",
    availability: "24/7 Shift Rotation — Call Hospital",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  }
];

export async function getClinicians() {
  return staticClinicians;
}

// ============================================================
// FACILITIES (PantaiCare Network Only)
// ============================================================

const pantaiFacilities = [
  {
    id: "ph-penang",
    name: "Pantai Hospital Penang (Main Hospital)",
    address: "82, Jalan Tengah, Bandar Bayan Baru, 11950 Bayan Lepas, Pulau Pinang",
    phone: "04-643 3888",
    hours: "Open 24 hours, 7 days a week (Tertiary Inpatient & 24/7 A&E)",
    emergencyBypass: false,
    ambulanceDetour: false,
    dischargeLock: false,
    distance: "1.2 km away",
    lat: 5.321389,
    lng: 100.284722,
    featured: true,
    zipCode: "11950"
  },
  {
    id: "pantai-pavilion",
    name: "Pantai Heart & Wellness Pavilion",
    address: "128, Jalan Burma, 10050 Georgetown, Pulau Pinang",
    phone: "04-222 7888",
    hours: "Mon–Fri: 8:30 AM – 5:30 PM | Sat: 8:30 AM – 1:00 PM",
    emergencyBypass: false,
    ambulanceDetour: false,
    dischargeLock: false,
    distance: "3.5 km away",
    lat: 5.420800,
    lng: 100.320100,
    featured: true,
    zipCode: "10050"
  },
  {
    id: "pantai-premier",
    name: "Pantai Premier Clinic & Day Surgery",
    address: "1-1-15, Tingkat Mahsuri, 11950 Bayan Baru, Pulau Pinang",
    phone: "04-641 2888",
    hours: "Mon–Sat: 8:00 AM – 9:00 PM | Sun: 9:00 AM – 1:00 PM",
    emergencyBypass: false,
    ambulanceDetour: false,
    dischargeLock: false,
    distance: "1.8 km away",
    lat: 5.326200,
    lng: 100.290500,
    featured: true,
    zipCode: "11950"
  },
  {
    id: "pantai-specialist",
    name: "Pantai Specialist Centre",
    address: "588, Jalan Air Itam, 11500 Ayer Itam, Pulau Pinang",
    phone: "04-828 5888",
    hours: "Mon–Sat: 8:00 AM – 8:00 PM | Sun: Closed",
    emergencyBypass: false,
    ambulanceDetour: false,
    dischargeLock: false,
    distance: "4.2 km away",
    lat: 5.405100,
    lng: 100.282900,
    featured: true,
    zipCode: "11500"
  }
];

export async function getFacilities() {
  return pantaiFacilities;
}

export async function getClinics() {
  return pantaiFacilities;
}

export async function getDoctors(clinicId?: number | string) {
  if (!clinicId) return staticClinicians;
  const clinicMap: Record<string, string> = {
    '1': 'Pantai Hospital Penang (Main Hospital)',
    'ph-penang': 'Pantai Hospital Penang (Main Hospital)',
    '2': 'Pantai Heart & Wellness Pavilion',
    'pantai-pavilion': 'Pantai Heart & Wellness Pavilion',
    '3': 'Pantai Premier Clinic & Day Surgery',
    'pantai-premier': 'Pantai Premier Clinic & Day Surgery',
    '4': 'Pantai Specialist Centre',
    'pantai-specialist': 'Pantai Specialist Centre'
  };
  const targetHospital = clinicMap[String(clinicId)];
  if (!targetHospital) return staticClinicians;
  return staticClinicians.filter(d => d.hospital === targetHospital);
}

// ============================================================
// SYSTEM LOGS
// ============================================================

export async function addSystemLog(log: any) {
  const dbRow = {
    message: log.message ?? JSON.stringify(log),
    level:   log.level   ?? 'info',
  };
  const { data, error } = await supabaseAdmin
    .from('system_logs')
    .insert(dbRow)
    .select()
    .single();
  if (error) console.error('Failed to write system log:', error.message);
  return data;
}

export async function getSystemLogs() {
  const { data, error } = await supabaseAdmin
    .from('system_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100);
  if (error) return [];
  return data ?? [];
}

// ============================================================
// LEGACY SHIMS (keep existing server.ts calls working)
// ============================================================

export const isSupabaseConfigured = true;

export async function getUsers() {
  const { data, error } = await supabaseAdmin.from('patient_profiles').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProfile);
}

export async function getUserByEmail(email: string) {
  return getPatientProfileByEmail(email);
}

export async function addUser(user: any) {
  return updatePatientProfile(user.email, user);
}

export async function getPatientProfiles() {
  return getUsers();
}

export async function getChatThreads(patientId?: string) {
  let query = supabaseAdmin.from('chat_threads').select('*');
  if (patientId) query = query.eq('patient_id', patientId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addChatThread(thread: any) {
  const { data, error } = await supabaseAdmin
    .from('chat_threads')
    .upsert({ id: thread.id, patient_id: thread.patientId }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getFacility(id: string) {
  const { data, error } = await supabaseAdmin.from('facilities').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return mapFacility(data);
}

export async function updateFacility(id: string, updates: any) {
  const dbRow: any = {};
  if (updates.name !== undefined) dbRow.name = updates.name;
  if (updates.address !== undefined) dbRow.address = updates.address;
  if (updates.phone !== undefined) dbRow.phone = updates.phone;
  if (updates.distance !== undefined) dbRow.distance = updates.distance;
  if (updates.lat !== undefined) dbRow.lat = updates.lat;
  if (updates.lng !== undefined) dbRow.lng = updates.lng;
  if (updates.featured !== undefined) dbRow.featured = updates.featured;
  if (updates.zipCode !== undefined) dbRow.zip_code = updates.zipCode;

  if (
    updates.hours !== undefined ||
    updates.emergencyBypass !== undefined ||
    updates.ambulanceDetour !== undefined ||
    updates.dischargeLock !== undefined
  ) {
    let currentHours = "";
    let currentEmergencyBypass = false;
    let currentAmbulanceDetour = false;
    let currentDischargeLock = false;

    try {
      const existing = await getFacility(id);
      if (existing) {
        currentHours = existing.hours || "";
        currentEmergencyBypass = !!existing.emergencyBypass;
        currentAmbulanceDetour = !!existing.ambulanceDetour;
        currentDischargeLock = !!existing.dischargeLock;
      }
    } catch (e) {
      // ignore
    }

    const nextHours = updates.hours !== undefined ? updates.hours : currentHours;
    const nextEmergencyBypass = updates.emergencyBypass !== undefined ? updates.emergencyBypass : currentEmergencyBypass;
    const nextAmbulanceDetour = updates.ambulanceDetour !== undefined ? updates.ambulanceDetour : currentAmbulanceDetour;
    const nextDischargeLock = updates.dischargeLock !== undefined ? updates.dischargeLock : currentDischargeLock;

    dbRow.hours = JSON.stringify({
      hours: nextHours,
      emergencyBypass: nextEmergencyBypass,
      ambulanceDetour: nextAmbulanceDetour,
      dischargeLock: nextDischargeLock
    });
  }

  const { data, error } = await supabaseAdmin.from('facilities').update(dbRow).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return mapFacility(data);
}

export async function listAllAuthUsers() {
  if (!supabaseServiceRoleKey) throw new Error('Service role key not configured');
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(error.message);
  return (data && (data as any).users) ? (data as any).users : (data as any);
}

export async function updateAuthUser(uid: string, updates: any) {
  if (!supabaseServiceRoleKey) throw new Error('Service role key not configured');
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(uid, updates);
  if (error) throw new Error(error.message);
  return data.user;
}

export async function deleteAuthUser(uid: string) {
  if (!supabaseServiceRoleKey) throw new Error('Service role key not configured');
  const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteSystemLog(id: string | number) {
  const { error } = await supabaseAdmin.from('system_logs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ============================================================
// AUDIT LOGS, INTERCEPT LOGS & DOCTOR LEAVES
// ============================================================

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_email: string;
  actor_role: string;
  action_type: string;
  facility_id?: number;
  target_id?: string;
  description: string;
  created_at: string;
}

export interface EmergencyInterceptLogItem {
  id: string;
  patient_id?: string;
  raw_symptoms: string;
  matched_keywords: string[];
  severity_score: number;
  intercept_action: string;
  facility_id?: number;
  created_at: string;
}

export interface DoctorLeaveItem {
  id: string;
  doctor_id?: string;
  doctor_name?: string;
  facility_id?: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
  created_at: string;
}

const memoryAuditLogs: AuditLogItem[] = [
  {
    id: 'audit-init-01',
    actor_id: 'staff-ph-01',
    actor_email: 'pantaipenangstaff@gmail.com',
    actor_role: 'staff',
    facility_id: 1,
    action_type: 'QUEUE_CHECK_IN',
    target_id: 'Q-301',
    description: 'pantaipenangstaff@gmail.com verified identity & completed check-in for ticket Q-301',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'audit-init-02',
    actor_id: 'admin-ph-01',
    actor_email: 'pantaipenangadmin@gmail.com',
    actor_role: 'admin',
    facility_id: 1,
    action_type: 'STATUS_CHANGE',
    target_id: 'dr.ainolshareha@gmail.com',
    description: 'pantaipenangadmin@gmail.com verified roster status: Dr. Ainol Shareha assigned to Consultation Room 1 (ON_DUTY)',
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString()
  },
  {
    id: 'audit-init-03',
    actor_id: 'admin-ph-01',
    actor_email: 'pantaipenangadmin@gmail.com',
    actor_role: 'admin',
    facility_id: 1,
    action_type: 'PASSWORD_RESET',
    target_id: 'nurse.station1@gmail.com',
    description: 'pantaipenangadmin@gmail.com reset password to standardized PIN 12345678 for nurse.station1@gmail.com',
    created_at: new Date(Date.now() - 150 * 60 * 1000).toISOString()
  }
];

const memoryInterceptLogs: EmergencyInterceptLogItem[] = [
  {
    id: 'intercept-init-01',
    patient_id: 'pt-anon-4819',
    raw_symptoms: 'Sudden severe crushing chest pain radiating to left arm and jaw with profuse cold sweat for 20 minutes',
    matched_keywords: ['chest pain', 'crushing weight', 'radiating left arm', 'cold sweat'],
    severity_score: 9.8,
    intercept_action: 'REDIRECT_999_A&E',
    facility_id: 1,
    created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString()
  },
  {
    id: 'intercept-init-02',
    patient_id: 'pt-anon-7201',
    raw_symptoms: 'Kitchen accident with heavy meat cleaver, complete traumatic amputation of index finger with bleeding',
    matched_keywords: ['amputation', 'severed finger', 'profuse bleeding'],
    severity_score: 10.0,
    intercept_action: 'REDIRECT_999_A&E',
    facility_id: 1,
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString()
  }
];

const memoryDoctorLeaves: DoctorLeaveItem[] = [];

export async function addAuditLog(entry: Omit<AuditLogItem, 'id' | 'created_at'>) {
  const item: AuditLogItem = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    ...entry,
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabaseAdmin.from('audit_logs').insert([item]).select().single();
    if (!error && data) return data;
  } catch (err: any) {
    // fallback
  }
  memoryAuditLogs.unshift(item);
  return item;
}

export async function getAuditLogs(facility_id?: number, limit = 100) {
  try {
    let query = supabaseAdmin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (facility_id) query = query.eq('facility_id', facility_id);
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch (err: any) {
    // fallback
  }
  let res = memoryAuditLogs;
  if (facility_id) res = res.filter(l => !l.facility_id || l.facility_id === facility_id);
  return res.slice(0, limit);
}

export async function addEmergencyInterceptLog(entry: Omit<EmergencyInterceptLogItem, 'id' | 'created_at'>) {
  const item: EmergencyInterceptLogItem = {
    id: `intercept-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    ...entry,
    intercept_action: entry.intercept_action || 'REDIRECT_999_A&E',
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabaseAdmin.from('emergency_intercept_logs').insert([item]).select().single();
    if (!error && data) return data;
  } catch (err: any) {
    // fallback
  }
  memoryInterceptLogs.unshift(item);
  return item;
}

export async function getEmergencyInterceptLogs(facility_id?: number, limit = 50) {
  try {
    let query = supabaseAdmin.from('emergency_intercept_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (facility_id) query = query.eq('facility_id', facility_id);
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch (err: any) {
    // fallback
  }
  let res = memoryInterceptLogs;
  if (facility_id) res = res.filter(l => !l.facility_id || l.facility_id === facility_id);
  return res.slice(0, limit);
}

export async function addDoctorLeave(entry: Omit<DoctorLeaveItem, 'id' | 'created_at' | 'status'>) {
  const item: DoctorLeaveItem = {
    id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    ...entry,
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabaseAdmin.from('doctor_leaves').insert([item]).select().single();
    if (!error && data) return data;
  } catch (err: any) {
    // fallback
  }
  memoryDoctorLeaves.unshift(item);
  return item;
}

export async function getDoctorLeaves(facility_id?: number, doctor_id?: string) {
  try {
    let query = supabaseAdmin.from('doctor_leaves').select('*').order('created_at', { ascending: false });
    if (facility_id) query = query.eq('facility_id', facility_id);
    if (doctor_id) query = query.eq('doctor_id', doctor_id);
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch (err: any) {
    // fallback
  }
  let res = memoryDoctorLeaves;
  if (facility_id) res = res.filter(l => !l.facility_id || l.facility_id === facility_id);
  if (doctor_id) res = res.filter(l => l.doctor_id === doctor_id);
  return res;
}

// ============================================================
// 4 MODULES: HOLIDAYS, DEPARTMENTS, DOCTOR APPROVALS, INQUIRIES
// ============================================================

export interface FacilityHoliday {
  id: string;
  facility_id: number;
  holiday_date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface DepartmentItem {
  id: number | string;
  facility_id: number;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
  requested_by?: string;
  created_at: string;
}

export interface DoctorApprovalItem {
  id: string;
  email: string;
  fullName: string;
  department: string;
  roomNumber?: string;
  mmcNumber?: string;
  employmentType?: 'RESIDENT' | 'SESSIONAL';
  role: 'doctor';
  facility_id: number;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
  nominated_by?: string;
  created_at: string;
}

export interface ClinicInquiry {
  id: string;
  patient_id?: string;
  patient_name?: string;
  patient_email?: string;
  facility_id: number;
  department: string;
  doctor_id?: string | null;
  doctor_name?: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'REPLIED' | 'RESOLVED';
  reply_text?: string;
  replied_by?: string;
  created_at: string;
}

export interface DoctorWeeklyRoster {
  id?: string;
  doctor_id: string;
  day_of_week: number; // 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat, 7: Sun
  is_active: boolean;
  start_time: string; // '09:00:00'
  end_time: string;   // '17:00:00'
  slot_duration_mins?: number;
  max_patients?: number;
}

export interface DoctorCustomSession {
  id: string;
  doctor_id: string;
  facility_id: number;
  session_date: string; // YYYY-MM-DD
  start_time: string;   // '09:00:00'
  end_time: string;     // '13:00:00'
  room_number: string;
  max_capacity: number;
  status: 'OPEN' | 'CLOSED';
  created_at: string;
}

const OPS_FILE = path.join(process.cwd(), "admin_operations.json");

interface OpsStore {
  holidays: FacilityHoliday[];
  departments: DepartmentItem[];
  nominatedDoctors: DoctorApprovalItem[];
  inquiries: ClinicInquiry[];
  weeklyRosters?: DoctorWeeklyRoster[];
  customSessions?: DoctorCustomSession[];
}

export function loadOpsStore(): OpsStore {
  try {
    if (fs.existsSync(OPS_FILE)) {
      const raw = fs.readFileSync(OPS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (!parsed.weeklyRosters) parsed.weeklyRosters = [];
      if (!parsed.customSessions) parsed.customSessions = [];
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load admin operations file:", e);
  }
  return {
    holidays: [],
    weeklyRosters: [],
    customSessions: [],
    departments: [
      { id: 1, facility_id: 1, name: 'Emergency A&E', status: 'ACTIVE', created_at: '2026-01-01' },
      { id: 2, facility_id: 1, name: 'General Surgery', status: 'ACTIVE', created_at: '2026-01-01' },
      { id: 3, facility_id: 1, name: 'Internal Medicine', status: 'ACTIVE', created_at: '2026-01-01' },
      { id: 4, facility_id: 1, name: 'Respiratory Medicine', status: 'ACTIVE', created_at: '2026-01-01' },
      { id: 5, facility_id: 2, name: 'Cardiology', status: 'ACTIVE', created_at: '2026-01-01' },
      { id: 6, facility_id: 2, name: 'Health Screening & Wellness', status: 'ACTIVE', created_at: '2026-01-01' },
      { id: 7, facility_id: 3, name: 'Gastroenterology & Hepatology', status: 'ACTIVE', created_at: '2026-01-01' },
      { id: 8, facility_id: 3, name: 'Dermatology', status: 'ACTIVE', created_at: '2026-01-01' },
      { id: 9, facility_id: 4, name: 'Orthopaedic Surgery', status: 'ACTIVE', created_at: '2026-01-01' },
      { id: 10, facility_id: 4, name: 'Ear, Nose & Throat (Otorhinolaryngology)', status: 'ACTIVE', created_at: '2026-01-01' }
    ],
    nominatedDoctors: [
      {
        id: "doc-pending-01",
        email: "dr_siti_pediatric@pantaipenang.com",
        fullName: "Dr. Siti Aminah Binti Yusof",
        department: "General Paediatrics",
        roomNumber: "Consultation Suite 402",
        mmcNumber: "MMC-78921",
        employmentType: "RESIDENT",
        role: "doctor",
        facility_id: 1,
        status: "ACTIVE",
        nominated_by: "dr_ainol_internal@pantaipenang.com",
        created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
      }
    ],
    inquiries: [
      {
        id: "inq-init-01",
        patient_id: "pt-user-01",
        patient_name: "patient",
        patient_email: "user@gmail.com",
        facility_id: 1,
        department: "Internal Medicine",
        doctor_id: null,
        doctor_name: "General Clinic Desk",
        subject: "Post-checkup blood test result timeline",
        message: "Hello clinic team, may I know when the comprehensive metabolic panel results will be uploaded to my portal?",
        status: "OPEN",
        created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
      }
    ]
  };
}

function saveOpsStore(data: OpsStore) {
  try {
    fs.writeFileSync(OPS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write admin operations file:", e);
  }
}

// 1. Holiday APIs
export async function addFacilityHoliday(entry: Omit<FacilityHoliday, 'id' | 'created_at'>) {
  const store = loadOpsStore();
  const id = `hol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const item: FacilityHoliday = {
    id,
    ...entry,
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabaseAdmin.from('facility_holidays').insert([{
      facility_id: entry.facility_id,
      holiday_date: entry.holiday_date,
      title: entry.title,
      description: entry.description,
      created_by: entry.created_by
    }]).select().single();
    if (!error && data) {
      item.id = data.id;
    }
  } catch(e) {}
  
  const existingIdx = store.holidays.findIndex(h => h.facility_id === entry.facility_id && h.holiday_date === entry.holiday_date);
  if (existingIdx >= 0) {
    store.holidays[existingIdx] = item;
  } else {
    store.holidays.unshift(item);
  }
  saveOpsStore(store);
  return item;
}

function withTimeout(promise: any, ms = 1200): Promise<any> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), ms))
  ]);
}

export async function getFacilityHolidays(facility_id?: number) {
  try {
    let query = supabaseAdmin.from('facility_holidays').select('*').order('holiday_date', { ascending: true });
    if (facility_id) query = query.eq('facility_id', facility_id);
    const { data, error } = await withTimeout(query, 1200);
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch(e) {}
  const store = loadOpsStore();
  if (facility_id) {
    return store.holidays.filter(h => h.facility_id === facility_id);
  }
  return store.holidays;
}

export async function deleteFacilityHoliday(id: string) {
  try {
    await supabaseAdmin.from('facility_holidays').delete().eq('id', id);
  } catch(e) {}
  const store = loadOpsStore();
  store.holidays = store.holidays.filter(h => h.id !== id);
  saveOpsStore(store);
  return { success: true };
}

// 2. Department APIs
export async function submitDepartment(entry: { facility_id: number; name: string; description?: string; requested_by?: string }) {
  const store = loadOpsStore();
  const id = `dept-${Date.now()}`;
  const item: DepartmentItem = {
    id,
    facility_id: entry.facility_id,
    name: entry.name,
    description: entry.description,
    status: 'PENDING_APPROVAL',
    requested_by: entry.requested_by,
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabaseAdmin.from('departments').insert([{
      facility_id: entry.facility_id,
      name: entry.name,
      description: entry.description,
      status: 'PENDING_APPROVAL',
      requested_by: entry.requested_by
    }]).select().single();
    if (!error && data) {
      item.id = data.id;
    }
  } catch(e) {}
  store.departments.push(item);
  saveOpsStore(store);
  return item;
}

export async function directAddDepartment(entry: { facility_id: number; name: string; description?: string; requested_by?: string }) {
  const store = loadOpsStore();
  const id = `dept-${Date.now()}`;
  const item: DepartmentItem = {
    id,
    facility_id: entry.facility_id,
    name: entry.name,
    description: entry.description,
    status: 'ACTIVE',
    requested_by: entry.requested_by || 'admin',
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabaseAdmin.from('departments').insert([{
      facility_id: entry.facility_id,
      name: entry.name,
      description: entry.description,
      status: 'ACTIVE',
      requested_by: entry.requested_by || 'admin'
    }]).select().single();
    if (!error && data) {
      item.id = data.id;
    }
  } catch(e) {}
  store.departments.push(item);
  saveOpsStore(store);
  return item;
}

export async function getActiveDepartments(facility_id?: number) {
  try {
    let query = supabaseAdmin.from('departments').select('*').eq('status', 'ACTIVE');
    if (facility_id) query = query.eq('facility_id', facility_id);
    const { data, error } = await withTimeout(query, 1200);
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch(e) {}
  const store = loadOpsStore();
  let list = store.departments.filter(d => d.status === 'ACTIVE');
  if (facility_id) list = list.filter(d => d.facility_id === facility_id);
  return list;
}

export async function getPendingDepartments(facility_id?: number) {
  try {
    let query = supabaseAdmin.from('departments').select('*').eq('status', 'PENDING_APPROVAL');
    if (facility_id) query = query.eq('facility_id', facility_id);
    const { data, error } = await withTimeout(query, 1200);
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch(e) {}
  const store = loadOpsStore();
  let list = store.departments.filter(d => d.status === 'PENDING_APPROVAL');
  if (facility_id) list = list.filter(d => d.facility_id === facility_id);
  return list;
}

export async function updateDepartmentStatus(id: string | number, status: 'ACTIVE' | 'REJECTED') {
  try {
    await supabaseAdmin.from('departments').update({ status }).eq('id', id);
  } catch(e) {}
  const store = loadOpsStore();
  const match = store.departments.find(d => String(d.id) === String(id));
  if (match) {
    match.status = status;
    saveOpsStore(store);
  }
  return { success: true };
}

// 3. Doctor Approval APIs
export async function nominateDoctor(doc: Omit<DoctorApprovalItem, 'id' | 'status' | 'created_at'>) {
  const store = loadOpsStore();
  const item: DoctorApprovalItem = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...doc,
    status: 'PENDING_APPROVAL',
    created_at: new Date().toISOString()
  };
  store.nominatedDoctors.unshift(item);
  saveOpsStore(store);
  return item;
}

export async function directAddDoctor(doc: Omit<DoctorApprovalItem, 'id' | 'status' | 'created_at'>) {
  const store = loadOpsStore();
  const item: DoctorApprovalItem = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...doc,
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };
  store.nominatedDoctors.unshift(item);
  saveOpsStore(store);
  return item;
}

export async function getPendingDoctors(facility_id?: number) {
  const store = loadOpsStore();
  let list = store.nominatedDoctors.filter(d => d.status === 'PENDING_APPROVAL');
  if (facility_id) list = list.filter(d => d.facility_id === facility_id);
  return list;
}

export async function getActiveDoctors(facility_id?: number) {
  const store = loadOpsStore();
  let list = store.nominatedDoctors.filter(d => d.status === 'ACTIVE');
  if (facility_id) list = list.filter(d => d.facility_id === facility_id);
  return list;
}

export async function updateDoctorApprovalStatus(id: string, status: 'ACTIVE' | 'REJECTED') {
  const store = loadOpsStore();
  const match = store.nominatedDoctors.find(d => d.id === id);
  if (match) {
    match.status = status;
    saveOpsStore(store);
  }
  return { success: true };
}

// 4. Clinic Inquiry APIs
export async function submitClinicInquiry(inquiry: Omit<ClinicInquiry, 'id' | 'status' | 'created_at'>) {
  const store = loadOpsStore();
  const item: ClinicInquiry = {
    id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...inquiry,
    status: 'OPEN',
    created_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabaseAdmin.from('clinic_inquiries').insert([{
      patient_id: inquiry.patient_id,
      facility_id: inquiry.facility_id,
      department: inquiry.department,
      doctor_id: inquiry.doctor_id,
      subject: inquiry.subject,
      message: inquiry.message,
      status: 'OPEN'
    }]).select().single();
    if (!error && data) item.id = data.id;
  } catch(e) {}
  store.inquiries.unshift(item);
  saveOpsStore(store);
  return item;
}

export async function getClinicInquiries(facility_id?: number, department?: string, patient_id?: string) {
  try {
    let query = supabaseAdmin.from('clinic_inquiries').select('*').order('created_at', { ascending: false });
    if (facility_id) query = query.eq('facility_id', facility_id);
    if (department && department !== 'All') query = query.eq('department', department);
    if (patient_id) query = query.eq('patient_id', patient_id);
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) return data;
  } catch(e) {}
  const store = loadOpsStore();
  let list = store.inquiries;
  if (facility_id) list = list.filter(i => i.facility_id === facility_id);
  if (department && department !== 'All') list = list.filter(i => i.department.toLowerCase() === department.toLowerCase());
  if (patient_id) list = list.filter(i => i.patient_id === patient_id || i.patient_email === patient_id);
  return list;
}

export async function replyClinicInquiry(id: string, replyText: string, repliedBy?: string) {
  try {
    await supabaseAdmin.from('clinic_inquiries').update({
      status: 'REPLIED',
      reply_text: replyText,
      replied_by: repliedBy
    }).eq('id', id);
  } catch(e) {}
  const store = loadOpsStore();
  const match = store.inquiries.find(i => i.id === id);
  if (match) {
    match.status = 'REPLIED';
    match.reply_text = replyText;
    match.replied_by = repliedBy;
    saveOpsStore(store);
  }
  return { success: true };
}

// ============================================================
// 5. DOCTOR ROSTER & SESSIONAL ON-DEMAND SCHEDULING
// ============================================================

export function getDefaultResidentWeeklyRoster(doctorId: string): DoctorWeeklyRoster[] {
  return [
    { doctor_id: doctorId, day_of_week: 1, is_active: true, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
    { doctor_id: doctorId, day_of_week: 2, is_active: true, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
    { doctor_id: doctorId, day_of_week: 3, is_active: true, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
    { doctor_id: doctorId, day_of_week: 4, is_active: true, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
    { doctor_id: doctorId, day_of_week: 5, is_active: true, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
    { doctor_id: doctorId, day_of_week: 6, is_active: false, start_time: '09:00:00', end_time: '13:00:00', max_patients: 12 },
  ];
}

export async function getDoctorWeeklyRoster(doctorId: string, employmentType = 'RESIDENT'): Promise<DoctorWeeklyRoster[]> {
  try {
    const { data, error } = await withTimeout(
      supabaseAdmin.from('doctor_weekly_rosters').select('*').eq('doctor_id', doctorId).order('day_of_week', { ascending: true }),
      1200
    );
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (e) {}

  const store = loadOpsStore();
  const matched = (store.weeklyRosters || []).filter(r => r.doctor_id === doctorId);
  if (matched.length > 0) {
    return matched.sort((a, b) => a.day_of_week - b.day_of_week);
  }

  if (employmentType.toUpperCase() === 'RESIDENT') {
    return getDefaultResidentWeeklyRoster(doctorId);
  } else {
    return [
      { doctor_id: doctorId, day_of_week: 1, is_active: false, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
      { doctor_id: doctorId, day_of_week: 2, is_active: false, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
      { doctor_id: doctorId, day_of_week: 3, is_active: false, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
      { doctor_id: doctorId, day_of_week: 4, is_active: false, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
      { doctor_id: doctorId, day_of_week: 5, is_active: false, start_time: '09:00:00', end_time: '17:00:00', max_patients: 24 },
      { doctor_id: doctorId, day_of_week: 6, is_active: false, start_time: '09:00:00', end_time: '13:00:00', max_patients: 12 },
    ];
  }
}

export async function saveDoctorWeeklyRoster(doctorId: string, rosters: DoctorWeeklyRoster[]): Promise<{ success: boolean }> {
  try {
    for (const r of rosters) {
      await withTimeout(
        supabaseAdmin.from('doctor_weekly_rosters').upsert({
          doctor_id: doctorId,
          day_of_week: r.day_of_week,
          is_active: r.is_active,
          start_time: r.start_time || '09:00:00',
          end_time: r.end_time || '17:00:00',
          max_patients: r.max_patients || 24
        }, { onConflict: 'doctor_id,day_of_week' }),
        1200
      );
    }
  } catch (e) {}

  const store = loadOpsStore();
  if (!store.weeklyRosters) store.weeklyRosters = [];
  store.weeklyRosters = store.weeklyRosters.filter(r => r.doctor_id !== doctorId);
  for (const r of rosters) {
    store.weeklyRosters.push({
      doctor_id: doctorId,
      day_of_week: r.day_of_week,
      is_active: r.is_active,
      start_time: r.start_time || '09:00:00',
      end_time: r.end_time || '17:00:00',
      max_patients: r.max_patients || 24
    });
  }
  saveOpsStore(store);
  return { success: true };
}

export async function getDoctorCustomSessions(doctorId: string, futureOnly = true): Promise<DoctorCustomSession[]> {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    let query = supabaseAdmin.from('doctor_custom_sessions').select('*').eq('doctor_id', doctorId);
    if (futureOnly) {
      query = query.gte('session_date', todayStr);
    }
    query = query.order('session_date', { ascending: true });
    const { data, error } = await withTimeout(query, 1200);
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (e) {}

  const store = loadOpsStore();
  let list = (store.customSessions || []).filter(s => s.doctor_id === doctorId);
  if (futureOnly) {
    list = list.filter(s => s.session_date >= todayStr);
  }
  return list.sort((a, b) => a.session_date.localeCompare(b.session_date));
}

export async function createDoctorCustomSession(entry: Omit<DoctorCustomSession, 'id' | 'created_at'>): Promise<DoctorCustomSession> {
  const id = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const item: DoctorCustomSession = {
    id,
    ...entry,
    status: entry.status || 'OPEN',
    created_at: new Date().toISOString()
  };

  try {
    await withTimeout(
      supabaseAdmin.from('doctor_custom_sessions').insert([{
        id: item.id,
        doctor_id: item.doctor_id,
        facility_id: item.facility_id,
        session_date: item.session_date,
        start_time: item.start_time,
        end_time: item.end_time,
        room_number: item.room_number,
        max_capacity: item.max_capacity,
        status: item.status
      }]),
      1200
    );
  } catch (e) {}

  const store = loadOpsStore();
  if (!store.customSessions) store.customSessions = [];
  const existingIdx = store.customSessions.findIndex(s => s.doctor_id === item.doctor_id && s.session_date === item.session_date);
  if (existingIdx >= 0) {
    store.customSessions[existingIdx] = item;
  } else {
    store.customSessions.push(item);
  }
  saveOpsStore(store);
  return item;
}

export async function updateDoctorCustomSession(
  id: string,
  updates: Partial<Omit<DoctorCustomSession, 'id' | 'created_at'>>
): Promise<DoctorCustomSession | null> {
  let updatedRecord: DoctorCustomSession | null = null;
  try {
    const { data, error } = await withTimeout(
      supabaseAdmin.from('doctor_custom_sessions').update(updates).eq('id', id).select('*').single(),
      1200
    );
    if (!error && data) {
      updatedRecord = data;
    }
  } catch (e) {}

  const store = loadOpsStore();
  if (!store.customSessions) store.customSessions = [];
  const idx = store.customSessions.findIndex(s => s.id === id);
  if (idx >= 0) {
    store.customSessions[idx] = {
      ...store.customSessions[idx],
      ...updates
    };
    saveOpsStore(store);
    return store.customSessions[idx];
  } else if (updatedRecord) {
    store.customSessions.push(updatedRecord);
    saveOpsStore(store);
    return updatedRecord;
  }
  return null;
}

export async function deleteDoctorCustomSession(id: string): Promise<{ success: boolean }> {
  try {
    await withTimeout(
      supabaseAdmin.from('doctor_custom_sessions').delete().eq('id', id),
      1200
    );
  } catch (e) {}

  const store = loadOpsStore();
  if (store.customSessions) {
    store.customSessions = store.customSessions.filter(s => s.id !== id);
    saveOpsStore(store);
  }
  return { success: true };
}

export async function findDoctorProfile(idOrName: string) {
  if (!idOrName) return null;
  const target = idOrName.trim().toLowerCase();
  const cleanTarget = target.replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();

  // 1. Check database registered users
  const users = await getUsers();
  const matchedUser = users.find((u: any) => {
    if (u.role !== 'Doctor') return false;
    const uName = (u.fullName || '').toLowerCase();
    const uClean = uName.replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();
    const uEmail = (u.email || '').toLowerCase();
    return u.id === idOrName || uEmail === target || uName === target || uClean === cleanTarget;
  });

  if (matchedUser) {
    return {
      id: matchedUser.id,
      name: matchedUser.fullName,
      email: matchedUser.email,
      department: (matchedUser as any).department || 'General Medicine',
      employmentType: ((matchedUser as any).employmentType?.toUpperCase() === 'SESSIONAL' ? 'SESSIONAL' : 'RESIDENT') as 'RESIDENT' | 'SESSIONAL',
      roomNumber: (matchedUser as any).roomNumber || 'Consultation Room 301',
      facilityId: (matchedUser as any).facility_id || 1
    };
  }

  // 2. Check nominated/direct onboarded doctors in ops store
  const store = loadOpsStore();
  const matchedNom = (store.nominatedDoctors || []).find(d => {
    const dName = (d.fullName || '').toLowerCase();
    const dClean = dName.replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();
    const dEmail = (d.email || '').toLowerCase();
    return d.id === idOrName || dEmail === target || dName === target || dClean === cleanTarget;
  });

  if (matchedNom) {
    return {
      id: matchedNom.id,
      name: matchedNom.fullName,
      email: matchedNom.email,
      department: matchedNom.department || 'General Medicine',
      employmentType: (matchedNom.employmentType?.toUpperCase() === 'SESSIONAL' ? 'SESSIONAL' : 'RESIDENT') as 'RESIDENT' | 'SESSIONAL',
      roomNumber: matchedNom.roomNumber || 'Consultation Suite 402',
      facilityId: matchedNom.facility_id || 1
    };
  }

  // 3. Check official Pantai doctors registry
  const matchedPantai = allPantaiDoctors.find((d: any) => {
    const pName = (d.name || '').toLowerCase();
    const pClean = pName.replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();
    return d.id === idOrName || pName === target || pClean === cleanTarget;
  });

  if (matchedPantai) {
    const isSessional = (matchedPantai.status || '').toLowerCase().includes('sessional') || (matchedPantai.status || '').toLowerCase().includes('visiting');
    return {
      id: matchedPantai.id,
      name: matchedPantai.name,
      email: `${matchedPantai.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}@pantaipenang.com`,
      department: matchedPantai.department || 'Specialist Clinic',
      employmentType: (isSessional ? 'SESSIONAL' : 'RESIDENT') as 'RESIDENT' | 'SESSIONAL',
      roomNumber: `Consultation Suite ${Math.floor(200 + Math.random() * 200)}`,
      facilityId: 1
    };
  }

  // 4. Fallback profile
  return {
    id: idOrName,
    name: idOrName,
    department: 'Outpatient Clinic',
    employmentType: 'RESIDENT' as const,
    roomNumber: 'Consultation Room 301',
    facilityId: 1
  };
}



