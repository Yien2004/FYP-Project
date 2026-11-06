# Pantai Healthcare - Smart Outpatient Management System

**Final Year Project (FYP)**  
An intelligent, full-stack hospital outpatient healthcare platform designed for Pantai Hospital Healthcare Group. Seamlessly connecting Patients, Specialist Doctors, Front-desk Staff, and Hospital Administrators across multiple medical facilities.

---

## Live Deployment & Demo Links

| Service | Platform | Direct URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel | https://fyp-project-yxkv.vercel.app/ |
| **Backend REST API** | Render | https://fyp-project-069w.onrender.com/api/health |
| **GitHub Repository** | GitHub | https://github.com/Yien2004/FYP-Project |

---

## System Portals & Key Features

The system is organized into three interconnected portals:

### 1. Patient Portal
* **Carey AI Symptom Triage**: Powered by Google Gemini AI, helps patients assess symptoms, detect urgency levels, and suggests appropriate specialist departments.
* **Specialist Appointment Booking**: Browse doctors, real-time consultation slots, select clinics, and generate instant digital queue tickets.
* **Live Queue Status & Counter Check-in**: Track queue position in real-time and check in upon arrival at the hospital.
* **Electronic Health Records (EHR)**: View clinical visit history, doctor consultation notes, and vital signs monitoring (blood pressure, heart rate, temperature).
* **Medication Scheduler & Pill Reminders**: Automated reminders for active prescriptions with dosage, frequency, and instructions.
* **Multilingual Translation**: Seamless switching between English, Bahasa Melayu, and Chinese.

### 2. Doctor & Clinical Staff Portal
* **Consultation Queue Management**: Real-time consultation queue with calling next patient and consultation status tracking.
* **Patient Directory & EHR Lookup**: Instant access to patient historical diagnoses, allergies, and lab records.
* **Clinical Notes & Prescription Formulation**: Record examination remarks, diagnostic findings, and schedule medications directly into the patient's tracker.
* **Doctor Attendance & Leave (MC) Manager**: Doctors can record leave/MC dates with automatic calendar blocking and schedule unblocking upon removal.
* **Front Counter Queue Manager**: Dedicated screen for hospital reception staff to manage patient presence and ticket calls.

### 3. Hospital Admin Subsystem
* **Master Doctor Rosters**: Department-wise roster management across all Pantai hospital facilities.
* **Physician Onboarding & Credentialing**: Approve pending doctor registrations or directly onboard specialist leads with department allocations.
* **Emergency Broadcast Dispatcher**: Publish hospital-wide or department-specific emergency announcements and clinic alerts with audit logs.
* **Hospital Holiday & Cascade Cancellation**: Schedule hospital closures with automated cascade cancellation and patient notification dispatch.
* **Analytics & Activity Logs**: Track appointment volumes, department workloads, and administrative audit trails.

---

## Technology Stack

* **Frontend**:
  * Framework: React 18 / 19, TypeScript
  * Build Tool: Vite
  * Styling: Tailwind CSS, Lucide React Icons, Motion animations
  * Mapping: Leaflet & React-Leaflet (Hospital finder)
* **Backend**:
  * Runtime: Node.js, Express, TypeScript (tsx)
  * Security & Auth: Supabase Auth, bcryptjs, JSON Web Tokens
  * Email Services: Nodemailer (SMTP password reset & verification codes)
* **Database & Cloud**:
  * Database: Supabase (PostgreSQL)
  * Frontend Hosting: Vercel (CI/CD auto-deployment with API rewrites)
  * Backend Hosting: Render (Web Service)
* **Artificial Intelligence**:
  * AI Engine: Google Gemini API (@google/genai) for intelligent clinical triage and natural language translation.
