import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Save, 
  Coffee, 
  ShieldAlert, 
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

interface ScheduleData {
  doctorName: string;
  shifts: Shifts;
  blockedDates: string[];
  breaks: string[];
}

function getClinicFromEmail(email: string): string {
  const cached = localStorage.getItem("lifelink_user_clinic");
  if (cached) return cached;

  const emailLower = (email || '').toLowerCase().trim();
  if (emailLower.includes('hospitalpulaupinang')) return 'Hospital Pulau Pinang';
  if (emailLower.includes('hospitalseberangjaya')) return 'Hospital Seberang Jaya';
  if (emailLower.includes('kkjalanperak')) return 'Klinik Kesihatan Jalan Perak';
  if (emailLower.includes('kkbayanbaru')) return 'Klinik Kesihatan Bayan Baru';
  if (emailLower.includes('hospitalbukitmertajam')) return 'Hospital Bukit Mertajam';
  if (emailLower.includes('pantaihospital')) return 'Pantai Hospital Penang';
  if (emailLower.includes('lamwahee')) return 'Hospital Lam Wah Ee';
  if (emailLower.includes('gleneagleshospital')) return 'Gleneagles Hospital Penang';
  if (emailLower.includes('islandhospital')) return 'Island Hospital';
  if (emailLower.includes('o2klinik')) return 'O2 Klinik';
  if (emailLower.includes('kliniksingapore')) return 'Klinik Singapore';
  if (emailLower.includes('poliklinikperdana')) return 'Poliklinik Perdana';
  if (emailLower.includes('penangadventisthospital')) return 'Penang Adventist Hospital';
  if (emailLower.includes('lohguanlye')) return 'Loh Guan Lye Specialists Centre';
  if (emailLower.includes('kpjpenang')) return 'KPJ Penang Specialist Hospital';
  return '';
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
  const [globalBreak, setGlobalBreak] = useState<{ start: string; end: string }>({ start: "12:00 PM", end: "01:00 PM" });
  const [customBreaks, setCustomBreaks] = useState<{ [date: string]: { start: string; end: string } }>({});

  const [newLeaveDate, setNewLeaveDate] = useState("");
  const [newCustomBreakDate, setNewCustomBreakDate] = useState("");
  const [newCustomBreakStart, setNewCustomBreakStart] = useState("");
  const [newCustomBreakEnd, setNewCustomBreakEnd] = useState("");
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

  const handleToggleDay = (day: string) => {
    setShifts(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }));
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', val: string) => {
    setShifts(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: val
      }
    }));
  };

  const handleAddLeave = () => {
    if (!newLeaveDate) return;
    if (blockedDates.includes(newLeaveDate)) {
      setErrorMsg("This date is already marked as a leave day.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    setBlockedDates(prev => [...prev, newLeaveDate].sort());
    setNewLeaveDate("");
  };

  const handleRemoveLeave = (date: string) => {
    setBlockedDates(prev => prev.filter(d => d !== date));
  };

  // Helper to parse "14:00" to "02:00 PM"
  const formatTimeInput = (timeStr: string): string => {
    const match = timeStr.match(/^(\d{2}):(\d{2})$/);
    if (!match) return "";
    let hrs = parseInt(match[1], 10);
    const mins = match[2];
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12 === 0 ? 12 : hrs % 12;
    const hrsStr = hrs < 10 ? `0${hrs}` : `${hrs}`;
    return `${hrsStr}:${mins} ${ampm}`;
  };

  // Helper to parse "02:00 PM" to "14:00" for time inputs
  const formatTimeForInput = (timeStr: string): string => {
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return "";
    let hrs = parseInt(match[1], 10);
    const mins = match[2];
    const pm = match[3].toUpperCase() === "PM";
    if (pm && hrs < 12) hrs += 12;
    if (!pm && hrs === 12) hrs = 0;
    const hrsStr = hrs < 10 ? `0${hrs}` : `${hrs}`;
    return `${hrsStr}:${mins}`;
  };

  const handleAddCustomBreak = () => {
    if (!newCustomBreakDate || !newCustomBreakStart || !newCustomBreakEnd) {
      setErrorMsg("Please select a date, start time, and end time for the custom break.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    const startFormatted = formatTimeInput(newCustomBreakStart);
    const endFormatted = formatTimeInput(newCustomBreakEnd);

    if (!startFormatted || !endFormatted) return;

    setCustomBreaks(prev => ({
      ...prev,
      [newCustomBreakDate]: { start: startFormatted, end: endFormatted }
    }));

    setNewCustomBreakDate("");
    setNewCustomBreakStart("");
    setNewCustomBreakEnd("");
  };

  const handleRemoveCustomBreak = (date: string) => {
    setCustomBreaks(prev => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
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
        <Clock className="w-8 h-8 animate-spin text-teal-600 mb-2" />
        <p className="text-xs">Loading calendar availability vectors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-700 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-200 bg-teal-850/30 px-3 py-1 rounded-full border border-teal-500/25">
            Availability Panel
          </span>
          <h2 className="text-lg font-black tracking-tight">{doctorName}'s Duty Schedule</h2>
          <p className="text-xs text-teal-100 leading-relaxed max-w-xl">
            Configure your active shifts, block out clinic leaves, or set daily breaks. Changes instantly lock booking calendar availability for patients.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isLoading}
          className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer z-10 shrink-0"
        >
          {isLoading ? (
            <Clock className="w-3.5 h-3.5 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          {saveSuccess ? "Duty Settings Saved" : "Save Changes"}
        </button>
      </div>

      {/* Floating Status Banners */}
      {saveSuccess && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl shadow-xs animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>Clinic booking ledger updated. Calendar blocks successfully activated.</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl shadow-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Weekly Shifts Planner */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-sm text-neutral-900">Weekly Shift Allocations</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Toggle clinic weekdays and specify consultation window intervals.</p>
          </div>

          <div className="space-y-3">
            {Object.keys(shifts).map((day) => {
              const shift = shifts[day];
              return (
                <div 
                  key={day} 
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    shift.enabled 
                      ? 'bg-white border-neutral-200' 
                      : 'bg-neutral-50 border-neutral-100 opacity-60'
                  }`}
                >
                  {/* Left Label & Toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`shift-toggle-${day}`}
                      checked={shift.enabled}
                      onChange={() => handleToggleDay(day)}
                      className="rounded border-neutral-300 text-teal-600 focus:outline-none w-4.5 h-4.5 cursor-pointer"
                    />
                    <label 
                      htmlFor={`shift-toggle-${day}`} 
                      className="font-bold text-xs text-neutral-900 w-24 cursor-pointer select-none"
                    >
                      {day}
                    </label>
                  </div>

                  {/* Right Hours Inputs */}
                  {shift.enabled ? (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <input 
                        type="text"
                        placeholder="e.g. 09:00 AM"
                        value={shift.start}
                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 w-24 text-center font-mono font-bold text-neutral-800 focus:bg-white outline-none focus:ring-1 focus:ring-neutral-400"
                      />
                      <span className="text-neutral-400 font-semibold font-mono">to</span>
                      <input 
                        type="text"
                        placeholder="e.g. 05:00 PM"
                        value={shift.end}
                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 w-24 text-center font-mono font-bold text-neutral-800 focus:bg-white outline-none focus:ring-1 focus:ring-neutral-400"
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200/50">
                      Closed Consultation
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Block Leaves & Breaks */}
        <div className="space-y-6">
          
          {/* Calendar Block Leaves Panel */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-neutral-400" />
                Calendar Leave Blocks
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Select calendar dates to prevent any patient bookings.</p>
            </div>

            {/* Input Row */}
            <div className="flex gap-2">
              <input
                type="date"
                id="leave-date-picker"
                min="2026-06-13"
                value={newLeaveDate}
                onChange={(e) => setNewLeaveDate(e.target.value)}
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9 font-mono"
              />
              <button
                type="button"
                id="add-leave-btn"
                onClick={handleAddLeave}
                className="bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 px-3.5 rounded-xl flex items-center justify-center shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List of blocked dates */}
            {blockedDates.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-6">No leave dates currently blocked.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {blockedDates.map((date) => (
                  <div key={date} className="p-2.5 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-neutral-800">{date}</span>
                    <button
                      onClick={() => handleRemoveLeave(date)}
                      className="p-1 hover:bg-neutral-200 hover:text-red-600 text-neutral-400 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Shift Breaks */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-neutral-400" />
                Daily Break Periods
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Specify regular clinic break hours and schedule overrides.</p>
            </div>

            {/* Global Break Selection */}
            <div className="space-y-3 bg-neutral-50/55 border border-neutral-100 rounded-xl p-3">
              <h4 className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">Default Global Break (All Days)</h4>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex-1">
                  <label className="text-[9px] text-neutral-400 font-bold block mb-1">FROM</label>
                  <input
                    type="time"
                    value={formatTimeForInput(globalBreak.start)}
                    onChange={(e) => setGlobalBreak(prev => ({ ...prev, start: formatTimeInput(e.target.value) || prev.start }))}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono h-9 outline-none focus:ring-1 focus:ring-neutral-450"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] text-neutral-400 font-bold block mb-1">TO</label>
                  <input
                    type="time"
                    value={formatTimeForInput(globalBreak.end)}
                    onChange={(e) => setGlobalBreak(prev => ({ ...prev, end: formatTimeInput(e.target.value) || prev.end }))}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono h-9 outline-none focus:ring-1 focus:ring-neutral-450"
                  />
                </div>
              </div>
            </div>

            {/* Custom Overrides Picker */}
            <div className="space-y-3 border-t border-neutral-105 pt-4">
              <h4 className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">Date Break Overrides</h4>
              <p className="text-[10px] text-neutral-400 leading-relaxed">Override break ranges for specific clinic days.</p>
              
              <div className="space-y-2.5">
                <div>
                  <label className="text-[9px] text-neutral-400 font-bold block mb-1">SELECT DATE</label>
                  <input
                    type="date"
                    min="2026-06-13"
                    value={newCustomBreakDate}
                    onChange={(e) => setNewCustomBreakDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono h-9 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] text-neutral-400 font-bold block mb-1">FROM</label>
                    <input
                      type="time"
                      value={newCustomBreakStart}
                      onChange={(e) => setNewCustomBreakStart(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono h-9 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-neutral-400 font-bold block mb-1">TO</label>
                    <input
                      type="time"
                      value={newCustomBreakEnd}
                      onChange={(e) => setNewCustomBreakEnd(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono h-9 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomBreak}
                    className="self-end bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 p-2 rounded-xl flex items-center justify-center shadow-sm cursor-pointer h-9 w-9 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Overrides list */}
              {Object.keys(customBreaks).length === 0 ? (
                <p className="text-[10px] text-neutral-400 italic text-center py-4">No custom date overrides configured.</p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {Object.keys(customBreaks).map((date) => (
                    <div key={date} className="p-2.5 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center justify-between text-xs font-mono">
                      <div className="min-w-0">
                        <span className="font-bold text-neutral-800 block">{date}</span>
                        <span className="text-[10px] text-neutral-500 block mt-0.5">{customBreaks[date].start} - {customBreaks[date].end}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomBreak(date)}
                        className="p-1 hover:bg-neutral-200 hover:text-red-600 text-neutral-400 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          </div>

      </div>

    </div>
  );
}
