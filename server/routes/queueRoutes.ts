import { Router, Request, Response } from "express";
import * as db from "../../db";
import { authenticateToken } from "../middleware/auth";
import { 
  getStaffAccountByEmail, 
  getFacilityIdByHospital, 
  getHospitalByFacilityId, 
  matchesSpecialty,
  RBAC_STAFF_ACCOUNTS
} from "../../src/data/staffAccounts";

const router = Router();

/**
 * Normalize queue ticket string for comparison
 * e.g. "#Q-101" -> "q-101", "Q101" -> "q-101", "101" -> "101"
 */
function normalizeTicket(ticket?: string): string {
  if (!ticket) return "";
  return ticket.trim().replace(/^#/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Resolve doctor's consultation room from appointment or staff accounts
 */
function resolveDoctorRoom(appointment: any): string {
  if (appointment.roomNumber) return appointment.roomNumber;

  // Search by doctor email or name in registered accounts
  const docAccount = RBAC_STAFF_ACCOUNTS.find(acc => {
    if (appointment.doctorEmail && acc.email.toLowerCase() === appointment.doctorEmail.toLowerCase()) return true;
    if (appointment.doctorName && acc.name.toLowerCase().includes(appointment.doctorName.toLowerCase())) return true;
    if (appointment.doctorId && (acc as any).id === appointment.doctorId) return true;
    return false;
  });

  if (docAccount?.room_number) return docAccount.room_number;

  // Fallback heuristic based on doctor name
  const docName = (appointment.doctorName || "").toLowerCase();
  if (docName.includes("asha")) return "Consultation Room 101";
  if (docName.includes("balwant")) return "Consultation Room 102";
  if (docName.includes("ganesan")) return "Consultation Room 201";
  if (docName.includes("ainol")) return "Consultation Room 301";

  return "Consultation Room 1";
}

/**
 * POST /api/queue/verify-checkin
 * Frontdesk Staff check-in verification endpoint with strict department and facility isolation.
 * Body: { queueNumber: string }
 */
router.post("/verify-checkin", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { queueNumber } = req.body;
    const staff = req.user;

    if (!staff) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (staff.role !== "staff" && staff.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied: Frontdesk staff only." 
      });
    }

    if (!queueNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Queue ticket number is required." 
      });
    }

    // 1. Fetch appointments
    const allAppointments = await db.getAppointments();
    const queryNorm = normalizeTicket(queueNumber);

    const matchedApt = allAppointments.find((apt: any) => {
      const aptTicketNorm = normalizeTicket(apt.queueNumber);
      if (aptTicketNorm === queryNorm) return true;
      const queryDigits = queryNorm.replace(/\D/g, "");
      const aptDigits = aptTicketNorm.replace(/\D/g, "");
      return queryDigits && aptDigits && queryDigits === aptDigits;
    });

    if (!matchedApt) {
      return res.status(404).json({
        success: false,
        message: `Queue number "${queueNumber}" not found for today.`
      });
    }

    // 2. Strict Facility & Department RBAC Matching
    const aptAny = matchedApt as any;
    const apptFacilityId = aptAny.facility_id 
      ? Number(aptAny.facility_id) 
      : getFacilityIdByHospital(aptAny.clinic || aptAny.hospital);

    const apptFacilityName = getHospitalByFacilityId(apptFacilityId);
    const apptSpecialty = matchedApt.specialty || "General Medicine";

    const isSameFacility = (apptFacilityId === staff.facility_id);
    const isSameDept = matchesSpecialty(staff.department, apptSpecialty);

    if (!isSameFacility || !isSameDept) {
      return res.status(403).json({
        success: false,
        isMismatch: true,
        message: `Mismatched Routing: Patient is booked for [Facility ${apptFacilityId} - ${apptSpecialty}], not your department [${staff.department}]!`,
        details: {
          ticket: matchedApt.queueNumber,
          patientName: matchedApt.patientName,
          appointmentFacility: apptFacilityName,
          appointmentSpecialty: apptSpecialty,
          staffFacility: staff.hospital,
          staffDepartment: staff.department
        }
      });
    }

    // 3. Resolve assigned room
    const assignedRoom = resolveDoctorRoom(matchedApt);

    // 4. Update appointment status to CHECKED_IN
    const nowTimeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    
    // Parse existing symptoms JSON to preserve triage and update check-in metadata
    let existingSymptomsObj: any = {};
    if (typeof aptAny.symptoms === "string" && aptAny.symptoms.startsWith("{")) {
      try {
        existingSymptomsObj = JSON.parse(aptAny.symptoms);
      } catch (e) {
        existingSymptomsObj = { symptoms: aptAny.symptoms };
      }
    } else {
      existingSymptomsObj = { symptoms: aptAny.symptoms || "" };
    }

    existingSymptomsObj.checkedIn = true;
    existingSymptomsObj.checkInTime = nowTimeStr;
    existingSymptomsObj.roomNumber = assignedRoom;

    await db.updateAppointment(String(matchedApt.id), {
      checkedIn: true,
      checkInTime: nowTimeStr,
      status: "CHECKED_IN",
      remarks: JSON.stringify(existingSymptomsObj)
    });

    // Log check-in event to audit trail
    try {
      await db.addAuditLog({
        actor_id: (staff as any).id || null,
        actor_email: (staff as any).email || 'staff@pantaicare.com',
        actor_role: (staff as any).role || 'staff',
        facility_id: (staff as any).facility_id || apptFacilityId,
        action_type: 'QUEUE_CHECK_IN',
        target_id: matchedApt.queueNumber,
        description: `${(staff as any).email || 'Staff'} checked in queue ${matchedApt.queueNumber} for patient ${matchedApt.patientName}`
      });
    } catch (auditErr: any) {
      console.warn("Audit log warning:", auditErr.message);
    }

    // 5. Return structured check-in result
    return res.json({
      success: true,
      patientName: matchedApt.patientName,
      doctorName: matchedApt.doctorName,
      assignedRoom: assignedRoom,
      queueNumber: matchedApt.queueNumber,
      status: "CHECKED_IN",
      checkInTime: nowTimeStr
    });

  } catch (error: any) {
    console.error("Checkin error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Server error during check-in." 
    });
  }
});

