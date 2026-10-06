import React, { useState, useEffect } from "react";
import Dashboard from "./screens/Dashboard";
import AIConsultation from "./screens/AIConsultation";
import MedicalRecords from "./screens/MedicalRecords";
import Communication from "./screens/Communication";
import ScheduleAppointment from "./screens/ScheduleAppointment";
import AppointmentsHistory from "./screens/AppointmentsHistory";
import ClinicSearch from "./screens/ClinicSearch";
import PatientRegistration from "./screens/PatientRegistration";
import Notifications from "./screens/Notifications";
import UserSettings from "./screens/UserSettings";
import HealthcareAnalytics from "./screens/HealthcareAnalytics";
import WearableHealth from "./screens/WearableHealth";
import FetchingTransit from "./screens/FetchingTransit";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import EmergencySOS from "./components/EmergencySOS";

import {
  PatientProfile,
  VitalSign,
  Appointment,
  AppNotification,
  Message,
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

// ─────────────────────────────────────────────────────────────────────────────
export default function PatientApp({ onLogout }: PatientAppProps) {
  const [currentScreen, setCurrentScreen] = useState<string>("dashboard");

  // Local states seeded with mock data; replaced from Supabase on login
  const [patientProfile, setPatientProfile]   = useState<PatientProfile>(initialPatientProfile);
  const [appointments, setAppointments]       = useState<Appointment[]>([]);
  const [vitalsList, setVitalsList]           = useState<VitalSign[]>([]);
  const [notifications, setNotifications]     = useState<AppNotification[]>(initialNotifications);
  const [doctorsList, setDoctorsList]         = useState<Doctor[]>([]);
  const [prefilledApt, setPrefilledApt]       = useState<Appointment | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(1);

  useEffect(() => {
    if (currentScreen === "communication") {
      setUnreadMessagesCount(0);
    }
  }, [currentScreen]);

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
        profileNotifs = profile.notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.body || n.message || "",
          time: n.time || (n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"),
          category: n.category || "general",
          read: n.read
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

      // 4. Messages
      const mRes = await apiFetch(`/api/messages?threadId=chat-${patientId}`);
      if (mRes.ok) {
        const msgs: any[] = await mRes.json();
        if (Array.isArray(msgs) && msgs.length > 0) {
          setMessages(msgs.map((msg: any) => ({
            id:         msg.id,
            sender:     msg.sender,
            senderName: msg.senderName || (msg.sender === "doctor" ? "Dr. Sarah Jenkins" : "Patient"),
            content:    msg.content || msg.text || "",
            timestamp:  msg.timestamp
          })));
        }
      }

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
                  read: isRead
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

      // Ensure example AI appointment reminder is always available in notification box
      const hasAiReminder = mergedNotifs.some(n => n.id === "notif-ai-reminder" || n.category === "reminder");
      if (!hasAiReminder && initialNotifications.length > 0) {
        mergedNotifs.unshift(initialNotifications[0]);
      }

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
        category: "medication" as const,
        read: false
      }));

      setNotifications(prev => [...newNotifications, ...prev]);
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

        // Append local notification immediately
        const arrivalNotice = `Please arrive at the clinic counter 5–10 minutes before your scheduled appointment time and present your Queue Number (${saved.queueNumber || 'assigned at counter'}) to the counter staff for on-site presence check-in. Make sure you have arrived in person to confirm your consultation slot.`;
        const newNotif = {
          id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          title: `Booking Confirmed (${saved.queueNumber || '#Q-100'})`,
          body: `Booking confirmed for ${saved.timeSlot} at ${saved.clinic} with ${saved.doctorName || 'Specialist'}. ${arrivalNotice}`,
          message: `Booking confirmed for ${saved.timeSlot} at ${saved.clinic} with ${saved.doctorName || 'Specialist'}. ${arrivalNotice}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString(),
          read: false,
          category: "reminder" as any
        };
        const updatedNotifs = [newNotif, ...(patientProfile.notifications || [])];
        setPatientProfile(prev => ({ ...prev, notifications: updatedNotifs }));
        setNotifications(prev => [newNotif, ...prev]);

        alert(`SUCCESS: Booking confirmed at ${saved.clinic} on ${saved.date} at ${saved.timeSlot}!\nQueue Number: ${saved.queueNumber || '#Q-100'}\n\nPlease arrive 5–10 minutes early to check-in at the counter.`);
      } else {
        setAppointments(prev => [newAptWithPatient, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save appointment on server", err);
      setAppointments(prev => [newAptWithPatient, ...prev]);
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
          setPatientProfile(prev => ({ ...prev, notifications: updatedNotifs }));
          setNotifications(prev => [newNotif, ...prev]);

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
          setPatientProfile(prev => ({ ...prev, notifications: updatedNotifs }));
          setNotifications(prev => [newNotif, ...prev]);

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
      category: "general" as const,
      read:     false
    };
    setNotifications(prev => [newAlert, ...prev]);
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

  // ── Messages ──────────────────────────────────────────────────────────────

  const handleSendMessage = async (msg: Message) => {
    // Optimistically add the message to state immediately for instant rendering
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });

    const threadId = `chat-${patientProfile.id || "p1"}`;
    const payload = {
      threadId,
      sender:     "user" as const,
      senderName: patientProfile.fullName,
      content:    msg.content,
      timestamp:  msg.timestamp
    };
    try {
      const res = await apiFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        // Replace the temporary message with the synchronized version from the server
        setMessages(prev => prev.map(m => m.id === msg.id ? {
          id:         saved.id,
          sender:     "user",
          senderName: patientProfile.fullName,
          content:    saved.content || saved.text || msg.content,
          timestamp:  saved.timestamp
        } : m));
      }
    } catch (err) {
      console.warn("Failed to synchronize message to database, keeping local copy:", err);
    }
  };

  const handleInjectDoctorMessage = async (content: string) => {
    const nextUpcoming = appointments.find(a => a.status === "Upcoming");
    const clinicName = nextUpcoming?.clinic || "General Triage";
    const channelId = `staff-${clinicName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    
    const threadId = `chat-${patientProfile.id || "p1"}`;
    const prefixedContent = `[${channelId}]: ${content}`;
    const payload = {
      threadId,
      sender:     "doctor" as const,
      senderName: `Nurse ${clinicName.includes("Klinik") ? "Aishah" : "Mei Ling"}`,
      content:    prefixedContent,
      timestamp:  new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    };
    try {
      const res = await apiFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages(prev => [...prev, {
          id:         saved.id,
          sender:     "doctor",
          senderName: payload.senderName,
          content:    saved.content || saved.text,
          timestamp:  saved.timestamp
        }]);
      }
    } catch (err) {
      console.error("Failed to inject doctor message", err);
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
    setCurrentScreen("schedule-appointment");
  };

  // ─── Authenticated layout ─────────────────────────────────────────────────
  return (
    <div id="lifelink-portal-layout" className="min-h-screen bg-slate-50 flex font-sans">

      {/* Left sidebar navigation */}
      <Sidebar
        currentScreen={currentScreen}
        onSetScreen={setCurrentScreen}
        notifications={notifications}
        onLogout={handleLogout}
        patientProfile={patientProfile}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          currentScreen={currentScreen}
          onNavigateHome={() => handleLogout()}
          notifications={notifications}
          onSetScreen={setCurrentScreen}
          patientName={patientProfile.fullName}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="animate-fade-in">

            {currentScreen === "dashboard" && (
              <Dashboard
                patientProfile={patientProfile}
                appointments={appointments}
                vitals={vitalsList}
                onSetScreen={setCurrentScreen}
                onPostponedStatus={handlePostponedStatus}
                onCancelAppointment={handleCancelAppointment}
              />
            )}

            {currentScreen === "healthcare-analytics" && (
              <HealthcareAnalytics
                patientProfile={patientProfile}
                vitals={vitalsList}
                appointments={appointments}
                onSetScreen={setCurrentScreen}
              />
            )}

            {currentScreen === "wearable-health" && (
              <WearableHealth
                patientProfile={patientProfile}
                appointments={appointments}
                onSetScreen={setCurrentScreen}
              />
            )}

            {currentScreen === "ai-consultation" && (
              <AIConsultation
                patientProfile={patientProfile}
                vitals={vitalsList}
                onSetScreen={setCurrentScreen}
                onInjectDoctorMessage={handleInjectDoctorMessage}
              />
            )}

            {currentScreen === "medical-records" && (
              <MedicalRecords
                vitalsList={vitalsList}
                onAddVitals={handleAddVitals}
                appointments={appointments}
              />
            )}

            {currentScreen === "communication" && (
              <Communication
                messages={messages}
                onSendMessage={handleSendMessage}
                onSetScreen={setCurrentScreen}
                appointments={appointments}
                patientProfile={patientProfile}
              />
            )}

            {currentScreen === "schedule-appointment" && (
              <ScheduleAppointment
                onAddAppointment={handleAddAppointment}
                prefilledApt={prefilledApt}
                onSetScreen={setCurrentScreen}
                appointments={appointments}
                onCancelAppointment={handleCancelAppointment}
                onRescheduleAppointment={handleRescheduleAppointment}
              />
            )}

            {currentScreen === "appointments-history" && (
              <AppointmentsHistory
                appointments={appointments}
                onResubmitBooking={handleResubmitBooking}
                onSetScreen={setCurrentScreen}
                doctors={doctorsList}
              />
            )}

            {currentScreen === "clinic-search" && (
              <ClinicSearch onSetScreen={setCurrentScreen} />
            )}

            {currentScreen === "fetching-transit" && (
              <FetchingTransit
                appointments={appointments}
                onSetScreen={setCurrentScreen}
                onUpdateAppointment={handleUpdateAppointment}
              />
            )}

            {currentScreen === "patient-registration" && (
              <PatientRegistration
                currentProfile={patientProfile}
                onUpdateProfile={handleUpdateProfile}
                onSetScreen={setCurrentScreen}
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
                onSetScreen={setCurrentScreen}
                onLogout={handleLogout}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

          </div>
        </main>
      </div>

      {/* Emergency SOS Floating Widget */}
      <EmergencySOS patientProfile={patientProfile} />
    </div>
  );
}
