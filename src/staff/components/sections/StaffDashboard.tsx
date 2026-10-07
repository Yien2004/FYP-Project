import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Zap, 
  Clock, 
  ChevronRight, 
  AlertTriangle, 
  Volume2, 
  Send, 
  CheckCircle2,
  BellRing,
  Play,
  Check,
  DoorOpen
} from 'lucide-react';
import { mockPatients } from '../../data/mockData';

function getClinicFromEmail(email: string): string {
  const cached = localStorage.getItem("lifelink_user_clinic");
  if (cached) return cached;

  const emailLower = (email || '').toLowerCase().trim();
  if (emailLower.includes('hospitalpulaupinang')) return 'Hospital Pulau Pinang';
  if (emailLower.includes('hospitalseberangjaya')) return 'Hospital Seberang Jaya';
  if (emailLower.includes('kkjalanperak')) return 'Klinik Kesihatan Jalan Perak';
  if (emailLower.includes('kkbayanbaru')) return 'Klinik Kesihatan Bayan Baru';
  if (emailLower.includes('hospitalbukitmertajam')) return 'Hospital Bukit Mertajam';
  if (emailLower.includes('pantaihospital')) return 'Pantai Hospital Penang';
  if (emailLower.includes('lamwahee')) return 'Hospital Lam Wah Ee';
  if (emailLower.includes('gleneagleshospital')) return 'Gleneagles Hospital Penang';
  if (emailLower.includes('islandhospital')) return 'Island Hospital';
  if (emailLower.includes('o2klinik')) return 'O2 Klinik';
  if (emailLower.includes('kliniksingapore')) return 'Klinik Singapore';
  if (emailLower.includes('poliklinikperdana')) return 'Poliklinik Perdana';
  if (emailLower.includes('penangadventisthospital')) return 'Penang Adventist Hospital';
  if (emailLower.includes('lohguanlye')) return 'Loh Guan Lye Specialists Centre';
  if (emailLower.includes('kpjpenang')) return 'KPJ Penang Specialist Hospital';
  return '';
}

interface StaffDashboardProps {
  onCallPatient: (name: string) => void;
}

