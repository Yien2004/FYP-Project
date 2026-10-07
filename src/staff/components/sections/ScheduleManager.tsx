import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  CalendarRange,
  UserX,
  Building,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface Shift {
  start: string;
  end: string;
  enabled: boolean;
}

interface Shifts {
  [day: string]: Shift;
}

interface ScheduleManagerProps {
  doctorName: string;
}

export default function ScheduleManager({ doctorName }: ScheduleManagerProps) {
  const [shifts, setShifts] = useState<Shifts>({
    Monday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
    Tuesday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
    Wednesday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
    Thursday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
    Friday: { start: "09:00 AM", end: "05:00 PM", enabled: true },
    Saturday: { start: "09:00 AM", end: "01:00 PM", enabled: false },
    Sunday: { start: "09:00 AM", end: "01:00 PM", enabled: false },
  });

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [leaveReasons, setLeaveReasons] = useState<Record<string, 'doctor_mc' | 'clinic_holiday'>>(() => {
    try {
      const saved = localStorage.getItem("lifelink_leave_reasons");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [globalBreak, setGlobalBreak] = useState<{ start: string; end: string }>({ start: "12:00 PM", end: "01:00 PM" });
  const [customBreaks, setCustomBreaks] = useState<{ [date: string]: { start: string; end: string } }>({});

  const [newLeaveDate, setNewLeaveDate] = useState("");
  const [leaveType, setLeaveType] = useState<'doctor_mc' | 'clinic_holiday'>('doctor_mc');
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = new Date().toISOString().split('T')[0];
  const isDoctorOffToday = blockedDates.includes(todayStr);

  // Load schedule from server
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/provider/schedule?doctorName=${encodeURIComponent(doctorName)}`)
      .then(res => res.json())
      .then((data: any) => {
        if (data.shifts) setShifts(data.shifts);
        if (data.blockedDates) setBlockedDates(data.blockedDates);
        if (data.globalBreak) setGlobalBreak(data.globalBreak);
        if (data.customBreaks) setCustomBreaks(data.customBreaks);
      })
      .catch(err => {
        console.warn("Failed to load doctor schedule, using defaults", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [doctorName]);

  const persistBlockedDates = (dates: string[], updatedReasons?: Record<string, 'doctor_mc' | 'clinic_holiday'>) => {
    if (updatedReasons) {
      setLeaveReasons(updatedReasons);
      try {
        localStorage.setItem("lifelink_leave_reasons", JSON.stringify(updatedReasons));
      } catch (e) {
        console.warn("Failed to save leave reasons", e);
      }
    }

    fetch("/api/provider/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorName,
        shifts,
        blockedDates: dates,
        globalBreak,
        customBreaks
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      })
      .catch(err => {
        console.error("Failed to save schedule settings", err);
        setErrorMsg("Failed to synchronize schedule configuration.");
        setTimeout(() => setErrorMsg(""), 3000);
      });
  };

  const handleToggleTodayAttendance = () => {
    if (isDoctorOffToday) {
      // Remove today from blocked dates
      const updated = blockedDates.filter(d => d !== todayStr);
      setBlockedDates(updated);
      const nextReasons = { ...leaveReasons };
      delete nextReasons[todayStr];
      persistBlockedDates(updated, nextReasons);
    } else {
      // Add today as doctor leave/MC
      const updated = [...blockedDates, todayStr].sort();
      setBlockedDates(updated);
      const nextReasons = { ...leaveReasons, [todayStr]: 'doctor_mc' as const };
      persistBlockedDates(updated, nextReasons);
    }
  };

  const handleAddLeave = () => {
    if (!newLeaveDate) return;
    if (blockedDates.includes(newLeaveDate)) {
      setErrorMsg("This date is already marked as a leave or holiday.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    const updated = [...blockedDates, newLeaveDate].sort();
    setBlockedDates(updated);
    const nextReasons = { ...leaveReasons, [newLeaveDate]: leaveType };
    setNewLeaveDate("");
    persistBlockedDates(updated, nextReasons);
  };

  const handleRemoveLeave = (date: string) => {
    const updated = blockedDates.filter(d => d !== date);
    setBlockedDates(updated);
    const nextReasons = { ...leaveReasons };
    delete nextReasons[date];
    persistBlockedDates(updated, nextReasons);
  };

  if (isLoading && blockedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500 font-sans">
        <Clock className="w-8 h-8 animate-spin text-sky-600 mb-2" />
        <p className="text-xs">Loading duty schedule records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-neutral-800">
      
      {/* Top Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Doctor Attendance &amp; Holiday Manager</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage doctor medical leave (MC), daily absence, and clinic/hospital holiday closures.</p>
        </div>
      </div>

      {/* Floating Status Banners */}
      {saveSuccess && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl shadow-xs animate-fadeIn">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Attendance records and holiday schedule successfully synchronized with patient booking ledger.</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl shadow-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Doctor Today Attendance Banner */}
      <div className={`border rounded-2xl p-6 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${
        isDoctorOffToday 
          ? 'bg-rose-50/60 border-rose-200 text-rose-900' 
          : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            isDoctorOffToday ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isDoctorOffToday ? <UserX className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-white">
                Today: {todayStr}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isDoctorOffToday ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {isDoctorOffToday ? 'Off Duty / Medical Leave (MC)' : 'On Duty & Available'}
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mt-1">
              {doctorName || 'Attending Physician'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {isDoctorOffToday 
                ? 'Doctor is marked as not coming today. Patient appointment slots for today are blocked automatically.' 
                : 'Doctor is on duty. Consultation appointment bookings are open for patients today.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleTodayAttendance}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
            isDoctorOffToday
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
        >
          {isDoctorOffToday ? (
            <>
              <Check className="w-4 h-4" />
              <span>Mark Doctor Present Today</span>
            </>
          ) : (
            <>
              <UserX className="w-4 h-4" />
              <span>Mark Doctor MC / Off Today</span>
            </>
          )}
        </button>
      </div>

      {/* Main Two-Card Layout: Add Block & Active Block List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 cols): Add Leave / Holiday Block */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-sky-600" />
                Schedule Leave or Holiday
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Block dates to prevent patient appointments for doctor leave or hospital closures.</p>
            </div>

            {/* Leave Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Block Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLeaveType('doctor_mc')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    leaveType === 'doctor_mc'
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  Doctor MC / Leave
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveType('clinic_holiday')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    leaveType === 'clinic_holiday'
                      ? 'bg-sky-50 border-sky-300 text-sky-800'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  Clinic Holiday
                </button>
              </div>
            </div>

            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Select Calendar Date</label>
              <input
                type="date"
                min={todayStr}
                value={newLeaveDate}
                onChange={(e) => setNewLeaveDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:border-sky-500 h-10 font-mono transition"
              />
            </div>

            <button
              type="button"
              onClick={handleAddLeave}
              disabled={!newLeaveDate}
              className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Block Selected Date</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Blocked Dates Table */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Active Leave &amp; Holiday Blocks
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Dates where patient appointment bookings are suspended.</p>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                {blockedDates.length} blocked
              </span>
            </div>

            {blockedDates.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-xs text-neutral-400">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No leave or holiday dates currently blocked.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All regular clinic consultation slots remain available for patient booking.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {blockedDates.map((date) => {
                  const type = leaveReasons[date] || (date === todayStr ? 'doctor_mc' : 'clinic_holiday');
                  const isToday = date === todayStr;

                  return (
                    <div 
                      key={date} 
                      className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 text-xs transition ${
                        isToday 
                          ? 'bg-rose-50/50 border-rose-200' 
                          : 'bg-neutral-50 border-neutral-200/80 hover:bg-neutral-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          type === 'doctor_mc' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                          {type === 'doctor_mc' ? <UserX className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-neutral-900">{date}</span>
                            {isToday && (
                              <span className="text-[9px] font-extrabold uppercase bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded">
                                Today
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-500 font-medium">
                            {type === 'doctor_mc' ? 'Doctor Leave / MC (Absent)' : 'Clinic / Hospital Public Holiday'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                          Booking Blocked
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLeave(date)}
                          className="p-1.5 hover:bg-rose-100 text-neutral-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          title="Remove Block and Reopen Slots"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
