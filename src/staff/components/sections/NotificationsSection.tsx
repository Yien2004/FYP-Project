import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Send 
} from 'lucide-react';

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

interface BroadcastLog {
  id: string;
  timestamp: string;
  group: string;
  message: string;
  status: 'Sent' | 'Failed' | 'Triage Queue';
}

export default function NotificationsSection() {
  const [targetGroup, setTargetGroup] = useState('All Registered Patients');
  const [template, setTemplate] = useState('Central clinic checkups schedule');
  const [customMessage, setCustomMessage] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Toggles for maintenance / emergency bypasses
  const [emergencyBypass, setEmergencyBypass] = useState(false);
  const [ambulanceDetour, setAmbulanceDetour] = useState(false);
  const [dischargeLock, setDischargeLock] = useState(false);
  const [facility, setFacility] = useState<any>(null);

  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [viewAllLogs, setViewAllLogs] = useState(false);

  // Triage drills interactive checklist
  const [drillChecks, setDrillChecks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("staff-drills-checklist");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const handleDrillToggle = (drillId: string) => {
    const next = { ...drillChecks, [drillId]: !drillChecks[drillId] };
    setDrillChecks(next);
    localStorage.setItem("staff-drills-checklist", JSON.stringify(next));
  };

  const fetchBroadcastLogs = React.useCallback(() => {
    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const currentClinic = localStorage.getItem("lifelink_user_clinic") || getClinicFromEmail(loggedEmail);

    fetch("/api/logs")
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list)) {
          const filteredList = list.filter((l: any) => {
            if (!l.message || !l.message.startsWith('[Broadcast]:')) return false;
            if (l.message.includes('[Hospital: ')) {
              return l.message.includes(`[Hospital: ${currentClinic}]`);
            }
            return !currentClinic || l.message.includes(currentClinic);
          });

          const mapped = filteredList.map((l: any, idx: number) => {
            const parts = l.message.replace('[Broadcast]:', '').trim();
            let group = 'All Registered Patients';
            let msg = parts;
            let hospital = currentClinic || 'System';
            if (parts.startsWith('(')) {
              const closingIdx = parts.indexOf(')');
              if (closingIdx > 0) {
                group = parts.substring(1, closingIdx);
                msg = parts.substring(closingIdx + 1).trim();
              }
            }
            if (msg.includes('[Hospital: ')) {
              const startIdx = msg.indexOf('[Hospital: ');
              const endIdx = msg.indexOf(']', startIdx);
              if (endIdx > startIdx) {
                hospital = msg.substring(startIdx + 11, endIdx);
                msg = (msg.substring(0, startIdx) + msg.substring(endIdx + 1)).trim();
              }
            }
            return {
              id: l.id || `bc-${idx}-${l.timestamp}`,
              timestamp: l.timestamp ? new Date(l.timestamp).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16),
              group,
              message: `[${hospital}] ${msg}`,
              status: 'Sent' as const
            };
          });
          setBroadcastLogs(mapped);
        }
      })
      .catch(err => console.warn("Failed to fetch broadcast logs", err));
  }, []);

  React.useEffect(() => {
    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const currentClinic = getClinicFromEmail(loggedEmail);

    // Load active patients with appointments
    Promise.all([
      fetch("/api/patients").then(res => res.json()).catch(() => []),
      fetch("/api/appointments").then(res => res.json()).catch(() => [])
    ])
    .then(([patientsList, appointmentsList]) => {
      if (Array.isArray(patientsList)) {
        let filtered = patientsList;
        if (currentClinic && Array.isArray(appointmentsList)) {
          filtered = patientsList.filter((p: any) => 
            appointmentsList.some((ap: any) => 
              (ap.patientId === p.id || ap.patientId === p.dbId || ap.patientName.toLowerCase() === p.name.toLowerCase() || ap.patientId === p.email) &&
              (ap.clinic || ap.hospital || '').toLowerCase() === currentClinic.toLowerCase()
            )
          );
        }
        setPatients(filtered);
      }
    })
    .catch(err => console.warn("Failed to load patients in NotificationsSection", err));

    // Load facility toggles
    fetch("/api/facilities")
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list) && currentClinic) {
          const matchedFac = list.find((f: any) => f.name.toLowerCase() === currentClinic.toLowerCase());
          if (matchedFac) {
            setFacility(matchedFac);
            setEmergencyBypass(!!matchedFac.emergencyBypass);
            setAmbulanceDetour(!!matchedFac.ambulanceDetour);
            setDischargeLock(!!matchedFac.dischargeLock);
          }
        }
      })
      .catch(err => console.warn("Failed to load facility toggles", err));

    // Load broadcast history logs
    fetchBroadcastLogs();
  }, [fetchBroadcastLogs]);

  const handleToggle = async (field: 'emergencyBypass' | 'ambulanceDetour' | 'dischargeLock', currentVal: boolean) => {
    if (!facility) {
      alert("No matched facility associated with this staff account to configure overrides.");
      return;
    }
    const nextVal = !currentVal;
    
    // Optimistic UI update
    if (field === 'emergencyBypass') setEmergencyBypass(nextVal);
    if (field === 'ambulanceDetour') setAmbulanceDetour(nextVal);
    if (field === 'dischargeLock') setDischargeLock(nextVal);
    
    try {
      const res = await fetch(`/api/facilities/${facility.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: nextVal
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setFacility(updated);
        
        // Push configuration changes to system logs
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `[Facility Override] ${facility.name} configured override toggle: ${field} to ${nextVal}`,
            level: "warning"
          })
        });
      }
    } catch (err) {
      console.error("Failed to update facility toggle", err);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomMessage(e.target.value);
  };

  const handleApplyTemplate = (v: string) => {
    setTemplate(v);
    if (v === 'Central clinic checkups schedule') {
      setCustomMessage("Notice: This is a routine alert to remind clinic patients that schedule matrix checks for tomorrow are now active. Review your designated hours inside patient files.");
    } else if (v === 'Emergency cardiac surge warning') {
      setCustomMessage("Alert: West ICU units are experiencing high surge capacity indexes. General cardiology patients are requested to verify their clinic triage coordinates with central dispatch.");
    } else {
      setCustomMessage("System Notification: Regular server audit logs routine starting tonight at 11:45 PM. API latency drifts may manifest momentarily within active terminals.");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim() || isSending) return;
    setIsSending(true);

    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const currentClinic = localStorage.getItem("lifelink_user_clinic") || getClinicFromEmail(loggedEmail);

    try {
      if (targetGroup === 'Specific Patient...') {
        if (!selectedPatientEmail) {
          alert("Please select a target patient first.");
          setIsSending(false);
          return;
        }

        const pRes = await fetch(`/api/profile?email=${encodeURIComponent(selectedPatientEmail)}`);
        if (pRes.ok) {
          const profile = await pRes.json();
          const existingNotifs = profile.notifications || [];
          
          const newNotif = {
            id: `notif-staff-${Date.now()}`,
            title: `🔔 Alert from ${currentClinic || 'Clinic'}`,
            body: customMessage,
            time: "Just now",
            category: "general" as const,
            read: false
          };

          const updatedNotifs = [newNotif, ...existingNotifs];
          
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: selectedPatientEmail,
              notifications: updatedNotifs
            })
          });

          // Post the broadcast log to system audit logs
          await fetch("/api/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: `[Broadcast]: (Patient: ${profile.fullName || selectedPatientEmail}) [Hospital: ${currentClinic}] ${customMessage}`,
              level: "info"
            })
          });
        }
      } else if (targetGroup === 'All Registered Patients') {
        const newNotif = {
          id: `notif-staff-${Date.now()}`,
          title: `🔔 Alert from ${currentClinic || 'Clinic'}`,
          body: customMessage,
          time: "Just now",
          category: "general" as const,
          read: false
        };

        await Promise.all(
          patients.map(async (p) => {
            try {
              const pRes = await fetch(`/api/profile?email=${encodeURIComponent(p.email)}`);
              if (pRes.ok) {
                const profile = await pRes.json();
                const existingNotifs = profile.notifications || [];
                const updatedNotifs = [newNotif, ...existingNotifs];
                await fetch("/api/profile", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: p.email,
                    notifications: updatedNotifs
                  })
                });
              }
            } catch (err) {
              console.warn(`Failed to send broadcast to ${p.email}`, err);
            }
          })
        );

        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `[Broadcast]: (All Registered Patients) [Hospital: ${currentClinic}] ${customMessage}`,
            level: "info"
          })
        });
      } else {
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `[Broadcast]: (${targetGroup}) [Hospital: ${currentClinic}] ${customMessage}`,
            level: "info"
          })
        });
      }

      setCustomMessage('');
      setSelectedPatientEmail('');
      fetchBroadcastLogs();
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 4000);
    } catch (err) {
      console.error("Failed to dispatch broadcast", err);
    } finally {
      setIsSending(false);
    }
  };

  const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
  const currentClinic = localStorage.getItem("lifelink_user_clinic") || getClinicFromEmail(loggedEmail);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-neutral-800 animate-fadeIn">
      
      {/* Broadcast Center Composer */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-neutral-900 tracking-tight">
              Staff Broadcast Composer
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Dispatch clinic notices, schedule updates, or appointment advisories across target patient channels.
            </p>
          </div>
          {currentClinic && (
            <span className="self-start sm:self-auto text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full">
              {currentClinic}
            </span>
          )}
        </div>

        {showSuccessAlert && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 px-4 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Broadcast dispatched successfully! Notification delivered to target recipients.</span>
          </div>
        )}

        {/* Quick Notice Template Chips */}
        <div>
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
            Quick Notice Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "Appointment Reminder",
                text: "Reminder: Please arrive at the clinic reception counter at least 10 minutes prior to your scheduled consultation time."
              },
              {
                label: "Clinic Holiday / Closure",
                text: "Notice: Outpatient consultation services will be closed on upcoming public holidays. Regular consultations will resume on the next operating day."
              },
              {
                label: "Doctor Schedule Adjustment",
                text: "Advisory: Attending physician consultation slots have been updated. Patients are encouraged to review their booking status in My Appointments."
              },
              {
                label: "General Healthcare Advisory",
                text: "Notice: Regular outpatient consultation services are running normally today. Please present your booking queue number upon arrival."
              }
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setCustomMessage(preset.text)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition cursor-pointer text-slate-600"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recipient Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Target Channel Group</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:border-sky-500 h-10 transition font-medium"
              >
                <option>All Registered Patients</option>
                <option>Specific Patient...</option>
                <option>All Clinic Staff</option>
              </select>
            </div>

            {/* Target Patient selector if specific */}
            {targetGroup === 'Specific Patient...' ? (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Select Patient</label>
                <select
                  value={selectedPatientEmail}
                  onChange={(e) => setSelectedPatientEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:border-sky-500 h-10 transition font-medium"
                >
                  <option value="">-- Choose registered patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.email}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Delivery Channel</label>
                <div className="h-10 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Standard Patient System Broadcast
                </div>
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Broadcast Message</label>
              <span className="text-[10px] text-neutral-400 font-mono">{customMessage.length}/500 chars</span>
            </div>
            <textarea
              placeholder="Type your clinical announcement or notification memo here..."
              value={customMessage}
              onChange={handleMessageChange}
              maxLength={500}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-neutral-800 outline-none focus:bg-white focus:border-sky-500 placeholder:text-neutral-400 transition"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setCustomMessage('')}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition cursor-pointer font-medium"
            >
              Clear message
            </button>
            <button
              type="submit"
              disabled={isSending || !customMessage.trim()}
              className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              {isSending ? (
                <span>Dispatching...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast Logs History */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-base text-neutral-900">Broadcast Transmissions Logs</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Consolidated archive of public clinical announcements dispatched today.</p>
        </div>

        <div className="overflow-x-auto">
          {broadcastLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 font-mono">
              No active broadcast records in system log database.
            </div>
          ) : (
            <>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider pb-2">
                    <th className="pb-3 pl-1">Timestamp</th>
                    <th className="pb-3">Target Group</th>
                    <th className="pb-3">Broadcast memo summary</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(viewAllLogs ? broadcastLogs : broadcastLogs.slice(0, 4)).map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 pl-1 font-mono font-bold text-neutral-500 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 font-semibold text-neutral-800 whitespace-nowrap">{log.group}</td>
                      <td className="py-3 text-neutral-600 max-w-sm truncate" title={log.message}>{log.message}</td>
                      <td className="py-3 text-right">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {broadcastLogs.length > 4 && (
                <div className="mt-3 flex justify-center border-t border-neutral-100 pt-3">
                  <button
                    onClick={() => setViewAllLogs(!viewAllLogs)}
                    className="text-xs text-neutral-600 hover:text-neutral-900 font-bold flex items-center gap-1.5 cursor-pointer bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-3.5 py-1.5 rounded-xl transition-colors"
                  >
                    {viewAllLogs ? 'Show Less' : `View All History (${broadcastLogs.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
