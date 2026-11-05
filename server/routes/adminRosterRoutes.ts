import { Router } from 'express';
import * as db from '../../db';

const router = Router();

// Helper: expand date range [startDate, endDate] into an array of YYYY-MM-DD
function expandDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  if (!startDateStr) return dates;
  try {
    const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
    const curr = new Date(startDateStr);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
  } catch (e) {}
  return dates;
}

// 1. 获取医生的完整排班配置 (Weekly Roster + Custom Sessions)
router.get(['/doctor/:id/schedule', '/:id/schedule'], async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await db.findDoctorProfile(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const weeklyRoster = await db.getDoctorWeeklyRoster(doctor.id, doctor.employmentType);
    const customSessions = await db.getDoctorCustomSessions(doctor.id, false);

    return res.json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        employmentType: doctor.employmentType,
        defaultRoom: doctor.roomNumber,
        department: doctor.department,
        facilityId: doctor.facilityId
      },
      weeklyRoster,
      customSessions
    });
  } catch (err: any) {
    console.error("Failed to fetch doctor schedule:", err.message);
    return res.status(500).json({ error: 'Failed to fetch doctor schedule.' });
  }
});

// 2. Admin 更新 Resident 医生的周排班 (开关周几 / 改时段 / 改接诊限额)
router.post(['/doctor/:id/weekly-roster', '/:id/weekly-roster'], async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { rosters } = req.body; // Array of { day_of_week, is_active, start_time, end_time, max_patients }

    if (!Array.isArray(rosters)) {
      return res.status(400).json({ error: 'Rosters array is required.' });
    }

    const doctor = await db.findDoctorProfile(doctorId);
    const finalDocId = doctor ? doctor.id : doctorId;

    await db.saveDoctorWeeklyRoster(finalDocId, rosters);

    return res.json({ success: true, message: 'Weekly roster updated successfully.' });
  } catch (err: any) {
    console.error("Failed to update weekly roster:", err.message);
    return res.status(500).json({ error: 'Failed to update weekly roster.' });
  }
});

// 3. Admin 为 Sessional 医生按需开放出诊日期 (Open Session Slot)
router.post(['/doctor/:id/open-session', '/:id/open-session'], async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { sessionDate, startTime, endTime, roomNumber, maxCapacity, facilityId } = req.body;

    if (!sessionDate || !startTime || !endTime || !roomNumber) {
      return res.status(400).json({ error: 'Date, times, and consultation room are required.' });
    }

    const doctor = await db.findDoctorProfile(doctorId);
    const finalDocId = doctor ? doctor.id : doctorId;
    const finalFacId = facilityId || (doctor ? doctor.facilityId : 1);

    const session = await db.createDoctorCustomSession({
      doctor_id: finalDocId,
      facility_id: Number(finalFacId),
      session_date: String(sessionDate).trim(),
      start_time: String(startTime).trim(),
      end_time: String(endTime).trim(),
      room_number: String(roomNumber).trim(),
      max_capacity: Number(maxCapacity) || 15,
      status: 'OPEN'
    });

    return res.json({
      success: true,
      message: 'Session opened successfully for booking.',
      session
    });
  } catch (err: any) {
    console.error("Failed to open session:", err.message);
    return res.status(500).json({ error: 'Failed to open clinic session.' });
  }
});

// 3b. Admin 为 Sessional 医生设置每周周期排班 (Every Week: e.g. Every Tuesday)
router.post(['/doctor/:id/weekly-session', '/:id/weekly-session'], async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { dayOfWeek, startTime, endTime, roomNumber, isActive = true } = req.body;
    const doctor = await db.findDoctorProfile(doctorId);
    const finalDocId = doctor ? doctor.id : doctorId;

    const currentWeekly = await db.getDoctorWeeklyRoster(finalDocId, doctor?.employmentType || 'SESSIONAL');
    const targetDay = Number(dayOfWeek);

    const updated = currentWeekly.map(r => {
      if (r.day_of_week === targetDay) {
        return {
          ...r,
          is_active: Boolean(isActive),
          start_time: startTime || r.start_time || '09:00',
          end_time: endTime || r.end_time || '13:00',
          max_patients: 20
        };
      }
      return r;
    });

    if (!updated.some(r => r.day_of_week === targetDay)) {
      updated.push({
        doctor_id: finalDocId,
        day_of_week: targetDay,
        is_active: Boolean(isActive),
        start_time: startTime || '09:00',
        end_time: endTime || '13:00',
        max_patients: 20
      });
    }

    await db.saveDoctorWeeklyRoster(finalDocId, updated);
    return res.json({ success: true, message: 'Weekly recurring clinic schedule saved.', weeklyRoster: updated });
  } catch (err: any) {
    console.error("Failed to save weekly session:", err.message);
    return res.status(500).json({ error: 'Failed to save weekly session.' });
  }
});

