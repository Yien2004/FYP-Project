import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  PlusCircle, 
  Trash2, 
  Check, 
  Download,
  AlertCircle,
  FileCheck2,
  Activity,
  Heart,
  Layers,
  History,
  FileSpreadsheet,
  Eye,
  ArrowLeft,
  Pill,
  Clock,
  X
} from 'lucide-react';
import { mockPatients } from '../../data/mockData';
import { Patient, Prescription, Appointment } from '../../types';

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

function calculateScheduledTimes(frequency: string): string[] {
  const f = frequency.toLowerCase();
  if (f.includes('three times') || f.includes('three') || f.includes('tid')) {
    return ['01:00 PM', '05:00 PM', '09:00 PM'];
  }
  if (f.includes('twice daily') || f.includes('twice') || f.includes('bid') || f.includes('2 times') || f.includes('2 time')) {
    return ['01:00 PM', '06:00 PM'];
  }
  if (f.includes('once daily') || f.includes('once') || f.includes('qd') || f.includes('every day')) {
    return ['01:00 PM'];
  }
  return ['01:00 PM'];
}

interface MedicationDraft {
  drugName: string;
  dosage: string;
  frequency: string;
  foodTiming: 'Before Food' | 'After Food';
  startDate: string;
  endDate: string;
  instructions: string;
}

const getLoggedUserClinic = () => {
  const cached = localStorage.getItem("lifelink_user_clinic");
  if (cached) return cached;
  const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
  return getClinicFromEmail(loggedEmail);
};

