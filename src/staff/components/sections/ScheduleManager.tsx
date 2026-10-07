import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Save, 
  CalendarRange
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

const timeSlotOptions = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "07:00 PM", "08:00 PM"
];

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

  const handleToggleDay = (day: string) => {
    setShifts(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }));
  };

  const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    setShifts(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
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

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Top Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Duty &amp; Schedule Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure weekly consultation shifts and calendar holiday leave blocks.</p>
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
        
        {/* Left Column (7 cols): Weekly Duty Shifts & Operating Hours */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Weekly Consultation Shifts
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Set attending physician consultation hours for each day of the week.</p>
              </div>
            </div>

            {/* List of Days & Shifts */}
            <div className="space-y-3">
              {daysOfWeek.map((day) => {
                const shift = shifts[day] || { start: "09:00 AM", end: "05:00 PM", enabled: false };
                return (
                  <div 
                    key={day} 
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      shift.enabled 
                        ? 'bg-slate-50/70 border-slate-200' 
                        : 'bg-slate-100/40 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <button
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          shift.enabled ? 'bg-sky-600' : 'bg-slate-300'
                        }`}
                      >
                        <span 
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            shift.enabled ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-bold ${shift.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                        {day}
                      </span>
                    </div>

                    {shift.enabled ? (
                      <div className="flex items-center gap-2 text-xs">
                        <select
                          value={shift.start}
                          onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                        >
                          {timeSlotOptions.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-slate-400 text-xs font-bold">to</span>
                        <select
                          value={shift.end}
                          onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                        >
                          {timeSlotOptions.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Off Duty / Closed
                      </span>
                    )}
                  </div>
                );
              })}
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
                <span>Save Shifts &amp; Blocks</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
