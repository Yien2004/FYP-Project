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
  HelpCircle,
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

  const [replies, setReplies] = useState<{ [key: string]: string }>({});
  const [repliedAlarms, setRepliedAlarms] = useState<{ [key: string]: string }>({});

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

  const handleMessageSend = (id: string, text: string) => {
    if (!text.trim()) return;
    setRepliedAlarms(prev => ({ ...prev, [id]: text }));
    setReplies(prev => ({ ...prev, [id]: '' }));

    // Log response action to backend
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Triage Desk Action: Replied to alarm [${id}]: "${text}"`,
        level: "info"
      })
    }).catch(err => console.warn("Failed to log reply action", err));
  };

  // Map dynamic vital/clinical alarms from real system logs
  const dynamicAlarms = useMemo(() => {
    const alarmLogs = logs.filter(log => {
      const msg = (log.message || "").toLowerCase();
      return log.level === "error" || log.level === "warn" || msg.includes("critical") || msg.includes("alarm") || msg.includes("alert");
    });
    
    return alarmLogs.map((log, idx) => {
      const msgText = log.message || "";
      let sender = "Clinical Telemetry System";
      let role = "Automated Alert Monitor";
      let team = "Vitals Triage";
      let text = msgText;
      let urgent = true;
      
      if (msgText.includes("CRITICAL ALARM: ")) {
        text = msgText.replace("CRITICAL ALARM: ", "");
        sender = "Central Vitals Monitor";
      } else if (msgText.includes("Queue Ticket Check-in:")) {
        sender = "Reception Counter";
        role = "Lobby Desk Monitor";
        team = "Reception";
        urgent = false;
      }
      
      const alarmId = log.id || `alarm-${idx}`;

      return {
        id: alarmId,
        sender,
        team,
        role,
        text,
        urgent,
        replied: !!repliedAlarms[alarmId],
        replyText: repliedAlarms[alarmId] || '',
        timestamp: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Just Now'
      };
    });
  }, [logs, repliedAlarms]);

  const messages = dynamicAlarms;

  // Filter appointments for timeline (strictly today's appointments)
  const timelineAppointments = useMemo(() => {
    const sorted = appointments
      .filter(apt => apt.date === todayDateStr)
      .sort((a, b) => {
        if (a.status === 'Completed' && b.status !== 'Completed') return -1;
        if (a.status !== 'Completed' && b.status === 'Completed') return 1;
        
        // Sort by date ascending
        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return 0;
      });
    return sorted.slice(0, 5);
  }, [appointments, todayDateStr]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalToday = queueList.length;
    const checkedInCount = queueList.filter(q => isPatientCheckedIn(q.patientName, q.id)).length;
    const criticalCount = dynamicAlarms.filter(a => a.urgent && !a.replied).length;
    const waitingCount = queueList.filter(q => isPatientCheckedIn(q.patientName, q.id) && q.status !== 'Completed').length;
    const avgWaitTime = waitingCount > 0 ? `${waitingCount * 12}m` : '0m';

    return [
      { label: 'Today Arrivals', value: `${totalToday}`, change: 'Appointments scheduled', icon: Users, color: 'text-teal-600 bg-teal-50 border-teal-100' },
      { label: 'Confirmed Present', value: `${checkedInCount}`, change: 'Waiting in lobby', icon: DoorOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      { label: 'Critical Alarms', value: `${criticalCount}`, change: 'Requires review', icon: Zap, color: 'text-red-500 bg-red-50 border-red-100' },
      { label: 'Lobby Wait-Time', value: avgWaitTime, change: 'Current average', icon: Clock, color: 'text-sky-600 bg-sky-50 border-sky-100' },
    ];
  }, [queueList, logs, presenceOverrides, dynamicAlarms]);

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

      {/* Main Grid: Queue & Lobby on left, Triage alarms on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lobby Queue & Checked-in Status */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Primary Queue Board */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-4 mb-5 gap-3">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900 tracking-tight">Lobby Queue Dashboard</h3>
                <p className="text-xs text-neutral-500 mt-0.5 font-sans">Monitor patient portal check-in actions, assign rooms, and call tickets.</p>
              </div>
              <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-widest">
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

          {/* Daily Sequence Timeline */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-5">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900 tracking-tight">Operational Sequence Timeline</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Chronological trace of completed, active, and upcoming clinical actions.</p>
              </div>
              <span className="text-[10px] bg-neutral-100 text-neutral-600 font-extrabold px-2.5 py-1 rounded-lg">Today</span>
            </div>

            <div className="relative border-l-2 border-neutral-100 ml-4 pl-6 space-y-6">
              {timelineAppointments.length === 0 ? (
                <div className="text-center py-6 text-neutral-400 italic">
                  No operational sequence activities recorded for today.
                </div>
              ) : (
                timelineAppointments.map((apt, idx) => {
                  const isCompleted = apt.status === 'Completed';
                  const isChecked = isPatientCheckedIn(apt.patientName, apt.id);
                  const isProgress = isChecked && !isCompleted;
                  
                  let badgeColor = "bg-neutral-105 text-neutral-600 border-neutral-200";
                  let badgeText = "Upcoming";
                  let boxClass = "bg-neutral-50/50 border border-dashed border-neutral-200/80";
                  let dotBg = "bg-neutral-200 text-neutral-600 border-neutral-300";

                  if (isCompleted) {
                    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    badgeText = "Complete";
                    boxClass = "bg-neutral-50 border border-neutral-200/60";
                    dotBg = "bg-emerald-100 text-emerald-700 border-emerald-500/20";
                  } else if (isProgress) {
                    badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                    badgeText = "In Progress";
                    boxClass = "bg-white border border-neutral-200 shadow-xs";
                    dotBg = "bg-amber-100 text-amber-700 border-amber-500/20";
                  }

                  return (
                    <div key={apt.id || idx} className="relative animate-fadeIn">
                      <span className={`absolute -left-[31px] top-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ring-4 ring-white border ${dotBg}`}>
                        {idx + 1}
                      </span>
                      <div className={`rounded-xl p-4 flex items-start justify-between ${boxClass}`}>
                        <div className="min-w-0 flex-1 pr-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {apt.timeSlot} - {badgeText}
                          </span>
                          <h4 className="font-bold text-sm text-neutral-900 mt-1.5 truncate">
                            {apt.patientName} • {apt.specialty}
                          </h4>
                          <p className="text-xs text-neutral-500 mt-1 leading-normal">
                            Consultation with {apt.doctorName}. {apt.symptoms ? `Reason: ${apt.symptoms}` : "Routine consultation."}
                          </p>
                        </div>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : isProgress ? (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-lg shrink-0">Active</span>
                        ) : (
                          <HelpCircle className="w-4 h-4 text-neutral-300 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Healthcare Alarms */}
        <div className="space-y-6">
          <div className="bg-neutral-900 text-neutral-100 rounded-2xl p-6 border border-neutral-800 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
              <span className="text-red-500"><BellRing className="w-48 h-48 animate-pulse" /></span>
            </div>

            <div className="flex items-center gap-2.5 mb-5 border-b border-neutral-850 pb-4">
              <div className="bg-red-500/10 p-2 rounded-xl text-red-400 border border-red-500/20 shrink-0">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-white">Healthcare Alarms Central</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">Urgent hospital/lab communications triage desk.</p>
              </div>
            </div>

            {/* Direct message feed */}
            <div className="space-y-5 relative z-10">
              {messages.map((message) => (
                <div key={message.id} className="bg-neutral-800/60 p-4 rounded-xl border border-neutral-700/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-2">
                        {message.sender}
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                      </h4>
                      <p className="text-[9px] text-neutral-400 uppercase font-mono tracking-wider">{message.role} • {message.team}</p>
                    </div>
                    {message.urgent && (
                      <span className="text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-mono tracking-wide">
                        Critical
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">{message.text}</p>

                  {/* If already replied */}
                  {message.replied ? (
                    <div className="bg-neutral-900 border border-dashed border-neutral-700 rounded-lg p-2.5 text-[11px] text-neutral-300 space-y-1">
                      <p className="font-bold text-neutral-400 uppercase tracking-widest text-[8px]">Replying from Triage Desk:</p>
                      <p className="italic">"{message.replyText}"</p>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Type urgent instructions..."
                        id={`it-reply-input-${message.id}`}
                        value={replies[message.id] || ''}
                        onChange={(e) => setReplies({ ...replies, [message.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleMessageSend(message.id, replies[message.id] || '');
                          }
                        }}
                        className="bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 flex-1 placeholder:text-neutral-500"
                      />
                      <button
                        onClick={() => handleMessageSend(message.id, replies[message.id] || '')}
                        id={`it-reply-btn-${message.id}`}
                        className="p-2 rounded-lg bg-red-650 hover:bg-red-650 text-white transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
