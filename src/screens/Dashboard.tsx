import React, { useState, useEffect, useMemo } from "react";
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
  Database,
  Download
} from "lucide-react";
import { PatientProfile, Appointment, VitalSign } from "../types";

interface DashboardProps {
  patientProfile: PatientProfile;
  appointments: Appointment[];
  vitals: VitalSign[];
  onSetScreen: (screen: string) => void;
  onPostponedStatus: (id: string, newDate: string) => void;
  onCancelAppointment?: (id: string) => void;
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
  if (name.includes("pantai")) return 14;
  if (name.includes("pulau pinang")) return 18;
  if (name.includes("seberang jaya")) return 25;
  if (name.includes("jalan perak")) return 10;
  if (name.includes("bayan baru")) return 12;
  if (name.includes("bukit mertajam")) return 28;
  if (name.includes("lam wah ee")) return 15;
  if (name.includes("gleneagles")) return 16;
  if (name.includes("island")) return 11;
  if (name.includes("adventist")) return 13;
  if (name.includes("loh guan lye")) return 12;
  if (name.includes("kpj")) return 22;
  if (name.includes("o2")) return 9;
  if (name.includes("singapore")) return 15;
  if (name.includes("perdana")) return 8;
  return 15; // default fallback
};

export default function Dashboard({ 
  patientProfile, 
  appointments, 
  vitals, 
  onSetScreen, 
  onPostponedStatus,
  onCancelAppointment 
}: DashboardProps) {
  // Find next upcoming appointment
  const nextUpcoming = useMemo(() => {
    return appointments.find(a => ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status)) || null;
  }, [appointments]);

  // List of upcoming appointments
  const upcomingList = useMemo(() => {
    return appointments.filter(a => ["Upcoming", "Approved", "Pending", "Rescheduled"].includes(a.status));
  }, [appointments]);

  // List of completed/cancelled appointments
  const completedList = useMemo(() => {
    return appointments.filter(a => ["Completed", "Cancelled", "Done", "Missing"].includes(a.status));
  }, [appointments]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

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

  const waitTimeFacilities = [
    "Hospital Pulau Pinang",
    "Pantai Hospital Kuala Lumpur",
    "O2 Klinik",
    "Klinik Singapore",
    "Sunway Medical Centre Petaling Jaya",
    "Pantai Hospital Cheras",
    "Island Hospital",
    "Gleneagles Hospital Penang"
  ];

  const getFacilityWaitTime = (facilityName: string) => {
    const d = new Date();
    const hour = d.getHours();
    
    // Seed offset using the character codes of the facility name
    const nameSeed = facilityName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offset = (nameSeed % 7) - 3; // range [-3, +3] minutes
    
    let baseWait = 15;
    
    if (hour >= 8 && hour < 10) {
      baseWait = 25; // morning rush
    } else if (hour >= 10 && hour < 12) {
      baseWait = 15; // mid morning
    } else if (hour >= 12 && hour < 14) {
      baseWait = 35; // lunch peak (12pm to 2pm)
    } else if (hour >= 14 && hour < 17) {
      baseWait = 20; // afternoon
    } else if (hour >= 17 && hour < 20) {
      baseWait = 25; // evening rush
    } else {
      baseWait = 10; // night off-peak
    }
    
    return Math.max(5, baseWait + offset);
  };

  const [showWaitTimesModal, setShowWaitTimesModal] = useState(false);

  const checkFacilityOpenStatus = (facilityName: string) => {
    const d = new Date();
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = d.getHours();
    const minute = d.getMinutes();
    const currentFloatHour = hour + minute / 60;

    if (facilityName === "O2 Klinik") {
      // Mon-Sat: 8:30 AM - 9:00 PM
      if (day === 0) return { isOpen: false, hoursStr: "Mon–Sat: 8:30 AM – 9:00 PM (Closed Today)" };
      const open = currentFloatHour >= 8.5 && currentFloatHour < 21.0;
      return { isOpen: open, hoursStr: "Mon–Sat: 8:30 AM – 9:00 PM" };
    }
    
    if (facilityName === "Klinik Singapore") {
      // Mon-Sat: 8:00 AM - 6:00 PM
      if (day === 0) return { isOpen: false, hoursStr: "Mon–Sat: 8:00 AM – 6:00 PM (Closed Today)" };
      const open = currentFloatHour >= 8.0 && currentFloatHour < 18.0;
      return { isOpen: open, hoursStr: "Mon–Sat: 8:00 AM – 6:00 PM" };
    }
    
    // Hospitals are open 24/7
    return { isOpen: true, hoursStr: "Open 24 Hours" };
  };

  // Lock body scroll when wait times modal is open
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      const modalElement = document.getElementById("wait-times-modal-container");
      if (modalElement && !modalElement.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    if (showWaitTimesModal) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100vh";
      document.addEventListener("touchmove", preventDefault, { passive: false });
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
      document.removeEventListener("touchmove", preventDefault);
    };
  }, [showWaitTimesModal]);

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
        alert(`🤖 AI APPOINTMENT REMINDER SENT!\n\n${data.reminder?.title || 'Appointment Reminder'}\n\n${data.reminder?.body || 'Check your Notifications tab to view the generated reminder.'}`);
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

  // Last completed appointment for Medical Certificate (MC) Module
  const lastCompleted = useMemo(() => {
    return appointments.find(a => a.status === "Completed") || null;
  }, [appointments]);

  // Compute MC End Date
  const mcEndDateStr = useMemo(() => {
    if (!lastCompleted) return "";
    const parts = lastCompleted.date.split("-");
    if (parts.length !== 3) return "";
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    dateObj.setDate(dateObj.getDate() + 1); // 2 Days rest total (Day A and Day A+1)
    return dateObj.toISOString().split("T")[0];
  }, [lastCompleted]);

  const handleCancelClick = (id: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      if (onCancelAppointment) {
        onCancelAppointment(id);
      }
    }
  };

  // ── EHR Export & Attachments States ──
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  const completedAppointments = useMemo(() => {
    return appointments.filter(apt => apt.status === "Completed");
  }, [appointments]);

  useEffect(() => {
    if (completedAppointments.length > 0 && !selectedVisitId) {
      setSelectedVisitId(completedAppointments[0].id);
    }
  }, [completedAppointments, selectedVisitId]);

  const handleExportSingleVisit = () => {
    const apt = appointments.find(a => a.id === selectedVisitId);
    if (!apt) return;
    const matchingVitals = vitals.filter(v => v.timestamp.substring(0, 10) === apt.date);
    
    const reportData = {
      patientEmail: patientProfile.email,
      patientName: patientProfile.fullName,
      visitDetails: {
        id: apt.id,
        doctorName: apt.doctorName,
        specialty: apt.specialty,
        date: apt.date,
        timeSlot: apt.timeSlot,
        clinic: apt.clinic || apt.doctorName,
        symptoms: apt.symptoms,
        clinicalNotes: apt.clinicalNotes || "No clinical notes entered.",
        prescription: apt.prescription || "No prescriptions on this visit."
      },
      matchingVitals: matchingVitals,
      exportTimestamp: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PenangHealth_Report_${apt.date}_${apt.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert("SUCCESS: Clinic visit report exported!");
  };

  const handleDownloadPrescription = (apt: Appointment) => {
    const contents = `PenangHealth Outpatient Consultation & Prescription Ledger\n=======================================================\nDate: ${apt.date}\nDoctor: ${apt.doctorName} (${apt.specialty})\nPatient Name: ${patientProfile.fullName}\n\nClinical Notes:\n${apt.clinicalNotes || "General consultation filed."}\n\nPrescribed Medication:\n${apt.prescription || "None."}\n=======================================================\nGenerated by PenangHealth Patient Portal.`;
    const blob = new Blob([contents], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Prescription_Ledger_${apt.date}_${apt.doctorName.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMC = (apt: Appointment) => {
    const contents = `PenangHealth Digital Medical Certificate (MC)\n=======================================================\nDate of Issue: ${apt.date}\nAttending Physician: ${apt.doctorName}\nClinic/Facility: ${apt.clinic || apt.doctorName}\nPatient: ${patientProfile.fullName}\nMyKad/Passport: ${patientProfile.myKadOrPassport}\n\nThis certifies that the patient was evaluated and is unfit for duty for a period of 1 day(s) starting on ${apt.date}.\n\nVerification Code: REG-PH-${(apt.doctorId || "DOC").toUpperCase().slice(0, 5)}\n=======================================================\nPenangHealth Verified Digital MC`;
    const blob = new Blob([contents], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MC_${apt.clinic?.replace(/[^a-zA-Z0-9]/g, "_") || "Clinic"}_${apt.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      profile: patientProfile,
      vitalsIndex: vitals,
      appointmentsHistory: appointments,
      backupTimestamp: new Date().toISOString()
    }, null, 2));
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PenangHealth_Health_Record_${patientProfile.myKadOrPassport || "EHR"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert("SUCCESS: Secure database profile exported! Check your Downloads folder.");
  };

  const handleDownloadAttachment = (file: any) => {
    if (file.data && file.data.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const contents = `PenangHealth Records System\n=======================================\nDocument: ${file.name}\nSize: ${file.size}\nUploaded: ${file.uploadedAt || "June 15, 2026"}\nPatient Name: ${patientProfile.fullName}\nPatient DOB: ${patientProfile.dateOfBirth}\nGender: ${patientProfile.gender}\nEmail: ${patientProfile.email}\n---------------------------------------\nOfficial Clinical Document Export • Penang Private Healthcare Network\n`;
      const blob = new Blob([contents], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name.includes('.') ? file.name : `${file.name}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div id="dashboard-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* 1. TOP BANNER: Dynamic welcome card (Clean light blue theme) */}
      <div className="bg-gradient-to-r from-sky-50/80 via-blue-50/50 to-white border border-sky-100 text-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Selamat Datang, {patientProfile.fullName.split(" ")[0]}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            {nextUpcoming ? (
              <span>
                <strong className="text-slate-900">Reminder:</strong> You have an upcoming consultation with <strong className="text-sky-700">{nextUpcoming.doctorName}</strong> at <strong className="text-slate-900">{nextUpcoming.clinic}</strong> scheduled on <strong className="text-slate-900">{nextUpcoming.date}</strong> at <strong className="text-slate-900">{nextUpcoming.timeSlot}</strong>.
              </span>
            ) : (
              <span>
                <strong className="text-slate-900">Health Tip:</strong> Maintain a balanced lifestyle with regular hydration, adequate sleep, and daily physical activity. Schedule routine checkups to keep your vital statistics in optimal range.
              </span>
            )}
          </p>

          {nextUpcoming && (
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onSetScreen("fetching-transit")}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
              >
                <span>🚗</span>
                <span>Book Grab Ride (Simulation)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerAiReminder(nextUpcoming.id)}
                disabled={isSendingReminder}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs px-3.5 py-1.5 rounded-xl transition border border-slate-200 cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
              >
                <span>🤖</span>
                <span>{isSendingReminder ? "Sending AI Reminder..." : "Test AI 24h Reminder"}</span>
              </button>
            </div>
          )}
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-4 translate-x-4 pointer-events-none text-sky-600">
          <HeartHandshake className="w-48 h-48 text-sky-500" />
        </div>
      </div>

      {/* Grab Fetching Ride Panel */}
      {nextUpcoming && nextUpcoming.requestRide && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-md shadow-blue-600/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border-l-4 border-l-blue-600">
          <div className="flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 text-xl animate-pulse">
              🚗
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full inline-block">
                Grab Outpatient Transit Service
              </span>
              <h3 className="text-sm font-extrabold text-slate-800">
                Driver is on the way to pick you up
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Driver <span className="font-bold text-slate-700">Danish</span> (Proton Saga Grey - <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold">WEE 2026</span>) is arriving. Destination strictly locked to <span className="font-bold text-blue-700">{nextUpcoming.clinic}</span>.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 w-full md:w-auto">
            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Arrival</span>
              <span className="text-2xl font-black text-blue-700 tracking-tight block">{getClinicTravelTime(nextUpcoming.clinic)} Mins</span>
            </div>
            {/* Simple Transit Progress Bar */}
            <div className="w-full md:w-48 bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden relative">
              <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Upcoming Bookings, Live Queue Tracker, and Past Visit History */}
        <div className="lg:col-span-8 space-y-8">
          
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
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{apt.doctorName}</span>
                          <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {apt.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{apt.specialty}</span>
                        <span className="text-xs text-slate-700 font-bold block mt-1.5">{apt.clinic}</span>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" /> {apt.date}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> {apt.timeSlot}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                      <button 
                        onClick={() => onSetScreen("communication")}
                        className="flex-1 sm:flex-none border border-slate-200 hover:border-blue-500 hover:text-blue-700 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                      >
                        Message Staff
                      </button>
                      <button 
                        onClick={() => handleCancelClick(apt.id)}
                        className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-200 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Cancel
                      </button>
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

                <div className="flex items-center gap-2 self-start sm:self-center bg-sky-50 border border-sky-200 px-3 py-1 rounded-full shrink-0">
                  <span className={`w-2 h-2 ${queueStatus.active ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'} rounded-full`}></span>
                  <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider font-mono">
                    {queueStatus.active ? "Live Counter" : "Standby Status"}
                  </span>
                </div>
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
                        <tr key={apt.id} className="hover:bg-slate-50/50 transition">
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
                              onClick={() => handleDownloadPrescription(apt)}
                              className="text-blue-600 hover:text-blue-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition"
                            >
                              <FileDown className="w-3.5 h-3.5" /> Download
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
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900">
              <Pill className="w-5 h-5 text-blue-600" />
              <span className="font-extrabold text-sm tracking-tight">Active Medication Reminders</span>
            </div>

            {patientProfile.prescriptions && patientProfile.prescriptions.length > 0 ? (
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
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center space-y-2 text-xs">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">No Active Medications</span>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  No active medication reminders. Your clinical prescriptions will be displayed here once uploaded by clinic staff.
                </p>
              </div>
            )}
          </div>

          {/* Verified Digital MC Module */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span className="font-extrabold text-sm tracking-tight">Verified Digital MC</span>
            </div>

            {lastCompleted ? (
              <div className="space-y-4">
                {/* MC Clinic Header */}
                <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl">
                  <span className="font-black text-slate-900 text-xs block leading-tight">{lastCompleted.clinic}</span>
                  <span className="text-[9px] text-blue-700 font-mono block mt-1 font-bold">
                    MOH CODE: REG-MOH-{(lastCompleted.doctorId || "DOC").toUpperCase().slice(0, 5)}
                  </span>
                </div>

                {/* MC Leave Duration */}
                <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-1.5">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Leave Authorization</span>
                  <span className="text-sm font-black text-rose-600 block">2 Days Medical Rest</span>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">Start Date</span>
                      <strong>{lastCompleted.date}</strong>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">End Date</span>
                      <strong>{mcEndDateStr}</strong>
                    </div>
                  </div>
                </div>

                {/* Download MC PDF File block */}
                <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex items-center justify-between gap-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Medical Certificate (PDF)</span>
                      <p className="text-xs font-bold text-slate-800 truncate font-mono mt-0.5">
                        MC_{lastCompleted.clinic.replace(/[^a-zA-Z0-9]/g, "_")}_{lastCompleted.id.replace("apt-", "")}.pdf
                      </p>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] px-1.5 py-0.5 rounded font-extrabold block w-fit mt-1 uppercase tracking-wider font-mono">
                        Verified & Signed
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownloadMC(lastCompleted)}
                    className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider p-2 px-3.5 rounded-xl transition shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center space-y-2 text-xs">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">No MC Available</span>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Digital MC logs are automatically registered once a doctor files a completed outpatient consultation.
                </p>
              </div>
            )}
          </div>

          {/* My Scans & Clinical Documents (EHR Document Scan Index) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-extrabold text-sm tracking-tight">EHR Scans & Clinical Documents</span>
            </div>

            {(!patientProfile.attachments || patientProfile.attachments.length === 0) ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center space-y-2 text-xs">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">No Uploaded Files</span>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  No clinical documents or scan files have been uploaded by facility staff.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {patientProfile.attachments.map((file: any) => (
                  <div key={file.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex items-center justify-between gap-3.5 hover:border-blue-500 hover:bg-blue-50/10 transition-all duration-150">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                        <FileText className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">{file.type?.toUpperCase() || "DOCUMENT"}</span>
                        <p className="text-xs font-bold text-slate-800 truncate font-mono mt-0.5">
                          {file.name}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                          Size: {file.size} • Uploaded: {file.uploadedAt}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownloadAttachment(file)}
                        className="text-[10px] font-bold text-white bg-slate-950 hover:bg-slate-850 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Health Passport Box & Digital Medical Certificate (MC) Module */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* 5. HEALTH PASSPORT BOX */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-extrabold text-sm tracking-tight">Health Passport Ledger</span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Blood Type</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-1">{patientProfile.bloodType || "O+"}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Known Allergies</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {patientProfile.allergies && patientProfile.allergies.length > 0 ? (
                    patientProfile.allergies.map(a => (
                      <span key={a} className="bg-red-50 text-red-700 border border-red-100 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 font-medium">No known medical allergies.</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Emergency Contact</span>
                <span className="text-xs font-extrabold text-slate-800 block mt-1">{patientProfile.emergencyContactName || "Razali Bin Ahmad"}</span>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{patientProfile.emergencyContactPhone || "+60 12-987 6543 (Father)"}</span>
              </div>
            </div>
          </div>

          {/* 7. ESTIMATED FACILITY WAIT TIMES */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-extrabold text-sm tracking-tight">Facility Outpatient Wait Times</span>
              </div>
              <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                ● Live Updates
              </span>
            </div>

            <div className="space-y-2.5">
              {waitTimeFacilities
                .slice(0, 4)
                .map((facility) => {
                  const status = checkFacilityOpenStatus(facility);
                  const waitMinutes = getFacilityWaitTime(facility);
                  
                  // Color codes for badges
                  let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  let badgeText = "Normal";
                  if (!status.isOpen) {
                    badgeClass = "bg-slate-150 text-slate-500 border-slate-350";
                    badgeText = "Closed";
                  } else if (waitMinutes >= 20 && waitMinutes < 30) {
                    badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                    badgeText = "Busy";
                  } else if (waitMinutes >= 30) {
                    badgeClass = "bg-rose-50 text-rose-700 border-rose-100";
                    badgeText = "High Wait";
                  }

                  return (
                    <div 
                      key={facility} 
                      className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-800 block truncate">{facility}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {status.isOpen ? "Estimated queue delay" : `Hours: ${status.hoursStr}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`border text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`}>
                          {badgeText}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 font-mono">
                          {status.isOpen ? `~${waitMinutes} Mins` : "Closed"}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button 
                onClick={() => setShowWaitTimesModal(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition text-center cursor-pointer"
              >
                View All & Traffic Details ({waitTimeFacilities.length})
              </button>
            </div>
          </div>


          {/* 6. SECURE EHR DATA MANAGEMENT */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900">
              <Database className="w-5 h-5 text-sky-600" />
              <span className="font-extrabold text-sm tracking-tight">Personal EHR & Visit Records</span>
            </div>

            <p className="text-slate-500 leading-relaxed text-[11px]">
              You can download your clinical visit summaries, consultation notes, and full personal health records for your own records or when consulting external specialists.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Select Clinical Visit Report
                </label>
                {completedAppointments.length > 0 ? (
                  <select
                    value={selectedVisitId}
                    onChange={(e) => setSelectedVisitId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {completedAppointments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        {apt.date} - {apt.clinic || apt.doctorName} ({apt.specialty})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center text-xs text-slate-400">
                    No completed clinic visits on record.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {completedAppointments.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportSingleVisit}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Selected Report
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] uppercase tracking-wider font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-blue-600" /> Export Full Medical Ledger
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Levitating Card / Modal for All Facility Wait Times & Details */}
      {showWaitTimesModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
          onTouchMove={(e) => e.preventDefault()}
        >
          <div 
            id="wait-times-modal-container"
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            onTouchMove={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  Live Outpatient Wait Times
                </h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Real-time occupancy and estimated delay statistics
                </p>
              </div>
              <button 
                onClick={() => setShowWaitTimesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-150 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Traffic Summary Alert */}
              <div className="bg-teal-50/50 border border-teal-150 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-teal-800">
                <AlertTriangle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-teal-950">Peak Hours Advisory</span>
                  <p className="mt-1 text-teal-900">
                    Outpatient traffic generally spikes during lunch peak hours (<strong>12:00 PM – 2:00 PM</strong>) and morning rushes (<strong>8:00 AM – 10:00 AM</strong>). Wait times may fluctuate dynamically based on triage urgency.
                  </p>
                </div>
              </div>

              {/* Wait Time List */}
              <div className="space-y-3">
                {waitTimeFacilities.map((facility) => {
                  const status = checkFacilityOpenStatus(facility);
                  const waitMinutes = getFacilityWaitTime(facility);
                  
                  // Color codes for badges & progress bar
                  let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  let progressClass = "bg-emerald-500";
                  let badgeText = "Normal";
                  if (!status.isOpen) {
                    badgeClass = "bg-slate-150 text-slate-500 border-slate-350";
                    progressClass = "bg-slate-200";
                    badgeText = "Closed";
                  } else if (waitMinutes >= 20 && waitMinutes < 30) {
                    badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                    progressClass = "bg-amber-500";
                    badgeText = "Busy";
                  } else if (waitMinutes >= 30) {
                    badgeClass = "bg-rose-50 text-rose-700 border-rose-100";
                    progressClass = "bg-rose-500";
                    badgeText = "High Wait";
                  }

                  // Max estimated time is ~45 mins for the progress bar percentage calculation
                  const percentage = status.isOpen ? Math.min(100, Math.max(10, (waitMinutes / 45) * 100)) : 0;

                  return (
                    <div 
                      key={facility} 
                      className="bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:border-slate-200 transition duration-150 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-slate-800 block truncate">{facility}</span>
                          <span className="text-[10px] text-slate-450 font-mono block mt-0.5">
                            Hours: <span className="font-semibold text-slate-600">{status.hoursStr}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`border text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`}>
                            {badgeText}
                          </span>
                          <span className="text-xs font-black text-slate-800 font-mono">
                            {status.isOpen ? `~${waitMinutes} Mins` : "Closed"}
                          </span>
                        </div>
                      </div>

                      {/* Visual indicator bar */}
                      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${progressClass} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowWaitTimesModal(false)}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer text-center"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EHR Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fadeIn font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl p-6 flex flex-col gap-4 text-slate-800">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-teal-50 p-2 rounded-lg text-teal-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">EHR Document Preview</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{previewFile.id} • {previewFile.size} • Uploaded {previewFile.uploadedAt}</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-xs font-bold text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-xs text-slate-700 space-y-4 max-h-[350px] overflow-y-auto leading-relaxed shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-teal-700 block">
                    Penang Healthcare Network • Electronic Medical Record
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">{previewFile.name}</h4>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                  Verified Report
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] bg-white border border-slate-200 p-3.5 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                  <span className="font-bold text-slate-800">{patientProfile.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
                  <span className="font-bold text-slate-800 font-mono">{patientProfile.dateOfBirth || "1994-08-22"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</span>
                  <span className="font-bold text-slate-800">{patientProfile.bloodType || "O+"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Uploaded Date</span>
                  <span className="font-bold text-slate-800 font-mono">{previewFile.uploadedAt || "2026-06-15"}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Clinical Examination & Findings
                </span>
                <p className="text-slate-600 bg-white border border-slate-200 p-3.5 rounded-xl text-xs leading-relaxed">
                  Patient presented for outpatient health checkup and clinical evaluation. Vital signs baseline parameters fall within standard operational limits. No acute cardiopulmonary decompensation observed. Blood pressure and oxygen saturation recorded in active range. Diagnostic imaging and laboratory analyses completed with full compliance.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Attending Specialist: <strong>Dr. Sarah Jenkins (Consultant)</strong></span>
                <span className="text-sky-700 font-bold">PenangHealth Network</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-150">
              <span className="text-[10px] text-slate-400 font-mono">Ref: PH-DOC-{previewFile.id || "001"}</span>
              <button
                onClick={() => {
                  handleDownloadAttachment(previewFile);
                  setPreviewFile(null);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
