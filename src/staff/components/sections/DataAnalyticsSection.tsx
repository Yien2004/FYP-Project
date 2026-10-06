import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Filter,
  Activity,
  FileText
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  timeSlot: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Approved' | 'Pending' | 'Rescheduled' | 'Rejected';
  clinic?: string;
  hospital?: string;
}

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

export default function DataAnalyticsSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    setLoading(true);
    fetch("/api/appointments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const isAdmin = localStorage.getItem("lifelink_user_role") === "Admin";
          const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
          const currentClinic = getClinicFromEmail(loggedEmail);
          
          let filtered = data;
          if (!isAdmin && currentClinic) {
            filtered = data.filter((ap: any) => (ap.clinic || ap.hospital || '').toLowerCase() === currentClinic.toLowerCase());
          }
          setAppointments(filtered);
        }
      })
      .catch(err => console.error("Failed to fetch appointments for analytics", err))
      .finally(() => setLoading(false));
  }, []);

  // 1. Compute KPIs
  const totalBookings = appointments.length;
  const completedBookings = appointments.filter(a => a.status === 'Completed').length;
  const cancelledBookings = appointments.filter(a => a.status === 'Cancelled' || a.status === 'Rejected').length;
  const pendingBookings = appointments.filter(a => a.status === 'Pending' || a.status === 'Upcoming' || a.status === 'Approved').length;

  // 2. Aggregate Data by Day
  const getDailyStats = () => {
    const dailyMap: Record<string, { total: number; completed: number; cancelled: number }> = {};
    appointments.forEach(a => {
      const dateStr = a.date || 'Unknown';
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { total: 0, completed: 0, cancelled: 0 };
      }
      dailyMap[dateStr].total++;
      if (a.status === 'Completed') dailyMap[dateStr].completed++;
      if (a.status === 'Cancelled' || a.status === 'Rejected') dailyMap[dateStr].cancelled++;
    });

    // Sort by date key ascending
    return Object.keys(dailyMap)
      .sort()
      .map(date => ({
        label: date,
        total: dailyMap[date].total,
        completed: dailyMap[date].completed,
        cancelled: dailyMap[date].cancelled
      }));
  };

  // 3. Aggregate Data by Month
  const getMonthlyStats = () => {
    const monthlyMap: Record<string, { total: number; completed: number; cancelled: number }> = {};
    appointments.forEach(a => {
      let monthStr = 'Unknown';
      if (a.date) {
        // Assume format is YYYY-MM-DD
        const parts = a.date.split('-');
        if (parts.length >= 2) {
          const year = parts[0];
          const monthNum = parseInt(parts[1], 10);
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          monthStr = `${monthNames[monthNum - 1]} ${year}`;
        }
      }
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { total: 0, completed: 0, cancelled: 0 };
      }
      monthlyMap[monthStr].total++;
      if (a.status === 'Completed') monthlyMap[monthStr].completed++;
      if (a.status === 'Cancelled' || a.status === 'Rejected') monthlyMap[monthStr].cancelled++;
    });

    return Object.keys(monthlyMap).map(month => ({
      label: month,
      total: monthlyMap[month].total,
      completed: monthlyMap[month].completed,
      cancelled: monthlyMap[month].cancelled
    }));
  };

  const chartData = viewMode === 'daily' ? getDailyStats() : getMonthlyStats();

  // 4. Download Report Handlers
  const triggerDownload = (fileName: string, csvContent: string) => {
    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportDailyReport = () => {
    const stats = getDailyStats();
    let csv = "Daily Appointment Bookings Report\n" +
              `Generated: ${new Date().toLocaleString()}\n` +
              "-----------------------------------------\n" +
              "Date,Total Bookings,Completed Consultations,Cancelled/Rejected Bookings\n";

    stats.forEach(s => {
      csv += `${s.label},${s.total},${s.completed},${s.cancelled}\n`;
    });

    triggerDownload(`daily_analytics_report_${Date.now()}.csv`, csv);
  };

  const handleExportMonthlyReport = () => {
    const stats = getMonthlyStats();
    let csv = "Monthly Appointment Bookings Report\n" +
              `Generated: ${new Date().toLocaleString()}\n` +
              "-----------------------------------------\n" +
              "Month,Total Bookings,Completed Consultations,Cancelled/Rejected Bookings\n";

    stats.forEach(s => {
      csv += `${s.label},${s.total},${s.completed},${s.cancelled}\n`;
    });

    triggerDownload(`monthly_analytics_report_${Date.now()}.csv`, csv);
  };

  // 5. SVG Render math for trend line
  const maxCount = Math.max(...chartData.map(d => d.total), 5); // default floor of 5 to avoid divide by zero
  const height = 180;
  const width = 640;
  const padding = 40;

  const points = chartData.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
    const y = height - padding - (d.total / maxCount) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Bookings */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Total Bookings</span>
            <span className="text-xl font-extrabold text-neutral-900 mt-1 block font-mono">{loading ? '...' : totalBookings}</span>
          </div>
        </div>

        {/* Completed consultations */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Completed Sessions</span>
            <span className="text-xl font-extrabold text-neutral-900 mt-1 block font-mono">{loading ? '...' : completedBookings}</span>
          </div>
        </div>

        {/* Pending / Queue */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <Clock className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Active Queue</span>
            <span className="text-xl font-extrabold text-neutral-900 mt-1 block font-mono">{loading ? '...' : pendingBookings}</span>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-xl shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Cancelled Slots</span>
            <span className="text-xl font-extrabold text-neutral-900 mt-1 block font-mono">{loading ? '...' : cancelledBookings}</span>
          </div>
        </div>

      </div>

      {/* Main Trend Chart and Export Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Visualizer */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
          <div className="border-b border-neutral-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-neutral-900">Patient Booking Velocities</h3>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">Aggregated outpatient schedule registrations from the live database.</p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 p-0.5 rounded-lg flex items-center gap-0.5">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === 'daily' ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Daily Trend
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === 'monthly' ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Monthly Trend
              </button>
            </div>
          </div>

          {/* SVG Trend Line Canvas */}
          <div className="relative flex justify-center py-2 h-52 overflow-hidden bg-neutral-50/50 rounded-2xl border border-neutral-150">
            {loading ? (
              <div className="flex items-center justify-center text-xs text-neutral-450 font-mono">
                Compiling clinic coordinates...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center text-xs text-neutral-400 font-mono">
                No bookings cataloged.
              </div>
            ) : (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-neutral-350">
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f0f0f0" strokeWidth="1" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f0f0f0" strokeWidth="1" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />

                {pathD && (
                  <>
                    <path
                      d={`${pathD} L ${padding + (chartData.length - 1) * (width - padding * 2) / Math.max(chartData.length - 1, 1)},${height - padding} L ${padding},${height - padding} Z`}
                      fill="url(#analyticsGrad)"
                      opacity="0.15"
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </>
                )}

                <defs>
                  <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>

                {chartData.map((d, index) => {
                  const x = padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
                  const y = height - padding - (d.total / maxCount) * (height - padding * 2);
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#ffffff"
                        stroke="#0d9488"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#1e293b"
                        className="font-mono"
                      >
                        {d.total}
                      </text>
                      <text
                        x={x}
                        y={height - 12}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#94a3b8"
                      >
                        {d.label.length > 6 ? d.label.substring(5) : d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Report Exporter Sidepanel */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-sm text-neutral-900">Operations Report Dispatcher</h3>
              <p className="text-xs text-neutral-500 mt-1 font-medium">Export raw consultation registry datasets into standard CSV report files.</p>
            </div>

            <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Active Data Source</span>
                <span className="font-semibold text-sky-900">PenangHealth Clinical EHR</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Dataset Records</span>
                <span className="font-bold text-slate-900 font-mono">{appointments.length} Consultations</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <button
              onClick={handleExportDailyReport}
              className="w-full h-10 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Daily CSV Report
            </button>
            
            <button
              onClick={handleExportMonthlyReport}
              className="w-full h-10 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Monthly CSV Report
            </button>
          </div>
        </div>

      </div>

      {/* Structured data table below chart */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-sm text-neutral-900 mb-4">Detailed Analytics Grid</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200/60 text-[10px] font-bold text-neutral-500 uppercase tracking-widest pb-3">
                <th className="pb-2.5">{viewMode === 'daily' ? 'Date' : 'Month'}</th>
                <th className="pb-2.5">Total Bookings</th>
                <th className="pb-2.5">Completed consultations</th>
                <th className="pb-2.5">Cancelled / Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-neutral-450 font-mono">
                    Compiling rows...
                  </td>
                </tr>
              ) : chartData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-neutral-450">
                    No records logged in database.
                  </td>
                </tr>
              ) : (
                chartData.map((d, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-bold text-neutral-900">{d.label}</td>
                    <td className="py-2.5 font-mono font-bold text-teal-850">{d.total}</td>
                    <td className="py-2.5 font-mono text-emerald-800">{d.completed}</td>
                    <td className="py-2.5 font-mono text-red-800">{d.cancelled}</td>
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
