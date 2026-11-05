import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Clock, 
  Volume2,
  Building2
} from 'lucide-react';
import { getStaffAccountByEmail, PANTAI_FACILITIES, getHospitalByFacilityId } from '../../../data/staffAccounts';

interface BroadcastHistoryLog {
  id: string;
  timestamp: string;
  message: string;
  level: string;
}

interface AdminSettingsSectionProps {
  isSuperAdmin?: boolean;
}

export default function AdminSettingsSection({ isSuperAdmin = false }: AdminSettingsSectionProps) {
  const loggedEmail = localStorage.getItem('lifelink_user_email') || '';
  const adminAccount = React.useMemo(() => getStaffAccountByEmail(loggedEmail), [loggedEmail]);
  const defaultFacId = adminAccount?.facility_id || 1;
  const [targetFacilityId, setTargetFacilityId] = useState<number | 'ALL'>(isSuperAdmin ? 'ALL' : defaultFacId);

  // Broadcast states
  const [broadcastCategory, setBroadcastCategory] = useState<'Emergency Alert' | 'Maintenance Warning' | 'Health Advisory'>('Emergency Alert');
  const [broadcastTarget, setBroadcastTarget] = useState<string>('Entire Facility / All Patients & Staff');
  const [selectedDepartment, setSelectedDepartment] = useState('General Medicine');
  const [selectedAdminEmail, setSelectedAdminEmail] = useState('pantaipenangadmin@gmail.com');
  const [selectedPatientEmail, setSelectedPatientEmail] = useState('');
  const [patientUsers, setPatientUsers] = useState<{ email: string; fullName: string }[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<BroadcastHistoryLog[]>([]);

  // Branch Admins Directory
  const BRANCH_ADMIN_ACCOUNTS = React.useMemo(() => [
    { facility_id: 1, name: "Main Pantai Hospital Penang Admin", email: "pantaipenangadmin@gmail.com", hospital: "Pantai Hospital Penang (Main Hospital)" },
    { facility_id: 2, name: "Georgetown Pavilion Admin", email: "pantaipavilionadmin@gmail.com", hospital: "Pantai Heart & Wellness Pavilion" },
    { facility_id: 3, name: "Bayan Baru Clinic Admin", email: "pantaiclinicadmin@gmail.com", hospital: "Pantai Premier Clinic & Day Surgery" },
    { facility_id: 4, name: "Ayer Itam Centre Admin", email: "pantaicentreadmin@gmail.com", hospital: "Pantai Specialist Centre" }
  ], []);

  // Facility-specific departments directory
  const FACILITY_DEPARTMENTS: Record<number, string[]> = React.useMemo(() => ({
    1: [
      "Internal Medicine",
      "General Surgery",
      "Accident & Emergency (A&E)",
      "Respiratory Medicine",
      "Paediatrics",
      "Hospital Administration"
    ],
    2: [
      "Cardiology",
      "Heart & Vascular",
      "Health Screening & Wellness",
      "Hospital Administration"
    ],
    3: [
      "Gastroenterology & Hepatology",
      "Dermatology",
      "Family Medicine",
      "Hospital Administration"
    ],
    4: [
      "Orthopaedic Surgery",
      "Ear, Nose & Throat (ENT)",
      "Ophthalmology",
      "Hospital Administration"
    ]
  }), []);

  const availableDepartments = React.useMemo(() => {
    if (targetFacilityId === 'ALL') {
      const allDepts = new Set<string>();
      Object.values(FACILITY_DEPARTMENTS).forEach(arr => arr.forEach(d => allDepts.add(d)));
      return Array.from(allDepts);
    }
    return FACILITY_DEPARTMENTS[targetFacilityId] || ["General Medicine", "Hospital Administration"];
  }, [targetFacilityId, FACILITY_DEPARTMENTS]);

  // Keep selected department valid
  useEffect(() => {
    if (availableDepartments.length > 0 && !availableDepartments.includes(selectedDepartment)) {
      setSelectedDepartment(availableDepartments[0]);
    }
  }, [availableDepartments, selectedDepartment]);

  // Filter available branch admins
  const availableBranchAdmins = React.useMemo(() => {
    if (targetFacilityId === 'ALL') {
      return BRANCH_ADMIN_ACCOUNTS;
    }
    return BRANCH_ADMIN_ACCOUNTS.filter(a => a.facility_id === targetFacilityId);
  }, [targetFacilityId, BRANCH_ADMIN_ACCOUNTS]);

  // Filter available patients: strictly patients who have had at least one appointment at the selected hospital
  const availablePatients = React.useMemo(() => {
    if (targetFacilityId === 'ALL') {
      return patientUsers;
    }
    const branchPatientEmails = new Set(
      appointments
        .filter((a: any) => {
          const facId = a.facility_id ? Number(a.facility_id) : (getStaffAccountByEmail(a.doctorEmail)?.facility_id || 1);
          return facId === targetFacilityId;
        })
        .map((a: any) => (a.patientEmail || '').toLowerCase().trim())
        .filter(Boolean)
    );
    return patientUsers.filter(p => branchPatientEmails.has(p.email.toLowerCase().trim()));
  }, [targetFacilityId, patientUsers, appointments]);

  // Keep selected patient valid
  useEffect(() => {
    if (availablePatients.length > 0) {
      if (!availablePatients.some(p => p.email === selectedPatientEmail)) {
        setSelectedPatientEmail(availablePatients[0].email);
      }
    } else {
      setSelectedPatientEmail('');
    }
  }, [availablePatients, selectedPatientEmail]);

  const fetchBroadcastHistory = () => {
    fetch("/api/logs")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data
            .filter((l: any) => l.message && l.message.startsWith('[Broadcast]:'))
            .map((l: any) => ({
              id: l.id,
              timestamp: l.timestamp || new Date().toISOString(),
              message: l.message.replace('[Broadcast]:', '').trim(),
              level: l.level
            }));
          setHistoryLogs(filtered);
        }
      })
      .catch(err => console.error("Failed to load broadcast history", err));
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm("Verify: Are you sure you want to remove this broadcast log from history?")) return;
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Broadcast record removed from logs successfully.");
        fetchBroadcastHistory();
      } else {
        alert("Failed to delete log from database.");
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  useEffect(() => {
    fetchBroadcastHistory();
    Promise.all([
      fetch("/api/admin/users").then(res => res.json()),
      fetch("/api/appointments").then(res => res.json())
    ]).then(([usersData, aptsData]) => {
      if (Array.isArray(usersData)) {
        const pts = usersData.filter((u: any) => u.role === 'Patient').map((u: any) => ({
          email: u.email,
          fullName: u.fullName || u.email
        }));
        setPatientUsers(pts);
      }
      if (Array.isArray(aptsData)) {
        setAppointments(aptsData);
      }
    }).catch(() => {});
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return alert("Please enter a broadcast message.");
    if (broadcastTarget === 'Specific Patient' && !selectedPatientEmail.trim()) return alert("Please select a target patient.");

    let audience = broadcastTarget as string;
    if (broadcastTarget === 'Specific Department') audience = `Specific Department: ${selectedDepartment}`;
    else if (broadcastTarget === 'Branch Administrator') audience = `Branch Administrator: ${selectedAdminEmail}`;
    else if (broadcastTarget === 'Specific Patient') audience = `Specific Patient: ${selectedPatientEmail.trim()}`;
    if (targetFacilityId !== 'ALL') audience += ` [${getHospitalByFacilityId(targetFacilityId)}]`;

    if (!window.confirm("Verify Broadcast: Dispatching this memo immediately transmits notifications. Proceed?")) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: broadcastCategory, targetAudience: audience, specificPatientEmail: broadcastTarget === 'Specific Patient' ? selectedPatientEmail.trim() : undefined, message: broadcastMessage })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("System broadcast dispatched successfully!");
        setBroadcastMessage('');
        fetchBroadcastHistory();
      } else {
        alert(`Failed to dispatch: ${data.error || "Server error"}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-neutral-800">
      
      {/* Broadcast Composer */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
        <div className="border-b border-neutral-100 pb-4 mb-5">
          <h3 className="font-bold text-base text-neutral-900">System Broadcast & Clinical Memo Dispatcher</h3>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* 1. Target Hospital Scope */}
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">
                Target Hospital / Scope
              </label>
              {isSuperAdmin ? (
                <select
                  value={targetFacilityId}
                  onChange={(e) => setTargetFacilityId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-bold outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 h-9 cursor-pointer"
                >
                  <option value="ALL">All Facilities (Group-Wide)</option>
                  {PANTAI_FACILITIES.map(f => (
                    <option key={f.id} value={f.id}>{f.shortTag} ({f.location})</option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 font-bold h-9 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">{adminAccount?.hospital || 'Pantai Hospital Penang (Main Hospital)'}</span>
                </div>
              )}
            </div>

            {/* 2. Broadcast Category */}
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">
                Broadcast Category
              </label>
              <select
                value={broadcastCategory}
                onChange={(e) => setBroadcastCategory(e.target.value as any)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
              >
                <option value="Emergency Alert">Emergency Alert / Triage Warning</option>
                <option value="Maintenance Warning">Maintenance Warning</option>
                <option value="Health Advisory">Health Advisory / Vaccination Drive</option>
              </select>
            </div>

            {/* 3. Target Audience */}
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">
                Target Audience
              </label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
              >
                <option value="Entire Facility / All Patients & Staff">
                  {targetFacilityId === 'ALL' ? "Entire Healthcare Group (All Patients & Staff)" : "Entire Facility (All Patients & Staff)"}
                </option>
                <option value="Specific Department">Specific Department</option>
                {isSuperAdmin && <option value="Branch Administrator">Branch Administrator</option>}
                <option value="Specific Patient">Specific Patient</option>
                <option value="Clinical Staff / Doctors Only">Clinical Staff / Doctors Only</option>
                <option value="Patients Only">Patients Only</option>
              </select>
            </div>
          </div>

          {/* Sub-selector for Specific Department */}
          {broadcastTarget === 'Specific Department' && (
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">
                Select Department {targetFacilityId !== 'ALL' && `(${getHospitalByFacilityId(targetFacilityId)})`}
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
              >
                {availableDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sub-selector for Branch Administrator */}
          {isSuperAdmin && broadcastTarget === 'Branch Administrator' && (
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">
                Select Branch Administrator
              </label>
              <select
                value={selectedAdminEmail}
                onChange={(e) => setSelectedAdminEmail(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
              >
                {availableBranchAdmins.map(adm => (
                  <option key={adm.email} value={adm.email}>
                    {adm.name} — {adm.hospital} ({adm.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sub-selector for Specific Patient (filtered strictly to this facility) */}
          {broadcastTarget === 'Specific Patient' && (
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">
                Target Patient {targetFacilityId !== 'ALL' && `(${getHospitalByFacilityId(targetFacilityId)})`}
              </label>
              {availablePatients.length > 0 ? (
                <select
                  value={selectedPatientEmail}
                  onChange={(e) => setSelectedPatientEmail(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
                >
                  {availablePatients.map(p => (
                    <option key={p.email} value={p.email}>
                      {p.fullName} ({p.email})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-500 italic h-9 flex items-center">
                  No patients found with booking/appointment history at this facility.
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">Alert Message</label>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter alert memo to dispatch..."
              rows={4}
              required
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 font-sans leading-relaxed resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end pt-2 border-t border-neutral-100">
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? "Dispatching Broadcast..." : "Dispatch Channel Broadcast"}
            </button>
          </div>

        </form>
      </div>

        {/* Broadcast history logs list */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
          <div className="border-b border-neutral-100 pb-4 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-sm text-neutral-900">Broadcast Transmissions Logs</h3>
            <button 
              onClick={fetchBroadcastHistory}
              className="text-[10px] text-teal-650 hover:underline cursor-pointer"
            >
              Refresh History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-[10px] font-bold text-neutral-450 uppercase tracking-wider">
                  <th className="pb-2.5">Date Logged</th>
                  <th className="pb-2.5">Alert Message memo</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {historyLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-neutral-450 font-mono">
                      No active broadcast transmissions cataloged.
                    </td>
                  </tr>
                ) : (
                  historyLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 pr-4 font-mono text-[10px] text-neutral-500 w-44 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 text-neutral-800 leading-normal">
                        {log.message}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteBroadcast(log.id)}
                          className="px-2.5 py-1 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
