import { Router } from 'express';
import * as db from '../../db';

const router = Router();

// 1. 提交新科室申请 (Staff / Doctor -> Pending Approval)
router.post('/department/submit', async (req, res) => {
  try {
    const { facility_id, facilityId, name, description, requested_by, requestedBy } = req.body;
    const targetFacility = Number(facility_id || facilityId || 1);

    if (!name) {
      return res.status(400).json({ error: 'Department name is required.' });
    }

    const dept = await db.submitDepartment({
      facility_id: targetFacility,
      name: String(name).trim(),
      description: description || '',
      requested_by: requested_by || requestedBy || 'staff'
    });

    return res.json({ success: true, message: 'Department submitted for Admin review.', dept });
  } catch (err: any) {
    console.error("Department submission error:", err);
    return res.status(500).json({ error: 'Failed to submit department.' });
  }
});

// 2. 医生端提名新医生 (Doctor nomination -> PENDING_APPROVAL)
router.post('/doctor/nominate', async (req, res) => {
  try {
    const { email, fullName, department, roomNumber, mmcNumber, employmentType, facility_id, facilityId, nominated_by, nominatedBy } = req.body;
    if (!email || !fullName || !department) {
      return res.status(400).json({ error: 'Email, full name, and department are required.' });
    }

    const doc = await db.nominateDoctor({
      email,
      fullName,
      department,
      roomNumber: roomNumber || 'Consultation Suite',
      mmcNumber: mmcNumber || `MMC-${Math.floor(10000 + Math.random() * 90000)}`,
      employmentType: employmentType || 'RESIDENT',
      role: 'doctor',
      facility_id: Number(facility_id || facilityId || 1),
      nominated_by: nominated_by || nominatedBy || 'doctor'
    });

    return res.json({ success: true, message: 'Doctor nominated. Pending Admin approval.', doc });
  } catch (err: any) {
    console.error("Doctor nomination error:", err);
    return res.status(500).json({ error: 'Failed to nominate doctor.' });
  }
});

// 3. Admin 直接添加医生 -> 直接 ACTIVE
router.post('/doctor/direct-add', async (req, res) => {
  try {
    const { email, fullName, department, roomNumber, mmcNumber, employmentType, facility_id, facilityId } = req.body;
    if (!email || !fullName || !department) {
      return res.status(400).json({ error: 'Email, full name, and department are required.' });
    }

    const doc = await db.directAddDoctor({
      email,
      fullName,
      department,
      roomNumber: roomNumber || 'Consultation Suite',
      mmcNumber: mmcNumber || `MMC-${Math.floor(10000 + Math.random() * 90000)}`,
      employmentType: employmentType || 'RESIDENT',
      role: 'doctor',
      facility_id: Number(facility_id || facilityId || 1)
    });

    return res.json({ success: true, message: 'Doctor activated directly.', doc });
  } catch (err: any) {
    console.error("Doctor direct add error:", err);
    return res.status(500).json({ error: 'Failed to add doctor.' });
  }
});

// 4. Admin 查看本院区所有待办审批 (Pending Approvals Workflow)
router.get('/pending-items', async (req, res) => {
  try {
    const { facilityId } = req.query;
    const facId = facilityId ? Number(facilityId) : undefined;

    const pendingDepartments = await db.getPendingDepartments(facId);
    const pendingDoctors = await db.getPendingDoctors(facId);

    return res.json({
      success: true,
      pendingDepartments,
      pendingDoctors,
      totalPending: pendingDepartments.length + pendingDoctors.length
    });
  } catch (err: any) {
    console.error("Pending items error:", err);
    return res.status(500).json({ error: 'Failed to fetch pending items.' });
  }
});

// 5. Admin 批准或驳回 (Approve or Reject)
router.patch('/decide/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params; // type: 'department' | 'doctor'
    const { decision } = req.body;   // 'ACTIVE' | 'REJECTED'

    if (decision !== 'ACTIVE' && decision !== 'REJECTED') {
      return res.status(400).json({ error: "Decision must be 'ACTIVE' or 'REJECTED'." });
    }

    if (type === 'department') {
      await db.updateDepartmentStatus(id, decision);
    } else {
      await db.updateDoctorApprovalStatus(id, decision);
    }

    return res.json({ success: true, message: `Updated ${type} to ${decision}` });
  } catch (err: any) {
    console.error("Approval decide error:", err);
    return res.status(500).json({ error: 'Failed to update approval decision.' });
  }
});

export default router;
