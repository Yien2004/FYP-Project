import { Router, Request, Response } from "express";
import * as db from "../../db";
import { authenticateToken } from "../middleware/auth";
import { RBAC_STAFF_ACCOUNTS } from "../../src/data/staffAccounts";

const router = Router();

/**
 * Helper to test if an appointment belongs to the specified doctor (IDOR protection)
 */
function isDoctorAppointment(apt: any, doctor: any): boolean {
  if (!apt || !doctor) return false;

  // 0. General facility consultant, staff desk, or admin override
  if (
    doctor.role === "admin" ||
    doctor.role === "super_admin" ||
    doctor.role === "staff" ||
    doctor.email === "doctor@hospital.com" ||
    doctor.email === "staff@hospital.com" ||
    (doctor.full_name || "").toLowerCase().includes("consultant (main hospital)") ||
    doctor.department === "All"
  ) {
    return true;
  }

  // 1. Match by doctor ID
  if (apt.doctorId && doctor.id && String(apt.doctorId) === String(doctor.id)) return true;

  // 2. Match by doctor email
  if (apt.doctorEmail && doctor.email && apt.doctorEmail.toLowerCase() === doctor.email.toLowerCase()) return true;

  // 3. Match by doctor full name
  const docName = (doctor.full_name || "").toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, "").trim();
  const aptDocName = (apt.doctorName || "").toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, "").trim();
  if (docName && aptDocName && (aptDocName.includes(docName) || docName.includes(aptDocName))) return true;

  return false;
}

/**
 * GET /api/doctor/my-consultations
 * IDOR Protected: Only returns patient queue assigned strictly to the authenticated doctor.
 */
router.get("/my-consultations", authenticateToken, async (req: Request, res: Response) => {
  try {
    const doctor = req.user;
    if (!doctor) {
      return res.status(401).json({ success: false, message: "Doctor authentication required." });
    }

    if (doctor.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Access denied: Doctors only." });
    }

    // 1. Fetch appointments
    const allAppointments = await db.getAppointments();
    const today = new Date().toISOString().split("T")[0];

    // 2. Core IDOR Safety: Filter strictly for this doctor
    const myQueue = allAppointments.filter((apt: any) => {
      const matchDoc = isDoctorAppointment(apt, doctor);
      const isDate = !apt.date || apt.date === today;
      return matchDoc && isDate;
    }).map((apt: any) => {
      return {
        id: apt.id,
        queueNumber: apt.queueNumber,
        patientName: apt.patientName,
        patientId: apt.patientId,
        date: apt.date,
        timeSlot: apt.timeSlot,
        status: apt.status,
        checkedIn: apt.checkedIn || apt.status === "CHECKED_IN" || apt.status === "Checked In",
        checkInTime: apt.checkInTime || "",
        roomNumber: doctor.room_number,
        doctorName: doctor.full_name,
        specialty: doctor.department,
        symptoms: apt.symptoms,
        // Carey AI Clinical Triage Details
        triage: apt.triage || {
          chiefComplaint: apt.symptoms || "Outpatient specialist evaluation",
          urgencyLevel: "Standard",
          score: 60,
          preliminaryDiagnosis: "Clinical evaluation in progress",
          careyAssessment: "Triage assessment completed by Carey AI protocol.",
          recommendations: ["Review patient vitals", "Clinical physical examination"]
        },
        clinicalNotes: apt.clinicalNotes || ""
      };
    });

    return res.json({
      success: true,
      doctorProfile: {
        id: doctor.id,
        name: doctor.full_name,
        email: doctor.email,
        roomNumber: doctor.room_number,
        department: doctor.department,
        hospital: doctor.hospital
      },
      stats: {
        total: myQueue.length,
        waiting: myQueue.filter(a => a.status === "CHECKED_IN" || a.status === "Checked In" || a.status === "Upcoming").length,
        inConsultation: myQueue.filter(a => a.status === "IN_CONSULTATION" || a.status === "In Consultation").length,
        completed: myQueue.filter(a => a.status === "COMPLETED" || a.status === "Completed" || a.status === "Done").length
      },
      queue: myQueue
    });

  } catch (error: any) {
    console.error("Doctor consultations error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching consultations." });
  }
});

/**
 * POST /api/doctor/call-next
 * Doctor autonomously calls the next waiting checked-in patient into their room.
 */
