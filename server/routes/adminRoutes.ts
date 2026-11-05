import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as db from '../../db';
import { 
  getFacilityIdByHospital, 
  getHospitalByFacilityId, 
  RBAC_STAFF_ACCOUNTS 
} from '../../src/data/staffAccounts';

const router = Router();

// In-memory duty status store for dynamic toggle fallback
const doctorDutyStatuses: Record<string, { duty_status: string; room_number?: string }> = {};

// 1. GET /api/admin/metrics - Aggregates facility operational metrics & patient throughput
router.get('/metrics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    const isSuper = admin?.role === 'super_admin' || admin?.facility_id === 0;
    const reqFac = req.query.facilityId ? String(req.query.facilityId) : '';
    const facilityId = (reqFac === 'ALL' || reqFac === '0') && isSuper ? 0 : (isSuper && reqFac ? Number(reqFac) : (admin?.facility_id || Number(reqFac) || 1));
    const { department = '', date = '' } = req.query as { department?: string; date?: string };
    const selectedDate = date?.trim() || new Date().toISOString().split('T')[0];
    const allAppointments = await db.getAppointments();
    const filtered = allAppointments.filter((a: any) => {
      const aptFac = a.facility_id ? Number(a.facility_id) : getFacilityIdByHospital(a.clinic || a.hospital);
      if (facilityId !== 0 && aptFac !== facilityId) return false;
      if (department && department !== 'ALL' && !(a.department || a.specialty || '').toLowerCase().includes(department.toLowerCase())) return false;
      return selectedDate === 'ALL' || a.date === selectedDate;
    });
    const isCancelledStatus = (s: string) => {
      const u = (s || '').toUpperCase();
      return u === 'CANCELLED' || u === 'REJECTED' || u.includes('CANCEL');
    };
    const isAbsentStatus = (s: string) => {
      const u = (s || '').toUpperCase();
      return u === 'MISSING' || u === 'ABSENT' || u === 'NO_SHOW';
    };

    const totalBookings = filtered.length;
    const cancelledCount = filtered.filter((a: any) => isCancelledStatus(a.status)).length;
    const activeAppointments = filtered.filter((a: any) => !isCancelledStatus(a.status));
    const activeBookings = activeAppointments.length;

    const checkedInCount = activeAppointments.filter((a: any) => a.checkedIn || ['CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'DONE'].includes((a.status || '').toUpperCase())).length;
    const waitingCount = activeAppointments.filter((a: any) => a.checkedIn && !['IN_CONSULTATION', 'COMPLETED', 'DONE'].includes((a.status || '').toUpperCase())).length;
    const inConsultation = activeAppointments.filter((a: any) => (a.status || '').toUpperCase() === 'IN_CONSULTATION').length;
    const completed = activeAppointments.filter((a: any) => ['COMPLETED', 'DONE'].includes((a.status || '').toUpperCase())).length;
    const absentCount = activeAppointments.filter((a: any) => isAbsentStatus(a.status)).length;

    const checkInRate = activeBookings > 0 ? `${((checkedInCount / activeBookings) * 100).toFixed(1)}%` : '0.0%';
    const absentRate = activeBookings > 0 ? `${((absentCount / activeBookings) * 100).toFixed(1)}%` : '0.0%';

    const appointmentsSummary = filtered.map((a: any) => ({
      id: a.id, queueNumber: a.queueNumber || 'N/A', patientName: a.patientName || 'Anonymous Patient',
      doctorName: a.doctorName, specialty: a.specialty || a.department, date: a.date, timeSlot: a.timeSlot,
      status: a.status, checkedIn: Boolean(a.checkedIn), roomNumber: a.roomNumber || ''
    }));
    return res.json({ 
      success: true, 
      facility_id: facilityId, 
      hospital: getHospitalByFacilityId(facilityId), 
      department: department || 'ALL', 
      selectedDate, 
      metrics: { 
        totalBookings, 
        cancelledCount,
        activeBookings,
        checkInRate, 
        absentRate, 
        noShowRate: absentRate, 
        waitingCount, 
        inConsultation, 
        completed 
      }, 
      appointments: appointmentsSummary 
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch admin metrics.' });
  }
});

/**
 * 2. PATCH /api/admin/doctors/:id/duty-status
 * Updates doctor duty status (ON_DUTY, ON_BREAK, ON_LEAVE, OFF_DUTY) and locks appointment slots if ON_LEAVE.
 */
router.patch('/doctors/:id/duty-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, roomNumber } = req.body; // status: 'ON_DUTY', 'ON_BREAK', 'ON_LEAVE', 'OFF_DUTY'
    const doctorId = req.params.id;
    const admin = req.user;
    const facilityId = admin?.facility_id || 1;

    // Cache status in memory store
    doctorDutyStatuses[doctorId] = {
      duty_status: status || 'ON_DUTY',
      room_number: roomNumber
    };

    // If placed on leave, auto cancel today's pending appointments
    if (status === 'ON_LEAVE') {
      const today = new Date().toISOString().split('T')[0];
      const allApts = await db.getAppointments();
      const docApts = allApts.filter((a: any) => {
        const aptDocId = String(a.doctorId || a.doctorEmail || a.doctorName || '').toLowerCase();
        const targetId = String(doctorId).toLowerCase();
        const isMatch = aptDocId.includes(targetId) || targetId.includes(aptDocId);
        return isMatch && a.date === today && (a.status === 'Upcoming' || a.status === 'Approved' || a.status === 'Pending');
      });

      for (const apt of docApts) {
        try {
          await db.updateAppointment(String(apt.id), {
            status: 'CANCELLED_DOCTOR_LEAVE',
            remarks: 'Doctor is on leave (MC/Emergency). Appointment rescheduled or cancelled.'
          });
        } catch (e: any) {
          console.warn("Failed to cancel doctor appointment during leave:", e.message);
        }
      }
    }

    // Record audit log
    try {
      await db.addAuditLog({
        actor_id: admin?.id,
        actor_email: admin?.email || 'admin',
        actor_role: 'admin',
        facility_id: facilityId,
        action_type: 'STATUS_CHANGE',
        target_id: doctorId,
        description: `${admin?.email || 'Admin'} changed Doctor (${doctorId}) status to ${status}${roomNumber ? ` (Room: ${roomNumber})` : ''}`
      });
    } catch (auditErr: any) {
      console.warn("Audit log warning:", auditErr.message);
    }

    return res.json({ 
      success: true, 
      message: `Doctor status updated to ${status}`,
      duty_status: status,
      roomNumber 
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/doctors/:id/duty-status error:", err);
    return res.status(500).json({ error: 'Failed to update doctor status.' });
  }
});

/**
 * 3. GET /api/admin/intercept-logs
 * Carey AI Red-Flag Intercept Logs for emergency symptoms.
 */
router.get('/intercept-logs', authenticateToken, async (req: Request, res: Response) => {
  try {
    const facilityId = req.user?.facility_id || Number(req.query.facilityId) || undefined;
    const logs = await db.getEmergencyInterceptLogs(facilityId, 50);
    return res.json({ success: true, logs });
  } catch (err: any) {
    console.error("GET /api/admin/intercept-logs error:", err);
    return res.status(500).json({ error: 'Failed to fetch intercept logs.' });
  }
});

/**
 * 4. GET /api/admin/staff-roster
 * Returns all staff and doctors for this branch.
 */
router.get('/staff-roster', authenticateToken, async (req: Request, res: Response) => {
  try {
    const facilityId = req.user?.facility_id || Number(req.query.facilityId) || 1;
    
    // Filter staff accounts strictly for this facility
    const roster = RBAC_STAFF_ACCOUNTS
      .filter(s => s.facility_id === facilityId)
      .map(s => {
        const cachedDuty: any = doctorDutyStatuses[s.email] || doctorDutyStatuses[s.name] || {};
        return {
          id: s.email,
          email: s.email,
          full_name: s.name,
          role: s.role,
          department: s.department,
          room_number: cachedDuty.room_number || s.room_number || "Room 1",
          duty_status: cachedDuty.duty_status || "ON_DUTY",
          facility_id: s.facility_id,
          hospital: s.hospital
        };
      });

    return res.json({ success: true, members: roster });
  } catch (err: any) {
    console.error("GET /api/admin/staff-roster error:", err);
    return res.status(500).json({ error: 'Failed to fetch staff roster.' });
  }
});

/**
 * 5. POST /api/admin/users/:id/reset-password
 * Admin resets staff or user password to standard 12345678 with audit logging.
 */
router.post('/users/:id/reset-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const admin = req.user;
    const facilityId = admin?.facility_id || 1;

    // Look up user in auth
    const allUsers = await db.listAllAuthUsers();
    const user = allUsers.find((u: any) => u.id === targetUserId || (u.email || '').toLowerCase() === targetUserId.toLowerCase());

    if (user) {
      await db.updateAuthUser(user.id, { password: '12345678' });
    }

    // Record in audit logs
    try {
      await db.addAuditLog({
        actor_id: admin?.id,
        actor_email: admin?.email || 'admin',
        actor_role: 'admin',
        facility_id: facilityId,
        action_type: 'PASSWORD_RESET',
        target_id: user?.email || targetUserId,
        description: `${admin?.email || 'Admin'} reset password to default (12345678) for ${user?.email || targetUserId}`
      });
    } catch (auditErr: any) {
      console.warn("Audit log warning:", auditErr.message);
    }

    return res.json({ 
      success: true, 
      message: `Password reset to 12345678 for ${user?.email || targetUserId}` 
    });
  } catch (err: any) {
    console.error("POST /api/admin/users/:id/reset-password error:", err);
    return res.status(500).json({ error: 'Password reset failed.' });
  }
});