/**
 * GET /api/queue/department-queue
 * Retrieves queue list for frontdesk terminal.
 * STRICT PRIVACY (Need-to-Know): Omits patient medical records, EHR past history, and diagnoses.
 */
router.get("/department-queue", authenticateToken, async (req: Request, res: Response) => {
  try {
    const staff = req.user;
    if (!staff) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (staff.role !== "staff" && staff.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Frontdesk staff only." });
    }

    const allAppointments = await db.getAppointments();

    // Filter strictly for this facility and department
    const deptAppointments = allAppointments.filter((apt: any) => {
      const aptFacilityId = apt.facility_id ? Number(apt.facility_id) : getFacilityIdByHospital(apt.clinic || apt.hospital);
      const isFacility = (staff.role === "admin") || (aptFacilityId === staff.facility_id);
      const isDept = matchesSpecialty(staff.department, apt.specialty);
      return isFacility && isDept;
    });

    // Enumerate doctors active in this facility and department
    const deptDoctors = RBAC_STAFF_ACCOUNTS.filter(acc => 
      acc.role === "doctor" &&
      acc.facility_id === staff.facility_id &&
      matchesSpecialty(staff.department, acc.department)
    ).map(doc => {
      const docWaiting = deptAppointments.filter((apt: any) => {
        const isThisDoc = (apt.doctorName && apt.doctorName.toLowerCase().includes(doc.name.toLowerCase())) ||
                          (apt.doctorEmail && apt.doctorEmail.toLowerCase() === doc.email.toLowerCase());
        const isWaiting = apt.status === "CHECKED_IN" || apt.status === "Checked In" || apt.status === "Upcoming";
        return isThisDoc && isWaiting;
      }).length;

      return {
        name: doc.name,
        email: doc.email,
        roomNumber: doc.room_number || "Consultation Room",
        department: doc.department,
        waitingCount: docWaiting
      };
    });

    // Sanitize queue for frontdesk: Strictly Need-to-Know (no past EHR or diagnostic reports)
    const sanitizedQueue = deptAppointments.map((apt: any) => ({
      id: apt.id,
      queueNumber: apt.queueNumber,
      patientName: apt.patientName,
      timeSlot: apt.timeSlot,
      date: apt.date,
      doctorName: apt.doctorName,
      specialty: apt.specialty,
      roomNumber: resolveDoctorRoom(apt),
      status: apt.status,
      checkedIn: apt.checkedIn || apt.status === "CHECKED_IN" || apt.status === "Checked In",
      checkInTime: apt.checkInTime || ""
    }));

    const totalWaiting = sanitizedQueue.filter(a => a.status === "CHECKED_IN" || a.status === "Checked In" || a.status === "Upcoming").length;

    return res.json({
      success: true,
      terminal: {
        facilityId: staff.facility_id,
        facilityName: staff.hospital,
        department: staff.department,
        roomNumber: staff.room_number,
        staffName: staff.full_name
      },
      stats: {
        totalWaiting,
        totalAppointments: sanitizedQueue.length
      },
      doctors: deptDoctors,
      queue: sanitizedQueue
    });

  } catch (err: any) {
    console.error("Department queue fetch error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch department queue." });
  }
});

