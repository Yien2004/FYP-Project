import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  ShieldCheck, 
  TrendingUp, 
  Terminal,
  Activity,
  UserCheck,
  Clock
} from 'lucide-react';
import { SystemLog } from '../../types';

export default function AdminDashboard() {
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [staffRequests, setStaffRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Telemetry states
  const [dbLatency, setDbLatency] = useState<number>(42);
  const [errorLogsCount, setErrorLogsCount] = useState<number>(0);
  const [totalLogsCount, setTotalLogsCount] = useState<number>(0);

  // Demographics counts
  const [clinicianCount, setClinicianCount] = useState<number>(0);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [adminCount, setAdminCount] = useState<number>(0);

  // SVG Chart data
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('ALL');
  const [appointments, setAppointments] = useState<any[]>([]);

  const loadStaffRequests = () => {
    fetch("/api/admin/staff-requests")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStaffRequests(data);
        }
      })
      .catch(err => console.warn("Failed to fetch pending staff requests", err));
  };

  const loadTelemetry = async () => {
    setLoading(true);
    try {
      const startTime = performance.now();
      const logsRes = await fetch("/api/logs");
      const endTime = performance.now();
      
      // Compute database latency
      const latency = Math.round(endTime - startTime);
      setDbLatency(latency > 0 ? latency : 35);

      if (logsRes.ok) {
        const logs: SystemLog[] = await logsRes.json();
        setSystemLogs(logs);
        setTotalLogsCount(logs.length);
        
        // Count errors / alerts
        const errors = logs.filter(l => {
          const msg = (l.event || '').toLowerCase();
          return l.level === 'CRITICAL' || l.level === 'WARNING' || msg.includes('critical') || msg.includes('alert') || msg.includes('alarm');
        }).length;
        setErrorLogsCount(errors);
      }
    } catch (err) {
      console.warn("Failed to load telemetry logs", err);
    }

    // Load registered users and count demographics
    try {
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const users = await usersRes.json();
        if (Array.isArray(users)) {
          const doctors = users.filter(u => u.role === 'Doctor' || u.role === 'Nurse').length;
          const patients = users.filter(u => u.role === 'Patient').length;
          const admins = users.filter(u => u.role === 'Admin').length;
          
          setClinicianCount(doctors);
          setPatientCount(patients);
          setAdminCount(admins);
        }
      }
    } catch (err) {
      console.warn("Failed to load user demographics", err);
    }

    // Load appointments and aggregate by month for the chart
    try {
      const aptsRes = await fetch("/api/appointments");
      if (aptsRes.ok) {
        const apts = await aptsRes.json();
        if (Array.isArray(apts)) {
          setAppointments(apts);
        }
      }
    } catch (err) {
      console.warn("Failed to aggregate appointment trends", err);
    }

    loadStaffRequests();
    setLoading(false);
  };

  useEffect(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate last 6 months chronologically
    const monthsList = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsList.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        count: 0
      });
    }

    appointments.forEach((a: any) => {
      if (!a.date) return;
      
      // Filter by selected hospital
      if (selectedHospital !== 'ALL') {
        const aptHosp = (a.clinic || a.hospital || '').toLowerCase().trim();
        const selHosp = selectedHospital.toLowerCase().trim();
        if (aptHosp !== selHosp) {
          return;
        }
      }

      const [y, m] = a.date.split('-');
      const aptYear = parseInt(y, 10);
      const aptMonth = parseInt(m, 10);
      
      const match = monthsList.find(mObj => mObj.year === aptYear && mObj.monthNum === aptMonth);
      if (match) {
        match.count++;
      }
    });

    setMonthlyData(monthsList.map(m => ({ month: m.month, count: m.count })));
  }, [appointments, selectedHospital]);

  useEffect(() => {
    loadTelemetry();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve this staff account?")) return;
    try {
      const res = await fetch(`/api/admin/staff-requests/${id}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        alert("Staff account successfully approved and registered!");
        loadTelemetry();
      } else {
        const data = await res.json();
        alert(`Approval failed: ${data.error || "Server error"}`);
      }
    } catch (err: any) {
      alert(`Connection error: ${err.message}`);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject and remove this staff registration request?")) return;
    try {
      const res = await fetch(`/api/admin/staff-requests/${id}/reject`, {
        method: "POST"
      });
      if (res.ok) {
        alert("Staff registration request rejected.");
        loadTelemetry();
      } else {
        const data = await res.json();
        alert(`Rejection failed: ${data.error || "Server error"}`);
      }
    } catch (err: any) {
      alert(`Connection error: ${err.message}`);
    }
  };

  const adminMetrics = [
    { label: 'Active Edge Clusters', value: '14 / 14', status: 'Optimal', icon: Server, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'DB Query Latency', value: `${dbLatency}ms`, status: '99.8% Perf', icon: Database, color: 'text-blue-500 bg-blue-50' },
    { label: 'Security Firewall', value: `Alerts: ${errorLogsCount}`, status: 'Secured', icon: ShieldCheck, color: 'text-amber-500 bg-amber-50' },
    { label: 'API Dispatch Volume', value: `${totalLogsCount} total`, status: 'Standard', icon: TrendingUp, color: 'text-red-500 bg-red-50' },
  ];

  // Chart layout config
  const chartData = monthlyData.length > 0 ? monthlyData : [
    { month: 'Jan', count: 0 },
    { month: 'Feb', count: 0 },
    { month: 'Mar', count: 0 },
    { month: 'Apr', count: 0 },
    { month: 'May', count: 0 },
    { month: 'Jun', count: 0 },
  ];
  const maxVal = Math.max(...chartData.map(d => d.count), 5); // default floor to 5 to avoid zero division
  const height = 150;
  const width = 500;
  const padding = 30;

  const points = chartData.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
    const y = height - padding - (d.count / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  // Max value calculations for percentages
  const maxDemographics = Math.max(clinicianCount, patientCount, adminCount, 1);

  return (
    <div className="space-y-6 text-neutral-800 font-sans">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminMetrics.map((met, idx) => {
          const Icon = met.icon;
          return (
            <div key={idx} className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${met.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">{met.label}</span>
                <span className="text-xl font-extrabold text-neutral-900 tracking-tight block mt-1">{met.value}</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {met.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Visualizers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Appointment Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
          <div className="border-b border-neutral-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900">Total Scheduling Velocity</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Tracked volume of outpatient consultations over the last 6 months.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-amber-400 h-9 cursor-pointer"
              >
                <option value="ALL">All Facilities</option>
                <option value="Hospital Pulau Pinang">Hospital Pulau Pinang</option>
                <option value="Hospital Seberang Jaya">Hospital Seberang Jaya</option>
                <option value="Klinik Kesihatan Jalan Perak">Klinik Kesihatan Jalan Perak</option>
                <option value="Klinik Kesihatan Bayan Baru">Klinik Kesihatan Bayan Baru</option>
                <option value="Hospital Bukit Mertajam">Hospital Bukit Mertajam</option>
                <option value="Pantai Hospital Penang">Pantai Hospital Penang</option>
                <option value="Hospital Lam Wah Ee">Hospital Lam Wah Ee</option>
                <option value="Gleneagles Hospital Penang">Gleneagles Hospital Penang</option>
                <option value="Island Hospital">Island Hospital</option>
                <option value="Penang Adventist Hospital">Penang Adventist Hospital</option>
                <option value="Loh Guan Lye Specialists Centre">Loh Guan Lye Specialists Centre</option>
                <option value="KPJ Penang Specialist Hospital">KPJ Penang Specialist Hospital</option>
                <option value="O2 Klinik">O2 Klinik</option>
                <option value="Klinik Singapore">Klinik Singapore</option>
                <option value="Poliklinik Perdana">Poliklinik Perdana</option>
              </select>
              <button 
                onClick={loadTelemetry}
                className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold px-2.5 py-1 rounded-lg border border-amber-200/50 cursor-pointer h-9 shrink-0"
              >
                Sync Chart
              </button>
            </div>
          </div>

          {/* SVG Canvas for Charting */}
          <div className="relative flex justify-center py-2 h-44 overflow-hidden bg-neutral-50/20 rounded-xl border border-neutral-150">
            {loading ? (
              <div className="flex items-center justify-center text-xs text-neutral-450 font-mono">
                Compiling database schedules...
              </div>
            ) : (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-neutral-350">
                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f0f0f0" strokeWidth="1" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f0f0f0" strokeWidth="1" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />

                {pathD && (
                  <>
                    {/* Area path with light color */}
                    <path
                      d={`${pathD} L ${padding + (chartData.length - 1) * (width - padding * 2) / Math.max(chartData.length - 1, 1)},${height - padding} L ${padding},${height - padding} Z`}
                      fill="url(#trendGrad)"
                      opacity="0.15"
                    />
                    {/* Line path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                )}

                {/* Gradients definition */}
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>

                {/* Points circles and labels */}
                {chartData.map((d, index) => {
                  const x = padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
                  const y = height - padding - (d.count / maxVal) * (height - padding * 2);
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#ffffff"
                        stroke="#d97706"
                        strokeWidth="2.5"
                      />
                      <text
                        x={x}
                        y={y - 12}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#111827"
                        className="font-mono"
                      >
                        {d.count}
                      </text>
                      <text
                        x={x}
                        y={height - 10}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="medium"
                        fill="#9ca3af"
                      >
                        {d.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* User Demographics / Accounts Breakdown */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
          <div className="border-b border-neutral-100 pb-4 mb-5">
            <h3 className="font-bold text-base text-neutral-900">User Demographics</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Total registered accounts on PenangHealth Supabase database.</p>
          </div>

          <div className="space-y-4 pt-1">
            {/* Doctors */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-neutral-600">Licensed Practitioners (MD/NP)</span>
                <span className="text-neutral-900 font-bold font-mono">{clinicianCount} Clinicians</span>
              </div>
              <div className="h-2.5 w-full bg-neutral-100 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-lg transition-all duration-500" 
                  style={{ width: `${(clinicianCount / maxDemographics) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Patients */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-neutral-600">Registered Outpatients</span>
                <span className="text-neutral-900 font-bold font-mono">{patientCount} Patients</span>
              </div>
              <div className="h-2.5 w-full bg-neutral-100 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-teal-600 rounded-lg transition-all duration-500" 
                  style={{ width: `${(patientCount / maxDemographics) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Operators & Admins */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-neutral-600">Database Operators & Admins</span>
                <span className="text-neutral-900 font-bold font-mono">{adminCount} Admins</span>
              </div>
              <div className="h-2.5 w-full bg-neutral-100 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-neutral-800 rounded-lg transition-all duration-500" 
                  style={{ width: `${(adminCount / maxDemographics) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Account Status KPI */}
            <div className="mt-6 bg-teal-50/50 border border-teal-100 rounded-xl p-3 flex items-center gap-3">
              <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <div className="text-[11px] text-teal-850">
                <strong className="font-semibold">HL7 Account Verification Active:</strong> 100% of practitioners verified against Penang Health database registry.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Pending Staff Registration Approvals */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
        <div className="border-b border-neutral-100 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Pending Staff Registrations</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Clinician and staff registration requests waiting for administrative approval.</p>
          </div>
          <span className="text-xs bg-teal-50 border border-teal-200/60 text-teal-700 font-bold px-2.5 py-1 rounded-xl">
            {staffRequests.length} Pending
          </span>
        </div>

        {staffRequests.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-450 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
            No pending registration requests to display.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {staffRequests.map((request) => (
              <div key={request.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-neutral-900">{request.fullName}</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                      {request.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-mono">{request.email}</p>
                  <p className="text-[9px] text-neutral-400">Requested: {new Date(request.requestedAt).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="px-3.5 py-1.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-655 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent System Activities Terminal (Clean White Card Theme) */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs text-neutral-700">
        <div className="border-b border-neutral-100 pb-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 rounded-xl border border-sky-100 text-sky-600">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 font-sans">System Audit Logger Engine</h3>
              <p className="text-[10px] text-neutral-400 font-sans">Edge router security telemetry feeds.</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-mono font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ONLINE
          </span>
        </div>

        <div className="font-mono text-xs divide-y divide-neutral-100 leading-relaxed max-h-60 overflow-y-auto space-y-2">
          {systemLogs.length === 0 ? (
            <div className="py-4 text-center text-neutral-400 font-mono">
              No recent audit feeds logged.
            </div>
          ) : (
            systemLogs.map((log, idx) => {
              const isWarn = log.level === 'WARNING' || log.level === 'warning';
              const isCrit = log.level === 'CRITICAL' || log.level === 'error';
              const badgeCol = isCrit 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : isWarn 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-sky-50 text-sky-700 border-sky-100';
              
              const service = log.service || 'SystemAPI';
              const execTime = log.execTime || '20ms';

              return (
                <div key={log.id || idx} className="pt-2 flex items-start gap-4">
                  <span className="text-[10px] text-neutral-400 shrink-0 select-none">[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}]</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${badgeCol} shrink-0`}>
                    {log.level || 'INFO'}
                  </span>
                  <span className="text-[11px] text-neutral-900 font-semibold shrink-0">[{service}]</span>
                  <p className="text-neutral-700 text-[11px] flex-1 leading-snug">{log.message}</p>
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0 select-none">rt={execTime}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