/**
 * 6. GET /api/admin/audit-logs
 * Returns audit trail for this facility.
 */
router.get('/audit-logs', authenticateToken, async (req: Request, res: Response) => {
  try {
    const facilityId = req.user?.facility_id || Number(req.query.facilityId) || undefined;
    const logs = await db.getAuditLogs(facilityId, 100);
    return res.json({ success: true, logs });
  } catch (err: any) {
    console.error("GET /api/admin/audit-logs error:", err);
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

/**
 * 7. POST /api/admin/leaves
 * Submit doctor leave and record schedule block.
 */
router.post('/leaves', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { doctor_id, doctor_name, leave_type, start_date, end_date, reason } = req.body;
    const admin = req.user;
    const facilityId = admin?.facility_id || Number(req.body.facility_id) || 1;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required.' });
    }

    const leave = await db.addDoctorLeave({
      doctor_id: doctor_id || admin?.id || 'doctor',
      doctor_name: doctor_name || admin?.full_name || 'Specialist Doctor',
      facility_id: facilityId,
      leave_type: leave_type || 'MC',
      start_date,
      end_date,
      reason: reason || ''
    });

    // Write to audit log
    try {
      await db.addAuditLog({
        actor_id: admin?.id,
        actor_email: admin?.email || 'admin',
        actor_role: admin?.role || 'admin',
        facility_id: facilityId,
        action_type: 'LEAVE_SUBMIT',
        target_id: doctor_id || 'doctor',
        description: `${admin?.email} submitted ${leave_type || 'MC'} leave for ${doctor_name || 'Doctor'} (${start_date} to ${end_date})`
      });
    } catch (auditErr: any) {
      console.warn("Audit log warning:", auditErr.message);
    }

    return res.status(201).json({ success: true, leave });
  } catch (err: any) {
    console.error("POST /api/admin/leaves error:", err);
    return res.status(500).json({ error: 'Failed to submit leave.' });
  }
});

/**
 * 8. GET /api/admin/leaves
 * Returns scheduled leave blocks.
 */
router.get('/leaves', authenticateToken, async (req: Request, res: Response) => {
  try {
    const facilityId = req.user?.facility_id || Number(req.query.facilityId) || undefined;
    const doctorId = req.query.doctorId as string | undefined;
    const leaves = await db.getDoctorLeaves(facilityId, doctorId);
    return res.json({ success: true, leaves });
  } catch (err: any) {
    console.error("GET /api/admin/leaves error:", err);
    return res.status(500).json({ error: 'Failed to fetch doctor leaves.' });
  }
});

export default router;
