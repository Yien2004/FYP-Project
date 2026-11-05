import { Router } from 'express';
import * as db from '../../db';
import { allPantaiDoctors } from '../../src/data/pantaiHospitalsData';

const router = Router();

// Facility name mapping
const FACILITY_MAP: Record<number, string> = {
  1: 'Pantai Hospital Penang (Main Hospital)',
  2: 'Pantai Heart & Wellness Pavilion',
  3: 'Pantai Premier Clinic & Day Surgery',
  4: 'Pantai Specialist Centre'
};

// 动态公共元数据接口 (获取所有已激活的科室及其在岗医生)
router.get('/active-departments-doctors', async (req, res) => {
  try {
    const { facilityId } = req.query;
    const facId = facilityId ? Number(facilityId) : 1;
    const facilityName = FACILITY_MAP[facId] || 'Pantai Hospital Penang (Main Hospital)';

    // 1. 从数据库/持久层拉取已激活的科室 (status = 'ACTIVE')
    const activeDepts = await db.getActiveDepartments(facId);

    // 2. 从医院名录拉取对应院区的在岗医生
    const baseDocs = allPantaiDoctors
      .filter((d: any) => d.hospital === facilityName || d.hospital.includes(facilityName))
      .map((d: any) => ({
        id: d.id,
        full_name: d.name,
        name: d.name,
        department: d.department,
        room_number: `Suite ${Math.floor(200 + Math.random() * 200)}`,
        facility_id: facId,
        employment_type: d.status?.toUpperCase() === 'SESSIONAL' ? 'SESSIONAL' : 'RESIDENT',
        status: 'ACTIVE'
      }));

    // 3. 加上通过 Admin 审批激活的新医生
    const approvedNewDocs = await db.getActiveDoctors(facId);
    const newDocsFormatted = approvedNewDocs.map((d: any) => ({
      id: d.id,
      full_name: d.fullName,
      name: d.fullName,
      department: d.department,
      room_number: d.roomNumber || 'Consultation Suite',
      facility_id: d.facility_id,
      employment_type: d.employmentType || 'RESIDENT',
      status: 'ACTIVE'
    }));

    const combinedDoctors = [...baseDocs, ...newDocsFormatted];

    return res.json({
      success: true,
      facilityId: facId,
      facilityName,
      departments: activeDepts,
      doctors: combinedDoctors
    });
  } catch (err: any) {
    console.error("Metadata active departments doctors error:", err);
    return res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Dynamic Active Departments for Facility (GET /api/departments/active?facilityId=X)
const handleGetActiveDepartments = async (req: any, res: any) => {
  try {
    const { facilityId } = req.query;
    const facId = facilityId ? Number(facilityId) : 1;
    const depts = await db.getActiveDepartments(facId);
    const facilityName = FACILITY_MAP[facId] || 'Pantai Hospital Penang (Main Hospital)';

    const doctorDepts = allPantaiDoctors
      .filter((d: any) => !facilityName || d.hospital === facilityName || d.hospital.includes(facilityName))
      .flatMap((d: any) => (d.department || '').split(',').map((s: string) => s.trim()))
      .filter(Boolean);

    const dbDeptNames = (depts || []).map((d: any) => typeof d === 'string' ? d : d.name).filter(Boolean);
    const combined = Array.from(new Set([...dbDeptNames, ...doctorDepts])).filter(Boolean).sort();

    return res.json({ success: true, departments: combined });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch active departments' });
  }
};

router.get('/active', handleGetActiveDepartments);
router.get('/departments/active', handleGetActiveDepartments);

export default router;