export default function StaffDashboard({ onCallPatient }: StaffDashboardProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [presenceOverrides, setPresenceOverrides] = useState<{ [key: string]: boolean }>({});
  const [roomAssignments, setRoomAssignments] = useState<{ [key: string]: string }>({});

  const [activeCallText, setActiveCallText] = useState<string | null>(null);

  // Fetch appointments and logs on load, poll every 5 seconds
  const fetchData = () => {
    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const currentClinic = getClinicFromEmail(loggedEmail);

    // 1. Fetch appointments
    fetch("/api/appointments")
      .then(res => res.json())
      .then(data => {
        let mapped = data;
        if (currentClinic) {
          mapped = data.filter((ap: any) => (ap.clinic || ap.hospital || '').toLowerCase() === currentClinic.toLowerCase());
        }
        setAppointments(mapped);
      })
      .catch(err => {
        console.warn("Failed to load appointments", err);
      });

    // 2. Fetch logs to parse presence check-ins
    fetch("/api/logs")
      .then(res => res.json())
      .then(data => {
        setLogs(data);
      })
      .catch(err => {
        console.warn("Failed to fetch logs", err);
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dynamically compute today's date in local time (YYYY-MM-DD)
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Filter queue for active appointments (strictly today's appointments)
  const queueList = useMemo(() => {
    return appointments
      .filter(apt => 
        (apt.status === 'Approved' || apt.status === 'Upcoming' || apt.status === 'Rescheduled') &&
        apt.date === todayDateStr
      )
      .sort((a, b) => {
        const isAPriority = a.timeSlot === "Priority Triage";
        const isBPriority = b.timeSlot === "Priority Triage";
        if (isAPriority && !isBPriority) return -1;
        if (!isAPriority && isBPriority) return 1;

        // Sort by date ascending
        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) return dateA.localeCompare(dateB);

        // Sort by timeSlot ascending
        return (a.timeSlot || "").localeCompare(b.timeSlot || "");
      });
  }, [appointments]);

  // Determine if patient has checked in by matching logs
  const isPatientCheckedIn = (patientName: string, id: string) => {
    if (presenceOverrides[id] !== undefined) return presenceOverrides[id];
    const matchStr = `Patient ${patientName} confirmed presence`.toLowerCase();
    const matchStrAlt = `${patientName} confirmed presence`.toLowerCase();
    return logs.some(log => {
      const msg = (log.message || "").toLowerCase();
      return msg.includes(matchStr) || msg.includes(matchStrAlt);
    });
  };

  // Play double-tone chime sound
  const playLobbyChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
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
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
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

  // Generate room numbers dynamically based on logged-in clinic
  const roomOptions = useMemo(() => {
    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const currentClinic = getClinicFromEmail(loggedEmail) || 'General';
    let prefix = currentClinic;
    if (prefix.toLowerCase().includes("hospital")) {
      prefix = prefix.split(" Hospital")[0];
    } else if (prefix.toLowerCase().includes("klinik kesihatan")) {
      prefix = "KK " + prefix.split("Klinik Kesihatan ")[1];
    } else if (prefix.toLowerCase().includes("klinik")) {
      prefix = prefix.split(" Klinik")[0];
    }
    
    return [
      { value: "Room 102", label: `${prefix} Room 102` },
      { value: "Room 103", label: `${prefix} Room 103` },
      { value: "Room 104", label: `${prefix} Room 104` },
      { value: "Room 201", label: `${prefix} Room 201` },
      { value: "Room 202", label: `${prefix} Room 202` },
    ];
  }, []);

  const handleCall = (name: string, room: string) => {
    playLobbyChime();
    const formattedRoom = roomOptions.find(o => o.value === room)?.label || room;
    onCallPatient(`${name} (Proceed to ${formattedRoom || "Lobby Desk"})`);
    setActiveCallText(`Intercom Alert: Please paging patient ${name} to ${formattedRoom || "Triage Desk 4"}`);
    setTimeout(() => {
      setActiveCallText(null);
    }, 4500);
  };

  const handleManualCheckIn = (id: string) => {
    setPresenceOverrides(prev => ({ ...prev, [id]: true }));
  };

  const handleMarkAbsent = (id: string) => {
    setPresenceOverrides(prev => ({ ...prev, [id]: false }));
  };

  const handleRoomSelect = (id: string, room: string) => {
    setRoomAssignments(prev => ({ ...prev, [id]: room }));
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalToday = queueList.length;
    const checkedInCount = queueList.filter(q => isPatientCheckedIn(q.patientName, q.id)).length;
    const completedCount = queueList.filter(q => q.status === 'Completed').length;
    const waitingCount = queueList.filter(q => isPatientCheckedIn(q.patientName, q.id) && q.status !== 'Completed').length;
    const avgWaitTime = waitingCount > 0 ? `${waitingCount * 12}m` : '0m';

    return [
      { label: 'Today Arrivals', value: `${totalToday}`, change: 'Appointments scheduled', icon: Users, color: 'text-sky-600 bg-sky-50 border-sky-100' },
      { label: 'Confirmed Present', value: `${checkedInCount}`, change: 'Waiting in lobby', icon: DoorOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      { label: 'Completed Consults', value: `${completedCount}`, change: 'Finished today', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50 border-blue-100' },
      { label: 'Lobby Wait-Time', value: avgWaitTime, change: 'Current average', icon: Clock, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    ];
  }, [queueList, logs, presenceOverrides]);

  return (
    <div className="space-y-6 text-neutral-800">
      
      {/* Active Call Alert Overlay */}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</span>
                <h3 className="text-2xl font-black text-neutral-900 mt-0.5">{stat.value}</h3>
                <span className="text-[10px] text-neutral-500 block font-medium">{stat.change}</span>
              </div>
              <div className={`p-3.5 rounded-xl border ${stat.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content: Lobby Queue & Operational Sequence */}
      <div className="space-y-6">
          
        {/* Primary Queue Board */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-4 mb-5 gap-3">
            <div>
              <h3 className="font-extrabold text-base text-neutral-900 tracking-tight">Lobby Queue Dashboard</h3>
              <p className="text-xs text-neutral-500 mt-0.5 font-sans">Monitor patient portal check-in actions, assign rooms, and call tickets.</p>
            </div>
            <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full uppercase tracking-widest">
              Active Board
            </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider pb-2">
                    <th className="pb-3 pl-2">Patient Details</th>
                    <th className="pb-3">Appt Slot</th>
                    <th className="pb-3 text-center">Presence Status</th>
                    <th className="pb-3">Consultation Room</th>
                    <th className="pb-3 text-right">Intercom Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  {queueList.map((apt) => {
                    const initials = apt.patientName.split(' ').map((n: string) => n[0]).join('');
                    const isChecked = isPatientCheckedIn(apt.patientName, apt.id);
                    const room = roomAssignments[apt.id] || "";

                    return (
                      <tr key={apt.id} className="hover:bg-neutral-50/50 transition-colors">
                        {/* Patient */}
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 text-xs font-black flex items-center justify-center border border-teal-100 shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900 text-xs">{apt.patientName}</p>
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{apt.doctorName} • {apt.specialty}</p>
                            </div>
                          </div>
                        </td>
                        {/* Time slot */}
                        <td className="py-3.5 font-mono font-bold text-neutral-750">
                          <span className={apt.timeSlot === "Priority Triage" ? "text-red-600 font-black animate-pulse" : ""}>
                            {apt.timeSlot}
                          </span>
                          <span className="text-[10px] text-neutral-400 block font-sans font-medium mt-0.5">{apt.date}</span>
                        </td>
                        {/* Checked-in status */}
                        <td className="py-3.5 text-center">
                          {isChecked ? (
                            <button
                              onClick={() => handleMarkAbsent(apt.id)}
                              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition"
                              title="Click to toggle to Not Present / Absent"
                            >
                              <Check className="w-3 h-3" /> Present (Toggle Absent)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleManualCheckIn(apt.id)}
                              className="text-[9px] bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-850 border border-amber-250/55 px-2.5 py-1 rounded-full transition cursor-pointer font-bold uppercase tracking-wider"
                              title="Click to check-in manually"
                            >
                              Absent (Check In)
                            </button>
                          )}
                        </td>
                        {/* Room Assignment */}
                        <td className="py-3.5">
                          <select
                            value={room}
                            onChange={(e) => handleRoomSelect(apt.id, e.target.value)}
                            className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 focus:bg-white text-xs outline-none focus:ring-1 focus:ring-neutral-350 cursor-pointer font-sans"
                          >
                            <option value="">-- Assign Room --</option>
                            {roomOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        {/* Call action */}
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleCall(apt.patientName, room)}
                            disabled={!isChecked}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] inline-flex items-center gap-1.5 ${
                              isChecked 
                                ? 'bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]' 
                                : 'bg-neutral-100 border border-neutral-200 text-neutral-400 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            Call / Recall Lobby
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  );
}
