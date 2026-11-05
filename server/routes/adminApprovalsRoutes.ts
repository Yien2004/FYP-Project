import { Router } from 'express';
import * as db from '../../db';
import { getHospitalByFacilityId } from '../../src/data/staffAccounts';

const router = Router();

/**
 * GET /api/admin/approvals/pending-requests
 * Retrieve all pending doctor nominations and department admission requests
 */
router.get('/pending-requests', async (req, res) => {
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
    console.error("Error fetching pending requests:", err.message);
    return res.status(500).json({ error: 'Failed to retrieve pending approval items.' });
  }
});

/**
 * POST /api/admin/approvals/direct-doctor
 * Admin directly onboards an active physician into an existing active department
 */
router.post('/direct-doctor', async (req, res) => {
  try {
    const { email, password, fullName, department, roomNumber, facilityId, facility_id } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and doctor name are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();
    const cleanDept = department ? String(department).trim() : 'General Medicine';
    const cleanRoom = roomNumber ? String(roomNumber).trim() : 'Consultation Room 301';
    const facId = Number(facilityId || facility_id || 1);
    const hospitalName = getHospitalByFacilityId(facId);

    // 1. Create or sync auth user via Supabase Auth so doctor can log in immediately without pending approval
    if (password) {
      try {
        await db.registerUser(cleanEmail, String(password).trim(), {
          fullName: cleanName,
          role: 'Doctor',
          approved: true,
          hospital: hospitalName,
          facility_id: facId,
          department: cleanDept,
          room_number: cleanRoom
        });
      } catch (authErr: any) {
        console.warn("Auth account registration note (may already exist):", authErr.message);
      }
    }

    // Ensure existing or newly registered auth user has approved: true and complete profile metadata
    try {
      const allUsers = await db.listAllAuthUsers();
      const existing = allUsers.find((u: any) => (u.email || '').toLowerCase() === cleanEmail);
      if (existing) {
        await db.updateAuthUser(existing.id, {
          user_metadata: {
            ...(existing.user_metadata || {}),
            full_name: cleanName,
            role: 'Doctor',
            approved: true,
            status: 'Active',
            hospital: hospitalName,
            facility_id: facId,
            department: cleanDept,
            room_number: cleanRoom
          }
        });
      }
    } catch (metaErr: any) {
      console.warn("Could not sync auth metadata for onboarded doctor:", metaErr.message);
    }

    const doc = await db.directAddDoctor({
      email: cleanEmail,
      fullName: cleanName,
      department: cleanDept,
      roomNumber: cleanRoom,
      mmcNumber: `MMC-${Math.floor(10000 + Math.random() * 90000)}`,
      employmentType: 'RESIDENT',
      role: 'doctor',
      facility_id: facId
    });

    return res.json({
      success: true,
      message: `Doctor ${cleanName} created and activated successfully.`,
      doctor: doc
    });
  } catch (err: any) {
    console.error("Error onboarding doctor:", err.message);
    return res.status(500).json({ error: 'Failed to onboard doctor.' });
  }
});

/**
 * POST /api/admin/approvals/direct-department-with-doctor
 * Admin directly adds a new department along with its founding lead specialist
 */
