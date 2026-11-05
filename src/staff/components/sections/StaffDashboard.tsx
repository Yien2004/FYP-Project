import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Volume2, 
  CheckCircle2, 
  Check, 
  DoorOpen, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Stethoscope, 
  AlertTriangle,
  X,
  AlertOctagon,
  FileText,
  Pill,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { 
  getStaffAccountByEmail, 
  getFacilityIdByHospital, 
  matchesSpecialty,
  RBAC_STAFF_ACCOUNTS
} from '../../../data/staffAccounts';
import { allPantaiDoctors } from '../../../data/pantaiHospitalsData';

function getClinicFromEmail(email: string): string {
  const cached = localStorage.getItem("lifelink_user_clinic");
  if (cached) return cached;

  const emailLower = (email || '').toLowerCase().trim();
  if (emailLower.includes('pantaiheart') || emailLower.includes('heartwellness') || emailLower.includes('pantaipavilion')) return 'Pantai Heart & Wellness Pavilion';
  if (emailLower.includes('pantaipremier') || emailLower.includes('premierclinic') || emailLower.includes('pantaiclinic')) return 'Pantai Premier Clinic & Day Surgery';
  if (emailLower.includes('pantaispecialist') || emailLower.includes('specialistcentre') || emailLower.includes('pantaicentre')) return 'Pantai Specialist Centre';
  return 'Pantai Hospital Penang (Main Hospital)';
}

function isAppointmentOverdue(dateStr?: string, timeSlot?: string): boolean {
  if (!dateStr || !timeSlot) return false;
  if (timeSlot === "Priority Triage") return false;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Past date is overdue
  if (dateStr < todayStr) return true;
  // Future date is not overdue
  if (dateStr > todayStr) return false;

  // It's today! Parse the end time of the slot
  let targetTime = timeSlot.trim();
  if (targetTime.includes("-")) {
    const parts = targetTime.split("-");
    targetTime = parts[parts.length - 1].trim(); // Take the end of the slot, e.g. "11:00" from "10:00 - 11:00"
  }

  // Parse time: "11:00", "11:00 AM", "1:30 PM", "14:00"
  const match = targetTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return false;

  let hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === "PM" && hrs < 12) hrs += 12;
  else if (period === "AM" && hrs === 12) hrs = 0;
  else if (!period && hrs < 8) hrs += 12; // Infer afternoon for clinic hours if 1..7 without AM/PM

  const slotEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hrs, mins, 0, 0);
  return now.getTime() > slotEndTime.getTime();
}

interface StaffDashboardProps {
  onCallPatient: (name: string) => void;
  selectedDepartment?: string;
  onDepartmentChange?: (dept: string) => void;
}