export default function PatientsSection() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p1');
  const [isDetailView, setIsDetailView] = useState<boolean>(false);
  const [selectedVisitModal, setSelectedVisitModal] = useState<any | null>(null);
  const [searchVal, setSearchVal] = useState('');
  
  // Tab control inside active patient workspace
  const [activeTab, setActiveTab] = useState<'overview' | 'consult' | 'history'>('overview');

  // Load patients from backend and filter by clinic appointments
  const loadPatients = () => {
    const isAdmin = localStorage.getItem('lifelink_user_role') === 'Admin';
    const currentClinic = getLoggedUserClinic();

    Promise.all([
      fetch("/api/patients").then(res => res.json()),
      fetch("/api/appointments").then(res => res.json()).catch(() => [])
    ])
    .then(([patientsList, appointmentsList]) => {
      if (Array.isArray(patientsList)) {
        let filtered = patientsList;
        if (!isAdmin && currentClinic) {
          filtered = patientsList.filter((p: any) => {
            const hasApt = appointmentsList.some((ap: any) => 
              (ap.patientId === p.id || ap.patientId === p.dbId || ap.patientName.toLowerCase() === p.name.toLowerCase() || ap.patientId === p.email) &&
              (ap.clinic || ap.hospital || '').toLowerCase() === currentClinic.toLowerCase()
            );
            return hasApt;
          });
        }
        setPatients(filtered);
        if (filtered.length > 0) {
          setSelectedPatientId(filtered[0].id);
        } else {
          setSelectedPatientId('');
        }
      }
    })
    .catch(err => {
      console.warn("Failed to load patients, using mock data.", err);
      setPatients(mockPatients);
    });
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // ==========================================
  // TAB 2: CONSULTATION NOTE PORTAL STATE
  // ==========================================
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [selectedAptId, setSelectedAptId] = useState<string>('');

  const hasConsent = useMemo(() => {
    const currentClinic = getLoggedUserClinic();
    const globalConsent = currentClinic && activePatient && activePatient.consentedClinics && 
      activePatient.consentedClinics.some((c: string) => c.toLowerCase() === currentClinic.toLowerCase());
    const appointmentConsent = patientAppointments.some(apt => apt.shareHistory === true);
    return !!globalConsent || appointmentConsent;
  }, [patientAppointments, activePatient]);

  // Vitals inputs
  const [vitalBPsys, setVitalBPsys] = useState<number>(120);
  const [vitalBPdia, setVitalBPdia] = useState<number>(80);
  const [vitalHR, setVitalHR] = useState<number>(72);
  const [vitalTemp, setVitalTemp] = useState<number>(36.8);
  const [vitalSpO2, setVitalSpO2] = useState<number>(98);
  const [vitalWeight, setVitalWeight] = useState<number>(70);
  const [consultNotes, setConsultNotes] = useState('');

  // Upgraded Multi-Medications state
  const [medications, setMedications] = useState<MedicationDraft[]>([
    {
      drugName: '',
      dosage: '1 Tablet',
      frequency: 'Once Daily',
      foodTiming: 'After Food',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      instructions: ''
    }
  ]);

  const handleAddMedication = () => {
    setMedications(prev => [
      ...prev,
      {
        drugName: '',
        dosage: '1 Tablet',
        frequency: 'Once Daily',
        foodTiming: 'After Food',
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        instructions: ''
      }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: keyof MedicationDraft, value: string) => {
    setMedications(prev => prev.map((med, i) => i === index ? { ...med, [field]: value } : med));
  };

  // Profile Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBloodType, setEditBloodType] = useState('');
  const [editAllergies, setEditAllergies] = useState<string[]>([]);
  const [editChronic, setEditChronic] = useState<string[]>([]);
  const [editInsuranceProvider, setEditInsuranceProvider] = useState('');
  const [editInsurancePolicy, setEditInsurancePolicy] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');

  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch appointments for this patient when tab is consultation
  useEffect(() => {
    if (!activePatient) return;
    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const currentClinic = getClinicFromEmail(loggedEmail);

    fetch("/api/appointments")
      .then(res => res.json())
      .then((data: Appointment[]) => {
        const filtered = data.filter(apt => {
          const matchesPatient = apt.patientName.toLowerCase() === activePatient.name.toLowerCase() || 
                                 apt.patientId === activePatient.id || 
                                 apt.patientId === activePatient.dbId;
          const matchesClinic = !currentClinic || (apt.clinic || apt.hospital || '').toLowerCase() === currentClinic.toLowerCase();
          return matchesPatient && matchesClinic;
        });
        setPatientAppointments(filtered);
        
        const upcoming = filtered.find(apt => apt.status !== 'Completed' && apt.status !== 'Cancelled');
        if (upcoming) {
          setSelectedAptId(upcoming.id);
        } else {
          setSelectedAptId('');
        }
      })
      .catch(err => console.warn("Failed to load appointments for consult panel", err));
  }, [activePatient, activeTab]);

  const handleOpenEditModal = () => {
    if (!activePatient) return;
    setEditFullName(activePatient.name || '');
    setEditDob(activePatient.dob || '');
    setEditGender(activePatient.gender || '');
    setEditPhone(activePatient.phone || '');
    
    fetch(`/api/profile?email=${encodeURIComponent(activePatient.email)}`)
      .then(res => res.json())
      .then((p: any) => {
        setEditBloodType(p.bloodType || '');
        setEditAllergies(p.allergies || []);
        setEditChronic(p.chronicConditions || []);
        setEditInsuranceProvider(p.insuranceProvider || '');
        setEditInsurancePolicy(p.insurancePolicyNumber || '');
        setEditEmergencyName(p.emergencyContactName || '');
        setEditEmergencyPhone(p.emergencyContactPhone || '');
        setShowEditModal(true);
      })
      .catch(err => {
        console.warn("Failed to fetch detailed profile for edit", err);
        setEditBloodType('');
        setEditAllergies([]);
        setEditChronic([]);
        setEditInsuranceProvider('');
        setEditInsurancePolicy('');
        setEditEmergencyName('');
        setEditEmergencyPhone('');
        setShowEditModal(true);
      });
  };

  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        email: activePatient.email,
        fullName: editFullName,
        dateOfBirth: editDob,
        gender: editGender,
        phone: editPhone,
        bloodType: editBloodType,
        allergies: editAllergies,
        chronicConditions: editChronic,
        insuranceProvider: editInsuranceProvider,
        insurancePolicyNumber: editInsurancePolicy,
        emergencyContactName: editEmergencyName,
        emergencyContactPhone: editEmergencyPhone
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg("Patient profile updated successfully!");
        setShowEditModal(false);
        loadPatients(); // reload directory
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const err = await res.json();
        setFormError(err.error || "Failed to save profile changes.");
        setTimeout(() => setFormError(''), 3000);
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setFormError("Network error: failed to update patient details.");
      setTimeout(() => setFormError(''), 3000);
    }
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptId) {
      setFormError('No active appointment selected for this consultation.');
      setTimeout(() => setFormError(''), 4050);
      return;
    }

    if (!consultNotes.trim()) {
      setFormError('Please enter clinical consultation notes before saving.');
      setTimeout(() => setFormError(''), 4050);
      return;
    }

    const patientDbId = activePatient.dbId || activePatient.id;

    // 1. Post vitals
    const vitalsPayload = {
      patientId: patientDbId,
      heartRate: Number(vitalHR),
      bloodPressureSys: Number(vitalBPsys),
      bloodPressureDia: Number(vitalBPdia),
      temperature: Number(vitalTemp),
      oxygenSaturation: Number(vitalSpO2),
      weight: Number(vitalWeight),
      timestamp: new Date().toLocaleDateString('en-MY', { year:'numeric', month:'long', day:'2-digit' })
    };

    // Prescription string summary for legacy appointment display
    const prescriptionText = medications
      .filter(m => m.drugName.trim())
      .map(m => `${m.drugName} ${m.dosage} (${m.frequency}, ${m.foodTiming}) for ${m.duration}`)
      .join("; ");

    // 2. Put appointment update
    const appointmentPayload = {
      status: 'Completed',
      clinicalNotes: consultNotes,
      prescription: prescriptionText
    };

    try {
      // Save vitals
      await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vitalsPayload)
      });

      // Complete appointment
      await fetch(`/api/appointments/${selectedAptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentPayload)
      });

      // Save multi-medications in bulk to profile prescriptions array
      const activeRx = medications
        .filter(m => m.drugName.trim())
        .map(m => ({
          drugName: m.drugName,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: `${m.startDate} to ${m.endDate}`,
          startDate: m.startDate,
          endDate: m.endDate,
          foodTiming: m.foodTiming,
          instructions: m.instructions,
          scheduledTimes: calculateScheduledTimes(m.frequency).join(", "),
          prescribedBy: 'Dr. Sarah Jenkins',
          date: new Date().toISOString().substring(0, 10)
        }));

      if (activeRx.length > 0) {
        await fetch(`/api/patients/${activePatient.id}/prescriptions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activeRx)
        });
      }

      setSuccessMsg(`Consultation marked Completed! Vitals, notes, and prescriptions synced.`);
      setConsultNotes('');
      setMedications([
        {
          drugName: '',
          dosage: '1 Tablet',
          frequency: 'Once Daily',
          foodTiming: 'After Food',
          startDate: new Date().toISOString().substring(0, 10),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          instructions: ''
        }
      ]);
      
      // Refresh patients list to pull updated prescriptions
      loadPatients();
      
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('overview');
      }, 3000);

    } catch (err) {
      console.error("Consultation save failed", err);
      setFormError('Failed to sync consultation note to server.');
      setTimeout(() => setFormError(''), 4000);
    }
  };

  // ==========================================
  // TAB 3: LONGITUDINAL HISTORY LOOKUP
  // ==========================================
  const [historyVitals, setHistoryVitals] = useState<any[]>([]);
  const [historyApts, setHistoryApts] = useState<Appointment[]>([]);

  // States for inline prescription editing in the Active Outpatient Prescriptions list
  const [editingRxId, setEditingRxId] = useState<string | null>(null);
  const [editRxDrug, setEditRxDrug] = useState('');
  const [editRxDosage, setEditRxDosage] = useState('');
  const [editRxFreq, setEditRxFreq] = useState('');
  const [editRxDuration, setEditRxDuration] = useState('');

  // States for inline prescription editing in the Vitals Longitudinal Log rows
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [editAptRxText, setEditAptRxText] = useState('');

  const handleStartEditRx = (rx: Prescription) => {
    setEditingRxId(rx.id);
    setEditRxDrug(rx.drugName);
    setEditRxDosage(rx.dosage);
    setEditRxFreq(rx.frequency);
    setEditRxDuration(rx.duration);
  };

  const handleSaveRx = async (rxId: string) => {
    try {
      const updatedPrescriptions = (activePatient.prescriptions || []).map((rx: any) => {
        if (rx.id === rxId) {
          return {
            ...rx,
            drugName: editRxDrug,
            dosage: editRxDosage,
            frequency: editRxFreq,
            duration: editRxDuration,
            scheduledTimes: calculateScheduledTimes(editRxFreq).join(", ")
          };
        }
        return rx;
      });

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activePatient.email,
          prescriptions: updatedPrescriptions
        })
      });

      if (res.ok) {
        setPatients(prev => prev.map(p => {
          if (p.id === activePatient.id) {
            return { ...p, prescriptions: updatedPrescriptions };
          }
          return p;
        }));
        setEditingRxId(null);
        setSuccessMsg("Prescription updated successfully!");
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error("Failed to save edited prescription", err);
    }
  };

  const handleSaveAptRx = async (aptId: string) => {
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescription: editAptRxText })
      });
      if (res.ok) {
        setHistoryApts(prev => prev.map(apt => apt.id === aptId ? { ...apt, prescription: editAptRxText } : apt));
        setEditingAptId(null);
        setSuccessMsg("Vitals prescription entry updated successfully!");
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error("Failed to update prescription", err);
    }
  };

  // States for editing Vitals Longitudinal Log
  const [editingVitalId, setEditingVitalId] = useState<string | number | null>(null);
  const [editVitalTimestamp, setEditVitalTimestamp] = useState('');
  const [editVitalSys, setEditVitalSys] = useState('');
  const [editVitalDia, setEditVitalDia] = useState('');
  const [editVitalHR, setEditVitalHR] = useState('');
  const [editVitalSpO2, setEditVitalSpO2] = useState('');
  const [editVitalTemp, setEditVitalTemp] = useState('');
  const [editVitalWeight, setEditVitalWeight] = useState('');

  const handleStartEditVital = (log: any) => {
    setEditingVitalId(log.id);
    setEditVitalTimestamp(log.timestamp || '');
    setEditVitalSys(String(log.bloodPressureSys || 0));
    setEditVitalDia(String(log.bloodPressureDia || 0));
    setEditVitalHR(String(log.heartRate || 0));
    setEditVitalSpO2(String(log.oxygenSaturation || 0));
    setEditVitalTemp(String(log.temperature || 0));
    setEditVitalWeight(String(log.weight || 0));
  };

  const handleSaveVital = async (vitalId: string | number) => {
    try {
      const response = await fetch(`/api/vitals/${vitalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: editVitalTimestamp,
          bloodPressureSys: Number(editVitalSys),
          bloodPressureDia: Number(editVitalDia),
          heartRate: Number(editVitalHR),
          oxygenSaturation: Number(editVitalSpO2),
          temperature: Number(editVitalTemp),
          weight: Number(editVitalWeight),
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setHistoryVitals(prev => prev.map(item => item.id === vitalId ? updated : item));
        setEditingVitalId(null);
        setSuccessMsg("Vital signs updated successfully!");
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert("Failed to update vitals");
      }
    } catch (err) {
      console.error("Failed to update vital signs", err);
    }
  };

  useEffect(() => {
    if (activePatient) {
      const patientDbId = activePatient.dbId || activePatient.id;

      fetch(`/api/vitals?patientId=${patientDbId}`)
        .then(res => res.json())
        .then(data => setHistoryVitals(data))
        .catch(err => console.warn("Failed to load vitals log", err));

      fetch("/api/appointments")
        .then(res => res.json())
        .then((data: Appointment[]) => {
          const currentClinic = getLoggedUserClinic();
          
          // Check if patient has any appointment at the current clinic with shareHistory consent enabled
          const patientClinicApts = data.filter(apt => {
            const matchesPatient = apt.patientName.toLowerCase() === activePatient.name.toLowerCase() || 
                                   apt.patientId === activePatient.id || 
                                   apt.patientId === activePatient.dbId;
            const matchesClinic = currentClinic && (apt.clinic || apt.hospital || '').toLowerCase() === currentClinic.toLowerCase();
            return matchesPatient && matchesClinic;
          });
          const hasShareConsent = patientClinicApts.some(apt => apt.shareHistory === true) || 
            (currentClinic && activePatient.consentedClinics && 
             activePatient.consentedClinics.some((c: string) => c.toLowerCase() === currentClinic.toLowerCase()));

          const filtered = data
            .filter(apt => {
              const matchesPatient = apt.patientName.toLowerCase() === activePatient.name.toLowerCase() || 
                                     apt.patientId === activePatient.id || 
                                     apt.patientId === activePatient.dbId;
              if (!matchesPatient) return false;

              const matchesCurrentClinic = !currentClinic || (apt.clinic || apt.hospital || '').toLowerCase() === currentClinic.toLowerCase();
              if (matchesCurrentClinic) return true;

              // If it's another clinic's booking, only show if they consented
              return !!hasShareConsent;
            })
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          setHistoryApts(filtered);
        })
        .catch(err => console.warn("Failed to load past appointments", err));
    }
  }, [activePatient]);

  const handleDeletePrescription = async (rxId: string) => {
    if (!window.confirm("Are you sure you want to delete this prescription from active outpatient records?")) return;
    try {
      const res = await fetch(`/api/patients/${activePatient.id}/prescriptions/${rxId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setPatients(prev => prev.map(p => {
          if (p.id === activePatient.id) {
            return {
              ...p,
              prescriptions: (p.prescriptions || []).filter((rx: any) => rx.id !== rxId)
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error("Failed to delete prescription", err);
    }
  };

  const getPrescriptionForDate = (vitalTimestamp: string) => {
    try {
      const vitalDate = new Date(vitalTimestamp);
      const match = historyApts.find(apt => {
        if (!apt.date) return false;
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === vitalDate.toDateString();
      });
      return match ? match.prescription : "";
    } catch (e) {
      return "";
    }
  };

  const getAppointmentForDate = (vitalTimestamp: string) => {
    try {
      const vitalDate = new Date(vitalTimestamp);
      return historyApts.find(apt => {
        if (!apt.date) return false;
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === vitalDate.toDateString();
      });
    } catch (e) {
      return null;
    }
  };

  // Combine prescriptions from appointment record AND patient profile prescriptions for a given date
  const getMedicalForDate = (vitalTimestamp: string): string => {
    const parts: string[] = [];
    try {
      // 1. Get prescription text from appointment record (legacy format)
      const apt = getAppointmentForDate(vitalTimestamp);
      if (apt?.prescription) {
        parts.push(apt.prescription);
      }
      // 2. Get structured prescriptions from patient profile that match this date
      const vitalDate = new Date(vitalTimestamp);
      const profileRx = (activePatient.prescriptions || []).filter((rx: any) => {
        try {
          const rxDate = new Date(rx.date);
          return rxDate.toDateString() === vitalDate.toDateString();
        } catch { return false; }
      });
      profileRx.forEach((rx: any) => {
        const rxText = `${rx.drugName} ${rx.dosage} (${rx.frequency})`;
        if (!parts.includes(rxText) && !parts.some(p => p.includes(rx.drugName))) {
          parts.push(rxText);
        }
      });
    } catch (e) { /* ignore */ }
    return parts.join('; ');
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchVal.toLowerCase()) ||
    p.condition.toLowerCase().includes(searchVal.toLowerCase())
  );

  if (!activePatient) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-neutral-850">
        {/* Left Column: Patient Directory */}
        <div className="lg:col-span-1 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Patient Directory</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Quick lookup or index select for active outpatient profiles.</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patients by name or diagnostic..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-2 focus:ring-neutral-200/50 transition-all h-9"
              disabled
            />
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
            <p className="text-xs text-neutral-400 text-center py-8">No clinical profiles registered in system.</p>
          </div>
        </div>

        {/* Right Column: Work Workspace */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-8 shadow-xs flex flex-col items-center justify-center text-center text-neutral-500 min-h-[450px]">
          <Activity className="w-12 h-12 text-teal-600 animate-pulse mb-3" />
          <h3 className="font-extrabold text-sm text-neutral-900">No Patient Selected</h3>
          <p className="text-xs text-neutral-450 max-w-sm mt-1 leading-relaxed">
            Please register a patient in the Patient Portal to view their digital health record, log vitals, or scan clinical documents.
          </p>
        </div>
      </div>
    );
  }

  if (!isDetailView) {
    return (
      <div className="space-y-6 font-sans text-neutral-800">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2.5">
              <span>Patient Directory</span>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full font-mono">
                {filteredPatients.length} Active {filteredPatients.length === 1 ? 'Profile' : 'Profiles'}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Quick lookup or index select for active outpatient profiles across your clinical department.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patients by name or ID..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-2 focus:ring-sky-200 transition-all h-10"
            />
          </div>
        </div>

        {/* Directory Items Grid */}
        {filteredPatients.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 text-xs">
            No clinical profiles matching search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="patient-directory-grid">
            {filteredPatients.map((p) => {
              const initials = p.name.split(' ').map((n: string) => n[0]).join('');
              return (
                <div
                  key={p.id}
                  id={`patient-select-card-${p.id}`}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setSuccessMsg('');
                    setActiveTab('overview');
                    setIsDetailView(true);
                  }}
                  className="bg-white border border-slate-200 hover:border-sky-400 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {p.avatar ? (
                          <img 
                            src={p.avatar} 
                            alt={p.name} 
                            className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 text-sm font-black flex items-center justify-center border border-sky-200 shadow-xs">
                            {initials}
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-sm text-neutral-900 group-hover:text-sky-600 transition-colors">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            ID: {p.id} • {p.gender} • DOB {p.dob}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{p.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">Last visit: {p.lastVisited}</span>
                    <span className="text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      View Profile &amp; EHR &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Top Navigation Bar: Back to Patient Directory */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs">
        <button
          onClick={() => setIsDetailView(false)}
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-4 py-2.5 rounded-xl border border-sky-200 transition cursor-pointer active:scale-98 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Patient Directory</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Active Outpatient Record: <strong className="text-slate-800">{activePatient.name}</strong> ({activePatient.id})
          </span>
          <select
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              setSuccessMsg('');
            }}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-sky-400 cursor-pointer shadow-xs"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Full-Width Patient Workspace */}
      <div className="space-y-6">
        
        {/* Core demographic block */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-4">
            <div className="flex items-center gap-4">
              <img 
                src={activePatient.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'} 
                alt={activePatient.name} 
                className="w-12 h-12 rounded-full border border-neutral-200 object-cover shadow-xs"
              />
              <div>
                <h2 className="text-base font-extrabold text-neutral-950 tracking-tight flex items-center gap-2">
                  {activePatient.name}
                  <button
                    onClick={() => handleOpenEditModal()}
                    className="p-1 text-sky-600 hover:bg-sky-50 hover:text-sky-700 rounded-lg transition-colors border border-sky-200 bg-white cursor-pointer inline-flex items-center gap-1 font-bold text-[10px]"
                    title="Modify Patient Details"
                  >
                    Edit Profile
                  </button>
                </h2>
              </div>
            </div>

            {/* EHR Tab Controller */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold shrink-0 gap-1.5 border border-slate-200 shadow-xs">
              <button
                onClick={() => { setActiveTab('overview'); setSuccessMsg(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold ${
                  activeTab === 'overview'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Layers className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => { setActiveTab('consult'); setSuccessMsg(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold ${
                  activeTab === 'consult'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Activity className="w-4 h-4" />
                Consultation
              </button>
              <button
                onClick={() => { setActiveTab('history'); setSuccessMsg(''); }}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-bold ${
                  activeTab === 'history'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <History className="w-4 h-4" />
                History
              </button>
            </div>
          </div>

          {/* Quick contact details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
              <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3" /> DOB
              </span>
              <p className="font-bold text-neutral-900 font-mono mt-0.5">{activePatient.dob}</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
              <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                <User className="w-3 h-3" /> Gender
              </span>
              <p className="font-bold text-neutral-900 mt-0.5">{activePatient.gender}</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
              <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </span>
              <p className="font-bold text-neutral-900 font-mono mt-0.5">{activePatient.phone}</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
              <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </span>
              <p className="font-bold text-neutral-900 truncate mt-0.5" title={activePatient.email}>{activePatient.email}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-150 my-4"></div>

          {/* Clinical Biometrics Details */}
          <div>
            <h3 className="text-[10px] font-extrabold text-neutral-450 uppercase tracking-wider mb-2.5">
              Clinical Biometrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest block mb-1">
                  Blood Type
                </span>
                <p className="font-bold text-neutral-900 font-mono mt-0.5">
                  {activePatient.bloodType || 'O+'}
                </p>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest block mb-1">
                  Known Allergies
                </span>
                <p className="font-bold text-neutral-900 mt-0.5">
                  {Array.isArray(activePatient.allergies)
                    ? activePatient.allergies.join(", ") || 'No known allergies'
                    : activePatient.allergies || 'No known allergies'}
                </p>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest block mb-1">
                  Chronic Conditions
                </span>
                <p className="font-bold text-neutral-950 mt-0.5">
                  {(() => {
                    const chronicList = Array.isArray(activePatient.chronicConditions)
                      ? activePatient.chronicConditions
                      : Array.isArray(activePatient.history)
                        ? activePatient.history
                        : [];
                    return chronicList.filter((c: string) => c && c !== 'None').join(", ") || 'None';
                  })()}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Success / Error alerts */}
        {successMsg && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-250 p-3 rounded-xl animate-fadeIn">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {formError && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* ========================================================
            RENDER TAB 1: OVERVIEW
            ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-6">
              {/* Clinical Notes */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-900 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-sky-600" />
                    Historic Diagnoses & Visits
                  </h3>
                  <div className="space-y-1.5 mb-5">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Diagnosed Conditions</span>
                    <ul className="space-y-2 text-sm text-neutral-700 leading-relaxed list-disc pl-5">
                      {activePatient.history && activePatient.history.map((hist: string, i: number) => (
                        <li key={i} className="pl-0.5 font-medium">{hist}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-neutral-100">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                      Visit History ({historyApts.length} {historyApts.length === 1 ? 'time' : 'times'})
                    </span>
                    {historyApts.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No previous clinic visits recorded.</p>
                    ) : (
                      <ul className="space-y-2 text-xs text-neutral-700 max-h-[220px] overflow-y-auto pr-1">
                        {historyApts.map((apt, idx) => (
                          <li
                            key={apt.id || idx}
                            onClick={() => setSelectedVisitModal(apt)}
                            className="flex flex-col bg-neutral-50/80 hover:bg-sky-50/70 hover:border-sky-300 p-3 rounded-xl border border-neutral-200/80 cursor-pointer transition-all group shadow-xs"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-neutral-900 group-hover:text-sky-700 text-xs flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                                {apt.date} at {apt.timeSlot}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                apt.status === 'Completed' || apt.status === 'Done'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                              }`}>{apt.status}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-neutral-500 font-medium">Doctor: {apt.doctorName} • {apt.specialty}</span>
                              <span className="text-[10px] font-bold text-sky-600 group-hover:underline">View Rx &amp; Reminder &rarr;</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prescriptions */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-xs text-neutral-900 border-b border-neutral-100 pb-2.5 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <PlusCircle className="w-4 h-4 text-neutral-400" />
                Active Outpatient Prescriptions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase pb-2">
                      <th className="pb-2.5">Medication Formula</th>
                      <th className="pb-2.5">Dosage</th>
                      <th className="pb-2.5 text-center">Frequency</th>
                      <th className="pb-2.5 text-center">Duration</th>
                      <th className="pb-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(!activePatient.prescriptions || activePatient.prescriptions.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="py-5 text-center text-xs text-neutral-400 italic">No medication formulas currently active.</td>
                      </tr>
                    ) : (
                      activePatient.prescriptions.map((rx: Prescription) => (
                        <tr key={rx.id} className="hover:bg-neutral-50/50 transition-colors">
                          {editingRxId === rx.id ? (
                            <>
                              <td className="py-2.5">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={editRxDrug}
                                    onChange={(e) => setEditRxDrug(e.target.value)}
                                    className="bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-800 outline-none w-full font-bold"
                                  />
                                  <p className="text-[9px] text-neutral-405">By {rx.prescribedBy} on {rx.date}</p>
                                </div>
                              </td>
                              <td className="py-2.5">
                                <input
                                  type="text"
                                  value={editRxDosage}
                                  onChange={(e) => setEditRxDosage(e.target.value)}
                                  className="bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-800 outline-none w-full"
                                />
                              </td>
                              <td className="py-2.5">
                                <select
                                  value={editRxFreq}
                                  onChange={(e) => setEditRxFreq(e.target.value)}
                                  className="bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-800 outline-none w-full h-8"
                                >
                                  <option>Once Daily</option>
                                  <option>Twice Daily</option>
                                  <option>Three Times Daily</option>
                                </select>
                              </td>
                              <td className="py-2.5">
                                <input
                                  type="text"
                                  value={editRxDuration}
                                  onChange={(e) => setEditRxDuration(e.target.value)}
                                  className="bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-800 outline-none w-full"
                                />
                              </td>
                              <td className="py-2.5 text-right">
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleSaveRx(rx.id)}
                                    className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingRxId(null)}
                                    className="p-1 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-200 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2.5">
                                <p className="font-bold text-neutral-900">{rx.drugName}</p>
                                <p className="text-[10px] text-neutral-400">By {rx.prescribedBy} on {rx.date}</p>
                              </td>
                              <td className="py-2.5 font-semibold text-neutral-700">{rx.dosage}</td>
                              <td className="py-2.5 text-center font-medium text-neutral-600">{rx.frequency}</td>
                              <td className="py-2.5 text-center font-mono font-bold text-neutral-900">{rx.duration}</td>
                              <td className="py-2.5 text-right">
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleStartEditRx(rx)}
                                    className="p-1 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-650 hover:text-teal-700 border border-teal-200/50 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeletePrescription(rx.id)}
                                    className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200/50 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                                    title="Delete prescription"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vitals Longitudinal Log */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-xs text-neutral-900 border-b border-neutral-100 pb-2.5 flex items-center gap-2 uppercase tracking-wide">
                <Activity className="w-4 h-4 text-sky-600" />
                Vitals Longitudinal Log
              </h3>
              {historyVitals.length === 0 ? (
                <p className="text-xs text-neutral-405 italic text-center py-6">No historical vitals logged in this channel.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase pb-2">
                        <th className="pb-2 font-semibold">Date Logged</th>
                        <th className="pb-2 font-semibold">Blood Pressure</th>
                        <th className="pb-2 font-semibold">Pulse</th>
                        <th className="pb-2 font-semibold">Oxygen (SpO2)</th>
                        <th className="pb-2 font-semibold">Temp</th>
                        <th className="pb-2 font-semibold">Weight</th>
                        <th className="pb-2 font-semibold">Prescribed Medical</th>
                        <th className="pb-2 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-neutral-700">
                      {historyVitals.map((log, idx) => {
                        const isEditingVital = editingVitalId === log.id;
                        return (
                          <tr key={log.id || idx} className="hover:bg-slate-50/50">
                            {isEditingVital ? (
                              <>
                                <td className="py-2.5">
                                  <input
                                    type="text"
                                    value={editVitalTimestamp}
                                    onChange={(e) => setEditVitalTimestamp(e.target.value)}
                                    className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-teal-500 w-28 font-mono"
                                  />
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalSys}
                                      onChange={(e) => setEditVitalSys(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-teal-500 w-10 font-mono text-center"
                                      placeholder="Sys"
                                    />
                                    <span className="text-neutral-405">/</span>
                                    <input
                                      type="text"
                                      value={editVitalDia}
                                      onChange={(e) => setEditVitalDia(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-teal-500 w-10 font-mono text-center"
                                      placeholder="Dia"
                                    />
                                    <span className="text-neutral-450 text-[10px] ml-0.5">mmHg</span>
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalHR}
                                      onChange={(e) => setEditVitalHR(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-teal-500 w-10 font-mono text-center"
                                    />
                                    <span className="text-neutral-450 text-[10px]">BPM</span>
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalSpO2}
                                      onChange={(e) => setEditVitalSpO2(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-teal-500 w-10 font-mono text-center"
                                    />
                                    <span className="text-neutral-450 text-[10px]">%</span>
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalTemp}
                                      onChange={(e) => setEditVitalTemp(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-teal-500 w-10 font-mono text-center"
                                    />
                                    <span className="text-neutral-450 text-[10px]">°C</span>
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalWeight}
                                      onChange={(e) => setEditVitalWeight(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-teal-500 w-10 font-mono text-center"
                                    />
                                    <span className="text-neutral-450 text-[10px]">kg</span>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2.5 font-bold text-slate-900 font-mono">{log.timestamp}</td>
                                <td className="py-2.5 font-mono">{log.bloodPressureSys}/{log.bloodPressureDia} mmHg</td>
                                <td className="py-2.5 font-mono">{log.heartRate} BPM</td>
                                <td className="py-2.5 font-mono">{log.oxygenSaturation}%</td>
                                <td className="py-2.5 font-mono">{log.temperature}°C</td>
                                <td className="py-2.5 font-mono">{log.weight} kg</td>
                              </>
                            )}
                            <td className="py-2.5 font-sans font-medium text-sky-800">
                              {(() => {
                                const apt = getAppointmentForDate(log.timestamp);
                                const combinedRx = getMedicalForDate(log.timestamp);
                                if (editingAptId === apt?.id && apt) {
                                  return (
                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editAptRxText}
                                        onChange={(e) => setEditAptRxText(e.target.value)}
                                        className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 w-48 font-sans font-medium"
                                      />
                                      <button
                                        onClick={() => handleSaveAptRx(apt.id)}
                                        className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-250 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-100 transition-colors"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingAptId(null)}
                                        className="text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200 px-1.5 py-0.5 rounded font-bold hover:bg-neutral-200 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="flex items-center gap-2">
                                    <span>{combinedRx || <span className="text-neutral-400 italic">None</span>}</span>
                                    {apt && (
                                      <button
                                        onClick={() => {
                                          setEditingAptId(apt.id);
                                          setEditAptRxText(apt.prescription || '');
                                        }}
                                        className="text-[10px] text-sky-600 hover:text-sky-700 hover:underline font-bold cursor-pointer transition-colors"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 text-right font-sans font-medium">
                              {isEditingVital ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleSaveVital(log.id)}
                                    className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-250 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-100 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingVitalId(null)}
                                    className="text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200 px-1.5 py-0.5 rounded font-bold hover:bg-neutral-200 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartEditVital(log)}
                                  className="text-[10px] text-sky-600 hover:text-sky-700 hover:underline font-bold cursor-pointer transition-colors"
                                >
                                  Edit Vitals
                                </button>
                              )}
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
        )}

        {/* ========================================================
            RENDER TAB 2: CONSULTATION NOTE PORTAL
            ======================================================== */}
        {activeTab === 'consult' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs animate-fadeIn space-y-5">
            <div>
              <h3 className="font-bold text-sm text-neutral-900">Clinician Consultation Portal</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Record live diagnostic vitals, input symptoms assessment, and dispatch prescriptions to complete checkout.</p>
            </div>

            <form onSubmit={handleCompleteConsultation} className="space-y-6">
              
              {/* Select active appointment */}
              <div className="space-y-1.5 max-w-md">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-0.5">Select Consultation Booking</label>
                <select
                  value={selectedAptId}
                  onChange={(e) => setSelectedAptId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9 cursor-pointer"
                >
                  <option value="">-- Choose Appointment --</option>
                  {patientAppointments
                    .filter(a => a.status !== 'Completed' && a.status !== 'Cancelled')
                    .map(apt => (
                      <option key={apt.id} value={apt.id}>
                        {apt.date} at {apt.timeSlot} — {apt.doctorName} ({apt.specialty})
                      </option>
                    ))}
                </select>
                {patientAppointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length === 0 && (
                  <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded-lg mt-1 font-semibold">
                    ⚠ Warning: No active upcoming consultations booked for this patient.
                  </p>
                )}
              </div>

              {selectedAptId ? (
                <>
                  {/* Vitals inputs */}
                  <div className="space-y-3 pt-2 animate-fadeIn">
                    <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide">1. Check-In Vitals telemetry</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">BP Systolic</label>
                        <input
                          type="number"
                          value={vitalBPsys}
                          onChange={(e) => setVitalBPsys(Number(e.target.value))}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold text-neutral-800 focus:bg-white outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">BP Diastolic</label>
                        <input
                          type="number"
                          value={vitalBPdia}
                          onChange={(e) => setVitalBPdia(Number(e.target.value))}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold text-neutral-800 focus:bg-white outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Pulse (BPM)</label>
                        <input
                          type="number"
                          value={vitalHR}
                          onChange={(e) => setVitalHR(Number(e.target.value))}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold text-neutral-800 focus:bg-white outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Temp (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={vitalTemp}
                          onChange={(e) => setVitalTemp(Number(e.target.value))}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold text-neutral-800 focus:bg-white outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">SpO2 (%)</label>
                        <input
                          type="number"
                          value={vitalSpO2}
                          onChange={(e) => setVitalSpO2(Number(e.target.value))}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold text-neutral-800 focus:bg-white outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Weight (kg)</label>
                        <input
                          type="number"
                          value={vitalWeight}
                          onChange={(e) => setVitalWeight(Number(e.target.value))}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono font-bold text-neutral-800 focus:bg-white outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5 pt-2 animate-fadeIn">
                    <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wide">2. Clinical notes</h4>
                    <textarea
                      placeholder="Summarize symptoms, diagnostic evaluations, and care advice..."
                      rows={4}
                      value={consultNotes}
                      onChange={(e) => setConsultNotes(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Upgraded Multi-Medication Scheduler */}
                  <div className="space-y-4 pt-2 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">3. Prescriptions (Multi-Medication Scheduler)</h4>
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add Medication
                      </button>
                    </div>

                    {medications.map((med, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/60 text-xs space-y-3 relative animate-fadeIn">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[10px] text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">Medication #{idx + 1}</span>
                          {medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(idx)}
                              className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded-md transition-colors cursor-pointer shrink-0"
                              title="Remove medication"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Drug Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Paracetamol"
                              value={med.drugName}
                              onChange={(e) => handleMedicationChange(idx, 'drugName', e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Dosage</label>
                            <select
                              value={med.dosage}
                              onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 h-8"
                            >
                              <option>1 Tablet</option>
                              <option>2 Tablets</option>
                              <option>1 Capsule</option>
                              <option>2 Capsules</option>
                              <option>5 ml (1 tsp)</option>
                              <option>10 ml (2 tsps)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Frequency</label>
                            <select
                              value={med.frequency}
                              onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 h-8"
                            >
                              <option>Once Daily</option>
                              <option>Twice Daily</option>
                              <option>Three Times Daily</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Food Intake</label>
                            <select
                              value={med.foodTiming}
                              onChange={(e) => handleMedicationChange(idx, 'foodTiming', e.target.value as any)}
                              className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 h-8"
                            >
                              <option value="Before Food">Before Food</option>
                              <option value="After Food">After Food</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Start Date</label>
                            <input
                              type="date"
                              value={med.startDate}
                              onChange={(e) => handleMedicationChange(idx, 'startDate', e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">End Date</label>
                            <input
                              type="date"
                              value={med.endDate}
                              onChange={(e) => handleMedicationChange(idx, 'endDate', e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 h-8"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Special Instructions</label>
                            <input
                              type="text"
                              placeholder="e.g. Take with warm water, avoid dairy"
                              value={med.instructions}
                              onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 h-8 font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold text-neutral-455 uppercase block">Dynamic Calculated Times</label>
                            <div className="w-full bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-500 font-mono flex items-center h-8 bg-neutral-50/50">
                              {calculateScheduledTimes(med.frequency).join(", ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submit button */}
                  <div className="flex justify-end pt-2 animate-fadeIn">
                    <button
                      type="submit"
                      id="btn-complete-consultation"
                      className="bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 transition-colors text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      Complete Consultation & Save EHR
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-medium py-12">
                  <p className="font-semibold text-slate-700 mb-1">Select consultation time slot</p>
                  <p className="text-[11px] text-slate-400">Please choose an active booking slot from the dropdown above to begin entering vitals, notes, and prescriptions.</p>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ========================================================
            RENDER TAB 3: LONGITUDINAL HISTORY LOOKUP
            ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Vitals History List */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-xs text-neutral-900 border-b border-neutral-100 pb-2.5 flex items-center gap-2 uppercase tracking-wide">
                <Activity className="w-4 h-4 text-sky-600" />
                Vitals Longitudinal Log
              </h3>
              {historyVitals.length === 0 ? (
                <p className="text-xs text-neutral-405 italic text-center py-6">No historical vitals logged in this channel.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase pb-2">
                        <th className="pb-2 font-semibold">Date Logged</th>
                        <th className="pb-2 font-semibold">Blood Pressure</th>
                        <th className="pb-2 font-semibold">Pulse</th>
                        <th className="pb-2 font-semibold">Oxygen (SpO2)</th>
                        <th className="pb-2 font-semibold">Temp</th>
                        <th className="pb-2 font-semibold">Weight</th>
                        <th className="pb-2 font-semibold">Prescribed Medical</th>
                        <th className="pb-2 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-neutral-700">
                      {historyVitals.map((log, idx) => {
                        const isEditingVital = editingVitalId === log.id;
                        return (
                          <tr key={log.id || idx} className="hover:bg-slate-50/50">
                            {isEditingVital ? (
                              <>
                                <td className="py-2.5">
                                  <input
                                    type="text"
                                    value={editVitalTimestamp}
                                    onChange={(e) => setEditVitalTimestamp(e.target.value)}
                                    className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 w-28 font-mono"
                                  />
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalSys}
                                      onChange={(e) => setEditVitalSys(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 w-10 font-mono text-center"
                                      placeholder="Sys"
                                    />
                                    <span className="text-neutral-405">/</span>
                                    <input
                                      type="text"
                                      value={editVitalDia}
                                      onChange={(e) => setEditVitalDia(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 w-10 font-mono text-center"
                                      placeholder="Dia"
                                    />
                                    <span className="text-neutral-450 text-[10px] ml-0.5">mmHg</span>
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalHR}
                                      onChange={(e) => setEditVitalHR(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 w-10 font-mono text-center"
                                    />
                                    <span className="text-neutral-450 text-[10px]">BPM</span>
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalSpO2}
                                      onChange={(e) => setEditVitalSpO2(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 w-10 font-mono text-center"
                                    />
                                    <span className="text-neutral-450 text-[10px]">%</span>
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalTemp}
                                      onChange={(e) => setEditVitalTemp(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 w-10 font-mono text-center"
                                    />
                                    <span className="text-neutral-450 text-[10px]">°C</span>
                                  </div>
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editVitalWeight}
                                      onChange={(e) => setEditVitalWeight(e.target.value)}
                                      className="bg-white border border-neutral-300 rounded px-1 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 w-10 font-mono text-center"
                                    />
                                    <span className="text-neutral-450 text-[10px]">kg</span>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2.5 font-bold text-slate-900 font-mono">{log.timestamp}</td>
                                <td className="py-2.5 font-mono">{log.bloodPressureSys}/{log.bloodPressureDia} mmHg</td>
                                <td className="py-2.5 font-mono">{log.heartRate} BPM</td>
                                <td className="py-2.5 font-mono">{log.oxygenSaturation}%</td>
                                <td className="py-2.5 font-mono">{log.temperature}°C</td>
                                <td className="py-2.5 font-mono">{log.weight} kg</td>
                              </>
                            )}
                            <td className="py-2.5 font-sans font-medium text-sky-800">
                              {(() => {
                                const apt = getAppointmentForDate(log.timestamp);
                                const combinedRx = getMedicalForDate(log.timestamp);
                                if (editingAptId === apt?.id && apt) {
                                  return (
                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editAptRxText}
                                        onChange={(e) => setEditAptRxText(e.target.value)}
                                        className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs text-neutral-800 outline-none focus:ring-1 focus:ring-sky-500 w-48 font-sans font-medium"
                                      />
                                      <button
                                        onClick={() => handleSaveAptRx(apt.id)}
                                        className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-250 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-100 transition-colors"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingAptId(null)}
                                        className="text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200 px-1.5 py-0.5 rounded font-bold hover:bg-neutral-200 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="flex items-center gap-2">
                                    <span>{combinedRx || <span className="text-neutral-400 italic">None</span>}</span>
                                    {apt && (
                                      <button
                                        onClick={() => {
                                          setEditingAptId(apt.id);
                                          setEditAptRxText(apt.prescription || '');
                                        }}
                                        className="text-[10px] text-sky-600 hover:text-sky-700 hover:underline font-bold cursor-pointer transition-colors"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 text-right font-sans font-medium">
                              {isEditingVital ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleSaveVital(log.id)}
                                    className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-250 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-100 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingVitalId(null)}
                                    className="text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200 px-1.5 py-0.5 rounded font-bold hover:bg-neutral-200 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartEditVital(log)}
                                  className="text-[10px] text-sky-600 hover:text-sky-700 hover:underline font-bold cursor-pointer transition-colors"
                                >
                                  Edit Vitals
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Consultation Reports */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-xs text-neutral-900 border-b border-neutral-100 pb-2.5 flex items-center gap-2 uppercase tracking-wide">
                <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                Completed Consultations & Clinical Notes
              </h3>
              {historyApts.length === 0 ? (
                <p className="text-xs text-neutral-405 italic text-center py-6">No past completed clinical notes available.</p>
              ) : (
                <div className="space-y-4">
                  {historyApts.map((apt) => (
                    <div key={apt.id} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/60 text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-neutral-900 text-sm">{apt.doctorName}</p>
                          <p className="text-[10px] text-neutral-400">{apt.specialty} • {apt.clinic || "Clinic Branch"}</p>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500 font-bold bg-neutral-200/60 px-2 py-0.5 rounded">
                          {apt.date}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-neutral-200/40">
                        <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest block">Clinical Notes</span>
                        <p className="mt-1 leading-relaxed text-neutral-700 italic">"{apt.clinicalNotes || "No notes entered."}"</p>
                      </div>
                      {apt.prescription && (
                        <div className="pt-1">
                          <span className="text-[9px] font-extrabold text-neutral-450 uppercase tracking-widest block">Prescription Summary</span>
                          <p className="mt-1 font-bold text-sky-800 font-sans">{apt.prescription}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Modify Patient Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 flex flex-col gap-5 text-neutral-800">
            <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-neutral-950">Modify Patient Profile</h3>
                <p className="text-xs text-neutral-450 mt-0.5 font-medium">Edit patient demographics, medical history, and insurance records.</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 px-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer text-xs font-bold text-neutral-600"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEditProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-850 outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Date of Birth</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 h-9"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Blood Type</label>
                  <input
                    type="text"
                    placeholder="e.g. O+"
                    value={editBloodType}
                    onChange={(e) => setEditBloodType(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Insurance Provider</label>
                  <input
                    type="text"
                    placeholder="e.g. Great Eastern"
                    value={editInsuranceProvider}
                    onChange={(e) => setEditInsuranceProvider(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Policy Number</label>
                  <input
                    type="text"
                    placeholder="e.g. GE-98765-AX"
                    value={editInsurancePolicy}
                    onChange={(e) => setEditInsurancePolicy(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={editEmergencyName}
                    onChange={(e) => setEditEmergencyName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 h-9"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Emergency Contact Phone/Relation</label>
                  <input
                    type="text"
                    value={editEmergencyPhone}
                    onChange={(e) => setEditEmergencyPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 h-9"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Allergies (comma separated)</label>
                  <input
                    type="text"
                    value={editAllergies.join(", ")}
                    onChange={(e) => setEditAllergies(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 h-9"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-widest pl-0.5">Chronic Conditions (comma separated)</label>
                  <input
                    type="text"
                    value={editChronic.join(", ")}
                    onChange={(e) => setEditChronic(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-855 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 h-9"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clickable Visit Encounter Details Modal */}
      {selectedVisitModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                  <Calendar className="w-3 h-3" />
                  <span>Encounter Record: {selectedVisitModal.date}</span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  Clinical Visit &amp; Medication Schedule
                </h3>
              </div>
              <button
                onClick={() => setSelectedVisitModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visit Context */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Attending Doctor</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedVisitModal.doctorName}</p>
                <p className="text-[10px] text-slate-500">{selectedVisitModal.specialty}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Clinic / Facility</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedVisitModal.clinic || selectedVisitModal.hospital || 'Outpatient Clinic'}</p>
                <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedVisitModal.status}
                </span>
              </div>
            </div>

            {/* Reason for Visit */}
            <div className="space-y-1.5 bg-sky-50/50 p-3.5 rounded-2xl border border-sky-100">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                Reason for Visit / Chief Complaint
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {selectedVisitModal.remarks || "Outpatient follow-up consultation and clinical examination. Patient reported persistent mild discomfort requiring specialist triage review."}
              </p>
            </div>

            {/* Prescribed Medications */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-sky-600" />
                Doctor's Prescriptions &amp; Medication Schedule
              </h4>
              <div className="space-y-2">
                {((activePatient.prescriptions || []).length === 0) ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">No prescription issued for this visit date.</p>
                ) : (
                  (activePatient.prescriptions || []).map((rx: any, idx: number) => {
                    const times = calculateScheduledTimes(rx.frequency || '');
                    return (
                      <div key={rx.id || idx} className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-2 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">{rx.drugName}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">Dosage: {rx.dosage} • Duration: {rx.duration || '7 Days'}</span>
                          </div>
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                            {rx.frequency}
                          </span>
                        </div>

                        {/* Schedule & Reminder Times */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-600">Reminder Schedule:</span>
                            <div className="flex gap-1">
                              {times.map((t, ti) => (
                                <span key={ti} className="text-[9.5px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 italic">
                            Take after meals with water
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedVisitModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                Close Encounter Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
