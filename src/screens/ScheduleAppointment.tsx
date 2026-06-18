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
  AlertTriangle
} from "lucide-react";
import { Appointment } from "../types";
import { publicHospitals, privateHospitals, privateClinics, Hospital } from "./HospitalsPage";
import { specialties, Specialty, Doctor as DocPageDoctor } from "./DoctorsPage";

interface ScheduleAppointmentProps {
  onAddAppointment: (appointment: Appointment) => void;
  prefilledApt?: Appointment | null;
  onSetScreen: (screen: string) => void;
  appointments: Appointment[];
  onCancelAppointment: (id: string) => void;
  onRescheduleAppointment: (id: string, date: string, timeSlot: string) => void;
}

const allFacilities: Hospital[] = [...publicHospitals, ...privateHospitals, ...privateClinics];

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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

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

  // Step 4 states
  const [selectedDate, setSelectedDate] = useState(prefilledApt?.date ?? "2026-10-12");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(prefilledApt?.timeSlot ?? "");
  const [remarks, setRemarks] = useState(prefilledApt?.symptoms ?? "");
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
      availableSpecialtyIds.has(opt.specialtyId) || opt.id === "other"
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

  // Filter facilities based on care track
  const filteredFacilities = useMemo(() => {
    if (careTrackFilter === 'public') {
      return publicHospitals;
    }
    if (careTrackFilter === 'private') {
      return [...privateHospitals, ...privateClinics];
    }
    return allFacilities;
  }, [careTrackFilter]);

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

  const isSlotBooked = (slot: string) => {
    if (!selectedDoctor) return false;
    
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

  const currentStepLabel = ["Facility", "Symptoms", "Doctor", "Details"] as const;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRescheduling) {
      handleConfirmReschedule(event);
      return;
    }
    if (!selectedClinic || !selectedDoctor) return;

    // Create unique doctor ID based on name
    const doctorId = selectedDoctor.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

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
      symptoms: remarks || `${selectedSymptom.label} Consultation`
    };

    onAddAppointment(newAppointment);
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingConfirmed(false);
      onSetScreen("dashboard");
    }, 1800);
  };

  return (
    <div id="schedule-appointment-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* Header section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Schedule Appointment</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Book consultations across Penang's government and private clinics. Choose where you want to go, select symptoms, pick your doctor, and choose a date.
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="grid grid-cols-4 gap-3 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
          {currentStepLabel.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = step === stepNumber;
            const isComplete = step > stepNumber;
            return (
              <div
                key={label}
                className={`rounded-2xl py-3.5 text-center font-sans tracking-widest transition-all duration-300 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : isComplete
                    ? 'bg-teal-50 text-teal-700 border border-teal-100'
                    : 'bg-white border border-slate-200 text-slate-400'
                }`}
              >
                Step {stepNumber}: {label}
              </div>
            );
          })}
        </div>
      </div>

      {bookingConfirmed ? (
        <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-3xl text-center shadow-xl max-w-2xl mx-auto animate-fade-in">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <Check className="w-9 h-9 text-white stroke-[3px]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Appointment Saved!</h2>
          <p className="mt-2.5 text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
            Your consultation has been successfully stored in Supabase. Check your dashboard for queue credentials and status updates.
          </p>
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
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/10"
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
                    <Building2 className="w-5.5 h-5.5 text-teal-600" />
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-teal-600 block">Step 1</span>
                      <h2 className="text-lg font-bold text-slate-900">Select Facility: Where</h2>
                    </div>
                  </div>

                  {/* Care track filters */}
                  <div className="flex bg-slate-100 rounded-xl p-1 shrink-0">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'public', label: 'Public' },
                      { id: 'private', label: 'Private' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCareTrackFilter(tab.id as any)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                          careTrackFilter === tab.id
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                  {filteredFacilities.map((facility) => {
                    const selected = selectedClinic?.id === facility.id;
                    const isGov = facility.type.toLowerCase().includes("government");
                    return (
                      <button
                        key={facility.id}
                        type="button"
                        onClick={() => { setSelectedClinic(facility); setSelectedDoctor(null); }}
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                          selected
                            ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-teal-600">
                            {facility.name}
                          </h3>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            isGov ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isGov ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-mono tracking-tight leading-snug">
                          {facility.address}
                        </p>
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{facility.hours}</span>
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
                    className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                  <ClipboardList className="w-5.5 h-5.5 text-teal-600" />
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-teal-600 block">Step 2</span>
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
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 flex items-start gap-4 ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
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
                          isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedSymptomId === "emergency-symptom" && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 text-red-800">
                    <AlertTriangle className="w-5.5 h-5.5 shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-sm uppercase tracking-wide">🚨 CRITICAL NOTICE: LIFE-THREATENING EMERGENCY</p>
                      <p className="mt-1 leading-relaxed text-sm text-red-700 font-medium">
                        If this is a life-threatening medical emergency, please call <strong className="underline text-red-900">999</strong> or <strong className="underline text-red-900">991</strong> for an ambulance immediately. This booking is solely to alert the hospital emergency department to prepare for your self-arrival.
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500"
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
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700 cursor-pointer"
                  >
                    Continue to Choose Doctor
                  </button>
                </div>
              </section>
            )}

            {/* STEP 3: Choose Doctor */}
            {step === 3 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 text-slate-800">
                  <Stethoscope className="w-5.5 h-5.5 text-teal-600" />
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-teal-600 block">Step 3</span>
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
                            className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left transition-all duration-200 ${
                              selected
                                ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-sm">
                              {doctor.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm leading-snug">{doctor.name}</p>
                              <p className="text-xs text-teal-600 font-semibold mt-0.5">{doctor.title}</p>
                              <p className="text-[11px] text-slate-500 mt-1">{doctor.specialty} · {doctor.experience} experience</p>
                              <p className="text-[11px] font-bold text-slate-600 mt-2 font-mono">{doctor.availability}</p>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold text-amber-700 text-xs">
                                ★ {doctor.rating}
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                selected ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300'
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
                                className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold px-3.5 py-2 rounded-xl transition self-start cursor-pointer"
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
                                className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left transition-all duration-200 ${
                                  selected
                                    ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
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
                                    selected ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300'
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
                    className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                  <Calendar className="w-5.5 h-5.5 text-teal-600" />
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-teal-600 block">Step 4</span>
                    <h2 className="text-lg font-bold text-slate-900">Date, Time & Remarks: When & Details</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Calendar Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Pick Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        min={new Date().toISOString().split('T')[0]}
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
                        <div className="text-xs text-teal-600 animate-pulse flex items-center gap-1.5">
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
                              className={`rounded-2xl border px-3 py-2.5 text-xs font-bold transition ${
                                selected
                                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
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
                            className="text-xs font-bold text-teal-600 hover:text-teal-700 transition flex items-center gap-1 cursor-pointer"
                          >
                            {showAllSlots ? "Show Less" : `View All Slots (${generatedSlots.length})`}
                          </button>
                        </div>
                      )}
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
                    placeholder="Enter any additional instructions or medication requests..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex justify-between pt-2">
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
                  <button
                    type="submit"
                    disabled={!selectedDoctor || !selectedClinic || !selectedTimeSlot}
                    className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  >
                    {isRescheduling ? "Confirm Reschedule" : "Confirm Booking"}
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
                      <Building2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
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
                      <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {selectedDoctor.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-[11px] block leading-snug">{selectedDoctor.name}</span>
                        <span className="text-[10px] text-teal-600 block mt-0.5">{selectedDoctor.title}</span>
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
                        ? "bg-teal-100 text-teal-850"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {lastBooking.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick tips */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-xs text-slate-600 space-y-3">
              <div className="font-bold text-slate-900 uppercase tracking-[0.1em] text-[10px]">Guidelines</div>
              <ul className="space-y-2 list-disc list-inside text-slate-500 font-sans">
                <li>Double check medical allergies match record details.</li>
                <li>Present proof of identity (MyKad / passport) at clinic registration desk.</li>
                <li>Reach the facility 10 minutes early for triage sorting.</li>
              </ul>
            </div>
          </aside>

        </form>
      )}
    </div>
  );
}
