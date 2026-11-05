import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Megaphone, 
  Send, 
  Users, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  FileText, 
  UserX, 
  RefreshCw 
} from 'lucide-react';
import { getStaffAccountByEmail } from '../../../data/staffAccounts';

type TargetScope = 'ALL_PATIENTS' | 'DOCTOR_IMPACTED' | 'SPECIFIC_PATIENT';
type BroadcastType = 'DOCTOR_MC' | 'APPOINTMENT_REMINDER' | 'CLINIC_HOLIDAY' | 'GENERAL_ADVISORY' | 'CUSTOM';

interface BroadcastLog {
  id: string;
  sender_id: string;
  facility_id: number;
  broadcast_type: BroadcastType;
  target_scope: TargetScope;
  scope_description: string;
  target_doctor_name?: string;
  impacted_date?: string;
  target_patient_id?: string;
  title: string;
  message: string;
  recipient_count: number;
  created_at: string;
}

export default function NotificationsSection() {
  const [targetScope, setTargetScope] = useState<TargetScope>('ALL_PATIENTS');
  
  // Date state (for DOCTOR_IMPACTED cohort)
  const [impactedDate, setImpactedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  // Specific Patient state
  const [targetPatientEmail, setTargetPatientEmail] = useState<string>('');
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>('');

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  // Data
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([]);

  // States
  const [isSending, setIsSending] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Automatically determine the logged-in doctor / staff identity
  const loggedEmail = localStorage.getItem('lifelink_user_email') || 'staff@pantaicare.com';
  const staffAccount = getStaffAccountByEmail(loggedEmail);
  const currentDoctorName = staffAccount?.name || localStorage.getItem('lifelink_user_name') || 'Attending Physician';

  // Fetch initial appointments, patients, and broadcast logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/broadcast/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setBroadcastLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn('Failed to load broadcast logs', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();

    Promise.all([
      fetch('/api/appointments').then(r => r.json()).catch(() => []),
      fetch('/api/patients').then(r => r.json()).catch(() => [])
    ]).then(([apts, pts]) => {
      if (Array.isArray(apts)) setAllAppointments(apts);
      if (Array.isArray(pts)) setAllPatients(pts);
    });
  }, [fetchLogs]);

  // Calculate impacted appointments count for THIS logged-in doctor automatically
  const impactedAppointmentsCount = useMemo(() => {
    if (targetScope !== 'DOCTOR_IMPACTED') return 0;
    const docClean = (currentDoctorName || '').toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, '').trim();

    const matches = allAppointments.filter((apt: any) => {
      const aptDate = apt.date || '';
      const isDateMatch = !impactedDate || aptDate === impactedDate;
      if (!isDateMatch) return false;

      const aptDoc = (apt.doctorName || '').toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, '').trim();
      const aptDocEmail = (apt.doctorEmail || '').toLowerCase();
      const isDocMatch = (
        (docClean && (aptDoc.includes(docClean) || docClean.includes(aptDoc))) ||
        (aptDocEmail && aptDocEmail === loggedEmail.toLowerCase())
      );
      const isNotCancelled = apt.status !== 'CANCELLED' && apt.status !== 'Cancelled' && apt.status !== 'NO_SHOW';

      return isDocMatch && isNotCancelled;
    });

    return matches.length;
  }, [allAppointments, targetScope, currentDoctorName, loggedEmail, impactedDate]);

  // Dispatch Broadcast Notice
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter notification message content.' });
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    if (targetScope === 'SPECIFIC_PATIENT' && !targetPatientEmail) {
      setStatusMessage({ type: 'error', text: 'Please select a specific recipient patient.' });
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    const targetPatientObj = allPatients.find(p => p.email === targetPatientEmail);

    try {
      const res = await fetch('/api/broadcast/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-email': loggedEmail
        },
        body: JSON.stringify({
          broadcastType: targetScope === 'DOCTOR_IMPACTED' ? 'DOCTOR_MC' : 'GENERAL_ADVISORY',
          targetScope,
          targetDoctorName: currentDoctorName,
          impactedDate: targetScope === 'DOCTOR_IMPACTED' ? impactedDate : undefined,
          targetPatientId: targetScope === 'SPECIFIC_PATIENT' ? targetPatientEmail : undefined,
          targetPatientName: targetScope === 'SPECIFIC_PATIENT' ? (targetPatientObj?.name || targetPatientEmail) : undefined,
          title: title.trim(),
          message: message.trim(),
          senderEmail: loggedEmail,
          facilityId: staffAccount?.facility_id || 1
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ 
          type: 'success', 
          text: data.message || `Broadcast successfully dispatched to ${data.recipient_count || 0} recipients.` 
        });
        setMessage('');
        setTitle('');
        fetchLogs();
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to dispatch broadcast notice.' });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      console.error('Dispatch broadcast error:', err);
      setStatusMessage({ type: 'error', text: 'Network communication failure. Please verify server connection.' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const filteredPatientSuggestions = useMemo(() => {
    if (!patientSearchTerm.trim()) return [];
    const term = patientSearchTerm.toLowerCase();
    return allPatients.filter(p => 
      (p.name || '').toLowerCase().includes(term) ||
      (p.email || '').toLowerCase().includes(term) ||
      (p.phone || '').includes(term)
    ).slice(0, 5);
  }, [allPatients, patientSearchTerm]);

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Top Header */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-teal-600" />
            <span>Send Notification</span>
          </h2>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Floating Alert Feedback */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2.5 shadow-xs animate-fadeIn ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ── CARD 1: BROADCAST COMPOSER ── */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-6">
        
        {/* Target Audience Scope Selector */}
        <div className="space-y-3">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">
            Target Audience Scope
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setTargetScope('ALL_PATIENTS');
                if (title === '【Important】Doctor Schedule Adjustment Notice') {
                  setTitle('');
                }
              }}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                targetScope === 'ALL_PATIENTS'
                  ? 'bg-teal-50/60 border-teal-300 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-extrabold text-xs">All Registered Patients</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Public holidays, clinic notices, general health tips.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetScope('DOCTOR_IMPACTED');
                setTitle('【Important】Doctor Schedule Adjustment Notice');
                setMessage(
                  'Please be advised that your scheduled consultant will be on official leave (MC) on the specified date. Our front counter will reach out to facilitate priority rescheduling or transfer to an on-duty specialist.'
                );
              }}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                targetScope === 'DOCTOR_IMPACTED'
                  ? 'bg-rose-50/60 border-rose-300 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UserX className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-extrabold text-xs">My Booked Patients (Leave / MC)</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Patients booked with you on affected date.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetScope('SPECIFIC_PATIENT')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                targetScope === 'SPECIFIC_PATIENT'
                  ? 'bg-sky-50/60 border-sky-300 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4 text-sky-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-extrabold text-xs">Specific Individual Patient</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Direct notification to a selected patient.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Date Selector for DOCTOR_IMPACTED (Automatically uses logged-in doctor, no doctor dropdown) */}
        {targetScope === 'DOCTOR_IMPACTED' && (
          <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-rose-600" />
                <span>Select Affected Date for {currentDoctorName}</span>
              </span>
              <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-mono">
                {impactedAppointmentsCount} {impactedAppointmentsCount === 1 ? 'Patient' : 'Patients'} Booked
              </span>
            </div>

            <div className="max-w-xs">
              <input
                type="date"
                value={impactedDate}
                onChange={(e) => setImpactedDate(e.target.value)}
                className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-rose-400 font-mono h-10"
              />
            </div>

            <p className="text-[11px] text-rose-700 font-medium">
              Notice will strictly be sent to patients who booked appointments with <strong>{currentDoctorName}</strong> on <strong>{impactedDate}</strong>.
            </p>
          </div>
        )}

        {/* Specific Patient Search (Shown when SPECIFIC_PATIENT is active) */}
        {targetScope === 'SPECIFIC_PATIENT' && (
          <div className="bg-sky-50/40 border border-sky-200 rounded-xl p-4 space-y-3 animate-fadeIn">
            <span className="text-xs font-black text-sky-900 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-sky-600" />
              <span>Search &amp; Select Recipient Patient</span>
            </span>

            <div className="relative">
              <input
                type="text"
                placeholder="Search patient by name, IC, or email..."
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-sky-400 h-10"
              />

              {filteredPatientSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-slate-100">
                  {filteredPatientSuggestions.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTargetPatientEmail(p.email);
                        setPatientSearchTerm(`${p.name} (${p.email})`);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-sky-50 flex items-center justify-between transition cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{p.email}</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {p.phone || 'Patient'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {targetPatientEmail && (
              <div className="flex items-center gap-2 text-xs text-sky-800 bg-sky-100/60 px-3 py-1.5 rounded-lg font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                <span>Selected Recipient: <strong>{targetPatientEmail}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Message Title & Content Form */}
        <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
              Notice Title / Subject
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clinic Notice"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
              Broadcast Message Content
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Compose notification message text for patients..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all resize-y"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer shadow-md shadow-teal-700/15 flex items-center gap-2 active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? "Dispatching Broadcast…" : "Send Broadcast"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── CARD 2: BROADCAST TRANSMISSIONS LOGS TABLE ── */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Broadcast Transmission Logs</span>
            </h3>
          </div>
          <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full font-mono">
            {broadcastLogs.length} Records
          </span>
        </div>

        {broadcastLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            No broadcast notices sent yet today. Sent notices will be permanently recorded here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2.5 pl-2">Timestamp</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5">Target Scope</th>
                  <th className="pb-2.5">Title &amp; Notice</th>
                  <th className="pb-2.5 text-center">Recipients</th>
                  <th className="pb-2.5 text-right pr-2">Dispatched By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {broadcastLogs.map((log) => {
                  const isDoctorMC = log.broadcast_type === 'DOCTOR_MC';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pl-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString([], {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Just now'}
                      </td>

                      <td className="py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          isDoctorMC 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-teal-50 text-teal-700 border-teal-200'
                        }`}>
                          {log.broadcast_type === 'DOCTOR_MC' ? 'Doctor Leave / MC' : 'Announcement'}
                        </span>
                      </td>

                      <td className="py-3 text-xs font-semibold text-slate-800">
                        {log.scope_description || log.target_scope}
                      </td>

                      <td className="py-3 max-w-xs">
                        <p className="font-extrabold text-slate-900 text-xs truncate">{log.title}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{log.message}</p>
                      </td>

                      <td className="py-3 text-center">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full text-[11px]">
                          {log.recipient_count} {log.recipient_count === 1 ? 'Patient' : 'Patients'}
                        </span>
                      </td>

                      <td className="py-3 text-right pr-2 font-mono text-[11px] text-slate-500">
                        {log.sender_id ? log.sender_id.split('@')[0] : 'Staff'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