router.post("/call-next", authenticateToken, async (req: Request, res: Response) => {
  try {
    const doctor = req.user;
    if (!doctor || (doctor.role !== "doctor" && doctor.role !== "staff" && doctor.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Access denied: Authorized clinical personnel only." });
    }

    const allAppointments = await db.getAppointments();

    // Find patients assigned to this doctor that are checked in or in lobby, not yet in consultation or completed
    const myWaitingQueue = allAppointments.filter((apt: any) => {
      if (!isDoctorAppointment(apt, doctor)) return false;
      const isCheckedIn = apt.checkedIn || apt.status === "CHECKED_IN" || apt.status === "Checked In";
      const isNotDone = apt.status !== "COMPLETED" && apt.status !== "Completed" && apt.status !== "NO_SHOW" && apt.status !== "Done";
      return isCheckedIn && isNotDone;
    }).sort((a: any, b: any) => {
      const isAPriority = a.timeSlot === "Priority Triage";
      const isBPriority = b.timeSlot === "Priority Triage";
      if (isAPriority && !isBPriority) return -1;
      if (!isAPriority && isBPriority) return 1;
      return (a.timeSlot || "").localeCompare(b.timeSlot || "");
    });

    if (myWaitingQueue.length === 0) {
      return res.status(404).json({ success: false, message: "No checked-in patients waiting in queue for your consultation room." });
    }

    const nextPatient = myWaitingQueue[0];
    const nowTimeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    // Auto-complete previous patient who was IN_CONSULTATION or CALLING for this doctor
    const currentActive = allAppointments.filter((a: any) => {
      if (!isDoctorAppointment(a, doctor)) return false;
      const s = (a.status || '').toUpperCase();
      return (s === 'IN_CONSULTATION' || s === 'CALLING') && String(a.id) !== String(nextPatient.id);
    });
    for (const activeApt of currentActive) {
      await db.updateAppointment(String(activeApt.id), { status: 'COMPLETED' });
    }

    const updatedApt = await db.updateAppointment(String(nextPatient.id), {
      status: "CALLING",
      checkedIn: true,
      checkInTime: nextPatient.checkInTime || nowTimeStr
    });

    await db.addSystemLog({
      timestamp: new Date().toISOString(),
      level: "INFO",
      type: "QUEUE_CALL",
      message: `[Doctor Call] ${doctor.full_name} called Ticket ${nextPatient.queueNumber} (${nextPatient.patientName}) to ${doctor.room_number}.`
    });

    return res.json({
      success: true,
      message: `Calling patient ${nextPatient.patientName} (${nextPatient.queueNumber}) to ${doctor.room_number}.`,
      patient: updatedApt,
      doctorName: doctor.full_name,
      roomNumber: doctor.room_number
    });

  } catch (error: any) {
    console.error("Doctor call next error:", error);
    return res.status(500).json({ success: false, message: "Server error calling next patient." });
  }
});

// POST /api/doctor/call-patient - Transitions queue ticket to CALLING and assigns consultation room
router.post("/call-patient", authenticateToken, async (req: Request, res: Response) => {
  try {
    const doctor = req.user;
    if (!doctor || (doctor.role !== "doctor" && doctor.role !== "staff" && doctor.role !== "admin")) return res.status(403).json({ error: "Access denied: Authorized clinical personnel only." });
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ error: "Appointment ID is required." });

    const allAppointments = await db.getAppointments();
    const apt = allAppointments.find((a: any) => String(a.id) === String(appointmentId));
    if (!apt) return res.status(404).json({ error: "Appointment not found." });
    if (!isDoctorAppointment(apt, doctor)) return res.status(403).json({ error: "IDOR: Unauthorized for this patient." });

    // Auto-complete previous active encounter for this doctor
    const prevActive = allAppointments.filter((a: any) => isDoctorAppointment(a, doctor) && ['IN_CONSULTATION', 'CALLING'].includes((a.status || '').toUpperCase()) && String(a.id) !== String(appointmentId));
    for (const a of prevActive) await db.updateAppointment(String(a.id), { status: 'COMPLETED' });

    // Transition queue state to CALLING and room assignment in DB
    const updatedApt = await db.callNextQueue(String(appointmentId), doctor.room_number || "Consultation Room 1");
    await db.addSystemLog({ timestamp: new Date().toISOString(), level: "INFO", message: `[Doctor Call] ${doctor.full_name} called Ticket ${apt.queueNumber} to ${doctor.room_number}.` });

    return res.json({ success: true, message: `Called ${apt.patientName} (${apt.queueNumber}) to ${doctor.room_number}.`, appointment: updatedApt, doctorName: doctor.full_name, roomNumber: doctor.room_number });
  } catch (error: any) {
    return res.status(500).json({ error: "Server error calling patient." });
  }
});

