import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  ClipboardList,
  CheckCircle2,
  ChevronLeft,
  Building2,
  Stethoscope,
  Activity,
  Heart,
  Baby,
  Brain,
  Bone,
  Microscope,
  Check,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Search
} from "lucide-react";
import { Appointment, PatientProfile } from "../types";
import { allPantaiHospitals, allPantaiDoctors, PantaiHospital, PantaiDoctor } from "../data/pantaiHospitalsData";
import { getDepartmentQueueCode, formatQueueNumber } from "../data/staffAccounts";
import { specialties, Specialty, Doctor as DocPageDoctor } from "./DoctorsPage";

type Hospital = PantaiHospital;
export type AnyDoctor = PantaiDoctor | DocPageDoctor;
export type Doctor = AnyDoctor;

interface ScheduleAppointmentProps {
  onAddAppointment: (appointment: Appointment) => Promise<boolean | void> | void;
  prefilledApt?: Appointment | null;
  onSetScreen: (screen: string) => void;
  appointments: Appointment[];
  onCancelAppointment: (id: string) => void;
  onRescheduleAppointment: (id: string, date: string, timeSlot: string) => void;
  patientProfile?: PatientProfile;
  onUpdateProfile?: (profile: PatientProfile) => void;
}

// All 11 official Pantai Hospitals
const allFacilities: Hospital[] = allPantaiHospitals;

