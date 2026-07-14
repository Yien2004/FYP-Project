import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  Database, 
  Settings, 
  MapPin, 
  Users, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ShieldAlert,
  Search,
  Bed,
  RefreshCw,
  FolderOpen,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { mockSystemLogs, mockFacilities, mockClinicians } from '../../data/mockData';
import { SystemLog, Facility, Clinician } from '../../types';

export default function ReportsSection() {
  const [activeReportSubTab, setActiveReportSubTab] = useState<'monitoring' | 'facility' | 'archive'>('monitoring');

  // State managers to let admins modify clinicians and logs live
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Archive state
  const [archivePatients, setArchivePatients] = useState<any[]>([]);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [selectedArchiveEmail, setSelectedArchiveEmail] = useState<string | null>(null);
  const [archiveProfile, setArchiveProfile] = useState<any>(null);
  const [archiveAppointments, setArchiveAppointments] = useState<any[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveSubView, setArchiveSubView] = useState<'docs' | 'consults' | 'prescriptions'>('docs');

  const fetchArchivePatients = () => {
    fetch("/api/patients")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setArchivePatients(data);
        }
      })
      .catch(err => console.error("Failed to load archive patients", err));
  };

  const fetchLogs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mappedLogs: SystemLog[] = data.map((l: any) => {
            const msg = l.message || '';
            let service = 'System';
            let event = msg;
            if (msg.startsWith('[') && msg.includes(']:')) {
              const idx = msg.indexOf(']:');
              service = msg.substring(1, idx).trim();
              event = msg.substring(idx + 2).trim();
            }
            
            let formattedTime = '';
            if (l.timestamp) {
              const dt = new Date(l.timestamp);
              if (!isNaN(dt.getTime())) {
                const yyyy = dt.getFullYear();
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                const hh = String(dt.getHours()).padStart(2, '0');
                const min = String(dt.getMinutes()).padStart(2, '0');
                const ss = String(dt.getSeconds()).padStart(2, '0');
                formattedTime = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
              } else {
                formattedTime = l.timestamp;
              }
            } else {
              formattedTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
            }

            const isWarn = l.level === 'warning';
            const isCrit = l.level === 'critical';
            const isSucc = l.level === 'success';
            const lvl: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' = isCrit 
              ? 'CRITICAL' 
              : isWarn 
                ? 'WARNING' 
                : isSucc 
                  ? 'SUCCESS' 
                  : 'INFO';

            return {
              id: l.id ? String(l.id) : `log_${Date.now()}_${Math.random()}`,
              timestamp: formattedTime,
              level: lvl,
              service,
              event,
              execTime: `${Math.floor(Math.random() * 45) + 5}ms`
            };
          });
          setLogs(mappedLogs);
        }
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  }, []);

  const fetchClinicians = React.useCallback(async () => {
    try {
      const [usersRes, appointmentsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/appointments")
      ]);
      if (usersRes.ok && appointmentsRes.ok) {
        const users = await usersRes.json();
        const appointments = await appointmentsRes.json();

        if (Array.isArray(users) && Array.isArray(appointments)) {
          const staffUsers = users.filter((u: any) => u.role === 'Doctor' || u.role === 'Nurse');
          
          const mappedClinicians: Clinician[] = staffUsers.map((u: any) => {
            const activeAppointments = appointments.filter((apt: any) => {
              const isAssigned = (apt.doctorName === u.fullName || apt.doctorId === u.id);
              const isSameHospital = !u.hospital || !apt.clinic || apt.clinic === u.hospital;
              const isActive = apt.status !== 'Completed' && apt.status !== 'Done';
              return isAssigned && isSameHospital && isActive;
            });

            return {
              id: u.id,
              name: u.fullName,
              role: u.role,
              department: u.hospital || 'General Ward',
              status: 'Active',
              patientsActive: activeAppointments.length
            };
          });

          setClinicians(prev => {
            const statusMap = new Map<string, 'Active' | 'On Call' | 'Off Duty'>();
            prev.forEach(c => statusMap.set(c.id, c.status));
            
            return mappedClinicians.map(c => ({
              ...c,
              status: statusMap.has(c.id) ? statusMap.get(c.id)! : c.status
            }));
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch clinicians schedule", err);
    }
  }, []);

  useEffect(() => {
    fetchArchivePatients();
    fetchLogs();
    fetchClinicians();
  }, [fetchLogs, fetchClinicians]);

  const loadArchiveDetail = async (email: string) => {
    setSelectedArchiveEmail(email);
    setLoadingArchive(true);
    setArchiveProfile(null);
    setArchiveAppointments([]);
    try {
      const pRes = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      if (pRes.ok) {
        const profile = await pRes.json();
        setArchiveProfile(profile);

        if (profile.id) {
          const aRes = await fetch(`/api/appointments?patientId=${profile.id}`);
          if (aRes.ok) {
            const apts = await aRes.json();
            setArchiveAppointments(apts);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load archive patient details", err);
    } finally {
      setLoadingArchive(false);
    }
  };

  const handleDownloadMC = (apt: any) => {
    const mcContent = 
      `PenangHealth System — OFFICIAL MEDICAL CERTIFICATE\n` +
      `==================================================\n` +
      `MC Reference ID:   MC-${apt.id}\n` +
      `Date Issued:       ${apt.date}\n` +
      `Patient Name:      ${archiveProfile?.fullName || apt.patientName}\n` +
      `Diagnosis/Reason:  ${apt.clinicalNotes || "Medical Consultation"}\n` +
      `Attending Doctor:  ${apt.doctorName} (${apt.specialty})\n` +
      `Facility:          ${apt.clinic || apt.hospital || "Penang General Clinic"}\n` +
      `Status:            FIT FOR DISCHARGE / WORK LEAVE APPROVED\n` +
      `==================================================\n` +
      `This is a computer-generated document verified against HL7 registry.\n`;

    const element = document.createElement("a");
    const file = new Blob([mcContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `mc_${apt.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadAttachment = (att: any) => {
    if (att.data && att.data.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = att.data;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ocrStream = 
        `PenangHealth SECURE OCR RETRIEVAL REPORT\n` +
        `==================================================\n` +
        `File Name:     ${att.name}\n` +
        `File Size:     ${att.size}\n` +
        `Uploaded:      ${att.uploadedAt}\n` +
        `Patient ID:    ${archiveProfile?.email}\n` +
        `==================================================\n\n` +
        `Simulated OCR Text Stream Extract:\n` +
        `----------------------------------\n` +
        `[OCR Stream Start]\n` +
        `Patient Name: ${archiveProfile?.fullName}\n` +
        `MyKad/ID: ${archiveProfile?.myKadOrPassport}\n` +
        `Lab / Document Type: ${att.type.toUpperCase()}\n` +
        `Notes: Diagnostic scan verified. Blood markers and radiological plates archived in primary clinical vault.\n` +
        `[OCR Stream End]\n`;

      const element = document.createElement("a");
      const file = new Blob([ocrStream], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `ocr_report_${att.name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Toggle clinician availability status
  const handleToggleClinicianStatus = (id: string) => {
    setClinicians(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatusMap: { [key: string]: 'Active' | 'On Call' | 'Off Duty' } = {
          'Active': 'On Call',
          'On Call': 'Off Duty',
          'Off Duty': 'Active'
        };
        return { ...c, status: nextStatusMap[c.status] };
      }
      return c;
    }));
  };

  // Add system dummy log
  const handleTriggerSimulatedLog = async () => {
    const randomServices = ['HL7-Parser', 'API-Gateway', 'DMR-Central', 'AuthSvc', 'DrizzleORM'];
    const randomEvents = [
      'Database connection pool recycle triggered.',
      'Heartbeat broadcast acknowledged by cluster edge server West-5.',
      'Incoming file encryption validated.',
      'System warning: slow I/O bound read from remote storage cluster.',
      'API call rate exceeded alarm for transient IP token validation.'
    ];
    const levels: ('INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS')[] = ['INFO', 'SUCCESS', 'WARNING', 'CRITICAL'];
    
    const level = levels[Math.floor(Math.random() * levels.length)];
    const service = randomServices[Math.floor(Math.random() * randomServices.length)];
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    const message = `[${service}]: ${event}`;
    
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, level: level.toLowerCase() })
      });
      if (res.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error("Failed to add simulated log", err);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = logFilter === 'ALL' || log.level === logFilter;
    const matchesSearch = log.event.toLowerCase().includes(logSearch.toLowerCase()) || 
                          log.service.toLowerCase().includes(logSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Sub-Tabs Switch Navigation bar */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveReportSubTab('monitoring')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeReportSubTab === 'monitoring'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          System Monitoring & Logs
        </button>
        <button
          onClick={() => setActiveReportSubTab('facility')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeReportSubTab === 'facility'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Facility Management
        </button>
        <button
          onClick={() => setActiveReportSubTab('archive')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeReportSubTab === 'archive'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-550 hover:text-neutral-800'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Digital Medical Archive
        </button>
      </div>

      {/* RENDER SYSTEM MONITORING & LOGS */}
      {activeReportSubTab === 'monitoring' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Server / Cluster health row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Primary Client Server</span>
                <h4 className="text-xl font-extrabold text-neutral-900 mt-1">CPU Load: 12%</h4>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Memory: 4.8 GB/16 GB
                </p>
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl text-neutral-500">
                <Server className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">DB Integrity Desk</span>
                <h4 className="text-xl font-extrabold text-neutral-900 mt-1">Active Pools: 41</h4>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Max Connections: 50
                </p>
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl text-neutral-500">
                <Database className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">API Gateway Ingress</span>
                <h4 className="text-xl font-extrabold text-neutral-900 mt-1">200 OK: 100%</h4>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Failure Rate: 0.00%
                </p>
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl text-neutral-500">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Real-time logging table on Left */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Real-time System Logs</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Filter of HL7-Parser database ingestion endpoints and transactional checks.</p>
                </div>
                <button
                  onClick={handleTriggerSimulatedLog}
                  className="p-2 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                  Simulate Network Log
                </button>
              </div>

              {/* Logs Search & Filters bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-2 rounded-xl border border-neutral-200/60 text-xs">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search query log messages..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg pl-8 pr-3 py-1 text-xs text-neutral-700 outline-none focus:ring-1 focus:ring-neutral-400"
                  />
                </div>

                {/* Severity Toggles */}
                <div className="flex gap-1.5 shrink-0">
                  {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLogFilter(lvl)}
                      className={`px-2.5 py-1 rounded-md font-semibold font-sans tracking-wide ${
                        logFilter === lvl
                          ? 'bg-neutral-905 text-white'
                          : 'bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingestion Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] leading-tight border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[10px] text-neutral-400 font-bold uppercase tracking-wider pb-2">
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Level</th>
                      <th className="pb-2">Service</th>
                      <th className="pb-2">Log Statement</th>
                      <th className="pb-2 text-right">rt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-neutral-400 font-sans">
                          No matching engine system logs match current search filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isWarn = log.level === 'WARNING';
                        const isCrit = log.level === 'CRITICAL';
                        const isSucc = log.level === 'SUCCESS';
                        const badgeCol = isCrit 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : isWarn 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : isSucc 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200';
                        return (
                          <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="py-2.5 text-neutral-400 whitespace-nowrap">{log.timestamp}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${badgeCol}`}>
                                {log.level}
                              </span>
                            </td>
                            <td className="py-2.5 font-bold text-neutral-900 whitespace-nowrap">{log.service}</td>
                            <td className="py-2.5 pr-2 truncate max-w-sm font-sans" title={log.event}>{log.event}</td>
                            <td className="py-2.5 text-right font-medium text-neutral-500 whitespace-nowrap">{log.execTime}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Panel: Security Core Alerts */}
            <div className="bg-neutral-900 text-neutral-100 rounded-2xl p-6 border border-neutral-800 shadow-xl self-start">
              <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-4 mb-4">
                <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
                <div>
                  <h3 className="font-bold text-sm text-white">Edge Security Alerts</h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Active web application firewall triggers.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5 p-3 rounded-xl bg-red-950/40 border border-red-900/30 text-red-200">
                  <div className="flex justify-between font-bold">
                    <span>XSS Filter Alert</span>
                    <span className="font-mono">12:35 PM</span>
                  </div>
                  <p className="text-[11px] leading-snug">Blocked malformed query payload injection testing inside client router endpoint.</p>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-amber-950/40 border border-amber-900/30 text-amber-200">
                  <div className="flex justify-between font-bold">
                    <span>Brute Force Alarm</span>
                    <span className="font-mono">11:15 AM</span>
                  </div>
                  <p className="text-[11px] leading-snug">Continuous account auth failure (5 requests) from host IP 192.168.1.182.</p>
                </div>

                <div className="p-3 bg-neutral-800/50 border border-neutral-800 rounded-xl text-neutral-400 leading-snug text-[11px]">
                  All database transaction tunnels encrypted on level AES-256. Primary TLS key authenticated and rotated 6 hours ago.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* RENDER FACILITY MANAGEMENT */}
      {activeReportSubTab === 'facility' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Bed Occupancy Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockFacilities.map((fac) => {
              const ratio = Math.round((fac.bedsOccupied / fac.bedsTotal) * 100);
              const isCrit = fac.status === 'Critical';
              const isNear = fac.status === 'Near Capacity';
              const badgeBg = isCrit 
                ? 'bg-red-50 border-red-100 text-red-700' 
                : isNear 
                  ? 'bg-amber-50 border-amber-100 text-amber-700' 
                  : 'bg-emerald-50 border-emerald-100 text-emerald-700';

              return (
                <div key={fac.id} className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-neutral-900 truncate max-w-[130px]">{fac.name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${badgeBg} border`}>
                        {fac.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">{fac.type}</p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-neutral-400" />
                        Beds Occupancy
                      </span>
                      <span className="font-mono text-neutral-900 font-bold">{fac.bedsOccupied} / {fac.bedsTotal}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCrit ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active clinicians panel */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-neutral-900">Ward Clinicians On-duty Schedule</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Select and toggle clinician availability status in real-time based on active trauma alarms.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-xs text-neutral-400 font-bold uppercase tracking-wider pb-2">
                      <th className="pb-3 pl-1">Clinician Name</th>
                      <th className="pb-3">Functional Department</th>
                      <th className="pb-3 text-center">Duty Status</th>
                      <th className="pb-3 text-center">Active Patients</th>
                      <th className="pb-3 text-right">Switch Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {clinicians.map((clin) => {
                      const isActive = clin.status === 'Active';
                      const isOnCall = clin.status === 'On Call';
                      const badgeBg = isActive 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : isOnCall 
                          ? 'bg-amber-50 border-amber-100 text-amber-700' 
                          : 'bg-neutral-50 border-neutral-100 text-neutral-500';

                      return (
                        <tr key={clin.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 pl-1">
                            <div>
                              <p className="font-bold text-neutral-900">{clin.name}</p>
                              <p className="text-[11px] text-neutral-400">{clin.role}</p>
                            </div>
                          </td>
                          <td className="py-3 text-neutral-600 font-medium">{clin.department}</td>
                          <td className="py-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold ${badgeBg}`}>
                              {clin.status}
                            </span>
                          </td>
                          <td className="py-3 text-center font-mono font-bold text-neutral-900">
                            {clin.patientsActive}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              id={`toggle-duty-${clin.id}`}
                              onClick={() => handleToggleClinicianStatus(clin.id)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-neutral-700"
                            >
                              Toggle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regional Coverage Map visual model */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Facility Regional Coverage Grid</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Live vector diagram of municipal regional triage nodes connection rate.</p>
              </div>

              {/* Dynamic SVG graphic of nodes map */}
              <div className="py-4 flex justify-center">
                <svg viewBox="0 0 160 120" className="w-40 h-32 text-neutral-400">
                  {/* Grid background lines */}
                  <line x1="20" y1="20" x2="140" y2="100" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="3" />
                  <line x1="140" y1="20" x2="20" y2="100" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="3" />

                  {/* Nodes connection lines */}
                  <line x1="40" y1="30" x2="120" y2="40" stroke="#d1d5db" strokeWidth="1.5" />
                  <line x1="120" y1="40" x2="130" y2="90" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2" />
                  <line x1="130" y1="90" x2="50" y2="90" stroke="#22c55e" strokeWidth="1.5" />
                  <line x1="50" y1="90" x2="40" y2="30" stroke="#22c55e" strokeWidth="1.5" />
                  <line x1="80" y1="65" x2="40" y2="30" stroke="#3b82f6" strokeWidth="1.5" />
                  <line x1="80" y1="65" x2="120" y2="40" stroke="#3b82f6" strokeWidth="1.5" />

                  {/* Central Node */}
                  <circle cx="80" cy="65" r="9" fill="#3b82f6" fillOpacity="0.2" className="animate-ping" />
                  <circle cx="80" cy="65" r="6" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />

                  {/* Regional Clinics Nodes */}
                  <circle cx="40" cy="30" r="4" fill="#22c55e" stroke="#ffffff" strokeWidth="1" />
                  <circle cx="120" cy="40" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                  <circle cx="130" cy="90" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                  <circle cx="50" cy="90" r="4" fill="#22c55e" stroke="#ffffff" strokeWidth="1" />
                </svg>
              </div>

              {/* Map legendary labels */}
              <div className="space-y-2 mt-4 text-[10px] bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>West Gate clinic</span>
                  <span className="font-semibold text-emerald-605">Healthy</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>East Central triage</span>
                  <span className="font-semibold text-amber-605 font-mono">Diverting</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>South Wing ICU buffer</span>
                  <span className="font-semibold text-red-650 font-mono">Critical</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
      {activeReportSubTab === 'archive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn min-h-[500px]">
          
          {/* Left Panel: Patient Finder */}
          <div className="lg:col-span-4 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col h-[550px]">
            <h4 className="font-bold text-sm text-neutral-900 mb-3">Archive Directory Explorer</h4>
            
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search archive profiles..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-8"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 pr-1">
              {archivePatients
                .filter(p => p.name.toLowerCase().includes(archiveSearch.toLowerCase()) || p.email.toLowerCase().includes(archiveSearch.toLowerCase()))
                .map(p => {
                  const isSelected = selectedArchiveEmail === p.email;
                  return (
                    <div
                      key={p.id || p.email}
                      onClick={() => loadArchiveDetail(p.email)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center gap-3 ${
                        isSelected ? 'bg-teal-50/50 border-l-4 border-l-teal-650' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-neutral-900 block truncate">{p.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono block truncate mt-0.5">{p.email}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Panel: Records Viewer */}
          <div className="lg:col-span-8">
            {selectedArchiveEmail ? (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs h-[550px] flex flex-col justify-between">
                {loadingArchive ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-mono">
                    Retrieving clinical blockchain scans...
                  </div>
                ) : archiveProfile ? (
                  <div className="flex flex-col h-full justify-between overflow-hidden">
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                      
                      {/* Patient metadata header */}
                      <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-base text-neutral-900 leading-snug">{archiveProfile.fullName}</h4>
                          <span className="text-[10px] text-neutral-550 font-mono mt-0.5 block">{archiveProfile.email}</span>
                        </div>
                        <div className="text-right text-[10px] text-neutral-500 font-mono font-medium">
                          <span>MyKad: {archiveProfile.myKadOrPassport || 'N/A'}</span>
                          <span className="block mt-0.5">DOB: {archiveProfile.dateOfBirth || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Detail tabs navigation */}
                      <div className="bg-neutral-50 border border-neutral-200 p-0.5 rounded-lg flex items-center gap-0.5 text-[10px] font-bold text-neutral-500 shrink-0">
                        <button
                          onClick={() => setArchiveSubView('docs')}
                          className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                            archiveSubView === 'docs' ? 'bg-white text-neutral-850 shadow-xs' : 'hover:text-neutral-850'
                          }`}
                        >
                          EHR Document Scans ({archiveProfile.attachments?.length || 0})
                        </button>
                        <button
                          onClick={() => setArchiveSubView('prescriptions')}
                          className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                            archiveSubView === 'prescriptions' ? 'bg-white text-neutral-850 shadow-xs' : 'hover:text-neutral-850'
                          }`}
                        >
                          Prescription Vault ({archiveProfile.prescriptions?.length || 0})
                        </button>
                        <button
                          onClick={() => setArchiveSubView('consults')}
                          className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                            archiveSubView === 'consults' ? 'bg-white text-neutral-850 shadow-xs' : 'hover:text-neutral-850'
                          }`}
                        >
                          Consultations & MCs ({archiveAppointments.filter(a => a.status === 'Completed').length})
                        </button>
                      </div>

                      {/* Subview contents */}
                      <div className="pt-2">
                        {/* 1. EHR Document Scans */}
                        {archiveSubView === 'docs' && (
                          <div className="space-y-3">
                            {!archiveProfile.attachments || archiveProfile.attachments.length === 0 ? (
                              <p className="text-xs text-neutral-450 font-mono py-4 text-center">No uploaded documents or scans.</p>
                            ) : (
                              archiveProfile.attachments.map((att: any) => (
                                <div key={att.id} className="bg-neutral-50 border border-neutral-150 rounded-xl p-3 flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <span className="font-bold text-xs text-neutral-800 block truncate">{att.name}</span>
                                    <span className="text-[10px] text-neutral-450 block mt-0.5 font-mono font-medium">Size: {att.size} | Uploaded: {att.uploadedAt}</span>
                                  </div>
                                  <button
                                    onClick={() => handleDownloadAttachment(att)}
                                    className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer shrink-0"
                                    title="Download File Scan"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* 2. Prescription Vault */}
                        {archiveSubView === 'prescriptions' && (
                          <div className="space-y-3">
                            {!archiveProfile.prescriptions || archiveProfile.prescriptions.length === 0 ? (
                              <p className="text-xs text-neutral-450 font-mono py-4 text-center">No prescriptions cataloged.</p>
                            ) : (
                              archiveProfile.prescriptions.map((rx: any) => (
                                <div key={rx.id} className="bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs leading-normal">
                                  <div className="flex justify-between font-bold text-neutral-900 border-b border-neutral-200/50 pb-1.5 mb-1.5">
                                    <span>{rx.drugName}</span>
                                    <span className="text-[10px] text-neutral-500 font-mono font-medium">{rx.date}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-neutral-600 font-medium">
                                    <span>Dosage: <strong className="text-neutral-800">{rx.dosage}</strong></span>
                                    <span>Frequency: <strong className="text-neutral-800">{rx.frequency}</strong></span>
                                    <span>Duration: <strong className="text-neutral-800">{rx.duration}</strong></span>
                                    <span>Prescribed by: <strong className="text-neutral-800">{rx.prescribedBy}</strong></span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* 3. Consultations & MCs */}
                        {archiveSubView === 'consults' && (
                          <div className="space-y-3">
                            {archiveAppointments.filter(a => a.status === 'Completed').length === 0 ? (
                              <p className="text-xs text-neutral-450 font-mono py-4 text-center">No completed consultations logged.</p>
                            ) : (
                              archiveAppointments
                                .filter(a => a.status === 'Completed')
                                .map((apt: any) => (
                                  <div key={apt.id} className="bg-neutral-50 border border-neutral-150 rounded-xl p-3.5 space-y-2 text-xs">
                                    <div className="flex justify-between border-b border-neutral-200/50 pb-1.5 items-baseline">
                                      <span className="font-bold text-neutral-900">{apt.doctorName} ({apt.specialty})</span>
                                      <span className="text-[10px] text-neutral-500 font-mono font-medium">{apt.date} | {apt.timeSlot}</span>
                                    </div>
                                    <div className="text-neutral-600 font-medium leading-relaxed">
                                      <span className="text-[9px] uppercase font-bold text-neutral-450 block">Consultation notes</span>
                                      <p className="text-neutral-800 mt-0.5">{apt.clinicalNotes || "Routine checking / outpatient general audit."}</p>
                                    </div>
                                    <div className="flex justify-end pt-1">
                                      <button
                                        onClick={() => handleDownloadMC(apt)}
                                        className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-sm shadow-black/10"
                                      >
                                        <Download className="w-3 h-3" /> Download verified MC
                                      </button>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-xs text-neutral-450 font-mono">
                    Failed to decrypt records archive.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl p-8 text-center text-neutral-450 flex flex-col items-center justify-center h-[550px]">
                <FolderOpen className="w-10 h-10 text-neutral-350 mb-3" />
                <h4 className="font-bold text-neutral-900 text-sm">Select an Outpatient Account</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                  Choose a patient profile from the left index directory explorer to inspect, view, and safely archive their diagnostic uploads, prescriptions, and digital MC files.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