/**
 * Backward compatibility route: POST /api/queue/verify-and-checkin
 */
router.post("/verify-and-checkin", async (req: Request, res: Response) => {
  const staffEmail = req.body.staffEmail || req.headers["x-staff-email"] as string;
  let staff = req.user;

  if (!staff && staffEmail) {
    const foundStaff = getStaffAccountByEmail(staffEmail);
    if (foundStaff) {
      const rawRole = (foundStaff.role || "").toLowerCase();
      const normRole: "staff" | "admin" | "doctor" = rawRole.includes("doc") ? "doctor" : (rawRole.includes("admin") ? "admin" : "staff");
      staff = {
        id: foundStaff.email,
        email: foundStaff.email,
        role: normRole,
        full_name: foundStaff.name,
        facility_id: foundStaff.facility_id,
        department: foundStaff.department,
        room_number: foundStaff.room_number || "Front Counter",
        hospital: foundStaff.hospital
      };
    } else {
      const isDoc = staffEmail.toLowerCase().includes("doc") || staffEmail.toLowerCase().startsWith("dr");
      staff = {
        id: staffEmail,
        email: staffEmail,
        role: isDoc ? "doctor" : "staff",
        full_name: staffEmail.split("@")[0].toUpperCase(),
        facility_id: 1,
        department: "All",
        room_number: isDoc ? "Consultation Room 101" : "Front Counter",
        hospital: "Pantai Hospital Penang (Main Hospital)"
      };
    }
  }

  if (!staff) {
    staff = {
      id: "frontdesk_system",
      email: "frontdesk@pantaicare.com",
      role: "staff",
      full_name: "Front Counter Reception",
      facility_id: 1,
      department: "All",
      room_number: "Front Counter",
      hospital: "Pantai Hospital Penang (Main Hospital)"
    };
  }

  const { queueNumber } = req.body;
  if (!queueNumber) {
    return res.status(400).json({ success: false, error: "Missing queue ticket number." });
  }

  try {
    const allAppointments = await db.getAppointments();
    const queryNorm = normalizeTicket(queueNumber);

    const matchedApt = allAppointments.find((apt: any) => {
      const aptTicketNorm = normalizeTicket(apt.queueNumber);
      if (aptTicketNorm === queryNorm) return true;
      const queryDigits = queryNorm.replace(/\D/g, "");
      const aptDigits = aptTicketNorm.replace(/\D/g, "");
      if (queryDigits && aptDigits && queryDigits === aptDigits) return true;
      if (String(apt.id).toLowerCase() === queryNorm) return true;
      return false;
    });

    if (!matchedApt) {
      return res.status(404).json({ success: false, error: `Ticket "${queueNumber}" not found.` });
    }

    const aptAny = matchedApt as any;
    const apptFacilityId = aptAny.facility_id ? Number(aptAny.facility_id) : getFacilityIdByHospital(aptAny.clinic || aptAny.hospital);

    const assignedRoom = resolveDoctorRoom(matchedApt);
    const nowTimeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    // Persist check-in to Supabase
    await db.updateAppointment(String(matchedApt.id), {
      checkedIn: true,
      checkInTime: nowTimeStr,
      status: "Checked In"
    });

    // Audit trail log
    try {
      await db.addAuditLog({
        actor_id: (staff as any).id || null,
        actor_email: (staff as any).email || 'staff@pantaicare.com',
        actor_role: (staff as any).role || 'staff',
        facility_id: (staff as any).facility_id || apptFacilityId || 1,
        action_type: 'QUEUE_CHECK_IN',
        target_id: matchedApt.queueNumber || String(matchedApt.id),
        description: `Patient ${matchedApt.patientName} confirmed presence for appointment ${matchedApt.queueNumber || ''}`
      });
    } catch (auditErr: any) {
      console.warn("Audit log warning:", auditErr.message);
    }

    return res.json({
      success: true,
      appointmentId: matchedApt.id,
      patientName: matchedApt.patientName,
      doctorName: matchedApt.doctorName,
      assignedRoom,
      queueNumber: matchedApt.queueNumber,
      status: "Checked In",
      checkInTime: nowTimeStr,
      message: `Verified and admitted ${matchedApt.patientName} to lobby.`
    });
  } catch (e: any) {
    console.error("verify-and-checkin error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/queue/staff-info
 */
router.get("/staff-info", (req: Request, res: Response) => {
  const email = String(req.query.email || "");
  const staff = getStaffAccountByEmail(email);
  if (!staff) {
    return res.status(404).json({ error: "Staff member not found" });
  }
  return res.json({ staff });
});

export default router;