// Symptom options mapping to specialty IDs in DoctorsPage
const symptomOptions = [
  { id: "chest-pain", label: "Chest Pain / Palpitations", specialtyId: "cardiology", icon: Heart, iconColor: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
  { id: "fever", label: "Fever / Dengue / Viral Infection", specialtyId: "internal-medicine", icon: Activity, iconColor: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  { id: "pediatric", label: "Child Cough / Pediatric Care", specialtyId: "pediatrics", icon: Baby, iconColor: "text-sky-500", bg: "bg-sky-50", border: "border-sky-100" },
  { id: "abdominal", label: "Abdominal Pain / Hernia", specialtyId: "general-surgery", icon: Stethoscope, iconColor: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
  { id: "joint-pain", label: "Joint Pain / Fracture / Strain", specialtyId: "orthopedics", icon: Bone, iconColor: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
  { id: "headache", label: "Headache / Migraine / Stroke", specialtyId: "neurology", icon: Brain, iconColor: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
  { id: "digestive", label: "Acid Reflux / Kidney Stones", specialtyId: "gastro-urology", icon: Microscope, iconColor: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { id: "general", label: "General Checkup / Refill Refills", specialtyId: "gp-family", icon: Stethoscope, iconColor: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
  { id: "other", label: "Other / Not Sure (General Triage)", specialtyId: "gp-family", icon: HelpCircle, iconColor: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" }
];

function getFacilityVisual(facility: Hospital) {
  const id = facility.id.toLowerCase();
  const name = facility.name.toLowerCase();

  if (id === "ph-penang" || id === "pantai" || name.includes("main hospital") || (name.includes("pantai hospital penang") && !name.includes("pavilion") && !name.includes("premier") && !name.includes("specialist"))) {
    return {
      gradient: "from-teal-600 to-cyan-700",
      bgLight: "bg-teal-50",
      textCol: "text-teal-700",
      borderCol: "border-teal-200",
      badgeCol: "bg-teal-100 text-teal-800",
      code: "PHP",
      emoji: "🏥",
      highlights: "Tertiary Inpatient & Outpatient Hub (Bayan Lepas) | 24/7 A&E",
    };
  }
  if (id === "pantai-pavilion" || name.includes("pavilion") || name.includes("heart & wellness")) {
    return {
      gradient: "from-rose-600 to-red-700",
      bgLight: "bg-rose-50",
      textCol: "text-rose-700",
      borderCol: "border-rose-200",
      badgeCol: "bg-rose-100 text-rose-800",
      code: "PHWP",
      emoji: "❤️",
      highlights: "Cardiovascular, Metabolic & Preventive Health (Georgetown)",
    };
  }
  if (id === "pantai-premier" || name.includes("premier") || name.includes("day surgery")) {
    return {
      gradient: "from-blue-600 to-indigo-700",
      bgLight: "bg-blue-50",
      textCol: "text-blue-700",
      borderCol: "border-blue-200",
      badgeCol: "bg-blue-100 text-blue-800",
      code: "PPCDS",
      emoji: "🩺",
      highlights: "Day Surgery, Endoscopy, Dermatology & Family Medicine (Bayan Baru)",
    };
  }
  if (id === "pantai-specialist" || name.includes("specialist centre") || name.includes("air itam")) {
    return {
      gradient: "from-emerald-600 to-teal-700",
      bgLight: "bg-emerald-50",
      textCol: "text-emerald-700",
      borderCol: "border-emerald-200",
      badgeCol: "bg-emerald-100 text-emerald-800",
      code: "PSC",
      emoji: "🦴",
      highlights: "Orthopedics, Sports Injury, ENT, Ophthalmology & Rehab (Ayer Itam)",
    };
  }

  return {
    gradient: "from-teal-600 to-cyan-700",
    bgLight: "bg-teal-50",
    textCol: "text-teal-600",
    borderCol: "border-slate-200",
    badgeCol: "bg-teal-100 text-teal-800",
    code: facility.name.substring(0, 3).toUpperCase(),
    emoji: "🏥",
    highlights: facility.tag || facility.type,
  };
}

interface SlotCapacityInfo {
  slot: string;
  startHour: number;
  endHour: number;
  isBuffer: boolean;
  isLunch: boolean;
  baseCapacity: number;
  dynamicCapacity: number;
  bookedCount: number;
  availableCount: number;
  isAvailable: boolean;
  disabledReason?: string;
}

const ONE_HOUR_SLOTS: Array<{ slot: string; startHour: number; endHour: number; isBuffer: boolean; isLunch: boolean }> = [
  { slot: "08:00 - 09:00", startHour: 8, endHour: 9, isBuffer: false, isLunch: false },
  { slot: "09:00 - 10:00", startHour: 9, endHour: 10, isBuffer: false, isLunch: false },
  { slot: "10:00 - 11:00", startHour: 10, endHour: 11, isBuffer: false, isLunch: false },
  { slot: "11:00 - 12:00", startHour: 11, endHour: 12, isBuffer: true, isLunch: false },
  { slot: "12:00 - 13:00", startHour: 12, endHour: 13, isBuffer: false, isLunch: true },
  { slot: "13:00 - 14:00", startHour: 13, endHour: 14, isBuffer: false, isLunch: false },
  { slot: "14:00 - 15:00", startHour: 14, endHour: 15, isBuffer: false, isLunch: false },
  { slot: "15:00 - 16:00", startHour: 15, endHour: 16, isBuffer: false, isLunch: false },
  { slot: "16:00 - 17:00", startHour: 16, endHour: 17, isBuffer: true, isLunch: false },
];

export default function ScheduleAppointment({
  onAddAppointment,
  prefilledApt,
  onSetScreen,
  appointments,
  onCancelAppointment,
  onRescheduleAppointment,
  patientProfile,
  onUpdateProfile
}: ScheduleAppointmentProps) {
  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
  }, []);

  const maxDateStr = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
  }, []);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(() => {
    // If explicitly initiated reschedule via prefilledApt or step 4 flag, immediately go to Step 4
    const isExplicitReschedule = Boolean(prefilledApt) || localStorage.getItem("pantai_booking_initial_step") === "4";
    if (isExplicitReschedule) {
      return 4;
    }

    // If user already has an active upcoming appointment, always stay on Step 1 to show upcoming schedule
    const hasUpcoming = appointments.some(apt => apt.status === "Upcoming");
    if (hasUpcoming) {
      localStorage.removeItem("pantai_booking_initial_step");
      localStorage.removeItem("pantai_booking_preselected_clinic");
      localStorage.removeItem("pantai_booking_preselected_doctor");
      localStorage.removeItem("pantai_booking_preselected_specialty");
      return 1;
    }

    const savedStep = localStorage.getItem("pantai_booking_initial_step");
    if (savedStep) {
      localStorage.removeItem("pantai_booking_initial_step");
      return (parseInt(savedStep, 10) as any) || 1;
    }
    if (prefilledApt?.clinic && prefilledApt?.doctorName) return 4;
    if (prefilledApt?.clinic) return 2;
    return 1;
  });

  // Step 1 states
  const [careTrackFilter, setCareTrackFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectedClinic, setSelectedClinic] = useState<Hospital | null>(() => {
    const savedClinicName = localStorage.getItem("pantai_booking_preselected_clinic");
    if (savedClinicName) {
      localStorage.removeItem("pantai_booking_preselected_clinic");
      const match = allFacilities.find(f => 
        f.name.toLowerCase().trim() === savedClinicName.toLowerCase().trim() ||
        f.name.toLowerCase().includes(savedClinicName.toLowerCase().trim()) ||
        savedClinicName.toLowerCase().includes(f.name.toLowerCase().trim())
      );
      if (match) return match;
    }
    if (prefilledApt?.clinic) {
      return allFacilities.find(f => f.name.toLowerCase() === prefilledApt.clinic?.toLowerCase()) || null;
    }
    return null;
  });

  // Step 2 states
  const [selectedSymptomId, setSelectedSymptomId] = useState<string>(() => {
    if (prefilledApt?.specialty) {
      const match = symptomOptions.find(opt => 
        opt.specialtyId.toLowerCase() === prefilledApt.specialty?.toLowerCase() ||
        prefilledApt.specialty?.toLowerCase().includes(opt.specialtyId.toLowerCase())
      );
      if (match) return match.id;
    }
    const preSpec = localStorage.getItem("pantai_booking_preselected_specialty");
    if (preSpec) {
      const match = symptomOptions.find(opt => 
        opt.specialtyId.toLowerCase() === preSpec.toLowerCase() ||
        preSpec.toLowerCase().includes(opt.specialtyId.toLowerCase()) ||
        opt.label.toLowerCase().includes(preSpec.toLowerCase())
      );
      if (match) return match.id;
    }
    return "";
  });
  const [customSymptomText, setCustomSymptomText] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>(() => {
    if (prefilledApt?.specialty) return prefilledApt.specialty;
    const preSpec = localStorage.getItem("pantai_booking_preselected_specialty");
    if (preSpec) {
      localStorage.removeItem("pantai_booking_preselected_specialty");
      localStorage.removeItem("carey_triage_specialty");
      return preSpec;
    }
    localStorage.removeItem("carey_triage_specialty");
    return "";
  });
  const [departmentSearch, setDepartmentSearch] = useState<string>("");
  const [doctorSearch, setDoctorSearch] = useState<string>("");

  // Step 3 states
  const [selectedDoctor, setSelectedDoctor] = useState<AnyDoctor | null>(() => {
    const docName = prefilledApt?.doctorName || localStorage.getItem("pantai_booking_preselected_doctor");
    if (docName) {
      localStorage.removeItem("pantai_booking_preselected_doctor");
      const cleanName = docName.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
      const match = allPantaiDoctors.find(d => {
        const cleanD = d.name.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
        return cleanD === cleanName || d.name.toLowerCase().trim() === docName.toLowerCase().trim() || cleanD.includes(cleanName) || cleanName.includes(cleanD);
      });
      if (match) return match;
      for (const sp of specialties) {
        const doc = sp.doctors.find(d => {
          const cleanD = d.name.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
          return cleanD === cleanName || d.name.toLowerCase().trim() === docName.toLowerCase().trim() || cleanD.includes(cleanName) || cleanName.includes(cleanD);
        });
        if (doc) return doc;
      }
      const partialMatch = allPantaiDoctors.find(d => d.name.toLowerCase().includes(cleanName) || cleanName.includes(d.name.toLowerCase()));
      if (partialMatch) return partialMatch;
    }
    return null;
  });

  // Ensure clinic and department align with preselected doctor
  useEffect(() => {
    if (selectedDoctor && !selectedClinic) {
      const match = allFacilities.find(f => 
        f.name.toLowerCase().trim() === selectedDoctor.hospital.toLowerCase().trim() ||
        f.name.toLowerCase().includes(selectedDoctor.hospital.toLowerCase().trim()) ||
        selectedDoctor.hospital.toLowerCase().includes(f.name.toLowerCase().trim())
      );
      if (match) {
        setSelectedClinic(match);
      }
    }
  }, [selectedDoctor, selectedClinic]);

  useEffect(() => {
    if (selectedDoctor && (!selectedDepartment || selectedDepartment === "")) {
      setSelectedDepartment(selectedDoctor.department || selectedDoctor.specialty || "");
    }
  }, [selectedDoctor, selectedDepartment]);

  // Step 4 & 5 states
  const [selectedDate, setSelectedDate] = useState(() => {
    if (prefilledApt?.date && prefilledApt.date >= todayStr) {
      return prefilledApt.date;
    }
    return todayStr;
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(prefilledApt?.timeSlot ?? "");
  const [remarks, setRemarks] = useState(prefilledApt?.symptoms ? prefilledApt.symptoms.replace(/^["'\s]+|["'\s.]+$/g, '').replace(/\.+$/, '') : "");
  
  // Module 4: Not default selected as requested
  const [shareHistory, setShareHistory] = useState(false);
  const [syncCrossFacilityRecords, setSyncCrossFacilityRecords] = useState(false);
  const [showSyncCategories, setShowSyncCategories] = useState(true);
  const [requestRide, setRequestRide] = useState(false);
  const [lastCreatedVoucher, setLastCreatedVoucher] = useState<Appointment | null>(null);
  const consultType = 'In-Clinic';
  
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(() => {
    return Boolean(prefilledApt || localStorage.getItem("pantai_booking_initial_step") === "4");
  });

  // Facility Holiday Blocking State
  const [facilityHolidays, setFacilityHolidays] = useState<any[]>([]);

  // Sessional Doctors Active Rosters Summary (to ensure unscheduled sessional doctors are not shown in Step 3)
  const [activeRosterSummary, setActiveRosterSummary] = useState<{
    sessionalDoctorIds: string[];
    sessionalDoctorNames: string[];
  }>({ sessionalDoctorIds: [], sessionalDoctorNames: [] });

  useEffect(() => {
    fetch('/api/admin/roster/active-summary')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setActiveRosterSummary({
            sessionalDoctorIds: data.sessionalDoctorIds || [],
            sessionalDoctorNames: data.sessionalDoctorNames || []
          });
        }
      })
      .catch(err => console.warn("Could not load active roster summary:", err));
  }, []);

  useEffect(() => {
    const facId = selectedClinic?.id === 'ph-penang' ? 1 : 
                  (selectedClinic?.id || '').includes('pavilion') ? 2 : 
                  (selectedClinic?.id || '').includes('clinic') ? 3 : 
                  (selectedClinic?.id || '').includes('specialist') ? 4 : 1;
    fetch(`/api/holidays/blocked-dates?facilityId=${facId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.blockedDates)) {
          setFacilityHolidays(data.blockedDates);
        }
      })
      .catch(err => console.warn("Failed to load facility holidays:", err));
  }, [selectedClinic]);

  useEffect(() => {
    if (step === 4) {
      if (!selectedDate || selectedDate < todayStr) {
        setSelectedDate(todayStr);
      }
    }
  }, [step, selectedDate, todayStr]);

  useEffect(() => {
    if (prefilledApt) {
      if (prefilledApt.clinic) {
        const match = allFacilities.find(f => 
          f.name.toLowerCase().trim() === prefilledApt.clinic?.toLowerCase().trim() ||
          f.name.toLowerCase().includes(prefilledApt.clinic?.toLowerCase().trim()) ||
          (prefilledApt.clinic && prefilledApt.clinic.toLowerCase().includes(f.name.toLowerCase().trim()))
        );
        if (match) setSelectedClinic(match);
      }
      if (prefilledApt.doctorName) {
        const cleanPrefilledDoc = prefilledApt.doctorName.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
        const match = allPantaiDoctors.find(d => {
          const cleanDoc = d.name.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
          return d.name.toLowerCase() === prefilledApt.doctorName?.toLowerCase() ||
                 cleanDoc === cleanPrefilledDoc ||
                 cleanDoc.includes(cleanPrefilledDoc) ||
                 cleanPrefilledDoc.includes(cleanDoc);
        });
        if (match) {
          setSelectedDoctor(match);
          if (match.department) setSelectedDepartment(match.department);
        }
      }
      if (prefilledApt.symptoms) {
        setRemarks(prefilledApt.symptoms.replace(/^["'\s]+|["'\s.]+$/g, '').replace(/\.+$/, ''));
      }
      if (prefilledApt.date) {
        setSelectedDate(prefilledApt.date);
      }
      if (prefilledApt.timeSlot) {
        setSelectedTimeSlot(prefilledApt.timeSlot);
      }
      setIsRescheduling(true);
      setStep(4);
    }
  }, [prefilledApt]);

  const upcomingAppointment = useMemo(() => {
    return appointments.find(apt => apt.status === "Upcoming") || null;
  }, [appointments]);

  useEffect(() => {
    if (upcomingAppointment && !isRescheduling && !prefilledApt) {
      setStep(1);
      localStorage.removeItem("pantai_booking_initial_step");
      localStorage.removeItem("pantai_booking_preselected_clinic");
      localStorage.removeItem("pantai_booking_preselected_doctor");
      localStorage.removeItem("pantai_booking_preselected_specialty");
      return;
    }

    const savedClinicName = localStorage.getItem("pantai_booking_preselected_clinic");
    const savedStep = localStorage.getItem("pantai_booking_initial_step");
    if (savedClinicName) {
      localStorage.removeItem("pantai_booking_preselected_clinic");
      const match = allFacilities.find(f => 
        f.name.toLowerCase().trim() === savedClinicName.toLowerCase().trim() ||
        f.name.toLowerCase().includes(savedClinicName.toLowerCase().trim()) ||
        savedClinicName.toLowerCase().includes(f.name.toLowerCase().trim())
      );
      if (match) {
        setSelectedClinic(match);
      }
    }
    if (savedStep) {
      localStorage.removeItem("pantai_booking_initial_step");
      setStep((parseInt(savedStep, 10) as any) || 2);
    }
  }, [upcomingAppointment, isRescheduling, prefilledApt]);

  const lastBooking = useMemo(() => {
    if (!appointments || appointments.length === 0) return null;
    return [...appointments].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];
  }, [appointments]);

  const handleStartReschedule = () => {
    const targetApt = prefilledApt || upcomingAppointment;
    if (!targetApt) return;
    const clinicObj = allFacilities.find(f => 
      f.name.toLowerCase().trim() === targetApt.clinic?.toLowerCase().trim() ||
      f.name.toLowerCase().includes(targetApt.clinic?.toLowerCase().trim()) ||
      (targetApt.clinic && targetApt.clinic.toLowerCase().includes(f.name.toLowerCase().trim()))
    ) || allFacilities[0];

    const cleanTargetDoc = targetApt.doctorName.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
    let doctorObj: AnyDoctor | null = allPantaiDoctors.find(d => {
      const cleanD = d.name.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
      return cleanD === cleanTargetDoc || d.name.toLowerCase() === targetApt.doctorName.toLowerCase() || d.name.toLowerCase().includes(cleanTargetDoc);
    }) || null;

    if (!doctorObj) {
      for (const sp of specialties) {
        const doc = sp.doctors.find(d => {
          const cleanD = d.name.toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
          return cleanD === cleanTargetDoc || d.name.toLowerCase().trim() === targetApt.doctorName.toLowerCase().trim();
        });
        if (doc) {
          doctorObj = doc;
          break;
        }
      }
    }

    setSelectedClinic(clinicObj);
    if (doctorObj) {
      setSelectedDoctor(doctorObj);
      const docDept = ('department' in doctorObj ? doctorObj.department : (doctorObj as any).specialty) || '';
      if (docDept) setSelectedDepartment(docDept);
    }
    if (targetApt.date) setSelectedDate(targetApt.date);
    if (targetApt.timeSlot) setSelectedTimeSlot(targetApt.timeSlot);
    if (targetApt.symptoms) setRemarks(targetApt.symptoms);
    setIsRescheduling(true);
    setStep(4);
  };

  const handleCancelClick = () => {
    if (!upcomingAppointment) return;
    if (window.confirm("Are you sure you want to cancel your upcoming appointment? This action cannot be undone.")) {
      onCancelAppointment(upcomingAppointment.id);
    }
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = prefilledApt?.id || upcomingAppointment?.id;
    if (!targetId || !selectedDate || !selectedTimeSlot) return;
    onRescheduleAppointment(targetId, selectedDate, selectedTimeSlot);
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingConfirmed(false);
      setIsRescheduling(false);
      onSetScreen("dashboard");
    }, 1800);
  };

  // Match doctor department with target department (handles multi-specialty and sub-disciplines)
  const matchDoctorToDept = (doctorDept: string, targetDept: string): boolean => {
    if (!targetDept || targetDept === "all") return true;
    const dDept = (doctorDept || "").toLowerCase().trim();
    const target = targetDept.toLowerCase().trim();
    if (dDept === target) return true;
    const subDepts = dDept.split(',').map(s => s.trim());
    if (subDepts.includes(target)) return true;
    return dDept.includes(target) || target.includes(dDept);
  };

  // Extract all unique departments for selected hospital
  const hospitalDepartments = useMemo(() => {
    if (!selectedClinic) return [];
    const clinicName = selectedClinic.name.toLowerCase();
    const docs = allPantaiDoctors.filter(d => {
      const docHosp = d.hospital.toLowerCase();
      return docHosp === clinicName || clinicName.includes(docHosp) || docHosp.includes(clinicName);
    });
    return Array.from(new Set(docs.map(d => d.department)))
      .filter(dept => !dept.toLowerCase().includes("emergency"))
      .sort();
  }, [selectedClinic]);

  // Count doctors per department at selected hospital (strictly synchronized with Step 3 doctor filter)
  const departmentCounts = useMemo(() => {
    if (!selectedClinic) return {} as Record<string, number>;
    const clinicName = selectedClinic.name.toLowerCase();
    const docs = allPantaiDoctors.filter(d => {
      const docHosp = d.hospital.toLowerCase();
      return docHosp === clinicName || clinicName.includes(docHosp) || docHosp.includes(clinicName);
    });
    const counts: Record<string, number> = {};
    hospitalDepartments.forEach(dept => {
      counts[dept] = docs.filter(d => matchDoctorToDept(d.department, dept)).length;
    });
    return counts;
  }, [selectedClinic, hospitalDepartments]);

  // Total doctors at selected hospital
  const totalHospitalDoctors = useMemo(() => {
    if (!selectedClinic) return 0;
    const clinicName = selectedClinic.name.toLowerCase();
    return allPantaiDoctors.filter(d => {
      const docHosp = d.hospital.toLowerCase();
      return docHosp === clinicName || clinicName.includes(docHosp) || docHosp.includes(clinicName);
    }).length;
  }, [selectedClinic]);

  // Filtered departments based on search query
  const filteredDepartments = useMemo(() => {
    if (!departmentSearch.trim()) return hospitalDepartments;
    const q = departmentSearch.toLowerCase().trim();
    return hospitalDepartments.filter(dept => dept.toLowerCase().includes(q));
  }, [hospitalDepartments, departmentSearch]);

  // Filter facilities: 11 Pantai hospitals
  const filteredFacilities = useMemo(() => {
    return allFacilities;
  }, []);

  // Get matching doctors based on Pantai branch and department
  const matchingDoctors = useMemo(() => {
    if (!selectedClinic) return [];
    const clinicName = selectedClinic.name.toLowerCase();
    
    let docs = allPantaiDoctors.filter(d => {
      const docHosp = d.hospital.toLowerCase();
      return docHosp === clinicName || clinicName.includes(docHosp) || docHosp.includes(clinicName);
    });

    // Fallback if user hasn't provided doctor list for this branch yet
    if (docs.length === 0) {
      docs = [
        {
          id: `${selectedClinic.id}-consultant-1`,
          name: `Dr. Outpatient Specialist (${selectedClinic.name.replace('Pantai Hospital ', '')})`,
          department: "General & Outpatient Medicine",
          specialty: "General & Outpatient Medicine",
          hospital: selectedClinic.name,
          status: "Resident",
          avatar: "OS",
          title: "Resident Outpatient Consultant",
          availability: "Mon–Fri: 9:00 AM – 5:00 PM"
        }
      ];
    }

    if (selectedDepartment && selectedDepartment !== "all") {
      docs = docs.filter(d => matchDoctorToDept(d.department, selectedDepartment));
    }

    if (doctorSearch.trim()) {
      const q = doctorSearch.toLowerCase().trim();
      docs = docs.filter(d => 
        d.name.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q)
      );
    }

    // Filter Sessional/Visiting doctors: only show if hospital admin has scheduled an active session or weekly hours
    docs = docs.filter(d => {
      const statusLower = (d.status || '').toLowerCase();
      const isSessional = statusLower === 'sessional' || statusLower === 'visiting';
      
      // Resident doctors are full-time and on duty by default
      if (!isSessional) return true;

      // Sessional doctors: only show if admin has opened sessions for them (otherwise they are not on duty)
      const docIdLower = (d.id || '').toLowerCase();
      const docNameClean = (d.name || '').toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/i, '').trim();

      const hasScheduledSession = 
        activeRosterSummary.sessionalDoctorIds.some(id => id.includes(docIdLower) || docIdLower.includes(id)) ||
        activeRosterSummary.sessionalDoctorNames.some(name => name.includes(docNameClean) || docNameClean.includes(name));

      return hasScheduledSession;
    });

    return docs;
  }, [selectedClinic, selectedDepartment, doctorSearch, activeRosterSummary]);

  // Sync remarks field when department/symptom selection changes
  const selectedSymptom = useMemo(() => {
    if (!selectedDepartment || selectedDepartment === "") {
      return null;
    }
    return {
      id: selectedDepartment,
      label: selectedDepartment === "all" ? "All Departments" : selectedDepartment,
      specialtyId: selectedDepartment
    };
  }, [selectedDepartment]);

  useEffect(() => {
    if (!prefilledApt) {
      if (selectedDepartment && selectedDepartment !== "all") {
        const summaryText = `${selectedDepartment}${customSymptomText ? ` Notes: ${customSymptomText}` : ""}`;
        setRemarks(summaryText);
      } else if (customSymptomText) {
        setRemarks(customSymptomText);
      }
    }
  }, [selectedDepartment, customSymptomText, prefilledApt]);

  const [doctorSchedule, setDoctorSchedule] = useState<any>(null);
  const [rosterAvailability, setRosterAvailability] = useState<any>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  useEffect(() => {
    if (!selectedDoctor) {
      setDoctorSchedule(null);
      setRosterAvailability(null);
      return;
    }
    setIsLoadingSchedule(true);
    fetch(`/api/provider/schedule?doctorName=${encodeURIComponent(selectedDoctor.name)}`)
      .then(res => res.json())
      .then(data => {
        setDoctorSchedule(data);
      })
      .catch(err => {
        console.warn("Failed to load doctor schedule config", err);
        setDoctorSchedule(null);
      })
      .finally(() => {
        setIsLoadingSchedule(false);
      });

    // Fetch differentiated Resident vs Sessional roster & available dates
    fetch(`/api/doctor/${encodeURIComponent(selectedDoctor.name)}/available-dates`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRosterAvailability(data);
          // If Sessional and has open session dates, pre-select first available date if empty
          if (data.type === 'SESSIONAL' && Array.isArray(data.availableDates) && data.availableDates.length > 0) {
            setSelectedDate(prev => prev && data.availableDates.includes(prev) ? prev : data.availableDates[0]);
          }
        } else {
          setRosterAvailability(null);
        }
      })
      .catch(err => {
        console.warn("Failed to load doctor roster availability", err);
        setRosterAvailability(null);
      });
  }, [selectedDoctor]);

  const validateDateAvailability = (dateStr: string) => {
    if (!dateStr || !selectedDoctor) return { valid: true, reason: '' };

    // 1. Validate facility holiday blocking
    const matchedHoliday = facilityHolidays.find((h: any) => (h.holiday_date === dateStr || h.date === dateStr));
    if (matchedHoliday) {
      return {
        valid: false,
        reason: `[Facility Closed on Public Holiday]\nThis facility is closed on ${dateStr} due to: ${matchedHoliday.title}.\nOutpatient consultation slots are blocked. Please select another operational date.`
      };
    }

    // 2. Validate doctor on leave
    if (
      (rosterAvailability?.blockedDates && rosterAvailability.blockedDates.includes(dateStr)) ||
      (doctorSchedule?.blockedDates && doctorSchedule.blockedDates.includes(dateStr))
    ) {
      return {
        valid: false,
        reason: `Dr. ${selectedDoctor.name} is on leave or unavailable on this date (${dateStr}). Please choose another date.`
      };
    }

    // 3. Sessional Doctor: Strictly check if date is an open session
    if (rosterAvailability?.type === 'SESSIONAL') {
      const openDates = rosterAvailability.availableDates || [];
      if (!openDates.includes(dateStr)) {
        const msg = openDates.length > 0
          ? `Upcoming open clinic dates:\n• ${openDates.join('\n• ')}`
          : `There are currently no open clinic sessions scheduled for this specialist.`;
        return {
          valid: false,
          reason: `[Sessional Specialist On-Demand Notice]\nDr. ${selectedDoctor.name} is a Sessional Consultant with on-demand clinics only.\n\n${msg}\n\nPlease select an open clinic date.`
        };
      }
    }

    // 4. Resident Doctor: Check active days of week
    if (rosterAvailability?.type === 'RESIDENT' && Array.isArray(rosterAvailability.activeDaysOfWeek)) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const jsDay = dObj.getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[jsDay];

        if (!rosterAvailability.activeDaysOfWeek.includes(isoDay)) {
          return {
            valid: false,
            reason: `Dr. ${selectedDoctor.name} does not hold outpatient clinics on ${dayName}s. Please choose an active clinic day.`
          };
        }
      }
    }

    return { valid: true, reason: '' };
  };

  const isDoctorOnLeave = useMemo(() => {
    if (rosterAvailability && rosterAvailability.blockedDates && rosterAvailability.blockedDates.includes(selectedDate)) {
      return true;
    }
    if (doctorSchedule && doctorSchedule.blockedDates && doctorSchedule.blockedDates.includes(selectedDate)) {
      return true;
    }
    return false;
  }, [selectedDate, doctorSchedule, rosterAvailability]);

  const isClinicClosed = useMemo(() => {
    if (!selectedClinic || !selectedDate) return false;
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 && (selectedClinic.id === "pantai-pavilion" || selectedClinic.id === "pantai-specialist")) {
      return true;
    }
    return false;
  }, [selectedClinic, selectedDate]);

  // Dynamic slot capacities and real-time decay engine for 1-hour slots
  const slotCapacities = useMemo<SlotCapacityInfo[]>(() => {
    if (!selectedDate) return [];
    const isToday = selectedDate === todayStr;
    const isPast = selectedDate < todayStr;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. First validate date availability (holidays, doctor leaves, unapproved sessional dates)
    const dateCheck = validateDateAvailability(selectedDate);
    const dateInvalid = !dateCheck.valid;
    const dateInvalidReason = dateCheck.reason ? dateCheck.reason.split('\n')[0].replace(/[\[\]]/g, '') : "Date Unavailable";

    // 2. Check Sessional open sessions
    const isSessional = rosterAvailability?.type === 'SESSIONAL';
    let matchedSessionalSession: any = null;
    let sessionalSessionClosed = false;

    if (isSessional) {
      const openSessions = rosterAvailability.openSessions || [];
      matchedSessionalSession = openSessions.find((s: any) => s.session_date === selectedDate);
      if (!matchedSessionalSession) {
        sessionalSessionClosed = true;
      }
    }

    // 3. Check Resident weekly roster
    const isResident = rosterAvailability?.type === 'RESIDENT';
    let residentDayRoster: any = null;
    let residentDayClosed = false;

    if (isResident && Array.isArray(rosterAvailability?.weeklyRoster)) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const jsDay = dObj.getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;
        residentDayRoster = rosterAvailability.weeklyRoster.find((r: any) => r.day_of_week === isoDay);
        if (!residentDayRoster || !residentDayRoster.is_active) {
          residentDayClosed = true;
        }
      }
    }

    return ONE_HOUR_SLOTS.map((slotDef) => {
      const slotStartMinutes = slotDef.startHour * 60;
      const slotEndMinutes = slotDef.endHour * 60;
      const baseCapacity = slotDef.isLunch ? 0 : slotDef.isBuffer ? 2 : 3;

      let dynamicCapacity = baseCapacity;
      let disabledReason = "";

      if (dateInvalid) {
        dynamicCapacity = 0;
        disabledReason = dateInvalidReason;
      } else if (slotDef.isLunch) {
        dynamicCapacity = 0;
        disabledReason = "Lunch Break (Closed)";
      } else if (isPast) {
        dynamicCapacity = 0;
        disabledReason = "Booking Closed (Time Passed)";
      } else if (isSessional && sessionalSessionClosed) {
        dynamicCapacity = 0;
        disabledReason = "Specialist Not On Duty (Session Closed)";
      } else if (isSessional && matchedSessionalSession && (slotStartMinutes < (parseInt(matchedSessionalSession.start_time.split(':')[0], 10) * 60 + parseInt(matchedSessionalSession.start_time.split(':')[1] || '0', 10)) || slotEndMinutes > (parseInt(matchedSessionalSession.end_time.split(':')[0], 10) * 60 + parseInt(matchedSessionalSession.end_time.split(':')[1] || '0', 10)))) {
        dynamicCapacity = 0;
        disabledReason = `Outside Specialist Session (${matchedSessionalSession.start_time?.substring(0, 5)} - ${matchedSessionalSession.end_time?.substring(0, 5)})`;
      } else if (isResident && residentDayClosed) {
        dynamicCapacity = 0;
        disabledReason = "Doctor Not In Clinic Today";
      } else if (isResident && residentDayRoster && (slotStartMinutes < (parseInt(residentDayRoster.start_time.split(':')[0], 10) * 60 + parseInt(residentDayRoster.start_time.split(':')[1] || '0', 10)) || slotEndMinutes > (parseInt(residentDayRoster.end_time.split(':')[0], 10) * 60 + parseInt(residentDayRoster.end_time.split(':')[1] || '0', 10)))) {
        dynamicCapacity = 0;
        disabledReason = `Outside Clinic Hours (${residentDayRoster.start_time?.substring(0, 5)} - ${residentDayRoster.end_time?.substring(0, 5)})`;
      } else if (isToday) {
        if (now.getHours() >= 17) {
          dynamicCapacity = 0;
          disabledReason = "Clinic Closed for Today";
        } else if (currentMinutes >= slotEndMinutes) {
          dynamicCapacity = 0;
          disabledReason = "Booking Closed (Time Passed)";
        } else if (currentMinutes >= slotStartMinutes) {
          const elapsed = currentMinutes - slotStartMinutes;
          if (slotDef.isBuffer) {
            // Buffer slot (11:00-12:00, 16:00-17:00): 1~15 min -> 1, 16+ min -> 0
            if (elapsed <= 15) {
              dynamicCapacity = 1;
            } else {
              dynamicCapacity = 0;
              disabledReason = "Booking Closed (Time Passed)";
            }
          } else {
            // Standard slot: 1~15 min -> 2, 16~30 min -> 1, 31+ min -> 0
            if (elapsed <= 15) {
              dynamicCapacity = 2;
            } else if (elapsed <= 30) {
              dynamicCapacity = 1;
            } else {
              dynamicCapacity = 0;
              disabledReason = "Booking Closed (Time Passed)";
            }
          }
        } else {
          dynamicCapacity = baseCapacity;
        }
      } else {
        dynamicCapacity = baseCapacity;
      }

      // Check booked count for this doctor and date and slot
      const bookedCount = existingAppointments.filter((apt) => {
        if (apt.status === "Cancelled" || apt.status === "Rejected") return false;
        const aptDate = apt.date || (apt.dateTime ? apt.dateTime.split(" ")[0] : "");
        if (aptDate !== selectedDate) return false;
        if (selectedDoctor) {
          const cleanDoc = (selectedDoctor.name || "").toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
          const cleanAptDoc = (apt.doctorName || "").toLowerCase().replace(/^(dr\.|dato' dr\.|dr)\s*/, "").trim();
          const docMatches = cleanDoc === cleanAptDoc || cleanDoc.includes(cleanAptDoc) || cleanAptDoc.includes(cleanDoc);
          if (!docMatches) return false;
        }
        const aptSlot = (apt.timeSlot || (apt.dateTime ? apt.dateTime.split(" ")[1] : "") || "").trim().toLowerCase();
        const targetSlot = slotDef.slot.trim().toLowerCase();
        if (aptSlot === targetSlot || aptSlot.includes(targetSlot) || targetSlot.includes(aptSlot)) return true;
        const startHour = targetSlot.split("-")[0].trim().toLowerCase();
        if (startHour && aptSlot.startsWith(startHour)) return true;
        return false;
      }).length;

      const availableCount = Math.max(0, dynamicCapacity - bookedCount);

      if (availableCount === 0 && !disabledReason) {
        if (bookedCount >= dynamicCapacity && dynamicCapacity > 0) {
          disabledReason = "Fully Booked";
        } else if (dynamicCapacity === 0) {
          disabledReason = "Booking Closed (Time Passed)";
        }
      }

      return {
        ...slotDef,
        baseCapacity,
        dynamicCapacity,
        bookedCount,
        availableCount,
        isAvailable: availableCount > 0,
        disabledReason
      };
    });
  }, [selectedDate, todayStr, existingAppointments, selectedDoctor, rosterAvailability, facilityHolidays]);

  // Reset selectedTimeSlot if it becomes unavailable
  useEffect(() => {
    if (selectedTimeSlot) {
      const match = slotCapacities.find(s => s.slot === selectedTimeSlot);
      if (match && !match.isAvailable) {
        setSelectedTimeSlot("");
      }
    }
  }, [slotCapacities, selectedTimeSlot]);

  // Fetch existing appointments for the conflict validation
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedDoctor || !selectedDate) return;
      setIsLoadingAppointments(true);
      try {
        const token = localStorage.getItem("carepoint_access_token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const res = await fetch(`/api/appointments`, { headers });
        if (res.ok) {
          const data: Appointment[] = await res.json();
          setExistingAppointments(data);
        }
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
      } finally {
        setIsLoadingAppointments(false);
      }
    };
    
    fetchAppointments();
  }, [selectedDoctor, selectedDate]);

  const isSlotInPast = (slot: string) => {
    if (!selectedDate) return false;
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    const todayStr = localDate.toISOString().split('T')[0];
    if (selectedDate !== todayStr) return false;

    const match = slot.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return false;
    let hrs = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const pm = match[3].toUpperCase() === "PM";
    if (pm && hrs < 12) hrs += 12;
    if (!pm && hrs === 12) hrs = 0;

    const slotTime = new Date();
    slotTime.setHours(hrs, mins, 0, 0);

    const now = new Date();
    return slotTime.getTime() < now.getTime();
  };

  const isSlotBooked = (slot: string) => {
    if (!selectedDoctor) return false;
    if (isSlotInPast(slot)) return true;
    
    if (doctorSchedule) {
      const parseTimeStr = (t: string) => {
        const match = t.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
        if (!match) return 0;
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const pm = match[3].toUpperCase() === "PM";
        if (pm && hrs < 12) hrs += 12;
        if (!pm && hrs === 12) hrs = 0;
        return hrs * 60 + mins;
      };

      const slotMin = parseTimeStr(slot);

      let activeBreak = doctorSchedule.globalBreak;
      if (doctorSchedule.customBreaks && doctorSchedule.customBreaks[selectedDate]) {
        activeBreak = doctorSchedule.customBreaks[selectedDate];
      }

      if (activeBreak && activeBreak.start && activeBreak.end) {
        const startMin = parseTimeStr(activeBreak.start);
        const endMin = parseTimeStr(activeBreak.end);
        if (slotMin >= startMin && slotMin < endMin) {
          return true;
        }
      }

      if (doctorSchedule.breaks && doctorSchedule.breaks.includes(slot)) {
        return true;
      }
    }

    if (doctorSchedule && doctorSchedule.shifts) {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = dayNames[dateObj.getDay()];
        const dayShift = doctorSchedule.shifts[dayName];
        if (dayShift && !dayShift.enabled) {
          return true;
        }
      }
    }
    return existingAppointments.some(apt => 
      apt.doctorName.toLowerCase() === selectedDoctor.name.toLowerCase() &&
      apt.date === selectedDate &&
      apt.timeSlot === slot &&
      apt.status !== "Cancelled"
    );
  };

  const currentStepLabel = ["Facility", "Symptoms", "Doctor", "Schedule", "Review"] as const;

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedTimeSlot("");
    setStep(4); // Advance wizard to Date & Slot selection
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRescheduling) {
      handleConfirmReschedule(event);
      return;
    }
    if (!selectedClinic || !selectedDoctor) return;

    // Create unique doctor ID based on name
    const doctorId = selectedDoctor.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // Auto-generate tidy, sequential Queue Number based on Department code
    const doctorSpecialty = selectedDoctor.title || selectedDoctor.specialty || selectedDoctor.name;
    const deptCode = getDepartmentQueueCode(doctorSpecialty);
    const sameDayDeptApts = existingAppointments.filter(apt => {
      if (apt.date !== selectedDate) return false;
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
    const queueNumber = formatQueueNumber(deptCode, maxSeq + 1);

    const newAppointment: Appointment = {
      id: prefilledApt?.id ?? `apt-${Math.floor(Math.random() * 900000 + 1000)}`,
      doctorId,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.title || selectedDoctor.specialty,
      doctorImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor.name)}&background=0d9488&color=fff`,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      status: "Upcoming",
      type: consultType,
      clinic: selectedClinic.name,
      symptoms: remarks || `${selectedSymptom.label} Consultation`,
      queueNumber,
      shareHistory,
      syncCrossFacilityRecords,
      requestRide
    };

    if (syncCrossFacilityRecords && selectedClinic) {
      try {
        const saved = JSON.parse(localStorage.getItem("pantai_consented_clinics") || "[]");
        if (!saved.includes(selectedClinic.name)) {
          saved.push(selectedClinic.name);
          localStorage.setItem("pantai_consented_clinics", JSON.stringify(saved));
        }
        if (onUpdateProfile && patientProfile) {
          const existing = patientProfile.consentedClinics || [];
          if (!existing.includes(selectedClinic.name)) {
            onUpdateProfile({
              ...patientProfile,
              consentedClinics: [...existing, selectedClinic.name]
            });
          }
        }
      } catch {}
    }

    const result = await onAddAppointment(newAppointment);
    if (result !== false) {
      setLastCreatedVoucher(newAppointment);
      setBookingConfirmed(true);
    }
  };

  return (
    <div id="schedule-appointment-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* Header section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Schedule Appointment</h1>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="grid grid-cols-5 gap-2 text-[9px] uppercase tracking-[0.16em] font-bold text-slate-500">
          {currentStepLabel.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = step === stepNumber;
            const isComplete = step > stepNumber;
            return (
              <div
                key={label}
                className={`rounded-2xl py-3 text-center font-sans tracking-widest transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : isComplete
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                Step {stepNumber}: {label}
              </div>
            );
          })}
        </div>
      </div>

      {bookingConfirmed && (lastCreatedVoucher || upcomingAppointment) ? (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          {/* DIGITAL APPOINTMENT VOUCHER & QUEUE TICKET (LIGHT THEME) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Subtle light background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            {/* Header */}
            <div className="border-b border-slate-100 pb-5 relative z-10">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-1">Appointment Confirmed & Registered</h2>
            </div>

            {/* Main Queue Number display in Light Style */}
            <div className="my-6 p-6 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/60 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left relative z-10 shadow-2xs">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-700 font-bold block">Assigned Queue Number</span>
                <div className="text-4xl sm:text-5xl font-black text-blue-950 font-mono tracking-wider mt-1 drop-shadow-xs">
                  {(lastCreatedVoucher?.queueNumber || upcomingAppointment?.queueNumber || "Q-104").replace(/^#/, "")}
                </div>
              </div>
              <div className="text-center sm:text-right sm:border-l sm:border-blue-200/60 sm:pl-6 shrink-0">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">Arrival Check-in Rule</span>
                <div className="bg-white border border-blue-200/90 text-blue-800 text-xs px-3.5 py-1.5 rounded-xl font-bold shadow-2xs inline-flex items-center">
                  <span>5–10 mins before slot</span>
                </div>
              </div>
            </div>

            {/* MANDATORY ON-SITE ARRIVAL NOTICE (Light Amber) */}
            <div className="my-5 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-950 relative z-10">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed">
                <span className="font-extrabold text-amber-900 uppercase tracking-wider block text-xs">
                  Important Check-In Notice
                </span>
                <p className="text-amber-900/90 font-medium">
                  Please arrive at the clinic counter 5–10 minutes before your appointment time ({lastCreatedVoucher?.timeSlot || upcomingAppointment?.timeSlot}) and present your Queue Number ({(lastCreatedVoucher?.queueNumber || upcomingAppointment?.queueNumber || "Q-104").replace(/^#/, "")}) to the counter staff for on-site presence check-in
                </p>
              </div>
            </div>

            {/* Consultation details grid in Light Clean Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 relative z-10">
              <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Facility / Hospital</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5 truncate">{lastCreatedVoucher?.clinic || upcomingAppointment?.clinic}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Specialist Clinician</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5 truncate">{lastCreatedVoucher?.doctorName || upcomingAppointment?.doctorName}</span>
                <span className="text-[10px] text-blue-600 font-semibold block">{lastCreatedVoucher?.specialty || upcomingAppointment?.specialty}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Scheduled Date</span>
                <span className="font-bold text-slate-900 font-mono text-sm block mt-0.5">{lastCreatedVoucher?.date || upcomingAppointment?.date}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Scheduled Time Slot</span>
                <span className="font-extrabold text-blue-700 bg-blue-100/70 border border-blue-200 font-mono text-xs px-2.5 py-1 rounded-md inline-block mt-0.5">{lastCreatedVoucher?.timeSlot || upcomingAppointment?.timeSlot}</span>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => {
                setBookingConfirmed(false);
                onSetScreen("appointments-history");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-5 rounded-2xl transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>View My Appointments</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingConfirmed(false);
                onSetScreen("dashboard");
              }}
              className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold py-3.5 px-5 rounded-2xl transition shadow-2xs flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>🏠</span>
              <span>Go to Home Dashboard</span>
            </button>
          </div>
        </div>
      ) : upcomingAppointment && !isRescheduling ? (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-8 rounded-3xl shadow-md space-y-6 animate-fade-in">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Upcoming Appointment Scheduled</h2>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Facility</span>
                <span className="font-bold text-slate-800 text-[11px] block">{upcomingAppointment.clinic || "General Clinic"}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Specialist</span>
                <span className="font-bold text-slate-800 text-[11px] block">{upcomingAppointment.doctorName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-3.5">
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Scheduled Date</span>
                <span className="font-bold text-slate-800 font-mono block">{upcomingAppointment.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Time Slot</span>
                <span className="font-bold text-slate-800 font-mono block">{upcomingAppointment.timeSlot}</span>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-3.5 flex items-center justify-between">
              <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider">Queue Number</span>
              <span className="font-mono font-black text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {upcomingAppointment.queueNumber ? (upcomingAppointment.queueNumber.startsWith('#') ? upcomingAppointment.queueNumber : `#${upcomingAppointment.queueNumber}`) : "#Q-104"}
              </span>
            </div>

            {upcomingAppointment.symptoms && (
              <div className="border-t border-slate-200/60 pt-3.5">
                <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Remarks / Symptoms</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">{upcomingAppointment.symptoms}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <button
              type="button"
              onClick={handleStartReschedule}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/10"
            >
              <Clock className="w-4 h-4" /> Reschedule Appointment
            </button>
            <button
              type="button"
              onClick={handleCancelClick}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold py-3.5 rounded-xl border border-rose-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <AlertCircle className="w-4 h-4" /> Cancel Appointment
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Wizard Form Area */}
          <div className="lg:col-span-8">
            
            {/* STEP 1: Select Facility */}
            {step === 1 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 text-slate-800">
                    <Building2 className="w-5.5 h-5.5 text-blue-600" />
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-blue-600 block">Step 1</span>
                      <h2 className="text-lg font-bold text-slate-900">Select PantaiCare Branch</h2>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredFacilities.map((facility) => {
                    const selected = selectedClinic?.id === facility.id;
                    const visual = getFacilityVisual(facility);
                    return (
                      <button
                        key={facility.id}
                        type="button"
                        onClick={() => { setSelectedClinic(facility); setSelectedDoctor(null); }}
                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                          selected
                            ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/25 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${visual.gradient} text-white font-black flex flex-col items-center justify-center shrink-0 shadow-md shadow-slate-900/10 relative overflow-hidden`}>
                            <span className="text-sm tracking-tight font-mono font-black">{visual.code}</span>
                            <span className="absolute bottom-0 right-0 text-[10px] leading-none px-1 py-0.5 bg-black/25 rounded-tl font-sans">{visual.emoji}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                              {facility.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium tracking-tight truncate mt-1">
                              📍 {facility.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end shrink-0">
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                            selected ? 'border-blue-600 bg-blue-600 text-white shadow-xs' : 'border-slate-300 bg-slate-50'
                          }`}>
                            {selected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!selectedClinic}
                    onClick={() => setStep(2)}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-600/15"
                  >
                    Continue to Symptoms
                  </button>
                </div>
              </section>
            )}

            {/* STEP 2: Choose Department */}
            {step === 2 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 text-slate-800">
                    <ClipboardList className="w-5.5 h-5.5 text-blue-600" />
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-blue-600 block">Step 2</span>
                      <h2 className="text-lg font-bold text-slate-900">Choose Department & Specialty</h2>
                    </div>
                  </div>
                  {selectedClinic && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
                      📍 {selectedClinic.name}
                    </span>
                  )}
                </div>

                {/* Carey AI Triage Recommendation Notice */}
                {localStorage.getItem("carey_triage_specialty") && (
                  <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-sky-900 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🤖</span>
                      <div>
                        <strong className="block text-sky-950 font-bold">Carey AI Triage Conclusion Linked:</strong>
                        <span className="text-sky-800">Specialty pre-selected based on your recent symptom assessment.</span>
                      </div>
                    </div>
                    <span className="bg-sky-200/70 text-sky-900 px-2.5 py-1 rounded-lg font-bold font-mono text-[10px] uppercase">
                      Auto-Prefilled
                    </span>
                  </div>
                )}

                {/* Search Department input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={departmentSearch}
                    onChange={(e) => setDepartmentSearch(e.target.value)}
                    placeholder="Search department or specialty (e.g. Cardiology, Surgery, O&G, Urology...)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  {departmentSearch && (
                    <button
                      type="button"
                      onClick={() => setDepartmentSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Grid of selectable department cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {/* Option 1: All Departments */}
                  <button
                    type="button"
                    onClick={() => { setSelectedDepartment("all"); setSelectedDoctor(null); }}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                      selectedDepartment === "all"
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/25 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 text-xs">All Departments</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        View all {totalHospitalDoctors} registered doctors
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedDepartment === "all" ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-slate-50'
                    }`}>
                      {selectedDepartment === "all" && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                    </div>
                  </button>

                  {/* Individual department cards */}
                  {filteredDepartments.map((dept) => {
                    const isSelected = selectedDepartment === dept;
                    const docCount = departmentCounts[dept] || 0;
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => { setSelectedDepartment(dept); setSelectedDoctor(null); }}
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/25 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs leading-snug truncate" title={dept}>
                            {dept}
                          </p>
                          <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
                            {docCount} {docCount === 1 ? 'Doctor' : 'Doctors'}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-slate-50'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom remarks / additional notes */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Add Consultation Notes / Symptoms (Optional)</label>
                  <textarea
                    value={customSymptomText}
                    onChange={(e) => setCustomSymptomText(e.target.value)}
                    rows={3}
                    placeholder="Provide additional details regarding symptoms, reason for visit, or specific requests..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    Back to Facility
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white transition hover:bg-blue-700 cursor-pointer shadow-md shadow-blue-600/15"
                  >
                    Continue to Choose Doctor
                  </button>
                </div>
              </section>
            )}

            {/* STEP 3: Choose Doctor */}
            {step === 3 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 text-slate-800">
                    <Stethoscope className="w-5.5 h-5.5 text-blue-600" />
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-blue-600 block">Step 3</span>
                      <h2 className="text-lg font-bold text-slate-900">Choose Doctor</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                      {selectedDepartment === "all" ? "All Departments" : selectedDepartment} ({matchingDoctors.length})
                    </span>
                  </div>
                </div>

                {/* Doctor Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Search doctor by name (e.g. Dr. Abdul Fahmi, Dr. Adilah)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  {doctorSearch && (
                    <button
                      type="button"
                      onClick={() => setDoctorSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {matchingDoctors.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                        {matchingDoctors.length} {matchingDoctors.length === 1 ? 'Doctor Available' : 'Doctors Available'}
                      </span>
                      {selectedDepartment !== "all" && (
                        <button
                          type="button"
                          onClick={() => setSelectedDepartment("all")}
                          className="text-blue-600 hover:underline font-semibold text-[11px] cursor-pointer"
                        >
                          Show all departments
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-1">
                      {matchingDoctors.map((doctor) => {
                        const selected = selectedDoctor?.name === doctor.name;
                        const statusLower = doctor.status?.toLowerCase();
                        const isResident = statusLower === "resident";
                        const isSessional = statusLower === "sessional";
                        const isVisiting = statusLower === "visiting";
                        return (
                          <button
                            key={doctor.id || doctor.name}
                            type="button"
                            onClick={() => setSelectedDoctor(doctor as any)}
                            className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left transition-all duration-200 cursor-pointer ${
                              selected
                                ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/25 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-2xs'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs font-mono">
                              {doctor.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-900 text-sm leading-snug">{doctor.name}</p>
                                {doctor.status && (
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                    isResident 
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                      : isSessional
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : isVisiting
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    {doctor.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-1">
                                Department: <span className="text-slate-800 font-semibold">{doctor.department || doctor.specialty}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition ${
                                selected ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'border-slate-300 bg-slate-50'
                              }`}>
                                {selected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <p className="font-bold text-slate-700 text-sm">No doctors found matching your criteria</p>
                    <p className="text-xs text-slate-500">
                      Try clearing your search query or selecting "All Departments" to see all available physicians.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setDoctorSearch(""); setSelectedDepartment("all"); }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}

                {rosterAvailability?.type === 'SESSIONAL' && (!rosterAvailability.availableDates || rosterAvailability.availableDates.length === 0) && (
                  <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl text-purple-950 text-xs flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-purple-900">Sessional Specialist — No Open Clinic Sessions</div>
                      <div className="text-[11px] text-purple-700 mt-0.5">
                        Dr. {selectedDoctor?.name} is a Sessional Consultant with on-demand clinics. There are currently no consultation sessions open for booking. Please select another doctor or check back once hospital administration releases new session dates.
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    Back to Department
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (rosterAvailability?.type === 'SESSIONAL') {
                        const openDates = rosterAvailability.availableDates || [];
                        if (openDates.length === 0) {
                          alert(`Dr. ${selectedDoctor?.name} is a Sessional Specialist and has no open clinic sessions scheduled at this time. Please select another doctor.`);
                          return;
                        }
                        if (!selectedDate || !openDates.includes(selectedDate)) {
                          setSelectedDate(openDates[0]);
                        }
                      } else {
                        if (!selectedDate || selectedDate < todayStr) {
                          setSelectedDate(todayStr);
                        }
                      }
                      setStep(4);
                    }}
                    disabled={!selectedDoctor || (rosterAvailability?.type === 'SESSIONAL' && (!rosterAvailability.availableDates || rosterAvailability.availableDates.length === 0))}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-600/15"
                  >
                    Continue to Schedule Slot
                  </button>
                </div>
              </section>
            )}

            {/* STEP 4: Date, Time & Remarks */}
            {step === 4 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 text-slate-800">
                  <Calendar className="w-5.5 h-5.5 text-blue-600" />
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-blue-600 block">Step 4</span>
                    <h2 className="text-lg font-bold text-slate-900">Date, Time & Remarks: When & Details</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Calendar Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Pick Date</label>
                      <span className="text-[11px] text-slate-400 font-mono">Today: {todayStr}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedDate}
                        min={todayStr}
                        max={maxDateStr}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            setSelectedDate("");
                            return;
                          }
                          if (val < todayStr) {
                            alert(`Please select today (${todayStr}) or a future date.`);
                            return;
                          }
                          if (val > maxDateStr) {
                            alert(`Appointments can only be scheduled up to 3 months in advance (${maxDateStr}).`);
                            return;
                          }

                          // Validate availability using differentiated roster engine
                          const check = validateDateAvailability(val);
                          if (!check.valid) {
                            alert(check.reason);
                            return;
                          }

                          setSelectedDate(val);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-bold font-mono"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Appointments can be scheduled from today ({todayStr}) up to 3 months ahead ({maxDateStr}).
                    </span>

                    {/* Differentiated Sessional vs Resident Roster Banner */}
                    {rosterAvailability?.type === 'SESSIONAL' ? (
                      <div className="mt-2.5 p-3.5 rounded-2xl bg-purple-50/90 border border-purple-200 text-purple-950 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                          <span>Sessional Specialist — On-Demand Bookable Dates</span>
                        </div>
                        {rosterAvailability.availableDates && rosterAvailability.availableDates.length > 0 ? (
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-purple-800 font-medium block">
                              Select an open session date approved by hospital administration:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {rosterAvailability.availableDates.map((dStr: string) => (
                                <button
                                  key={dStr}
                                  type="button"
                                  onClick={() => setSelectedDate(dStr)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                                    selectedDate === dStr
                                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                      : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                                  }`}
                                >
                                  {dStr}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-purple-700">
                            No on-demand clinic sessions currently scheduled. The calendar for this specialist is closed until dates are released by clinic administration.
                          </p>
                        )}
                      </div>
                    ) : rosterAvailability?.type === 'RESIDENT' && Array.isArray(rosterAvailability.activeDaysOfWeek) ? (
                      <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>
                          Resident Active Clinic Days: {
                            rosterAvailability.activeDaysOfWeek.map((d: number) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d - 1]).join(', ')
                          }
                        </span>
                      </div>
                    ) : null}

                    {/* Upcoming Facility Holidays Warning */}
                    {facilityHolidays.length > 0 && (
                      <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Scheduled Facility Holidays (Slots Blocked):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {facilityHolidays.map((h: any, idx: number) => (
                            <span key={idx} className="font-mono text-[10px] font-bold bg-white border border-amber-300 text-amber-800 px-2 py-0.5 rounded">
                              {h.holiday_date || h.date}: {h.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Slots Grid with Dynamic Capacity Decay Engine */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Select Time Slot
                    </label>
                    <span className="text-[11px] text-slate-400">
                      1-Hour Consultation Slots
                    </span>
                  </div>

                  {isDoctorOnLeave ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start gap-3 text-xs">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-bold">Doctor is Away / On Leave</p>
                        <p className="mt-1 leading-relaxed text-amber-850">
                          <strong>{selectedDoctor?.name}</strong> is on leave or unavailable on this date. Please select another date or check another doctor's availability.
                        </p>
                      </div>
                    </div>
                  ) : isClinicClosed ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <p className="font-bold">Facility is Closed</p>
                        <p className="mt-1 leading-relaxed text-rose-700">
                          <strong>{selectedClinic?.name}</strong> is closed on this day of the week. Please select another date.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isLoadingAppointments && (
                        <div className="text-xs text-blue-600 animate-pulse flex items-center gap-1.5 py-1">
                          <Clock className="w-4 h-4 animate-spin" /> Updating real-time slot capacity...
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {slotCapacities.map((item) => {
                          const isSelected = selectedTimeSlot === item.slot;
                          const isAvailable = item.isAvailable;

                          return (
                            <button
                              key={item.slot}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => setSelectedTimeSlot(item.slot)}
                              className={`rounded-2xl border p-3.5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                                  : isAvailable
                                  ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs text-slate-800'
                                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`font-mono text-xs font-black tracking-tight ${isSelected ? 'text-white' : isAvailable ? 'text-slate-900' : 'text-slate-500'}`}>
                                  {item.slot}
                                </span>
                                {item.isBuffer && isAvailable && (
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                    isSelected ? 'bg-blue-500 text-white' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    Buffer
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100/60">
                                {isAvailable ? (
                                  <span className={`font-bold ${isSelected ? 'text-blue-100' : 'text-emerald-600'}`}>
                                    ● {item.availableCount} left
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-500 truncate" title={item.disabledReason}>
                                    🔒 {item.disabledReason || "Unavailable"}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Remarks text field */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Remarks / Extra Notes</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                    placeholder="Enter any additional instructions, symptoms, or medical notes for the doctor..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                {/* Just-in-Time Dynamic Consent: Cross-Facility Record Access Authorization */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5">
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-900 block text-xs">
                      Cross-Facility Clinical Record Access Authorization
                    </span>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      You are scheduling an appointment at <strong>{selectedClinic?.name || "this PantaiCare facility"}</strong>. Do you authorize attending clinicians at this facility to access and review your historical medical consultations, lab test results, and prescriptions from affiliated PantaiCare branches?
                    </p>
                  </div>

                  <label className="flex items-center gap-3 bg-white border border-teal-200/80 rounded-xl p-3.5 cursor-pointer hover:bg-teal-50/20 transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={syncCrossFacilityRecords}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSyncCrossFacilityRecords(checked);
                        setShareHistory(checked);
                        if (checked && selectedClinic) {
                          try {
                            const saved = JSON.parse(localStorage.getItem("pantai_consented_clinics") || "[]");
                            if (!saved.includes(selectedClinic.name)) {
                              saved.push(selectedClinic.name);
                              localStorage.setItem("pantai_consented_clinics", JSON.stringify(saved));
                            }
                            if (onUpdateProfile && patientProfile) {
                              const existingClinics = patientProfile.consentedClinics || [];
                              if (!existingClinics.includes(selectedClinic.name)) {
                                onUpdateProfile({
                                  ...patientProfile,
                                  consentedClinics: [...existingClinics, selectedClinic.name]
                                });
                              }
                            }
                          } catch {}
                        }
                      }}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-350 accent-teal-600 cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Authorize cross-facility records access and continue booking
                    </span>
                  </label>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (isRescheduling) {
                        setIsRescheduling(false);
                      } else {
                        setStep(3);
                      }
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {isRescheduling ? "Cancel Reschedule" : "Back to Doctor"}
                  </button>
                  {isRescheduling ? (
                    <button
                      type="submit"
                      disabled={!selectedDoctor || !selectedClinic || !selectedTimeSlot}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                    >
                      Confirm Reschedule
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!selectedDate || !selectedTimeSlot}
                      onClick={() => setStep(5)}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                    >
                      Continue to Review & Confirm
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* STEP 5: Review & Confirm Appointment */}
            {step === 5 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 text-slate-800">
                    <ShieldCheck className="w-5.5 h-5.5 text-blue-600" />
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-blue-600 block">Step 5</span>
                      <h2 className="text-lg font-bold text-slate-900">Review & Confirm Appointment</h2>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                    Final Step
                  </span>
                </div>

                {/* Appointment Overview Summary Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                    Consultation Details Overview
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Facility */}
                    <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Facility & Location</span>
                      <span className="font-extrabold text-slate-900 text-sm block">{selectedClinic?.name || "Selected Facility"}</span>
                      <span className="text-slate-500 text-[11px] block">{selectedClinic?.address || "Penang, Malaysia"}</span>
                    </div>

                    {/* Doctor & Specialty */}
                    <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Physician & Specialty</span>
                      <span className="font-extrabold text-slate-900 text-sm block">{selectedDoctor?.name || "Attending Doctor"}</span>
                    </div>

                    {/* Date & Time */}
                    <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Appointment Schedule</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-extrabold text-slate-900 text-sm font-mono">{selectedDate}</span>
                        <span className="bg-blue-100 text-blue-800 font-extrabold text-xs px-2 py-0.5 rounded-md font-mono">{selectedTimeSlot}</span>
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Reported Symptoms / Concern</span>
                      <span className="font-extrabold text-slate-900 text-xs block">{selectedSymptom?.label || selectedDepartment || "General Checkup"}</span>
                      {customSymptomText && (
                        <p className="text-slate-600 text-[11px] italic mt-1 bg-slate-50 p-2 rounded border border-slate-150">
                          "{customSymptomText}"
                        </p>
                      )}
                    </div>

                    {/* Dynamic Record Access Authorization */}
                    <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-1 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cross-Facility Medical Records Access</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${syncCrossFacilityRecords ? "text-emerald-700" : "text-slate-600"}`}>
                          {syncCrossFacilityRecords 
                            ? `Authorized: Attending clinicians at ${selectedClinic?.name || "this hospital"} are permitted to review cross-facility records.` 
                            : `Default Isolation: Access restricted to originating facility.`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mandatory 5-10 Minute On-Site Arrival Notice */}
                <div className="p-4 bg-amber-500/10 border-2 border-amber-400/60 rounded-2xl space-y-1 text-xs leading-relaxed text-amber-900">
                  <span className="font-black text-amber-900 uppercase tracking-wider block text-xs">
                    Mandatory Counter Arrival Notice
                  </span>
                  <p className="text-amber-850 font-medium">
                    Please arrive at the <strong>{selectedClinic?.name}</strong> reception counter at least <strong>5–10 minutes before your scheduled appointment time ({selectedTimeSlot})</strong> and present your assigned <strong>Queue Number</strong> to the clinic staff.
                  </p>
                </div>

                {/* Step 5 Navigation Buttons */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Date & Time
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedDoctor || !selectedClinic || !selectedTimeSlot}
                    className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
                  >
                    Confirm Booking & Generate Queue Voucher
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar booking summary */}
          <aside className="lg:col-span-4 space-y-4 sticky top-20">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400 font-extrabold block mb-4">
                Booking Preview
              </span>
              
              <div className="space-y-4 text-xs">
                {/* Facility */}
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-1">Facility</span>
                  {selectedClinic ? (
                    <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 text-[11px] block leading-snug">{selectedClinic.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">📍 {selectedClinic.address}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic block">Not selected yet</span>
                  )}
                </div>

                {/* Symptom */}
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-1">Symptoms Checklist</span>
                  {selectedSymptom || customSymptomText ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <span className="font-bold text-slate-800 block text-[11px]">{selectedSymptom?.label || "Consultation"}</span>
                      {customSymptomText && (
                        <span className="text-[10px] text-slate-400 block mt-1 italic truncate">"{customSymptomText}"</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic block">Not selected yet</span>
                  )}
                </div>

                {/* Doctor */}
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-1">Assigned Clinician</span>
                  {selectedDoctor ? (
                    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {selectedDoctor.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-[11px] block leading-snug">{selectedDoctor.name}</span>
                        <span className="text-[10px] text-blue-600 block mt-0.5">{selectedDoctor.title}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic block">Not selected yet</span>
                  )}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Date</span>
                    {step >= 4 && selectedDate ? (
                      <span className="font-bold text-slate-800 font-mono">{selectedDate}</span>
                    ) : (
                      <span className="text-slate-500 italic block">Not selected yet</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Time Slot</span>
                    {step >= 4 && selectedTimeSlot ? (
                      <span className="font-bold text-slate-800 font-mono">{selectedTimeSlot}</span>
                    ) : (
                      <span className="text-slate-500 italic block">Not selected yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {lastBooking && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400 font-extrabold block mb-4">
                  Last Booking Reference
                </span>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-1">Facility</span>
                    <span className="font-bold text-slate-800 text-[11px] block leading-snug">{lastBooking.clinic || lastBooking.hospital || "General Facility"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-1">Doctor</span>
                    <span className="font-bold text-slate-850 text-[11px] block leading-snug">{lastBooking.doctorName}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{lastBooking.specialty}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Date</span>
                      <span className="font-bold text-slate-800 font-mono block leading-none mt-0.5">{lastBooking.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Time</span>
                      <span className="font-bold text-slate-800 font-mono block leading-none mt-0.5">{lastBooking.timeSlot}</span>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider">Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase ${
                      lastBooking.status === "Upcoming"
                        ? "bg-amber-100 text-amber-800"
                        : lastBooking.status === "Completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {lastBooking.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </aside>

        </form>
      )}
    </div>
  );
}
