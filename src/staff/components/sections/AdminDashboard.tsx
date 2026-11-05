import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Users, 
  CalendarCheck2, 
  Filter,
  Calendar,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { getStaffAccountByEmail, PANTAI_FACILITIES, RBAC_STAFF_ACCOUNTS, getFacilityIdByHospital } from '../../../data/staffAccounts';

interface AdminDashboardProps {
  isSuperAdmin?: boolean;
}

export default function AdminDashboard({ isSuperAdmin = false }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);

  // Demographics counts for KPI cards
  const [clinicianCount, setClinicianCount] = useState<number>(0);
  const [patientCount, setPatientCount] = useState<number>(0);

  // Bound Admin Account & Facility Scoping
  const loggedEmail = localStorage.getItem('lifelink_user_email') || '';
  const adminAccount = React.useMemo(() => getStaffAccountByEmail(loggedEmail), [loggedEmail]);
  const defaultFacId = adminAccount?.facility_id || 1;
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | 'ALL'>(isSuperAdmin ? 'ALL' : defaultFacId);
  const facilityId = selectedFacilityId;

  // Department Filter
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  // Malaysian Date Helpers (GMT+8)
  const getMalaysianDateStr = (offsetDays: number = 0) => {
    try {
      const d = new Date();
      if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(d);
    } catch (e) {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    }
  };

  const todayDateStr = getMalaysianDateStr(0);
  const yesterdayDateStr = getMalaysianDateStr(-1);

  const isSlotOverdue = (dateStr?: string, timeSlot?: string) => {
    if (!dateStr) return false;
    if (dateStr < todayDateStr) return true;
    if (dateStr > todayDateStr) return false;
    if (!timeSlot) return false;
    const now = new Date();
    const myFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = myFormatter.formatToParts(now);
    const p: Record<string, string> = {};
    parts.forEach(x => { p[x.type] = x.value; });
    const currentMins = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
    const dashSplit = timeSlot.split(/[-–—]/);
    const targetStr = (dashSplit.length > 1 ? dashSplit[1] : dashSplit[0]).trim();
    const isPM = /pm/i.test(targetStr);
    const isAM = /am/i.test(targetStr);
    const match = targetStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      return currentMins >= (h * 60 + m);
    }
    return false;
  };

  // Date Filter State (Defaults to Today's Date in Malaysia)
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [dayAppointments, setDayAppointments] = useState<any[]>([]);

  // SVG Chart data
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);
  const [selectedHospital, setSelectedHospital] = useState(() => {
    return adminAccount?.hospital || 'ALL';
  });
  const [appointments, setAppointments] = useState<any[]>([]);

  // Real Operational Flow Rates
  const [opsMetrics, setOpsMetrics] = useState<{
    totalBookings: number;
    cancelledCount: number;
    checkedInCount: number;
    checkInRate: string;
    absentRate: string;
    noShowRate: string;
    waitingCount: number;
    inConsultation: number;
    completed: number;
  }>({
    totalBookings: 0,
    cancelledCount: 0,
    checkedInCount: 0,
    checkInRate: '0.0%',
    absentRate: '0.0%',
    noShowRate: '0.0%',
    waitingCount: 0,
    inConsultation: 0,
    completed: 0,
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-admin-email': loggedEmail || 'pantaipenangadmin@gmail.com'
  };

  useEffect(() => {
    if (adminAccount?.hospital) {
      setSelectedHospital(adminAccount.hospital);
    }
  }, [adminAccount]);

  const loadOpsMetrics = async (
    dept: string = selectedDepartment,
    date: string = selectedDate,
    overrideFacilityId?: number | 'ALL'
  ) => {
    const activeFac = overrideFacilityId !== undefined ? overrideFacilityId : (isSuperAdmin ? selectedFacilityId : facilityId);
    const facParam = `facilityId=${activeFac}`;
    const deptParam = dept !== 'ALL' ? `&department=${encodeURIComponent(dept)}` : '';
    const dateParam = date ? `&date=${encodeURIComponent(date)}` : '';
    try {
      const res = await fetch(`/api/admin/metrics?${facParam}${deptParam}${dateParam}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        const m = data.metrics || data;
        setOpsMetrics({
          totalBookings: m.totalBookings || 0,
          cancelledCount: m.cancelledCount || 0,
          checkedInCount: m.checkedInCount || 0,
          checkInRate: m.checkInRate || '0.0%',
          absentRate: m.absentRate || m.noShowRate || '0.0%',
          noShowRate: m.noShowRate || m.absentRate || '0.0%',
          waitingCount: m.waitingCount || 0,
          inConsultation: m.inConsultation || 0,
          completed: m.completed || 0,
        });
        if (Array.isArray(data.appointments)) {
          setDayAppointments(data.appointments);
        }
      }
    } catch (err) {
      console.warn("Failed to load ops metrics", err);
    }
  };

  const loadTelemetry = async () => {
    setLoading(true);

    const activeFac = isSuperAdmin ? selectedFacilityId : defaultFacId;
    let loadedUsers: any[] = [];
    let loadedApts: any[] = [];

    // 1. Registered users demographics from Supabase Auth
    try {
      const usersRes = await fetch("/api/admin/users", { headers: authHeaders });
      if (usersRes.ok) {
        const users = await usersRes.json();
        if (Array.isArray(users)) {
          loadedUsers = users;
        }
      }
    } catch (err) {
      console.warn("Failed to load user demographics", err);
    }

    // 2. Load appointments for trend charting
    try {
      const aptsRes = await fetch("/api/appointments");
      if (aptsRes.ok) {
        const apts = await aptsRes.json();
        if (Array.isArray(apts)) {
          loadedApts = apts;
          setAppointments(apts);
        }
      }
    } catch (err) {
      console.warn("Failed to aggregate appointment trends", err);
    }

    // 3. Compute Clinician Count based on Active Facility
    if (activeFac === 'ALL') {
      const totalDocs = RBAC_STAFF_ACCOUNTS.filter(a => a.role === 'doctor' || a.role === 'Doctor').length;
      setClinicianCount(totalDocs || 160);
    } else {
      const branchDocs = RBAC_STAFF_ACCOUNTS.filter(a => 
        (a.role === 'doctor' || a.role === 'Doctor') && a.facility_id === activeFac
      ).length;
      setClinicianCount(branchDocs);
    }

    // 4. Compute Patient Count:
    // If Super Admin viewing all: total global registered platform patients
    // If Branch Admin (or specific facility): unique patients who have made an appointment at least once at this branch!
    if (isSuperAdmin && activeFac === 'ALL') {
      const patients = loadedUsers.filter(u => (u.role || '').toLowerCase() === 'patient').length;
      setPatientCount(patients);
    } else {
      const branchAppointments = loadedApts.filter((a: any) => {
        const aptFacId = a.facility_id ? Number(a.facility_id) : getFacilityIdByHospital(a.clinic || a.hospital);
        return aptFacId === activeFac;
      });
      const uniqueBranchPatients = new Set<string>();
      branchAppointments.forEach((a: any) => {
        const key = (a.patientEmail || a.patientName || a.userId || '').toLowerCase().trim();
        if (key) uniqueBranchPatients.add(key);
      });
      setPatientCount(uniqueBranchPatients.size);
    }

    // 5. Load active departments for dropdown filter
    try {
      const deptRes = await fetch(`/api/departments/active?facilityId=${facilityId}`);
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        if (deptData.success && Array.isArray(deptData.departments)) {
          setAvailableDepartments(deptData.departments);
        }
      }
    } catch (err) {
      console.warn("Failed to load active departments", err);
    }

    await loadOpsMetrics(selectedDepartment, selectedDate);
    setLoading(false);
  };

  useEffect(() => {
    loadTelemetry();
  }, [facilityId]);

  // Handle department filter selection
  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    loadOpsMetrics(dept, selectedDate);
  };

  // Handle date filter selection
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadOpsMetrics(selectedDepartment, date);
  };

  // Appointment monthly aggregation
  useEffect(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsList = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsList.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        count: 0
      });
    }

    appointments.forEach((a: any) => {
      if (!a.date) return;
      if (selectedHospital !== 'ALL') {
        const aptHosp = (a.clinic || a.hospital || '').toLowerCase().trim();
        const selHosp = selectedHospital.toLowerCase().trim();
        if (aptHosp !== selHosp) return;
      }

      const [y, m] = a.date.split('-');
      const aptYear = parseInt(y, 10);
      const aptMonth = parseInt(m, 10);
      const match = monthsList.find(mObj => mObj.year === aptYear && mObj.monthNum === aptMonth);
      if (match) match.count++;
    });

    setMonthlyData(monthsList.map(m => ({ month: m.month, count: m.count })));
  }, [appointments, selectedHospital]);

  const dateDescription = selectedDate === todayDateStr 
    ? 'Today' 
    : (selectedDate === yesterdayDateStr 
        ? 'Yesterday' 
        : (selectedDate === 'ALL' ? 'All Dates' : selectedDate));

  const activeFac = isSuperAdmin ? selectedFacilityId : defaultFacId;

  const adminMetrics = [
    { 
      label: 'Active Clinicians', 
      value: clinicianCount.toString(), 
      icon: Stethoscope, 
      color: 'text-amber-700 bg-amber-50',
      caption: isSuperAdmin && activeFac === 'ALL' ? 'Across all 4 facilities' : 'Registered branch specialists'
    },
    { 
      label: isSuperAdmin && activeFac === 'ALL' ? 'Registered Patients' : 'Branch Patients', 
      value: patientCount.toString(), 
      icon: Users, 
      color: 'text-neutral-700 bg-neutral-100',
      caption: isSuperAdmin && activeFac === 'ALL' ? 'Platform registered accounts' : 'With bookings at this branch'
    },
    { 
      label: `${dateDescription} Consults`, 
      value: opsMetrics.totalBookings.toString(), 
      icon: CalendarCheck2, 
      color: 'text-emerald-700 bg-emerald-50',
      caption: 'Outpatient queue slots'
    },
  ];

  const chartData = monthlyData.length > 0 ? monthlyData : [
    { month: 'May', count: 0 },
    { month: 'Jun', count: 0 },
    { month: 'Jul', count: 0 },
    { month: 'Aug', count: 0 },
    { month: 'Sep', count: 0 },
    { month: 'Oct', count: 0 }
  ];
  const maxVal = Math.max(...chartData.map(d => d.count), 5);
  const height = 150;
  const width = 500;
  const padding = 30;

  const points = chartData.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
    const y = height - padding - (d.count / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  return (
    <div className="space-y-6 text-neutral-800 font-sans pb-12">
      {/* 1. Core Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adminMetrics.map((met, idx) => {
          const Icon = met.icon;
          return (
            <div key={idx} className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${met.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">{met.label}</span>
                <span className="text-xl font-extrabold text-neutral-900 tracking-tight block mt-1">{met.value}</span>
                {met.caption && (
                  <span className="text-[10px] text-neutral-400 block mt-0.5 truncate">{met.caption}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Department & Date Filter + Clinical Operational Flow Strip */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider">
              Clinical Operational Flow & Attendance
            </h3>
          </div>

          {/* Filters Bar: Date & Department (Right Aligned) */}
          <div className="flex flex-wrap items-center justify-end gap-3 ml-auto">
            
            {/* Date Quick Toggles & Picker */}
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleDateChange(todayDateStr)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedDate === todayDateStr 
                    ? 'bg-neutral-900 text-white shadow-xs' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleDateChange(yesterdayDateStr)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedDate === yesterdayDateStr 
                    ? 'bg-neutral-900 text-white shadow-xs' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleDateChange('ALL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedDate === 'ALL' 
                    ? 'bg-neutral-900 text-white shadow-xs' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                All
              </button>

              <div className="relative flex items-center ml-1">
                <input
                  type="date"
                  value={selectedDate === 'ALL' ? '' : selectedDate}
                  onChange={(e) => {
                    if (e.target.value) handleDateChange(e.target.value);
                  }}
                  className="bg-white border border-neutral-200 rounded-lg px-2 py-0.5 text-xs text-neutral-800 font-semibold outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer h-7"
                />
              </div>
            </div>

            {/* Facility Scope: Super Admin selector vs Branch Admin locked badge */}
            {isSuperAdmin ? (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-amber-700 whitespace-nowrap flex items-center gap-1 font-mono">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Facility:</span>
                </label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                    setSelectedFacilityId(val);
                    loadOpsMetrics(selectedDepartment, selectedDate, val);
                  }}
                  className="bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1 text-xs text-neutral-900 font-bold outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 h-9 cursor-pointer"
                >
                  <option value="ALL">All 4 Facilities (Group Consolidated)</option>
                  {PANTAI_FACILITIES.map(f => (
                    <option key={f.id} value={f.id}>{f.shortTag} ({f.location})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700">
                <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate max-w-[150px]">{adminAccount?.hospital || "Branch Admin"}</span>
              </div>
            )}

            {/* Department Filter Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-neutral-500 whitespace-nowrap flex items-center gap-1">
                <Filter className="w-3 h-3 text-neutral-400" />
                <span className="hidden sm:inline">Dept:</span>
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1 text-xs text-neutral-800 font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 h-9 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {availableDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Operational Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 pt-1">
          <div className="pt-2 sm:pt-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Check-In Rate</span>
            <span className="text-base font-extrabold text-emerald-700 block mt-0.5">{opsMetrics.checkInRate}</span>
          </div>
          <div className="pt-2 sm:pt-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Waiting in Clinic</span>
            <span className={`text-base font-extrabold block mt-0.5 ${opsMetrics.waitingCount > 0 ? 'text-amber-600' : 'text-neutral-500'}`}>
              {opsMetrics.waitingCount}
            </span>
          </div>
          <div className="pt-2 sm:pt-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">In Consultation</span>
            <span className={`text-base font-extrabold block mt-0.5 ${opsMetrics.inConsultation > 0 ? 'text-blue-600' : 'text-neutral-500'}`}>
              {opsMetrics.inConsultation}
            </span>
          </div>
          <div className="pt-2 sm:pt-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Completed</span>
            <span className="text-base font-extrabold text-teal-600 block mt-0.5">{opsMetrics.completed}</span>
          </div>
          <div className="pt-2 sm:pt-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Absent Rate</span>
            <span className="text-base font-extrabold text-rose-600 block mt-0.5">{opsMetrics.absentRate}</span>
          </div>
          <div className="pt-2 sm:pt-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Cancelled</span>
            <span className="text-base font-extrabold text-neutral-500 block mt-0.5">{opsMetrics.cancelledCount}</span>
          </div>
        </div>

        {/* Detailed Encounter & Queue Breakdown */}
        <div className="pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-800">
              Encounter Flow Roster ({dateDescription})
            </span>
          </div>

          {dayAppointments.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-neutral-200/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/80 text-neutral-500 uppercase tracking-wider text-[10px] font-bold border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-3">Queue #</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Specialist & Dept</th>
                      <th className="py-2.5 px-3">Scheduled Slot</th>
                      <th className="py-2.5 px-3">Flow Status</th>
                      <th className="py-2.5 px-3">Arrival / Check-In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {dayAppointments.map((apt) => {
                      const norm = (apt.status || '').toUpperCase().replace(/[\s-]+/g, '_');
                      const overdue = isSlotOverdue(apt.date, apt.timeSlot);
                      const isCancelled = norm === 'CANCELLED' || norm === 'REJECTED' || norm.includes('CANCEL');
                      const isCompleted = !isCancelled && (norm === 'COMPLETED' || norm === 'DONE' || (overdue && (apt.checkedIn || norm === 'CHECKED_IN')));
                      const isInConsult = !isCancelled && !isCompleted && norm === 'IN_CONSULTATION';
                      const isWaiting = !isCancelled && !isCompleted && !isInConsult && !overdue && (apt.checkedIn || norm === 'CHECKED_IN');
                      const isAbsent = !isCancelled && !isCompleted && (norm === 'NO_SHOW' || norm === 'ABSENT' || norm === 'MISSING' || (overdue && !apt.checkedIn && norm !== 'CHECKED_IN'));

                      return (
                        <tr key={apt.id} className="hover:bg-neutral-50/50 transition">
                          <td className="py-2 px-3 font-mono font-extrabold text-neutral-900">
                            {apt.queueNumber}
                          </td>
                          <td className="py-2 px-3 font-bold text-neutral-800">
                            {apt.patientName}
                          </td>
                          <td className="py-2 px-3 text-neutral-600">
                            <div className="font-medium text-neutral-800">{apt.doctorName}</div>
                            <div className="text-[10px] text-neutral-400">{apt.specialty}</div>
                          </td>
                          <td className="py-2 px-3 text-neutral-700 font-mono text-[11px]">
                            {apt.timeSlot || 'Standard Slot'}
                          </td>
                          <td className="py-2 px-3">
                            {isCancelled ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300">
                                Cancelled
                              </span>
                            ) : isInConsult ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                In Consultation
                              </span>
                            ) : isWaiting ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Waiting in Clinic
                              </span>
                            ) : isCompleted ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Completed
                              </span>
                            ) : isAbsent ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Absent / Missed Slot
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                Scheduled (Pending Check-In)
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-neutral-500">
                            {isCancelled ? (
                              <span className="text-neutral-400 font-medium italic">Cancelled</span>
                            ) : apt.checkInTime ? (
                              <span className="font-medium text-neutral-700">{apt.checkInTime}</span>
                            ) : isAbsent ? (
                              <span className="text-rose-500/80 font-medium">Missed Slot</span>
                            ) : (
                              <span className="text-neutral-400 italic">Not Checked In Yet</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
                <Calendar className="w-6 h-6 text-neutral-350 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-neutral-700">No Patient Appointments on {dateDescription}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Select a different date or choose "All" to inspect historical queues.
                </p>
              </div>
            )}
        </div>

      </div>

      {/* 3. Outpatient Consultation Trends SVG Chart */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
        <div className="border-b border-neutral-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Outpatient Consultation Trends</h3>
          </div>
          <div className="flex items-center gap-3">
            {adminAccount ? (
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5 text-xs text-amber-900 font-semibold h-9 flex items-center shrink-0">
                <span>{adminAccount.hospital}</span>
              </div>
            ) : (
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-amber-400 h-9 cursor-pointer"
              >
                <option value="ALL">All PantaiCare Facilities</option>
                <option value="Pantai Hospital Penang (Main Hospital)">Pantai Hospital Penang (Main Hospital)</option>
                <option value="Pantai Heart & Wellness Pavilion">Pantai Heart & Wellness Pavilion</option>
                <option value="Pantai Premier Clinic & Day Surgery">Pantai Premier Clinic & Day Surgery</option>
                <option value="Pantai Specialist Centre">Pantai Specialist Centre</option>
              </select>
            )}
          </div>
        </div>

        {/* SVG Canvas for Charting */}
        <div className="relative flex justify-center py-2 h-44 overflow-hidden bg-neutral-50/20 rounded-xl border border-neutral-150">
          {loading ? (
            <div className="flex items-center justify-center text-xs text-neutral-450">
              Loading consultation trends...
            </div>
          ) : (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-neutral-350">
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f0f0f0" strokeWidth="1" />
              <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f0f0f0" strokeWidth="1" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />

              {pathD && (
                <>
                  <path
                    d={`${pathD} L ${padding + (chartData.length - 1) * (width - padding * 2) / Math.max(chartData.length - 1, 1)},${height - padding} L ${padding},${height - padding} Z`}
                    fill="url(#trendGrad)"
                    opacity="0.15"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>

              {/* Data points */}
              {chartData.map((d, index) => {
                const x = padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
                const y = height - padding - (d.count / maxVal) * (height - padding * 2);
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#ffffff"
                      stroke="#d97706"
                      strokeWidth="2.5"
                    />
                    <text
                      x={x}
                      y={y - 12}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#111827"
                      className="font-mono"
                    >
                      {d.count}
                    </text>
                    <text
                      x={x}
                      y={height - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="medium"
                      fill="#9ca3af"
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

    </div>
  );
}
