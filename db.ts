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
  let defaultRegion = "Penang Island";
  let emailAlerts = true;
  let smsAlerts = true;
  let inAppAlerts = true;
  let prescriptions: any[] = [];
  let attachments: any[] = [];
  let notifications: any[] = [];
  
  let nationality = row.nationality ?? '';
  let emergencyContactName = "Razali Bin Ahmad";
  let emergencyContactPhone = "+60 12-987 6543 (Father)";
  let passwordHash = "";
  let resetToken = "";
  let resetExpiry = "";
  
  if (nationality.startsWith("{") && nationality.endsWith("}")) {
    try {
      const parsed = JSON.parse(nationality);
      nationality = parsed.nationality ?? '';
      emergencyContactName = parsed.emergencyContactName ?? emergencyContactName;
      emergencyContactPhone = parsed.emergencyContactPhone ?? emergencyContactPhone;
      passwordHash = parsed.passwordHash ?? '';
      resetToken = parsed.resetToken ?? '';
      resetExpiry = parsed.resetExpiry ?? '';
      prescriptions = parsed.prescriptions ?? [];
      attachments = parsed.attachments ?? [];
      language = parsed.language ?? 'English';
      defaultRegion = parsed.defaultRegion ?? 'Penang Island';
      emailAlerts = parsed.emailAlerts !== false;
      smsAlerts = parsed.smsAlerts !== false;
      inAppAlerts = parsed.inAppAlerts !== false;
      notifications = parsed.notifications ?? [];
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
    prescriptions,
    attachments,
    language,
    defaultRegion,
    emailAlerts,
    smsAlerts,
    inAppAlerts,
    notifications
  };
}

