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
  Car,
  Sparkles,
  Share2,
  FileText
} from "lucide-react";
import { Appointment } from "../types";
import { privateHospitals, privateClinics, Hospital } from "./HospitalsPage";
import { specialties, Specialty, Doctor as DocPageDoctor } from "./DoctorsPage";

interface ScheduleAppointmentProps {
  onAddAppointment: (appointment: Appointment) => void;
  prefilledApt?: Appointment | null;
  onSetScreen: (screen: string) => void;
  appointments: Appointment[];
  onCancelAppointment: (id: string) => void;
  onRescheduleAppointment: (id: string, date: string, timeSlot: string) => void;
}

// All facilities on appointment page are strictly private hospitals and private clinics
const allFacilities: Hospital[] = [...privateHospitals, ...privateClinics];

// Symptom options mapping to specialty IDs in DoctorsPage
const symptomOptions = [
  { id: "emergency-symptom", label: "Emergency / Trauma Arrival Prep", specialtyId: "emergency", icon: AlertTriangle, iconColor: "text-red-650", bg: "bg-red-50", border: "border-red-100" },
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
  const isClinic = facility.type.toLowerCase().includes("clinic");

  if (id === "pantai") {
    return {
      gradient: "from-rose-500 to-red-600",
      bgLight: "bg-rose-50",
      textCol: "text-rose-600",
      borderCol: "border-rose-200",
      badgeCol: "bg-rose-100 text-rose-800",
      code: "PHP",
      emoji: "🏥",
      highlights: "Tertiary Cardiology & Oncology",
    };
  }
  if (id === "lwe") {
    return {
      gradient: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50",
      textCol: "text-amber-600",
      borderCol: "border-amber-200",
      badgeCol: "bg-amber-100 text-amber-800",
      code: "HLW",
      emoji: "🏥",
      highlights: "Trusted Community Laparoscopic Surgery",
    };
  }
  if (id === "gleneagles") {
    return {
      gradient: "from-indigo-500 to-blue-600",
      bgLight: "bg-indigo-50",
      textCol: "text-indigo-600",
      borderCol: "border-indigo-200",
      badgeCol: "bg-indigo-100 text-indigo-800",
      code: "GHP",
      emoji: "🏥",
      highlights: "International JCI Specialist Care",
    };
  }
  if (id === "island") {
    return {
      gradient: "from-teal-500 to-cyan-600",
      bgLight: "bg-teal-50",
      textCol: "text-teal-600",
      borderCol: "border-teal-200",
      badgeCol: "bg-teal-100 text-teal-800",
      code: "ISL",
      emoji: "🏥",
      highlights: "Award-winning Gastroenterology & Pediatrics",
    };
  }
  if (id === "adv") {
    return {
      gradient: "from-blue-600 to-indigo-700",
      bgLight: "bg-blue-50",
      textCol: "text-blue-600",
      borderCol: "border-blue-200",
      badgeCol: "bg-blue-100 text-blue-800",
      code: "PAH",
      emoji: "🏥",
      highlights: "Cardiac Vascular & Oncology Network",
    };
  }
  if (id === "loh") {
    return {
      gradient: "from-fuchsia-600 to-purple-700",
      bgLight: "bg-fuchsia-50",
      textCol: "text-fuchsia-600",
      borderCol: "border-fuchsia-200",
      badgeCol: "bg-fuchsia-100 text-fuchsia-800",
      code: "LGL",
      emoji: "🏥",
      highlights: "ENT, Fertility & Diagnostic Imaging",
    };
  }
  if (id === "kpj") {
    return {
      gradient: "from-emerald-600 to-teal-700",
      bgLight: "bg-emerald-50",
      textCol: "text-emerald-600",
      borderCol: "border-emerald-200",
      badgeCol: "bg-emerald-100 text-emerald-800",
      code: "KPJ",
      emoji: "🏥",
      highlights: "Perai Specialist & Emergency Services",
    };
  }
  if (id === "mmc") {
    return {
      gradient: "from-purple-600 to-pink-600",
      bgLight: "bg-purple-50",
      textCol: "text-purple-600",
      borderCol: "border-purple-200",
      badgeCol: "bg-purple-100 text-purple-800",
      code: "MMC",
      emoji: "🎗️",
      highlights: "Specialist Oncology & Radiotherapy",
    };
  }
  if (id === "o2") {
    return {
      gradient: "from-sky-500 to-teal-600",
      bgLight: "bg-sky-50",
      textCol: "text-sky-600",
      borderCol: "border-sky-200",
      badgeCol: "bg-sky-100 text-sky-800",
      code: "O2",
      emoji: "🩺",
      highlights: "Modern Family Medicine & Preventive Screenings",
    };
  }
  if (id === "ks") {
    return {
      gradient: "from-teal-600 to-emerald-600",
      bgLight: "bg-teal-50",
      textCol: "text-teal-600",
      borderCol: "border-teal-200",
      badgeCol: "bg-teal-100 text-teal-800",
      code: "KS",
      emoji: "🩺",
      highlights: "Georgetown General Practice & Minor Procedures",
    };
  }
  if (id === "pp") {
    return {
      gradient: "from-cyan-600 to-blue-600",
      bgLight: "bg-cyan-50",
      textCol: "text-cyan-600",
      borderCol: "border-cyan-200",
      badgeCol: "bg-cyan-100 text-cyan-800",
      code: "PP",
      emoji: "🩺",
      highlights: "Walk-in Consultations & Chronic Care Monitoring",
    };
  }

  return {
    gradient: isClinic ? "from-sky-500 to-teal-600" : "from-teal-600 to-cyan-700",
    bgLight: isClinic ? "bg-sky-50" : "bg-teal-50",
    textCol: isClinic ? "text-sky-600" : "text-teal-600",
    borderCol: "border-slate-200",
    badgeCol: isClinic ? "bg-sky-100 text-sky-800" : "bg-teal-100 text-teal-800",
    code: facility.name.substring(0, 3).toUpperCase(),
    emoji: isClinic ? "🩺" : "🏥",
    highlights: facility.tag || facility.type,
  };
}