router.post('/direct-department-with-doctor', async (req, res) => {
  try {
    const { facilityId, facility_id, departmentName, description, leadDoctor } = req.body;
    const facId = Number(facilityId || facility_id || 1);
    const hospitalName = getHospitalByFacilityId(facId);

    if (!departmentName) {
      return res.status(400).json({ error: 'Department name is required.' });
    }

    // 1. Create Department directly with ACTIVE status
    const dept = await db.directAddDepartment({
      facility_id: facId,
      name: String(departmentName).trim(),
      description: description ? String(description).trim() : '',
      requested_by: 'admin'
    });

    // 2. If leadDoctor details are provided, onboard the lead doctor immediately
    let leadDoc = null;
    if (leadDoctor && leadDoctor.fullName && leadDoctor.email) {
      const cleanEmail = String(leadDoctor.email).trim().toLowerCase();
      const cleanName = String(leadDoctor.fullName).trim();
      const cleanRoom = leadDoctor.roomNumber ? String(leadDoctor.roomNumber).trim() : 'Consultation Room 301';

      if (leadDoctor.password) {
        try {
          await db.registerUser(cleanEmail, String(leadDoctor.password).trim(), {
            fullName: cleanName,
            role: 'Doctor',
            approved: true,
            hospital: hospitalName,
            facility_id: facId,
            department: String(departmentName).trim(),
            room_number: cleanRoom
          });
        } catch (authErr: any) {
          console.warn("Lead doctor auth account note (may already exist):", authErr.message);
        }
      }

      try {
        const allUsers = await db.listAllAuthUsers();
        const existing = allUsers.find((u: any) => (u.email || '').toLowerCase() === cleanEmail);
        if (existing) {
          await db.updateAuthUser(existing.id, {
            user_metadata: {
              ...(existing.user_metadata || {}),
              full_name: cleanName,
              role: 'Doctor',
              approved: true,
              status: 'Active',
              hospital: hospitalName,
              facility_id: facId,
              department: String(departmentName).trim(),
              room_number: cleanRoom
            }
          });
        }
      } catch (metaErr: any) {
        console.warn("Could not sync auth metadata for lead doctor:", metaErr.message);
      }

      leadDoc = await db.directAddDoctor({
        email: cleanEmail,
        fullName: cleanName,
        department: String(departmentName).trim(),
        roomNumber: cleanRoom,
        mmcNumber: `MMC-${Math.floor(10000 + Math.random() * 90000)}`,
        employmentType: 'RESIDENT',
        role: 'doctor',
        facility_id: facId
      });
    }

    return res.json({
      success: true,
      message: `Department '${departmentName}' and lead specialist created successfully.`,
      department: dept,
      leadDoctor: leadDoc
    });
  } catch (err: any) {
    console.error("Error creating department with doctor:", err.message);
    return res.status(500).json({ error: 'Failed to create department.' });
  }
});

/**
 * PATCH /api/admin/approvals/decide/:targetType/:id
 * Decide on pending department or nominated doctor: ACTIVE or REJECTED
 */
const handleDecision = async (req: any, res: any) => {
  try {
    const targetType = req.params.targetType || req.params.type;
    const { id } = req.params;
    const { decision } = req.body;

    if (decision !== 'ACTIVE' && decision !== 'REJECTED') {
      return res.status(400).json({ error: "Decision must be 'ACTIVE' or 'REJECTED'." });
    }

    if (targetType === 'department') {
      await db.updateDepartmentStatus(id, decision);
    } else {
      await db.updateDoctorApprovalStatus(id, decision);
      if (decision === 'ACTIVE') {
        try {
          const store = db.loadOpsStore();
          const doc = store.nominatedDoctors?.find((d: any) => d.id === id);
          if (doc && doc.email) {
            const allUsers = await db.listAllAuthUsers();
            const existing = allUsers.find((u: any) => (u.email || '').toLowerCase() === doc.email.toLowerCase().trim());
            if (existing) {
              await db.updateAuthUser(existing.id, {
                user_metadata: {
                  ...(existing.user_metadata || {}),
                  approved: true,
                  status: 'Active'
                }
              });
            }
          }
        } catch (e: any) {
          console.warn("Could not sync doctor approval status to auth user:", e.message);
        }
      }
    }

    return res.json({
      success: true,
      message: `${targetType === 'department' ? 'Department' : 'Physician'} status successfully updated to ${decision}.`
    });
  } catch (err: any) {
    console.error("Decision error:", err.message);
    return res.status(500).json({ error: 'Failed to record decision.' });
  }
};

router.patch('/decide/:targetType/:id', handleDecision);
router.patch('/decide/:type/:id', handleDecision);

export default router;