// 3c. Admin 关闭 Sessional 医生的每周周期排班
router.delete(['/doctor/:id/weekly-session/:dayOfWeek', '/:id/weekly-session/:dayOfWeek'], async (req, res) => {
  try {
    const doctorId = req.params.id;
    const targetDay = Number(req.params.dayOfWeek);
    const doctor = await db.findDoctorProfile(doctorId);
    const finalDocId = doctor ? doctor.id : doctorId;

    const currentWeekly = await db.getDoctorWeeklyRoster(finalDocId, doctor?.employmentType || 'SESSIONAL');
    const updated = currentWeekly.map(r => {
      if (r.day_of_week === targetDay) {
        return { ...r, is_active: false };
      }
      return r;
    });

    await db.saveDoctorWeeklyRoster(finalDocId, updated);
    return res.json({ success: true, message: 'Weekly recurring schedule closed.' });
  } catch (err: any) {
    console.error("Failed to delete weekly session:", err.message);
    return res.status(500).json({ error: 'Failed to delete weekly session.' });
  }
});

// 4. Admin 更新特约出诊 (修改时段/延长出诊/改诊室/限额/状态)
router.put(['/session/:id', '/doctor/session/:id'], async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { sessionDate, startTime, endTime, roomNumber, maxCapacity, status } = req.body;

    const updates: any = {};
    if (sessionDate) updates.session_date = String(sessionDate).trim();
    if (startTime) updates.start_time = String(startTime).trim();
    if (endTime) updates.end_time = String(endTime).trim();
    if (roomNumber) updates.room_number = String(roomNumber).trim();
    if (maxCapacity !== undefined) updates.max_capacity = Number(maxCapacity);
    if (status) updates.status = status;

    const updated = await db.updateDoctorCustomSession(sessionId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    return res.json({
      success: true,
      message: 'Session updated successfully.',
      session: updated
    });
  } catch (err: any) {
    console.error("Failed to update session:", err.message);
    return res.status(500).json({ error: 'Failed to update clinic session.' });
  }
});

// 5. Admin 删除/注销特约出诊
router.delete(['/session/:id', '/doctor/session/:id'], async (req, res) => {
  try {
    await db.deleteDoctorCustomSession(req.params.id);
    return res.json({ success: true, message: 'Session slot closed.' });
  } catch (err: any) {
    console.error("Failed to delete session:", err.message);
    return res.status(500).json({ error: 'Failed to delete session.' });
  }
});

