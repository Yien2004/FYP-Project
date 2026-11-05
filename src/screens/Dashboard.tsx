import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Heart, 
  MapPin, 
  FileText, 
  Calendar, 
  Trash2, 
  Activity, 
  AlertTriangle, 
  Check, 
  Clock, 
  QrCode, 
  ShieldCheck, 
  FileDown,
  User,
  HeartHandshake,
  Pill,
  X,
  Eye,
  Stethoscope,
  Building2
} from "lucide-react";
import { PatientProfile, Appointment, VitalSign } from "../types";

interface DashboardProps {
  patientProfile: PatientProfile;
  appointments: Appointment[];
  vitals: VitalSign[];
  onSetScreen: (screen: string) => void;
  onPostponedStatus: (id: string, newDate: string) => void;
  onCancelAppointment?: (id: string) => void;
  onResubmitBooking?: (apt: Appointment) => void;
}

function MockQRCode() {
  return (
    <svg className="w-14 h-14 text-slate-800 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h4v4H3zM3 17h4v4H3zM17 3h4v4h-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h2v2H9zM9 9h2v2H9zM13 3h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2zM17 9h2v2h-2zM17 13h2v2h-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h4v2H3zM17 17h2v2h-2zM13 17h2v2h-2zM9 17h2v2H9z" />
    </svg>
  );
}const getClinicTravelTime = (clinicName: string): number => {
  const name = clinicName.toLowerCase();
  if (name.includes("main hospital") || name.includes("bayan lepas")) return 14;
  if (name.includes("premier") || name.includes("bayan baru")) return 8;
  if (name.includes("heart") || name.includes("georgetown")) return 16;
  if (name.includes("specialist") || name.includes("ayer itam")) return 12;
  return 15; // default fallback
};

