import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  CalendarRange,
  UserX,
  Upload,
  FileText,
  X,
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
  const [leaveReasons, setLeaveReasons] = useState<Record<string, 'doctor_mc'>>(() => {
    try {
      const saved = localStorage.getItem("lifelink_leave_reasons");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [mcRecords, setMcRecords] = useState<Record<string, { name: string; size: string }>>(() => {
    try {
      const saved = localStorage.getItem("lifelink_leave_mc_files");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [globalBreak, setGlobalBreak] = useState<{ start: string; end: string }>({ start: "12:00 PM", end: "01:00 PM" });
  const [customBreaks, setCustomBreaks] = useState<{ [date: string]: { start: string; end: string } }>({});

  const [newLeaveDate, setNewLeaveDate] = useState("");
  const [mcFile, setMcFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const persistBlockedDates = (dates: string[], updatedReasons?: Record<string, 'doctor_mc'>) => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.round(file.size / 1024);
    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setMcFile({
        name: file.name,
        size: sizeStr,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setMcFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddLeave = () => {
    if (!newLeaveDate) return;
    if (blockedDates.includes(newLeaveDate)) {
      setErrorMsg("This date is already marked as a doctor leave or MC.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    const updated = [...blockedDates, newLeaveDate].sort();
    setBlockedDates(updated);
    const nextReasons = { ...leaveReasons, [newLeaveDate]: 'doctor_mc' as const };
    
    if (mcFile) {
      const nextMc = { ...mcRecords, [newLeaveDate]: { name: mcFile.name, size: mcFile.size } };
      setMcRecords(nextMc);
      try {
        localStorage.setItem("lifelink_leave_mc_files", JSON.stringify(nextMc));
      } catch (e) {}
    }

    setNewLeaveDate("");
    setMcFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    persistBlockedDates(updated, nextReasons);
  };

  const handleRemoveLeave = (dateToRemove: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to remove this leave record for ${dateToRemove}?\n\nThis will unblock your schedule and re-open patient booking slots for this date.`
    );
    if (!isConfirmed) return;

    const updated = blockedDates.filter(d => d !== dateToRemove);
    setBlockedDates(updated);

    const nextReasons = { ...leaveReasons };
    delete nextReasons[dateToRemove];
    setLeaveReasons(nextReasons);

    const nextMc = { ...mcRecords };
    delete nextMc[dateToRemove];
    setMcRecords(nextMc);
    try {
      localStorage.setItem("lifelink_leave_mc_files", JSON.stringify(nextMc));
    } catch (e) {}

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
    <div className="max-w-2xl mx-auto space-y-6 font-sans text-neutral-800">
      
      {/* Top Clean Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Doctor Attendance &amp; Leave Manager</h2>
      </div>

      {/* Floating Status Banners */}
      {saveSuccess && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl shadow-xs animate-fadeIn">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Attendance records and doctor leave schedule successfully synchronized with patient booking ledger.</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl shadow-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Doctor Today Attendance Banner */}
      <div className={`border rounded-2xl p-6 transition shadow-xs flex items-center justify-between gap-5 ${
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
              {isDoctorOffToday && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                  Off Duty / Medical Leave (MC)
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mt-1">
              Clinical Physician Duty Schedule
            </h3>
            {isDoctorOffToday && (
              <p className="text-xs text-slate-600 mt-0.5">
                Doctor is marked as not coming today. Patient appointment slots for today are blocked automatically.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Leave / MC Form */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="border-b border-neutral-100 pb-3">
          <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-sky-600" />
            Schedule Doctor Medical Leave (MC)
          </h3>
        </div>

        {/* Leave Type Indicator: Doctor MC / Leave Only */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Block Category</label>
          <div className="p-2.5 rounded-xl text-xs font-bold border bg-rose-50 border-rose-300 text-rose-800 flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-600" />
            <span>Doctor MC / Leave</span>
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

        {/* Upload MC or File Column (Optional) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
            Upload MC / Medical Certificate (Optional)
          </label>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            className="hidden" 
          />

          {!mcFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/30 rounded-xl p-4 transition flex flex-col items-center justify-center gap-1.5 text-slate-500 cursor-pointer"
            >
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Click to upload MC or doctor certificate</span>
              <span className="text-[10px] text-slate-400">Optional supporting document</span>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate text-xs">{mcFile.name}</p>
                  <p className="text-[10px] text-teal-700 font-mono">{mcFile.size} • MC Document Attached</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                title="Remove attached file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
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

      {/* Leave & MC History List */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            Scheduled Leave &amp; MC History
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {blockedDates.length} {blockedDates.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {blockedDates.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
            No scheduled leave records. You are currently on regular clinical duty.
          </div>
        ) : (
          <div className="space-y-2.5">
            {blockedDates.map((dateStr) => {
              const isToday = dateStr === todayStr;
              const isPast = dateStr < todayStr;
              const fileInfo = mcRecords[dateStr];

              let formattedDate = dateStr;
              try {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  formattedDate = d.toLocaleDateString('en-MY', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                }
              } catch (e) {}

              return (
                <div 
                  key={dateStr}
                  className="p-3.5 rounded-xl border border-neutral-200/90 bg-neutral-50/50 hover:bg-neutral-50 transition flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isToday 
                        ? 'bg-rose-100 text-rose-700' 
                        : isPast 
                          ? 'bg-neutral-200 text-neutral-600' 
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      <CalendarIcon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{formattedDate}</span>
                        <span className="text-[10px] font-mono text-slate-500">({dateStr})</span>
                        {isToday ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                            Today (Off Duty)
                          </span>
                        ) : isPast ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-600">
                            Past
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Upcoming Leave
                          </span>
                        )}
                      </div>

                      {fileInfo && (
                        <p className="text-[11px] text-teal-700 flex items-center gap-1 mt-1 truncate">
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate">{fileInfo.name}</span>
                          <span className="text-[10px] text-neutral-400">({fileInfo.size})</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Remove Button with confirmation prompt */}
                  <button
                    type="button"
                    onClick={() => handleRemoveLeave(dateStr)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 shadow-2xs transition cursor-pointer shrink-0"
                    title="Remove leave record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