interface BookingHours {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  isClosed: boolean;
}

function getBookingHours(facility: Hospital, dayOfWeek: number): BookingHours {
  const id = facility.id;
  
  // 24-hour hospitals: default to 9:00 AM - 5:00 PM, open 7 days
  if (["hpg", "hsj", "pantai", "lwe", "gleneagles", "island"].includes(id)) {
    return { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0, isClosed: false };
  }
  
  // KK clinics: Mon–Fri: 7:30 AM – 5:00 PM | Sat: 7:30 AM – 1:00 PM | Sun: Closed
  if (["kkjp", "kkbb"].includes(id)) {
    if (dayOfWeek === 0) { // Sunday
      return { startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isClosed: true };
    }
    if (dayOfWeek === 6) { // Saturday
      return { startHour: 7, startMinute: 30, endHour: 13, endMinute: 0, isClosed: false };
    }
    // Mon-Fri
    return { startHour: 7, startMinute: 30, endHour: 17, endMinute: 0, isClosed: false };
  }
  
  // O2 Klinik: Mon–Sat: 8:30 AM – 9:00 PM | Sun: Closed
  if (id === "o2") {
    if (dayOfWeek === 0) {
      return { startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isClosed: true };
    }
    return { startHour: 8, startMinute: 30, endHour: 21, endMinute: 0, isClosed: false };
  }
  
  // Klinik Singapore: Mon–Sat: 8:00 AM – 6:00 PM | Sun: Closed
  if (id === "ks") {
    if (dayOfWeek === 0) {
      return { startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isClosed: true };
    }
    return { startHour: 8, startMinute: 0, endHour: 18, endMinute: 0, isClosed: false };
  }
  
  // Poliklinik Perdana: Mon–Fri: 8:00 AM – 5:30 PM | Sat-Sun: Closed
  if (id === "pp") {
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, isClosed: true };
    }
    return { startHour: 8, startMinute: 0, endHour: 17, endMinute: 30, isClosed: false };
  }
  
  // Fallback
  return { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0, isClosed: false };
}

function generateTimeSlots(hours: BookingHours): string[] {
  if (hours.isClosed) return [];
  
  const slots: string[] = [];
  let currentHour = hours.startHour;
  let currentMinute = hours.startMinute;
  
  const endTotalMinutes = hours.endHour * 60 + hours.endMinute;
  
  while (true) {
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    if (currentTotalMinutes >= endTotalMinutes) {
      break;
    }
    
    const isPM = currentHour >= 12;
    const displayHour = currentHour % 12 === 0 ? 12 : currentHour % 12;
    const displayHourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
    const displayMinuteStr = currentMinute < 10 ? `0${currentMinute}` : `${currentMinute}`;
    const ampm = isPM ? "PM" : "AM";
    
    slots.push(`${displayHourStr}:${displayMinuteStr} ${ampm}`);
    
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }
  }
  
  return slots;
}

