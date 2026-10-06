import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Save, 
  CalendarRange,
  Stethoscope
} from 'lucide-react';

interface Shift {
  start: string;
  end: string;
  enabled: boolean;
}

interface Shifts {
  [day: string]: Shift;
}

export interface DoctorMCRecord {
  id: string;
  doctorName: string;
  startDate: string;
  endDate: string;
  leaveType: 'Medical Certificate (MC)' | 'Emergency Medical Leave' | 'Annual Leave';
  reason: string;
}

const defaultDoctorsList = [
  "Dr. Ainol Shareha Binti Sahar",
  "Dr. Simon Lo",
  "Dr. Sarah Mitchell",
  "Dr. Tan Wei Ming",
  "Dr. Siti Aminah",
  "Dr. Lim Mei Ling",
  "Dr. Ahmad Faiz"
];

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
  const [globalBreak, setGlobalBreak] = useState<{ start: string; end: string }>({ start: "12:00 PM", end: "01:00 PM" });
  const [customBreaks, setCustomBreaks] = useState<{ [date: string]: { start: string; end: string } }>({});

  const [newLeaveDate, setNewLeaveDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Doctor MC List - clear out mock records so it starts empty and persists real entries
  const [doctorMCList, setDoctorMCList] = useState<DoctorMCRecord[]>(() => {
    const saved = localStorage.getItem("lifelink_doctor_mc_records");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude any previous mock records (mc-1, mc-2, or Simon Lo / Sarah Mitchell mock records)
          return parsed.filter((r: any) => 
            r.id !== "mc-1" && 
            r.id !== "mc-2" && 
            !(r.doctorName === "Dr. Simon Lo" && r.reason?.includes("Acute Bronchitis")) &&
            !(r.doctorName === "Dr. Sarah Mitchell" && r.reason?.includes("Family emergency"))
          );
        }
      } catch (e) {}
    }
    return [];
  });

  const [mcDoctor, setMcDoctor] = useState(doctorName || defaultDoctorsList[0]);
  const [mcStartDate, setMcStartDate] = useState("");
  const [mcEndDate, setMcEndDate] = useState("");
  const [mcType, setMcType] = useState<'Medical Certificate (MC)' | 'Emergency Medical Leave' | 'Annual Leave'>('Medical Certificate (MC)');
  const [mcReason, setMcReason] = useState("");

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

  const persistBlockedDates = (dates: string[]) => {
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

  const handleAddDoctorMC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcDoctor || !mcStartDate) return;
    const newRecord: DoctorMCRecord = {
      id: "mc-" + Date.now(),
      doctorName: mcDoctor,
      startDate: mcStartDate,
      endDate: mcEndDate || mcStartDate,
      leaveType: mcType,
      reason: mcReason.trim() || "Attending physician medical leave"
    };
    const updated = [newRecord, ...doctorMCList];
    setDoctorMCList(updated);
    localStorage.setItem("lifelink_doctor_mc_records", JSON.stringify(updated));

    // Calculate dates between start and end date to block out
    const datesToAdd: string[] = [];
    const start = new Date(mcStartDate);
    const end = new Date(mcEndDate || mcStartDate);
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      datesToAdd.push(`${yyyy}-${mm}-${dd}`);
    }

    const updatedBlocked = Array.from(new Set([...blockedDates, ...datesToAdd])).sort();
    setBlockedDates(updatedBlocked);
    persistBlockedDates(updatedBlocked);

    setMcStartDate("");
    setMcEndDate("");
    setMcReason("");
  };

  const handleRemoveDoctorMC = (id: string) => {
    const updated = doctorMCList.filter(m => m.id !== id);
    setDoctorMCList(updated);
    localStorage.setItem("lifelink_doctor_mc_records", JSON.stringify(updated));
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
    setNewLeaveDate("");
    persistBlockedDates(updated);
  };

  const handleRemoveLeave = (date: string) => {
    const updated = blockedDates.filter(d => d !== date);
    setBlockedDates(updated);
    persistBlockedDates(updated);
  };

  const handleSaveAll = () => {
    setIsLoading(true);
    const payload: any = {
      doctorName,
      shifts,
      blockedDates,
      globalBreak,
      customBreaks
    };

    fetch("/api/provider/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
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
        setErrorMsg("Failed to persist schedule configuration to database.");
        setTimeout(() => setErrorMsg(""), 4000);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Top Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Duty &amp; Schedule Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage doctor medical leaves (MC) and calendar holiday leave blocks.</p>
        </div>
      </div>

      {/* Floating Status Banners */}
      {saveSuccess && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl shadow-xs animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>Calendar blocks and duty records successfully synchronized.</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl shadow-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Doctor MC & Medical Leave Tracker */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                  Doctor MC &amp; Leave Tracker
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Record doctor medical certificates (MC) and block out shift consultation availability.</p>
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full self-start font-mono">
                {doctorMCList.length} Active Records
              </span>
            </div>

            {/* Form to submit a new Doctor MC */}
            <form onSubmit={handleAddDoctorMC} className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Attending Doctor</label>
                  <select
                    value={mcDoctor}
                    onChange={(e) => setMcDoctor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 h-9 cursor-pointer"
                  >
                    {defaultDoctorsList.map((doc) => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Leave Category</label>
                  <select
                    value={mcType}
                    onChange={(e: any) => setMcType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 h-9 cursor-pointer"
                  >
                    <option value="Medical Certificate (MC)">Medical Certificate (MC)</option>
                    <option value="Emergency Medical Leave">Emergency Medical Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    min="2026-06-13"
                    value={mcStartDate}
                    onChange={(e) => setMcStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono h-9 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    min={mcStartDate || "2026-06-13"}
                    value={mcEndDate}
                    onChange={(e) => setMcEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono h-9 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <input
                  type="text"
                  value={mcReason}
                  onChange={(e) => setMcReason(e.target.value)}
                  placeholder="Reason or diagnosis note (e.g. Acute Gastritis, High Fever)..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-sky-500 h-9"
                />
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer active:scale-98 shrink-0 flex items-center justify-center gap-1.5 h-9"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record MC &amp; Block Duty</span>
                </button>
              </div>
            </form>

            {/* List of recorded Doctor MCs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Active Doctor MC Registry</h4>
              {doctorMCList.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                  No doctor MCs currently recorded. Use the form above to log a medical certificate or leave.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {doctorMCList.map((rec) => (
                    <div key={rec.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">{rec.doctorName}</span>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                            rec.leaveType === 'Medical Certificate (MC)'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : rec.leaveType === 'Emergency Medical Leave'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {rec.leaveType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-mono font-bold text-slate-700">
                            {rec.startDate} {rec.endDate && rec.endDate !== rec.startDate ? `to ${rec.endDate}` : ''}
                          </span>
                          <span>•</span>
                          <span className="truncate italic">{rec.reason}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveDoctorMC(rec.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Dismiss MC Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Calendar Leave Blocks */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-sky-600" />
                Calendar Leave &amp; Holiday Blocks
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Select holiday or leave dates to prevent any patient bookings.</p>
            </div>

            {/* Input Row */}
            <div className="flex gap-2">
              <input
                type="date"
                id="leave-date-picker"
                min="2026-06-13"
                value={newLeaveDate}
                onChange={(e) => setNewLeaveDate(e.target.value)}
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-mono"
              />
              <button
                type="button"
                id="add-leave-btn"
                onClick={handleAddLeave}
                className="bg-sky-600 text-white hover:bg-sky-700 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Block Date</span>
              </button>
            </div>

            {/* List of blocked dates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Blocked Dates ({blockedDates.length})</span>
              </div>
              {blockedDates.length === 0 ? (
                <p className="text-xs text-neutral-400 italic text-center py-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                  No leave dates currently blocked. Select a date above to block bookings.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {blockedDates.map((date) => (
                    <div key={date} className="p-3 bg-neutral-50 border border-neutral-200/60 rounded-xl flex items-center justify-between text-xs font-mono shadow-xs">
                      <span className="font-bold text-neutral-800">{date}</span>
                      <button
                        onClick={() => handleRemoveLeave(date)}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-neutral-400 rounded-lg transition-colors cursor-pointer"
                        title="Remove Block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-medium">Automatic real-time sync with patient booking ledger.</span>
              <button
                onClick={handleSaveAll}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