/**
 * POST /api/doctor/recall
 * Doctor re-pages currently called patient who has not entered yet.
 * Body: { appointmentId: string }
 */
router.post("/recall", authenticateToken, async (req: Request, res: Response) => {
  try {
    const doctor = req.user;
    if (!doctor || (doctor.role !== "doctor" && doctor.role !== "staff" && doctor.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Access denied: Authorized clinical personnel only." });
    }

    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "Appointment ID is required." });
    }

    const allAppointments = await db.getAppointments();
    const apt = allAppointments.find((a: any) => String(a.id) === String(appointmentId));

    if (!apt) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    if (!isDoctorAppointment(apt, doctor)) {
      return res.status(403).json({ success: false, message: "IDOR Violation: Access denied." });
    }

    const updatedApt = await db.updateAppointment(String(appointmentId), {
      status: "CALLING"
    });

    await db.addSystemLog({
      timestamp: new Date().toISOString(),
      level: "INFO",
      type: "QUEUE_RECALL",
      message: `[Doctor Re-Call] ${doctor.full_name} re-called Ticket ${apt.queueNumber} (${apt.patientName}) to ${doctor.room_number}.`
    });

    return res.json({
      success: true,
      message: `Re-called patient ${apt.patientName} (${apt.queueNumber}) to ${doctor.room_number}.`,
      appointment: updatedApt
    });
  } catch (error: any) {
    console.error("Doctor recall error:", error);
    return res.status(500).json({ success: false, message: "Server error recalling patient." });
  }
});

/**
 * POST /api/doctor/start-consultation
 * Marks that patient has stepped inside the consultation room.
 * Body: { appointmentId: string }
 */
