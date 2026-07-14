/**
 * server.ts — CarePoint Patient Portal
 * Express API server + Vite dev middleware
 *
 * API Routes:
 *   POST   /api/auth/register
 *   POST   /api/auth/login
 *   GET    /api/auth/current
 *   GET    /api/profile
 *   POST   /api/profile
 *   GET    /api/vitals
 *   POST   /api/vitals
 *   GET    /api/appointments
 *   POST   /api/appointments
 *   PUT    /api/appointments/:id
 *   DELETE /api/appointments/:id
 *   GET    /api/messages
 *   POST   /api/messages
 *   GET    /api/reviews
 *   POST   /api/reviews
 *   GET    /api/clinicians
 *   GET    /api/facilities
 *   POST   /api/gemini/consult
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import * as db from "./db";
import { localConsult, triageSymptom, initClassifier, getLocalIntent } from "./local-ml";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================
// CORS headers (useful when frontend dev port differs)
// ============================================================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ============================================================
// AUTHENTICATION ENDPOINTS
// ============================================================


/**
 * POST /api/auth/register
 * Body: { email, password, fullName?, role? }
 * Creates a Supabase Auth user. Patient accounts also get a default profile.
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    const fallbackEmail = (name?: string) => {
      const base = (name || "guest")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.-]/g, "")
        .replace(/\.+/g, ".")
        .replace(/^\.|\.$/g, "") || "guest";
      const suffix = Date.now().toString().slice(-5);
      return `${base}-${suffix}@example.com`;
    };

    const emailToUse = (email || "").trim() || fallbackEmail(fullName);
    const displayName = fullName || emailToUse.split("@")[0];

    // 1. Create auth user via Supabase Auth
    const authData = await db.registerUser(emailToUse, password, {
      fullName: displayName,
      role: role || "Patient",
    });
    const authUser = authData.user;

    if (!authUser) {
      return res.status(400).json({ error: "Registration failed. Please try again." });
    }

    // 2. Create patient profile linked to auth user
    const defaultProfile = {
      fullName:              fullName || emailToUse.split("@")[0],
      myKadOrPassport:       "",
      dateOfBirth:           "",
      gender:                "",
      phone:                 "",
      nationality:           "Malaysian",
      bloodType:             "",
      allergies:             [],
      chronicConditions:     [],
      insuranceProvider:     "",
      insurancePolicyNumber: "",
      primaryPhysician:     "",
      avatarUrl:             `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || emailToUse)}&background=0d9488&color=fff`,
    };

    let profile = null;
    if ((role || "Patient") === "Patient") {
      profile = await db.updatePatientProfile(emailToUse, defaultProfile, authUser.id);
    }

    const { role: userRole, name: userName } = db.getAuthUserProfile(authUser);

    return res.status(201).json({
      success: true,
      user: {
        id:          authUser.id,
        email:       authUser.email,
        role:        userRole,
        name:        userName,
      },
      profile,
      accessToken: authData.session?.access_token ?? null,
    });
  } catch (error: any) {
    console.error("Register error:", error.message);
    return res.status(400).json({ error: error.message || "Registration failed." });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Authenticates via Supabase Auth and returns profile + token.
 *
 * RESILIENT: profile table errors never block a successful auth.
 * If Supabase triggers throw a "profiles" schema error, we suppress
 * it after confirming auth succeeded.
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Helper: is this a schema/table-not-found error (non-auth)?
    const isSchemaError = (msg: string) =>
      /profiles|schema cache|relation.*does not exist/i.test(msg);

    // 1. Authenticate with Supabase Auth
    let authData: any;
    try {
      authData = await db.loginUser(email, password);
    } catch (err: any) {
      const msg: string = err?.message ?? '';

      // If it's a schema error (Supabase trigger trying to hit public.profiles),
      // it may still have succeeded on the auth side — try fetching the session.
      if (isSchemaError(msg)) {
        console.warn("Login schema error (suppressed):", msg);
        return res.status(500).json({
          error:
            "Database configuration issue detected. Please run the SQL fix script at " +
            "supabase/migrations/002_fix_profiles_trigger.sql in your Supabase SQL editor, " +
            "then try again.",
        });
      }

      // Email not confirmed — try auto-confirm
      if (/confirm/i.test(msg) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const confirmed = await db.confirmUserEmail(email);
          if (confirmed) {
            authData = await db.loginUser(email, password);
          }
        } catch (e) {
          console.error("Auto-confirm failed:", e instanceof Error ? e.message : e);
          return res.status(401).json({ error: msg || "Authentication failed." });
        }
      } else {
        return res.status(401).json({ error: msg || "Authentication failed." });
      }
    }

    const authUser = authData?.user;
    if (!authUser) {
      return res.status(401).json({ error: "Authentication failed. Invalid credentials." });
    }

    const authProfile = db.getAuthUserProfile(authUser);
    const role = authProfile.role || "Patient";
    const name = authProfile.name;
    const approved = authProfile.approved;

    if ((role === "Doctor" || role === "Nurse") && !approved) {
      return res.status(403).json({ error: "Your account is pending administrator approval. Please contact support." });
    }

    // 2. Fetch / create patient profile — errors here are non-fatal
    let profile = null;
    if (role === "Patient") {
      try {
        profile = await db.getPatientProfileByEmail(email);
        if (!profile) {
          profile = await db.updatePatientProfile(
            email,
            {
              fullName: email.split("@")[0],
              nationality: "Malaysian",
              allergies: [],
              chronicConditions: [],
            },
            authUser.id
          );
        }
      } catch (profileErr: any) {
        console.warn("Profile fetch/create failed (non-fatal):", profileErr?.message);
      }
    }

    return res.json({
      user: { id: authUser.id, email: authUser.email, role, name, hospital: authProfile.hospital },
      profile,
      accessToken: authData?.session?.access_token ?? null,
    });
  } catch (error: any) {
    console.error("Login error:", error.message);
    return res.status(401).json({ error: error.message || "Authentication failed." });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const profile = await db.getPatientProfileByEmail(email);
    if (!profile) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    await db.updatePatientProfile(email, { resetToken, resetExpiry });

    const resetUrl = `${req.protocol}://${req.get("host")}/login?token=${resetToken}`;

    // Console logging fallback is ALWAYS active
    console.log(`\n======================================================`);
    console.log(`🔑  PASSWORD RESET REQUEST FOR: ${email}`);
    console.log(`🔗  RESET LINK: ${resetUrl}`);
    console.log(`======================================================\n`);

    // Attempt to send email via SMTP if configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.mailtrap.io",
          port: Number(process.env.SMTP_PORT) || 2525,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: '"CarePoint Health Support" <no-reply@carepoint.com>',
          to: email,
          subject: "CarePoint Patient Portal — Password Reset Request",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #0d9488;">CarePoint Password Reset</h2>
              <p>Hello,</p>
              <p>We received a request to reset the password associated with your CarePoint account. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #64748b; font-size: 12px;">This reset link will expire in 1 hour. If you did not make this request, you can safely ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #94a3b8; font-size: 10px;">CarePoint Clinic. Penang, Malaysia.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        return res.json({
          success: true,
          message: "A password reset link has been sent to your email address.",
        });
      } catch (mailError: any) {
        console.error("Nodemailer failed to send reset email:", mailError.message);
        // Fall back to console log message
      }
    }

    return res.json({
      success: true,
      message: "Password reset link generated. (Check server logs to complete your reset in dev mode).",
      resetUrl, // Expose resetUrl in response for easy dev sandbox access
    });
  } catch (error: any) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({ error: error.message || "Request failed." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    const profiles = await db.getPatientProfiles();
    const matched = profiles.find((p: any) => p.resetToken === token);

    if (!matched) {
      return res.status(400).json({ error: "Invalid or expired password reset token." });
    }

    const expiry = new Date(matched.resetExpiry || "");
    if (isNaN(expiry.getTime()) || expiry < new Date()) {
      return res.status(400).json({ error: "Password reset token has expired." });
    }

    // Hash the password with bcryptjs
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(newPassword, salt);

    // Save hash locally in profile nationality json and clear reset token
    await db.updatePatientProfile(matched.email, {
      passwordHash: hash,
      resetToken: "",
      resetExpiry: "",
    });

    // Sync the password to Supabase Auth using the Admin API
    if (matched.userId) {
      try {
        const { error: authError } = await db.supabaseAdmin.auth.admin.updateUserById(matched.userId, {
          password: newPassword,
        });
        if (authError) {
          console.warn("Failed to sync new password to Supabase Auth:", authError.message);
        } else {
          console.log(`✅  Synced updated password for ${matched.email} to Supabase Auth`);
        }
      } catch (syncErr: any) {
        console.warn("Auth sync error (non-fatal):", syncErr.message);
      }
    }

    return res.json({
      success: true,
      message: "Your password has been successfully reset. You may now log in.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({ error: error.message || "Reset failed." });
  }
});

app.post("/api/auth/change-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required." });
    }

    const matched = await db.getPatientProfileByEmail(email);
    if (!matched) {
      return res.status(404).json({ error: "Profile not found." });
    }

    // Hash the password with bcryptjs
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(newPassword, salt);

    // Save hash locally in profile nationality json
    await db.updatePatientProfile(email, {
      passwordHash: hash,
    });

    // Sync the password to Supabase Auth using the Admin API
    if (matched.userId) {
      try {
        const { error: authError } = await db.supabaseAdmin.auth.admin.updateUserById(matched.userId, {
          password: newPassword,
        });
        if (authError) {
          console.warn("Failed to sync new password to Supabase Auth:", authError.message);
        } else {
          console.log(`✅  Synced changed password for ${email} to Supabase Auth`);
        }
      } catch (syncErr: any) {
        console.warn("Auth sync error (non-fatal):", syncErr.message);
      }
    }

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error: any) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ error: error.message || "Change failed." });
  }
});

app.post("/api/ml/triage", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Symptom query is required." });
    }

    const department = triageSymptom(query);
    const allDoctors = await db.getClinicians();

    // Filter doctors whose specialty matches the department
    const matchedDoctors = allDoctors.filter((doc: any) => {
      const docSpec = (doc.specialty || "").toLowerCase();
      const targetDept = department.toLowerCase();
      // Special handle: "Internal Medicine & Infectious Diseases" or "General Practice & Family Medicine"
      // we check for partial or full match.
      return docSpec.includes(targetDept) || targetDept.includes(docSpec) ||
             (targetDept.includes("infectious") && docSpec.includes("infectious")) ||
             (targetDept.includes("general practice") && docSpec.includes("general practitioner")) ||
             (targetDept.includes("pediatrics") && docSpec.includes("paediatric"));
    });

    return res.json({
      department,
      doctors: matchedDoctors,
    });
  } catch (error: any) {
    console.error("Triage endpoint error:", error.message);
    return res.status(500).json({ error: error.message || "Triage processing failed." });
  }
});

/**
 * GET /api/auth/current?email=...
 * Quick session check — returns profile if found.
 */