export default function Dashboard({ 
  patientProfile, 
  appointments, 
  vitals, 
  onSetScreen, 
  onPostponedStatus,
  onCancelAppointment,
  onResubmitBooking 
}: DashboardProps) {
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Find next upcoming appointment (only today or future)
  const nextUpcoming = useMemo(() => {
    return appointments.find(a => 
      (!a.date || a.date >= todayStr) && 
      ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status)
    ) || null;
  }, [appointments, todayStr]);

  // List of upcoming appointments (only today or future)
  const upcomingList = useMemo(() => {
    return appointments.filter(a => 
      (!a.date || a.date >= todayStr) && 
      ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status)
    );
  }, [appointments, todayStr]);

  // List of completed/cancelled appointments: includes all completed/cancelled, OR any past date appointments
  const completedList = useMemo(() => {
    return appointments.filter(a => {
      const isPast = a.date ? a.date < todayStr : false;
      return isPast || ["Completed", "Cancelled", "Done", "COMPLETED", "CANCELLED", "Missing"].includes(a.status);
    });
  }, [appointments, todayStr]);

  const getAptDateTime = (apt: Appointment) => {
    if (!apt.date || !apt.timeSlot) return null;
    const dateParts = apt.date.split("-");
    if (dateParts.length !== 3) return null;
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);

    const match = apt.timeSlot.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return null;
    
    let [_, hoursStr, minutesStr, period] = match;
    let hours = parseInt(hoursStr, 10);
    let minutes = parseInt(minutesStr, 10);
    
    if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
    
    return new Date(year, month, day, hours, minutes, 0, 0);
  };

  const checkQueueActivation = (apt: Appointment) => {
    if (!["Upcoming", "Approved", "Pending", "Rescheduled"].includes(apt.status)) return { active: false, startsAtStr: "" };
    
    const aptTime = getAptDateTime(apt);
    if (!aptTime) return { active: false, startsAtStr: "" };
    
    const now = new Date();
    const diffMs = aptTime.getTime() - now.getTime();
    const fourHoursMs = 4 * 60 * 60 * 1000;
    
    if (diffMs > 0 && diffMs <= fourHoursMs) {
      return { active: true, startsAtStr: "" };
    } else if (diffMs > fourHoursMs) {
      const trackingStart = new Date(aptTime.getTime() - fourHoursMs);
      const trackingStartStr = trackingStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const dateOption = { month: 'short', day: 'numeric' } as const;
      const dateStr = trackingStart.toLocaleDateString([], dateOption);
      return { 
        active: false, 
        startsAtStr: `Queue tracker will activate on ${dateStr} at ${trackingStartStr} (4h prior to booking)` 
      };
    } else {
      return { active: false, startsAtStr: "This appointment queue session has expired or is being processed." };
    }
  };

  // Selected completed visit for viewing doctor notes, department, medication details
  const [selectedVisitModal, setSelectedVisitModal] = useState<Appointment | null>(null);

  // Helper to parse clinical notes
  const parseVisitDetails = (apt: Appointment | null) => {
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

  const parsedVisit = parseVisitDetails(selectedVisitModal);

  // Dynamic selector options for Queue Tracker - ONLY show booked clinics with upcoming appointments
  const queueClinics = useMemo(() => {
    return Array.from(
      new Set(
        appointments
          .filter(a => ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status))
          .map(a => a.clinic)
          .filter((c): c is string => !!c)
      )
    );
  }, [appointments]);

  const canRescheduleOrCancel = (apt: any) => {
    const normStatus = (apt.status || '').toLowerCase();
    if (['checked in', 'checked_in', 'calling', 'in_consultation', 'in consultation', 'completed', 'done', 'cancelled', 'rejected'].includes(normStatus)) {
      return false;
    }
    if (!['upcoming', 'approved', 'pending', 'rescheduled'].includes(normStatus)) {
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

  const [selectedQueueClinic, setSelectedQueueClinic] = useState("");

  // Sync selection if options change
  useEffect(() => {
    if (queueClinics.length > 0) {
      if (!selectedQueueClinic || !queueClinics.includes(selectedQueueClinic)) {
        setSelectedQueueClinic(queueClinics[0]);
      }
    } else {
      setSelectedQueueClinic("");
    }
  }, [queueClinics, selectedQueueClinic]);

  // Find the selected upcoming appointment
  const activeApt = useMemo(() => {
    return appointments.find(a => ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status) && a.clinic === selectedQueueClinic) || null;
  }, [selectedQueueClinic, appointments]);

  const [presenceConfirmed, setPresenceConfirmed] = useState<boolean>(false);
  const [simulateCheckInWindow, setSimulateCheckInWindow] = useState<boolean>(false);

  useEffect(() => {
    if (activeApt) {
      setPresenceConfirmed(activeApt.checkedIn || localStorage.getItem(`presence_${activeApt.id}`) === "true");
    } else {
      setPresenceConfirmed(false);
    }
  }, [activeApt]);

  // Generate a deterministic ticket number based on clinic choice or stored queueNumber
  const myTicket = useMemo(() => {
    if (activeApt?.queueNumber) return activeApt.queueNumber;
    if (!selectedQueueClinic) return "#Q-100";
    if (activeApt) {
      const code = parseInt(activeApt.id.replace(/\D/g, ""), 10) || 124;
      return `#Q-${100 + (code % 250)}`;
    }
    const clinicSum = selectedQueueClinic.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `#Q-${100 + (clinicSum % 250)}`;
  }, [selectedQueueClinic, activeApt]);

  // 5–10 minute check-in window validation
  const checkInWindow = useMemo(() => {
    if (!activeApt) return { canCheckIn: false, reason: "No active consultation", isTooEarly: false };
    if (simulateCheckInWindow) return { canCheckIn: true, reason: "Check-in window active (Simulation Mode).", isTooEarly: false };
    
    const aptTime = getAptDateTime(activeApt);
    if (!aptTime) return { canCheckIn: true, reason: "", isTooEarly: false };

    const now = new Date();
    const diffMs = aptTime.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (60 * 1000));

    // Check-in window: between 10 minutes before and 15 minutes after appointment time
    if (diffMins > 10) {
      const unlockTime = new Date(aptTime.getTime() - 10 * 60 * 1000);
      const timeStr = unlockTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return { 
        canCheckIn: false, 
        reason: `Check-in unlocks 5–10 minutes before your slot (at ${timeStr}).`,
        isTooEarly: true 
      };
    } else if (diffMins < -15) {
      return { 
        canCheckIn: false, 
        reason: `Appointment slot has lapsed. Please approach the triage reception desk directly.`,
        isTooEarly: false 
      };
    } else {
      return { canCheckIn: true, reason: "You are currently within the 5–10 min arrival check-in window.", isTooEarly: false };
    }
  }, [activeApt, simulateCheckInWindow]);

  const handleConfirmPresence = async () => {
    if (!activeApt) return;
    const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem(`presence_${activeApt.id}`, "true");
    setPresenceConfirmed(true);

    try {
      const token = localStorage.getItem("carepoint_access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Update appointment status to confirm check-in in DB metadata
      await fetch(`/api/appointments/${activeApt.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ 
          checkedIn: true,
          checkInTime,
          queueNumber: myTicket
        })
      });

      await fetch("/api/logs", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: `Queue Ticket Check-in: Patient ${patientProfile.fullName} confirmed on-site arrival at ${activeApt.clinic} reception desk for ticket ${myTicket} at ${checkInTime}.`,
          level: "info"
        })
      });
      alert(`✓ CHECK-IN CONFIRMED!\n\nYour arrival has been recorded at ${activeApt.clinic}. Reception desk notified for Ticket ${myTicket}.`);
    } catch (err) {
      console.error("Failed to post presence log to database", err);
    }
  };

  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const handleTriggerAiReminder = async (aptId: string) => {
    setIsSendingReminder(true);
    try {
      const token = localStorage.getItem("carepoint_access_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/appointments/${aptId}/ai-reminder`, {
        method: "POST",
        headers
      });
      const data = await res.json();
      if (res.ok) {
        alert(`APPOINTMENT REMINDER SENT!\n\n${data.reminder?.title || 'Appointment Reminder'}\n\n${data.reminder?.body || 'Check your Notifications tab to view the generated reminder.'}`);
      } else {
        alert(`Could not trigger AI reminder: ${data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error triggering reminder: ${err.message}`);
    } finally {
      setIsSendingReminder(false);
    }
  };

  const queueStatus = useMemo(() => {
    if (!activeApt) return { active: false, startsAtStr: "" };
    return checkQueueActivation(activeApt);
  }, [activeApt, todayStr]);

  const ticketInt = useMemo(() => {
    return parseInt(myTicket.replace("#Q-", "").replace("#", ""), 10) || 100;
  }, [myTicket]);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [mockOffset, setMockOffset] = useState(0);

  // Sync / count down remaining seconds
  useEffect(() => {
    if (!activeApt) {
      setSecondsLeft(null);
      return;
    }
    const updateTimer = () => {
      const aptTime = getAptDateTime(activeApt);
      if (!aptTime) {
        setSecondsLeft(null);
        return;
      }
      const now = new Date();
      const diff = Math.floor((aptTime.getTime() - now.getTime()) / 1000);
      setSecondsLeft(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeApt]);

  // Reset mock offset when active clinic changes
  useEffect(() => {
    setMockOffset(0);
  }, [selectedQueueClinic]);

  const currentLive = useMemo(() => {
    if (secondsLeft === null || secondsLeft <= 0) return ticketInt;
    const fourHoursSeconds = 4 * 60 * 60;
    const ratio = Math.max(0, Math.min(1, (fourHoursSeconds - secondsLeft) / fourHoursSeconds)); // 0 to 1
    const ticketsBehind = 20;
    // Tick smoothly from 20 tickets behind up to user ticket
    const currentOffset = Math.max(0, Math.floor(ticketsBehind * (1 - ratio)) - mockOffset);
    return Math.min(ticketInt, ticketInt - currentOffset);
  }, [secondsLeft, ticketInt, mockOffset]);

  const slotsAhead = ticketInt - currentLive;
  const estimatedWait = slotsAhead > 0 ? slotsAhead * 5 : 0;

  const formatCountdown = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      String(hrs).padStart(2, '0'),
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].join(":");
  };

  const handleCancelClick = (id: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      if (onCancelAppointment) {
        onCancelAppointment(id);
      }
    }
  };


  return (
    <div id="dashboard-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* 1. TOP BANNER: Dynamic welcome card (Clean light blue theme) */}
      <div className="bg-gradient-to-r from-sky-50/80 via-blue-50/50 to-white border border-sky-100 text-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome, {patientProfile.fullName.split(" ")[0]}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            {nextUpcoming ? (
              <span>
                <strong className="text-slate-900">Reminder:</strong> You have an upcoming consultation with <strong className="text-sky-700">{nextUpcoming.doctorName}</strong> at <strong className="text-slate-900">{nextUpcoming.clinic}</strong> scheduled on <strong className="text-slate-900">{nextUpcoming.date}</strong> at <strong className="text-slate-900">{nextUpcoming.timeSlot}</strong>.
              </span>
            ) : (
              <span>
                <strong className="text-slate-900">Health Tip:</strong> Maintain a balanced lifestyle with regular hydration, adequate sleep, and daily physical activity. Schedule routine checkups at PantaiCare to keep your vital statistics in optimal range.
              </span>
            )}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-4 translate-x-4 pointer-events-none text-sky-600">
          <HeartHandshake className="w-48 h-48 text-sky-500" />
        </div>
      </div>

      <div className="space-y-8">
          
          {/* 2. UPCOMING BOOKINGS */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Upcoming Consultations
            </h2>

            {upcomingList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                <p className="text-slate-500 text-xs font-semibold">
                  No upcoming consultations scheduled at this time.
                </p>
                <button
                  onClick={() => onSetScreen("schedule-appointment")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition cursor-pointer shadow-md shadow-blue-600/15 inline-flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" /> Book Appointment Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {upcomingList.map((apt) => (
                  <div 
                    key={apt.id} 
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{apt.doctorName}</span>
                          <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {apt.type}
                          </span>
                          <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs font-mono font-black px-2.5 py-0.5 rounded-lg shadow-2xs">
                            {apt.queueNumber ? (apt.queueNumber.startsWith('#') ? apt.queueNumber : `#${apt.queueNumber}`) : '#Q-101'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{apt.specialty}</span>
                        <span className="text-xs text-slate-700 font-bold block mt-1.5">{apt.clinic}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" /> {apt.date}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> {apt.timeSlot}
                        </span>
                        <span className="text-teal-700 font-bold font-mono text-[11px] bg-teal-50/60 px-2 py-0.5 rounded border border-teal-100">
                          Queue: {apt.queueNumber ? (apt.queueNumber.startsWith('#') ? apt.queueNumber : `#${apt.queueNumber}`) : '#Q-101'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                      {canRescheduleOrCancel(apt) && onResubmitBooking && (
                        <button 
                          type="button"
                          onClick={() => onResubmitBooking(apt)}
                          className="flex-1 sm:flex-none bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-sky-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          <span>Reschedule</span>
                        </button>
                      )}
                      {canRescheduleOrCancel(apt) && (
                        <button 
                          onClick={() => handleCancelClick(apt.id)}
                          className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-200 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. LIVE QUEUE STATUS TRACKER (Shown after booking / if there are booked facilities) */}
          {queueClinics.length > 0 && (
            <div className="bg-white text-slate-800 rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <span className="text-[10px] tracking-widest font-mono text-sky-700 uppercase block font-bold">Outpatient Live Queue Counter</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-600 font-bold">Facility:</span>
                    <select 
                      value={selectedQueueClinic}
                      onChange={(e) => setSelectedQueueClinic(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      {queueClinics.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {queueStatus.active && (
                  <div className="flex items-center gap-2 self-start sm:self-center bg-sky-50 border border-sky-200 px-3 py-1 rounded-full shrink-0">
                    <span className="w-2 h-2 bg-emerald-500 animate-ping rounded-full"></span>
                    <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider font-mono">
                      Live Counter
                    </span>
                  </div>
                )}
              </div>

              {queueStatus.active ? (
                <>
                  {/* Countdown Timer Row */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-4 font-mono">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Appointment Countdown</span>
                      <span className="text-xl font-black text-slate-900 tracking-widest">{formatCountdown(secondsLeft)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Scheduled Time</span>
                      <span className="text-xs font-bold text-slate-800">{activeApt?.timeSlot} ({activeApt?.date})</span>
                    </div>
                  </div>

                  {/* On-Site Presence Check-In Card (Module 1 Requirement: 5-10 min arrival check-in) */}
                  <div className={`p-4.5 rounded-2xl border transition-all duration-300 ${
                    presenceConfirmed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : checkInWindow.canCheckIn
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {presenceConfirmed ? (
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : checkInWindow.canCheckIn ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                        ) : (
                          <span className="text-lg shrink-0 mt-0.5">⏱️</span>
                        )}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                              {presenceConfirmed 
                                ? "✓ On-Site Check-In Confirmed" 
                                : checkInWindow.canCheckIn 
                                  ? "On-Site Arrival Check-In (5–10 Min Window Active)" 
                                  : "On-Site Check-In Pending"}
                            </p>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-sky-800 border border-sky-200 font-bold">
                              Ticket {myTicket}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-normal font-sans">
                            {presenceConfirmed 
                              ? `Your physical arrival has been recorded for ${activeApt.clinic}. Please standby in the waiting area.`
                              : checkInWindow.canCheckIn
                                ? "You are within the 5–10 minute check-in window. Confirm your arrival now to notify the clinic reception desk."
                                : `${checkInWindow.reason || 'Check-in is only permitted 5–10 minutes before your scheduled appointment time.'}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end">
                        {!presenceConfirmed && checkInWindow.canCheckIn && (
                          <button
                            type="button"
                            onClick={handleConfirmPresence}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition shadow-sm cursor-pointer active:scale-95 text-center flex-1 sm:flex-initial"
                          >
                            Confirm On-Site Check-In
                          </button>
                        )}
                        {!presenceConfirmed && !checkInWindow.canCheckIn && (
                          <button
                            type="button"
                            onClick={() => setSimulateCheckInWindow(prev => !prev)}
                            className="bg-white hover:bg-slate-50 text-sky-700 text-[11px] font-bold px-3 py-2 rounded-xl transition border border-slate-200 cursor-pointer text-center shadow-xs"
                            title="Toggle simulated 5-10 minute window for presentation/testing"
                          >
                            ⚡ Demo: {simulateCheckInWindow ? "Re-lock Window" : "Simulate 5-10m Window"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 items-center text-center">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1 font-semibold">My Ticket Number</span>
                      <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{myTicket}</span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-[11px] text-slate-500 block mb-1 font-semibold">Current Live Number</span>
                      <span className="text-3xl font-black text-sky-600 font-mono tracking-tight">#{currentLive}</span>
                    </div>
                    <div className="col-span-2 md:col-span-1 pt-2 md:pt-0">
                      <span className="text-[11px] text-slate-500 block mb-1 font-semibold">Estimated Waiting Window</span>
                      <span className="text-lg font-bold font-mono text-slate-900 block">
                        {slotsAhead > 0 ? `~${estimatedWait} Minutes Remaining` : "Proceed Now!"}
                      </span>
                      <span className="text-[10px] text-sky-700 font-bold block mt-0.5">
                        {slotsAhead > 0 ? `${slotsAhead} patient${slotsAhead > 1 ? 's' : ''} ahead` : "Calling your ticket"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-700 text-center sm:text-left">
                      {slotsAhead <= 2 && slotsAhead >= 0 ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] uppercase tracking-wider border border-emerald-200">
                          ● {slotsAhead === 0 ? "Your Turn - Proceed to Room now!" : `${slotsAhead} Slots Away - Please Standby!`}
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                          ● Waiting in Queue
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setMockOffset(prev => prev + 1)}
                        disabled={slotsAhead <= 0}
                        className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-[10px] uppercase tracking-wider font-extrabold px-4.5 py-2 rounded-xl transition shrink-0 cursor-pointer shadow-xs"
                      >
                        Advance Live Ticket (+1)
                      </button>
                      <button 
                        onClick={() => setMockOffset(0)}
                        className="border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] uppercase tracking-wider font-extrabold px-3 py-2 rounded-xl transition shrink-0 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-slate-700">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-extrabold text-slate-900 block">Queue Tracker Standby</span>
                    <p className="mt-1 text-slate-500 font-medium">
                      {queueStatus.startsAtStr || "Live queue counter updates will initialize exactly 4 hours prior to your scheduled consultation."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. PAST VISIT HISTORY TABLE */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Past Visit History
            </h2>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Doctor & Specialty</th>
                      <th className="p-4">Prescription / Treatment</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 font-medium italic">
                          No completed consultations recorded in database.
                        </td>
                      </tr>
                    ) : (
                      completedList.slice(0, 5).map((apt) => (
                        <tr 
                          key={apt.id} 
                          onClick={() => setSelectedVisitModal(apt)}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                        >
                          <td className="p-4 font-mono font-bold text-slate-700 whitespace-nowrap">{apt.date}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 block">{apt.doctorName}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                apt.status === 'Cancelled' ? 'bg-red-55 text-red-700 border border-red-150' : 'bg-emerald-55 text-emerald-700 border border-emerald-150'
                              }`}>
                                {apt.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{apt.specialty}</span>
                          </td>
                          <td className="p-4 text-slate-600 leading-normal max-w-xs">
                            {apt.prescription || "General consultation filed."}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVisitModal(apt);
                              }}
                              className="text-sky-600 hover:text-sky-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {completedList.length > 5 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => onSetScreen("appointments-history")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    View All Past History ({completedList.length}) &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Medication Reminders Card */}
          {patientProfile.prescriptions && patientProfile.prescriptions.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900">
                <Pill className="w-5 h-5 text-blue-600" />
                <span className="font-extrabold text-sm tracking-tight">Active Medication Reminders</span>
              </div>

              <div className="space-y-3">
                {patientProfile.prescriptions.map((rx) => (
                  <div key={rx.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex items-start gap-3.5 hover:border-blue-500 hover:bg-blue-50/10 transition-all duration-150">
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                      <Pill className="w-4.5 h-4.5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-black text-slate-900 text-xs block leading-snug">{rx.drugName}</span>
                      <p className="text-[10px] text-slate-450 font-mono mt-0.5">
                        {rx.dosage} • {rx.frequency} {rx.foodTiming && `• ${rx.foodTiming}`}
                      </p>
                      {rx.instructions && (
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-normal">
                          Inst: {rx.instructions}
                        </p>
                      )}
                      {rx.scheduledTimes && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {rx.scheduledTimes.split(",").map((time: string) => (
                            <span key={time} className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold">
                              {time.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50 text-[9px] text-slate-555 font-mono">
                        <span>Duration: <strong>{rx.duration}</strong></span>
                        <span className="text-blue-600 font-bold">By {rx.prescribedBy || "Dr. Sarah Jenkins"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* Consultation Encounter Details / Doctor Visit Results Modal */}
      {selectedVisitModal && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedVisitModal(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full font-mono">
                  Visit Record Details
                </span>
                <h3 className="text-base font-extrabold text-slate-950 mt-1 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-sky-600" />
                  Consultation Summary
                </h3>
              </div>
              <button 
                onClick={() => setSelectedVisitModal(null)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Doctor & Clinic Info Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{selectedVisitModal.doctorName}</h4>
                      <p className="text-[11px] text-sky-700 font-semibold">{selectedVisitModal.specialty}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                    selectedVisitModal.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedVisitModal.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedVisitModal.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedVisitModal.timeSlot || "Scheduled slot"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedVisitModal.clinic || selectedVisitModal.hospital || "Penang Healthcare Facility"}</span>
                </div>
              </div>

              {/* Reported Symptoms */}
              {selectedVisitModal.symptoms && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                    Reported Symptoms & Chief Concern
                  </span>
                  <p className="text-slate-700 text-xs leading-relaxed italic">
                    "{selectedVisitModal.symptoms}"
                  </p>
                </div>
              )}

              {/* Clinical Diagnosis */}
              {parsedVisit.diagnosis && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                    Clinical Diagnosis
                  </span>
                  <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5">
                    <p className="text-slate-900 font-extrabold text-xs">
                      {parsedVisit.diagnosis}
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
                  {parsedVisit.notes || "General outpatient examination completed with normal baseline status."}
                </p>
              </div>

              {/* Prescribed Medication */}
              <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 block font-mono flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-600" />
                  Prescribed Medication
                </span>
                {parsedVisit.prescription ? (
                  <div className="bg-white border border-teal-100 rounded-xl p-2.5 space-y-1.5">
                    {parsedVisit.prescription.split(/[,;\n]+/).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-teal-950 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 mt-1.5" />
                        <span>{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs leading-relaxed bg-white p-2.5 rounded-xl border border-teal-100 italic">
                    No prescription required for this consultation.
                  </p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button 
                onClick={() => setSelectedVisitModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close View
              </button>
              <button 
                onClick={() => {
                  setSelectedVisitModal(null);
                  onSetScreen("schedule-appointment");
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" /> Book Follow-up
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
