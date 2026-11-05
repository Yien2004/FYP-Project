import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import * as db from '../../db';

const router = Router();
const BROADCAST_LOGS_FILE = path.join(process.cwd(), 'broadcast_logs.json');

function loadBroadcastLogs(): any[] {
  try {
    if (fs.existsSync(BROADCAST_LOGS_FILE)) {
      const raw = fs.readFileSync(BROADCAST_LOGS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read broadcast logs file:', err);
  }
  return [];
}

function saveBroadcastLogs(logs: any[]) {
  try {
    fs.writeFileSync(BROADCAST_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save broadcast logs file:', err);
  }
}

/**
 * POST /api/broadcast/send
 * Dispatches broadcast notice to target audience and logs transmission
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const {
      broadcastType = 'GENERAL_ADVISORY',
      targetScope = 'ALL_PATIENTS',
      targetDoctorId = '',
      targetDoctorName = '',
      impactedDate = '',
      targetPatientId = '',
      targetPatientName = '',
      title = 'Clinic Advisory',
      message = '',
      senderEmail = '',
      facilityId = 1
    } = req.body;

    if (!message.trim()) {
      return res.status(400).json({ error: 'Broadcast message content is required.' });
    }

    const effectiveSender = senderEmail || req.headers['x-staff-email'] || req.headers['x-user-email'] || 'staff@pantaicare.com';
    let targetPatientEmails: string[] = [];
    let scopeDescription = 'All Registered Patients';

    // 1. Calculate recipient cohort based on scope
    if (targetScope === 'ALL_PATIENTS') {
      try {
        const allProfiles = await db.getPatientProfiles();
        targetPatientEmails = allProfiles.map((p: any) => p.email).filter(Boolean);
      } catch (e) {
        targetPatientEmails = [];
      }
      scopeDescription = 'All Registered Patients';
    } else if (targetScope === 'DOCTOR_IMPACTED') {
      try {
        const allAppointments = await db.getAppointments();
        const docClean = (targetDoctorName || '').toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, '').trim();

        const impactedApts = allAppointments.filter((apt: any) => {
          const aptDate = apt.date || '';
          const isDateMatch = !impactedDate || aptDate === impactedDate;
          if (!isDateMatch) return false;

          const aptDoc = (apt.doctorName || '').toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, '').trim();
          const aptDocEmail = (apt.doctorEmail || '').toLowerCase();
          const isDocMatch = (
            (docClean && (aptDoc.includes(docClean) || docClean.includes(aptDoc))) ||
            (targetDoctorId && String(apt.doctorId) === String(targetDoctorId)) ||
            (aptDocEmail && aptDocEmail === targetDoctorId.toLowerCase())
          );

          const isNotCancelled = apt.status !== 'CANCELLED' && apt.status !== 'Cancelled' && apt.status !== 'NO_SHOW';
          return isDocMatch && isNotCancelled;
        });

        const emails = impactedApts.map((a: any) => a.patientEmail || a.patientId || a.email).filter(Boolean);
        targetPatientEmails = Array.from(new Set(emails));
        scopeDescription = `${targetDoctorName || 'Doctor'} - ${impactedDate || 'Scheduled'} Cohort (${targetPatientEmails.length} Patients)`;
      } catch (e) {
        targetPatientEmails = [];
        scopeDescription = `${targetDoctorName || 'Doctor'} - ${impactedDate || 'Scheduled'} Cohort (0 Patients)`;
      }
    } else if (targetScope === 'SPECIFIC_PATIENT') {
      if (targetPatientId) {
        targetPatientEmails = [targetPatientId];
        scopeDescription = `Specific Patient: ${targetPatientName || targetPatientId}`;
      }
    }

    // 2. Create broadcast log record
    const newLogRecord = {
      id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender_id: effectiveSender,
      facility_id: facilityId,
      broadcast_type: broadcastType,
      target_scope: targetScope,
      scope_description: scopeDescription,
      target_doctor_name: targetDoctorName,
      impacted_date: impactedDate,
      target_patient_id: targetPatientId,
      title: title || 'Clinic Advisory',
      message: message.trim(),
      recipient_count: targetPatientEmails.length,
      created_at: new Date().toISOString()
    };

    // Save to local JSON ledger
    const existingLogs = loadBroadcastLogs();
    saveBroadcastLogs([newLogRecord, ...existingLogs]);

    // 3. Deliver to targeted patient inboxes
    for (const email of targetPatientEmails) {
      try {
        const patient = await db.getPatientProfileByEmail(email);
        if (patient) {
          const currentNotifs = patient.notifications || [];
          const notifItem = {
            id: `notif-bc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: title || '📢 Clinic Notice',
            body: message.trim(),
            message: message.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            category: broadcastType === 'DOCTOR_MC' ? 'alert' : 'general',
            read: false
          };
          await db.updatePatientProfile(email, {
            notifications: [notifItem, ...currentNotifs]
          });
        }
      } catch (err) {
        console.warn(`Failed to push notification to patient ${email}:`, err);
      }
    }

    // 4. Log to system logs for audit trail
    try {
      await db.addSystemLog({
        message: `[Broadcast]: (${scopeDescription}) [${title}] ${message.trim()}`,
        level: broadcastType === 'DOCTOR_MC' ? 'warning' : 'info'
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: `Broadcast successfully dispatched to ${targetPatientEmails.length} recipients.`,
      recipient_count: targetPatientEmails.length,
      record: newLogRecord
    });
  } catch (err: any) {
    console.error('Broadcast dispatch error:', err);
    return res.status(500).json({ error: 'Failed to dispatch broadcast notice.' });
  }
});

/**
 * GET /api/broadcast/logs
 * Retrieves historical broadcast logs
 */
router.get('/logs', async (_req: Request, res: Response) => {
  try {
    const logs = loadBroadcastLogs();
    return res.json({ success: true, logs });
  } catch (err: any) {
    console.error('Broadcast logs fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve broadcast logs.' });
  }
});

export default router;