export default function ScheduleAppointment({
  onAddAppointment,
  prefilledApt,
  onSetScreen,
  appointments,
  onCancelAppointment,
  onRescheduleAppointment
}: ScheduleAppointmentProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1 states
  const [careTrackFilter, setCareTrackFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectedClinic, setSelectedClinic] = useState<Hospital | null>(() => {
    if (prefilledApt?.clinic) {
      return allFacilities.find(f => f.name.toLowerCase() === prefilledApt.clinic?.toLowerCase()) || null;
    }
    return null;
  });

  // Step 2 states
  const [selectedSymptomId, setSelectedSymptomId] = useState<string>("general");
  const [customSymptomText, setCustomSymptomText] = useState("");

  // Step 3 states
  const [selectedDoctor, setSelectedDoctor] = useState<DocPageDoctor | null>(() => {
    if (prefilledApt?.doctorName) {
      for (const sp of specialties) {
        const doc = sp.doctors.find(d => d.name.toLowerCase() === prefilledApt.doctorName?.toLowerCase());
        if (doc) return doc;
      }
    }
    return null;
  });

  // Step 4 & 5 states
  const [selectedDate, setSelectedDate] = useState(prefilledApt?.date ?? "2026-10-12");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(prefilledApt?.timeSlot ?? "");
  const [remarks, setRemarks] = useState(prefilledApt?.symptoms ?? "");
  
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
  const [isRescheduling, setIsRescheduling] = useState(false);

  const upcomingAppointment = useMemo(() => {
    return appointments.find(apt => apt.status === "Upcoming") || null;
  }, [appointments]);

  const lastBooking = useMemo(() => {
    if (!appointments || appointments.length === 0) return null;
    return [...appointments].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];
  }, [appointments]);

  const handleStartReschedule = () => {
    if (!upcomingAppointment) return;
    const clinicObj = allFacilities.find(f => f.name.toLowerCase() === upcomingAppointment.clinic?.toLowerCase()) || allFacilities[0];
    let doctorObj = null;
    for (const sp of specialties) {
      const doc = sp.doctors.find(d => d.name.toLowerCase() === upcomingAppointment.doctorName.toLowerCase());
      if (doc) {
        doctorObj = doc;
        break;
      }
    }
    setSelectedClinic(clinicObj);
    setSelectedDoctor(doctorObj);
    setSelectedDate(upcomingAppointment.date);
    setSelectedTimeSlot(upcomingAppointment.timeSlot);
    setRemarks(upcomingAppointment.symptoms);
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
    if (!upcomingAppointment || !selectedDate || !selectedTimeSlot) return;
    onRescheduleAppointment(upcomingAppointment.id, selectedDate, selectedTimeSlot);
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingConfirmed(false);
      setIsRescheduling(false);
      onSetScreen("dashboard");
    }, 1800);
  };

  // Sync remarks field when symptom selection changes
  const selectedSymptom = useMemo(() => {
    return symptomOptions.find(s => s.id === selectedSymptomId) || symptomOptions[8];
  }, [selectedSymptomId]);

  // Filter symptoms based on what specialties are available at the selected facility
  const availableSymptoms = useMemo(() => {
    if (!selectedClinic) return symptomOptions;

    // Get the unique specialties of these doctors
    const availableSpecialtyIds = new Set(
      specialties.filter(s =>
        s.doctors.some(d => d.hospital.toLowerCase() === selectedClinic.name.toLowerCase())
      ).map(s => s.id)
    );

    // Filter symptom options to those that have matching specialties at the selected facility
    // Always include "other" / general triage
    return symptomOptions.filter(opt =>
      availableSpecialtyIds.has(opt.specialtyId) || opt.id === "other" || opt.id === "emergency-symptom"
    );
  }, [selectedClinic]);

  // Reset selected symptom if it is no longer available at the selected clinic
  useEffect(() => {
    if (selectedClinic) {
      const isAvailable = availableSymptoms.some(s => s.id === selectedSymptomId);
      if (!isAvailable) {
        setSelectedSymptomId("other");
      }
    }
  }, [selectedClinic, availableSymptoms, selectedSymptomId]);

  useEffect(() => {
    if (!prefilledApt) {
      const summaryText = `${selectedSymptom.label}.${customSymptomText ? ` Description: ${customSymptomText}` : ""}`;
      setRemarks(summaryText);
    }
  }, [selectedSymptom, customSymptomText, prefilledApt]);

  // Filter facilities: all facilities are strictly private hospitals and private clinics
  const filteredFacilities = useMemo(() => {
    return allFacilities;
  }, []);

  // Get matching doctors based on clinic and symptom
  const matchingDoctors = useMemo(() => {
    if (!selectedClinic || !selectedSymptom) return [];
    
    // Find specialty corresponding to symptom
    const targetSpecialty = specialties.find(s => s.id === selectedSymptom.specialtyId);
    if (!targetSpecialty) return [];

    return targetSpecialty.doctors.filter(d => d.hospital.toLowerCase() === selectedClinic.name.toLowerCase());
  }, [selectedClinic, selectedSymptom]);

  // Find general practitioners at this clinic as a triage fallback
  const clinicGPs = useMemo(() => {
    if (!selectedClinic) return [];
    const gpSpecialty = specialties.find(s => s.id === "gp-family");
    if (!gpSpecialty) return [];

    return gpSpecialty.doctors.filter(d => d.hospital.toLowerCase() === selectedClinic.name.toLowerCase());
  }, [selectedClinic]);

  // Find other hospitals that have the target specialist
  const alternateFacilitiesForSpecialty = useMemo(() => {
    if (!selectedSymptom) return [];
    const targetSpecId = selectedSymptom.specialtyId;
    const specialtyObj = specialties.find(s => s.id === targetSpecId);
    if (!specialtyObj) return [];
    
    const clinicNames = Array.from(new Set(specialtyObj.doctors.map(d => d.hospital)));
    return allFacilities.filter(f => clinicNames.some(name => name.toLowerCase() === f.name.toLowerCase()));
  }, [selectedSymptom]);

  // Generate time slots based on selected clinic and date
  const generatedSlots = useMemo(() => {
    if (!selectedClinic) return [];
    
    // Parse selectedDate to find day of the week
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return [];
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();
    
    const hours = getBookingHours(selectedClinic, dayOfWeek);
    return generateTimeSlots(hours);
  }, [selectedClinic, selectedDate]);

  const [doctorSchedule, setDoctorSchedule] = useState<any>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  useEffect(() => {
    if (!selectedDoctor) {
      setDoctorSchedule(null);
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
  }, [selectedDoctor]);

  const isDoctorOnLeave = useMemo(() => {
    if (doctorSchedule && doctorSchedule.blockedDates && doctorSchedule.blockedDates.includes(selectedDate)) {
      return true;
    }
    return false;
  }, [selectedDate, doctorSchedule]);

  const isClinicClosed = useMemo(() => {
    if (!selectedClinic) return false;
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();
    
    const hours = getBookingHours(selectedClinic, dayOfWeek);
    return hours.isClosed;
  }, [selectedClinic, selectedDate]);

  const visibleSlots = useMemo(() => {
    if (showAllSlots) return generatedSlots;
    return generatedSlots.slice(0, 8);
  }, [generatedSlots, showAllSlots]);

  // Sync selectedTimeSlot with generated slots
  useEffect(() => {
    if (generatedSlots.length > 0) {
      if (!generatedSlots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot(generatedSlots[0]);
      }
    } else {
      setSelectedTimeSlot("");
    }
  }, [generatedSlots, selectedTimeSlot]);

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

  const currentStepLabel = ["Facility", "Symptoms", "Doctor", "Schedule", "Preferences"] as const;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRescheduling) {
      handleConfirmReschedule(event);
      return;
    }
    if (!selectedClinic || !selectedDoctor) return;

    // Create unique doctor ID based on name
    const doctorId = selectedDoctor.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // Auto-generate unique Queue Number
    const randomSuffix = Math.floor(100 + Math.random() * 899);
    const queueNumber = `#Q-${randomSuffix}`;

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

    onAddAppointment(newAppointment);
    setLastCreatedVoucher(newAppointment);
    setBookingConfirmed(true);
  };

  return (
    <div id="schedule-appointment-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* Header section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Schedule Appointment</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Book consultations across Penang's private specialist hospitals and clinics. Choose where you want to go, select symptoms, pick your doctor, select your slot, and manage record sharing preferences.
            </p>
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
          {/* DIGITAL APPOINTMENT VOUCHER & QUEUE TICKET */}
          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white rounded-3xl p-7 shadow-2xl border border-blue-900/60 relative overflow-hidden">
            {/* Background watermark badge */}
            <div className="absolute -right-8 -bottom-8 opacity-10 text-[140px] font-black pointer-events-none select-none">
              TICKET
            </div>

            <div className="flex items-center justify-between border-b border-blue-800/60 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-500/20 border border-blue-400/30 rounded-2xl flex items-center justify-center text-blue-300">
                  <Check className="w-6 h-6 stroke-[3px]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-blue-300 block font-bold">Official Digital Voucher</span>
                  <h2 className="text-xl font-black tracking-tight text-white">Appointment Confirmed & Registered</h2>
                </div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-mono font-bold">
                VALID
              </span>
            </div>

            {/* Main Queue Number display */}
            <div className="my-6 p-5 bg-blue-950/80 border border-blue-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-300 font-bold block">Assigned Queue Number (排队号码)</span>
                <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-wider mt-1 drop-shadow-sm">
                  {lastCreatedVoucher?.queueNumber || upcomingAppointment?.queueNumber || "#Q-104"}
                </div>
                <span className="text-xs text-slate-300 block mt-1">
                  Present this number at the reception desk upon physical arrival.
                </span>
              </div>
              <div className="text-right sm:border-l sm:border-blue-900 sm:pl-5 shrink-0">
                <span className="text-[10px] uppercase font-mono text-blue-300 font-bold block">Arrival Check-in Rule</span>
                <div className="bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs px-3 py-1.5 rounded-xl font-bold mt-1 inline-block">
                  ⏱️ 5–10 mins before slot
                </div>
              </div>
            </div>

            {/* MANDATORY ON-SITE ARRIVAL NOTICE (Requested by user) */}
            <div className="my-5 p-4 bg-amber-400/15 border border-amber-400/40 rounded-2xl flex items-start gap-3 text-amber-200">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed">
                <span className="font-extrabold text-amber-300 uppercase tracking-wider block text-sm">
                  ⚠️ Important Check-In Notice (现场报到凭证须知)
                </span>
                <p className="text-amber-100">
                  Please arrive at the clinic counter <strong>5–10 minutes before your appointment time ({lastCreatedVoucher?.timeSlot || upcomingAppointment?.timeSlot})</strong> and present your Queue Number (<strong className="font-mono text-amber-300 text-sm">{lastCreatedVoucher?.queueNumber || upcomingAppointment?.queueNumber}</strong>) to the counter staff for on-site presence check-in. Make sure you have arrived in person to confirm your consultation slot!
                </p>
              </div>
            </div>

            {/* Consultation details grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-blue-800/60 text-slate-200">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-blue-300/80 block">Facility / Hospital</span>
                <span className="font-bold text-white text-sm block truncate">{lastCreatedVoucher?.clinic || upcomingAppointment?.clinic}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-blue-300/80 block">Specialist Clinician</span>
                <span className="font-bold text-white text-sm block truncate">{lastCreatedVoucher?.doctorName || upcomingAppointment?.doctorName}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-blue-300/80 block">Scheduled Date</span>
                <span className="font-bold text-amber-300 text-sm block">{lastCreatedVoucher?.date || upcomingAppointment?.date}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-blue-300/80 block">Scheduled Time Slot</span>
                <span className="font-bold text-amber-300 text-sm block">{lastCreatedVoucher?.timeSlot || upcomingAppointment?.timeSlot}</span>
              </div>
            </div>

            {/* Cross-Facility Synchronization Badge */}
            {(lastCreatedVoucher?.syncCrossFacilityRecords || upcomingAppointment?.syncCrossFacilityRecords) && (
              <div className="mt-4 p-3 bg-blue-900/40 border border-blue-700/40 rounded-xl flex items-center gap-2.5 text-xs text-blue-200">
                <span className="text-base">🔗</span>
                <span>Cross-Facility Medical Record Sync is <strong>Active</strong> for this consultation.</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => onSetScreen("fetching-transit")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-5 rounded-2xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>🚗</span>
              <span>Book Ride to Clinic (Grab Simulation)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingConfirmed(false);
                onSetScreen("dashboard");
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-5 rounded-2xl transition flex items-center justify-center gap-2 text-sm cursor-pointer"
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
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              To prevent duplicate bookings, you are restricted to one active appointment at a time. You can reschedule your booking to another time slot or cancel it below.
            </p>
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
                      <h2 className="text-lg font-bold text-slate-900">Select Private Healthcare Facility</h2>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    {filteredFacilities.length} Private Facilities
                  </span>
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                                {facility.name}
                              </h3>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${visual.badgeCol}`}>
                                {facility.type}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline-block">
                                • {visual.highlights}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono tracking-tight truncate mt-0.5">
                              📍 {facility.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{facility.hours}</span>
                          </div>
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

            {/* STEP 2: Input Symptoms */}
            {step === 2 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 text-slate-800">
                  <ClipboardList className="w-5.5 h-5.5 text-blue-600" />
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-blue-600 block">Step 2</span>
                    <h2 className="text-lg font-bold text-slate-900">Input Symptoms: What's wrong</h2>
                  </div>
                </div>

                {/* Grid of selectable symptom cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {availableSymptoms.map((opt) => {
                    const isSelected = selectedSymptomId === opt.id;
                    const SvgIcon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedSymptomId(opt.id)}
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 flex items-start gap-4 cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${opt.bg} ${opt.border} flex items-center justify-center shrink-0`}>
                          <SvgIcon className={`w-5.5 h-5.5 ${opt.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm leading-snug">{opt.label}</p>
                          <p className="text-xs text-slate-400 mt-1 capitalize">Specialty: {opt.specialtyId.replace("-", " ")}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedSymptomId === "emergency-symptom" && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 text-red-800 animate-pulse">
                    <AlertTriangle className="w-5.5 h-5.5 shrink-0 text-red-650 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-sm uppercase tracking-wide">🚨 please call the 999 first</p>
                      <p className="mt-1 leading-relaxed text-sm text-red-700 font-semibold">
                        If you have called already, you can continue booking and remarks the details below so we can make the preparation. We will bypass standard schedule selectors to alert the facility emergency team immediately.
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom remarks / additional notes */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Add Custom Description (Optional)</label>
                  <textarea
                    value={customSymptomText}
                    onChange={(e) => setCustomSymptomText(e.target.value)}
                    rows={4}
                    placeholder="Provide additional details regarding symptoms, duration, or specific requests..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Back to Facility
                  </button>
                  {selectedSymptomId === "emergency-symptom" ? (
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        setSelectedDate(todayStr);
                        setSelectedTimeSlot("Priority Triage");
                        setSelectedDoctor({
                          name: "Duty Triage Officer",
                          title: "Emergency Medicine Specialist",
                          specialty: "emergency",
                          hospital: selectedClinic?.name || "",
                          availability: [],
                          avatar: "DTO"
                        });
                        setStep(4);
                      }}
                      className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700 cursor-pointer animate-pulse"
                    >
                      Continue to Emergency Remarks
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 cursor-pointer shadow-md shadow-blue-600/15"
                    >
                      Continue to Choose Doctor
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* STEP 3: Choose Doctor */}
            {step === 3 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 text-slate-800">
                  <Stethoscope className="w-5.5 h-5.5 text-blue-600" />
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-blue-600 block">Step 3</span>
                    <h2 className="text-lg font-bold text-slate-900">Choose Doctor: Who</h2>
                  </div>
                </div>

                {matchingDoctors.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Smart Matched Specialist Doctors</p>
                    <div className="grid grid-cols-1 gap-3.5">
                      {matchingDoctors.map((doctor) => {
                        const selected = selectedDoctor?.name === doctor.name;
                        return (
                          <button
                            key={doctor.name}
                            type="button"
                            onClick={() => setSelectedDoctor(doctor)}
                            className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left transition-all duration-200 cursor-pointer ${
                              selected
                                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-sm">
                              {doctor.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm leading-snug">{doctor.name}</p>
                              <p className="text-xs text-blue-600 font-semibold mt-0.5">{doctor.title}</p>
                              <p className="text-[11px] text-slate-500 mt-1">{doctor.specialty} · {doctor.experience} experience</p>
                              <p className="text-[11px] font-bold text-slate-600 mt-2 font-mono">{doctor.availability}</p>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold text-amber-700 text-xs">
                                ★ {doctor.rating}
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
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
                  <div className="space-y-6">
                    {/* Fallback Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-xs">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-bold">No Specialists Available at Selected Facility</p>
                        <p className="mt-1 leading-relaxed text-amber-700">
                          There are currently no specialists in <strong>{selectedSymptom.specialtyId.replace("-", " ")}</strong> registered at <strong>{selectedClinic?.name}</strong> in our database directory.
                        </p>
                      </div>
                    </div>

                    {/* Recommendations: Alternative clinics with matching specialists */}
                    {alternateFacilitiesForSpecialty.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospitals that offer this specialty:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {alternateFacilitiesForSpecialty.map((facility) => (
                            <div key={facility.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-slate-50/50">
                              <div>
                                <h5 className="font-bold text-slate-900 text-xs">{facility.name}</h5>
                                <p className="text-[10px] text-slate-500 leading-snug mt-1 font-mono">{facility.address}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setSelectedClinic(facility); setSelectedDoctor(null); }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3.5 py-2 rounded-xl transition self-start cursor-pointer"
                              >
                                Switch to this facility
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback GP Triage Option */}
                    {clinicGPs.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alternative: Triage with general practitioners at {selectedClinic?.name}</h4>
                        <div className="grid grid-cols-1 gap-3">
                          {clinicGPs.map((gp) => {
                            const selected = selectedDoctor?.name === gp.name;
                            return (
                              <button
                                key={gp.name}
                                type="button"
                                onClick={() => setSelectedDoctor(gp)}
                                className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left transition-all duration-200 cursor-pointer ${
                                  selected
                                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-base shrink-0">
                                  {gp.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 text-sm leading-snug">{gp.name}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{gp.title} (General Practice)</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-[11px] font-semibold text-slate-500 font-mono">{gp.availability}</div>
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                    selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                                  }`}>
                                    {selected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Back to Symptoms
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    disabled={!selectedDoctor}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-600/15"
                  >
                    Continue to Schedule
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
                {selectedSymptomId === "emergency-symptom" ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3 text-red-800">
                    <p className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5 text-red-650" />
                      Priority Triage Booking Confirmed
                    </p>
                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                      Your booking is registered as a priority triage emergency alert. Please self-arrive at the facility as soon as you have called 999. Below are the details set for the clinical teams:
                    </p>
                    <div className="bg-white border border-red-100 rounded-xl p-3.5 space-y-2 text-xs font-mono font-bold text-neutral-800">
                      <div className="flex justify-between"><span>Scheduled Date:</span><span>Today ({selectedDate})</span></div>
                      <div className="flex justify-between"><span>Lobby Queue Slot:</span><span>Priority Triage</span></div>
                      <div className="flex justify-between"><span>Attending Clinician:</span><span>Duty Triage Officer</span></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-6">
                      {/* Calendar Input */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Pick Date</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                  setSelectedDate("");
                                  return;
                              }
                              
                              // Validate closed day
                              let closed = false;
                              if (selectedClinic) {
                                  const parts = val.split("-");
                                  if (parts.length === 3) {
                                  const year = parseInt(parts[0], 10);
                                  const month = parseInt(parts[1], 10) - 1;
                                  const day = parseInt(parts[2], 10);
                                  const dateObj = new Date(year, month, day);
                                  const dayOfWeek = dateObj.getDay();
                                  const hours = getBookingHours(selectedClinic, dayOfWeek);
                                  closed = hours.isClosed;
                                  }
                              }
                              if (closed) {
                                  alert("This facility is closed on the selected day of the week. Please choose another date.");
                                  return;
                              }

                              // Validate doctor on leave
                              let onLeave = false;
                              if (doctorSchedule && doctorSchedule.blockedDates && doctorSchedule.blockedDates.includes(val)) {
                                  onLeave = true;
                              }
                              if (onLeave) {
                                  alert(`Dr. ${selectedDoctor?.name} is on leave or unavailable on this date. Please choose another date.`);
                                  return;
                              }

                              setSelectedDate(val);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-bold"
                            min={(() => {
                              const d = new Date();
                              const offset = d.getTimezoneOffset();
                              const local = new Date(d.getTime() - (offset * 60 * 1000));
                              return local.toISOString().split('T')[0];
                            })()}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Time Slots Grid */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Select Time Slot</label>
                      {isDoctorOnLeave ? (
                        <div className="bg-amber-50 border border-amber-255 text-amber-900 rounded-2xl p-4 flex items-start gap-3 text-xs">
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
                              <strong>{selectedClinic?.name}</strong> is closed on this day of the week (
                              {(() => {
                                const parts = selectedDate.split("-");
                                if (parts.length !== 3) return "";
                                const year = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10) - 1;
                                const day = parseInt(parts[2], 10);
                                return new Date(year, month, day).toLocaleDateString("en-MY", { weekday: 'long' });
                              })()}
                              ). Please select another date.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {isLoadingAppointments && (
                            <div className="text-xs text-blue-600 animate-pulse flex items-center gap-1.5">
                              <Clock className="w-4 h-4 animate-spin" /> Checking slot availability...
                            </div>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {visibleSlots.map((slot) => {
                              const selected = selectedTimeSlot === slot;
                              const booked = isSlotBooked(slot);
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={booked}
                                  onClick={() => setSelectedTimeSlot(slot)}
                                  className={`rounded-2xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                                    selected
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                      : booked
                                      ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                          
                          {generatedSlots.length > 8 && (
                            <div className="flex justify-center pt-2">
                              <button
                                type="button"
                                onClick={() => setShowAllSlots(!showAllSlots)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 cursor-pointer"
                              >
                                {showAllSlots ? "Show Less" : `View All Slots (${generatedSlots.length})`}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Final Remarks text field */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Remarks / Extra Notes</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                    placeholder={selectedSymptomId === "emergency-symptom" ? "Please remarks the details here so our clinical team can prepare for your arrival..." : "Enter any additional instructions or medication requests..."}
                    required={selectedSymptomId === "emergency-symptom"}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (isRescheduling) {
                        setIsRescheduling(false);
                      } else if (selectedSymptomId === "emergency-symptom") {
                        setStep(2);
                      } else {
                        setStep(3);
                      }
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {isRescheduling ? "Cancel Reschedule" : selectedSymptomId === "emergency-symptom" ? "Back to Symptoms" : "Back to Doctor"}
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
                      Continue to Authorizations & Transit
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* STEP 5: Authorizations & Transit Preferences */}
            {step === 5 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 text-slate-800">
                    <ShieldCheck className="w-5.5 h-5.5 text-blue-600" />
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-blue-600 block">Step 5</span>
                      <h2 className="text-lg font-bold text-slate-900">Authorizations & Transit Preferences</h2>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                    Final Step
                  </span>
                </div>

                {/* Section 1: Conspicuous Cross-Facility Synchronisation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span>🔗</span>
                      <span>Authorize Cross-Facility Medical Record Synchronisation (跨医疗机构资料同步)</span>
                    </label>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Step Required
                    </span>
                  </div>

                  {/* Option 1: Yes, Authorize (Recommended) */}
                  <div
                    onClick={() => {
                      setSyncCrossFacilityRecords(true);
                      setShareHistory(true);
                    }}
                    className={`p-5 rounded-2xl border-2 transition cursor-pointer relative ${
                      syncCrossFacilityRecords
                        ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-blue-500 shadow-md shadow-blue-600/10 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-250 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                        syncCrossFacilityRecords ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-400 bg-white'
                      }`}>
                        {syncCrossFacilityRecords && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">
                            Yes, Authorize Cross-Facility Synchronisation (同意授权跨机构同步)
                          </span>
                          <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          I agree to securely synchronize my past medical history generated across other clinics/hospitals to <strong className="text-slate-900 font-bold">{selectedClinic?.name || "the selected facility"}</strong> to prevent duplicate checkups and reduce redundant examinations.
                        </p>
                      </div>
                    </div>

                    {/* 8 Categories Breakdown */}
                    <div className="mt-4 pt-3.5 border-t border-blue-200/70">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          View Synchronized Record Categories (8 Types Included):
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSyncCategories(!showSyncCategories);
                          }}
                          className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                        >
                          {showSyncCategories ? "Hide Synchronized Categories ▲" : "View Synchronized Record Categories (8 Types) ▼"}
                        </button>
                      </div>

                      {showSyncCategories && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 bg-white/95 border border-blue-200 rounded-xl p-3.5 animate-fade-in">
                          <div>1. Past Visit Records</div>
                          <div>2. Symptoms & Diagnoses</div>
                          <div>3. Past Illnesses</div>
                          <div>4. X-ray / MRI Imaging</div>
                          <div>5. Blood & Lab Tests</div>
                          <div>6. Past Treatments</div>
                          <div>7. Prescriptions & Drugs</div>
                          <div>8. Doctor Clinical Notes</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Option 2: No, Keep Records Local Only */}
                  <div
                    onClick={() => {
                      setSyncCrossFacilityRecords(false);
                      setShareHistory(false);
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                      !syncCrossFacilityRecords
                        ? 'bg-slate-50 border-slate-500 shadow-sm ring-2 ring-slate-400/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                        !syncCrossFacilityRecords ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {!syncCrossFacilityRecords && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-sm">
                          No, Keep Records Local Only (不进行跨机构同步，仅限本院独立记录)
                        </span>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Your medical history from other healthcare providers will not be synchronized to <span className="font-medium text-slate-700">{selectedClinic?.name}</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Grab Ride Transit Selection */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span>🚗</span>
                    <span>Transportation & Clinic Fetching (出行接送偏好)</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Request Grab ride */}
                    <div
                      onClick={() => setRequestRide(true)}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                        requestRide
                          ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          requestRide ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {requestRide && <Check className="w-3 h-3 stroke-[3px]" />}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">
                            🚗 Request Grab-Style Fetching Ride
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-1 leading-snug">
                            Auto-dispatches simulated on-demand vehicle to escort you safely to {selectedClinic?.name}.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Self-Arranged */}
                    <div
                      onClick={() => setRequestRide(false)}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                        !requestRide
                          ? 'bg-slate-50 border-slate-500 shadow-sm ring-2 ring-slate-400/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          !requestRide ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-300'
                        }`}>
                          {!requestRide && <Check className="w-3 h-3 stroke-[3px]" />}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">
                            🚶 Self-Arranged Transport (自行前往)
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-1 leading-snug">
                            I will drive, take public bus, or arrange personal transit to reach the clinic counter on time.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: MANDATORY 5-10 MINUTE ON-SITE ARRIVAL NOTICE (Requested by user) */}
                <div className="p-4 bg-amber-500/10 border-2 border-amber-400/60 rounded-2xl flex items-start gap-3.5 text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs leading-relaxed">
                    <span className="font-black text-amber-900 uppercase tracking-wider block text-xs">
                      ⚠️ Mandatory Counter Arrival Check-in Notice (请务必在就诊前5分钟到达柜台报到)
                    </span>
                    <p className="text-amber-850 font-medium">
                      Please arrive at <strong>{selectedClinic?.name}</strong> counter at least <strong>5–10 minutes before your scheduled appointment time ({selectedTimeSlot})</strong> and present your assigned <strong>Queue Number</strong> to the counter staff. Make sure you have arrived in person to confirm your consultation slot!
                    </p>
                  </div>
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
                        <span className="text-[10px] text-slate-400 block mt-0.5">{selectedClinic.type}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic block">Not selected yet</span>
                  )}
                </div>

                {/* Symptom */}
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-1">Symptoms Checklist</span>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                    <span className="font-bold text-slate-800 block text-[11px]">{selectedSymptom.label}</span>
                    {customSymptomText && (
                      <span className="text-[10px] text-slate-400 block mt-1 italic truncate">"{customSymptomText}"</span>
                    )}
                  </div>
                  {selectedSymptomId === "emergency-symptom" && (
                    <div className="mt-2 text-[10px] text-red-700 bg-red-50 border border-red-100 rounded-xl p-2.5 font-semibold leading-normal">
                      ⚠️ Call 999 for ambulance immediately if life-threatening. Prep-only booking.
                    </div>
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
                    <span className="font-bold text-slate-800 font-mono">{selectedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider mb-0.5">Time Slot</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedTimeSlot}</span>
                  </div>
                </div>

                {/* Consultation Type */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider">Mode</span>
                  <span className="font-bold text-slate-800">{consultType}</span>
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