app.get("/api/auth/current", async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email query parameter is required." });

    const profile = await db.getPatientProfileByEmail(email);
    if (!profile) return res.status(404).json({ error: "User not found." });

    return res.json({ user: { email, role: "Patient" }, profile });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/staff/requests
 * Body: { email, fullName, role, password }
 * Creates a pending staff registration request in Supabase with approved = false.
 */
app.post("/api/staff/requests", async (req, res) => {
  try {
    const { email, fullName, role, password, hospital } = req.body;
    if (!email || !fullName || !role || !password) {
      return res.status(400).json({ error: "email, fullName, role, and password are required." });
    }

    // Register user in Supabase with approved = false
    await db.registerUser(email, password, {
      fullName,
      role,
      approved: false,
      hospital: hospital || "",
    });

    return res.status(201).json({ success: true, message: "Staff registration request submitted successfully." });
  } catch (error: any) {
    if (error.message.includes("already exists") || error.message.includes("already registered")) {
      return res.status(409).json({ error: "An account with this email already exists or is pending approval." });
    }
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/staff-requests
 * Returns pending staff registration requests from database.
 */
app.get("/api/admin/staff-requests", async (_req, res) => {
  try {
    const users = await db.listAllAuthUsers();
    const pending = users
      .filter((u: any) => {
        const meta = u.user_metadata || {};
        const role = meta.role || 'Patient';
        const approved = meta.approved;
        return (role === 'Doctor' || role === 'Nurse') && approved === false;
      })
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        fullName: u.user_metadata?.full_name || u.email.split('@')[0],
        role: u.user_metadata?.role || 'Doctor',
        requestedAt: u.created_at || new Date().toISOString(),
      }));
    return res.json(pending);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/staff-requests/:id/approve
 * Approves a pending staff registration request.
 */
app.post("/api/admin/staff-requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const authUsers = await db.listAllAuthUsers();
    const user = authUsers.find((u: any) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const existingMeta = user.user_metadata || {};
    const updatedUser = await db.updateAuthUser(id, {
      user_metadata: {
        ...existingMeta,
        approved: true
      }
    });
    return res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Staff approval error:", error.message);
    return res.status(500).json({ error: error.message || "Approval failed." });
  }
});

/**
 * POST /api/admin/staff-requests/:id/reject
 * Rejects staff registration request by deleting the auth user.
 */
app.post("/api/admin/staff-requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteAuthUser(id);
    return res.json({ success: true, message: "Pending staff registration rejected and removed." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PATIENT PROFILE ENDPOINTS
// ============================================================

/**
 * GET /api/profile?email=...
 * Returns the patient profile for the given email.
 * Auto-creates a default profile on first fetch.
 */
app.get("/api/profile", async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email query parameter is required." });

    let profile = await db.getPatientProfileByEmail(email);
    if (!profile) {
      profile = await db.updatePatientProfile(email, {
        fullName:          email.split("@")[0],
        nationality:       "Malaysian",
        allergies:         [],
        chronicConditions: [],
      });
    }

    return res.json(profile);
  } catch (error: any) {
    console.error("GET /api/profile error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/profile
 * Body: { email, ...profileFields }
 * Upserts the patient profile.
 */
app.post("/api/profile", async (req, res) => {
  try {
    const { email, ...updates } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const updated = await db.updatePatientProfile(email, updates);
    return res.json(updated);
  } catch (error: any) {
    console.error("POST /api/profile error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// STAFF APP PATIENTS & PRESCRIPTIONS PORTAL GATEWAYS
// ============================================================

/**
 * GET /api/patients
 * Returns all patients mapped to the staff dashboard interface.
 */
app.get("/api/patients", async (req, res) => {
  try {
    const profiles = await db.getPatientProfiles();
    const mappedPatients = profiles.map((p: any) => {
      const condition = (p.chronicConditions && p.chronicConditions.length > 0) 
        ? p.chronicConditions.filter((c: string) => c !== "None").join(", ") || "General Checking"
        : "General Checking";
        
      return {
        id: p.email, // Use email as the stable ID for the staff app lookup
        dbId: p.id,
        name: p.fullName || p.email.split("@")[0],
        dob: p.dateOfBirth || "1994-08-22",
        gender: p.gender || "Male",
        phone: p.phone || "+60 12-345 6789",
        email: p.email,
        avatar: p.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
        history: p.chronicConditions || ["None"],
        prescriptions: p.prescriptions || [],
        attachments: p.attachments || [],
        bloodType: p.bloodType || 'O+',
        allergies: p.allergies || [],
        chronicConditions: p.chronicConditions || [],
        lastVisited: new Date().toISOString().substring(0, 10),
        condition: condition
      };
    });
    return res.json(mappedPatients);
  } catch (error: any) {
    console.error("GET /api/patients error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PROVIDER SHIFTS & SCHEDULES SYSTEM
// ============================================================

const SCHEDULES_FILE = path.join(process.cwd(), "provider_schedules.json");

function loadSchedules() {
  try {
    if (fs.existsSync(SCHEDULES_FILE)) {
      const raw = fs.readFileSync(SCHEDULES_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to read provider schedules file:", err);
  }
  return {};
}

function saveSchedules(schedules: any) {
  try {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write provider schedules file:", err);
  }
}

/**
 * GET /api/provider/schedule?doctorName=...
 */
app.get("/api/provider/schedule", (req, res) => {
  try {
    const doctorName = req.query.doctorName as string;
    if (!doctorName) {
      return res.status(400).json({ error: "doctorName query parameter is required." });
    }
    const schedules = loadSchedules();
    const docSchedule = schedules[doctorName] || {
      doctorName,
      shifts: {
        Monday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
        Tuesday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
        Wednesday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
        Thursday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
        Friday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
        Saturday: { start: "09:00 AM", end: "01:00 PM", enabled: false },
        Sunday: { start: "09:00 AM", end: "01:00 PM", enabled: false },
      },
      blockedDates: [],
      breaks: ["12:00 PM", "12:30 PM", "01:00 PM"]
    };
    return res.json(docSchedule);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/provider/schedule
 */
app.post("/api/provider/schedule", (req, res) => {
  try {
    const schedule = req.body;
    const { doctorName } = schedule;
    if (!doctorName) {
      return res.status(400).json({ error: "doctorName is required inside body." });
    }
    const schedules = loadSchedules();
    schedules[doctorName] = schedule;
    saveSchedules(schedules);
    return res.json({ success: true, schedule });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SYSTEM LOGS AUDITING FOR QUEUE lobby arrivals
// ============================================================

/**
 * GET /api/logs
 */
app.get("/api/logs", async (req, res) => {
  try {
    const logsList = await db.getSystemLogs();
    return res.json(logsList);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// EHR DOCUMENTS ATTACHMENTS
// ============================================================

/**
 * POST /api/patients/:patientId/attachments
 */
app.post("/api/patients/:patientId/attachments", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, size, type, data } = req.body;
    console.log("📥 [EHR Ingress API] POST attachment - Name:", name, "Size:", size, "Data length:", data ? data.length : "null/undefined");

    if (!name || !size || !type) {
      return res.status(400).json({ error: "name, size, and type are required." });
    }

    const matched = await db.getPatientProfileByEmail(patientId);
    if (!matched) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const newAttachment = {
      id: "att-" + Date.now(),
      name,
      size,
      type,
      uploadedAt: new Date().toISOString().substring(0, 10),
      clinic: req.body.clinic || null,
      data: data || null
    };

    const currentAttachments = matched.attachments || [];
    const updatedAttachments = [newAttachment, ...currentAttachments];

    await db.updatePatientProfile(matched.email, {
      attachments: updatedAttachments
    });

    return res.status(201).json(newAttachment);
  } catch (error: any) {
    console.error("POST attachment error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/patients/:patientId/attachments/:attachmentId
 */
app.delete("/api/patients/:patientId/attachments/:attachmentId", async (req, res) => {
  try {
    const { patientId, attachmentId } = req.params;

    const matched = await db.getPatientProfileByEmail(patientId);
    if (!matched) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const currentAttachments = matched.attachments || [];
    const updatedAttachments = currentAttachments.filter((att: any) => att.id !== attachmentId);

    await db.updatePatientProfile(matched.email, {
      attachments: updatedAttachments
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE attachment error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/patients/:patientId/prescriptions
 * Adds a new prescription to the patient. Can accept a single prescription object or an array.
 */
app.post("/api/patients/:patientId/prescriptions", async (req, res) => {
  try {
    const { patientId } = req.params;
    const matched = await db.getPatientProfileByEmail(patientId);
    if (!matched) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const currentRx = matched.prescriptions || [];
    let newPrescriptionsList: any[] = [];

    if (Array.isArray(req.body)) {
      newPrescriptionsList = req.body.map((item: any, idx: number) => ({
        id: "rx-" + (Date.now() + idx),
        drugName: item.drugName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        prescribedBy: item.prescribedBy || "Dr. Sarah Jenkins",
        date: item.date || new Date().toISOString().substring(0, 10),
        foodTiming: item.foodTiming,
        instructions: item.instructions,
        scheduledTimes: item.scheduledTimes
      }));
    } else {
      const { drugName, dosage, frequency, duration, prescribedBy, date, foodTiming, instructions, scheduledTimes } = req.body;
      newPrescriptionsList = [{
        id: "rx-" + Date.now(),
        drugName,
        dosage,
        frequency,
        duration,
        prescribedBy: prescribedBy || "Dr. Sarah Jenkins",
        date: date || new Date().toISOString().substring(0, 10),
        foodTiming,
        instructions,
        scheduledTimes
      }];
    }

    const updatedRx = [...newPrescriptionsList, ...currentRx];

    await db.updatePatientProfile(matched.email, {
      prescriptions: updatedRx
    });

    return res.json(Array.isArray(req.body) ? newPrescriptionsList : newPrescriptionsList[0]);
  } catch (error: any) {
    console.error("POST prescription error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/patients/:patientId/prescriptions/:prescriptionId
 * Removes a prescription from the patient.
 */
app.delete("/api/patients/:patientId/prescriptions/:prescriptionId", async (req, res) => {
  try {
    const { patientId, prescriptionId } = req.params;

    const matched = await db.getPatientProfileByEmail(patientId);
    if (!matched) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const currentRx = matched.prescriptions || [];
    const updatedRx = currentRx.filter((rx: any) => rx.id !== prescriptionId);

    await db.updatePatientProfile(matched.email, {
      prescriptions: updatedRx
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE prescription error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// VITAL SIGNS ENDPOINTS
// ============================================================

/**
 * GET /api/vitals?patientId=...
 */
app.get("/api/vitals", async (req, res) => {
  try {
    const patientId = req.query.patientId as string;
    if (!patientId) return res.status(400).json({ error: "patientId is required." });

    const list = await db.getVitals(patientId);
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vitals
 * Body: { patientId, heartRate, bloodPressureSys, ... }
 */
app.post("/api/vitals", async (req, res) => {
  try {
    const vital = req.body;
    if (!vital.patientId) return res.status(400).json({ error: "patientId is required." });

    const created = await db.addVital(vital);

    // Look up patient name to make log readable
    const profile = await db.getPatientProfileById(vital.patientId).catch(() => null);
    const patientName = profile ? profile.fullName : "Outpatient";

    // Check abnormal vitals
    const sys = Number(vital.bloodPressureSys || 0);
    const dia = Number(vital.bloodPressureDia || 0);
    const hr = Number(vital.heartRate || 0);
    const spo2 = Number(vital.oxygenSaturation || 0);
    const temp = Number(vital.temperature || 0);

    const isAbnormal = 
      (sys > 140 || sys < 90 && sys > 0) || 
      (dia > 90 || dia < 60 && dia > 0) || 
      (hr > 100 || hr < 60 && hr > 0) || 
      (spo2 > 0 && spo2 < 95) || 
      (temp > 0 && (temp > 37.8 || temp < 35.5));

    if (isAbnormal) {
      await db.addSystemLog({
        message: `CRITICAL ALARM: Vitals Alert for ${patientName}. BP: ${sys}/${dia} mmHg, HR: ${hr} bpm, SpO2: ${spo2}%, Temp: ${temp}°C`,
        level: "error"
      });
    }

    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/vitals/:id
 * Body: { heartRate, bloodPressureSys, bloodPressureDia, temperature, weight, oxygenSaturation, timestamp }
 */
app.put("/api/vitals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const vital = req.body;
    const updated = await db.updateVital(id, vital);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});


// ============================================================
// APPOINTMENTS ENDPOINTS
// ============================================================

/**
 * GET /api/appointments?patientId=...
 */
app.get("/api/appointments", async (req, res) => {
  try {
    const patientId = req.query.patientId as string | undefined;
    const list = await db.getAppointments(patientId);
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

async function sendBookingConfirmationEmail(email: string, appointment: any) {
  // Console logging fallback is ALWAYS active
  console.log(`\n======================================================`);
  console.log(`📧  APPOINTMENT CONFIRMATION EMAIL FOR: ${email}`);
  console.log(`🏥  Facility:  ${appointment.clinic || "General Clinic"}`);
  console.log(`👨‍⚕️  Doctor:    ${appointment.doctorName} (${appointment.specialty})`);
  console.log(`📅  Date:      ${appointment.date}`);
  console.log(`🕒  Time:      ${appointment.timeSlot}`);
  console.log(`💬  Symptoms:  ${appointment.symptoms || "General Checkup"}`);
  console.log(`======================================================\n`);

  // Attempt to send email via SMTP if configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.mailtrap.io",
        port: Number(process.env.SMTP_PORT) || 2525,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: '"CarePoint Health Services" <no-reply@carepoint.com>',
        to: email,
        subject: `Appointment Confirmed — CarePoint Patient Portal`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #0d9488;">Appointment Confirmation</h2>
            <p>Hello,</p>
            <p>Your appointment has been successfully scheduled. Here are the confirmation details:</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 35%;"><strong>Facility:</strong></td>
                  <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${appointment.clinic || "General Clinic"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 14px;"><strong>Doctor:</strong></td>
                  <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${appointment.doctorName} (${appointment.specialty})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 14px;"><strong>Date:</strong></td>
                  <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${appointment.date}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 14px;"><strong>Time Slot:</strong></td>
                  <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-family: monospace; font-weight: bold;">${appointment.timeSlot}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 14px; vertical-align: top;"><strong>Reason for Visit:</strong></td>
                  <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${appointment.symptoms || "General Triage"}</td>
                </tr>
              </table>
            </div>

            <p style="color: #64748b; font-size: 13px;">Please arrive 10 minutes prior to your slot for reception check-in. If you need to modify or reschedule your booking, please log into your CarePoint Patient Portal account.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 10px;">CarePoint Clinic. Penang, Malaysia.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅  Booking confirmation email sent to ${email}`);
    } catch (mailError: any) {
      console.error("Nodemailer failed to send booking confirmation email:", mailError.message);
    }
  }
}

async function notifyPatientAndStaff(
  patientId: string,
  patientNotif: { title: string; message: string; },
  staffMessage: string
) {
  try {
    // 1. Patient Notification
    const patient = await db.getPatientProfileById(patientId);
    if (patient && patient.email) {
      const patientEmail = patient.email;
      const existingNotifs = patient.notifications || [];
      const newNotif = {
        id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        title: patientNotif.title,
        body: patientNotif.message,
        message: patientNotif.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        read: false
      };
      await db.updatePatientProfile(patientEmail, {
        notifications: [newNotif, ...existingNotifs]
      });
    }

    // 2. Staff Broadcast Log
    await db.addSystemLog({
      message: `[Broadcast]: (All Staff) [📢 HEALTH NOTICE] ${staffMessage}`,
      level: "info"
    });
  } catch (err: any) {
    console.error("Error in notifyPatientAndStaff:", err.message);
  }
}

/**
 * POST /api/appointments
 * Body: appointment object (camelCase)
 */
app.post("/api/appointments", async (req, res) => {
  try {
    const apt = req.body;
    const created = await db.addAppointment(apt);
    
    // Dispatch confirmation email
    const patientEmail = apt.patientEmail || apt.email;
    if (patientEmail) {
      sendBookingConfirmationEmail(patientEmail, created).catch(err => {
        console.error("Error in sendBookingConfirmationEmail async helper:", err);
      });

      // Send notifications to Patient and Staff
      const patient = await db.getPatientProfileByEmail(patientEmail);
      if (patient) {
        const patientName = patient.fullName || "Ahmad";
        notifyPatientAndStaff(
          patient.id,
          {
            title: "Booking Confirmed",
            message: `Booking confirmed, ${created.timeSlot} ${created.clinic}`
          },
          `New booking by ${patientName}: ${created.clinic} - ${created.doctorName || 'Specialist'} on ${created.date} at ${created.timeSlot}.`
        ).catch(err => console.error("Notification sync error:", err));
      }
    }

    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/appointments/:id
 * Body: partial appointment update (date, status, symptoms, etc.)
 */
app.put("/api/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await db.updateAppointment(id, updates);
    
    // Send notifications to Patient and Staff
    if (updated && updated.patientId) {
      const patient = await db.getPatientProfileById(updated.patientId);
      const patientName = patient?.fullName || "Ahmad";
      notifyPatientAndStaff(
        updated.patientId,
        {
          title: "Appointment Rescheduled",
          message: `Booking rescheduled, ${updated.timeSlot} ${updated.clinic}`
        },
        `Appointment Updated: Patient ${patientName} updated slot at ${updated.clinic} to ${updated.date} at ${updated.timeSlot} (${updated.status || 'Pending'}).`
      ).catch(err => console.error("Notification sync error:", err));
    }

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/appointments/:id
 */
app.delete("/api/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const apt = await db.getAppointmentById(id);
    const result = await db.deleteAppointment(id);
    
    // Send notifications to Patient and Staff
    if (apt && apt.patientId) {
      const patient = await db.getPatientProfileById(apt.patientId);
      const patientName = patient?.fullName || "Ahmad";
      notifyPatientAndStaff(
        apt.patientId,
        {
          title: "Appointment Cancelled",
          message: `Booking cancelled, ${apt.timeSlot} ${apt.clinic}`
        },
        `Appointment Cancelled: Patient ${patientName} cancelled their slot at ${apt.clinic} on ${apt.date} at ${apt.timeSlot}.`
      ).catch(err => console.error("Notification sync error:", err));
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// MESSAGES ENDPOINTS
// ============================================================

/**
 * GET /api/messages?threadId=...
 */
app.get("/api/messages", async (req, res) => {
  try {
    const threadId = req.query.threadId as string;
    if (!threadId) return res.status(400).json({ error: "threadId is required." });

    const list = await db.getMessages(threadId);
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/messages
 * Body: { threadId, sender, senderName, content, timestamp }
 */
app.post("/api/messages", async (req, res) => {
  try {
    const msg = req.body;
    if (!msg.threadId) {
      return res.status(400).json({ error: "threadId is required in body." });
    }
    const created = await db.addMessage(msg);
    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/messages/threads
 * Returns all active patient messaging threads dynamically.
 */
app.get("/api/messages/threads", async (req, res) => {
  try {
    const profiles = await db.getPatientProfiles();
    const threads = [];

    for (const p of profiles) {
      const threadId = `chat-${p.id}`;
      // Get messages for this thread
      const messages = await db.getMessages(threadId).catch(() => []);
      
      // Get latest vitals for clinical context
      const vitals = await db.getVitals(p.id).catch(() => []);
      const latestVital = vitals.length > 0 ? vitals[0] : null;

      // Extract details
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

      threads.push({
        id: threadId,
        patientId: p.id,
        senderName: p.fullName || p.email.split("@")[0],
        senderAvatar: p.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
        lastMessage: lastMsg ? lastMsg.content : "Secure workspace channels open. Click to start secure chat...",
        time: lastMsg ? lastMsg.timestamp : "N/A",
        unread: false,
        symptoms: p.chronicConditions || [],
        clinicalContext: latestVital ? {
          bp: `${latestVital.bloodPressureSys} / ${latestVital.bloodPressureDia} mmHg`,
          pulse: `${latestVital.heartRate} bpm`,
          temp: `${latestVital.temperature} °C`
        } : undefined,
        messages: messages.map((m: any) => ({
          ...m,
          text: m.content || m.text || '',
          sender: m.sender === 'user' ? 'patient' : m.sender
        }))
      });
    }

    // Sort threads so those with messages/activity are first
    threads.sort((a, b) => {
      if (a.time === "N/A" && b.time !== "N/A") return 1;
      if (a.time !== "N/A" && b.time === "N/A") return -1;
      return 0;
    });

    return res.json(threads);
  } catch (error: any) {
    console.error("GET /api/messages/threads error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/messages/threads/:threadId/messages
 */
app.get("/api/messages/threads/:threadId/messages", async (req, res) => {
  try {
    const { threadId } = req.params;
    const list = await db.getMessages(threadId);
    const mapped = list.map((m: any) => ({
      ...m,
      text: m.content || m.text || '',
      sender: m.sender === 'user' ? 'patient' : m.sender
    }));
    return res.json(mapped);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/messages/threads/:threadId/messages
 */
app.post("/api/messages/threads/:threadId/messages", async (req, res) => {
  try {
    const { threadId } = req.params;
    const { sender, senderName, text, timestamp } = req.body;

    const created = await db.addMessage({
      threadId,
      sender: sender || "doctor",
      senderName: senderName || "Clinician Staff",
      content: text,
      timestamp: timestamp || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    });
    
    const mapped = {
      ...created,
      text: created.content || '',
      sender: created.sender === 'user' ? 'patient' : created.sender
    };
    return res.status(201).json(mapped);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/messages/:id
 * Recalls/deletes a message by its ID.
 */
app.delete("/api/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteMessage(id);
    return res.json(result);
  } catch (error: any) {
    console.error("DELETE /api/messages/:id error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// REVIEWS ENDPOINTS
// ============================================================

/**
 * GET /api/reviews?doctorId=...
 */
app.get("/api/reviews", async (req, res) => {
  try {
    const doctorId = req.query.doctorId as string | undefined;
    const list = await db.getReviews(doctorId);
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reviews
 */
app.post("/api/reviews", async (req, res) => {
  try {
    const review = req.body;
    const created = await db.addReview(review);
    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// CLINICIANS ENDPOINTS
// ============================================================

/**
 * GET /api/clinicians
 * Returns all doctors in the system.
 */
app.get("/api/clinicians", async (req, res) => {
  try {
    const list = await db.getClinicians();
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// FACILITIES ENDPOINTS
// ============================================================

/**
 * GET /api/facilities
 * Returns all clinic/hospital facilities.
 */
app.get("/api/facilities", async (req, res) => {
  try {
    console.log("API /api/facilities requested...");
    const list = await db.getFacilities();
    console.log("API /api/facilities success, count:", list.length);
    return res.json(list);
  } catch (error: any) {
    console.error("API /api/facilities error:", error);
    return res.status(500).json(error.message);
  }
});

/**
 * PUT /api/facilities/:id
 * Updates facility hours or emergency alert toggles.
 */
app.put("/api/facilities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await db.updateFacility(id, updates);
    return res.json(updated);
  } catch (error: any) {
    console.error("PUT facility error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/logs
 * Body: { message, level }
 */
app.post("/api/logs", async (req, res) => {
  try {
    const { message, level } = req.body;
    const log = await db.addSystemLog({ message, level });
    return res.status(201).json({ success: true, log });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/logs/:id
 * Removes a system log entry by ID.
 */
app.delete("/api/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteSystemLog(id);
    return res.json({ success: true, message: "System log deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/users
 * Returns list of all registered users from Supabase Auth.
 */
app.get("/api/admin/users", async (_req, res) => {
  try {
    const authUsers = await db.listAllAuthUsers();
    const mapped = authUsers.map((u: any) => {
      const meta = u.user_metadata || {};
      const role = meta.role || 'Patient';
      return {
        id: u.id,
        email: u.email,
        fullName: meta.full_name || meta.fullName || u.email.split('@')[0],
        role,
        approved: meta.approved !== false,
        status: meta.status || 'Active', // 'Active' | 'Suspended'
        createdAt: u.created_at || new Date().toISOString(),
        hospital: meta.hospital || ''
      };
    });
    return res.json(mapped);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Updates details and metadata for any user.
 */
app.put("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, role, approved, status, email } = req.body;

    const authUsers = await db.listAllAuthUsers();
    const user = authUsers.find((u: any) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 1. Update Supabase Auth details
    const updates: any = {
      user_metadata: {
        full_name: fullName,
        role,
        approved,
        status
      }
    };
    if (email) {
      updates.email = email;
    }
    const updatedUser = await db.updateAuthUser(id, updates);

    // 2. If it's a Patient, keep patient_profiles table in sync!
    if (role === 'Patient') {
      try {
        await db.updatePatientProfile(user.email, {
          fullName,
          status // update status in profile nationality or other fields if desired, but metadata is source of truth
        });
      } catch (profileErr) {
        console.warn("Syncing to patient profiles failed (non-fatal):", profileErr);
      }
    }

    return res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Resets user password by ID.
 */
app.post("/api/admin/users/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    await db.updateAuthUser(id, { password });
    return res.json({ success: true, message: "Password updated successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Deletes user account from Supabase.
 */
app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteAuthUser(id);
    return res.json({ success: true, message: "User account deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/broadcast
 * Dispatches emergency alerts, maintenance warnings, or health advisories database-wide.
 */
app.post("/api/admin/broadcast", async (req, res) => {
  try {
    const { category, message, targetAudience } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const typePrefix = category === 'Emergency Alert' ? '🚨 EMERGENCY' : category === 'Maintenance Warning' ? '⚠️ MAINTENANCE' : '📢 HEALTH NOTICE';
    const logMessage = `[Broadcast]: (${targetAudience}) [${typePrefix}] ${message}`;

    // 1. Add log to system log database
    await db.addSystemLog({
      message: logMessage,
      level: category === 'Emergency Alert' ? 'error' : 'warning'
    });

    // 2. If patients are targeted, update all active patient profiles in-app notifications
    if (targetAudience === 'All Registered Patients' || targetAudience === 'All Users') {
      const profiles = await db.getPatientProfiles().catch(() => []);
      const newNotif = {
        id: `notif-admin-${Date.now()}`,
        title: `🔔 System Broadcast: ${typePrefix}`,
        body: message,
        time: "Just now",
        category: "general" as const,
        read: false
      };

      await Promise.all(
        profiles.map(async (p: any) => {
          try {
            const currentNotifs = p.notifications || [];
            await db.updatePatientProfile(p.email, {
              notifications: [newNotif, ...currentNotifs]
            });
          } catch (err) {
            console.warn(`Failed to add broadcast notification to ${p.email}:`, err);
          }
        })
      );
    }

    return res.json({ success: true, message: "Broadcast dispatched successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/translate", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required." });

    const target = (targetLanguage || "English").toLowerCase();
    const isMalay = target.includes("malay") || target.includes("bahasa");
    const isChinese = target.includes("chin");
    const lowercase = text.toLowerCase();

    // Helper to extract and translate times
    const extractAndTranslateTime = (str: string, toZh: boolean): string => {
      const timeRegex = /(\d{1,2}(?:\.\d{2}|:\d{2})?\s*(?:am|pm|pagi|petang|malam))/i;
      const match = str.match(timeRegex);
      if (!match) return "";
      const rawTime = match[1];
      if (!toZh) return rawTime;
      const isPm = /pm/i.test(rawTime) || /petang|malam/i.test(rawTime);
      const numMatch = rawTime.match(/\d{1,2}(?:\.\d{2}|:\d{2})?/);
      const numStr = numMatch ? numMatch[0].replace(".", ":") : "";
      const period = isPm ? "下午" : "上午";
      return `${period} ${numStr}`;
    };

    // 1. Smart Intent-Based Semantic Sentence Translation Heuristic (Local NLP Model)
    // Intent: What time do you want to change to?
    if ((lowercase.includes("what time") || lowercase.includes("what 时间") || lowercase.includes("what masa") || lowercase.includes("pukul berapa") || lowercase.includes("什么时间") || (lowercase.includes("what") && lowercase.includes("time"))) &&
        (lowercase.includes("change") || lowercase.includes("ubah") || lowercase.includes("更改") || lowercase.includes("换") || lowercase.includes("reschedule") || lowercase.includes("tukar"))) {
      const isYesSure = lowercase.includes("yes") || lowercase.includes("sure") || lowercase.includes("ya") || lowercase.includes("当然") || lowercase.includes("是") || lowercase.includes("sure");
      const prefixEn = isYesSure ? "Yes sure, " : "";
      const prefixZh = isYesSure ? "好的，" : "";
      const prefixMs = isYesSure ? "Ya baik, " : "";

      const translation = isMalay 
        ? `${prefixMs}pukul berapa anda mahu ubah?` 
        : isChinese 
          ? `${prefixZh}请问您想更改到什么时间？` 
          : `${prefixEn}what time would you like to change it to?`;
      return res.json({ translation });
    }

    // Intent: Change Appointment Time
    if ((lowercase.includes("change") || lowercase.includes("ubah") || lowercase.includes("更改") || lowercase.includes("换")) && 
        (lowercase.includes("appointment") || lowercase.includes("temujanji") || lowercase.includes("预约") || lowercase.includes("booking")) &&
        (lowercase.includes("time") || lowercase.includes("masa") || lowercase.includes("时间"))) {
      
      const timeStr = extractAndTranslateTime(text, isChinese);
      let translation = "";
      if (timeStr) {
        translation = isMalay 
          ? `Hi, saya mahu ubah masa temujanji ke ${timeStr}.` 
          : isChinese 
            ? `你好，我想将预约时间更改为 ${timeStr}。` 
            : `Hi, I want to change the appointment time to ${timeStr}.`;
      } else {
        translation = isMalay 
          ? "Boleh saya ubah masa temujanji?" 
          : isChinese 
            ? "我可以更改预约时间吗？" 
            : "Can I change the appointment time?";
      }
      return res.json({ translation });
    }

    // Intent: Cancel Appointment
    if ((lowercase.includes("cancel") || lowercase.includes("batal") || lowercase.includes("取消")) && 
        (lowercase.includes("appointment") || lowercase.includes("temujanji") || lowercase.includes("预约") || lowercase.includes("booking"))) {
      const translation = isMalay 
        ? "Boleh saya batalkan temujanji saya?" 
        : isChinese 
          ? "我可以取消我的预约吗？" 
          : "Can I cancel my appointment?";
      return res.json({ translation });
    }

    // Intent: Severe Fever
    if ((lowercase.includes("fever") || lowercase.includes("demam") || lowercase.includes("发烧")) && 
        (lowercase.includes("severe") || lowercase.includes("teruk") || lowercase.includes("严重"))) {
      const translation = isMalay 
        ? "Saya mengalami demam yang sangat teruk." 
        : isChinese 
          ? "我发高烧得非常严重。" 
          : "I am having a severe fever.";
      return res.json({ translation });
    }

    // Intent: Chest Pain
    if (lowercase.includes("chest pain") || lowercase.includes("sakit dada") || lowercase.includes("胸痛") || lowercase.includes("胸口痛")) {
      const translation = isMalay 
        ? "Saya mengalami sakit dada yang teruk." 
        : isChinese 
          ? "我感到严重的胸痛。" 
          : "I am experiencing severe chest pain.";
      return res.json({ translation });
    }

    // Intent: Need Doctor/Help
    if ((lowercase.includes("doctor") || lowercase.includes("doktor") || lowercase.includes("医生")) && 
        (lowercase.includes("need") || lowercase.includes("help") || lowercase.includes("perlu") || lowercase.includes("bantu") || lowercase.includes("帮助") || lowercase.includes("需要"))) {
      const translation = isMalay 
        ? "Saya memerlukan bantuan doktor." 
        : isChinese 
          ? "我需要医生的帮助。" 
          : "I need a doctor's assistance.";
      return res.json({ translation });
    }

    // Intent: Hello Greeting
    if (lowercase.includes("hello") || lowercase.includes("hi") || lowercase.includes("hey") || lowercase.includes("apa khabar") || lowercase.includes("你好")) {
      if (text.trim().length <= 6) {
        const translation = isMalay ? "Hello / Apa khabar" : isChinese ? "你好" : "Hello / Hi";
        return res.json({ translation });
      }
      const translation = isMalay 
        ? "Hello, bagaimanakah saya boleh membantu anda hari ini?" 
        : isChinese 
          ? "你好，请问有什么可以帮到您？" 
          : "Hello, how can I assist you today?";
      return res.json({ translation });
    }

    // Intent: Thank you
    if (lowercase.includes("thank") || lowercase.includes("terima kasih") || lowercase.includes("谢谢")) {
      if (text.trim().length <= 12) {
        const translation = isMalay ? "Terima kasih" : isChinese ? "谢谢" : "Thank you";
        return res.json({ translation });
      }
      const translation = isMalay 
        ? "Terima kasih banyak-banyak atas bantuan anda." 
        : isChinese 
          ? "非常感谢您的帮助。" 
          : "Thank you very much for your assistance.";
      return res.json({ translation });
    }

    // Intent: Delay
    if (lowercase.includes("delay") || lowercase.includes("ditangguhkan") || lowercase.includes("延迟")) {
      const translation = isMalay 
        ? "Jadual perundingan ditangguhkan seketika." 
        : isChinese 
          ? "时间表已暂时延迟。" 
          : "The schedule is temporarily delayed.";
      return res.json({ translation });
    }

    // 2. Tokenized word-by-word vocabulary fallback (for custom words / sentence structures)
    const langKey = isMalay ? "ms" : isChinese ? "zh" : "en";
    const vocab = [
      // Multi-word phrases checked first (greedy match)
      { en: "chest pain", ms: "sakit dada", zh: "胸痛" },
      { en: "sore throat", ms: "sakit tekak", zh: "喉咙痛" },
      { en: "blood pressure", ms: "tekanan darah", zh: "血压" },
      { en: "heart rate", ms: "kadar nadi", zh: "心率" },
      { en: "thank you", ms: "terima kasih", zh: "谢谢" },
      { en: "terima kasih", ms: "terima kasih", zh: "谢谢" },
      { en: "apa khabar", ms: "apa khabar", zh: "你好" },
      { en: "sakit kepala", ms: "sakit kepala", zh: "头痛" },
      { en: "sakit dada", ms: "sakit dada", zh: "胸痛" },
      { en: "sakit tekak", ms: "sakit tekak", zh: "喉咙痛" },
      { en: "sakit perut", ms: "sakit perut", zh: "胃痛/肚子痛" },
      { en: "running nose", ms: "selesema/hidung berair", zh: "流鼻涕" },
      { en: "excuse me", ms: "maafkan saya", zh: "打扰一下" },
      // Pronouns & Common verbs
      { en: "yes", ms: "ya", zh: "是" },
      { en: "sure", ms: "tentu/ya", zh: "当然" },
      { en: "what", ms: "apa", zh: "什么" },
      { en: "time", ms: "masa", zh: "时间" },
      { en: "change", ms: "ubah", zh: "更改" },
      { en: "to", ms: "ke/untuk", zh: "到" },
      { en: "the", ms: "itu", zh: "的" },
      
      // Pronouns & Common verbs
      { en: "i", ms: "saya", zh: "我" },
      { en: "me", ms: "saya", zh: "我" },
      { en: "you", ms: "anda", zh: "你" },
      { en: "we", ms: "kami", zh: "我们" },
      { en: "they", ms: "mereka", zh: "他们" },
      { en: "he", ms: "dia", zh: "他" },
      { en: "she", ms: "dia", zh: "她" },
      { en: "my", ms: "saya punya", zh: "我的" },
      { en: "your", ms: "anda punya", zh: "你的" },
      { en: "his", ms: "dia punya", zh: "他的" },
      { en: "her", ms: "dia punya", zh: "她的" },
      { en: "our", ms: "kami punya", zh: "我们的" },
      { en: "their", ms: "mereka punya", zh: "他们的" },
      { en: "us", ms: "kami", zh: "我们" },
      { en: "them", ms: "mereka", zh: "他们" },
      { en: "have", ms: "ada", zh: "有" },
      { en: "has", ms: "ada", zh: "有" },
      { en: "had", ms: "ada", zh: "有" },
      { en: "want", ms: "mahu", zh: "想要" },
      { en: "need", ms: "perlu", zh: "需要" },
      { en: "go", ms: "pergi", zh: "去" },
      { en: "come", ms: "datang", zh: "来" },
      { en: "is", ms: "adalah", zh: "是" },
      { en: "am", ms: "adalah", zh: "是" },
      { en: "are", ms: "adalah", zh: "是" },
      { en: "can", ms: "boleh", zh: "可以" },
      { en: "feel", ms: "rasa", zh: "感觉" },
      { en: "feeling", ms: "rasa", zh: "感觉" },
      { en: "take", ms: "ambil", zh: "拿/服药" },
      { en: "eat", ms: "makan", zh: "吃" },
      { en: "drink", ms: "minum", zh: "喝" },
      { en: "sleep", ms: "tidur", zh: "睡觉" },
      { en: "rest", ms: "rehat", zh: "休息" },
      { en: "work", ms: "kerja", zh: "工作" },
      { en: "wait", ms: "tunggu", zh: "等" },
      
      // Medical Symptoms
      { en: "fever", ms: "demam", zh: "发烧" },
      { en: "demam", ms: "demam", zh: "发烧" },
      { en: "headache", ms: "sakit kepala", zh: "头痛" },
      { en: "cough", ms: "batuk", zh: "咳嗽" },
      { en: "batuk", ms: "batuk", zh: "咳嗽" },
      { en: "pain", ms: "sakit", zh: "痛" },
      { en: "sakit", ms: "sakit", zh: "痛" },
      { en: "stomach", ms: "perut", zh: "胃" },
      { en: "throat", ms: "tekak", zh: "喉咙" },
      { en: "dizzy", ms: "pening", zh: "头晕" },
      { en: "flu", ms: "selesema", zh: "感冒" },
      { en: "cold", ms: "sejuk/selesema", zh: "冷/感冒" },
      { en: "hot", ms: "panas", zh: "热" },
      { en: "vomit", ms: "muntah", zh: "呕吐" },
      { en: "diarrhea", ms: "cirit-birit", zh: "拉肚子" },
      { en: "nausea", ms: "loya", zh: "恶心" },
      { en: "allergy", ms: "alergi", zh: "过敏" },
      { en: "sick", ms: "sakit", zh: "生病" },
      { en: "hurt", ms: "sakit", zh: "痛" },
      { en: "injury", ms: "kecederaan", zh: "受伤" },
      { en: "accident", ms: "kemalangan", zh: "车祸" },
      { en: "emergency", ms: "kecemasan", zh: "紧急" },
      { en: "itching", ms: "gatal", zh: "痒" },
      { en: "rash", ms: "ruam", zh: "皮疹" },
      { en: "swelling", ms: "bengkak", zh: "肿胀" },
      
      // Anatomy
      { en: "head", ms: "kepala", zh: "头" },
      { en: "chest", ms: "dada", zh: "胸" },
      { en: "heart", ms: "jantung", zh: "心脏" },
      { en: "stomach", ms: "perut", zh: "胃" },
      { en: "leg", ms: "kaki", zh: "腿" },
      { en: "hand", ms: "tangan", zh: "手" },
      { en: "eye", ms: "mata", zh: "眼睛" },
      { en: "ear", ms: "telinga", zh: "耳朵" },
      { en: "throat", ms: "tekak", zh: "喉咙" },
      { en: "body", ms: "badan", zh: "身体" },
      { en: "blood", ms: "darah", zh: "血液" },
      
      // Medical Entities
      { en: "doctor", ms: "doktor", zh: "医生" },
      { en: "nurse", ms: "jururawat", zh: "护士" },
      { en: "hospital", ms: "hospital", zh: "医院" },
      { en: "clinic", ms: "klinik", zh: "诊所" },
      { en: "medicine", ms: "ubat", zh: "药" },
      { en: "vitals", ms: "vital", zh: "生命体征" },
      { en: "sugar", ms: "gula", zh: "糖" },
      { en: "pressure", ms: "tekanan", zh: "压力" },
      { en: "scan", ms: "imbasan", zh: "扫描" },
      { en: "test", ms: "ujian", zh: "测试" },
      { en: "result", ms: "keputusan", zh: "结果" },
      
      // Greetings
      { en: "hello", ms: "hello", zh: "你好" },
      { en: "hi", ms: "hi", zh: "你好" },
      { en: "hey", ms: "hey", zh: "嗨" },
      { en: "welcome", ms: "sama-sama", zh: "不客气" },
      
      // Scheduling & Operations
      { en: "appointment", ms: "temujanji", zh: "预约" },
      { en: "booking", ms: "tempahan", zh: "预订" },
      { en: "cancel", ms: "batal", zh: "取消" },
      { en: "delay", ms: "lambat", zh: "延迟" },
      { en: "delayed", ms: "ditangguhkan", zh: "延迟" },
      { en: "today", ms: "hari ini", zh: "今天" },
      { en: "tomorrow", ms: "esok", zh: "明天" },
      { en: "time", ms: "masa", zh: "时间" },
      { en: "sorry", ms: "maaf", zh: "抱歉" },
      { en: "please", ms: "tolong", zh: "请" },
      { en: "help", ms: "bantu", zh: "帮助" },
      { en: "change", ms: "ubah", zh: "change/更改" },
      { en: "the", ms: "itu", zh: "the/的" },
      { en: "yes", ms: "ya", zh: "是" },
      { en: "no", ms: "tidak", zh: "不" },
      
      // Adjectives
      { en: "good", ms: "baik", zh: "好" },
      { en: "fine", ms: "baik", zh: "好" },
      { en: "great", ms: "hebat", zh: "棒" },
      { en: "bad", ms: "buruk", zh: "坏" },
      { en: "severe", ms: "teruk", zh: "严重" },
      { en: "mild", ms: "ringan", zh: "轻微" },
      { en: "high", ms: "tinggi", zh: "高" },
      { en: "low", ms: "rendah", zh: "低" },
      { en: "safe", ms: "selamat", zh: "安全" }
    ];

    let result = text;

    // 1. Greedy replace multi-word phrases (case insensitive, retaining brackets to avoid double translations)
    vocab.forEach(entry => {
      if (entry.en.includes(" ")) {
        const regexEn = new RegExp(`\\b${entry.en}\\b`, "gi");
        result = result.replace(regexEn, `[[${entry[langKey]}]]`);
      }
      if (entry.ms.includes(" ") && entry.ms !== entry.en) {
        const regexMs = new RegExp(`\\b${entry.ms}\\b`, "gi");
        result = result.replace(regexMs, `[[${entry[langKey]}]]`);
      }
    });

    // 2. Tokenize the remaining text into words and non-words
    const tokens = result.split(/(\b[a-zA-Z0-9'\u4e00-\u9fa5]+\b)/g);

    // 3. Translate single tokens
    const translatedTokens = tokens.map(token => {
      if (token.startsWith("[[") && token.endsWith("]]")) {
        return token.slice(2, -2);
      }
      
      const trimmed = token.toLowerCase();
      const matched = vocab.find(v => v.en === trimmed || v.ms === trimmed || v.zh === trimmed);
      if (matched) {
        let trans = matched[langKey];
        if (token[0] === token[0].toUpperCase() && token[0] !== token[0].toLowerCase()) {
          trans = trans.charAt(0).toUpperCase() + trans.slice(1);
        }
        return trans;
      }
      return token;
    });

    const translation = translatedTokens.join("");
    return res.json({ translation });
  } catch (error: any) {
    console.error("POST /api/translate error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// CAREY AI — LOCAL ML CONSULTATION
// ============================================================

/**
 * POST /api/gemini/consult
 * Body: { message, history, patientInfo }
 * Routes through local keyword-based ML engine.
 */
app.post("/api/gemini/consult", async (req, res) => {
  try {
    const { message, history, patientInfo } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const localIntent = getLocalIntent(message);
    const apiKey = process.env.GEMINI_API_KEY;
    const hasApiKey = apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "";

    // If the local ML system successfully identifies a targeted intent (greetings, reviews, symptoms, vitals), use it immediately!
    if (localIntent !== "fallback") {
      const replyText = await localConsult(message, history || [], patientInfo);
      return res.json({ text: replyText });
    }

    // Only route unhandled general inquiries to live Gemini API if the API key is active
    if (hasApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // ground prompts with medical history and vitals
        const systemPrompt = `You are "Carey", a state-of-the-art AI clinical consultation assistant for PenangHealth.
Analyze the user's symptoms and guide them to the appropriate medical department or clinician.

Patient Information:
- Full Name: ${patientInfo?.fullName || "Ahmad"}
- Chronic Conditions: ${patientInfo?.chronicConditions?.join(", ") || "None"}
- Allergies: ${patientInfo?.allergies?.join(", ") || "None"}

Available Clinics, Specialists & Facilities Directory:
1. Pantai Hospital Penang:
   - Cardiologists: Dr. Sarah Jenkins & Dr. Adrian Rahman (Cardiology).
   - Facility Strengths: 24/7 Coronary Care Unit (CCU) and state-of-the-art cardiac catheterization lab. Best for chest pain, heart issues, and high BP.
2. Loh Guan Lye Specialists Centre:
   - Pediatrician: Dr. Ling Wey Shuan (Pediatrics).
   - Facility Strengths: Neonatal intensive care unit (NICU). Best for children's immunization, infant colds, and pediatric checkups.
3. Lam Wah Eee Hospital:
   - General Surgeon: Dr. Simon Lo (General Surgery).
   - Facility Strengths: Advanced operating theatres for minimally invasive procedures. Best for appendix pain, hernia, and gallbladder surgery.
4. KPJ Penang Specialist Hospital:
   - Internal Medicine: Dr. Ainol Shareha.
   - Facility Strengths: Comprehensive isolation screening facilities for viral diseases. Best for diabetes, viral infections, and chronic disease.
5. Island Hospital:
   - Orthopedic Surgeon: Dr. Adrian Mitchell (Orthopedics & Sports Medicine).
   - Facility Strengths: Regional hub for musculoskeletal rehabilitation. Best for broken bones, joint pain, sprains, and knee/hip replacements.
6. Gleneagles Penang:
   - Neurologist: Dr. Tan Mei Ling (Neurology).
   - Facility Strengths: Certified Stroke Center with 24/7 MRI/CT imaging support. Best for strokes, migraines, headache, and vertigo.
7. Penang Adventist Hospital:
   - Gastroenterologist: Dr. Gary Yusuf (Gastroenterology & Urology).
   - Facility Strengths: Specialized Endoscopy Suite. Best for acid reflux (GERD), stomach ulcers, and stomach aches.
8. O2 Klinik (Bayan Baru):
   - Family Medicine: Dr. Lisa Wong (General Practice).
   - Facility Strengths: Primary care screening and colds/flu. Best for mild ailments, sore throat, and checkups.

Clinical Guidelines:
1. Ground your diagnosis and routing advice.
2. Recommend the specific clinic/hospital and doctor from the directory above that matches their symptom's specialty.
3. Explain WHY that clinic and doctor are a good fit (mention their facility strengths and specialty).
4. If they describe severe emergency symptoms (crushing chest pain, severe heavy bleeding, unconsciousness), warn them and direct them to Emergency SOS.
5. Keep your response concise, clear, and professional. Avoid markdown headings that are too large. Use bullet points for recommendations.

Chat History:
${(history || []).map((h: any) => `${h.sender === 'user' ? 'Patient' : 'Carey'}: ${h.content}`).join("\n")}
Patient: "${message}"

Carey:`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.contents?.[0]?.parts?.[0]?.text;
          if (result) {
            return res.json({ text: result });
          }
        }
      } catch (err) {
        console.warn("Gemini consultation call failed, falling back to local ML:", err);
      }
    }

    // Default local fallback consulting menu if no API key or if call fails
    const replyText = await localConsult(message, history || [], patientInfo);
    return res.json({ text: replyText });
  } catch (error: any) {
    console.error("Local ML Consultation Error:", error.message);
    return res.status(500).json({ error: error.message || "Consultation engine error." });
  }
});

// ============================================================
// VITE DEV MIDDLEWARE OR STATIC PRODUCTION SERVING
// ============================================================

async function seedStaffAccounts() {
  const staffAccounts = [
    { email: "hospitalpulaupinang@gmail.com", name: "Hospital Pulau Pinang Staff" },
    { email: "hospitalseberangjaya@gmail.com", name: "Hospital Seberang Jaya Staff" },
    { email: "kkjalanperak@gmail.com", name: "Klinik Kesihatan Jalan Perak Staff" },
    { email: "kkbayanbaru@gmail.com", name: "Klinik Kesihatan Bayan Baru Staff" },
    { email: "hospitalbukitmertajam@gmail.com", name: "Hospital Bukit Mertajam Staff" },
    { email: "pantaihospital@gmail.com", name: "Pantai Hospital Staff" },
    { email: "lamwahee@gmail.com", name: "Hospital Lam Wah Ee Staff" },
    { email: "gleneagleshospital@gmail.com", name: "Gleneagles Hospital Staff" },
    { email: "islandhospital@gmail.com", name: "Island Hospital Staff" },
    { email: "penangadventisthospital@gmail.com", name: "Penang Adventist Hospital Staff" },
    { email: "lohguanlye@gmail.com", name: "Loh Guan Lye Specialists Centre Staff" },
    { email: "kpjpenang@gmail.com", name: "KPJ Penang Specialist Hospital Staff" },
    { email: "o2klinik@gmail.com", name: "O2 Klinik Staff" },
    { email: "kliniksingapore@gmail.com", name: "Klinik Singapore Staff" },
    { email: "poliklinikperdana@gmail.com", name: "Poliklinik Perdana Staff" }
  ];

  console.log("🌱  Seeding staff accounts...");
  for (const account of staffAccounts) {
    try {
      const { data, error } = await db.supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: "12345678",
        email_confirm: true,
        user_metadata: {
          full_name: account.name,
          role: "Doctor",
          approved: true
        }
      });
      if (error) {
        if (error.message.includes("already exists") || error.message.includes("already registered")) {
          // normal case, already seeded
        } else {
          console.error(`Error seeding account ${account.email}:`, error.message);
        }
      } else {
        console.log(`✅ Seeded staff account: ${account.email}`);
      }
    } catch (err: any) {
      console.error(`Failed to seed account ${account.email}:`, err.message);
    }
  }

  // Seed admin account
  console.log("🌱  Seeding admin account...");
  try {
    const { data, error } = await db.supabaseAdmin.auth.admin.createUser({
      email: "admin@gmail.com",
      password: "12345678",
      email_confirm: true,
      user_metadata: {
        full_name: "System Administrator",
        role: "Admin",
        approved: true
      }
    });
    if (error) {
      if (error.message.includes("already exists") || error.message.includes("already registered")) {
        // normal case, already seeded
      } else {
        console.error("Error seeding admin account:", error.message);
      }
    } else {
      console.log("✅ Seeded admin account: admin@gmail.com");
    }
  } catch (err: any) {
    console.error("Failed to seed admin account:", err.message);
  }
}

async function startServer() {
  // Seed staff accounts first
  await seedStaffAccounts();

  // Train the local symptom triage classifier on start
  try {
    initClassifier();
  } catch (err) {
    console.error("Failed to train local ML classifier:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("🔧  Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        proxy: {} // Disable proxy loop inside Express middleware
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦  Serving static production assets from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🏥  CarePoint Patient Portal`);
    console.log(`🚀  Server running at  http://localhost:${PORT}`);
    console.log(`📊  Supabase project:  ${process.env.SUPABASE_URL}\n`);
  });
}

startServer();
