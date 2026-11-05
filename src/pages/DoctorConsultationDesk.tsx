import React, { useState, useEffect, useMemo } from "react";
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  Volume2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Activity,
  LogOut,
  Sparkles,
  DoorOpen,
  Building,
  RefreshCw,
  Send,
  X,
  ShieldCheck,
  Check,
  User
} from "lucide-react";
import { getStaffAccountByEmail } from "../data/staffAccounts";

interface DoctorConsultationDeskProps {
  onLogout?: () => void;
  initialEmail?: string;
  initialName?: string;
}

interface CareyTriage {
  chiefComplaint: string;
  urgencyLevel: string;
  score: number;
  preliminaryDiagnosis: string;
  careyAssessment: string;
  recommendations: string[];
}

interface DoctorQueueItem {
  id: string | number;
  queueNumber: string;
  patientName: string;
  patientId?: string;
  timeSlot: string;
  date?: string;
  status: string;
  checkedIn: boolean;
  checkInTime: string;
  roomNumber: string;
  doctorName: string;
  specialty: string;
  symptoms: string;
  triage: CareyTriage;
  clinicalNotes?: string;
}

interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  roomNumber: string;
  department: string;
  hospital: string;
}

export default function DoctorConsultationDesk({
  onLogout,
  initialEmail,
  initialName
}: DoctorConsultationDeskProps) {
  const rawEmail = initialEmail || localStorage.getItem("lifelink_user_email") || localStorage.getItem("carepoint_user_email") || "";
  const existingStaff = rawEmail ? getStaffAccountByEmail(rawEmail) : null;
  const isDoctor = existingStaff?.role?.toLowerCase() === "doctor";
  const userEmail = isDoctor ? rawEmail : "dr_ainol_internal@pantaipenang.com";
  const staffProfile = useMemo(() => getStaffAccountByEmail(userEmail), [userEmail]);

  const [loading, setLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>({
    id: userEmail,
    name: staffProfile?.name || initialName || "Dr Ainol Shareha Binti Sahar",
    email: userEmail,
    roomNumber: staffProfile?.room_number || "Consultation Room 102",
    department: staffProfile?.department || "Internal Medicine",
    hospital: staffProfile?.hospital || "Pantai Hospital Penang (Main Hospital)"
  });

  const [queue, setQueue] = useState<DoctorQueueItem[]>([]);
  const [expandedPatientId, setExpandedPatientId] = useState<string | number | null>(null);

  // Calling chime & alert state
  const [callingId, setCallingId] = useState<string | number | null>(null);
  const [callAnnouncement, setCallAnnouncement] = useState<string | null>(null);

  // Complete consultation modal
  const [completeModalItem, setCompleteModalItem] = useState<DoctorQueueItem | null>(null);
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [clinicalNotesInput, setClinicalNotesInput] = useState("");
  const [rxInput, setRxInput] = useState("");
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  // Fetch my consultations (IDOR-safe: backend only returns current doctor's queue)
  const fetchDoctorQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/doctor/my-consultations", {
        headers: {
          "x-doctor-email": userEmail,
          "Authorization": `Bearer ${localStorage.getItem("carepoint_access_token") || ""}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue || []);
        if (data.doctorProfile) {
          setDoctorProfile(prev => ({
            ...prev,
            name: data.doctorProfile.name || prev.name,
            roomNumber: data.doctorProfile.roomNumber || prev.roomNumber,
            department: data.doctorProfile.department || prev.department,
            hospital: data.doctorProfile.hospital || prev.hospital
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load doctor consultations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorQueue();
    const timer = setInterval(fetchDoctorQueue, 5000);
    return () => clearInterval(timer);
  }, [userEmail]);

  // Play browser audio announcement chime
  const playCallAnnouncement = (ticket: string, patientName: string, room: string) => {
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const text = `Attention please. Ticket ${ticket}, ${patientName}, please proceed to ${room}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  };

  // Call Next Patient
  const handleCallPatient = async (item: DoctorQueueItem) => {
    setCallingId(item.id);
    const announcementText = `Paging ticket ${item.queueNumber} (${item.patientName}) to ${doctorProfile.roomNumber}`;
    setCallAnnouncement(announcementText);

    playCallAnnouncement(item.queueNumber, item.patientName, doctorProfile.roomNumber);

    try {
      const res = await fetch("/api/doctor/call-patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-doctor-email": userEmail,
          "Authorization": `Bearer ${localStorage.getItem("carepoint_access_token") || ""}`
        },
        body: JSON.stringify({ appointmentId: item.id })
      });

      if (res.ok) {
        fetchDoctorQueue();
      }
    } catch (err) {
      console.error("Failed to call patient:", err);
    } finally {
      setCallingId(null);
      setTimeout(() => setCallAnnouncement(null), 6000);
    }
  };

  // Open Complete Consultation Modal
  const openCompleteModal = (item: DoctorQueueItem) => {
    setCompleteModalItem(item);
    setDiagnosisInput(item.triage?.preliminaryDiagnosis || "");
    setClinicalNotesInput(item.clinicalNotes || "");
    setRxInput("");
  };

  // Submit Complete Consultation
  const handleSubmitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalItem) return;

    setIsSubmittingComplete(true);
    try {
      const res = await fetch("/api/doctor/complete-consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-doctor-email": userEmail,
          "Authorization": `Bearer ${localStorage.getItem("carepoint_access_token") || ""}`
        },
        body: JSON.stringify({
          appointmentId: completeModalItem.id,
          diagnosis: diagnosisInput,
          clinicalNotes: clinicalNotesInput,
          prescription: rxInput
        })
      });

      if (res.ok) {
        setCompleteModalItem(null);
        fetchDoctorQueue();
      }
    } catch (err) {
      console.error("Failed to complete consultation:", err);
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  // Statistics
  const waitingList = queue.filter(a => a.status === "CHECKED_IN" || a.status === "Checked In" || a.status === "Upcoming");
  const inConsultationList = queue.filter(a => a.status === "IN_CONSULTATION" || a.status === "In Consultation");
  const completedList = queue.filter(a => a.status === "COMPLETED" || a.status === "Completed" || a.status === "Done");

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* ── Top Header with Locked Doctor & Room Banner (NO DOCTOR SWITCHER) ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left locked identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">PantaiCare Consultation Desk</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Physician Locked
                  </span>
                </div>
                {/* 🔒 Locked doctor and room number header requested */}
                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <span className="font-extrabold text-slate-900">
                    Suite: {doctorProfile.roomNumber}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-medium">
                    {doctorProfile.department} ({doctorProfile.hospital})
                  </span>
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchDoctorQueue}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Refresh Consultation Queue"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Intercom Banner Notification ── */}
      {callAnnouncement && (
        <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 shadow-md flex items-center justify-between animate-fade-in">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <Volume2 className="w-4 h-4 animate-bounce" />
            <span>[Intercom Queue Call]: {callAnnouncement}</span>
          </div>
          <button
            type="button"
            onClick={() => setCallAnnouncement(null)}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Doctor Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 block">Total Assigned Patients</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{queue.length}</div>
            <span className="text-[10px] text-slate-400">Assigned to your clinic today</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-amber-700 block">Waiting in Lobby</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{waitingList.length}</div>
            <span className="text-[10px] text-slate-400">Checked in & ready to call</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-blue-700 block">In Consultation</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{inConsultationList.length}</div>
            <span className="text-[10px] text-slate-400">Currently in your room</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700 block">Completed Today</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{completedList.length}</div>
            <span className="text-[10px] text-slate-400">Finished encounters</span>
          </div>
        </div>

        {/* ── Patient Consultation Cards List ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Assigned Outpatient Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                🔒 Clinician IDOR Protection: Exclusively presenting patients assigned to {doctorProfile.name}. Cross-physician record access is blocked.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-xl">
              Suite: {doctorProfile.roomNumber}
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-xs">
              <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold text-slate-700">No patients currently in your queue</p>
              <p className="text-xs text-slate-500 mt-1">
                Patients will appear here automatically as soon as frontdesk check-in verification is completed.
              </p>
            </div>
          ) : (
            queue.map((item) => {
              const isExpanded = expandedPatientId === item.id;
              const isChecked = item.checkedIn || item.status === "CHECKED_IN" || item.status === "Checked In";
              const isConsulting = item.status === "IN_CONSULTATION" || item.status === "In Consultation";
              const isCompleted = item.status === "COMPLETED" || item.status === "Completed" || item.status === "Done";

              // Urgency Badge
              const triageScore = item.triage?.score || 60;
              const urgencyLevel = item.triage?.urgencyLevel || "Standard";
              const isHighUrgency = triageScore >= 75;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition shadow-xs ${
                    isConsulting
                      ? "border-blue-400 ring-2 ring-blue-500/20"
                      : isCompleted
                      ? "border-slate-200 opacity-80"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Card Header row */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Ticket & Patient Info */}
                    <div className="flex items-start gap-4">
                      {/* Ticket badge */}
                      <div className="flex flex-col items-center justify-center bg-slate-900 text-white rounded-xl w-14 h-14 shrink-0 shadow-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket</span>
                        <span className="font-mono font-extrabold text-sm">{item.queueNumber}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">{item.patientName}</h3>
                          {isChecked && !isCompleted && !isConsulting && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Waiting
                            </span>
                          )}
                          {isConsulting && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                              <Activity className="w-3 h-3 text-blue-600" />
                              In Consultation
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              Consult Completed
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.timeSlot || "09:30 AM"}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                            {doctorProfile.roomNumber}
                          </span>
                          {item.checkInTime && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-700 font-semibold">{item.checkInTime} Checked In</span>
                            </>
                          )}
                        </div>

                        {/* Carey AI preliminary highlight */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-bold">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Carey AI Score: {triageScore} pts
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              isHighUrgency
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-sky-50 text-sky-800 border border-sky-200"
                            }`}
                          >
                            {urgencyLevel}
                          </span>
                          <span className="text-xs text-slate-600 truncate max-w-xs sm:max-w-md">
                            Chief Complaint: {item.triage?.chiefComplaint || item.symptoms}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Toggle Carey AI report */}
                      <button
                        type="button"
                        onClick={() => setExpandedPatientId(isExpanded ? null : item.id)}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Carey AI Triage Report</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Call Next Button */}
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleCallPatient(item)}
                          disabled={callingId === item.id}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{callingId === item.id ? "Paging..." : "Call Patient (Next)"}</span>
                        </button>
                      )}

                      {/* Complete Consultation Button or View Notes if already completed */}
                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => openCompleteModal(item)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete Consultation</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openCompleteModal(item)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Encounter Notes</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Expanded Carey AI Triage Panel ── */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl animate-fade-in space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                              Carey AI Clinical Triage Assessment
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Dual-stage Hybrid AI (Random Forest Classifier & Clinical Rules)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">Triage Severity Score:</span>
                          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                            {triageScore} / 100
                          </span>
                        </div>
                      </div>

                      {/* Structured Findings Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Chief complaint & preliminary diagnosis */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Symptoms & Suspected Etiology
                          </span>
                          <div>
                            <span className="font-bold text-slate-700">Chief Complaint:</span>
                            <p className="text-slate-900 mt-0.5">{item.triage?.chiefComplaint || item.symptoms}</p>
                          </div>
                          <div className="pt-1 border-t border-slate-100">
                            <span className="font-bold text-slate-700">Preliminary Diagnosis:</span>
                            <p className="text-blue-900 font-bold mt-0.5">{item.triage?.preliminaryDiagnosis || "Pending physical examination"}</p>
                          </div>
                        </div>

                        {/* Carey AI Clinical Assessment */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            AI Clinical Assessment Details
                          </span>
                          <p className="text-slate-800 leading-relaxed">
                            {item.triage?.careyAssessment || "Triage score indicates stable vital indicators. Specialist physical examination and focused diagnostic workup recommended."}
                          </p>
                        </div>
                      </div>

                      {/* AI Recommendations */}
                      {item.triage?.recommendations && item.triage.recommendations.length > 0 && (
                        <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl p-3.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 block mb-1.5">
                            💡 Carey AI Diagnostic & Management Recommendations
                          </span>
                          <ul className="space-y-1 text-xs text-purple-950 font-medium">
                            {item.triage.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Consultation Notes already recorded */}
                      {item.clinicalNotes && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                          <span className="font-bold block mb-1">Documented Clinical Diagnosis & Treatment Plan:</span>
                          <pre className="whitespace-pre-wrap font-sans text-xs">{item.clinicalNotes}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ── Complete Consultation Modal ── */}
      {completeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Complete Consultation Record</h3>
                  <span className="text-xs text-slate-500">
                    Patient: {completeModalItem.patientName} ({completeModalItem.queueNumber})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompleteModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplete} className="py-4 space-y-4 text-xs">
              {/* Diagnosis input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  value={diagnosisInput}
                  onChange={(e) => setDiagnosisInput(e.target.value)}
                  placeholder="Enter clinical diagnosis..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Consultation summary notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Notes & Recommendations</label>
                <textarea
                  rows={3}
                  value={clinicalNotesInput}
                  onChange={(e) => setClinicalNotesInput(e.target.value)}
                  placeholder="Enter clinical notes & recommendations..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Prescription */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prescription / Rx</label>
                <input
                  type="text"
                  value={rxInput}
                  onChange={(e) => setRxInput(e.target.value)}
                  placeholder="Enter prescription details (e.g. medication name, dosage)..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComplete}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingComplete ? "Saving..." : "Confirm & Complete Consultation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
