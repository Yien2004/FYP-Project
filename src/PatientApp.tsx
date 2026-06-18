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

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

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

  // ── Fetch all patient data from Supabase via the Express API ─────────────

  const fetchPatientData = async (email: string) => {
    try {
      // 1. Profile
      const pRes = await apiFetch(`/api/profile?email=${encodeURIComponent(email)}`);
      if (!pRes.ok) return;
      const profile = await pRes.json();
      setPatientProfile(profile);
      if (profile.notifications && Array.isArray(profile.notifications)) {
        setNotifications(profile.notifications);
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
      const aRes = await apiFetch(`/api/appointments?patientId=${patientId}`);
      if (aRes.ok) {
        const apts: Appointment[] = await aRes.json();
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
        setMessages(prev => [...prev, {
          id:         saved.id,
          sender:     "user",
          senderName: patientProfile.fullName,
          content:    saved.content || saved.text,
          timestamp:  saved.timestamp
        }]);
      } else {
        setMessages(prev => [...prev, msg]);
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages(prev => [...prev, msg]);
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
    if (patientProfile) {
      await handleUpdateProfile({ ...patientProfile, notifications: updated });
    }
  };

  const handleMarkAllRead   = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    if (patientProfile) {
      await handleUpdateProfile({ ...patientProfile, notifications: updated });
    }
  };

  const handleDeleteNotif   = async (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    if (patientProfile) {
      await handleUpdateProfile({ ...patientProfile, notifications: updated });
    }
  };

  // ── Navigation helpers ────────────────────────────────────────────────────

  const handleResubmitBooking = (apt: Appointment) => {
    setPrefilledApt(apt);
    setCurrentScreen("schedule-appointment");
  };

  // ─── Authenticated layout ─────────────────────────────────────────────────
  return (
    <div id="carepoint-portal-layout" className="min-h-screen bg-slate-50 flex font-sans">

      {/* Left sidebar navigation */}
      <Sidebar
        currentScreen={currentScreen}
        onSetScreen={setCurrentScreen}
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
    </div>
  );
}
