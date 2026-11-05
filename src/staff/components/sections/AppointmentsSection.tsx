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
  CalendarCheck2,
  Lock,
  Phone,
  UserCheck
} from 'lucide-react';
import { mockAppointments } from '../../data/mockData';
import { Appointment } from '../../types';
import { 
  getStaffAccountByEmail, 
  getFacilityIdByHospital, 
  matchesSpecialty,
  getDepartmentQueueCode,
  formatQueueNumber
} from '../../../data/staffAccounts';
import { allPantaiDoctors } from '../../../data/pantaiHospitalsData';

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
  
  // User & role info
  const loggedEmail = (localStorage.getItem("lifelink_user_email") || localStorage.getItem("carepoint_user_email") || '').toLowerCase();
  const staffAccount = getStaffAccountByEmail(loggedEmail);
  const isSuperAdmin = staffAccount?.role === 'super_admin' || loggedEmail === 'superadmin@pantaicare.com' || loggedEmail === 'superadmin@gmail.com';
  const isDoctor = staffAccount?.role?.toLowerCase() === "doctor" || loggedEmail.startsWith("dr_") || (localStorage.getItem("carepoint_user_role") || "").toLowerCase() === "doctor";
  const isGeneralConsultant = loggedEmail === "doctor@hospital.com" || 
                              (staffAccount?.name || "").toLowerCase().includes("consultant (main hospital)");
  const isSpecificDoctor = isDoctor && !isGeneralConsultant;
  const loggedDoctorName = staffAccount?.name || localStorage.getItem("lifelink_user_name") || localStorage.getItem("carepoint_user_name") || "";
  const doctorDept = staffAccount?.department || localStorage.getItem("lifelink_user_department") || "";

  // Intake time slots matching patient 1-hour consultation slots
  const INTAKE_TIME_SLOTS: Array<{ slot: string; startHour: number; endHour: number; isBuffer: boolean; isLunch: boolean }> = [
    { slot: '08:00 - 09:00', startHour: 8, endHour: 9, isBuffer: false, isLunch: false },
    { slot: '09:00 - 10:00', startHour: 9, endHour: 10, isBuffer: false, isLunch: false },
    { slot: '10:00 - 11:00', startHour: 10, endHour: 11, isBuffer: false, isLunch: false },
    { slot: '11:00 - 12:00', startHour: 11, endHour: 12, isBuffer: true, isLunch: false },
    { slot: '13:00 - 14:00', startHour: 13, endHour: 14, isBuffer: false, isLunch: false },
    { slot: '14:00 - 15:00', startHour: 14, endHour: 15, isBuffer: false, isLunch: false },
    { slot: '15:00 - 16:00', startHour: 15, endHour: 16, isBuffer: false, isLunch: false },
    { slot: '16:00 - 17:00', startHour: 16, endHour: 17, isBuffer: true, isLunch: false },
  ];

  // Manual booking states (Walk-in & Telephone)
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeType, setIntakeType] = useState<'walk-in' | 'phone'>('walk-in');
  const [intakePatientName, setIntakePatientName] = useState('');
  const [intakePatientPhone, setIntakePatientPhone] = useState('');
  const [intakePatientEmail, setIntakePatientEmail] = useState('');
  const [intakeDoctorName, setIntakeDoctorName] = useState(loggedDoctorName || '');
  const [intakeDate, setIntakeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [intakeTimeSlot, setIntakeTimeSlot] = useState('10:00 - 11:00');
  const [intakeRemarks, setIntakeRemarks] = useState('');
  const [clinicians, setClinicians] = useState<any[]>([]);
  const [allBookingsForSlots, setAllBookingsForSlots] = useState<any[]>([]);

  const handleOpenIntakeModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setIntakeType('walk-in');
    setIntakeDate(today);
    if (isSpecificDoctor && loggedDoctorName) {
      setIntakeDoctorName(loggedDoctorName);
    } else {
      setIntakeDoctorName('');
    }
    // Refresh latest appointments from DB so slot counts are instantly up to date with patient bookings
    fetch("/api/appointments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllBookingsForSlots(data);
        }
      })
      .catch(() => {});
    setShowIntakeModal(true);
  };

  const getSlotAvailability = (slotStr: string, date: string, docName: string, excludeAptId?: string | number) => {
    const slotDef = INTAKE_TIME_SLOTS.find(s => s.slot === slotStr) || {
      slot: slotStr,
      startHour: parseInt(slotStr.split(':')[0] || '10', 10),
      endHour: parseInt(slotStr.split(':')[0] || '10', 10) + 1,
      isBuffer: slotStr.startsWith('11:') || slotStr.startsWith('16:'),
      isLunch: slotStr.startsWith('12:')
    };

    const baseCapacity = slotDef.isLunch ? 0 : slotDef.isBuffer ? 2 : 3;
    if (!date) return { remaining: baseCapacity, max: baseCapacity, dynamicCapacity: baseCapacity, booked: 0, isUnavailable: false, reason: '' };

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = date === todayStr;
    const isPast = date < todayStr;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotStartMinutes = slotDef.startHour * 60;
    const slotEndMinutes = slotDef.endHour * 60;

    let dynamicCapacity = baseCapacity;
    let reason = '';

    if (slotDef.isLunch) {
      dynamicCapacity = 0;
      reason = 'Lunch Break (Closed)';
    } else if (isPast) {
      dynamicCapacity = 0;
      reason = 'Expired (Time Passed)';
    } else if (isToday) {
      if (now.getHours() >= 17) {
        dynamicCapacity = 0;
        reason = 'Clinic Closed for Today';
      } else if (currentMinutes >= slotEndMinutes) {
        dynamicCapacity = 0;
        reason = 'Expired (Time Passed)';
      } else if (currentMinutes >= slotStartMinutes) {
        const elapsed = currentMinutes - slotStartMinutes;
        if (slotDef.isBuffer) {
          if (elapsed <= 15) {
            dynamicCapacity = 1;
          } else {
            dynamicCapacity = 0;
            reason = 'Expired (Time Passed)';
          }
        } else {
          if (elapsed <= 15) {
            dynamicCapacity = 2;
          } else if (elapsed <= 30) {
            dynamicCapacity = 1;
          } else {
            dynamicCapacity = 0;
            reason = 'Expired (Time Passed)';
          }
        }
      }
    }

    const cleanDoc = (docName || '').toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
    const sourceList = allBookingsForSlots.length > 0 ? allBookingsForSlots : appointments;
    const booked = sourceList.filter(ap => {
      if (excludeAptId && String(ap.id) === String(excludeAptId)) return false;
      if (ap.status === 'Cancelled' || ap.status === 'CANCELLED' || ap.status === 'Rejected') return false;
      const apDate = ap.date || (ap.dateTime ? ap.dateTime.split(' ')[0] : '');
      if (apDate !== date) return false;

      const apDoc = (ap.doctorName || '').toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
      const docMatches = !cleanDoc || apDoc === cleanDoc || apDoc.includes(cleanDoc) || cleanDoc.includes(apDoc);
      if (!docMatches) return false;

      const apSlot = (ap.timeSlot || (ap.dateTime ? ap.dateTime.split(' ')[1] : '') || '').trim().toLowerCase();
      const targetSlot = slotStr.trim().toLowerCase();
      if (apSlot === targetSlot || apSlot.includes(targetSlot) || targetSlot.includes(apSlot)) return true;
      const startHour = targetSlot.split("-")[0].trim().toLowerCase();
      if (startHour && apSlot.startsWith(startHour)) return true;
      return false;
    }).length;

    const remaining = Math.max(0, dynamicCapacity - booked);
    const isUnavailable = remaining === 0;
    if (isUnavailable && !reason) {
      reason = 'Fully Booked';
    }

    return { 
      remaining, 
      max: baseCapacity, 
      dynamicCapacity, 
      booked, 
      isUnavailable, 
      reason 
    };
  };

  // Auto-select valid slot when opening modal or changing date/doctor
  React.useEffect(() => {
    if (!showIntakeModal) return;
    const docTarget = (isSpecificDoctor && loggedDoctorName) ? loggedDoctorName : intakeDoctorName;
    const curAvailability = getSlotAvailability(intakeTimeSlot, intakeDate, docTarget);
    if (curAvailability.isUnavailable) {
      const firstAvailable = INTAKE_TIME_SLOTS.find(s => {
        const a = getSlotAvailability(s.slot, intakeDate, docTarget);
        return !a.isUnavailable;
      });
      if (firstAvailable) {
        setIntakeTimeSlot(firstAvailable.slot);
      }
    }
  }, [intakeDate, intakeDoctorName, showIntakeModal, allBookingsForSlots]);

  React.useEffect(() => {
    if (!editModalApt) return;
    const curAvailability = getSlotAvailability(
      editTimeSlot, 
      editDate, 
      editModalApt.doctorName || '', 
      editModalApt.id
    );
    if (curAvailability.isUnavailable) {
      const firstAvailable = INTAKE_TIME_SLOTS.find(s => {
        const a = getSlotAvailability(s.slot, editDate, editModalApt.doctorName || '', editModalApt.id);
        return !a.isUnavailable;
      });
      if (firstAvailable) {
        setEditTimeSlot(firstAvailable.slot);
      }
    }
  }, [editDate, editModalApt]);

  const handleConfirmIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDoctor = (isSpecificDoctor && loggedDoctorName) ? loggedDoctorName : intakeDoctorName;
    if (!intakePatientName || !intakePatientPhone || !intakeDate || !finalDoctor) {
      alert("Please fill in all required fields.");
      return;
    }

    const { remaining, isUnavailable, reason } = getSlotAvailability(intakeTimeSlot, intakeDate, finalDoctor);
    if (isUnavailable || remaining === 0) {
      alert(`The selected time slot (${intakeTimeSlot}) is unavailable (${reason || 'Fully Booked'}). Please choose another time.`);
      return;
    }

    const currentClinic = staffAccount?.hospital || getLoggedUserClinic();
    const docObj = clinicians.find(c => c.name.toLowerCase() === finalDoctor.toLowerCase());
    const specialty = docObj ? docObj.specialty : (staffAccount?.department || "General Medicine");
    const doctorId = finalDoctor.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const isWalkIn = intakeType === 'walk-in';
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const isToday = intakeDate === todayStr;

    const deptCode = getDepartmentQueueCode(specialty || finalDoctor);
    const sameDayDeptApts = appointments.filter(apt => {
      if (apt.date !== intakeDate) return false;
      if ((apt.status || '').toLowerCase() === "cancelled") return false;
      const aDeptCode = getDepartmentQueueCode(apt.specialty || apt.remarks || apt.symptoms || apt.doctorName);
      return aDeptCode === deptCode;
    });

    let maxSeq = 0;
    for (const a of sameDayDeptApts) {
      const qStr = (a.queueNumber || '').replace(/^#/, '');
      const m = qStr.match(/Q-(\d+)/i);
      if (m) {
        const numPart = m[1];
        const deptPrefix = String(deptCode);
        if (numPart.startsWith(deptPrefix) && numPart.length === deptPrefix.length + 2) {
          const seq = parseInt(numPart.slice(deptPrefix.length), 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      }
    }
    const nextQueueNumber = formatQueueNumber(deptCode, maxSeq + 1);

    const payload = {
      patientName: intakePatientName,
      patientPhone: intakePatientPhone,
      patientEmail: intakePatientEmail || (isWalkIn ? `walkin-${intakePatientPhone}@lifelink.my` : `phone-${intakePatientPhone}@lifelink.my`),
      doctorId,
      doctorName: finalDoctor,
      specialty,
      doctorImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(finalDoctor)}&background=0d9488&color=fff`,
      date: intakeDate,
      timeSlot: intakeTimeSlot,
      status: isWalkIn && isToday ? "Checked In" : "Approved",
      checkedIn: isWalkIn && isToday,
      checkInTime: isWalkIn && isToday ? nowTimeStr : undefined,
      type: isWalkIn ? "Walk-in" : "In-Clinic",
      clinic: currentClinic || "General Clinic",
      symptoms: intakeRemarks || (isWalkIn ? "Walk-in Patient Triage" : "Telephone Booking Triage"),
      queueNumber: nextQueueNumber
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
        setAllBookingsForSlots(prev => [saved, ...prev]);
        setShowIntakeModal(false);
        setIntakePatientName('');
        setIntakePatientPhone('');
        setIntakePatientEmail('');
        if (!isDoctor) setIntakeDoctorName('');
        setIntakeRemarks('');
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to save appointment."}`);
      }
    } catch (err) {
      console.error("Failed to post manual intake appointment", err);
      alert("Network error: failed to submit booking.");
    }
  };
  const [selectedHospital, setSelectedHospital] = useState(() => {
    if (isSuperAdmin) return 'ALL';
    if (staffAccount?.hospital) return staffAccount.hospital;
    return localStorage.getItem('lifelink_user_clinic') || 'ALL';
  });
  const isAdmin = (localStorage.getItem('lifelink_user_role') || '').toLowerCase() === 'admin' || isSuperAdmin;

  const handleOpenEditModal = (apt: Appointment) => {
    setEditModalApt(apt);
    setEditDate(apt.date || (apt.dateTime ? apt.dateTime.split(' ')[0] : ''));
    setEditTimeSlot(apt.timeSlot || (apt.dateTime ? apt.dateTime.split(' ')[1] : '10:00 - 11:00'));
    setEditStatus(apt.status);
    setEditRemarks(apt.remarks || '');

    fetch("/api/appointments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllBookingsForSlots(data);
        }
      })
      .catch(() => {});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalApt) return;

    if (!editDate || !editTimeSlot) {
      alert("Please select a date and time slot.");
      return;
    }

    const { isUnavailable, reason } = getSlotAvailability(
      editTimeSlot, 
      editDate, 
      editModalApt.doctorName || '', 
      editModalApt.id
    );

    if (isUnavailable) {
      alert(`The selected time slot (${editTimeSlot}) is unavailable (${reason || 'Fully Booked'}). Please choose an active time slot.`);
      return;
    }

    if (!window.confirm("Are you sure you want to update this appointment's schedule and status?")) {
      return;
    }

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
        const updatedItem = { 
          ...editModalApt, 
          date: editDate, 
          timeSlot: editTimeSlot, 
          dateTime: `${editDate} ${editTimeSlot}`,
          status: editStatus, 
          remarks: editRemarks,
          symptoms: editRemarks
        };
        setAppointments(prev => prev.map(ap => ap.id === editModalApt.id ? updatedItem : ap));
        setAllBookingsForSlots(prev => prev.map(ap => ap.id === editModalApt.id ? updatedItem : ap));
        setEditModalApt(null);
      }
    } catch (err) {
      console.error("Failed to save rescheduled appointment", err);
    }
  };

  const isSlotOverdue = (dateStr?: string, timeSlot?: string) => {
    if (!dateStr) return false;
    const now = new Date();
    const myFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = myFormatter.formatToParts(now);
    const p: Record<string, string> = {};
    parts.forEach(x => { p[x.type] = x.value; });
    const todayStr = `${p.year}-${p.month}-${p.day}`;
    if (dateStr < todayStr) return true;
    if (dateStr > todayStr) return false;

    // dateStr === todayStr
    if (!timeSlot) return false;
    const currentMins = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
    const dashSplit = timeSlot.split(/[-–—]/);
    const targetStr = (dashSplit.length > 1 ? dashSplit[1] : dashSplit[0]).trim();
    const isPM = /pm/i.test(targetStr);
    const isAM = /am/i.test(targetStr);
    const match = targetStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      return currentMins >= (h * 60 + m);
    }
    return false;
  };

  const resolveAutoStatus = (ap: any): string => {
    if (ap.status === 'Cancelled' || ap.status === 'Rejected') {
      return 'Cancelled';
    }
    if (ap.status === 'Done' || ap.status === 'Completed') return 'Completed';

    const dateStr = ap.date || (ap.dateTime ? ap.dateTime.split(' ')[0] : '');
    const slotStr = ap.timeSlot || (ap.dateTime ? ap.dateTime.split(' ')[1] : '');
    const overdue = isSlotOverdue(dateStr, slotStr);

    if (overdue) {
      if (ap.checkedIn || ap.status === 'Checked In' || ap.status === 'In Consultation') {
        return 'Completed';
      }
      return 'Absent';
    }

    if (ap.checkedIn || ap.status === 'Checked In') return 'Checked In';
    if (ap.status === 'In Consultation') return 'In Consultation';
    if (ap.status === 'Pending') return 'Pending';
    if (ap.status === 'Rescheduled') return 'Rescheduled';
    return ap.status || 'Approved';
  };

  React.useEffect(() => {
    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const staffAccount = getStaffAccountByEmail(loggedEmail);
    const currentClinic = staffAccount?.hospital || getLoggedUserClinic();
    const currentDepartment = staffAccount?.department || localStorage.getItem("lifelink_user_department") || "All";
    const currentFacilityId = staffAccount?.facility_id || getFacilityIdByHospital(currentClinic);
    const isDoctor = staffAccount?.role?.toLowerCase() === "doctor" || loggedEmail.toLowerCase().startsWith("dr_");
    const isGeneralConsultant = loggedEmail.toLowerCase() === "doctor@hospital.com" || 
                                currentDepartment === "All" || 
                                (staffAccount?.name || "").toLowerCase().includes("consultant (main hospital)");
    const isSpecificDoctor = isDoctor && !isGeneralConsultant;
    const doctorName = isSpecificDoctor ? staffAccount?.name : "";

    fetch("/api/appointments")
      .then(res => res.json())
      .then(data => {
        let mapped = (Array.isArray(data) ? data : []).map((ap: any) => {
          const effective = resolveAutoStatus(ap);
          return { ...ap, status: effective };
        });
        const isAdmin = (localStorage.getItem('lifelink_user_role')?.toLowerCase() === 'admin') || isSuperAdmin;
        if (isAdmin && !isSuperAdmin) {
          // Branch Admin: strictly scope to the admin's bound facility_id
          if (currentFacilityId) {
            mapped = mapped.filter((ap: any) => {
              const aptFacilityId = ap.facility_id ? Number(ap.facility_id) : getFacilityIdByHospital(ap.clinic || ap.hospital);
              return aptFacilityId === currentFacilityId;
            });
          }
        } else if (!isAdmin && currentClinic) {
          mapped = mapped.filter((ap: any) => {
            // 1. Hospital / Facility match
            const aptFacilityId = ap.facility_id ? Number(ap.facility_id) : getFacilityIdByHospital(ap.clinic || ap.hospital);
            if (aptFacilityId !== currentFacilityId) return false;

            // 2. Department match
            if (currentDepartment !== 'All' && !matchesSpecialty(currentDepartment, ap.specialty)) {
              return false;
            }

            // 3. Doctor match (only if logged in as a specific doctor desk)
            if (isSpecificDoctor && doctorName) {
              const docClean = doctorName.toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, "").trim();
              const aptDoc = (ap.doctorName || "").toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, "").trim();
              const aptDocEmail = (ap.doctorEmail || "").toLowerCase();
              const isMatch = (
                aptDoc.includes(docClean) || 
                docClean.includes(aptDoc) || 
                (aptDocEmail && aptDocEmail === loggedEmail.toLowerCase())
              );
              if (!isMatch) return false;
            }

            return true;
          });
        }
        setAppointments(mapped.map((ap: any) => ({ ...ap, status: resolveAutoStatus(ap), checked: false })));
      })
      .catch(err => {
        console.warn("Failed to load appointments, using mock data.", err);
        setAppointments(mockAppointments.map(ap => ({ ...ap, status: resolveAutoStatus(ap), checked: false })));
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

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Approved' | 'Completed' | 'Absent' | 'Cancelled'>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');

  const loggedUserEmail = localStorage.getItem("lifelink_user_email") || '';
  const currentStaffAccount = React.useMemo(() => getStaffAccountByEmail(loggedUserEmail), [loggedUserEmail]);
  const currentHospitalClinic = currentStaffAccount?.hospital || getLoggedUserClinic();
  const currentHospitalFacId = currentStaffAccount?.facility_id || getFacilityIdByHospital(currentHospitalClinic);

  const hospitalDepartments = React.useMemo(() => {
    return Array.from(
      new Set(
        allPantaiDoctors
          .filter(doc => doc.hospital === currentHospitalClinic || getFacilityIdByHospital(doc.hospital) === currentHospitalFacId)
          .map(doc => doc.department || doc.specialty)
          .filter(Boolean)
      )
    ).sort();
  }, [currentHospitalClinic, currentHospitalFacId]);

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

  const isMatchCurrentDoctor = React.useCallback((ap: any) => {
    if (!isDoctor) return true;
    if (isGeneralConsultant) return true;

    const cleanDoc = (loggedDoctorName || staffAccount?.name || '').toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, '').trim();
    const aptDoc = (ap.doctorName || '').toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, '').trim();
    const aptDocEmail = ((ap as any).doctorEmail || '').toLowerCase();

    if (cleanDoc && (aptDoc.includes(cleanDoc) || cleanDoc.includes(aptDoc))) return true;
    if (aptDocEmail && loggedEmail && aptDocEmail === loggedEmail) return true;

    if (doctorDept && doctorDept !== 'All' && matchesSpecialty(doctorDept, ap.specialty)) return true;

    return false;
  }, [isDoctor, isGeneralConsultant, loggedDoctorName, staffAccount, loggedEmail, doctorDept]);

  const matchesAppointmentFilters = React.useCallback((ap: any) => {
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'Completed' ? (ap.status === 'Completed' || ap.status === 'Done') :
       filterStatus === 'Absent' ? (ap.status === 'Absent' || ap.status === 'Missing') :
       filterStatus === 'Cancelled' ? (ap.status === 'Cancelled' || ap.status === 'Rejected') :
       ap.status === filterStatus);
    if (!matchesStatus) return false;

    // Do not show cancelled/rejected in calendar dots or active list if filter is ALL
    if (filterStatus === 'ALL' && (ap.status === 'Cancelled' || ap.status === 'Rejected')) {
      return false;
    }

    const aptFacilityId = (ap as any).facility_id ? Number((ap as any).facility_id) : getFacilityIdByHospital(ap.clinic || ap.hospital);
    const selFacilityId = selectedHospital === 'ALL' ? null : getFacilityIdByHospital(selectedHospital);

    const matchesHospital = selectedHospital === 'ALL' || 
      (aptFacilityId && selFacilityId ? aptFacilityId === selFacilityId : false) ||
      (ap.clinic || ap.hospital || '').toLowerCase().includes(selectedHospital.toLowerCase()) ||
      selectedHospital.toLowerCase().includes((ap.clinic || ap.hospital || '').toLowerCase());
    if (!matchesHospital) return false;

    // Department filter: only for non-doctors (doctors are scoped to their own department/patients)
    if (!isDoctor && selectedDepartment !== 'ALL' && !matchesSpecialty(selectedDepartment, ap.specialty)) {
      return false;
    }

    // Doctor filter
    if (!isMatchCurrentDoctor(ap)) return false;

    return true;
  }, [filterStatus, selectedHospital, isDoctor, selectedDepartment, isMatchCurrentDoctor]);

  const scheduledDays = React.useMemo(() => {
    const days: number[] = [];
    appointments.forEach(ap => {
      if (!matchesAppointmentFilters(ap)) return;

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
  }, [appointments, currentYear, currentMonthIdx, matchesAppointmentFilters]);

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

  const filtered = React.useMemo(() => {
    return appointments.filter(ap => {
      if (!matchesAppointmentFilters(ap)) return false;

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
  }, [appointments, selectedDay, currentYear, currentMonthIdx, matchesAppointmentFilters]);

    const checkedCount = appointments.filter(ap => ap.checked).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-neutral-800 select-none">
      
      {/* Left 2 Columns: Large Table with batch actions */}
      <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        
        {/* Header containing action buttons */}
        <div className="flex flex-col gap-4 border-b border-neutral-100 pb-5">
          {/* Row 1: Title, Department badge, Date, and Hospital info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-bold text-base text-neutral-900 whitespace-nowrap">Patient Scheduling Matrix</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono whitespace-nowrap">
                  Department: {staffAccount?.department || localStorage.getItem("lifelink_user_department") || 'General Medicine'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {selectedDay !== null 
                  ? `Appointments for ${selectedDay} ${currentMonthName} ${currentYear}`
                  : "All Scheduled Appointments"
                }
              </p>
            </div>

            {isSuperAdmin ? (
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 cursor-pointer"
              >
                <option value="ALL">All PantaiCare Facilities</option>
                <option value="Pantai Hospital Penang (Main Hospital)">Pantai Hospital Penang (Main Hospital)</option>
                <option value="Pantai Heart & Wellness Pavilion">Pantai Heart & Wellness Pavilion</option>
                <option value="Pantai Premier Clinic & Day Surgery">Pantai Premier Clinic & Day Surgery</option>
                <option value="Pantai Specialist Centre">Pantai Specialist Centre</option>
              </select>
            ) : isAdmin ? (
              <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700 h-9 shrink-0">
                <span className="truncate max-w-[260px]">{staffAccount?.hospital || "Branch Appointments"}</span>
              </div>
            ) : null}
          </div>

          {/* Row 2: Filter Toolbar (Department Selector + Status Buttons + Walk-in) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              {!isAdmin && (
                <button
                  onClick={handleOpenIntakeModal}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer h-9 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Walk-In / Phone Booking
                </button>
              )}

              {/* Department selector (Hidden for doctor accounts as scope is locked to their own department) */}
              {!isDoctor && (
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 font-bold outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 cursor-pointer min-w-[160px]"
                >
                  <option value="ALL">All Departments</option>
                  {hospitalDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-wrap gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold shrink-0">
              {(['ALL', 'Approved', 'Completed', 'Absent', 'Cancelled'] as const).map((st) => (
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

        {/* Primary Scheduling Grid Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-400 font-bold uppercase tracking-wider pb-2">
                <th className="py-3.5 pl-5 pr-4 text-left">Patient Details</th>
                <th className="py-3.5 px-4 text-left">Consult Date & Time</th>
                <th className="py-3.5 px-4 text-left">Doctor & Specialty</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-left">Diagnostic Remarks</th>
                <th className="py-3.5 pl-4 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400 font-sans">
                    No scheduled outpatient consults match status filters.
                  </td>
                </tr>
              ) : (
                filtered.map((ap) => {
                  const isCompleted = ap.status === 'Completed' || ap.status === 'Done';
                  const isAbsent = ap.status === 'Absent' || ap.status === 'Missing';
                  const isCancelled = ap.status === 'Cancelled' || ap.status === 'Rejected';
                  const isApproved = ap.status === 'Approved';
                  const isCheckedIn = ap.status === 'Checked In';
                  const isPending = ap.status === 'Pending';

                  const statusBadge = isCompleted
                    ? { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                    : isAbsent
                      ? { label: 'Absent', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                      : isCancelled
                        ? { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' }
                        : isCheckedIn
                          ? { label: 'Checked In', color: 'bg-teal-50 text-teal-700 border-teal-200' }
                          : isApproved
                            ? { label: 'Approved', color: 'bg-sky-50 text-sky-700 border-sky-200' }
                            : isPending
                              ? { label: 'Pending', color: 'bg-purple-50 text-purple-700 border-purple-200' }
                              : { label: ap.status, color: 'bg-neutral-100 text-neutral-600 border-neutral-200' };

                  return (
                    <tr key={ap.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-4 pl-5 pr-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-neutral-900 text-xs tracking-tight">
                              {ap.patientName}
                            </span>
                            {ap.queueNumber && (
                              <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                                {ap.queueNumber}
                              </span>
                            )}
                          </div>
                          {ap.timeSlot === "Priority Triage" && (
                            <div className="pt-0.5">
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider animate-pulse inline-block">
                                EMERGENCY PRIORITY
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-neutral-800 font-mono text-xs">
                            {ap.date || (ap.dateTime ? ap.dateTime.split(' ')[0] : '—')}
                          </div>
                          <div className="text-[11px] font-mono text-teal-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                            <span>{ap.timeSlot || (ap.dateTime ? ap.dateTime.split(' ').slice(1).join(' ') : '—')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="font-extrabold text-neutral-900 text-xs flex items-center gap-1.5">
                            <span>{ap.doctorName || 'Attending Specialist'}</span>
                          </div>
                          <div className="text-[11px] font-medium text-neutral-500">
                            {ap.specialty || (ap as any).department || 'Outpatient Clinic'}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-neutral-600 max-w-xs truncate" title={ap.remarks || 'No remarks recorded'}>
                        {ap.remarks || <span className="text-neutral-350">—</span>}
                      </td>
                      <td className="py-4 pl-4 pr-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(ap)}
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer border border-neutral-200/60 shadow-2xs"
                        >
                          Edit
                        </button>
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
                  onClick={() => setSelectedDay(selectedDay === day ? null : day)}
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
                <h4 className="font-extrabold text-sm text-neutral-900">Edit Outpatient Booking</h4>
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
              {/* Consultation Details: Editable Date & Time Slot */}
              <div className="space-y-3 font-sans">
                {editModalApt.doctorName && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attending Clinician</span>
                    <span className="font-bold text-slate-800">{editModalApt.doctorName}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Booking Date *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Time Slot *</label>
                    <span className="text-[10px] text-neutral-400 font-medium">Standard: 3 slots | Buffer: 2 slots</span>
                  </div>
                  <select
                    value={editTimeSlot}
                    onChange={(e) => setEditTimeSlot(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-bold font-mono"
                  >
                    {INTAKE_TIME_SLOTS.map(slotDef => {
                      const { remaining, max, isUnavailable, reason } = getSlotAvailability(
                        slotDef.slot, 
                        editDate, 
                        editModalApt.doctorName || '', 
                        editModalApt.id
                      );
                      return (
                        <option key={slotDef.slot} value={slotDef.slot} disabled={isUnavailable}>
                          {slotDef.slot} {editDate ? (isUnavailable ? `(${reason || '0 left'})` : `(${remaining} of ${max} slots left)`) : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Remaining Slots Indicator Banner in Edit Modal */}
                  {editDate && (
                    <div className="pt-1">
                      {(() => {
                        const { remaining, max, isUnavailable, reason } = getSlotAvailability(
                          editTimeSlot, 
                          editDate, 
                          editModalApt.doctorName || '', 
                          editModalApt.id
                        );
                        if (!isUnavailable && remaining > 0) {
                          return (
                            <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                              <span><strong>{remaining} of {max} slots left</strong> for {editTimeSlot} on {editDate}</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                              <span><strong>Slot Unavailable ({reason || '0 left'})</strong>. Please select an active time slot.</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">
                  Update Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9 font-bold cursor-pointer"
                >
                  <option value="Completed">Completed</option>
                  <option value="Absent">Absent (Missing / No-Show)</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Approved">Approved</option>
                  <option value="Checked In">Checked In</option>
                </select>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">
                  Diagnostic Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl p-3.5 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 leading-relaxed font-sans placeholder:text-neutral-400"
                  placeholder="Enter remarks or reason for status update..."
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
            
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <h4 className="font-extrabold text-sm text-neutral-900 flex items-center gap-1.5">
                  {intakeType === 'walk-in' ? (
                    <>
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Register Walk-In Patient Intake</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 text-sky-600" />
                      <span>Register Telephone Call Booking</span>
                    </>
                  )}
                </h4>
                <p className="text-[10px] text-neutral-450 mt-0.5">
                  {intakeType === 'walk-in' 
                    ? 'Frontdesk counter walk-in patient triage reservation.' 
                    : 'Staff manual telephone intake triage reservation.'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Intake Type Selector Tabs */}
            <div className="px-5 pt-4 pb-1">
              <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl text-xs font-bold text-neutral-600">
                <button
                  type="button"
                  onClick={() => {
                    setIntakeType('walk-in');
                    if (!intakeDate) setIntakeDate(new Date().toISOString().split('T')[0]);
                  }}
                  className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    intakeType === 'walk-in'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Walk-In Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIntakeType('phone')}
                  className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    intakeType === 'phone'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-sky-600" />
                  <span>Telephone Booking</span>
                </button>
              </div>
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

              {/* Attending Doctor Selection: Locked for Doctor accounts */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Attending Doctor *</label>
                {isSpecificDoctor && loggedDoctorName ? (
                  <select
                    value={loggedDoctorName}
                    disabled={true}
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 outline-none h-9 font-bold cursor-not-allowed opacity-90"
                  >
                    <option value={loggedDoctorName}>{loggedDoctorName} ({staffAccount?.department || 'Consultant'})</option>
                  </select>
                ) : (
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
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Booking Date *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={intakeDate}
                  onChange={(e) => setIntakeDate(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-bold font-mono"
                />
              </div>

              {/* Time Slot Selection with Remaining Slots */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Time Slot *</label>
                  <span className="text-[10px] text-neutral-400 font-medium">Standard: 3 slots | Buffer: 2 slots</span>
                </div>
                <select
                  value={intakeTimeSlot}
                  onChange={(e) => setIntakeTimeSlot(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9 font-bold font-mono"
                >
                  {INTAKE_TIME_SLOTS.map(slotDef => {
                    const docTarget = (isSpecificDoctor && loggedDoctorName) ? loggedDoctorName : intakeDoctorName;
                    const { remaining, max, isUnavailable, reason } = getSlotAvailability(slotDef.slot, intakeDate, docTarget);
                    return (
                      <option key={slotDef.slot} value={slotDef.slot} disabled={isUnavailable}>
                        {slotDef.slot} {intakeDate ? (isUnavailable ? `(${reason || '0 left'})` : `(${remaining} of ${max} slots left)`) : ''}
                      </option>
                    );
                  })}
                </select>

                {/* Remaining Slots Indicator Banner */}
                {intakeDate && (
                  <div className="pt-1">
                    {(() => {
                      const docTarget = (isSpecificDoctor && loggedDoctorName) ? loggedDoctorName : intakeDoctorName;
                      const { remaining, max, isUnavailable, reason } = getSlotAvailability(intakeTimeSlot, intakeDate, docTarget);
                      if (!isUnavailable && remaining > 0) {
                        return (
                          <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                            <span><strong>{remaining} of {max} slots left</strong> for {intakeTimeSlot} on {intakeDate}</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                            <span><strong>Slot Unavailable ({reason || '0 left'})</strong>. Please select an active time slot.</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Triage Symptoms / Notes</label>
                <textarea
                  rows={2}
                  value={intakeRemarks}
                  onChange={(e) => setIntakeRemarks(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-205 rounded-xl p-3 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 leading-relaxed font-sans placeholder:text-neutral-400"
                  placeholder={intakeType === 'walk-in' ? "Enter main symptoms reported at counter..." : "Enter main symptoms reported over phone..."}
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
                  className={`${
                    intakeType === 'walk-in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                  } text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5`}
                >
                  {intakeType === 'walk-in' ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Admit Walk-In</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-3.5 h-3.5" />
                      <span>Book Telephone Consult</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