export default function StaffDashboard({ 
  onCallPatient,
  selectedDepartment: propSelectedDepartment,
  onDepartmentChange
}: StaffDashboardProps) {
  const loggedEmail = localStorage.getItem("lifelink_user_email") || localStorage.getItem("carepoint_user_email") || '';
  
  // RBAC Staff Profile
  const staffAccount = useMemo(() => getStaffAccountByEmail(loggedEmail), [loggedEmail]);
  const currentClinic = useMemo(() => staffAccount?.hospital || getClinicFromEmail(loggedEmail), [staffAccount, loggedEmail]);
  const currentDepartment = useMemo(() => staffAccount?.department || localStorage.getItem("lifelink_user_department") || "All", [staffAccount]);
  const currentFacilityId = useMemo(() => staffAccount?.facility_id || getFacilityIdByHospital(currentClinic), [staffAccount, currentClinic]);

  // Classification: Doctor Privileges vs Single Doctor Desk restriction
  const isDoctorUser = useMemo(() => {
    return Boolean(
      staffAccount?.role?.toLowerCase() === "doctor" || 
      loggedEmail.toLowerCase().startsWith("dr_") ||
      loggedEmail.toLowerCase() === "doctor@hospital.com"
    );
  }, [staffAccount, loggedEmail]);

  const isSpecificDoctor = useMemo(() => {
    const isDoc = Boolean(
      staffAccount?.role?.toLowerCase() === "doctor" || 
      loggedEmail.toLowerCase().startsWith("dr_")
    );
    const isGeneralFacilityConsultant = 
      loggedEmail.toLowerCase() === "doctor@hospital.com" ||
      (staffAccount?.name || "").toLowerCase().includes("consultant (main hospital)");

    return isDoc && !isGeneralFacilityConsultant;
  }, [staffAccount, loggedEmail]);

  const currentDoctorName = useMemo(() => {
    return staffAccount?.name || localStorage.getItem("lifelink_user_name") || "";
  }, [staffAccount]);

  const currentDoctorRoom = useMemo(() => {
    return staffAccount?.room_number || localStorage.getItem("lifelink_user_room") || (isDoctorUser ? "Consultation Room 301" : "Front Counter");
  }, [staffAccount, isDoctorUser]);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [presenceOverrides, setPresenceOverrides] = useState<{ [key: string]: boolean }>({});
  const [roomAssignments, setRoomAssignments] = useState<{ [key: string]: string }>({});

  const [activeCallText, setActiveCallText] = useState<string | null>(null);

  // Date Range Filter
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | '7days' | '30days' | 'all'>('today');

  // Active Lobby Queue Filter: 'all' by default so scheduled / upcoming appointments are immediately visible
  const [presenceFilter, setPresenceFilter] = useState<'all' | 'verified' | 'pending' | 'completed' | 'cancelled'>('all');
  const [internalDepartmentFilter, setInternalDepartmentFilter] = useState<string>(() => {
    return (currentDepartment && currentDepartment !== 'All') ? currentDepartment : 'All';
  });

  const selectedDepartmentFilter = propSelectedDepartment !== undefined ? propSelectedDepartment : internalDepartmentFilter;

  const handleDepartmentChange = (dept: string) => {
    setInternalDepartmentFilter(dept);
    onDepartmentChange?.(dept);
  };

  const hospitalDepartments = useMemo(() => {
    return Array.from(
      new Set(
        allPantaiDoctors
          .filter(doc => doc.hospital === currentClinic || getFacilityIdByHospital(doc.hospital) === currentFacilityId)
          .map(doc => doc.department || doc.specialty)
          .filter(Boolean)
      )
    ).sort();
  }, [currentClinic, currentFacilityId]);

  // Queue verification states
  const [ticketInput, setTicketInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    isMismatch?: boolean;
    message: string;
    patientName?: string;
    queueNumber?: string;
    assignedRoom?: string;
    error?: string;
  } | null>(null);

  // Doctor Complete Consultation Modal State
  const [completeModalApt, setCompleteModalApt] = useState<any | null>(null);
  const [completeNotes, setCompleteNotes] = useState({
    diagnosis: "",
    clinicalNotes: "",
    prescription: ""
  });
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);
  const [isSavingNotesOnly, setIsSavingNotesOnly] = useState(false);

  // Modal Medication Scheduler State
  const [modalPrescriptions, setModalPrescriptions] = useState<any[]>([]);
  const [modalNewMedDrug, setModalNewMedDrug] = useState<string>('');
  const [modalNewMedDosage, setModalNewMedDosage] = useState<string>('');
  const [modalNewMedFreq, setModalNewMedFreq] = useState<string>('Once Daily (QD)');
  const [modalNewMedInstructions, setModalNewMedInstructions] = useState<string>('');
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string>('');

  // Play double-tone chime sound
  const playLobbyChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);
      
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      }, 200);
    } catch (err) {
      console.warn("Lobby chime audio play failed:", err);
    }
  };

  // Fetch appointments and logs on load, poll every 4 seconds
  const fetchData = () => {
    fetch("/api/appointments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAppointments(data);
        }
      })
      .catch(err => {
        console.warn("Failed to load appointments", err);
      });

    fetch("/api/logs")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLogs(data);
        }
      })
      .catch(err => {
        console.warn("Failed to fetch logs", err);
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Determine if patient has checked in by matching DB state, overrides, localStorage, or logs
  const isPatientCheckedIn = (apt: any) => {
    if (presenceOverrides[apt.id] !== undefined) return presenceOverrides[apt.id];
    
    // Check localStorage persistence
    try {
      const localPresence = localStorage.getItem('lifelink_presence_' + apt.id);
      if (localPresence === 'true') return true;
      if (localPresence === 'false') return false;
    } catch (e) {
      // ignore localStorage read errors
    }

    if (
      apt.checkedIn === true || 
      apt.status === 'Checked In' || 
      apt.status === 'CHECKED_IN' ||
      apt.status === 'CALLING' ||
      apt.status === 'IN_CONSULTATION'
    ) return true;

    const patientName = apt.patientName || "";
    const matchStr = `Patient ${patientName} confirmed presence`.toLowerCase();
    const matchStrAlt = `${patientName} confirmed presence`.toLowerCase();
    return logs.some(log => {
      const msg = (log.message || "").toLowerCase();
      return msg.includes(matchStr) || msg.includes(matchStrAlt);
    });
  };

  // Dynamically compute today's date in local time (YYYY-MM-DD)
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Helper to determine difference in days from today
  const getDaysDiff = (dateStr?: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const aptDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return Math.round((aptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Helper to check if an appointment date is within the selected range
  const isDateInFilterRange = (dateStr?: string) => {
    if (!dateStr) return false;
    if (dateRangeFilter === 'all') return true;
    if (dateRangeFilter === 'today') return dateStr === todayDateStr;
    const diff = getDaysDiff(dateStr);
    if (diff === null) return false;
    if (dateRangeFilter === '7days') {
      return diff >= -7 && diff <= 7;
    }
    if (dateRangeFilter === '30days') {
      return diff >= -30 && diff <= 30;
    }
    return true;
  };

  const dateRangeDescription = useMemo(() => {
    if (dateRangeFilter === 'today') return `Today (${todayDateStr})`;
    if (dateRangeFilter === '7days') return `7 Days Window (Recent & Upcoming)`;
    if (dateRangeFilter === '30days') return `1 Month Window (30 Days)`;
    return `All Recorded Outpatients`;
  }, [dateRangeFilter, todayDateStr]);

  // Master Queue List classified by hospital, department, and doctor
  const baseQueueList = useMemo(() => {
    return appointments
      .filter(apt => {
        // 0. Date Range Filter
        if (!isDateInFilterRange(apt.date)) return false;

        // 1. Hospital / Facility Filter
        const aptFacilityId = apt.facility_id 
          ? Number(apt.facility_id) 
          : getFacilityIdByHospital(apt.clinic || apt.hospital);

        if (aptFacilityId !== currentFacilityId) return false;

        // 2. Department & Clinical Scope
        if (!isDoctorUser) {
          if (selectedDepartmentFilter !== 'All' && !matchesSpecialty(selectedDepartmentFilter, apt.specialty)) {
            return false;
          }
        } else {
          // Doctor / Doctor Assistant: scoped to their department
          if (currentDepartment !== 'All' && !matchesSpecialty(currentDepartment, apt.specialty)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const isACalling = a.status === 'CALLING' || a.status === 'IN_CONSULTATION';
        const isBCalling = b.status === 'CALLING' || b.status === 'IN_CONSULTATION';
        if (isACalling && !isBCalling) return -1;
        if (!isACalling && isBCalling) return 1;

        const isAPriority = a.timeSlot === "Priority Triage";
        const isBPriority = b.timeSlot === "Priority Triage";
        if (isAPriority && !isBPriority) return -1;
        if (!isAPriority && isBPriority) return 1;

        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) return dateB.localeCompare(dateA); // Most recent / upcoming first

        const slotCompare = (a.timeSlot || "").localeCompare(b.timeSlot || "");
        if (slotCompare !== 0) return slotCompare;

        const numA = parseInt(String(a.queueNumber || "").replace(/\D/g, "") || "999", 10);
        const numB = parseInt(String(b.queueNumber || "").replace(/\D/g, "") || "999", 10);
        return numA - numB;
      });
  }, [appointments, currentFacilityId, currentDepartment, selectedDepartmentFilter, isSpecificDoctor, currentDoctorName, loggedEmail, dateRangeFilter]);

  // Active Lobby Queue list applying presence / status filter
  const queueList = useMemo(() => {
    return baseQueueList.filter(apt => {
      const isChecked = isPatientCheckedIn(apt);
      const isFinished = apt.status === 'Completed' || apt.status === 'COMPLETED' || apt.status === 'Done';
      const isCancelled = apt.status === 'Cancelled' || apt.status === 'CANCELLED' || apt.status === 'Missing' || apt.status === 'Rejected';

      if (presenceFilter === 'verified') {
        return isChecked && !isFinished && !isCancelled;
      }
      if (presenceFilter === 'pending') {
        return !isChecked && !isFinished && !isCancelled;
      }
      if (presenceFilter === 'completed') {
        return isFinished;
      }
      if (presenceFilter === 'cancelled') {
        return isCancelled;
      }
      return true; // 'all' displays all outpatients
    });
  }, [baseQueueList, presenceFilter, presenceOverrides, logs]);

  // Room options for manual room assignment
  const roomOptions = useMemo(() => {
    return [
      { value: "Consultation Room 101", label: "Consultation Room 101" },
      { value: "Consultation Room 102", label: "Consultation Room 102" },
      { value: "Consultation Room 103", label: "Consultation Room 103" },
      { value: "Consultation Room 105", label: "Consultation Room 105 (General Surgery)" },
      { value: "Consultation Room 201", label: "Consultation Room 201 (Gastroenterology)" },
      { value: "Consultation Room 202", label: "Consultation Room 202 (Dermatology)" },
      { value: "Consultation Room 301", label: "Consultation Room 301 (Internal Medicine)" },
      { value: "Consultation Room 401", label: "Consultation Room 401 (Cardiology)" },
      { value: "Trauma Bay 1", label: "Trauma Bay 1 (A&E Emergency)" },
    ];
  }, []);

  // Frontdesk queue verification handler
  const handleVerifyTicket = async (explicitTicket?: string) => {
    const rawTicket = (explicitTicket || ticketInput).trim();
    if (!rawTicket) return;

    setIsVerifying(true);
    setVerifyResult(null);

    // Look up appointment locally as well
    const cleanRaw = rawTicket.replace(/^#/, "").toLowerCase();
    const matched = appointments.find((a: any) => {
      const aTicket = (a.queueNumber || "").replace(/^#/, "").toLowerCase();
      const aTicketDigits = aTicket.replace(/\D/g, "");
      const cleanDigits = cleanRaw.replace(/\D/g, "");
      return aTicket === cleanRaw || (cleanDigits && aTicketDigits === cleanDigits) || String(a.id).toLowerCase() === cleanRaw;
    });

    try {
      const res = await fetch("/api/queue/verify-and-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueNumber: rawTicket,
          staffEmail: loggedEmail
        })
      });

      const data = await res.json();

      if (data && data.success) {
        const aptId = data.appointmentId || matched?.id;
        if (aptId) {
          try { localStorage.setItem('lifelink_presence_' + aptId, 'true'); } catch (e) {}
          setPresenceOverrides(prev => ({ ...prev, [aptId]: true }));
        }
        setVerifyResult(data);
        playLobbyChime();
        setTicketInput("");
        await fetchData();
      } else {
        // Fallback local check-in & direct DB persistence via PUT
        if (matched) {
          try { localStorage.setItem('lifelink_presence_' + matched.id, 'true'); } catch (e) {}
          setPresenceOverrides(prev => ({ ...prev, [matched.id]: true }));
          
          const nowTimeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
          fetch(`/api/appointments/${matched.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              checkedIn: true,
              status: "Checked In",
              checkInTime: nowTimeStr
            })
          }).then(() => fetchData()).catch(err => console.warn("Fallback PUT failed:", err));

          setVerifyResult({
            success: true,
            queueNumber: matched.queueNumber || rawTicket,
            patientName: matched.patientName,
            assignedRoom: roomAssignments[matched.id] || "Consultation Room",
            message: `Verified and admitted ${matched.patientName} to lobby.`
          });
          playLobbyChime();
          setTicketInput("");
        } else {
          setVerifyResult({
            success: false,
            message: data.message || data.error || `Queue ticket "${rawTicket}" not found.`
          });
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      if (matched) {
        try { localStorage.setItem('lifelink_presence_' + matched.id, 'true'); } catch (e) {}
        setPresenceOverrides(prev => ({ ...prev, [matched.id]: true }));
        
        const nowTimeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        fetch(`/api/appointments/${matched.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkedIn: true,
            status: "Checked In",
            checkInTime: nowTimeStr
          })
        }).then(() => fetchData()).catch(e => console.warn(e));

        setVerifyResult({
          success: true,
          queueNumber: matched.queueNumber || rawTicket,
          patientName: matched.patientName,
          assignedRoom: roomAssignments[matched.id] || "Consultation Room",
          message: `Verified and admitted ${matched.patientName} to lobby.`
        });
        playLobbyChime();
        setTicketInput("");
      } else {
        setVerifyResult({
          success: false,
          message: `Unable to verify queue ticket "${rawTicket}".`
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Intercom paging
  const handleCall = (name: string, room: string, ticket?: string) => {
    playLobbyChime();
    const formattedRoom = roomOptions.find(o => o.value === room)?.label || room;
    const ticketPrefix = ticket ? `[${ticket}] ` : "";
    onCallPatient(`${ticketPrefix}${name} (Proceed to ${formattedRoom || "Lobby Desk"})`);
    setActiveCallText(`Intercom Alert: Please paging patient ${ticketPrefix}${name} to ${formattedRoom || "Consultation Room"}`);
    setTimeout(() => {
      setActiveCallText(null);
    }, 4500);
  };

  const handleManualCheckIn = async (id: string) => {
    try { localStorage.setItem('lifelink_presence_' + id, 'true'); } catch (e) {}
    setPresenceOverrides(prev => ({ ...prev, [id]: true }));
    const nowTimeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkedIn: true,
          status: "Checked In",
          checkInTime: nowTimeStr
        })
      });
      fetchData();
    } catch (e) {
      console.warn("Manual check-in update error:", e);
    }
  };

  const handleMarkAbsent = async (id: string) => {
    try { localStorage.setItem('lifelink_presence_' + id, 'false'); } catch (e) {}
    setPresenceOverrides(prev => ({ ...prev, [id]: false }));
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkedIn: false,
          status: "Upcoming",
          checkInTime: null
        })
      });
      fetchData();
    } catch (e) {
      console.warn("Mark absent error:", e);
    }
  };

  const handleRoomSelect = (id: string, room: string) => {
    setRoomAssignments(prev => ({ ...prev, [id]: room }));
  };

  // Doctor Consultation Actions
  const handleDoctorCallSpecific = async (appointmentId: string, patientName: string, ticket: string) => {
    try {
      const res = await fetch("/api/doctor/call-patient", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-doctor-email": loggedEmail
        },
        body: JSON.stringify({ appointmentId, doctorEmail: loggedEmail })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        console.warn("Call-patient endpoint fallback:", data);
        await fetch(`/api/appointments/${appointmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CALLING" })
        });
      }
      playLobbyChime();
      const room = currentDoctorRoom;
      onCallPatient(`${patientName} (Proceed to ${room})`);
      setActiveCallText(`Calling Ticket ${ticket}: ${patientName} to ${room}`);
      setTimeout(() => setActiveCallText(null), 5000);
      await fetchData();
    } catch (err) {
      console.error("Doctor call error:", err);
      await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CALLING" })
      }).catch(() => {});
      await fetchData();
    }
  };

  const handleDoctorRecall = async (appointmentId: string, patientName: string, ticket: string) => {
    try {
      playLobbyChime();
      onCallPatient(`${patientName} (Re-paging to ${currentDoctorRoom})`);
      setActiveCallText(`Re-Calling Ticket ${ticket}: ${patientName} to ${currentDoctorRoom}`);
      setTimeout(() => setActiveCallText(null), 5000);
      await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CALLING" })
      }).catch(() => {});
      await fetchData();
    } catch (err) {
      console.error("Recall error:", err);
    }
  };

  const handleDoctorStartConsultation = async (appointmentId: string) => {
    try {
      const res = await fetch("/api/doctor/start-consultation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-doctor-email": loggedEmail
        },
        body: JSON.stringify({ appointmentId, doctorEmail: loggedEmail })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error || data.success === false) {
        await fetch(`/api/appointments/${appointmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "IN_CONSULTATION" })
        });
      }
      await fetchData();
    } catch (err) {
      console.error("Start consultation error:", err);
      await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_CONSULTATION" })
      }).catch(() => {});
      await fetchData();
    }
  };

  const handleDoctorRevertToLobby = async (appointmentId: string) => {
    try {
      await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Checked In" })
      });
      fetchData();
    } catch (err) {
      console.error("Revert error:", err);
    }
  };

  const handleDoctorSkip = async (appointmentId: string, action: 'POSTPONE' | 'ABSENT') => {
    try {
      await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === 'ABSENT' ? 'Cancelled' : 'Postponed' })
      });
      await fetch("/api/doctor/skip-patient", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-doctor-email": loggedEmail
        },
        body: JSON.stringify({ appointmentId, action, doctorEmail: loggedEmail })
      }).catch(() => {});
      fetchData();
    } catch (err) {
      console.error("Skip error:", err);
    }
  };

  const handleOpenCompleteModal = async (apt: any) => {
    setCompleteModalApt(apt);
    setModalSuccessMsg("");
    const notesStr = apt.clinicalNotes || apt.clinical_notes || "";
    const diagMatch = notesStr.match(/\[Diagnosis\]:\s*([^\n\r]*)/i);
    const notesMatch = notesStr.match(/\[Notes\]:\s*([^\n\r]*)/i);
    const rxMatch = notesStr.match(/\[Rx\]:\s*([^\n\r]*)/i);

    const diag = diagMatch ? diagMatch[1].trim() : (apt.diagnosis || "");
    const notes = notesMatch ? notesMatch[1].trim() : (notesStr ? notesStr.replace(/\[Diagnosis\]:[^\n]*\n?/g, '').replace(/\[Notes\]:[^\n]*\n?/g, '').replace(/\[Rx\]:[^\n]*\n?/g, '').trim() : "");
    const rx = rxMatch ? rxMatch[1].trim() : (apt.prescription || "");

    setCompleteNotes({
      diagnosis: diag,
      clinicalNotes: notes,
      prescription: rx
    });

    // Load active prescriptions for this patient
    let loadedMeds: any[] = [];
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const patientsList = await res.json();
        const pEmail = (apt.patientEmail || "").toLowerCase();
        const pName = (apt.patientName || "").toLowerCase();
        const matchedP = patientsList.find((p: any) => 
          (pEmail && p.email?.toLowerCase() === pEmail) ||
          (pName && p.name?.toLowerCase() === pName) ||
          p.id === apt.patientId
        );
        if (matchedP && Array.isArray(matchedP.prescriptions) && matchedP.prescriptions.length > 0) {
          loadedMeds = matchedP.prescriptions;
        }
      }
    } catch (e) {
      console.warn("Could not fetch patient prescriptions", e);
    }

    if (loadedMeds.length === 0 && rx) {
      const parts = rx.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      loadedMeds = parts.map((part, i) => ({
        id: "rx-modal-" + i,
        drugName: part,
        dosage: "1 Tablet",
        frequency: "Once Daily (QD)",
        instructions: "Take after meals",
        date: apt.date || todayDateStr
      }));
    }

    setModalPrescriptions(loadedMeds);
  };

  const handleAddModalMedication = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modalNewMedDrug.trim() || !completeModalApt) return;

    const newRxItem = {
      id: "rx-" + Date.now(),
      drugName: modalNewMedDrug.trim(),
      dosage: modalNewMedDosage.trim() || "1 unit",
      frequency: modalNewMedFreq,
      instructions: modalNewMedInstructions.trim() || "As directed",
      prescribedBy: currentDoctorName,
      date: completeModalApt.date || todayDateStr
    };

    const updated = [newRxItem, ...modalPrescriptions];
    setModalPrescriptions(updated);
    setModalNewMedDrug("");
    setModalNewMedDosage("");
    setModalNewMedInstructions("");

    // Sync to patient profile
    const pEmail = completeModalApt.patientEmail;
    if (pEmail) {
      try {
        await fetch(`/api/patients/${encodeURIComponent(pEmail)}/prescriptions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRxItem)
        });
      } catch (err) {}
    }

    const rxSummary = updated.map(m => `${m.drugName} ${m.dosage} (${m.frequency})`).join(", ");
    setCompleteNotes(prev => ({ ...prev, prescription: rxSummary }));
    setModalSuccessMsg("Medication scheduled successfully!");
    setTimeout(() => setModalSuccessMsg(""), 2500);
  };

  const handleDeleteModalMedication = async (rxId: string | number) => {
    const updated = modalPrescriptions.filter((m, i) => m.id !== rxId && i !== rxId);
    setModalPrescriptions(updated);
    const rxSummary = updated.map(m => `${m.drugName} ${m.dosage} (${m.frequency})`).join(", ");
    setCompleteNotes(prev => ({ ...prev, prescription: rxSummary }));

    const pEmail = completeModalApt?.patientEmail;
    if (pEmail && typeof rxId === 'string' && !rxId.startsWith('rx-modal-')) {
      try {
        await fetch(`/api/patients/${encodeURIComponent(pEmail)}/prescriptions/${encodeURIComponent(rxId)}`, {
          method: "DELETE"
        });
      } catch (e) {}
    }
  };

  const handleSaveDoctorNotesOnly = async () => {
    if (!completeModalApt) return;
    setIsSavingNotesOnly(true);
    try {
      const rxSummary = modalPrescriptions.map(m => `${m.drugName} ${m.dosage} (${m.frequency})`).join(", ") || completeNotes.prescription;
      const notePayload = [
        completeNotes.diagnosis ? `[Diagnosis]: ${completeNotes.diagnosis}` : "",
        completeNotes.clinicalNotes ? `[Notes]: ${completeNotes.clinicalNotes}` : "",
        rxSummary ? `[Rx]: ${rxSummary}` : ""
      ].filter(Boolean).join("\n");

      await fetch(`/api/appointments/${completeModalApt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicalNotes: notePayload,
          diagnosis: completeNotes.diagnosis,
          prescription: rxSummary
        })
      });

      setModalSuccessMsg("Clinical doctor notes saved successfully!");
      fetchData();
      setTimeout(() => setModalSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Save doctor notes error:", err);
    } finally {
      setIsSavingNotesOnly(false);
    }
  };

  const handleSubmitCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalApt) return;

    if (!completeNotes.diagnosis.trim()) {
      alert("Clinical diagnosis is required to complete consultation.");
      return;
    }

    setIsSubmittingComplete(true);
    try {
      const rxSummary = modalPrescriptions.map(m => `${m.drugName} ${m.dosage} (${m.frequency})`).join(", ") || completeNotes.prescription;

      const res = await fetch("/api/doctor/complete-consultation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-doctor-email": loggedEmail
        },
        body: JSON.stringify({
          appointmentId: completeModalApt.id,
          diagnosis: completeNotes.diagnosis,
          clinicalNotes: completeNotes.clinicalNotes,
          prescription: rxSummary,
          doctorEmail: loggedEmail
        })
      });

      const data = await res.json();
      if (data && data.success) {
        setCompleteModalApt(null);
        fetchData();
      } else {
        alert(data.message || "Failed to complete consultation.");
      }
    } catch (err) {
      console.error("Complete consultation error:", err);
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  // Operational KPI Stats Cards (Total Booking, Check-in Rate, No-Show Rate, Completed Consults)
  const { stats, opsFlow, counts } = useMemo(() => {
    const totalCount = baseQueueList.length;
    
    const completedCount = baseQueueList.filter(q => 
      q.status === 'Completed' || q.status === 'COMPLETED' || q.status === 'Done'
    ).length;

    const checkedInCount = baseQueueList.filter(q => 
      isPatientCheckedIn(q) || q.status === 'Completed' || q.status === 'COMPLETED' || q.status === 'Done'
    ).length;

    const cancelledCount = baseQueueList.filter(q => 
      q.status === 'Cancelled' || q.status === 'CANCELLED' || q.status === 'Rejected'
    ).length;

    const absentCount = baseQueueList.filter(q => 
      q.status === 'Missing' || q.status === 'Absent' || q.status === 'No-Show'
    ).length;

    const waitingCount = baseQueueList.filter(q => 
      isPatientCheckedIn(q) && 
      q.status !== 'IN_CONSULTATION' && 
      q.status !== 'Completed' && 
      q.status !== 'COMPLETED' && 
      q.status !== 'Done' &&
      q.status !== 'Cancelled' &&
      q.status !== 'CANCELLED' &&
      q.status !== 'Missing'
    ).length;

    const inConsultation = baseQueueList.filter(q => q.status === 'IN_CONSULTATION').length;
    
    const pendingCount = baseQueueList.filter(q => 
      !isPatientCheckedIn(q) && 
      q.status !== 'Completed' && 
      q.status !== 'COMPLETED' && 
      q.status !== 'Done' &&
      q.status !== 'Cancelled' &&
      q.status !== 'CANCELLED' &&
      q.status !== 'Missing'
    ).length;

    const activeCount = totalCount - cancelledCount;
    const checkInRate = activeCount > 0 ? `${Math.round((checkedInCount / activeCount) * 100)}%` : '0%';
    const noShowRate = activeCount > 0 ? `${Math.round((absentCount / activeCount) * 100)}%` : '0%';

    const dateScopeLabel = dateRangeFilter === 'today' ? "Today" : dateRangeFilter === '7days' ? "7-Day" : dateRangeFilter === '30days' ? "1-Month" : "All-Time";

    const cards = [
      { 
        label: `${dateScopeLabel} Bookings`, 
        value: `${totalCount}`
      },
      { 
        label: 'Check-in Rate', 
        value: checkInRate
      },
      { 
        label: `${dateScopeLabel} Completed Consults`, 
        value: `${completedCount}`
      },
    ];

    const flow = {
      checkInRate,
      waitingCount,
      inConsultation,
      completed: completedCount,
      noShowRate
    };

    const cnts = {
      total: totalCount,
      waiting: waitingCount,
      pending: pendingCount,
      completed: completedCount,
      absent: absentCount
    };

    return { stats: cards, opsFlow: flow, counts: cnts };
  }, [baseQueueList, presenceOverrides, logs, dateRangeFilter]);

  return (
    <div className="space-y-6 text-neutral-800">
      
      {/* Active Intercom Call Alert Overlay */}
      {activeCallText && (
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-lg border border-red-500 animate-pulse">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 animate-bounce shrink-0" />
            <div>
              <span className="font-extrabold text-sm block">{activeCallText}</span>
              <span className="text-[10px] text-red-100 block tracking-wider font-mono">Paging Broadcast Active • lobby speaker audio enabled</span>
            </div>
          </div>
          <span className="text-xs bg-red-800/40 px-3 py-1 rounded-full font-bold border border-red-400/30 uppercase tracking-widest shrink-0 hidden sm:inline-block">
            Calling
          </span>
        </div>
      )}

      {/* ── QUEUE TICKET VERIFICATION BAR ── */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 text-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Verify Queue Ticket</h3>
            {!isDoctorUser && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                Department: {selectedDepartmentFilter}
              </span>
            )}
          </div>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleVerifyTicket(); }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Enter #Q-101 or Ticket ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying || !ticketInput.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shrink-0 shadow-2xs"
            >
              {isVerifying ? "Verifying…" : "Check-In"}
            </button>
          </form>
        </div>

        {/* Verification Result Feedback */}
        {verifyResult && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {verifyResult.success ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3.5 flex items-start gap-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-800 uppercase tracking-wider font-mono text-[11px]">
                      Verified in Lobby
                    </span>
                    <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-mono font-bold text-[10px]">
                      Ticket {verifyResult.queueNumber}
                    </span>
                  </div>
                  <p className="text-emerald-800 font-medium">
                    {verifyResult.message || `Patient admitted to lobby.`}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-mono">
                    Patient: <strong>{verifyResult.patientName}</strong> • Assigned to {verifyResult.assignedRoom || "Consultation Room"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-3.5 flex items-start gap-3 animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-extrabold text-rose-800 uppercase tracking-wider font-mono text-[11px]">
                    Verification Failed
                  </span>
                  <p className="text-rose-700 font-medium">
                    {verifyResult.message || "Queue ticket not found."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CONSULTATION DATE RANGE & SCOPE TOOLBAR ── */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-neutral-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-neutral-900 tracking-tight">Schedule & Date Filter:</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {dateRangeDescription}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              Review today's active encounters or expand to 7-day and monthly departmental history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date range filter buttons */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDateRangeFilter('today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                dateRangeFilter === 'today' ? 'bg-white text-teal-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateRangeFilter('7days')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                dateRangeFilter === '7days' ? 'bg-white text-teal-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRangeFilter('30days')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                dateRangeFilter === '30days' ? 'bg-white text-teal-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              1 Month
            </button>
            <button
              type="button"
              onClick={() => setDateRangeFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                dateRangeFilter === 'all' ? 'bg-white text-teal-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All Data
            </button>
          </div>
        </div>
      </div>

      {/* 3 Stats Cards: Total Booking, Check-in Rate, Completed Consults */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">{stat.label}</span>
            <h3 className="text-2xl font-black text-neutral-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Operational Flow Strip */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-center divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
        <div className="pt-2 sm:pt-0">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Waiting in Lobby</span>
          <span className="text-base font-extrabold text-amber-600 block mt-0.5">{opsFlow.waitingCount}</span>
        </div>
        <div className="pt-2 sm:pt-0">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">In Consultation</span>
          <span className="text-base font-extrabold text-blue-600 block mt-0.5">{opsFlow.inConsultation}</span>
        </div>
        <div className="pt-2 sm:pt-0">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Completed</span>
          <span className="text-base font-extrabold text-teal-600 block mt-0.5">{opsFlow.completed}</span>
        </div>
        <div className="pt-2 sm:pt-0">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Absent / Missed</span>
          <span className="text-base font-extrabold text-neutral-700 block mt-0.5">{opsFlow.noShowRate}</span>
        </div>
      </div>

      {/* ── ACTIVE LOBBY QUEUE BOARD ── */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-4 mb-5 gap-3">
          <div>
            <h3 className="font-extrabold text-base text-neutral-900 tracking-tight">
              {dateRangeFilter === 'today' ? "Active Lobby Queue (Today)" : `Clinical Encounters & Queue (${dateRangeDescription})`}
            </h3>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {!isDoctorUser && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Department:</span>
                <select
                  value={selectedDepartmentFilter}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer max-w-[200px]"
                >
                  <option value="All">All Departments</option>
                  {hospitalDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Filter:</span>
              <select
                value={presenceFilter}
                onChange={(e) => setPresenceFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">All Outpatients ({counts.total})</option>
                <option value="verified">Verified in Lobby ({counts.waiting})</option>
                <option value="pending">Pending Check-In ({counts.pending})</option>
                <option value="completed">Completed Consults ({counts.completed})</option>
                <option value="cancelled">Cancelled / Absent ({counts.absent})</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pl-4 w-28 whitespace-nowrap">Ticket #</th>
                <th className="pb-3 min-w-[200px]">Patient Details</th>
                <th className="pb-3 w-40 whitespace-nowrap">Appt Slot</th>
                <th className="pb-3 text-center w-40 whitespace-nowrap">Presence Status</th>
                <th className="pb-3 w-64 whitespace-nowrap">Consultation Room</th>
                <th className="pb-3 text-right pr-4 min-w-[290px] whitespace-nowrap">Intercom &amp; Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
              {queueList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-700">
                      {dateRangeFilter === 'today' ? 'No appointments found for Today' : `No appointments found for ${dateRangeDescription}`}
                    </p>
                  </td>
                </tr>
              ) : (
                queueList.map((apt) => {
                  const isChecked = isPatientCheckedIn(apt);
                  const getDoctorRoomText = (item: any) => {
                    const docName = (item.doctorName || '').toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, '').trim();
                    const matchedStaff = RBAC_STAFF_ACCOUNTS.find(s => {
                      const sName = s.name.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, '').trim();
                      return sName && (sName.includes(docName) || docName.includes(sName));
                    });

                    const baseRoom = matchedStaff?.room_number || item.roomNumber || currentDoctorRoom || "Consultation Room 301";
                    const dept = matchedStaff?.department || item.specialty || (currentDepartment !== 'All' ? currentDepartment : 'Internal Medicine');
                    
                    if (baseRoom.includes('(') && baseRoom.includes(')')) return baseRoom;
                    return dept && dept !== 'All' ? `${baseRoom} (${dept})` : baseRoom;
                  };
                  const room = getDoctorRoomText(apt);
                  const ticket = apt.queueNumber ? (apt.queueNumber.startsWith('#') ? apt.queueNumber : `#${apt.queueNumber}`) : '#Q-101';
                  const s = (apt.status || '').toUpperCase();
                  const isCalling = s === 'CALLING';
                  const isInConsultation = s === 'IN_CONSULTATION' || s === 'IN CONSULTATION';
                  const isFinished = s === 'COMPLETED' || s === 'DONE';
                  const isCancelled = s === 'CANCELLED';
                  const isMissing = s === 'MISSING' || s === 'ABSENT' || s === 'REJECTED';

                  return (
                    <tr key={apt.id} className="hover:bg-neutral-50/50 transition-colors">
                      {/* Ticket # */}
                      <td className="py-3.5 pl-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center font-mono font-black text-xs px-2.5 py-1 rounded-lg border shadow-2xs tracking-wider ${
                          isFinished 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : isCancelled || isMissing
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}>
                          {ticket}
                        </span>
                      </td>

                      {/* Patient Details */}
                      <td className="py-3.5">
                        <div>
                          <p className="font-bold text-neutral-900 text-xs">{apt.patientName}</p>
                          <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                            {isDoctorUser 
                              ? (apt.symptoms || apt.type || "Outpatient Consultation")
                              : `${apt.doctorName || 'Doctor'} • ${apt.specialty || 'General'}`}
                          </p>
                        </div>
                      </td>

                      {/* Appt Slot */}
                      <td className="py-3.5 font-mono font-bold text-neutral-750 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={apt.timeSlot === "Priority Triage" ? "text-red-600 font-black animate-pulse" : ""}>
                            {apt.timeSlot}
                          </span>
                          {!isFinished && !isCancelled && isAppointmentOverdue(apt.date, apt.timeSlot) && (
                            <span 
                              className="text-[9px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-md font-sans tracking-wide shrink-0"
                              title="Appointment scheduled time has passed"
                            >
                              Over Time
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 block font-sans font-medium mt-0.5">{apt.date}</span>
                      </td>

                      {/* Presence Status */}
                      <td className="py-3.5 text-center whitespace-nowrap">
                        {isFinished ? (
                          <span className="inline-flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center justify-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <X className="w-3 h-3 text-slate-400" /> Cancelled
                          </span>
                        ) : isMissing ? (
                          <span className="inline-flex items-center justify-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <AlertOctagon className="w-3 h-3 text-rose-500" /> Absent / Overdue
                          </span>
                        ) : isChecked ? (
                          <span className="inline-flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Present In Lobby
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Check-In
                          </span>
                        )}
                      </td>

                      {/* Consultation Room (Default / Locked by Clinician & Department) */}
                      <td className="py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-50 text-neutral-800 border border-neutral-200/90 font-sans shadow-2xs">
                          {room}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                        {isDoctorUser ? (
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            {isFinished ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Consult Completed
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCompleteModal(apt)}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition shadow-2xs"
                                >
                                  View / Edit Notes
                                </button>
                              </div>
                            ) : isCancelled ? (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                <X className="w-3 h-3 text-slate-400" /> Cancelled
                              </span>
                            ) : isMissing ? (
                              <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3 text-rose-500" /> Absent / Overdue
                              </span>
                            ) : isCalling ? (
                              <>
                                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg animate-pulse inline-flex items-center gap-1">
                                  <Volume2 className="w-3 h-3 text-teal-600" /> Calling...
                                </span>
                                <button
                                  onClick={() => handleDoctorStartConsultation(apt.id)}
                                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer shadow-xs transition"
                                >
                                  Start Consult
                                </button>
                                <button
                                  onClick={() => handleDoctorRecall(apt.id, apt.patientName, ticket)}
                                  className="bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition"
                                >
                                  Recall
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to cancel this queue ticket?")) {
                                      handleDoctorSkip(apt.id, 'ABSENT');
                                    }
                                  }}
                                  className="bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition"
                                >
                                  Cancel Ticket
                                </button>
                              </>
                            ) : isInConsultation ? (
                              <>
                                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                  <Stethoscope className="w-3 h-3 text-teal-600" /> In Consultation
                                </span>
                                <button
                                  onClick={() => handleOpenCompleteModal(apt)}
                                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer shadow-xs transition"
                                >
                                  Complete Consult
                                </button>
                                <button
                                  onClick={() => handleDoctorRevertToLobby(apt.id)}
                                  title="Accidental click? Revert patient back to lobby waiting queue"
                                  className="bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition"
                                >
                                  Back to Waiting
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm("Patient did not enter the room? Mark as absent / no-show?")) {
                                      handleDoctorSkip(apt.id, 'ABSENT');
                                    }
                                  }}
                                  title="Patient checked in but did not come"
                                  className="bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition"
                                >
                                  No Show
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleDoctorCallSpecific(apt.id, apt.patientName, ticket)}
                                  disabled={!isChecked}
                                  className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] inline-flex items-center gap-1.5 ${
                                    isChecked 
                                      ? 'bg-teal-700 text-white hover:bg-teal-800 shadow-xs cursor-pointer hover:scale-[1.02]' 
                                      : 'bg-neutral-100 border border-neutral-200 text-neutral-400 opacity-60 cursor-not-allowed'
                                  }`}
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  Call Now
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to cancel this queue ticket?")) {
                                      handleDoctorSkip(apt.id, 'ABSENT');
                                    }
                                  }}
                                  className="bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition cursor-pointer"
                                >
                                  Cancel Ticket
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {isFinished ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCompleteModal(apt)}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition shadow-2xs"
                                >
                                  View / Edit Notes
                                </button>
                              </div>
                            ) : isCancelled ? (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <X className="w-3 h-3 text-slate-400" /> Cancelled
                              </span>
                            ) : isMissing ? (
                              <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3 text-rose-500" /> Missed / Absent
                              </span>
                            ) : isCalling ? (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                                <Volume2 className="w-3 h-3 text-amber-600" /> Calling ({room})
                              </span>
                            ) : isInConsultation ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Stethoscope className="w-3 h-3 text-blue-600" /> In Consultation
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" /> Waiting
                              </span>
                            )}

                            {!isFinished && !isCancelled && !isMissing && (
                              <button
                                onClick={() => handleCall(apt.patientName, room, ticket)}
                                title="Paging to Frontdesk"
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Consultation Modal for Doctor with Doctor Notes & Medication Scheduler */}
      {completeModalApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-slideUp my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider font-mono block">
                    Doctor Clinical Encounter Record
                  </span>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Clinical Encounter Notes &amp; Discharge
                  </h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setCompleteModalApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient & Room Meta Banner */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 my-3.5 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  {completeModalApt.patientName}
                </span>
                <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  #{completeModalApt.queueNumber}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 font-medium">
                  {completeModalApt.date || todayDateStr} • {completeModalApt.timeSlot || "09:30 AM"}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentDoctorRoom}</span>
                <span className="text-slate-300">|</span>
                <span>{currentDoctorName}</span>
              </div>
            </div>

            {/* Success Alert Banner */}
            {modalSuccessMsg && (
              <div className="mb-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{modalSuccessMsg}</span>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto pr-1 space-y-5 flex-1 text-xs">
              
              {/* ── SECTION 1: CLINICAL DOCTOR NOTES (OPTIONAL) ── */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>Clinical Doctor Notes (Optional)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Record examination remarks, diagnostic findings, or clinical follow-up instructions for this patient.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Clinical Diagnosis
                    </label>
                    <input
                      type="text"
                      value={completeNotes.diagnosis}
                      onChange={(e) => setCompleteNotes({ ...completeNotes, diagnosis: e.target.value })}
                      placeholder="Enter clinical diagnosis (optional)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Clinical Notes &amp; Observations
                    </label>
                    <textarea
                      rows={3}
                      value={completeNotes.clinicalNotes}
                      onChange={(e) => setCompleteNotes({ ...completeNotes, clinicalNotes: e.target.value })}
                      placeholder="Enter clinical notes, diagnostic evaluations, or observations (optional)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition resize-y"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveDoctorNotesOnly}
                      disabled={isSavingNotesOnly}
                      className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isSavingNotesOnly ? "Saving Notes…" : "Save Doctor Notes"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: MEDICATION SCHEDULER ── */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-teal-600" />
                      <span>Medication Scheduler</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage scheduled medications, dosages, and dosing frequencies for this patient.
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full font-mono">
                    {modalPrescriptions.length} Active {modalPrescriptions.length === 1 ? 'Med' : 'Meds'}
                  </span>
                </div>

                {/* Scheduled Medications Table */}
                {modalPrescriptions.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    No active medication formulas currently scheduled. Use the form below to add a medication.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/30">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] bg-slate-50">
                          <th className="py-2.5 px-3">Medication Name</th>
                          <th className="py-2.5 px-3">Dosage</th>
                          <th className="py-2.5 px-3">Frequency</th>
                          <th className="py-2.5 px-3">Instructions</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {modalPrescriptions.map((rx: any, idx: number) => (
                          <tr key={rx.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-extrabold text-slate-900 block">{rx.drugName}</span>
                              {rx.date && <span className="text-[10px] text-slate-400 font-mono">Date: {rx.date}</span>}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{rx.dosage}</td>
                            <td className="py-2.5 px-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                                {rx.frequency}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{rx.instructions || "Take after meals"}</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteModalMedication(rx.id || idx)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                title="Remove medication"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Medication to Scheduler Form */}
                <div className="pt-3 border-t border-slate-100 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                  <h5 className="text-xs font-extrabold text-slate-800 mb-3 flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
                    <span>Add Medication to Scheduler</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Medication Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter medication name..."
                        value={modalNewMedDrug}
                        onChange={(e) => setModalNewMedDrug(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Dosage
                      </label>
                      <input
                        type="text"
                        placeholder="Enter dosage (e.g. 1 Tablet, 500mg)..."
                        value={modalNewMedDosage}
                        onChange={(e) => setModalNewMedDosage(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Frequency
                      </label>
                      <select
                        value={modalNewMedFreq}
                        onChange={(e) => setModalNewMedFreq(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer h-9"
                      >
                        <option value="Once Daily (QD)">Once Daily (QD)</option>
                        <option value="Twice Daily (BID)">Twice Daily (BID)</option>
                        <option value="Three Times Daily (TID)">Three Times Daily (TID)</option>
                        <option value="Four Times Daily (QID)">Four Times Daily (QID)</option>
                        <option value="PRN / As Needed">PRN / As Needed</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="Enter administration instructions (optional)..."
                        value={modalNewMedInstructions}
                        onChange={(e) => setModalNewMedInstructions(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="sm:col-span-4 flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddModalMedication}
                        disabled={!modalNewMedDrug.trim()}
                        className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Schedule Medication</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setCompleteModalApt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
              >
                Close Window
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmitCompleteConsultation}
                  disabled={isSubmittingComplete}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingComplete ? "Saving Consultation..." : "Confirm & Complete Consultation"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
