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
}

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
    return appointments.find(a => a.status === "Upcoming") || null;
  }, [appointments]);

  // List of upcoming appointments
  const upcomingList = useMemo(() => {
    return appointments.filter(a => a.status === "Upcoming");
  }, [appointments]);

  // List of completed/cancelled appointments
  const completedList = useMemo(() => {
    return appointments.filter(a => a.status === "Completed" || a.status === "Cancelled");
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
    if (apt.status !== "Upcoming") return { active: false, startsAtStr: "" };
    
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
          .filter(a => a.status === "Upcoming")
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
    return appointments.find(a => a.status === "Upcoming" && a.clinic === selectedQueueClinic) || null;
  }, [selectedQueueClinic, appointments]);

  const [presenceConfirmed, setPresenceConfirmed] = useState<boolean>(false);

  useEffect(() => {
    if (activeApt) {
      setPresenceConfirmed(localStorage.getItem(`presence_${activeApt.id}`) === "true");
    } else {
      setPresenceConfirmed(false);
    }
  }, [activeApt]);

  const handleConfirmPresence = async () => {
    if (!activeApt) return;
    localStorage.setItem(`presence_${activeApt.id}`, "true");
    setPresenceConfirmed(true);

    try {
      const token = localStorage.getItem("carepoint_access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/logs", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: `Queue Ticket Check-in: Patient ${patientProfile.fullName} confirmed presence at ${activeApt.clinic} reception desk for ticket ${myTicket}.`,
          level: "info"
        })
      });
      console.log("✅  Presence confirmation logged to database system logs.");
    } catch (err) {
      console.error("Failed to post presence log to database", err);
    }
  };

  const queueStatus = useMemo(() => {
    if (!activeApt) return { active: false, startsAtStr: "" };
    return checkQueueActivation(activeApt);
  }, [activeApt, todayStr]);

  // Generate a deterministic ticket number based on clinic choice
  const myTicket = useMemo(() => {
    if (!selectedQueueClinic) return "#0000";
    if (activeApt) {
      const code = parseInt(activeApt.id.replace(/\D/g, ""), 10) || 124;
      return `#${1000 + (code % 250)}`;
    }
    const clinicSum = selectedQueueClinic.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `#${1000 + (clinicSum % 250)}`;
  }, [selectedQueueClinic, activeApt]);

  const ticketInt = useMemo(() => {
    return parseInt(myTicket.replace("#", ""), 10);
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
    downloadAnchor.setAttribute("download", `CarePoint_Report_${apt.date}_${apt.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert("SUCCESS: Clinic visit report exported!");
  };

  const handleDownloadPrescription = (apt: Appointment) => {
    const contents = `CarePoint Outpatient Consultation & Prescription Ledger\n=======================================================\nDate: ${apt.date}\nDoctor: ${apt.doctorName} (${apt.specialty})\nPatient Name: ${patientProfile.fullName}\n\nClinical Notes:\n${apt.clinicalNotes || "General consultation filed."}\n\nPrescribed Medication:\n${apt.prescription || "None."}\n=======================================================\nGenerated by CarePoint Patient Portal.`;
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
    const contents = `CarePoint Verified Digital Medical Certificate (MC)\n=======================================================\nDate of Issue: ${apt.date}\nAttending Physician: ${apt.doctorName}\nClinic/Facility: ${apt.clinic || apt.doctorName}\nPatient: ${patientProfile.fullName}\nMyKad/Passport: ${patientProfile.myKadOrPassport}\n\nThis certifies that the patient was evaluated and is unfit for duty for a period of 1 day(s) starting on ${apt.date}.\n\nMOH Digital Verification Code: REG-MOH-${(apt.doctorId || "DOC").toUpperCase().slice(0, 5)}\n=======================================================\nCarePoint Verified Digital MC`;
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
    downloadAnchor.setAttribute("download", `CarePoint_Secure_Data_Backup_${patientProfile.myKadOrPassport || "EHR"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert("SUCCESS: Secure database profile exported! Check your Downloads folder.");
  };

  const handleDownloadAttachment = (file: any) => {
    const contents = `CarePoint MOH Health Ledger System\n=======================================\nDocument: ${file.name}\nSize: ${file.size}\nUploaded: ${file.uploadedAt || "June 15, 2026"}\nPatient Name: ${patientProfile.fullName}\nPatient DOB: ${patientProfile.dateOfBirth}\nGender: ${patientProfile.gender}\nEmail: ${patientProfile.email}\n---------------------------------------\n[COMPILER SUCCESS] This is a simulated clinical record file parsed from CarePoint central database.\n`;
    const blob = new Blob([contents], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.includes('.') ? file.name : `${file.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="dashboard-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* 1. TOP BANNER: Dynamic welcome card */}
      <div className="bg-gradient-to-br from-teal-600 to-sky-600 text-white rounded-3xl p-6 shadow-md shadow-teal-600/15 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-100 bg-teal-500/30 px-2.5 py-1 rounded-full">
            Patient Health Advisory
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {patientProfile.fullName.split(" ")[0]}
          </h1>
          <p className="text-xs text-teal-50 leading-relaxed max-w-2xl">
            {nextUpcoming ? (
              <span>
                <strong>Reminder:</strong> You have an upcoming consultation with <strong>{nextUpcoming.doctorName}</strong> at <strong>{nextUpcoming.clinic}</strong> scheduled on <strong>{nextUpcoming.date}</strong> at <strong>{nextUpcoming.timeSlot}</strong>.
              </span>
            ) : (
              <span>
                <strong>Advisory:</strong> Standard seasonal influenza levels are currently elevated. Ensure proper hydration, avoid crowded indoor environments, and schedule preventive checkups or vaccinations at your nearest clinic.
              </span>
            )}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-4 translate-x-4 pointer-events-none">
          <HeartHandshake className="w-48 h-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Upcoming Bookings, Live Queue Tracker, and Past Visit History */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 2. UPCOMING BOOKINGS */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" /> Upcoming Consultations
            </h2>

            {upcomingList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                <p className="text-slate-500 text-xs font-semibold">
                  No upcoming consultations scheduled at this time.
                </p>
                <button
                  onClick={() => onSetScreen("schedule-appointment")}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition cursor-pointer shadow-md shadow-teal-600/10 inline-flex items-center gap-1.5"
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
                          <span className="bg-teal-50 text-teal-700 border border-teal-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {apt.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{apt.specialty}</span>
                        <span className="text-xs text-slate-700 font-bold block mt-1.5">{apt.clinic}</span>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" /> {apt.date}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> {apt.timeSlot}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                      <button 
                        onClick={() => onSetScreen("communication")}
                        className="flex-1 sm:flex-none border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
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
            <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-3xl p-6 border border-teal-800 shadow-lg shadow-teal-950/20 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-teal-800 gap-4">
                <div>
                  <span className="text-[10px] tracking-widest font-mono text-teal-300 uppercase block">Outpatient Live Queue Counter</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-300 font-bold">Facility:</span>
                    <select 
                      value={selectedQueueClinic}
                      onChange={(e) => setSelectedQueueClinic(e.target.value)}
                      className="bg-teal-950 border border-teal-800 text-white font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                    >
                      {queueClinics.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center bg-teal-950 border border-teal-800 px-3 py-1 rounded-full shrink-0">
                  <span className={`w-2 h-2 ${queueStatus.active ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'} rounded-full`}></span>
                  <span className="text-[10px] text-teal-200 font-bold uppercase tracking-wider font-mono">
                    {queueStatus.active ? "Live Counter" : "Standby Status"}
                  </span>
                </div>
              </div>

              {queueStatus.active ? (
                <>
                  {/* Countdown Timer Row */}
                  <div className="bg-teal-950 border border-teal-850/60 p-4 rounded-2xl flex items-center justify-between gap-4 font-mono">
                    <div>
                      <span className="text-[10px] font-bold text-teal-300 uppercase block tracking-wider">Appointment Countdown</span>
                      <span className="text-xl font-black text-white tracking-widest">{formatCountdown(secondsLeft)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-teal-300 uppercase block tracking-wider">Scheduled Time</span>
                      <span className="text-xs font-bold text-teal-100">{activeApt?.timeSlot} ({activeApt?.date})</span>
                    </div>
                  </div>

                  {/* Presence Check-in Card */}
                  {((secondsLeft !== null && secondsLeft <= 600) || estimatedWait <= 10) && (
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                      presenceConfirmed
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
                        : 'bg-amber-950/60 border-amber-500/30 text-amber-200'
                    }`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {presenceConfirmed ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                          )}
                          <div>
                            <p className="font-bold text-white text-xs uppercase tracking-wide">
                              {presenceConfirmed ? "✓ Presence Confirmed at Clinic Reception" : "Reception Attendance Verification"}
                            </p>
                            <p className="text-[11px] text-slate-350 mt-1 leading-normal font-sans">
                              {presenceConfirmed 
                                ? "Your presence has been successfully checked in. Please standby near the clinic lobby."
                                : "You are next or close to being called. Please click the button to confirm your presence at the reception counter."}
                            </p>
                          </div>
                        </div>
                        {!presenceConfirmed && (
                          <button
                            type="button"
                            onClick={handleConfirmPresence}
                            className="bg-amber-500 hover:bg-amber-400 text-teal-950 text-xs font-black px-4.5 py-2.5 rounded-xl transition shadow-md shadow-amber-500/10 cursor-pointer self-stretch sm:self-auto text-center"
                          >
                            Confirm My Presence
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 items-center text-center">
                    <div>
                      <span className="text-[11px] text-teal-300 block mb-1">My Ticket Number</span>
                      <span className="text-3xl font-black text-white font-mono tracking-tight font-bold">{myTicket}</span>
                    </div>
                    <div className="border-x border-teal-800">
                      <span className="text-[11px] text-teal-300 block mb-1">Current Live Number</span>
                      <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight font-bold">#{currentLive}</span>
                    </div>
                    <div className="col-span-2 md:col-span-1 pt-2 md:pt-0">
                      <span className="text-[11px] text-teal-300 block mb-1">Estimated Waiting Window</span>
                      <span className="text-lg font-bold font-mono text-white block">
                        {slotsAhead > 0 ? `~${estimatedWait} Minutes Remaining` : "Proceed Now!"}
                      </span>
                      <span className="text-[10px] text-teal-400 font-bold block mt-0.5">
                        {slotsAhead > 0 ? `${slotsAhead} patient${slotsAhead > 1 ? 's' : ''} ahead` : "Calling your ticket"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-teal-800">
                    <div className="flex items-center gap-2 text-xs text-teal-200 text-center sm:text-left">
                      {slotsAhead <= 2 && slotsAhead >= 0 ? (
                        <span className="bg-emerald-500 text-white font-extrabold px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 text-[10px] uppercase tracking-wider border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                          ● {slotsAhead === 0 ? "Your Turn - Proceed to Room now!" : `${slotsAhead} Slots Away - Please Standby!`}
                        </span>
                      ) : (
                        <span className="bg-teal-800/80 text-teal-200 border border-teal-700 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                          ● Waiting in Queue
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setMockOffset(prev => prev + 1)}
                        disabled={slotsAhead <= 0}
                        className="bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-[10px] uppercase tracking-wider font-extrabold px-4.5 py-2 rounded-xl transition shrink-0 cursor-pointer"
                      >
                        Advance Live Ticket (+1)
                      </button>
                      <button 
                        onClick={() => setMockOffset(0)}
                        className="border border-teal-800 hover:bg-teal-900 text-teal-200 text-[10px] uppercase tracking-wider font-extrabold px-3 py-2 rounded-xl transition shrink-0 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-teal-950/60 p-4 border border-teal-800 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-teal-100">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-extrabold text-white block">Queue Tracker Standby</span>
                    <p className="mt-1 text-teal-300 font-medium">
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
              <FileText className="w-5 h-5 text-teal-600" /> Past Visit History
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
                              className="text-teal-600 hover:text-teal-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 transition"
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
                    className="text-xs font-bold text-teal-650 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
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
              <Pill className="w-5 h-5 text-teal-655" />
              <span className="font-extrabold text-sm tracking-tight">Active Medication Reminders</span>
            </div>

            {patientProfile.prescriptions && patientProfile.prescriptions.length > 0 ? (
              <div className="space-y-3">
                {patientProfile.prescriptions.map((rx) => (
                  <div key={rx.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex items-start gap-3.5 hover:border-teal-500 hover:bg-teal-50/10 transition-all duration-150">
                    <div className="w-9 h-9 bg-teal-50 text-teal-655 rounded-xl flex items-center justify-center border border-teal-100 shrink-0">
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
                        <span className="text-teal-605 font-bold">By {rx.prescribedBy || "Dr. Sarah Jenkins"}</span>
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
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span className="font-extrabold text-sm tracking-tight">Verified Digital MC</span>
            </div>

            {lastCompleted ? (
              <div className="space-y-4">
                {/* MC Clinic Header */}
                <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl">
                  <span className="font-black text-slate-900 text-xs block leading-tight">{lastCompleted.clinic}</span>
                  <span className="text-[9px] text-teal-700 font-mono block mt-1 font-bold">
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
              <FileText className="w-5 h-5 text-teal-600" />
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
                  <div key={file.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex items-center justify-between gap-3.5 hover:border-teal-500 hover:bg-teal-50/10 transition-all duration-150">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-teal-55 text-teal-700 rounded-xl flex items-center justify-center border border-teal-100 shrink-0">
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
                        className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
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
              <User className="w-5 h-5 text-teal-600" />
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
                <Clock className="w-5 h-5 text-teal-600" />
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
              <Database className="w-5 h-5 text-teal-600" />
              <span className="font-extrabold text-sm tracking-tight">Secure EHR Data Management</span>
            </div>

            <p className="text-slate-500 leading-relaxed text-[11px]">
              In accordance with Malaysia MOH clinical compliance regulations, you can securely export your full medical ledger and historical vital readings into a signed, Portable JSON backup.
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
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                  <Database className="w-3.5 h-3.5 text-teal-600" /> Export Full Medical Ledger
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

            <div className="text-emerald-500 p-4 rounded-xl font-mono text-xs overflow-y-auto max-h-[300px] leading-relaxed border border-slate-800 shadow-inner" style={{ backgroundColor: '#0a0a0a' }}>
              <p className="text-slate-500">// CAREPOINT HL7 CENTRAL LEDGER OCR PARSER v4.1</p>
              <p className="text-slate-500">// PATIENT IDENTIFIER: {patientProfile.email}</p>
              <p className="text-slate-500">// TIMESTAMP: {previewFile.uploadedAt} 08:30:00 UTC</p>
              <p className="mt-2 text-white font-bold">DOCUMENT NAME: {previewFile.name}</p>
              <p className="text-teal-404">FILE_TYPE: {previewFile.type?.toUpperCase() || 'DOCUMENT'}</p>
              <p className="text-teal-404">FILE_SIZE: {previewFile.size}</p>
              <p className="mt-3 text-slate-500 border-t border-slate-800 pt-2 font-semibold">// OCR INGESTION RAW TEXT STREAM:</p>
              <p className="mt-1 text-emerald-500">
                [OCR SUCCESS] Ingestion complete. Target file scanned. Found matching patient demographic data. 
                Name check: "{patientProfile.fullName}" MATCHED.
              </p>
              <p className="mt-2 text-slate-300">
                --- CLINICAL SUMMARY SCAN DATA ---
                <br />Patient: {patientProfile.fullName} (DOB: {patientProfile.dateOfBirth})
                <br />Blood Type: {patientProfile.bloodType || "O positive"}
                <br />Allergies: {(patientProfile.allergies || []).join(", ") || "No known drug allergies"}
                <br />Chronic Conditions: {patientProfile.chronicConditions || "General health tracking"}
                <br />
                <br />Physician Notes: Record synced with central ministry repository. All indicators within parameters.
                <br />----------------------------------
              </p>
              <p className="mt-3 text-[10px] text-slate-500">// END OF FILE DECRYPT STREAM</p>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-150">
              <span className="text-[10px] text-slate-400 font-mono">MD5 Hash: 4e9a3b8c7d6e5f0a2b9c</span>
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
