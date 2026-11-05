import { Router } from 'express';
import * as db from '../../db';

const router = Router();

// Admin adds facility holiday and cascade-cancels/locks active bookings on that date
const handleAddHoliday = async (req: any, res: any) => {
  try {
    const { facilityId, holidayDate, title, description, createdBy } = req.body;
    if (!facilityId || !holidayDate || !title) {
      return res.status(400).json({ error: 'Facility ID, holiday date, and title are required.' });
    }

    const facId = Number(facilityId);
    const holiday = await db.addFacilityHoliday({
      facility_id: facId,
      holiday_date: holidayDate,
      title: String(title).trim(),
      description: description || '',
      created_by: createdBy || 'admin'
    });

    // Cascade lock: Mark all existing active appointments on that date as CANCELLED_HOLIDAY
    let impactedCount = 0;
    try {
      const allApts = await db.getAppointments();
      const affected = allApts.filter((a: any) => a.date === holidayDate && (Number(a.facility_id) || 1) === facId && a.status !== 'Completed' && a.status !== 'Cancelled');
      for (const apt of affected) {
        await db.updateAppointment(apt.id, {
          status: 'CANCELLED_HOLIDAY',
          remarks: `[Holiday Closed: ${title}] Slot closed due to facility holiday. Pending patient reschedule.`
        });
        impactedCount++;
      }
    } catch (e: any) {}

    return res.json({ success: true, message: `Holiday scheduled for ${holidayDate}.`, holiday, impactedCount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create holiday.' });
  }
};

router.post('/add', handleAddHoliday);
router.post('/create', handleAddHoliday);

// 获取所有假期 (Get all holidays)
const handleGetHolidays = async (req: any, res: any) => {
  try {
    const { facilityId } = req.query;
    const facId = facilityId ? Number(facilityId) : undefined;
    const holidays = await db.getFacilityHolidays(facId);

    // Also attach count of impacted appointments
    const allApts = await db.getAppointments();
    const holidaysWithStats = holidays.map((h: any) => {
      const impacted = allApts.filter((a: any) => 
        a.date === h.holiday_date && 
        (Number(a.facility_id) === Number(h.facility_id) || !a.facility_id) && 
        (a.status === 'CANCELLED_HOLIDAY' || (a.remarks && a.remarks.includes('Holiday')))
      ).length;
      return { ...h, impactedCount: impacted };
    });

    return res.json({ success: true, holidays: holidaysWithStats });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get holidays.' });
  }
};

router.get('/', handleGetHolidays);
router.get('/list', handleGetHolidays);


// 删除假期 (Delete holiday)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteFacilityHoliday(id);
    return res.json({ success: true, message: 'Holiday deleted.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete holiday.' });
  }
});

// 患者挂号日历检查：查询院区某月份的所有闭馆日期，前端将其 Disable
router.get('/blocked-dates', async (req, res) => {
  try {
    const { facilityId } = req.query;
    const facId = facilityId ? Number(facilityId) : undefined;
    const holidays = await db.getFacilityHolidays(facId);
    return res.json({
      success: true,
      blockedDates: holidays.map((h: any) => ({
        holiday_date: h.holiday_date,
        date: h.holiday_date,
        title: h.title,
        description: h.description,
        facility_id: h.facility_id
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve blocked dates.' });
  }
});

export default router;