// 6. 患者端挂号日历动态可用日期计算接口 (Calculate available dates for booking calendar)
router.get(['/doctor/:id/available-dates', '/:id/available-dates'], async (req, res) => {
  try {
    const doctorParam = req.params.id;
    const doctorNameQuery = req.query.doctorName as string;
    const target = doctorNameQuery || doctorParam;

    const doctor = await db.findDoctorProfile(target);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // 1. 获取公假与医生请假 (Facility Holidays & Doctor Leaves)
    const holidays = await db.getFacilityHolidays(doctor.facilityId);
    const holidayDates = new Set(holidays.map((h: any) => h.holiday_date || h.date));

    const leaves = await db.getDoctorLeaves(doctor.facilityId, doctor.id);
    const leaveDates = new Set<string>();
    leaves.forEach((l: any) => {
      const dates = expandDateRange(l.start_date, l.end_date);
      dates.forEach(d => leaveDates.add(d));
    });

    const combinedBlocked = Array.from(new Set([...holidayDates, ...leaveDates]));

    // 2. 根据 Resident 或 Sessional 分流
    if (doctor.employmentType === 'SESSIONAL') {
      // Sessional 医生：支持 One Day Only (customSessions) 与 Every Week (weeklyRoster)
      const openSessions = await db.getDoctorCustomSessions(doctor.id, true);
      const validSessions = openSessions.filter(
        s => s.status === 'OPEN' && !holidayDates.has(s.session_date) && !leaveDates.has(s.session_date)
      );
      const customDates = validSessions.map(s => s.session_date);

      // Check weekly roster for Sessional doctor
      const weeklyRoster = await db.getDoctorWeeklyRoster(doctor.id, 'SESSIONAL');
      const activeWeeklyDays = weeklyRoster.filter(r => r.is_active);

      // Expand active weekly recurring days for the next 90 days (3 months)
      const weeklyDates: string[] = [];
      const generatedSessions: any[] = [];
      if (activeWeeklyDays.length > 0) {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 90);
        const curr = new Date(today);
        while (curr <= maxDate) {
          const jsDay = curr.getDay();
          const isoDay = jsDay === 0 ? 7 : jsDay;
          const matchedDay = activeWeeklyDays.find(r => r.day_of_week === isoDay);
          if (matchedDay) {
            const dateStr = curr.toISOString().split('T')[0];
            if (!holidayDates.has(dateStr) && !leaveDates.has(dateStr)) {
              weeklyDates.push(dateStr);
              if (!validSessions.some(s => s.session_date === dateStr)) {
                generatedSessions.push({
                  id: `weekly-${doctor.id}-${dateStr}`,
                  doctor_id: doctor.id,
                  facility_id: doctor.facilityId,
                  session_date: dateStr,
                  start_time: matchedDay.start_time || '09:00',
                  end_time: matchedDay.end_time || '13:00',
                  room_number: doctor.roomNumber || 'Consultation Suite 204',
                  max_capacity: 20,
                  status: 'OPEN',
                  is_weekly: true
                });
              }
            }
          }
          curr.setDate(curr.getDate() + 1);
        }
      }

      const allValidDates = Array.from(new Set([...customDates, ...weeklyDates])).sort();
      const allSessions = [...validSessions, ...generatedSessions].sort((a, b) => a.session_date.localeCompare(b.session_date));

      return res.json({
        success: true,
        type: 'SESSIONAL',
        doctor: {
          id: doctor.id,
          name: doctor.name,
          employmentType: 'SESSIONAL',
          department: doctor.department
        },
        availableDates: allValidDates,
        openSessions: allSessions,
        weeklyRoster: activeWeeklyDays,
        blockedDates: combinedBlocked
      });
    } else {
      // Resident 医生：周一至周五全开，按需微调
      const weeklyRoster = await db.getDoctorWeeklyRoster(doctor.id, 'RESIDENT');
      const activeDaysOfWeek = weeklyRoster.filter(r => r.is_active).map(r => r.day_of_week);

      return res.json({
        success: true,
        type: 'RESIDENT',
        doctor: {
          id: doctor.id,
          name: doctor.name,
          employmentType: 'RESIDENT',
          department: doctor.department
        },
        activeDaysOfWeek,
        weeklyRoster,
        blockedDates: combinedBlocked
      });
    }
  } catch (err: any) {
    console.error("Failed to calculate available dates:", err.message);
    return res.status(500).json({ error: 'Failed to calculate available dates.' });
  }
});

// 7. Summary of active scheduled doctors (to filter unscheduled sessional doctors from Step 3)
router.get('/active-summary', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const store = db.loadOpsStore();
    
    // Active custom sessions (status OPEN, future)
    const activeSessions = (store.customSessions || []).filter(
      s => s.status === 'OPEN' && s.session_date >= todayStr
    );

    // Active weekly rosters
    const activeWeeklyRosters = (store.weeklyRosters || []).filter(r => r.is_active);

    const activeDocIds = new Set<string>();
    const activeDocNames = new Set<string>();

    activeSessions.forEach(s => {
      activeDocIds.add(String(s.doctor_id).toLowerCase());
    });

    activeWeeklyRosters.forEach(r => {
      activeDocIds.add(String(r.doctor_id).toLowerCase());
    });

    const users = await db.getUsers();
    users.forEach((u: any) => {
      const uIdLower = String(u.id || '').toLowerCase();
      const uFullName = u.fullName || u.name || '';
      const uNameLower = String(uFullName).toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();
      
      if (activeDocIds.has(uIdLower) || activeDocIds.has(String(uFullName).toLowerCase())) {
        activeDocNames.add(uNameLower);
        activeDocIds.add(uIdLower);
      }
    });

    return res.json({
      success: true,
      sessionalDoctorIds: Array.from(activeDocIds),
      sessionalDoctorNames: Array.from(activeDocNames)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
