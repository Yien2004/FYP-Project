import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Search, Filter, Calendar, Clock, RefreshCw, Building2, FileText, Pill, Eye, X, Activity } from "lucide-react";
import { Appointment, Doctor } from "../types";

interface AppointmentsHistoryProps {
  appointments: Appointment[];
  onResubmitBooking: (apt: Appointment) => void;
  onSetScreen: (screen: string) => void;
  doctors?: Doctor[];
  onCancelAppointment?: (id: string) => void;
  onRescheduleAppointment?: (id: string, date: string, timeSlot: string) => void;
}

export default function AppointmentsHistory({ 
  appointments, 
  onResubmitBooking, 
  onSetScreen,
  onCancelAppointment,
  onRescheduleAppointment
}: AppointmentsHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Completed' | 'Cancelled'>('All');
  const [hospitalFilter, setHospitalFilter] = useState("All");
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  // Helper to parse clinical notes
  const parseClinicalDetails = (apt: Appointment | null) => {
    if (!apt) return { diagnosis: "", notes: "", prescription: "" };
    const rawNotes = apt.clinicalNotes || "";
    const diagMatch = rawNotes.match(/\[Diagnosis\]:\s*([\s\S]*?)(?=\s*\[Notes\]:|\s*\[Rx\]:|$)/i);
    const notesMatch = rawNotes.match(/\[Notes\]:\s*([\s\S]*?)(?=\s*\[Rx\]:|$)/i);
    const rxMatch = rawNotes.match(/\[Rx\]:\s*([\s\S]*)$/i);

    const diagnosis = (apt.diagnosis || (diagMatch ? diagMatch[1].trim() : "")).trim();
    const prescription = (apt.prescription || (rxMatch ? rxMatch[1].trim() : "")).trim();
    let notes = notesMatch 
      ? notesMatch[1].trim() 
      : rawNotes.replace(/\[Diagnosis\]:[^\n]*\n?/gi, '').replace(/\[Notes\]:[^\n]*\n?/gi, '').replace(/\[Rx\]:[^\n]*\n?/gi, '').trim();

    if (!notes && !diagnosis && !prescription && rawNotes) {
      notes = rawNotes.trim();
    }

    return { diagnosis, notes, prescription };
  };

  const parsedDetails = parseClinicalDetails(selectedApt);

  const getFormattedQueueNumber = (apt: Appointment): string => {
    if (apt.queueNumber && apt.queueNumber.trim()) {
      const clean = apt.queueNumber.replace(/^#/, '').trim();
      return clean.toUpperCase();
    }
    const spec = (apt.specialty || '').toLowerCase();
    let prefix = 'GEN';
    if (spec.includes('ortho')) prefix = 'ORT';
    else if (spec.includes('cardio') || spec.includes('heart')) prefix = 'CAR';
    else if (spec.includes('intern') || spec.includes('general')) prefix = 'INT';
    else if (spec.includes('pedia')) prefix = 'PED';
    else if (spec.includes('derma')) prefix = 'DER';
    else if (spec.includes('neuro')) prefix = 'NEU';
    else if (spec.includes('ent') || spec.includes('ear')) prefix = 'ENT';
    else if (spec.includes('ophth') || spec.includes('eye')) prefix = 'OPH';
    
    const idNum = parseInt(String(apt.id || '').replace(/\D/g, ''), 10) || 12;
    const seq = String((idNum % 89) + 1).padStart(3, '0');
    return `${prefix}-${seq}`;
  };

  const getAssignedRoom = (apt: Appointment): string => {
    if (apt.roomNumber && apt.roomNumber.trim()) return apt.roomNumber;
    const spec = (apt.specialty || '').toLowerCase();
    if (spec.includes('ortho')) return 'Room 204 (Suite B)';
    if (spec.includes('cardio') || spec.includes('heart')) return 'Room 308 (Heart Suite)';
    if (spec.includes('intern') || spec.includes('general')) return 'Room 102 (General Suite)';
    if (spec.includes('pedia')) return 'Room 105 (Pediatric Suite)';
    if (spec.includes('derma')) return 'Room 210 (Skin Suite)';
    if (spec.includes('neuro')) return 'Room 402 (Neuro Suite)';
    const idNum = parseInt(String(apt.id || '').replace(/\D/g, ''), 10) || 101;
    const room = 100 + (idNum % 30);
    return `Room ${room}`;
  };

  const parseSlotEndTime = (dateStr?: string, timeSlot?: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (!timeSlot) return new Date(year, month, day, 23, 59, 59);

    const range24 = timeSlot.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (range24) {
      return new Date(year, month, day, parseInt(range24[3], 10), parseInt(range24[4], 10), 0);
    }
    const single24 = timeSlot.match(/^(\d{1,2}):(\d{2})$/);
    if (single24) {
      return new Date(year, month, day, parseInt(single24[1], 10), parseInt(single24[2], 10), 0);
    }
    const range12 = timeSlot.match(/(\d{1,2}):(\d{2})\s*(?:AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (range12) {
      let hrs = parseInt(range12[3], 10);
      const mins = parseInt(range12[4], 10);
      const pm = range12[5].toUpperCase() === "PM";
      if (pm && hrs < 12) hrs += 12;
      if (!pm && hrs === 12) hrs = 0;
      return new Date(year, month, day, hrs, mins, 0);
    }
    const match12 = timeSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      let hrs = parseInt(match12[1], 10);
      const mins = parseInt(match12[2], 10);
      const pm = match12[3].toUpperCase() === "PM";
      if (pm && hrs < 12) hrs += 12;
      if (!pm && hrs === 12) hrs = 0;
      return new Date(year, month, day, hrs, mins, 0);
    }
    return new Date(year, month, day, 23, 59, 59);
  };

  const getEffectiveStatus = (apt: Appointment): string => {
    const s = (apt.status || '').toUpperCase().trim();
    if (s === 'CANCELLED' || s === 'REJECTED') {
      return 'CANCELLED';
    }
    if (s === 'MISSING' || s === 'ABSENT' || s === 'NO_SHOW') {
      return 'MISSING';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const endDateTime = parseSlotEndTime(apt.date, apt.timeSlot);
    const isPast = endDateTime ? endDateTime.getTime() < Date.now() : (apt.date ? apt.date < todayStr : false);

    if (isPast) {
      const isAttended = apt.checkedIn || [
        'CHECKED_IN', 'CHECKED IN', 'CALLING', 'IN_CONSULTATION', 
        'IN CONSULTATION', 'COMPLETED', 'DONE'
      ].includes(s);
      return isAttended ? 'COMPLETED' : 'MISSING';
    }
    return s || 'CONFIRMED';
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase().trim();
    if (s === 'CONFIRMED' || s === 'APPROVED' || s === 'UPCOMING') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          CONFIRMED
        </span>
      );
    }
    if (s === 'CHECKED_IN' || s === 'CHECKED IN' || s === 'WAITING' || s === 'IN LOBBY') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
          CHECKED_IN
        </span>
      );
    }
    if (s === 'CALLING' || s === 'IN_CONSULTATION' || s === 'IN CONSULTATION') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-300">
          IN CONSULTATION
        </span>
      );
    }
    if (s === 'COMPLETED' || s === 'DONE') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          COMPLETED
        </span>
      );
    }
    if (s === 'MISSING' || s === 'ABSENT' || s === 'NO_SHOW') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
          MISSING
        </span>
      );
    }
    if (s === 'CANCELLED' || s === 'REJECTED') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          CANCELLED
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
        {status || 'UNKNOWN'}
      </span>
    );
  };

  const isPenangAppointment = (apt: Appointment) => {
    const c = (apt.clinic || "").toLowerCase();
    if (
      c.includes("kuala lumpur") ||
      c.includes("cheras") ||
      c.includes("ampang") ||
      c.includes("klang") ||
      c.includes("ipoh") ||
      c.includes("melaka") ||
      c.includes("batu pahat") ||
      c.includes("manjung") ||
      c.includes("gleneagles") ||
      c.includes("mertajam")
    ) {
      return false;
    }
    return true;
  };

  const canRescheduleOrCancel = (apt: any) => {
    const normStatus = (apt.status || '').toLowerCase();
    // Checked In, Calling, In Consultation, Completed, Cancelled cannot be rescheduled or cancelled
    if (['checked in', 'checked_in', 'calling', 'in_consultation', 'in consultation', 'completed', 'done', 'cancelled', 'rejected'].includes(normStatus)) {
      return false;
    }
    if (!['upcoming', 'approved', 'pending'].includes(normStatus)) {
      return false;
    }
    if (!apt.date) return false;
    try {
      const today = new Date().toISOString().split('T')[0];
      if (apt.date < today) return false;
      if (apt.date > today) return true;

      if (!apt.timeSlot) return true;
      let endHour = 23;
      let endMinute = 59;
      const match24 = apt.timeSlot.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (match24) {
        endHour = parseInt(match24[3], 10);
        endMinute = parseInt(match24[4], 10);
      } else {
        const match12 = apt.timeSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match12) {
          let h = parseInt(match12[1], 10);
          const m = parseInt(match12[2], 10);
          const ampm = match12[3].toUpperCase();
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          endHour = h;
          endMinute = m;
        }
      }
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      return currentHour < endHour || (currentHour === endHour && currentMinute < endMinute);
    } catch {
      return true;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    // Strictly restrict to Penang facilities
    if (!isPenangAppointment(apt)) return false;

    // Filter by selected Penang facility
    if (hospitalFilter !== "All") {
      const c = (apt.clinic || "").toLowerCase();
      const h = hospitalFilter.toLowerCase();
      if (!c.includes(h) && !h.includes(c)) return false;
    }

    const matchesSearch = apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          apt.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          apt.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (apt.clinic && apt.clinic.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const today = new Date().toISOString().split('T')[0];
    const isPast = apt.date ? apt.date < today : false;
    const effectiveStatus = getEffectiveStatus(apt);

    if (statusFilter === 'All') return matchesSearch;

    if (statusFilter === 'Upcoming') {
      if (isPast) return false;
      return matchesSearch && [
        'UPCOMING', 'CONFIRMED', 'APPROVED', 'PENDING', 'RESCHEDULED', 
        'CHECKED_IN', 'CHECKED IN', 'WAITING', 'CALLING', 
        'IN_CONSULTATION', 'IN CONSULTATION', 'IN-CLINIC'
      ].includes(effectiveStatus);
    }

    if (statusFilter === 'Completed') {
      return matchesSearch && (effectiveStatus === 'COMPLETED' || effectiveStatus === 'DONE');
    }

    if (statusFilter === 'Cancelled') {
      return matchesSearch && (effectiveStatus === 'CANCELLED' || effectiveStatus === 'MISSING');
    }

    return matchesSearch && effectiveStatus === statusFilter.toUpperCase();
  });

  const handleCancelClick = (aptId: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      if (onCancelAppointment) {
        onCancelAppointment(aptId);
      }
      setSelectedApt(null);
    }
  };

  return (
    <div id="appointments-history-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Appointment History</h1>
      </div>

      {/* Main consultation list container */}
      <div className="max-w-4xl mx-auto space-y-6">
          {/* Filters shelf */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specialty, physician, symptom..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            {/* Filter by Penang Facility */}
            <div className="w-full md:w-56 shrink-0">
              <select
                value={hospitalFilter}
                onChange={(e) => setHospitalFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All 4 Penang Facilities</option>
                <option value="Pantai Hospital Penang (Main Hospital)">Pantai Hospital Penang (Main Hospital)</option>
                <option value="Pantai Heart & Wellness Pavilion">Pantai Heart & Wellness Pavilion</option>
                <option value="Pantai Premier Clinic & Day Surgery">Pantai Premier Clinic & Day Surgery</option>
                <option value="Pantai Specialist Centre">Pantai Specialist Centre</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5 w-full md:w-auto shrink-0">
              {(['All', 'Upcoming', 'Completed', 'Cancelled'] as const).map((status) => (
                <button 
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 sm:flex-none text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer ${
                    statusFilter === status ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500 text-sm">
                No recorded appointments match the requested query. Alternatively, register a new appointment booking.
              </div>
            ) : (
              filteredAppointments.slice(0, 30).map((apt) => {
                const queueNum = getFormattedQueueNumber(apt);
                const roomSuite = getAssignedRoom(apt);
                const effectiveStatus = getEffectiveStatus(apt);
                const today = new Date().toISOString().split('T')[0];
                const isPast = apt.date ? apt.date < today : false;

                return (
                  <div 
                    key={apt.id} 
                    className={`bg-white border rounded-2xl p-5 hover:shadow-md transition flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden ${
                      selectedApt?.id === apt.id ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Left: Queue Number Badge + Consultation Info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
                      
                      {/* Tidy Light-Colored Queue Number Badge */}
                      <div className="shrink-0 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 sm:py-2.5 w-full sm:w-24 text-center flex sm:flex-col items-center justify-between sm:justify-center gap-0.5 shadow-2xs">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          Queue No.
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
                          {queueNum}
                        </div>
                        <div className="text-[9px] font-medium text-slate-500 truncate max-w-[80px] hidden sm:block">
                          {apt.type || 'In-Clinic'}
                        </div>
                      </div>

                      {/* Doctor & Facility & Room Suite Details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-950 text-sm tracking-tight truncate">
                              {apt.doctorName}
                            </span>
                            {getStatusBadge(effectiveStatus)}
                          </div>
                          <div className="text-xs text-sky-700 font-bold flex items-center gap-1.5 mt-0.5">
                            <span>{apt.specialty}</span>
                          </div>
                        </div>

                        {/* Facility & Assigned Room */}
                        <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-600 flex-wrap pt-0.5">
                          {apt.clinic && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate">{apt.clinic}</span>
                            </div>
                          )}
                          <div className="font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
                            <span>{roomSuite}</span>
                          </div>
                        </div>

                        {apt.symptoms && (
                          <p className="text-xs text-slate-600 line-clamp-1 italic font-medium pt-0.5">
                            "{apt.symptoms?.replace(/^["'\s]+|["'\s.]+$/g, '').replace(/\.+$/, '')}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side: Date, Time Slot + Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 shrink-0">
                      
                      {/* Schedule */}
                      <div className="text-left sm:text-right font-mono text-xs text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5 sm:justify-end font-semibold text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" /> {apt.date}
                        </div>
                        <div className="flex items-center gap-1.5 sm:justify-end text-[11px] text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-sky-600" /> {apt.timeSlot}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!isPast && canRescheduleOrCancel(apt) && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onResubmitBooking(apt);
                              }}
                              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1 transition cursor-pointer"
                              title="Reschedule this appointment slot"
                            >
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>Reschedule</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelClick(apt.id);
                              }}
                              className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1 transition cursor-pointer"
                              title="Cancel this appointment"
                            >
                              <X className="w-3 h-3 text-rose-600" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}

                        {(effectiveStatus === 'COMPLETED' || effectiveStatus === 'DONE') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResubmitBooking(apt);
                            }}
                            className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 text-teal-600" />
                            <span>Follow-up</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApt(apt);
                          }}
                          className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Consultation Details Card Modal (Centred in viewport, immune to scroll) */}
      {selectedApt && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedApt(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full font-mono shadow-2xs">
                  Consultation Record
                </span>
                <h3 className="text-base font-extrabold text-slate-950 mt-1 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-sky-600" />
                  Visit Details & Results
                </h3>
              </div>
              <button 
                onClick={() => setSelectedApt(null)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Doctor & Facility Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{selectedApt.doctorName}</h4>
                    <p className="text-[11px] text-sky-700 font-semibold">{selectedApt.specialty}</p>
                  </div>
                  <div>
                    {getStatusBadge(getEffectiveStatus(selectedApt))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>{selectedApt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>{selectedApt.timeSlot || "Scheduled slot"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="text-slate-700 font-mono font-bold">
                    Queue: {getFormattedQueueNumber(selectedApt)}
                  </div>
                  <div className="text-slate-700 font-semibold truncate">
                    {getAssignedRoom(selectedApt)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">{selectedApt.clinic || "Penang Healthcare Facility"}</span>
                </div>
              </div>

              {/* Reported Symptoms */}
              {selectedApt.symptoms && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                    Reported Symptoms
                  </span>
                  <p className="text-slate-700 text-xs leading-relaxed italic">
                    "{selectedApt.symptoms?.replace(/^["'\s]+|["'\s.]+$/g, '').replace(/\.+$/, '')}"
                  </p>
                </div>
              )}

              {/* Clinical Diagnosis */}
              {parsedDetails.diagnosis && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                    Clinical Diagnosis
                  </span>
                  <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5">
                    <p className="text-slate-900 font-extrabold text-xs">
                      {parsedDetails.diagnosis}
                    </p>
                  </div>
                </div>
              )}

              {/* Doctor Clinical Notes */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  Doctor Clinical Notes
                </span>
                <p className="text-slate-800 text-xs leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {parsedDetails.notes || "No notes recorded yet."}
                </p>
              </div>

              {/* Prescribed Medication */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-600" />
                  Prescribed Medication
                </span>
                {parsedDetails.prescription ? (
                  <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-2.5 space-y-1.5">
                    {parsedDetails.prescription.split(/[,;\n]+/).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-teal-950 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 mt-1.5" />
                        <span>{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    No medications prescribed.
                  </p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button 
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close View
              </button>
              <div className="flex items-center gap-2">
                {(!selectedApt.date || selectedApt.date >= new Date().toISOString().split('T')[0]) && (selectedApt.status === 'Upcoming' || selectedApt.status === 'Approved' || selectedApt.status === 'Pending') ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCancelClick(selectedApt.id)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const aptToResubmit = selectedApt;
                        setSelectedApt(null);
                        onResubmitBooking(aptToResubmit);
                      }}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" /> Reschedule
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      const aptToResubmit = selectedApt;
                      setSelectedApt(null);
                      onResubmitBooking(aptToResubmit);
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Book Follow-up
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
