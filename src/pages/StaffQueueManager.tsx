import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  DoorOpen,
  AlertTriangle,
  LogOut,
  Sparkles,
  Stethoscope,
  Building,
  RefreshCw,
  X,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { getStaffAccountByEmail } from "../data/staffAccounts";

interface StaffQueueManagerProps {
  onLogout?: () => void;
  initialEmail?: string;
  initialName?: string;
}

interface DoctorTab {
  name: string;
  email: string;
  roomNumber: string;
  department: string;
  waitingCount: number;
}

interface QueueItem {
  id: string | number;
  queueNumber: string;
  patientName: string;
  timeSlot: string;
  date?: string;
  doctorName: string;
  specialty: string;
  roomNumber: string;
  status: string;
  checkedIn: boolean;
  checkInTime: string;
}

interface CheckinModalData {
  isOpen: boolean;
  isSuccess: boolean;
  patientName: string;
  doctorName: string;
  assignedRoom: string;
  queueNumber: string;
  message?: string;
  checkInTime?: string;
}

export default function StaffQueueManager({ onLogout, initialEmail, initialName }: StaffQueueManagerProps) {
  const userEmail = initialEmail || localStorage.getItem("lifelink_user_email") || localStorage.getItem("carepoint_user_email") || "pantaicentre_frontdesk@gmail.com";
  const staffProfile = useMemo(() => getStaffAccountByEmail(userEmail), [userEmail]);

  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorTab[]>([]);
  const [terminalInfo, setTerminalInfo] = useState({
    facilityName: staffProfile?.hospital || "Pantai Specialist Centre",
    department: staffProfile?.department || "Orthopaedic Surgery",
    roomNumber: staffProfile?.room_number || "Front Counter",
    staffName: staffProfile?.name || initialName || "Frontdesk Staff"
  });

  // Selected filter: "ALL" or doctor email / name
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>("ALL");

  // Check-in input & modal
  const [ticketInput, setTicketInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [modalData, setModalData] = useState<CheckinModalData>({
    isOpen: false,
    isSuccess: false,
    patientName: "",
    doctorName: "",
    assignedRoom: "",
    queueNumber: ""
  });

  // Fetch department queue
  const fetchQueueData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/queue/department-queue", {
        headers: {
          "x-staff-email": userEmail,
          "Authorization": `Bearer ${localStorage.getItem("carepoint_access_token") || ""}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue || []);
        if (data.doctors && Array.isArray(data.doctors)) {
          setDoctors(data.doctors);
        }
        if (data.terminal) {
          setTerminalInfo({
            facilityName: data.terminal.facilityName || terminalInfo.facilityName,
            department: data.terminal.department || terminalInfo.department,
            roomNumber: data.terminal.roomNumber || terminalInfo.roomNumber,
            staffName: data.terminal.staffName || terminalInfo.staffName
          });
        }
      }
    } catch (err) {
      console.error("Failed to load department queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const timer = setInterval(fetchQueueData, 5000);
    return () => clearInterval(timer);
  }, [userEmail]);

  // Handle Verify & Check-in
  const handleVerifyCheckin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTicket = ticketInput.trim();
    if (!cleanTicket) return;

    setIsVerifying(true);
    try {
      const res = await fetch("/api/queue/verify-checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-staff-email": userEmail,
          "Authorization": `Bearer ${localStorage.getItem("carepoint_access_token") || ""}`
        },
        body: JSON.stringify({ queueNumber: cleanTicket })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setModalData({
          isOpen: true,
          isSuccess: true,
          patientName: data.patientName || "Patient",
          doctorName: data.doctorName || "Assigned Specialist",
          assignedRoom: data.assignedRoom || "Consultation Room",
          queueNumber: data.queueNumber || cleanTicket,
          checkInTime: data.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setTicketInput("");
        fetchQueueData();
      } else {
        setModalData({
          isOpen: true,
          isSuccess: false,
          patientName: data.details?.patientName || "Verification Failed",
          doctorName: data.details?.appointmentSpecialty || "",
          assignedRoom: "",
          queueNumber: cleanTicket,
          message: data.message || "Unable to verify queue ticket. Please check department routing."
        });
      }
    } catch (err: any) {
      setModalData({
        isOpen: true,
        isSuccess: false,
        patientName: "Connection Error",
        doctorName: "",
        assignedRoom: "",
        queueNumber: cleanTicket,
        message: "Failed to connect to triage check-in service."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    if (selectedDoctorFilter === "ALL") return queue;
    return queue.filter(item => {
      const doc = doctors.find(d => d.email === selectedDoctorFilter || d.name === selectedDoctorFilter);
      if (!doc) return true;
      return (
        item.doctorName.toLowerCase().includes(doc.name.toLowerCase()) ||
        doc.name.toLowerCase().includes(item.doctorName.toLowerCase()) ||
        item.roomNumber === doc.roomNumber
      );
    });
  }, [queue, selectedDoctorFilter, doctors]);

  // Overall waiting count
  const allWaitingCount = useMemo(() => {
    return queue.filter(item => item.status === "CHECKED_IN" || item.status === "Checked In" || item.status === "Upcoming").length;
  }, [queue]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* ── Top Header with Locked Terminal Status Bar ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left branding & locked terminal status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">PantaiCare Frontdesk</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Staff Portal
                  </span>
                </div>
                {/* 🔒 Locked status bar specified in requirements */}
                <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800">Terminal: {terminalInfo.department} Reception Desk</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">{terminalInfo.facilityName} ({terminalInfo.roomNumber})</span>
                </div>
              </div>
            </div>

            {/* Right actions: Refresh & Logout */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchQueueData}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Refresh Queue"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-600" : ""}`} />
              </button>

              <div className="hidden sm:flex flex-col text-right pr-2">
                <span className="text-xs font-bold text-slate-800">{terminalInfo.staffName}</span>
                <span className="text-[10px] text-slate-500 font-medium">Frontdesk Receptionist</span>
              </div>

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

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Verification Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Outpatient Arrival Check-In Verification</span>
                <span className="text-xs font-medium text-slate-500">(Frontdesk Terminal)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter the patient queue voucher number (e.g. <code className="font-mono font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">#Q-101</code>) to verify clinic assignment and dispatch to consultation suite.
              </p>
            </div>

            {/* Check-in input form */}
            <form onSubmit={handleVerifyCheckin} className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="e.g. #Q-101"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying || !ticketInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVerifying ? "Verifying..." : "Verify & Admit"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── Doctor Filter Tabs with Waiting Counts ── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {/* Tab: All Doctors */}
          <button
            type="button"
            onClick={() => setSelectedDoctorFilter("ALL")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedDoctorFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>All Doctors</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedDoctorFilter === "ALL"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {allWaitingCount}
            </span>
          </button>

          {/* Dynamic doctor tabs */}
          {doctors.map((doc) => {
            const isSelected = selectedDoctorFilter === doc.email || selectedDoctorFilter === doc.name;
            const shortRoom = doc.roomNumber.replace("Consultation Room", "Room");
            const shortName = doc.name.replace(/^(Dr\.|Dato' Dr\.)\s*/, "");

            return (
              <button
                key={doc.email}
                type="button"
                onClick={() => setSelectedDoctorFilter(doc.email)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 opacity-70" />
                <span>{shortRoom}: Dr. {shortName}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected
                      ? "bg-white text-amber-900"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {doc.waitingCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Queue Table (Need-to-Know Privacy Enforced) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Department Outpatient Queue</h3>
              <p className="text-[11px] text-slate-500">
                🔒 Need-to-Know Privacy Active: Frontdesk displays queue ticket, assigned suite, and check-in status. Detailed clinical records remain strictly isolated.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total {filteredQueue.length} Outpatients
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Queue Ticket</th>
                  <th className="py-3.5 px-6">Patient Name</th>
                  <th className="py-3.5 px-6">Appt Slot</th>
                  <th className="py-3.5 px-6">Specialist Doctor</th>
                  <th className="py-3.5 px-6">Assigned Suite</th>
                  <th className="py-3.5 px-6">Queue Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-semibold">No patients currently in this queue</p>
                      <p className="text-[11px]">When a patient arrives, enter their ticket above to process arrival check-in.</p>
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((item) => {
                    const isChecked = item.checkedIn || item.status === "CHECKED_IN" || item.status === "Checked In";
                    const isConsulting = item.status === "IN_CONSULTATION" || item.status === "In Consultation";
                    const isCompleted = item.status === "COMPLETED" || item.status === "Completed" || item.status === "Done";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        {/* Queue Number */}
                        <td className="py-4 px-6">
                          <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                            {item.queueNumber}
                          </span>
                        </td>

                        {/* Patient Name */}
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {item.patientName}
                        </td>

                        {/* Appt Slot */}
                        <td className="py-4 px-6 font-medium text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.timeSlot || "09:30 AM"}</span>
                          </div>
                        </td>

                        {/* Doctor Name */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">{item.doctorName}</div>
                          <div className="text-[10px] text-slate-500">{item.specialty}</div>
                        </td>

                        {/* Assigned Room */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-extrabold text-xs">
                            <DoorOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span>{item.roomNumber || "Consultation Room"}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                              <span>Consult Completed</span>
                            </span>
                          ) : isConsulting ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold animate-pulse">
                              <span>In Consultation</span>
                            </span>
                          ) : isChecked ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Checked In (Waiting)</span>
                              </span>
                              {item.checkInTime && (
                                <div className="text-[10px] text-slate-400 pl-1">{item.checkInTime} Checked In</div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                              <span>Pending Check-In</span>
                            </span>
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
      </main>

      {/* ── Check-in Result Modal (Highlight Assigned Room) ── */}
      {modalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {modalData.isSuccess ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <h3 className="text-base font-extrabold text-slate-900">
                  {modalData.isSuccess ? "Check-In Verification Successful" : "Check-In Failed / Clinic Mismatch"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalData(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalData.isSuccess ? (
              <div className="py-4 space-y-4">
                {/* 🎯 Primary Routing Guidance Callout Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-md text-center">
                  <span className="text-xs uppercase tracking-wider text-emerald-100 font-bold block mb-1">
                    Suite Routing Guidance
                  </span>
                  <div className="text-2xl font-black tracking-tight mb-1">
                    Please direct patient to: <span className="underline decoration-white/40">{modalData.assignedRoom}</span>
                  </div>
                  <p className="text-xs text-emerald-100">
                    Assigned Doctor: {modalData.doctorName}
                  </p>
                </div>

                {/* Patient details summary */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Patient Name:</span>
                    <span className="font-bold text-slate-900">{modalData.patientName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Queue Ticket:</span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {modalData.queueNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Check-In Time:</span>
                    <span className="font-medium text-slate-700">{modalData.checkInTime}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-3">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800">
                  <p className="font-bold mb-1">Error Reason:</p>
                  <p className="leading-relaxed">{modalData.message}</p>
                </div>
                <p className="text-[11px] text-slate-500">
                  Note: If the patient is booked for another department or facility, please guide them to their designated check-in reception desk.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalData(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
