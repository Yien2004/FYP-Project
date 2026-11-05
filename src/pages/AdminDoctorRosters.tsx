import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  Clock, 
  Clock3,
  Building2, 
  Check, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Pencil,
  XCircle,
  CheckCircle2,
  X,
  Sparkles, 
  ShieldCheck, 
  Lock,
  ArrowLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { getStaffAccountByEmail, PANTAI_FACILITIES, getHospitalByFacilityId } from '../data/staffAccounts';
import { allPantaiDoctors } from '../data/pantaiHospitalsData';

interface DoctorWeeklyRoster {
  day_of_week: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
  max_patients?: number;
}

interface DoctorCustomSession {
  id: string;
  doctor_id: string;
  facility_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  room_number: string;
  max_capacity: number;
  status: 'OPEN' | 'CLOSED';
}

interface DoctorItem {
  id: string;
  name: string;
  email?: string;
  department: string;
  employmentType: 'RESIDENT' | 'SESSIONAL';
  roomNumber: string;
  facilityId: number;
  avatarUrl?: string;
}

interface AdminDoctorRostersProps {
  onNavigateBack?: () => void;
}

const DAY_NAMES = [
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
  { day: 6, name: 'Saturday' }
];

export default function AdminDoctorRosters({ onNavigateBack }: AdminDoctorRostersProps) {
  const loggedEmail = localStorage.getItem('lifelink_user_email') || '';
  const adminAccount = React.useMemo(() => getStaffAccountByEmail(loggedEmail), [loggedEmail]);
  const isSuperAdmin = adminAccount?.role === 'super_admin' || loggedEmail === 'superadmin@pantaicare.com' || loggedEmail === 'superadmin@gmail.com';
  const defaultFacId = adminAccount?.facility_id || 1;
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | 'ALL'>(isSuperAdmin ? 'ALL' : defaultFacId);
  const facilityId = isSuperAdmin ? (selectedFacilityId === 'ALL' ? 0 : selectedFacilityId) : defaultFacId;
  const hospitalName = isSuperAdmin 
    ? (selectedFacilityId === 'ALL' ? 'All PantaiCare Facilities' : getHospitalByFacilityId(selectedFacilityId))
    : (adminAccount?.hospital || 'Pantai Hospital Penang (Main Hospital)');

  // Doctor List States
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [employmentFilter, setEmploymentFilter] = useState<'ALL' | 'RESIDENT' | 'SESSIONAL'>('ALL');
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  // Selected Doctor & Schedule State
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [submittingRoster, setSubmittingRoster] = useState(false);
  const [submittingSession, setSubmittingSession] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Weekly Roster state for Resident
  const [weeklyRoster, setWeeklyRoster] = useState<DoctorWeeklyRoster[]>([
    { day_of_week: 1, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 2, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 3, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 4, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 5, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 6, is_active: false, start_time: '09:00', end_time: '13:00', max_patients: 12 },
  ]);

  // Custom sessions state for Sessional
  const [customSessions, setCustomSessions] = useState<DoctorCustomSession[]>([]);

  // Sessional form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [sessionalFrequencyMode, setSessionalFrequencyMode] = useState<'ONE_DAY' | 'EVERY_WEEK'>('ONE_DAY');
  const [sessionalRecurringDay, setSessionalRecurringDay] = useState<number>(2); // Default Tuesday (2)
  const [sessionDate, setSessionDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [roomNumber, setRoomNumber] = useState('Consultation Suite 204');

  // Editing Sessional Session Modal state
  const [editingSession, setEditingSession] = useState<DoctorCustomSession | null>(null);
  const [editSessionDate, setEditSessionDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('13:00');
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editStatus, setEditStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [submittingEditSession, setSubmittingEditSession] = useState(false);

  // Load active departments
  useEffect(() => {
    fetch(`/api/departments/active?facilityId=${facilityId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.departments)) {
          setAvailableDepartments(data.departments);
        }
      })
      .catch(err => console.warn("Failed to load departments:", err));
  }, [facilityId]);

  // Load all doctors for this facility
  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const merged: DoctorItem[] = [];
      const seenNames = new Set<string>();

      // 1. Fetch registered database doctors for this specific facility
      try {
        const res = await fetch("/api/admin/users", {
          headers: { 'x-admin-email': loggedEmail || 'pantaipenangadmin@gmail.com' }
        });
        if (res.ok) {
          const users = await res.json();
          if (Array.isArray(users)) {
            users.filter((u: any) => {
              if (u.role !== 'Doctor') return false;
              // Exclude operational desk, nurse workstation, and generic staff accounts
              const nameLower = (u.fullName || '').toLowerCase();
              if (
                nameLower.includes('desk') || 
                nameLower.includes('station') || 
                nameLower.includes('staff') || 
                nameLower.includes('nurse') || 
                nameLower.includes('admin')
              ) return false;
              // Scope to facility
              const userFacId = u.facility_id ? Number(u.facility_id) : (getStaffAccountByEmail(u.email)?.facility_id || 1);
              if (facilityId !== 0 && userFacId !== Number(facilityId)) return false;
              return true;
            }).forEach((u: any) => {
              const cleanName = u.fullName.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();
              seenNames.add(cleanName);
              merged.push({
                id: u.id,
                name: u.fullName,
                email: u.email,
                department: u.department || 'Internal Medicine',
                employmentType: u.employmentType?.toUpperCase() === 'SESSIONAL' ? 'SESSIONAL' : 'RESIDENT',
                roomNumber: u.roomNumber || u.room_number || 'Consultation Suite 301',
                facilityId: u.facility_id || (facilityId !== 0 ? facilityId : 1),
                avatarUrl: u.avatarUrl
              });
            });
          }
        }
      } catch (e) {}

      // 2. Add specialists from pantaiHospitalsData matching the admin's hospital branch
      allPantaiDoctors.forEach((d: any) => {
        if (facilityId !== 0) {
          const curBranch = getHospitalByFacilityId(facilityId);
          const branchClean = curBranch.toLowerCase().replace(/\(.*?\)/g, '').trim();
          const hospClean = (d.hospital || '').toLowerCase().replace(/\(.*?\)/g, '').trim();
          const matches = hospClean === branchClean || (hospClean.includes('pantai hospital penang') && branchClean.includes('pantai hospital penang'));
          if (!matches) return;
        }
        const cleanName = d.name.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();
        if (!seenNames.has(cleanName)) {
          seenNames.add(cleanName);
          merged.push({
            id: d.id,
            name: d.name,
            email: `dr_${cleanName.replace(/\s+/g, '_')}@pantaipenang.com`,
            department: d.department || d.specialty || 'Specialist Clinic',
            employmentType: d.status === 'Sessional' ? 'SESSIONAL' : 'RESIDENT',
            roomNumber: `Consultation Suite ${200 + (merged.length % 50)}`,
            facilityId: facilityId !== 0 ? facilityId : 1,
            avatarUrl: ''
          });
        }
      });

      setDoctors(merged);
      if (merged.length > 0 && !selectedDoctor) {
        setSelectedDoctor(merged[0]);
      }
    } catch (err: any) {
      console.warn("Failed to load doctor matrix:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [facilityId, hospitalName]);

  // Load schedule for selected doctor
  const loadDoctorSchedule = async (doc: DoctorItem) => {
    setLoadingSchedule(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/roster/doctor/${encodeURIComponent(doc.id)}/schedule`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.weeklyRoster) && data.weeklyRoster.length > 0) {
            const mapped = DAY_NAMES.map(d => {
              const found = data.weeklyRoster.find((r: any) => Number(r.day_of_week) === d.day);
              if (found) {
                return {
                  day_of_week: d.day,
                  is_active: Boolean(found.is_active),
                  start_time: found.start_time?.substring(0, 5) || '09:00',
                  end_time: found.end_time?.substring(0, 5) || '17:00',
                  max_patients: found.max_patients || 24
                };
              }
              return {
                day_of_week: d.day,
                is_active: d.day <= 5,
                start_time: '09:00',
                end_time: d.day === 6 ? '13:00' : '17:00',
                max_patients: d.day === 6 ? 12 : 24
              };
            });
            setWeeklyRoster(mapped);
          }
          if (Array.isArray(data.customSessions)) {
            setCustomSessions(data.customSessions);
          }
          if (data.doctor?.defaultRoom) {
            setRoomNumber(data.doctor.defaultRoom);
          }
        }
      }
    } catch (err: any) {
      console.warn("Failed to load doctor schedule:", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor) {
      loadDoctorSchedule(selectedDoctor);
    }
  }, [selectedDoctor?.id]);

  // Toggle Day active in weekly roster
  const handleToggleDay = (day: number) => {
    setWeeklyRoster(prev => prev.map(r => {
      if (r.day_of_week === day) {
        return { ...r, is_active: !r.is_active };
      }
      return r;
    }));
  };

  // Update Weekly Roster Field
  const handleUpdateRosterField = (day: number, field: keyof DoctorWeeklyRoster, val: any) => {
    setWeeklyRoster(prev => prev.map(r => {
      if (r.day_of_week === day) {
        return { ...r, [field]: val };
      }
      return r;
    }));
  };

  // Save Weekly Roster for Resident Doctor
  const handleSaveWeeklyRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setSubmittingRoster(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/roster/doctor/${encodeURIComponent(selectedDoctor.id)}/weekly-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosters: weeklyRoster })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Weekly clinic roster for ${selectedDoctor.name} updated successfully.`);
      } else {
        setErrorMsg(data.error || "Failed to update weekly roster.");
      }
    } catch (err: any) {
      setErrorMsg(`Communication error: ${err.message}`);
    } finally {
      setSubmittingRoster(false);
    }
  };

  // Open / Schedule Sessional Clinic (supports One Day Only and Every Week modes)
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    if (sessionalFrequencyMode === 'ONE_DAY') {
      if (!sessionDate || !startTime || !endTime || !roomNumber.trim()) {
        setErrorMsg("Please complete date, start/end times, and consultation room.");
        return;
      }

      setSubmittingSession(true);
      setErrorMsg('');
      setSuccessMsg('');

      try {
        const res = await fetch(`/api/admin/roster/doctor/${encodeURIComponent(selectedDoctor.id)}/open-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionDate,
            startTime,
            endTime,
            roomNumber,
            maxCapacity: 20,
            facilityId
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(`One-day session opened on ${sessionDate} (${startTime} - ${endTime}). Patient calendar unlocked.`);
          setSessionDate('');
          loadDoctorSchedule(selectedDoctor);
        } else {
          setErrorMsg(data.error || "Failed to open clinic session.");
        }
      } catch (err: any) {
        setErrorMsg(`Submission error: ${err.message}`);
      } finally {
        setSubmittingSession(false);
      }
    } else {
      // EVERY_WEEK
      if (!startTime || !endTime || !roomNumber.trim()) {
        setErrorMsg("Please complete consultation hours and room number.");
        return;
      }

      setSubmittingSession(true);
      setErrorMsg('');
      setSuccessMsg('');

      try {
        const res = await fetch(`/api/admin/roster/doctor/${encodeURIComponent(selectedDoctor.id)}/weekly-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayOfWeek: sessionalRecurringDay,
            startTime,
            endTime,
            roomNumber,
            isActive: true
          })
        });
        const data = await res.json();
        const dayName = DAY_NAMES.find(d => d.day === sessionalRecurringDay)?.name || 'selected day';
        if (res.ok && data.success) {
          setSuccessMsg(`Weekly recurring schedule activated for Every ${dayName} (${startTime} - ${endTime}). Patient calendar unlocked.`);
          loadDoctorSchedule(selectedDoctor);
        } else {
          setErrorMsg(data.error || "Failed to save weekly recurring schedule.");
        }
      } catch (err: any) {
        setErrorMsg(`Submission error: ${err.message}`);
      } finally {
        setSubmittingSession(false);
      }
    }
  };

  // Close / Deactivate Weekly Recurring Schedule for Sessional Doctor
  const handleCloseWeeklyDay = async (dayOfWeek: number) => {
    if (!selectedDoctor) return;
    const dayName = DAY_NAMES.find(d => d.day === dayOfWeek)?.name || 'this day';
    if (!confirm(`Are you sure you want to deactivate the weekly recurring clinic for Every ${dayName}?`)) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/roster/doctor/${encodeURIComponent(selectedDoctor.id)}/weekly-session/${dayOfWeek}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Weekly recurring schedule for Every ${dayName} closed successfully.`);
        loadDoctorSchedule(selectedDoctor);
      } else {
        setErrorMsg(data.error || "Failed to close weekly schedule.");
      }
    } catch (err: any) {
      setErrorMsg(`Operation failed: ${err.message}`);
    }
  };

  // Open Edit Session Modal
  const handleOpenEditModal = (sess: DoctorCustomSession) => {
    setEditingSession(sess);
    setEditSessionDate(sess.session_date);
    setEditStartTime(sess.start_time?.substring(0, 5) || '09:00');
    setEditEndTime(sess.end_time?.substring(0, 5) || '13:00');
    setEditRoomNumber(sess.room_number || '');
    setEditStatus(sess.status || 'OPEN');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Quick Extend End Time by hours (e.g. +1 hr, +2 hrs)
  const handleExtendEndTime = (hours: number) => {
    try {
      const [h, m] = editEndTime.split(':').map(Number);
      const newH = Math.min(22, (h || 13) + hours);
      const newTime = `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
      setEditEndTime(newTime);
    } catch (e) {}
  };

  // Save Sessional Session Updates (Extend time, change room, or reschedule)
  const handleSaveEditSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    if (!editSessionDate || !editStartTime || !editEndTime || !editRoomNumber.trim()) {
      setErrorMsg("Please provide valid date, consultation hours, and room number.");
      return;
    }

    setSubmittingEditSession(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/roster/session/${editingSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: editSessionDate,
          startTime: editStartTime,
          endTime: editEndTime,
          roomNumber: editRoomNumber,
          maxCapacity: 20,
          status: editStatus
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Session for ${editSessionDate} updated successfully (${editStartTime} - ${editEndTime}, ${editStatus}).`);
        setEditingSession(null);
        if (selectedDoctor) {
          loadDoctorSchedule(selectedDoctor);
        }
      } else {
        setErrorMsg(data.error || "Failed to update session.");
      }
    } catch (err: any) {
      setErrorMsg(`Save error: ${err.message}`);
    } finally {
      setSubmittingEditSession(false);
    }
  };

  // Quick Toggle Session Status (Cancel / Re-open)
  const handleToggleSessionStatus = async (sessionId: string, newStatus: 'OPEN' | 'CLOSED') => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/roster/session/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(newStatus === 'CLOSED' ? "Session cancelled. Patient calendar locked for this slot." : "Session re-opened for patient booking.");
        if (editingSession && editingSession.id === sessionId) {
          setEditingSession(prev => prev ? { ...prev, status: newStatus } : null);
          setEditStatus(newStatus);
        }
        if (selectedDoctor) {
          loadDoctorSchedule(selectedDoctor);
        }
      } else {
        setErrorMsg(data.error || "Failed to update session status.");
      }
    } catch (err: any) {
      setErrorMsg(`Status update error: ${err.message}`);
    }
  };

  // Delete / Remove Sessional Slot
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to permanently delete this on-demand clinic session? All patient booking slots for this date will be locked.")) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/roster/session/${sessionId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Session deleted successfully. Patient calendar locked.");
        if (editingSession?.id === sessionId) {
          setEditingSession(null);
        }
        if (selectedDoctor) {
          loadDoctorSchedule(selectedDoctor);
        }
      } else {
        setErrorMsg(data.error || "Failed to delete clinic session.");
      }
    } catch (err: any) {
      setErrorMsg(`Operation failed: ${err.message}`);
    }
  };

  // Filtered doctors
  const filteredDoctors = doctors.filter(doc => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchDept = doc.department.toLowerCase().includes(q);
      const matchRoom = doc.roomNumber.toLowerCase().includes(q);
      if (!matchName && !matchDept && !matchRoom) return false;
    }
    if (departmentFilter !== 'ALL') {
      if (!doc.department.toLowerCase().includes(departmentFilter.toLowerCase())) return false;
    }
    if (employmentFilter !== 'ALL') {
      if (doc.employmentType !== employmentFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-neutral-800 font-sans pb-12">
      {/* Top Header */}
      <div className="border-b border-neutral-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
            Doctor Roster & Appointment Slot Console
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure resident specialist weekly schedules and activate on-demand sessional clinic slots.
          </p>
        </div>

        {isSuperAdmin ? (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-amber-700 whitespace-nowrap flex items-center gap-1 font-mono">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Facility:</span>
            </label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1 text-xs text-neutral-900 font-bold outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 h-9 cursor-pointer"
            >
              <option value="ALL">All Facilities (Group-Wide)</option>
              {PANTAI_FACILITIES.map(f => (
                <option key={f.id} value={f.id}>{f.shortTag} ({f.location})</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700">
            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate max-w-[200px]">{hospitalName}</span>
          </div>
        )}
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Doctor Directory & Filters (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs space-y-4">
          
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-extrabold text-xs text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              <span>Doctor Registry ({filteredDoctors.length})</span>
            </h3>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor or suite..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 h-9"
            />
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setEmploymentFilter('ALL')}
                className={`flex-1 py-1 text-center font-bold rounded-lg transition cursor-pointer text-[11px] ${
                  employmentFilter === 'ALL' ? 'bg-teal-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setEmploymentFilter('RESIDENT')}
                className={`flex-1 py-1 text-center font-bold rounded-lg transition cursor-pointer text-[11px] ${
                  employmentFilter === 'RESIDENT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Resident
              </button>
              <button
                type="button"
                onClick={() => setEmploymentFilter('SESSIONAL')}
                className={`flex-1 py-1 text-center font-bold rounded-lg transition cursor-pointer text-[11px] ${
                  employmentFilter === 'SESSIONAL' ? 'bg-purple-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Sessional
              </button>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider shrink-0">Dept:</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1 text-xs text-neutral-800 font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 h-8 cursor-pointer"
              >
                <option value="ALL">All Specialties</option>
                {availableDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor List */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {loadingDoctors ? (
              <div className="py-8 text-center text-xs text-neutral-400">Loading doctors...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">No matching doctors found.</div>
            ) : (
              filteredDoctors.map(doc => {
                const isSelected = selectedDoctor?.id === doc.id;
                const isResident = doc.employmentType === 'RESIDENT';

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-50/80 text-neutral-900 border-teal-300 shadow-xs ring-1 ring-teal-400/30'
                        : 'bg-white border-neutral-200/80 hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                        isSelected 
                          ? 'bg-teal-600 text-white shadow-xs' 
                          : isResident ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {doc.name.replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').charAt(0) || 'D'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs truncate leading-snug text-neutral-900">{doc.name}</div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-teal-700 font-medium' : 'text-neutral-500'}`}>
                          {doc.department}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isResident
                          ? isSelected ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isSelected ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {doc.employmentType}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600' : 'text-neutral-400'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Schedule Editor Console (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-6">
          {selectedDoctor ? (
            <>
              {/* Selected Doctor Profile Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-extrabold shrink-0 ${
                    selectedDoctor.employmentType === 'RESIDENT'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {selectedDoctor.name.replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-neutral-900">{selectedDoctor.name}</h2>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        selectedDoctor.employmentType === 'RESIDENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {selectedDoctor.employmentType === 'RESIDENT' ? 'Resident Consultant' : 'Sessional Specialist'}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span>{selectedDoctor.department}</span>
                      <span>•</span>
                      <span>{selectedDoctor.roomNumber}</span>
                      {selectedDoctor.email && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-neutral-400">{selectedDoctor.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {loadingSchedule && (
                  <div className="text-xs text-neutral-400 flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                    <span>Syncing roster...</span>
                  </div>
                )}
              </div>

              {/* DUAL-TRACK INTERFACE BASED ON EMPLOYMENT TYPE */}
              {selectedDoctor.employmentType === 'RESIDENT' ? (
                /* ===================================================
                 * RESIDENT DOCTORS: DEFAULT OPEN, FINE-TUNE AS NEEDED
                 * =================================================== */
                <form onSubmit={handleSaveWeeklyRoster} className="space-y-5">
                  {/* Day-by-Day Roster Rows */}
                  <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
                    <div className="bg-neutral-50/80 px-4 py-2.5 grid grid-cols-12 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      <div className="col-span-4">Day of Week</div>
                      <div className="col-span-4">Clinic Status</div>
                      <div className="col-span-4 text-right">Consultation Hours</div>
                    </div>

                    {weeklyRoster.map(r => {
                      const dayMeta = DAY_NAMES.find(d => d.day === r.day_of_week);
                      return (
                        <div key={r.day_of_week} className="px-4 py-3 grid grid-cols-12 items-center gap-2 hover:bg-neutral-50/50 transition">
                          <div className="col-span-4 font-extrabold text-xs text-neutral-800">
                            {dayMeta?.name}
                          </div>

                          <div className="col-span-4 flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={r.is_active}
                                onChange={() => handleToggleDay(r.day_of_week)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                            <span className={`text-xs font-bold ${r.is_active ? 'text-emerald-700' : 'text-neutral-400'}`}>
                              {r.is_active ? 'Active' : 'Closed'}
                            </span>
                          </div>

                          <div className="col-span-4 flex items-center justify-end gap-1.5">
                            <input
                              type="time"
                              disabled={!r.is_active}
                              value={r.start_time}
                              onChange={(e) => handleUpdateRosterField(r.day_of_week, 'start_time', e.target.value)}
                              className="w-20 px-1.5 py-1 text-xs border border-neutral-200 rounded-lg bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-400 outline-none focus:bg-white font-mono"
                            />
                            <span className="text-neutral-400 text-xs">–</span>
                            <input
                              type="time"
                              disabled={!r.is_active}
                              value={r.end_time}
                              onChange={(e) => handleUpdateRosterField(r.day_of_week, 'end_time', e.target.value)}
                              className="w-20 px-1.5 py-1 text-xs border border-neutral-200 rounded-lg bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-400 outline-none focus:bg-white font-mono"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingRoster}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-neutral-300 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-teal-600/20"
                    >
                      {submittingRoster ? 'Saving Roster...' : 'Save Weekly Clinic Roster'}
                    </button>
                  </div>
                </form>
              ) : (
                /* ===================================================
                 * SESSIONAL DOCTORS: DEFAULT CLOSED, OPEN ON DEMAND
                 * =================================================== */
                <div className="space-y-6">
                  {/* Schedule Form */}
                  <form onSubmit={handleOpenSession} className="bg-neutral-50/60 border border-neutral-200 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/60 pb-3">
                      <h4 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-purple-600" />
                        <span>Schedule Sessional Clinic</span>
                      </h4>

                      {/* Schedule Mode: One Day Only vs Every Week */}
                      <div className="flex items-center gap-1 bg-white border border-neutral-200 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setSessionalFrequencyMode('ONE_DAY')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            sessionalFrequencyMode === 'ONE_DAY'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          One Day Only
                        </button>
                        <button
                          type="button"
                          onClick={() => setSessionalFrequencyMode('EVERY_WEEK')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            sessionalFrequencyMode === 'EVERY_WEEK'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          Every Week
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {sessionalFrequencyMode === 'ONE_DAY' ? (
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                            Session Date *
                          </label>
                          <input
                            type="date"
                            min={todayStr}
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 font-semibold outline-none focus:ring-1 focus:ring-purple-500 h-9"
                            required
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                            Recurring Day *
                          </label>
                          <select
                            value={sessionalRecurringDay}
                            onChange={(e) => setSessionalRecurringDay(Number(e.target.value))}
                            className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 font-semibold outline-none focus:ring-1 focus:ring-purple-500 h-9"
                          >
                            <option value={1}>Every Monday</option>
                            <option value={2}>Every Tuesday</option>
                            <option value={3}>Every Wednesday</option>
                            <option value={4}>Every Thursday</option>
                            <option value={5}>Every Friday</option>
                            <option value={6}>Every Saturday</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                          Time Window *
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-xl px-2 py-1 text-xs text-neutral-800 font-mono outline-none focus:ring-1 focus:ring-purple-500 h-9"
                            required
                          />
                          <span className="text-neutral-400 text-xs">–</span>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-xl px-2 py-1 text-xs text-neutral-800 font-mono outline-none focus:ring-1 focus:ring-purple-500 h-9"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                          Assigned Room *
                        </label>
                        <input
                          type="text"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          placeholder="e.g. Suite 204"
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-purple-500 h-9 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={submittingSession}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-purple-600/20 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {submittingSession 
                            ? 'Saving...' 
                            : sessionalFrequencyMode === 'ONE_DAY' 
                              ? 'Open One-Day Session & Activate Slots' 
                              : 'Activate Weekly Recurring Clinic'}
                        </span>
                      </button>
                    </div>
                  </form>

                  {/* Active Schedules & Sessions List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider flex items-center justify-between">
                      <span>Active Clinic Schedules ({customSessions.length + weeklyRoster.filter(r => r.is_active).length})</span>
                      <span className="text-[11px] text-neutral-400 lowercase font-normal">One-day confirmed dates and weekly recurring clinics</span>
                    </h4>

                    {customSessions.length === 0 && weeklyRoster.filter(r => r.is_active).length === 0 ? (
                      <div className="text-center py-8 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200 text-neutral-400 text-xs">
                        No active clinic sessions or weekly schedules opened. Patient calendar is completely locked for this specialist.
                      </div>
                    ) : (
                      <div className="border border-neutral-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-50 text-neutral-400 uppercase tracking-wider text-[10px] font-bold border-b border-neutral-200">
                            <tr>
                              <th className="py-2.5 px-3">Schedule / Date</th>
                              <th className="py-2.5 px-3">Session Time</th>
                              <th className="py-2.5 px-3">Consultation Room</th>
                              <th className="py-2.5 px-3">Slot Status</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {/* 1. Weekly Recurring Days */}
                            {weeklyRoster.filter(r => r.is_active).map(r => {
                              const dayMeta = DAY_NAMES.find(d => d.day === r.day_of_week);
                              return (
                                <tr key={`weekly-${r.day_of_week}`} className="hover:bg-purple-50/30 transition">
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-neutral-900">
                                        Every {dayMeta?.name}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                                        Weekly Recurring
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-neutral-700 font-mono font-medium">
                                    {r.start_time?.substring(0, 5)} – {r.end_time?.substring(0, 5)}
                                  </td>
                                  <td className="py-2.5 px-3 text-neutral-600 font-medium">
                                    {roomNumber || selectedDoctor.roomNumber || 'Consultation Suite 204'}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      ACTIVE WEEKLY
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleCloseWeeklyDay(r.day_of_week)}
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                                      title="Deactivate this weekly recurring schedule"
                                    >
                                      <XCircle className="w-3 h-3 text-rose-500" />
                                      <span>Close Weekly</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* 2. One-Day Confirmed Sessions */}
                            {customSessions.map(sess => (
                              <tr key={sess.id} className="hover:bg-neutral-50/60 transition">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-neutral-900 font-mono">
                                      {sess.session_date}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                      One Day Only
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-neutral-700 font-mono font-medium">
                                  {sess.start_time?.substring(0, 5)} – {sess.end_time?.substring(0, 5)}
                                </td>
                                <td className="py-2.5 px-3 text-neutral-600 font-medium">
                                  {sess.room_number}
                                </td>
                                <td className="py-2.5 px-3">
                                  {sess.status === 'OPEN' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      OPEN
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      CANCELLED
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(sess)}
                                      className="px-2 py-1 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                      title="Edit session time or room"
                                    >
                                      <Pencil className="w-3 h-3 text-neutral-500" />
                                      <span>Edit</span>
                                    </button>

                                    {sess.status === 'OPEN' ? (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSessionStatus(sess.id, 'CLOSED')}
                                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                        title="Cancel session (Locks booking slots from patients)"
                                      >
                                        <XCircle className="w-3 h-3 text-rose-500" />
                                        <span>Cancel</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSessionStatus(sess.id, 'OPEN')}
                                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                        title="Reopen session (Unlocks booking slots for patients)"
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Reopen</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSession(sess.id)}
                                      className="p-1.5 text-neutral-400 hover:text-rose-600 transition cursor-pointer rounded-lg hover:bg-rose-50"
                                      title="Permanently Delete Session"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Edit Sessional Session Modal */}
                  {editingSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                          <div>
                            <h3 className="text-sm font-extrabold text-neutral-900 flex items-center gap-2">
                              <Pencil className="w-4 h-4 text-purple-600" />
                              <span>Edit Clinic Session & Extend Hours</span>
                            </h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {selectedDoctor.name} • {editSessionDate}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingSession(null)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg transition cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSaveEditSession} className="p-6 space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                              Session Date *
                            </label>
                            <input
                              type="date"
                              min={todayStr}
                              value={editSessionDate}
                              onChange={(e) => setEditSessionDate(e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 font-semibold outline-none focus:ring-1 focus:ring-purple-500"
                              required
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                Consultation Hours *
                              </label>
                              <span className="text-[10px] text-neutral-400">Quick adjust / extend:</span>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="time"
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 font-mono outline-none focus:bg-white focus:ring-1 focus:ring-purple-500"
                                required
                              />
                              <span className="text-neutral-400 font-bold">–</span>
                              <input
                                type="time"
                                value={editEndTime}
                                onChange={(e) => setEditEndTime(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 font-mono outline-none focus:bg-white focus:ring-1 focus:ring-purple-500"
                                required
                              />
                            </div>

                            {/* Quick Extension Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleExtendEndTime(1)}
                                className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-[11px] font-semibold transition cursor-pointer"
                              >
                                +1 Hour
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExtendEndTime(2)}
                                className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-[11px] font-semibold transition cursor-pointer"
                              >
                                +2 Hours
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditStartTime('09:00'); setEditEndTime('13:00'); }}
                                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                              >
                                Morning (09:00 - 13:00)
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditStartTime('14:00'); setEditEndTime('18:00'); }}
                                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                              >
                                Afternoon (14:00 - 18:00)
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditStartTime('09:00'); setEditEndTime('17:00'); }}
                                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                              >
                                Full Day (09:00 - 17:00)
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                              Assigned Room *
                            </label>
                            <input
                              type="text"
                              value={editRoomNumber}
                              onChange={(e) => setEditRoomNumber(e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                              required
                            />
                          </div>

                          {/* Slot Booking Status Toggle */}
                          <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                              Slot Booking Status
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setEditStatus('OPEN')}
                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                  editStatus === 'OPEN'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                                    : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Open (Booking Active)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditStatus('CLOSED')}
                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                  editStatus === 'CLOSED'
                                    ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                                    : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Cancelled / Closed</span>
                              </button>
                            </div>
                          </div>

                          {/* Modal Actions */}
                          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(editingSession.id)}
                              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Session</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingSession(null)}
                                className="px-4 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submittingEditSession}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-purple-600/20"
                              >
                                {submittingEditSession ? 'Saving...' : 'Save Session Changes'}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-neutral-400 text-xs">
              Select a doctor from the registry to view and manage consultation schedules.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
