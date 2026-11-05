import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Building2, 
  Users, 
  Check, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';

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

interface DoctorRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: {
    id: string;
    name: string;
    email?: string;
    department?: string;
    employmentType?: 'RESIDENT' | 'SESSIONAL' | string;
    roomNumber?: string;
    facilityId?: number;
  } | null;
  onRosterUpdated?: () => void;
}

const DAY_NAMES = [
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
  { day: 6, name: 'Saturday' }
];

export default function DoctorRosterModal({
  isOpen,
  onClose,
  doctor,
  onRosterUpdated
}: DoctorRosterModalProps) {
  if (!isOpen || !doctor) return null;

  const [loading, setLoading] = useState(true);
  const [submittingRoster, setSubmittingRoster] = useState(false);
  const [submittingSession, setSubmittingSession] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Employment type from server
  const [empType, setEmpType] = useState<'RESIDENT' | 'SESSIONAL'>(() => {
    return (doctor.employmentType?.toUpperCase() === 'SESSIONAL') ? 'SESSIONAL' : 'RESIDENT';
  });

  // Weekly roster for Resident
  const [weeklyRoster, setWeeklyRoster] = useState<DoctorWeeklyRoster[]>([
    { day_of_week: 1, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 2, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 3, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 4, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 5, is_active: true, start_time: '09:00', end_time: '17:00', max_patients: 24 },
    { day_of_week: 6, is_active: false, start_time: '09:00', end_time: '13:00', max_patients: 12 },
  ]);

  // Custom sessions for Sessional
  const [customSessions, setCustomSessions] = useState<DoctorCustomSession[]>([]);

  // Sessional form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [roomNumber, setRoomNumber] = useState(doctor.roomNumber || 'Consultation Suite 204');
  const [maxCapacity, setMaxCapacity] = useState('15');

  const fetchSchedule = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/roster/doctor/${encodeURIComponent(doctor.id)}/schedule`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.doctor?.employmentType) {
            setEmpType(data.doctor.employmentType);
          }
          if (Array.isArray(data.weeklyRoster) && data.weeklyRoster.length > 0) {
            // Map into standardized Mon-Sat
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
        }
      }
    } catch (err: any) {
      console.warn("Failed to load doctor schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [doctor.id]);

  const handleToggleDay = (day: number) => {
    setWeeklyRoster(prev => prev.map(r => {
      if (r.day_of_week === day) {
        return { ...r, is_active: !r.is_active };
      }
      return r;
    }));
  };

  const handleUpdateRosterField = (day: number, field: keyof DoctorWeeklyRoster, val: any) => {
    setWeeklyRoster(prev => prev.map(r => {
      if (r.day_of_week === day) {
        return { ...r, [field]: val };
      }
      return r;
    }));
  };

  const handleSaveWeeklyRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRoster(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/roster/doctor/${encodeURIComponent(doctor.id)}/weekly-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosters: weeklyRoster })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Weekly clinic roster updated successfully.");
        if (onRosterUpdated) onRosterUpdated();
      } else {
        setErrorMsg(data.error || "Failed to update weekly roster.");
      }
    } catch (err: any) {
      setErrorMsg(`Communication error: ${err.message}`);
    } finally {
      setSubmittingRoster(false);
    }
  };

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDate || !startTime || !endTime || !roomNumber.trim()) {
      setErrorMsg("Please complete date, start/end times, and consultation room.");
      return;
    }

    setSubmittingSession(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/roster/doctor/${encodeURIComponent(doctor.id)}/open-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate,
          startTime: startTime + ':00',
          endTime: endTime + ':00',
          roomNumber: roomNumber.trim(),
          maxCapacity: Number(maxCapacity) || 15,
          facilityId: doctor.facilityId || 1
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Session for ${sessionDate} opened successfully. Slots are now bookable on patient calendar.`);
        setSessionDate('');
        fetchSchedule();
        if (onRosterUpdated) onRosterUpdated();
      } else {
        setErrorMsg(data.error || "Failed to open session.");
      }
    } catch (err: any) {
      setErrorMsg(`Network error: ${err.message}`);
    } finally {
      setSubmittingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Close this session slot? Patients will no longer be able to select this date.")) return;
    try {
      const res = await fetch(`/api/admin/roster/session/${sessionId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Session slot closed successfully.");
        fetchSchedule();
        if (onRosterUpdated) onRosterUpdated();
      } else {
        setErrorMsg(data.error || "Failed to delete session.");
      }
    } catch (err: any) {
      setErrorMsg(`Error: ${err.message}`);
    }
  };

  const isResident = empType === 'RESIDENT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-2xl w-full max-w-3xl my-8 overflow-hidden text-neutral-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="p-6 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                Clinical Schedule Engine
              </span>
              <span>•</span>
              {isResident ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Resident Consultant — Default Full-Week Roster
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Sessional Specialist — On-Demand Session Access
                </span>
              )}
            </div>

            <h3 className="text-lg font-extrabold text-neutral-900 tracking-tight">
              {doctor.name}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {doctor.department || 'Clinical Specialist'} • {doctor.roomNumber || 'Consultation Room'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200/70 text-neutral-400 hover:text-neutral-700 rounded-full transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Notices */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              Loading clinician schedule parameters...
            </div>
          ) : isResident ? (
            /* ======================================================== */
            /* RESIDENT DOCTOR: WEEKLY ROSTER MANAGEMENT                */
            /* ======================================================== */
            <form onSubmit={handleSaveWeeklyRoster} className="space-y-5">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-emerald-900 mb-0.5">Resident Consultant Roster Policy</p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    By default, regular working days (Monday to Friday, 09:00 - 17:00) are fully open for patient appointments. 
                    You can toggle off specific clinic days (e.g. academic days or off-site consults) and adjust clinic hours or daily appointment caps.
                  </p>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100">
                <div className="grid grid-cols-12 bg-neutral-100/80 px-4 py-2.5 text-[10px] font-extrabold text-neutral-600 uppercase tracking-wider">
                  <div className="col-span-4">Day of Week</div>
                  <div className="col-span-3">Clinic Status</div>
                  <div className="col-span-5 text-right">Consultation Hours</div>
                </div>

                {weeklyRoster.map(r => {
                  const dayObj = DAY_NAMES.find(d => d.day === r.day_of_week);
                  return (
                    <div 
                      key={r.day_of_week} 
                      className={`grid grid-cols-12 px-4 py-3 items-center gap-2 transition-colors ${
                        r.is_active ? 'bg-white hover:bg-neutral-50/70' : 'bg-neutral-50/50 opacity-60'
                      }`}
                    >
                      <div className="col-span-4 font-bold text-xs text-neutral-900">
                        {dayObj?.name}
                      </div>

                      <div className="col-span-3">
                        <button
                          type="button"
                          onClick={() => handleToggleDay(r.day_of_week)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                            r.is_active
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                          }`}
                        >
                          {r.is_active ? 'ON DUTY' : 'CLOSED'}
                        </button>
                      </div>

                      <div className="col-span-5 flex justify-end">
                        {r.is_active ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <input
                              type="time"
                              value={r.start_time}
                              onChange={(e) => handleUpdateRosterField(r.day_of_week, 'start_time', e.target.value)}
                              className="bg-neutral-50 border border-neutral-200 rounded-lg p-1 text-xs text-center font-bold"
                            />
                            <span className="text-neutral-400 font-bold">—</span>
                            <input
                              type="time"
                              value={r.end_time}
                              onChange={(e) => handleUpdateRosterField(r.day_of_week, 'end_time', e.target.value)}
                              className="bg-neutral-50 border border-neutral-200 rounded-lg p-1 text-xs text-center font-bold"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">No scheduled clinic</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRoster}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingRoster ? 'Saving Roster...' : 'Save Weekly Roster'}
                </button>
              </div>
            </form>
          ) : (
            /* ======================================================== */
            /* SESSIONAL DOCTOR: ON-DEMAND SESSION ACCESS               */
            /* ======================================================== */
            <div className="space-y-6">
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-xs text-purple-950 flex items-start gap-3">
                <Lock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-purple-900 mb-0.5">Sessional Specialist Access Policy</p>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Booking calendar is closed by default. All calendar dates are greyed out to patients until an administrator 
                    explicitly schedules an on-demand clinic session below.
                  </p>
                </div>
              </div>

              {/* Form: Open New Clinic Session */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  <span>Open New Clinic Session (按需开放号源)</span>
                </h4>

                <form onSubmit={handleOpenSession} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                        Session Date *
                      </label>
                      <input
                        type="date"
                        min={todayStr}
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                        Assigned Consultation Room *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Consultation Suite 204"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingSession}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submittingSession ? 'Opening Session...' : 'Open Session & Activate Slots'}
                  </button>
                </form>
              </div>

              {/* Table: Active Open Sessions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>Scheduled Sessional Dates ({customSessions.length})</span>
                  </h4>
                  <span className="text-[11px] text-neutral-400">
                    Bookable on Patient Portal
                  </span>
                </div>

                {customSessions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                    No active sessions scheduled. Patient calendar is completely locked for this specialist.
                  </div>
                ) : (
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-neutral-100 text-neutral-600 uppercase text-[10px] font-extrabold tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Time Window</th>
                          <th className="px-4 py-2.5">Room</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 bg-white">
                        {customSessions.map(s => (
                          <tr key={s.id} className="hover:bg-neutral-50/70 transition">
                            <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                              {s.session_date}
                            </td>
                            <td className="px-4 py-3 font-mono text-neutral-700">
                              {s.start_time?.substring(0, 5)} - {s.end_time?.substring(0, 5)}
                            </td>
                            <td className="px-4 py-3 font-medium text-neutral-800">
                              {s.room_number}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {s.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(s.id)}
                                className="px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Close / Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
