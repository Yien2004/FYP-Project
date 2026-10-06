import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  AlertCircle,
  FileCheck2,
  CalendarCheck2
} from 'lucide-react';
import { mockAppointments } from '../../data/mockData';
import { Appointment } from '../../types';

function getClinicFromEmail(email: string): string {
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

const getLoggedUserClinic = () => {
  const cached = localStorage.getItem("lifelink_user_clinic");
  if (cached) return cached;
  const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
  return getClinicFromEmail(loggedEmail);
};

export default function AppointmentsSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editModalApt, setEditModalApt] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTimeSlot, setEditTimeSlot] = useState('');
  const [editStatus, setEditStatus] = useState<string>('Pending');
  const [editRemarks, setEditRemarks] = useState('');
  
  // Telephone manual booking states
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakePatientName, setIntakePatientName] = useState('');
  const [intakePatientPhone, setIntakePatientPhone] = useState('');
  const [intakePatientEmail, setIntakePatientEmail] = useState('');
  const [intakeDoctorName, setIntakeDoctorName] = useState('');
  const [intakeDate, setIntakeDate] = useState('');
  const [intakeTimeSlot, setIntakeTimeSlot] = useState('10:00 AM');
  const [intakeRemarks, setIntakeRemarks] = useState('');
  const [clinicians, setClinicians] = useState<any[]>([]);

  const handleConfirmIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakePatientName || !intakePatientPhone || !intakeDate || !intakeDoctorName) {
      alert("Please fill in all required fields.");
      return;
    }

    const currentClinic = getLoggedUserClinic();
    const docObj = clinicians.find(c => c.name.toLowerCase() === intakeDoctorName.toLowerCase());
    const specialty = docObj ? docObj.specialty : "General Medicine";
    const doctorId = intakeDoctorName.toLowerCase().replace(/[^a-z0-9]/g, "-");

    const payload = {
      patientName: intakePatientName,
      patientEmail: intakePatientEmail || `phone-${intakePatientPhone}@lifelink.my`,
      patientId: `p-phone-${Date.now()}`,
      doctorId,
      doctorName: intakeDoctorName,
      specialty,
      doctorImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(intakeDoctorName)}&background=0d9488&color=fff`,
      date: intakeDate,
      timeSlot: intakeTimeSlot,
      status: "Approved",
      type: "In-Clinic",
      clinic: currentClinic || "General Clinic",
      symptoms: intakeRemarks || "Telephone Booking Triage"
    };

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        setAppointments(prev => [saved, ...prev]);
        setShowIntakeModal(false);
        setIntakePatientName('');
        setIntakePatientPhone('');
        setIntakePatientEmail('');
        setIntakeDoctorName('');
        setIntakeDate('');
        setIntakeRemarks('');
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to save phone appointment."}`);
      }
    } catch (err) {
      console.error("Failed to post manual intake appointment", err);
      alert("Network error: failed to submit phone booking.");
    }
  };
  const [selectedHospital, setSelectedHospital] = useState(() => {
    const isAdmin = localStorage.getItem('lifelink_user_role') === 'Admin';
    return isAdmin ? 'ALL' : getLoggedUserClinic();
  });
  const isAdmin = localStorage.getItem('lifelink_user_role') === 'Admin';

  const handleOpenEditModal = (apt: Appointment) => {
    setEditModalApt(apt);
    setEditDate(apt.date || (apt.dateTime ? apt.dateTime.split(' ')[0] : ''));
    setEditTimeSlot(apt.timeSlot || (apt.dateTime ? apt.dateTime.split(' ')[1] : '10:00 AM'));
    setEditStatus(apt.status);
    setEditRemarks(apt.remarks || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalApt) return;

    const payload = {
      date: editDate,
      timeSlot: editTimeSlot,
      status: editStatus,
      remarks: editRemarks,
      symptoms: editRemarks
    };

    try {
      const res = await fetch(`/api/appointments/${editModalApt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAppointments(prev => prev.map(ap => 
          ap.id === editModalApt.id 
            ? { 
                ...ap, 
                date: editDate, 
                timeSlot: editTimeSlot, 
                dateTime: `${editDate} ${editTimeSlot}`,
                status: editStatus, 
                remarks: editRemarks 
              } 
            : ap
        ));
        setEditModalApt(null);
      }
    } catch (err) {
      console.error("Failed to save rescheduled appointment", err);
    }
  };

  const handleToggleDone = async (apt: Appointment) => {
    const nextStatus = apt.status === 'Done' ? 'Approved' : 'Done';
    try {
      const res = await fetch(`/api/appointments/${apt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(ap => 
          ap.id === apt.id 
            ? { ...ap, status: nextStatus } 
            : ap
        ));
      }
    } catch (err) {
      console.error("Failed to toggle done status", err);
    }
  };

  React.useEffect(() => {
    const currentClinic = getLoggedUserClinic();

    fetch("/api/appointments")
      .then(res => res.json())
      .then(data => {
        let mapped = data;
        if (localStorage.getItem('lifelink_user_role') !== 'Admin' && currentClinic) {
          mapped = data.filter((ap: any) => (ap.clinic || ap.hospital || '').toLowerCase() === currentClinic.toLowerCase());
        }
        setAppointments(mapped.map((ap: any) => ({ ...ap, checked: false })));
      })
      .catch(err => {
        console.warn("Failed to load appointments, using mock data.", err);
        setAppointments(mockAppointments.map(ap => ({ ...ap, checked: false })));
      });

    fetch("/api/clinicians")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClinicians(data);
        }
      })
      .catch(err => console.warn("Failed to load clinicians list", err));
  }, []);

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Approved' | 'Pending' | 'Rescheduled' | 'Rejected'>('ALL');

  // Mini-calendar state tracking current month dynamically
  const now = React.useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = monthNames[currentMonthIdx];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const numDays = getDaysInMonth(currentYear, currentMonthIdx);
  const daysInMonth = Array.from({ length: numDays }, (_, idx) => idx + 1);
  const startDaySpacerCount = new Date(currentYear, currentMonthIdx, 1).getDay();
  const spacers = Array.from({ length: startDaySpacerCount }, (_, idx) => idx);

  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

  const scheduledDays = React.useMemo(() => {
    const days: number[] = [];
    appointments.forEach(ap => {
      const dateStr = ap.date || (ap.dateTime ? ap.dateTime.split(' ')[0] : '');
      if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          if (year === currentYear && month === currentMonthIdx) {
            days.push(day);
          }
        }
      }
    });
    return Array.from(new Set(days));
  }, [appointments, currentYear, currentMonthIdx]);

  const handleSelectAll = (checked: boolean) => {
    setAppointments(prev => prev.map(ap => ({ ...ap, checked })));
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setAppointments(prev => prev.map(ap => ap.id === id ? { ...ap, checked } : ap));
  };

  // Bulk Status Modification Triggers
  const handleBulkStatusChange = async (status: 'Approved' | 'Rescheduled' | 'Rejected') => {
    const checkedApts = appointments.filter(ap => ap.checked);
    for (const apt of checkedApts) {
      try {
        await fetch(`/api/appointments/${apt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        });
      } catch (err) {
        console.error("Failed to update status on server for", apt.id, err);
      }
    }
    setAppointments(prev => prev.map(ap => {
      if (ap.checked) {
        return { ...ap, status, checked: false };
      }
      return ap;
    }));
  };

  const filtered = appointments.filter(ap => {
    const matchesStatus = filterStatus === 'ALL' || ap.status === filterStatus;
    if (!matchesStatus) return false;

    const matchesHospital = selectedHospital === 'ALL' || 
      (ap.clinic || ap.hospital || '').toLowerCase().trim() === selectedHospital.toLowerCase().trim();
    if (!matchesHospital) return false;

    if (selectedDay !== null) {
      const dateStr = ap.date || (ap.dateTime ? ap.dateTime.split(' ')[0] : '');
      if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          return year === currentYear && month === currentMonthIdx && day === selectedDay;
        }
      }
      return false;
    }
    return true;
  }).sort((a, b) => {
    const isAPriority = a.timeSlot === "Priority Triage";
    const isBPriority = b.timeSlot === "Priority Triage";
    if (isAPriority && !isBPriority) return -1;
    if (!isAPriority && isBPriority) return 1;
    return 0;
  });

  const checkedCount = appointments.filter(ap => ap.checked).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-neutral-800 select-none">
      
      {/* Left 2 Columns: Large Table with batch actions */}
      <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        
        {/* Header containing action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Patient Scheduling Matrix</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-neutral-500">
                {selectedDay !== null 
                  ? `Appointments for ${selectedDay} ${currentMonthName} ${currentYear}`
                  : "All Scheduled Appointments"
                }
              </p>
              {selectedDay !== null && (
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60 cursor-pointer"
                >
                  Show All Dates
                </button>
              )}
            </div>
          </div>

          {/* Quick tab filter & Hospital Selector */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!isAdmin && (
              <button
                onClick={() => setShowIntakeModal(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer h-9 shrink-0"
              >
                <Plus className="w-4 h-4" /> Telephone Booking
              </button>
            )}
            {isAdmin && (
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 cursor-pointer"
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
            )}

            <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold shrink-0">
              {(['ALL', 'Pending', 'Approved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    filterStatus === st
                      ? 'bg-white text-neutral-950 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action controllers for checked rows */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-90 bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
          <div className="text-xs text-neutral-600 font-medium">
            {checkedCount === 0 ? (
              <span className="text-neutral-400">Select rows on left to perform bulk triage actions.</span>
            ) : (
              <span><strong className="text-neutral-900 font-bold">{checkedCount} row(s)</strong> selected for batch status modification.</span>
            )}
          </div>

          <div className="flex gap-2 text-xs font-bold leading-5">
            <button
              onClick={() => handleBulkStatusChange('Approved')}
              disabled={checkedCount === 0}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-emerald-705 ${
                checkedCount > 0 
                  ? 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-95 cursor-pointer' 
                  : 'bg-neutral-100 border border-neutral-200 text-neutral-400 opacity-60'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Approve Select
            </button>
            <button
              onClick={() => handleBulkStatusChange('Rescheduled')}
              disabled={checkedCount === 0}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-amber-705 ${
                checkedCount > 0 
                  ? 'bg-amber-50 border border-amber-200 hover:bg-amber-100 active:scale-95 cursor-pointer' 
                  : 'bg-neutral-100 border border-neutral-200 text-neutral-400 opacity-60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Reschedule Select
            </button>
            <button
              onClick={() => handleBulkStatusChange('Rejected')}
              disabled={checkedCount === 0}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-red-705 ${
                checkedCount > 0 
                  ? 'bg-red-50 border border-red-200 hover:bg-red-100 active:scale-95 cursor-pointer' 
                  : 'bg-neutral-100 border border-neutral-200 text-neutral-400 opacity-60'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              Reject Select
            </button>
          </div>
        </div>

        {/* Primary Scheduling Grid Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 text-xs text-neutral-400 font-bold uppercase tracking-wider pb-2">
                <th className="pb-3 pl-2">
                  <input
                    type="checkbox"
                    id="table-select-all"
                    checked={appointments.length > 0 && appointments.every(ap => ap.checked)}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-neutral-300 text-neutral-900 focus:outline-none w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="pb-3 text-left">Patient Details</th>
                <th className="pb-3 text-left">Consult Date & Time</th>
                <th className="pb-3">Clinical Specialty</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 pr-2">Diagnostic Remarks</th>
                <th className="pb-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-neutral-400 font-sans">
                    No scheduled outpatient consults match status filters.
                  </td>
                </tr>
              ) : (
                filtered.map((ap) => {
                  const initials = ap.patientName.split(' ').map(n => n[0]).join('');
                  const isAppr = ap.status === 'Approved';
                  const isPend = ap.status === 'Pending';
                  const isResc = ap.status === 'Rescheduled';
                  const isReje = ap.status === 'Rejected';
                  const isDone = ap.status === 'Done';
                  const isMiss = ap.status === 'Missing';
                  const statusColors = isAppr 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : isPend 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : isResc 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : isDone
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : isMiss
                            ? 'bg-red-55 text-red-705 border-red-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200';

                  return (
                    <tr key={ap.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 pl-2">
                        <input
                          type="checkbox"
                          id={`table-select-row-${ap.id}`}
                          checked={ap.checked || false}
                          onChange={(e) => handleSelectRow(ap.id, e.target.checked)}
                          className="rounded border-neutral-300 text-neutral-900 focus:outline-none w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {ap.patientAvatar ? (
                            <img src={ap.patientAvatar} alt={ap.patientName} className="w-8 h-8 rounded-full object-cover border border-neutral-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center border border-red-200">
                               {initials}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                              {ap.patientName}
                              {ap.timeSlot === "Priority Triage" && (
                                <span className="bg-red-50 text-red-700 border border-red-200 text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider animate-pulse shrink-0">EMERGENCY PRIORITY</span>
                              )}
                              {ap.checkedIn && (
                                <span className="bg-emerald-150 text-emerald-800 text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider scale-90 origin-left">CHECKED IN</span>
                              )}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-sans">Authorized: {ap.doctorName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-mono font-bold text-neutral-700 whitespace-nowrap">
                        {ap.dateTime || `${ap.date} ${ap.timeSlot}`}
                      </td>
                      <td className="py-4 text-xs font-semibold text-neutral-600 whitespace-nowrap">
                        {ap.specialty}
                      </td>
                      <td className="py-4 text-center whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${statusColors}`}>
                          {ap.status}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-neutral-500 max-w-xs pr-2 truncate" title={ap.remarks}>
                        {ap.remarks}
                      </td>
                      <td className="py-4 text-right pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleDone(ap)}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                              ap.status === 'Done'
                                ? 'bg-neutral-200 text-neutral-750 hover:bg-neutral-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {ap.status === 'Done' ? 'Not Done' : 'Done'}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(ap)}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-850 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                          >
                            Reschedule
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: Calendar and Slots */}
      <div className="space-y-6">
        {/* Doctor Schedule Calendar Card */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
            <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              <CalendarCheck2 className="w-4.5 h-4.5 text-neutral-400" />
              Doctor Schedule Grid
            </h4>
            <span className="text-[11px] font-bold text-neutral-500 font-mono">{currentMonthName} {currentYear}</span>
          </div>

          {/* Calendar Table Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-600 mb-3 border-b border-neutral-50 pb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => (
              <span key={index} className="font-bold text-[10px] text-neutral-400">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Dynamic starting spacers */}
            {spacers.map((_, idx) => (
              <span key={`spacer-${idx}`} className="p-1.5 text-transparent"></span>
            ))}
            
            {daysInMonth.map((day) => {
              const isScheduled = scheduledDays.includes(day);
              const isSelected = selectedDay === day;
              
              return (
                <button
                  key={day}
                  id={`calendar-day-btn-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`p-1.5 font-bold rounded-lg relative text-xs flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white font-extrabold shadow-xs'
                      : 'text-neutral-700 hover:bg-neutral-50 bg-white border border-transparent'
                  }`}
                >
                  <span>{day}</span>
                  {isScheduled && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {editModalApt && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-xl overflow-hidden">
            
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <h4 className="font-extrabold text-sm text-neutral-900">Reschedule Outpatient Booking</h4>
                <p className="text-[10px] text-neutral-450 mt-0.5">Patient: {editModalApt.patientName}</p>
              </div>
              <button 
                onClick={() => setEditModalApt(null)}
                className="text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Consult Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9 font-bold font-mono"
                />
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Consult Time Slot</label>
                <select
                  value={editTimeSlot}
                  onChange={(e) => setEditTimeSlot(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9 font-bold"
                >
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'].map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9 font-bold"
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Done">Done</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Diagnostic Remarks</label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl p-3.5 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 leading-relaxed font-sans placeholder:text-neutral-400"
                  placeholder="Enter symptoms or diagnostic remarks..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditModalApt(null)}
                  className="bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-neutral-900 hover:bg-neutral-850 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {!isAdmin && showIntakeModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-xl overflow-hidden">
            
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <h4 className="font-extrabold text-sm text-neutral-900">☎️ Register Telephone Call Booking</h4>
                <p className="text-[10px] text-neutral-450 mt-0.5">Staff manual intake triage reservation.</p>
              </div>
              <button 
                onClick={() => setShowIntakeModal(false)}
                className="text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmIntakeSubmit} className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Patient Name *</label>
                <input
                  type="text"
                  value={intakePatientName}
                  onChange={(e) => setIntakePatientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Patient Phone Number *</label>
                <input
                  type="tel"
                  value={intakePatientPhone}
                  onChange={(e) => setIntakePatientPhone(e.target.value)}
                  placeholder="e.g. 0123456789"
                  required
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Patient Email (Optional)</label>
                <input
                  type="email"
                  value={intakePatientEmail}
                  onChange={(e) => setIntakePatientEmail(e.target.value)}
                  placeholder="e.g. patient@gmail.com"
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Attending Doctor *</label>
                <select
                  value={intakeDoctorName}
                  onChange={(e) => setIntakeDoctorName(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-bold"
                >
                  <option value="">-- Select Clinician --</option>
                  {clinicians
                    .filter(c => !selectedHospital || selectedHospital === 'ALL' || c.hospital.toLowerCase() === selectedHospital.toLowerCase())
                    .map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.specialty})</option>
                    ))
                  }
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Booking Date *</label>
                <input
                  type="date"
                  value={intakeDate}
                  onChange={(e) => setIntakeDate(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-bold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Time Slot *</label>
                <select
                  value={intakeTimeSlot}
                  onChange={(e) => setIntakeTimeSlot(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-bold"
                >
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'].map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Triage Symptoms / Notes</label>
                <textarea
                  rows={2}
                  value={intakeRemarks}
                  onChange={(e) => setIntakeRemarks(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl p-3 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 leading-relaxed font-sans placeholder:text-neutral-400"
                  placeholder="Enter main symptoms reported over phone..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Book Appointment
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
