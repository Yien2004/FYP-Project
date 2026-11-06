import React, { useState, useEffect } from "react";
import Dashboard from "./screens/Dashboard";
import AIConsultation from "./screens/AIConsultation";
import ScheduleAppointment from "./screens/ScheduleAppointment";
import AppointmentsHistory from "./screens/AppointmentsHistory";
import ClinicSearch from "./screens/ClinicSearch";
import PatientRegistration from "./screens/PatientRegistration";
import Notifications from "./screens/Notifications";
import UserSettings from "./screens/UserSettings";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import {
  PatientProfile,
  VitalSign,
  Appointment,
  AppNotification,
  Doctor
} from "./types";
import {
  initialPatientProfile,
  mockAppointments,
  clinicalVitals,
  initialNotifications
} from "./mockData";

// ─────────────────────────────────────────────────────────────────────────────
// Shared API fetch helper — attaches auth token if available
// ─────────────────────────────────────────────────────────────────────────────
function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("carepoint_access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

interface PatientAppProps {
  onLogout?: () => void;
}

function getNotifSortTime(n: AppNotification): number {
  if (n.timestamp) {
    const t = new Date(n.timestamp).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  // Extract 13-digit millisecond epoch if embedded in id (e.g. notif-173082..., notif-admin-173082...)
  if (n.id) {
    const idMatch = n.id.match(/(\d{13})/);
    if (idMatch) {
      const parsedIdTime = parseInt(idMatch[1], 10);
      if (!isNaN(parsedIdTime) && parsedIdTime > 1600000000000 && parsedIdTime < 2500000000000) {
        return parsedIdTime;
      }
    }
  }
  const str = (n.time || '').trim().toLowerCase();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (str.includes('just now')) {
    return Date.now();
  }

  let dayOffsetMs = 0;
  if (str.includes('yesterday')) {
    dayOffsetMs = -24 * 3600 * 1000;
  } else if (str.includes('days ago')) {
    const dMatch = str.match(/(\d+)\s*days?\s*ago/);
    if (dMatch) {
      dayOffsetMs = -parseInt(dMatch[1], 10) * 24 * 3600 * 1000;
    }
  }

  const timeMatch = str.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    let computed = todayStart + dayOffsetMs + (h * 3600 + m * 60) * 1000;
    // CRITICAL: Notifications represent past events. If computed is in the future relative to now,
    // and no explicit day offset was provided, it happened yesterday (e.g. 10:25 pm evaluated at 1:20 am).
    if (dayOffsetMs === 0 && computed > Date.now()) {
      computed -= 24 * 3600 * 1000;
    }
    return computed;
  }

  return todayStart + dayOffsetMs;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PatientApp({ onLogout }: PatientAppProps) {
  const [currentScreen, setCurrentScreen] = useState<string>("dashboard");

  // Local states: initialized cleanly for real accounts, falling back to mock data only for demo account
  const [patientProfile, setPatientProfile] = useState<PatientProfile>(() => {
    const cachedEmail = localStorage.getItem("carepoint_user_email") || localStorage.getItem("lifelink_user_email");
    if (cachedEmail && cachedEmail !== "ahmad.danish@gmail.com") {
      const cachedName = localStorage.getItem("carepoint_user_name") || localStorage.getItem("lifelink_user_name") || cachedEmail.split("@")[0];
      return {
        fullName: cachedName,
        myKadOrPassport: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        email: cachedEmail,
        nationality: "",
        bloodType: "",
        allergies: [],
        chronicConditions: [],
        insuranceProvider: "",
        insurancePolicyNumber: "",
        primaryPhysician: "",
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cachedName)}&background=0d9488&color=fff`,
        emergencyContactName: "",
        emergencyContactPhone: "",
        defaultRegion: "",
        language: "English"
      };
    }
    return initialPatientProfile;
  });
  const [appointments, setAppointments]       = useState<Appointment[]>([]);
  const [vitalsList, setVitalsList]           = useState<VitalSign[]>([]);
  const [notifications, setNotifications]     = useState<AppNotification[]>(() => {
    const cachedEmail = localStorage.getItem("carepoint_user_email") || localStorage.getItem("lifelink_user_email");
    if (cachedEmail && cachedEmail !== "ahmad.danish@gmail.com") {
      return [];
    }
    return initialNotifications;
  });
  const [doctorsList, setDoctorsList]         = useState<Doctor[]>([]);
  const [prefilledApt, setPrefilledApt]       = useState<Appointment | null>(null);

  // ── Fetch all patient data from Supabase via the Express API ─────────────

  const fetchPatientData = async (email: string) => {
    try {
      // 1. Profile
      const pRes = await apiFetch(`/api/profile?email=${encodeURIComponent(email)}`);
      if (!pRes.ok) return;
      const profile = await pRes.json();
      setPatientProfile(profile);
      
      let profileNotifs: AppNotification[] = [];
      if (profile.notifications && Array.isArray(profile.notifications)) {
        profileNotifs = profile.notifications
          .filter((n: any) => {
            if (email !== "ahmad.danish@gmail.com" && ["notif-ai-reminder", "notif-1", "notif-2", "notif-3", "notif-4"].includes(n.id)) {
              return false;
            }
            return true;
          })
          .map((n: any) => ({
            id: n.id,
            title: n.title,
            body: n.body || n.message || "",
            time: n.time || (n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"),
            category: n.category || "general",
            read: n.read,
            timestamp: n.timestamp
          }));
      }

      const patientId = profile.id;
      if (!patientId) return;

      // 2. Vitals
      const vRes = await apiFetch(`/api/vitals?patientId=${patientId}`);
      if (vRes.ok) {
        const vitals: VitalSign[] = await vRes.json();
        setVitalsList(vitals || []);
      }

      // 3. Appointments
      let apts: Appointment[] = [];
      const aRes = await apiFetch(`/api/appointments?patientId=${patientId}`);
      if (aRes.ok) {
        apts = await aRes.json();
        setAppointments(apts);
      }

      // 5. Clinicians (Doctors)
      const dRes = await apiFetch("/api/clinicians");
      if (dRes.ok) {
        const docs = await dRes.json();
        setDoctorsList(docs || []);
      }

      // 5. Clinicians (Doctors)

      // 6. Fetch Broadcast Alerts from system logs
      let broadcastNotifs: AppNotification[] = [];
      try {
        const logsRes = await apiFetch("/api/logs");
        if (logsRes.ok) {
          const logsList = await logsRes.json();
          if (Array.isArray(logsList)) {
            // Find unique clinic names from booked appointments
            const bookedClinics = Array.from(
              new Set(
                apts
                  .map((apt: any) => apt.clinic || apt.hospital)
                  .filter((c: any): c is string => !!c)
              )
            );

            const readBroadcastsKey = `patient_read_broadcasts_${patientId}`;
            let readBroadcasts: string[] = [];
            try {
              const saved = localStorage.getItem(readBroadcastsKey);
              if (saved) readBroadcasts = JSON.parse(saved);
            } catch (e) {}

            logsList.forEach((log: any, idx: number) => {
              const msg = log.message || "";
              if (!msg.startsWith("[Broadcast]:")) return;

              // Expire temporary clinic broadcasts after 24 hours
              if (log.timestamp) {
                const logTime = new Date(log.timestamp).getTime();
                if (!isNaN(logTime) && Date.now() - logTime > 24 * 60 * 60 * 1000) {
                  return;
                }
              }

              const cleanMsg = msg.replace("[Broadcast]:", "").trim();

              // Parse audience group target
              let group = "All Registered Patients";
              let text = cleanMsg;
              if (cleanMsg.startsWith("(")) {
                const closingIdx = cleanMsg.indexOf(")");
                if (closingIdx > 0) {
                  group = cleanMsg.substring(1, closingIdx);
                  text = cleanMsg.substring(closingIdx + 1).trim();
                }
              }

              // Determine if this broadcast targets this patient
              const isTargetGroup = 
                group === "All Users" || 
                group === "All Registered Patients" || 
                bookedClinics.some(c => c.toLowerCase().includes(group.toLowerCase()) || group.toLowerCase().includes(c.toLowerCase()));

              if (isTargetGroup) {
                const logId = String(log.id || `bc-${idx}-${log.timestamp}`);
                const isRead = readBroadcasts.includes(logId);
                
                broadcastNotifs.push({
                  id: logId,
                  title: `📢 Announcement Alert`,
                  body: text,
                  time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
                  category: "general",
                  read: isRead,
                  timestamp: log.timestamp || new Date().toISOString()
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn("Failed to load system broadcasts:", err);
      }

      // Merge profile notifications and broadcast notifications
      const mergedNotifs = [...profileNotifs];
      broadcastNotifs.forEach(bNotif => {
        if (!mergedNotifs.some(n => n.id === bNotif.id)) {
          mergedNotifs.push(bNotif);
        }
      });

      if (mergedNotifs.length === 0 && email === "ahmad.danish@gmail.com") {
        mergedNotifs.push(...initialNotifications);
      }

      // Sort notifications descending by recency (newest alerts on top)
      mergedNotifs.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));

      setNotifications(mergedNotifs);

    } catch (err) {
      console.warn("Failed to load patient records from Supabase — using local mock data.", err);
    }
  };

  // ── Restore session on page load ──────────────────────────────────────────

  useEffect(() => {
    const cachedEmail = localStorage.getItem("carepoint_user_email");
    if (cachedEmail) {
      fetchPatientData(cachedEmail);

      // Poll clinical records every 10 seconds for live updates
      const pollInterval = setInterval(() => {
        fetchPatientData(cachedEmail);
      }, 10000);

      return () => clearInterval(pollInterval);
    }
  }, []);

  // Watch prescriptions list and alert user on new arrivals
  const [notifiedRxIds, setNotifiedRxIds] = useState<string[]>([]);

  useEffect(() => {
    if (!patientProfile || !patientProfile.prescriptions) return;
    const currentRx = patientProfile.prescriptions;
    const newRx = currentRx.filter(rx => !notifiedRxIds.includes(rx.id));

    if (newRx.length > 0) {
      const newNotifications: AppNotification[] = newRx.map(rx => ({
        id: `notif-rx-${rx.id}-${Date.now()}`,
        title: `💊 New Prescription: ${rx.drugName}`,
        body: `${rx.dosage} (${rx.frequency}) for ${rx.duration}. Prescribed by ${rx.prescribedBy || "Staff"}.`,
        time: "Just now",
        timestamp: new Date().toISOString(),
        category: "medication" as const,
        read: false
      }));

      setNotifications(prev => {
        const combined = [...newNotifications, ...prev];
        combined.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));
        return combined;
      });
      setNotifiedRxIds(prev => [...prev, ...newRx.map(rx => rx.id)]);
    }
  }, [patientProfile.prescriptions]);

  // ── Auth handlers ─────────────────────────────────────────────────────────

  const handleLoginSuccess = () => {
    // Already logged in from App.tsx
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // ── Profile ───────────────────────────────────────────────────────────────

  const handleUpdateProfile = async (updated: PatientProfile) => {
    setPatientProfile(updated);
    try {
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({ ...updated, email: updated.email })
      });
    } catch (err) {
      console.error("Failed to sync profile update", err);
    }
  };

  // ── Smart AI Appointment Notification Helpers ───────────────────────────
  const getAppointmentDateTime = (dateStr: string, timeSlotStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    let hour = 9;
    let minute = 0;

    if (timeSlotStr) {
      const match24 = timeSlotStr.match(/^(\d{1,2}):(\d{2})/);
      if (match24) {
        hour = parseInt(match24[1], 10);
        minute = parseInt(match24[2], 10);
      } else {
        const match12 = timeSlotStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match12) {
          let h = parseInt(match12[1], 10);
          minute = parseInt(match12[2], 10);
          const meridiem = (match12[3] || "").toUpperCase();
          if (meridiem === "PM" && h < 12) h += 12;
          if (meridiem === "AM" && h === 12) h = 0;
          hour = h;
        }
      }
    }

    return new Date(year, month, day, hour, minute);
  };

  // Periodic Reminder Watcher: Checks 1 day in advance & 2 hours in advance
  useEffect(() => {
    const checkAiReminders = () => {
      const now = new Date();
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const additions: AppNotification[] = [];

      appointments.forEach((apt) => {
        if (apt.status === "Cancelled" || apt.status === "Done" || apt.status === "Completed") return;
        const aptTime = getAppointmentDateTime(apt.date, apt.timeSlot);
        if (!aptTime) return;

        const aptDateOnly = new Date(aptTime.getFullYear(), aptTime.getMonth(), aptTime.getDate());
        const dayDiff = Math.round((aptDateOnly.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        const diffMins = Math.round((aptTime.getTime() - now.getTime()) / (1000 * 60));

        // 1. One day in advance reminder (tomorrow)
        const oneDayNotifId = `notif-ai-1day-${apt.id}`;
        if (dayDiff === 1 && !notifications.some(n => n.id === oneDayNotifId)) {
          additions.push({
            id: oneDayNotifId,
            title: `Appointment Reminder: Tomorrow at ${apt.timeSlot}`,
            body: `Health Assistant Reminder: You have an upcoming consultation with ${apt.doctorName || 'Specialist'} at ${apt.clinic} tomorrow (${apt.date}) at ${apt.timeSlot}. Please remember to arrive 5–10 minutes early for reception check-in.`,
            time: "Just now",
            timestamp: new Date().toISOString(),
            read: false,
            category: "reminder"
          });
        }

        // 2. 2 hours in advance reminder (today, diffMins <= 120 && diffMins > 0)
        const twoHourNotifId = `notif-ai-2h-${apt.id}`;
        if (dayDiff === 0 && diffMins <= 120 && diffMins > 0 && !notifications.some(n => n.id === twoHourNotifId)) {
          additions.push({
            id: twoHourNotifId,
            title: `Appointment Reminder: In 2 Hours (${apt.timeSlot})`,
            body: `Health Assistant Reminder: Your consultation with ${apt.doctorName || 'Specialist'} at ${apt.clinic} begins in 2 hours (${apt.timeSlot}). Queue: ${apt.queueNumber || '#Q-100'}. Please arrive 5–10 minutes early for counter presence check-in.`,
            time: "Just now",
            timestamp: new Date().toISOString(),
            read: false,
            category: "reminder"
          });
        }
      });

      if (additions.length > 0) {
        setNotifications(prev => {
          const combined = [...additions, ...prev];
          combined.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));
          return combined;
        });
      }
    };

    checkAiReminders();
    const interval = setInterval(checkAiReminders, 30000);
    return () => clearInterval(interval);
  }, [appointments, notifications]);

  // ── Appointments ──────────────────────────────────────────────────────────

  const handleAddAppointment = async (newApt: Appointment) => {
    const newAptWithPatient = {
      ...newApt,
      patientId:   patientProfile.id || "p1",
      patientName: patientProfile.fullName,
      patientEmail: patientProfile.email
    };
    try {
      const res = await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify(newAptWithPatient)
      });
      if (res.ok) {
        const saved = await res.json();
        setAppointments(prev => [saved, ...prev]);

        // Evaluate user's timing rules:
        // 1. Success confirmation
        const arrivalNotice = `Please arrive at the clinic counter 5–10 minutes before your scheduled appointment time and present your Queue Number (${saved.queueNumber || 'assigned at counter'}) to the counter staff for on-site presence check-in.`;
        const successNotif: AppNotification = {
          id: "notif-success-" + saved.id + "-" + Date.now(),
          title: `Booking Confirmed (${saved.queueNumber || '#Q-100'})`,
          body: `Booking confirmed for ${saved.timeSlot} at ${saved.clinic} with ${saved.doctorName || 'Specialist'}. ${arrivalNotice}`,
          message: `Booking confirmed for ${saved.timeSlot} at ${saved.clinic} with ${saved.doctorName || 'Specialist'}. ${arrivalNotice}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString(),
          read: false,
          category: "reminder" as any
        };

        const newGeneratedNotifs: AppNotification[] = [successNotif];

        const now = new Date();
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const aptTime = getAppointmentDateTime(saved.date, saved.timeSlot);

        if (aptTime) {
          const aptDateOnly = new Date(aptTime.getFullYear(), aptTime.getMonth(), aptTime.getDate());
          const dayDiff = Math.round((aptDateOnly.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
          const diffMins = Math.round((aptTime.getTime() - now.getTime()) / (1000 * 60));

          // Rule 1: One day in advance reminder (if appointment is tomorrow)
          if (dayDiff === 1) {
            newGeneratedNotifs.unshift({
              id: `notif-ai-1day-${saved.id}`,
              title: `Appointment Reminder: Tomorrow at ${saved.timeSlot}`,
              body: `Health Assistant Reminder: You have an upcoming consultation with ${saved.doctorName || 'Specialist'} at ${saved.clinic} tomorrow (${saved.date}) at ${saved.timeSlot}. Please remember to arrive 5–10 minutes early for reception check-in.`,
              time: "Just now",
              timestamp: new Date().toISOString(),
              read: false,
              category: "reminder"
            });
          }

          // Rule 2 & 3: If appointment is today:
          // If booked > 2 hours ahead (diffMins > 120), the 2-hour watcher will trigger when within 2 hours.
          // If booked <= 2 hours ahead, do NOT send duplicate reminder, only successNotif!
        }

        const updatedNotifs = [...newGeneratedNotifs, ...(patientProfile.notifications || [])];
        updatedNotifs.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));
        setPatientProfile(prev => ({ ...prev, notifications: updatedNotifs }));
        setNotifications(prev => {
          const combined = [...newGeneratedNotifs, ...prev];
          combined.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));
          return combined;
        });

        alert(`SUCCESS: Booking confirmed at ${saved.clinic} on ${saved.date} at ${saved.timeSlot}!\nQueue Number: ${saved.queueNumber || '#Q-100'}\n\nPlease arrive 5–10 minutes early to check-in at the counter.`);
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Conflict: This consultation time slot has already been booked by another patient.");
        return false;
      }
    } catch (err) {
      console.error("Failed to save appointment on server", err);
      alert("Unable to reach server to confirm time slot. Please try again.");
      return false;
    }
    setPrefilledApt(null);
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      const res = await apiFetch(`/api/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Cancelled" })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(apt => 
          apt.id === id ? { ...apt, status: "Cancelled" } : apt
        ));

        // Append local notification immediately
        const target = appointments.find(apt => apt.id === id);
        if (target) {
          const newNotif = {
            id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            title: "Appointment Cancelled",
            body: `Booking cancelled, ${target.timeSlot} ${target.clinic}`,
            message: `Booking cancelled, ${target.timeSlot} ${target.clinic}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            read: false,
            category: "general" as any
          };
          const updatedNotifs = [newNotif, ...(patientProfile.notifications || [])];
          updatedNotifs.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));
          setPatientProfile(prev => ({ ...prev, notifications: updatedNotifs }));
          setNotifications(prev => {
            const combined = [newNotif, ...prev];
            combined.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));
            return combined;
          });

          alert(`SUCCESS: Your appointment at ${target.clinic} has been cancelled. A notification log has been saved to your records.`);
        }
      } else {
        setAppointments(prev => prev.map(apt => 
          apt.id === id ? { ...apt, status: "Cancelled" } : apt
        ));
      }
    } catch (err) {
      console.error("Failed to cancel appointment", err);
      setAppointments(prev => prev.map(apt => 
        apt.id === id ? { ...apt, status: "Cancelled" } : apt
      ));
    }
  };

  const handleUpdateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, ...updates } : apt));
  };

  const handleRescheduleAppointment = async (id: string, date: string, timeSlot: string) => {
    try {
      const res = await apiFetch(`/api/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ date, timeSlot })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(apt => 
          apt.id === id ? { ...apt, date, timeSlot } : apt
        ));

        // Append local notification immediately
        const target = appointments.find(apt => apt.id === id);
        if (target) {
          const newNotif = {
            id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            title: "Appointment Rescheduled",
            body: `Booking rescheduled, ${timeSlot} ${target.clinic}`,
            message: `Booking rescheduled, ${timeSlot} ${target.clinic}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            read: false,
            category: "general" as any
          };
          const updatedNotifs = [newNotif, ...(patientProfile.notifications || [])];
          updatedNotifs.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));
          setPatientProfile(prev => ({ ...prev, notifications: updatedNotifs }));
          setNotifications(prev => {
            const combined = [newNotif, ...prev];
            combined.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));
            return combined;
          });

          alert(`SUCCESS: Your appointment at ${target.clinic} has been rescheduled to ${date} at ${timeSlot}.`);
        }
      } else {
        setAppointments(prev => prev.map(apt => 
          apt.id === id ? { ...apt, date, timeSlot } : apt
        ));
      }
    } catch (err) {
      console.error("Failed to reschedule appointment", err);
      setAppointments(prev => prev.map(apt => 
        apt.id === id ? { ...apt, date, timeSlot } : apt
      ));
    }
  };

  const handlePostponedStatus = async (id: string, newDate: string) => {
    const target = appointments.find(a => a.id === id);
    if (!target) return;
    const updatedSymptoms = `${target.symptoms} (Rescheduled automatically (+1wk))`;

    try {
      const res = await apiFetch(`/api/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ date: newDate, symptoms: updatedSymptoms })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(apt =>
          apt.id === id ? { ...apt, date: newDate, symptoms: updatedSymptoms } : apt
        ));
      }
    } catch (err) {
      console.error("Failed to reschedule appointment", err);
    }

    const newAlert: AppNotification = {
      id:       "notif-resched-" + Date.now(),
      title:    "Appointment Rescheduled",
      body:     `Your consultation with Dr. Jenkins has been shifted to ${newDate}.`,
      time:     "Just now",
      timestamp: new Date().toISOString(),
      category: "general" as const,
      read:     false
    };
    setNotifications(prev => {
      const combined = [newAlert, ...prev];
      combined.sort((a, b) => getNotifSortTime(b) - getNotifSortTime(a));
      return combined;
    });
  };

  // ── Vitals ────────────────────────────────────────────────────────────────

  const handleAddVitals = async (vital: VitalSign) => {
    const vitalWithPatient = { ...vital, patientId: patientProfile.id || "p1" };
    try {
      const res = await apiFetch("/api/vitals", {
        method: "POST",
        body: JSON.stringify(vitalWithPatient)
      });
      if (res.ok) {
        const saved = await res.json();
        setVitalsList(prev => [saved, ...prev]);
      } else {
        setVitalsList(prev => [vitalWithPatient, ...prev]);
      }
    } catch (err) {
      console.error("Failed to sync vitals to backend", err);
      setVitalsList(prev => [vitalWithPatient, ...prev]);
    }
  };

  // ── Notifications ─────────────────────────────────────────────────────────

  const handleMarkRead      = async (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);

    const patientId = patientProfile.id || "p1";
    const readBroadcastsKey = `patient_read_broadcasts_${patientId}`;
    try {
      let readBroadcasts: string[] = [];
      const saved = localStorage.getItem(readBroadcastsKey);
      if (saved) readBroadcasts = JSON.parse(saved);
      if (!readBroadcasts.includes(id)) {
        readBroadcasts.push(id);
        localStorage.setItem(readBroadcastsKey, JSON.stringify(readBroadcasts));
      }
    } catch (e) {}

    if (patientProfile) {
      const profileOnlyNotifs = updated.filter(n => !n.id.startsWith("bc-") && !n.id.startsWith("log-"));
      await handleUpdateProfile({ ...patientProfile, notifications: profileOnlyNotifs });
    }
  };

  const handleMarkAllRead   = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);

    const patientId = patientProfile.id || "p1";
    const readBroadcastsKey = `patient_read_broadcasts_${patientId}`;
    try {
      const allBroadcastIds = notifications.map(n => n.id);
      localStorage.setItem(readBroadcastsKey, JSON.stringify(allBroadcastIds));
    } catch (e) {}

    if (patientProfile) {
      const profileOnlyNotifs = updated.filter(n => !n.id.startsWith("bc-") && !n.id.startsWith("log-"));
      await handleUpdateProfile({ ...patientProfile, notifications: profileOnlyNotifs });
    }
  };

  const handleDeleteNotif   = async (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);

    const patientId = patientProfile.id || "p1";
    const readBroadcastsKey = `patient_read_broadcasts_${patientId}`;
    try {
      let readBroadcasts: string[] = [];
      const saved = localStorage.getItem(readBroadcastsKey);
      if (saved) readBroadcasts = JSON.parse(saved);
      if (!readBroadcasts.includes(id)) {
        readBroadcasts.push(id);
        localStorage.setItem(readBroadcastsKey, JSON.stringify(readBroadcasts));
      }
    } catch (e) {}

    if (patientProfile) {
      const profileOnlyNotifs = updated.filter(n => !n.id.startsWith("bc-") && !n.id.startsWith("log-"));
      await handleUpdateProfile({ ...patientProfile, notifications: profileOnlyNotifs });
    }
  };

  // ── Navigation helpers ────────────────────────────────────────────────────

  const handleResubmitBooking = (apt: Appointment) => {
    setPrefilledApt(apt);
    localStorage.setItem("pantai_booking_initial_step", "4");
    if (apt.clinic) {
      localStorage.setItem("pantai_booking_preselected_clinic", apt.clinic);
    }
    setCurrentScreen("schedule-appointment");
  };

  const handleSetScreen = (screen: string) => {
    if (screen === "schedule-appointment") {
      const hasPreselectedStep = localStorage.getItem("pantai_booking_initial_step");
      if (!hasPreselectedStep) {
        setPrefilledApt(null);
        localStorage.removeItem("pantai_booking_preselected_clinic");
        localStorage.removeItem("pantai_booking_preselected_doctor");
        localStorage.removeItem("pantai_booking_preselected_specialty");
        localStorage.removeItem("carey_triage_specialty");
      }
    } else {
      setPrefilledApt(null);
      localStorage.removeItem("pantai_booking_initial_step");
      localStorage.removeItem("pantai_booking_preselected_clinic");
      localStorage.removeItem("pantai_booking_preselected_doctor");
      localStorage.removeItem("pantai_booking_preselected_specialty");
      localStorage.removeItem("carey_triage_specialty");
    }
    setCurrentScreen(screen);
  };

  // ─── Authenticated layout ─────────────────────────────────────────────────
  return (
    <div id="lifelink-portal-layout" className="min-h-screen bg-slate-50 flex font-sans">

      {/* Left sidebar navigation */}
      <Sidebar
        currentScreen={currentScreen}
        onSetScreen={handleSetScreen}
        notifications={notifications}
        onLogout={handleLogout}
        patientProfile={patientProfile}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          currentScreen={currentScreen}
          onNavigateHome={() => handleLogout()}
          notifications={notifications}
          onSetScreen={handleSetScreen}
          patientName={patientProfile.fullName}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="animate-fade-in">

            {currentScreen === "dashboard" && (
              <Dashboard
                patientProfile={patientProfile}
                appointments={appointments}
                vitals={vitalsList}
                onSetScreen={handleSetScreen}
                onPostponedStatus={handlePostponedStatus}
                onCancelAppointment={handleCancelAppointment}
                onResubmitBooking={handleResubmitBooking}
              />
            )}

            {currentScreen === "ai-consultation" && (
              <AIConsultation
                patientProfile={patientProfile}
                vitals={vitalsList}
                appointments={appointments}
                onSetScreen={handleSetScreen}
              />
            )}

            {currentScreen === "schedule-appointment" && (
              <ScheduleAppointment
                onAddAppointment={handleAddAppointment}
                prefilledApt={prefilledApt}
                onSetScreen={handleSetScreen}
                appointments={appointments}
                onCancelAppointment={handleCancelAppointment}
                onRescheduleAppointment={handleRescheduleAppointment}
                patientProfile={patientProfile}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

            {currentScreen === "appointments-history" && (
              <AppointmentsHistory
                appointments={appointments}
                onResubmitBooking={handleResubmitBooking}
                onSetScreen={handleSetScreen}
                doctors={doctorsList}
                onCancelAppointment={handleCancelAppointment}
                onRescheduleAppointment={handleRescheduleAppointment}
              />
            )}

            {currentScreen === "clinic-search" && (
              <ClinicSearch onSetScreen={handleSetScreen} />
            )}

            {currentScreen === "patient-registration" && (
              <PatientRegistration
                currentProfile={patientProfile}
                onUpdateProfile={handleUpdateProfile}
                onSetScreen={handleSetScreen}
              />
            )}

            {currentScreen === "notifications" && (
              <Notifications
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onDeleteNotif={handleDeleteNotif}
              />
            )}

            {currentScreen === "user-settings" && (
              <UserSettings
                patientProfile={patientProfile}
                vitals={vitalsList}
                appointments={appointments}
                onSetScreen={handleSetScreen}
                onLogout={handleLogout}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