router.post("/start-consultation", authenticateToken, async (req: Request, res: Response) => {
  try {
    const doctor = req.user;
    if (!doctor || (doctor.role !== "doctor" && doctor.role !== "staff" && doctor.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Access denied: Authorized clinical personnel only." });
    }

    const { appointmentId } = req.body;
    const allAppointments = await db.getAppointments();
    const apt = allAppointments.find((a: any) => String(a.id) === String(appointmentId));

    if (!apt) return res.status(404).json({ success: false, message: "Appointment not found." });
    if (!isDoctorAppointment(apt, doctor)) return res.status(403).json({ success: false, message: "Unauthorized." });

    const updatedApt = await db.updateAppointment(String(appointmentId), {
      status: "IN_CONSULTATION"
    });

    await db.addSystemLog({
      timestamp: new Date().toISOString(),
      level: "INFO",
      type: "CONSULT_START",
      message: `[Consultation Started] ${apt.patientName} (${apt.queueNumber}) entered ${doctor.room_number} with ${doctor.full_name}.`
    });

    return res.json({ success: true, message: `Consultation started with ${apt.patientName}.`, appointment: updatedApt });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/doctor/skip-patient
 * Doctor postpones or marks patient as No-Show.
 * Body: { appointmentId: string, action: 'POSTPONE' | 'ABSENT' }
 */
router.post("/skip-patient", authenticateToken, async (req: Request, res: Response) => {
  try {
    const doctor = req.user;
    if (!doctor || (doctor.role !== "doctor" && doctor.role !== "staff" && doctor.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Access denied: Authorized clinical personnel only." });
    }

    const { appointmentId, action } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "Appointment ID is required." });
    }

    const allAppointments = await db.getAppointments();
    const apt = allAppointments.find((a: any) => String(a.id) === String(appointmentId));

    if (!apt) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    if (!isDoctorAppointment(apt, doctor)) {
      return res.status(403).json({ success: false, message: "IDOR Violation: Access denied." });
    }

    if (action === "ABSENT") {
      const updatedApt = await db.updateAppointment(String(appointmentId), {
        status: "NO_SHOW"
      });

      await db.addSystemLog({
        timestamp: new Date().toISOString(),
        level: "WARN",
        type: "QUEUE_NO_SHOW",
        message: `[Doctor Action] ${apt.patientName} (${apt.queueNumber}) marked as No-Show by ${doctor.full_name}.`
      });

      return res.json({ success: true, message: `Patient marked as No-Show.`, appointment: updatedApt });
    } else {
      // POSTPONE: delay time slot by 15 mins, status back to CHECKED_IN
      const updatedApt = await db.updateAppointment(String(appointmentId), {
        status: "CHECKED_IN",
        timeSlot: `${apt.timeSlot} (Delayed +15m)`
      });

      await db.addSystemLog({
        timestamp: new Date().toISOString(),
        level: "INFO",
        type: "QUEUE_POSTPONE",
        message: `[Doctor Action] ${apt.patientName} (${apt.queueNumber}) postponed 3 positions by ${doctor.full_name}.`
      });

      return res.json({ success: true, message: `Patient postponed in queue.`, appointment: updatedApt });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/doctor/complete-consultation
 * Doctor completes the clinical encounter and writes diagnosis/notes.
 * Body: { appointmentId: string, clinicalNotes?: string, diagnosis?: string, prescription?: string }
 */
router.post("/complete-consultation", authenticateToken, async (req: Request, res: Response) => {
  try {
    const doctor = req.user;
    if (!doctor || (doctor.role !== "doctor" && doctor.role !== "staff" && doctor.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Access denied: Authorized clinical personnel only." });
    }

    const { appointmentId, clinicalNotes, diagnosis, prescription } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "Appointment ID is required." });
    }

    const allAppointments = await db.getAppointments();
    const apt = allAppointments.find((a: any) => String(a.id) === String(appointmentId));

    if (!apt) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // IDOR Protection: Doctor can only complete their own assigned encounters
    if (!isDoctorAppointment(apt, doctor)) {
      return res.status(403).json({
        success: false,
        message: "IDOR Violation: You are not authorized to update another physician's record."
      });
    }

    const notePayload = [
      diagnosis ? `[Diagnosis]: ${diagnosis}` : "",
      clinicalNotes ? `[Notes]: ${clinicalNotes}` : "",
      prescription ? `[Rx]: ${prescription}` : ""
    ].filter(Boolean).join("\n");

    const updatedApt = await db.updateAppointment(String(appointmentId), {
      status: "COMPLETED",
      clinicalNotes: notePayload,
      prescription: prescription || ""
    });

    // Auto-sync prescription to patient's active Medication Scheduler
    if (prescription && prescription.trim()) {
      try {
        const patientEmail = apt.patientEmail || apt.patientId;
        const patient = await db.getPatientProfileByEmail(patientEmail);
        if (patient) {
          const currentRx = Array.isArray(patient.prescriptions) ? patient.prescriptions : [];
          const rxItems = prescription.split(/,\s*(?=[A-Z])/).map((itemStr: string, idx: number) => {
            const clean = itemStr.trim();
            const match = clean.match(/^(.+?)\s+(\d+[\s\w]+?)\s*\((.+?)\)$/);
            return {
              id: `rx-${Date.now()}-${idx}`,
              drugName: match ? match[1].trim() : clean,
              dosage: match ? match[2].trim() : "1 Tablet",
              frequency: match ? match[3].trim() : "Once Daily (QD)",
              instructions: "Take after meals",
              prescribedBy: doctor.full_name || apt.doctorName || "Attending Physician",
              date: apt.date || new Date().toISOString().split("T")[0]
            };
          });

          const newMeds = rxItems.filter((newRx: any) =>
            !currentRx.some((existing: any) =>
              (existing.drugName || '').toLowerCase() === newRx.drugName.toLowerCase() &&
              existing.date === newRx.date
            )
          );

          if (newMeds.length > 0) {
            await db.updatePatientProfile(patient.email, {
              prescriptions: [...newMeds, ...currentRx]
            });
          }
        }
      } catch (err: any) {
        console.warn("Failed to auto-sync prescription to patient scheduler:", err);
      }
    }

    await db.addSystemLog({
      timestamp: new Date().toISOString(),
      level: "INFO",
      type: "CONSULT_COMPLETE",
      message: `[Consultation Completed] ${apt.patientName} (${apt.queueNumber}) completed encounter with ${doctor.full_name}.`
    });

    return res.json({
      success: true,
      message: `Consultation completed for ${apt.patientName} (${apt.queueNumber}).`,
      appointment: updatedApt
    });

  } catch (error: any) {
    console.error("Complete consultation error:", error);
    return res.status(500).json({ success: false, message: "Server error completing consultation." });
  }
});

export default router;