function mapAppointment(row: any) {
  if (!row) return null;
  let symptoms = row.symptoms ?? '';
  let clinic = '';
  if (symptoms.startsWith('{') && symptoms.endsWith('}')) {
    try {
      const parsed = JSON.parse(symptoms);
      symptoms = parsed.symptoms ?? '';
      clinic = parsed.clinic ?? '';
    } catch (e) {
      // ignore
    }
  }
  return {
    id:            row.id,
    patientId:     row.patient_id,
    patientName:   row.patient_name    ?? '',
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
  metadata?: { fullName?: string; role?: string; approved?: boolean }
) {
  const fullName = metadata?.fullName ?? email.split('@')[0];
  const role = metadata?.role ?? 'Patient';
  const approved = metadata?.approved ?? (role === 'Patient' || role === 'Admin');

  if (supabaseServiceRoleKey) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        approved,
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
  return { role, name, approved };
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
    updates.prescriptions !== undefined ||
    updates.attachments !== undefined ||
    updates.language !== undefined ||
    updates.defaultRegion !== undefined ||
    updates.emailAlerts !== undefined ||
    updates.smsAlerts !== undefined ||
    updates.inAppAlerts !== undefined
  ) {
    let currentNationality = "";
    let currentContactName = "Razali Bin Ahmad";
    let currentContactPhone = "+60 12-987 6543 (Father)";
    let currentPasswordHash = "";
    let currentResetToken = "";
    let currentResetExpiry = "";
    let currentPrescriptions: any[] = [];
    let currentAttachments: any[] = [];
    let currentLanguage = "English";
    let currentDefaultRegion = "Penang Island";
    let currentEmailAlerts = true;
    let currentSmsAlerts = true;
    let currentInAppAlerts = true;
    let currentNotifications: any[] = [];

    try {
      const existing = await getPatientProfileByEmail(email);
      if (existing) {
        currentNationality = existing.nationality || "";
        currentContactName = existing.emergencyContactName || "Razali Bin Ahmad";
        currentContactPhone = existing.emergencyContactPhone || "+60 12-987 6543 (Father)";
        currentPasswordHash = existing.passwordHash || "";
        currentResetToken = existing.resetToken || "";
        currentResetExpiry = existing.resetExpiry || "";
        currentPrescriptions = existing.prescriptions || [];
        currentAttachments = existing.attachments || [];
        currentLanguage = existing.language || "English";
        currentDefaultRegion = existing.defaultRegion || "Penang Island";
        currentEmailAlerts = existing.emailAlerts !== false;
        currentSmsAlerts = existing.smsAlerts !== false;
        currentInAppAlerts = existing.inAppAlerts !== false;
        currentNotifications = existing.notifications || [];
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
    const nextPrescriptions = updates.prescriptions !== undefined ? updates.prescriptions : currentPrescriptions;
    const nextAttachments = updates.attachments !== undefined ? updates.attachments : currentAttachments;
    const nextLanguage = updates.language !== undefined ? updates.language : currentLanguage;
    const nextDefaultRegion = updates.defaultRegion !== undefined ? updates.defaultRegion : currentDefaultRegion;
    const nextEmailAlerts = updates.emailAlerts !== undefined ? updates.emailAlerts : currentEmailAlerts;
    const nextSmsAlerts = updates.smsAlerts !== undefined ? updates.smsAlerts : currentSmsAlerts;
    const nextInAppAlerts = updates.inAppAlerts !== undefined ? updates.inAppAlerts : currentInAppAlerts;
    const nextNotifications = updates.notifications !== undefined ? updates.notifications : currentNotifications;

    dbRow.nationality = JSON.stringify({
      nationality: nextNationality,
      emergencyContactName: nextContactName,
      emergencyContactPhone: nextContactPhone,
      passwordHash: nextPasswordHash,
      resetToken: nextResetToken,
      resetExpiry: nextResetExpiry,
      prescriptions: nextPrescriptions,
      attachments: nextAttachments,
      language: nextLanguage,
      defaultRegion: nextDefaultRegion,
      emailAlerts: nextEmailAlerts,
      smsAlerts: nextSmsAlerts,
      inAppAlerts: nextInAppAlerts,
      notifications: nextNotifications
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

export async function getAppointments(patientId?: string) {
  let query = supabaseAdmin
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (patientId) query = query.eq('patient_id', patientId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAppointment);
}

export async function addAppointment(apt: any) {
  let symptoms = apt.symptoms || apt.remarks || '';
  const clinic = apt.clinic || apt.hospital || '';
  if (clinic) {
    symptoms = JSON.stringify({
      symptoms: symptoms,
      clinic: clinic
    });
  }

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
  if (apt.patientId) dbRow.patient_id = apt.patientId;

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
  
  if (updates.symptoms !== undefined || updates.remarks !== undefined || updates.clinic !== undefined) {
    let existingSymptoms = '';
    let existingClinic = '';
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
        } else {
          existingSymptoms = sym;
        }
      }
    } catch (e) {
      // ignore
    }
    const nextSymptoms = updates.symptoms !== undefined ? updates.symptoms : (updates.remarks !== undefined ? updates.remarks : existingSymptoms);
    const nextClinic = updates.clinic !== undefined ? updates.clinic : existingClinic;
    
    if (nextClinic) {
      dbRow.symptoms = JSON.stringify({
        symptoms: nextSymptoms,
        clinic: nextClinic
      });
    } else {
      dbRow.symptoms = nextSymptoms;
    }
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
    hospital: "Pantai Hospital Penang"
  },
  {
    id: "doc-simon-lo",
    name: "Dr. Simon Lo",
    specialty: "Coronary Angioplasty & Pacemakers",
    rating: 4.9,
    reviewsCount: 289,
    image: "https://ui-avatars.com/api/?name=Dr.+Simon+Lo&background=0d9488&color=fff",
    availability: "Tue, Thu — 10:00 AM to 3:00 PM",
    hospital: "Gleneagles Hospital Penang"
  },
  {
    id: "doc-tan-seng-hock",
    name: "Dr. Tan Seng Hock",
    specialty: "Heart Valve Disease & Arrhythmias",
    rating: 4.9,
    reviewsCount: 142,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Seng+Hock&background=0d9488&color=fff",
    availability: "Mon, Tue, Thu — 9:00 AM to 4:00 PM",
    hospital: "Island Hospital"
  },
  {
    id: "doc-lim-boon-yee",
    name: "Dr. Lim Boon Yee",
    specialty: "Heart Failure & Electro-physiology",
    rating: 4.8,
    reviewsCount: 125,
    image: "https://ui-avatars.com/api/?name=Dr.+Lim+Boon+Yee&background=0d9488&color=fff",
    availability: "Mon, Wed — 9:00 AM to 4:00 PM",
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-ramesh-kumar",
    name: "Dr. Ramesh Kumar",
    specialty: "Hypertensive Heart & Preventive Care",
    rating: 4.7,
    reviewsCount: 94,
    image: "https://ui-avatars.com/api/?name=Dr.+Ramesh+Kumar&background=0d9488&color=fff",
    availability: "Tue, Thu — 8:30 AM to 4:30 PM",
    hospital: "Hospital Seberang Jaya"
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
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-chow-ting-soo",
    name: "Dr. Chow Ting Soo",
    specialty: "Epidemiology & Viral Containment",
    rating: 4.8,
    reviewsCount: 178,
    image: "https://ui-avatars.com/api/?name=Dr.+Chow+Ting+Soo&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 8:00 AM to 1:00 PM",
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-nur-farah-hana",
    name: "Dr. Nur Farah Hana",
    specialty: "Endocrinology & Acute Fevers",
    rating: 4.8,
    reviewsCount: 115,
    image: "https://ui-avatars.com/api/?name=Dr.+Nur+Farah+Hana&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Hospital Seberang Jaya"
  },
  {
    id: "doc-alan-wong",
    name: "Dr. Alan Wong",
    specialty: "Infectious Diseases & Travel Health",
    rating: 4.9,
    reviewsCount: 136,
    image: "https://ui-avatars.com/api/?name=Dr.+Alan+Wong&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 3:00 PM",
    hospital: "Pantai Hospital Penang"
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
    hospital: "Hospital Seberang Jaya"
  },
  {
    id: "doc-priscilla-ooi",
    name: "Dr. Priscilla Ooi Sze Kee",
    specialty: "Infantile Allergies & Paediatric Nutrition",
    rating: 4.8,
    reviewsCount: 196,
    image: "https://ui-avatars.com/api/?name=Dr.+Priscilla+Ooi&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 9:00 AM to 2:00 PM",
    hospital: "Island Hospital"
  },
  {
    id: "doc-wong-lai-kuan",
    name: "Dr. Wong Lai Kuan",
    specialty: "Child Development & Immunisation",
    rating: 4.8,
    reviewsCount: 98,
    image: "https://ui-avatars.com/api/?name=Dr.+Wong+Lai+Kuan&background=0d9488&color=fff",
    availability: "Wed, Fri — 9:00 AM to 1:00 PM",
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-chew-wei-lik",
    name: "Dr. Chew Wei Lik",
    specialty: "Asthma & Respiratory Triage",
    rating: 4.7,
    reviewsCount: 87,
    image: "https://ui-avatars.com/api/?name=Dr.+Chew+Wei+Lik&background=0d9488&color=fff",
    availability: "Mon, Tue, Thu — 8:30 AM to 4:30 PM",
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-melissa-lim",
    name: "Dr. Melissa Lim",
    specialty: "Neonatal Intensive Care & Development",
    rating: 4.9,
    reviewsCount: 154,
    image: "https://ui-avatars.com/api/?name=Dr.+Melissa+Lim&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 4:00 PM",
    hospital: "Gleneagles Hospital Penang"
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
    hospital: "Hospital Seberang Jaya"
  },
  {
    id: "doc-tan-chee-khuan",
    name: "Dr. Tan Chee Khuan",
    specialty: "Minimally Invasive Surgery",
    rating: 4.9,
    reviewsCount: 241,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Chee+Khuan&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 2:00 PM",
    hospital: "Hospital Lam Wah Ee"
  },
  {
    id: "doc-raymond-chew",
    name: "Dr. Raymond Chew",
    specialty: "Laparoscopic & Hernia Surgery",
    rating: 4.9,
    reviewsCount: 95,
    image: "https://ui-avatars.com/api/?name=Dr.+Raymond+Chew&background=0d9488&color=fff",
    availability: "Mon, Wed — 9:00 AM to 4:00 PM",
    hospital: "Gleneagles Hospital Penang"
  },
  {
    id: "doc-hanafiah-harun",
    name: "Dr. Hanafiah Harun",
    specialty: "Trauma & Hepatobiliary Surgery",
    rating: 4.8,
    reviewsCount: 182,
    image: "https://ui-avatars.com/api/?name=Dr.+Hanafiah+Harun&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-ong-keat-jin",
    name: "Dr. Ong Keat Jin",
    specialty: "Colorectal Surgery & Endoscopy",
    rating: 4.9,
    reviewsCount: 121,
    image: "https://ui-avatars.com/api/?name=Dr.+Ong+Keat+Jin&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 3:00 PM",
    hospital: "Pantai Hospital Penang"
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
    hospital: "Pantai Hospital Penang"
  },
  {
    id: "doc-susan-lim",
    name: "Dr. Susan Lim",
    specialty: "Knee & Hip Reconstruction",
    rating: 4.8,
    reviewsCount: 88,
    image: "https://ui-avatars.com/api/?name=Dr.+Susan+Lim&background=0d9488&color=fff",
    availability: "Mon, Wed, Fri — 10:00 AM to 4:00 PM",
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-zulkarnean",
    name: "Dr. Zulkarnean",
    specialty: "Trauma & Fracture Fixation",
    rating: 4.7,
    reviewsCount: 105,
    image: "https://ui-avatars.com/api/?name=Dr.+Zulkarnean&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 5:00 PM",
    hospital: "Hospital Seberang Jaya"
  },
  {
    id: "doc-terence-oak",
    name: "Dr. Terence Oak",
    specialty: "Arthroscopy & Ligament Reconstruction",
    rating: 4.9,
    reviewsCount: 147,
    image: "https://ui-avatars.com/api/?name=Dr.+Terence+Oak&background=0d9488&color=fff",
    availability: "Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Island Hospital"
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
    hospital: "Gleneagles Hospital Penang"
  },
  {
    id: "doc-lee-hock-heng",
    name: "Dr. Lee Hock Heng",
    specialty: "Stroke & Epilepsy Management",
    rating: 4.9,
    reviewsCount: 112,
    image: "https://ui-avatars.com/api/?name=Dr.+Lee+Hock+Heng&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 4:30 PM",
    hospital: "Hospital Seberang Jaya"
  },
  {
    id: "doc-faridah-kamal",
    name: "Dr. Faridah Kamal",
    specialty: "Parkinson & Degenerative Disorders",
    rating: 4.8,
    reviewsCount: 136,
    image: "https://ui-avatars.com/api/?name=Dr.+Faridah+Kamal&background=0d9488&color=fff",
    availability: "Mon, Wed — 8:30 AM to 4:00 PM",
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-tan-kay-seng",
    name: "Dr. Tan Kay Seng",
    specialty: "Neuromuscular & Sleep Diagnostics",
    rating: 4.8,
    reviewsCount: 94,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Kay+Seng&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 3:00 PM",
    hospital: "Hospital Lam Wah Ee"
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
    hospital: "Island Hospital"
  },
  {
    id: "doc-ng-cheok-man",
    name: "Dr. Ng Cheok Man",
    specialty: "Renal Stone Extraction & Urology",
    rating: 4.8,
    reviewsCount: 208,
    image: "https://ui-avatars.com/api/?name=Dr.+Ng+Cheok+Man&background=0d9488&color=fff",
    availability: "Tue, Thu — 8:00 AM to 1:00 PM",
    hospital: "Hospital Lam Wah Ee"
  },
  {
    id: "doc-rosli-md-ali",
    name: "Dr. Rosli Md Ali",
    specialty: "Renal Calculi & Prostate Health",
    rating: 4.8,
    reviewsCount: 154,
    image: "https://ui-avatars.com/api/?name=Dr.+Rosli+Md+Ali&background=0d9488&color=fff",
    availability: "Mon, Wed — 9:00 AM to 4:30 PM",
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-jeffrey-tan",
    name: "Dr. Jeffrey Tan",
    specialty: "GERD & Colorectal Screening",
    rating: 4.9,
    reviewsCount: 112,
    image: "https://ui-avatars.com/api/?name=Dr.+Jeffrey+Tan&background=0d9488&color=fff",
    availability: "Tue, Thu — 9:00 AM to 4:00 PM",
    hospital: "Pantai Hospital Penang"
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
    hospital: "Klinik Kesihatan Jalan Perak"
  },
  {
    id: "doc-noraini-ahmad",
    name: "Dr. Noraini Ahmad",
    specialty: "Prenatal Care & Child Vaccination",
    rating: 4.9,
    reviewsCount: 341,
    image: "https://ui-avatars.com/api/?name=Dr.+Noraini+Ahmad&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Klinik Kesihatan Jalan Perak"
  },
  {
    id: "doc-farah-alwani",
    name: "Dr. Farah Alwani",
    specialty: "Community & Childhood Health",
    rating: 4.7,
    reviewsCount: 132,
    image: "https://ui-avatars.com/api/?name=Dr.+Farah+Alwani&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:30 PM",
    hospital: "Poliklinik Perdana"
  },
  {
    id: "doc-tan-aik-kah",
    name: "Dr. Tan Aik Kah",
    specialty: "Outpatient Triage & Primary Care",
    rating: 4.8,
    reviewsCount: 142,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Aik+Kah&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-nor-aziah",
    name: "Dr. Nor Aziah",
    specialty: "Family Health & Triage",
    rating: 4.7,
    reviewsCount: 121,
    image: "https://ui-avatars.com/api/?name=Dr.+Nor+Aziah&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Hospital Seberang Jaya"
  },
  {
    id: "doc-mohd-razali",
    name: "Dr. Mohd Razali",
    specialty: "Outpatient Medical Care & Triage",
    rating: 4.7,
    reviewsCount: 154,
    image: "https://ui-avatars.com/api/?name=Dr.+Mohd+Razali&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Hospital Bukit Mertajam"
  },
  {
    id: "doc-nurul-huda",
    name: "Dr. Nurul Huda",
    specialty: "Diabetes & Non-Communicable Diseases",
    rating: 4.8,
    reviewsCount: 312,
    image: "https://ui-avatars.com/api/?name=Dr.+Nurul+Huda&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Klinik Kesihatan Bayan Baru"
  },
  {
    id: "doc-tan-wei-shen",
    name: "Dr. Tan Wei Shen",
    specialty: "Occupational & Acute Care",
    rating: 4.7,
    reviewsCount: 189,
    image: "https://ui-avatars.com/api/?name=Dr.+Tan+Wei+Shen&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:00 PM",
    hospital: "Klinik Kesihatan Bayan Baru"
  },
  {
    id: "doc-lee-shen-rong",
    name: "Dr. Lee Shen Rong",
    specialty: "Family Medicine & Prescriptions",
    rating: 4.7,
    reviewsCount: 201,
    image: "https://ui-avatars.com/api/?name=Dr.+Lee+Shen+Rong&background=0d9488&color=fff",
    availability: "Mon–Sat — 8:00 AM to 6:00 PM",
    hospital: "Klinik Singapore"
  },
  {
    id: "doc-jane-lim",
    name: "Dr. Jane Lim",
    specialty: "Adolescent Health & Minor Procedures",
    rating: 4.7,
    reviewsCount: 154,
    image: "https://ui-avatars.com/api/?name=Dr.+Jane+Lim&background=0d9488&color=fff",
    availability: "Mon–Sat — 8:00 AM to 6:00 PM",
    hospital: "Klinik Singapore"
  },
  {
    id: "doc-sarah-lim",
    name: "Dr. Sarah Lim",
    specialty: "Skin Disorders & General Wellness",
    rating: 4.8,
    reviewsCount: 217,
    image: "https://ui-avatars.com/api/?name=Dr.+Sarah+Lim&background=0d9488&color=fff",
    availability: "Mon–Sat — 8:30 AM to 9:00 PM",
    hospital: "O2 Klinik"
  },
  {
    id: "doc-benjamin-koay",
    name: "Dr. Benjamin Koay",
    specialty: "Preventive Health & Elderly Care",
    rating: 4.8,
    reviewsCount: 198,
    image: "https://ui-avatars.com/api/?name=Dr.+Benjamin+Koay&background=0d9488&color=fff",
    availability: "Mon–Sat — 8:30 AM to 9:00 PM",
    hospital: "O2 Klinik"
  },
  {
    id: "doc-michael-tan",
    name: "Dr. Michael Tan",
    specialty: "Corporate Medicals & Industrial Health",
    rating: 4.8,
    reviewsCount: 176,
    image: "https://ui-avatars.com/api/?name=Dr.+Michael+Tan&background=0d9488&color=fff",
    availability: "Mon–Fri — 8:00 AM to 5:30 PM",
    hospital: "Poliklinik Perdana"
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
    hospital: "Hospital Pulau Pinang"
  },
  {
    id: "doc-sarah-mitchell",
    name: "Dr. Sarah Mitchell",
    specialty: "Emergency & Critical Triage",
    rating: 4.9,
    reviewsCount: 142,
    image: "https://ui-avatars.com/api/?name=Dr.+Sarah+Mitchell&background=0d9488&color=fff",
    availability: "24/7 Shift Rotation — Call Hospital",
    hospital: "Hospital Seberang Jaya"
  },
  {
    id: "doc-kelvin-tan",
    name: "Dr. Kelvin Tan",
    specialty: "Emergency & Resuscitation Care",
    rating: 4.8,
    reviewsCount: 96,
    image: "https://ui-avatars.com/api/?name=Dr.+Kelvin+Tan&background=0d9488&color=fff",
    availability: "24/7 Shift Rotation — Call Hospital",
    hospital: "Pantai Hospital Penang"
  }
];

export async function getClinicians() {
  return staticClinicians;
}

// ============================================================
// FACILITIES
// ============================================================

export async function getFacilities() {
  const { data, error } = await supabaseAdmin.from('facilities').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapFacility);
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

