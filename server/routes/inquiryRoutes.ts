import { Router } from 'express';
import * as db from '../../db';

const router = Router();

// 1. 患者提交门诊咨询留言 (Patient submits inquiry)
router.post('/send', async (req, res) => {
  try {
    const { facilityId, department, doctorId, subject, message, patientId, patientName, patientEmail } = req.body;

    if (!facilityId || !department || !subject || !message) {
      return res.status(400).json({ error: 'Facility, department, subject, and message are required.' });
    }

    const inquiry = await db.submitClinicInquiry({
      patient_id: patientId || 'pt-portal-user',
      patient_name: patientName || 'Patient',
      patient_email: patientEmail || 'user@gmail.com',
      facility_id: Number(facilityId),
      department: String(department).trim(),
      doctor_id: doctorId || null,
      subject: String(subject).trim(),
      message: String(message).trim()
    });

    return res.json({
      success: true,
      message: 'Inquiry submitted successfully to clinic desk.',
      inquiry
    });
  } catch (err: any) {
    console.error("Submit inquiry error:", err);
    return res.status(500).json({ error: 'Failed to submit clinic inquiry.' });
  }
});

// 2. 前台/医生/Admin 查询咨询列表 (Get inquiries)
router.get('/', async (req, res) => {
  try {
    const { facilityId, department, patientId } = req.query;
    const facId = facilityId ? Number(facilityId) : undefined;
    const dept = department ? String(department) : undefined;
    const pid = patientId ? String(patientId) : undefined;

    const inquiries = await db.getClinicInquiries(facId, dept, pid);
    return res.json({ success: true, inquiries });
  } catch (err: any) {
    console.error("Get inquiries error:", err);
    return res.status(500).json({ error: 'Failed to fetch inquiries.' });
  }
});

// 3. 前台/医生回复患者咨询 (Reply to inquiry)
router.post('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText, repliedBy } = req.body;

    if (!replyText) {
      return res.status(400).json({ error: 'Reply text is required.' });
    }

    await db.replyClinicInquiry(id, replyText, repliedBy || 'Clinic Counter Staff');
    return res.json({ success: true, message: 'Reply sent to patient.' });
  } catch (err: any) {
    console.error("Reply inquiry error:", err);
    return res.status(500).json({ error: 'Failed to reply to inquiry.' });
  }
});

export default router;
