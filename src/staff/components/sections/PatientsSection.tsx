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
  CheckCircle2,
  AlertCircle, 
  Clock, 
  Pill, 
  ShieldCheck, 
  Stethoscope, 
  Building
} from 'lucide-react';
import { 
  getStaffAccountByEmail, 
  getFacilityIdByHospital, 
  matchesSpecialty 
} from '../../../data/staffAccounts';

interface Prescription {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  prescribedBy?: string;
  date?: string;
}

export default function PatientsSection() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isDetailView, setIsDetailView] = useState<boolean>(false);
  const [searchVal, setSearchVal] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Appointments for the selected patient
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [isLoadingApts, setIsLoadingApts] = useState<boolean>(false);
  const [selectedVisitAptId, setSelectedVisitAptId] = useState<string>('');

  // Doctor notes state
  const [doctorNoteInput, setDoctorNoteInput] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  // Medication scheduler state
  const [newMedDrug, setNewMedDrug] = useState<string>('');
  const [newMedDosage, setNewMedDosage] = useState<string>('1 Tablet');
  const [newMedFreq, setNewMedFreq] = useState<string>('Once Daily');
  const [newMedInstructions, setNewMedInstructions] = useState<string>('Take after meals');
  const [isAddingMed, setIsAddingMed] = useState<boolean>(false);

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadPatients = () => {
    setIsLoading(true);
    const isAdmin = localStorage.getItem('lifelink_user_role') === 'Admin';
    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const staffAccount = getStaffAccountByEmail(loggedEmail);
    const currentClinic = staffAccount?.hospital || localStorage.getItem("lifelink_user_clinic") || '';
    const currentDepartment = staffAccount?.department || localStorage.getItem("lifelink_user_department") || "All";
    const currentFacilityId = staffAccount?.facility_id || getFacilityIdByHospital(currentClinic);
    const isDoctor = staffAccount?.role?.toLowerCase() === "doctor" || loggedEmail.toLowerCase().startsWith("dr_");
    const doctorName = isDoctor ? (staffAccount?.name || localStorage.getItem("lifelink_user_name") || "") : "";

    Promise.all([
      fetch("/api/patients").then(res => res.json()).catch(() => []),
      fetch("/api/appointments").then(res => res.json()).catch(() => [])
    ])
      .then(([patientsList, appointmentsList]) => {
        if (Array.isArray(patientsList)) {
          let filtered = patientsList;
          if (!isAdmin && currentClinic) {
            filtered = patientsList.filter((p: any) => {
              return appointmentsList.some((ap: any) => {
                const patientMatch = (
                  ap.patientId === p.id || 
                  ap.patientId === p.dbId || 
                  ap.patientName?.toLowerCase() === p.name?.toLowerCase() || 
                  ap.patientId === p.email
                );
                if (!patientMatch) return false;

                // 1. Hospital / Facility match
                const aptFacilityId = ap.facility_id ? Number(ap.facility_id) : getFacilityIdByHospital(ap.clinic || ap.hospital);
                if (aptFacilityId !== currentFacilityId) return false;

                // 2. Department match
                if (currentDepartment !== 'All' && !matchesSpecialty(currentDepartment, ap.specialty)) {
                  return false;
                }

                // 3. Doctor match (Doctors strictly only see their own outpatients)
                if (isDoctor) {
                  const docClean = (doctorName || "").toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, "").trim();
                  const aptDoc = (ap.doctorName || "").toLowerCase().replace(/^(dr\.|dato' dr\.)\s*/, "").trim();
                  const aptDocEmail = (ap.doctorEmail || "").toLowerCase();
                  const isMatch = (
                    (docClean && (aptDoc.includes(docClean) || docClean.includes(aptDoc))) || 
                    (aptDocEmail && aptDocEmail === loggedEmail.toLowerCase())
                  );
                  if (!isMatch) return false;
                }

                return true;
              });
            });
          }
          setPatients(filtered);
          if (filtered.length > 0 && !selectedPatientId) {
            setSelectedPatientId(filtered[0].id);
          }
        }
      })
      .catch(err => {
        console.warn("Failed to load patients", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Load real visits / appointments for the active patient
  useEffect(() => {
    if (!activePatient) {
      setPatientAppointments([]);
      return;
    }

    setIsLoadingApts(true);
    fetch("/api/appointments")
      .then(res => res.json())
      .then((allApts: any[]) => {
        if (!Array.isArray(allApts)) return;
        const matched = allApts.filter(apt => {
          return (
            apt.patientId === activePatient.id ||
            apt.patientId === activePatient.dbId ||
            apt.patientId === activePatient.email ||
            (apt.patientName && activePatient.name && apt.patientName.toLowerCase() === activePatient.name.toLowerCase())
          );
        }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setPatientAppointments(matched);
        if (matched.length > 0) {
          setSelectedVisitAptId(prev => (matched.some(a => a.id === prev) ? prev : matched[0].id));
        } else {
          setSelectedVisitAptId('');
        }
      })
      .catch(err => console.warn("Failed to load patient appointments", err))
      .finally(() => setIsLoadingApts(false));
  }, [activePatient]);

  // Currently selected encounter / appointment
  const selectedVisitApt = useMemo(() => {
    if (!selectedVisitAptId) return patientAppointments[0] || null;
    return patientAppointments.find(a => a.id === selectedVisitAptId) || patientAppointments[0] || null;
  }, [patientAppointments, selectedVisitAptId]);

  // Sync doctor notes textarea when selected visit changes
  useEffect(() => {
    if (selectedVisitApt) {
      setDoctorNoteInput(selectedVisitApt.clinicalNotes || selectedVisitApt.clinical_notes || "");
    } else {
      setDoctorNoteInput("");
    }
  }, [selectedVisitApt?.id]);

  // Save clinical doctor notes for the selected encounter
  const handleSaveDoctorNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorNoteInput.trim()) {
      setErrorMsg("Please enter note content before saving.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    if (!activePatient) return;

    setIsSavingNote(true);
    try {
      const targetApt = selectedVisitApt || patientAppointments[0];
      if (targetApt && targetApt.id) {
        await fetch(`/api/appointments/${targetApt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clinicalNotes: doctorNoteInput.trim()
          })
        });

        // Refresh appointments list in place immediately
        setPatientAppointments(prev => prev.map(a => a.id === targetApt.id ? { ...a, clinicalNotes: doctorNoteInput.trim() } : a));
      }

      // Also record in system logs
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[Clinical Note Recorded]: Patient ${activePatient.name} (${activePatient.email}) [Encounter: ${targetApt?.date || "General"}] - ${doctorNoteInput.trim()}`,
          level: "info"
        })
      });

      setSuccessMsg(`Doctor notes saved for encounter on ${targetApt?.date || "selected visit"}!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to save doctor notes", err);
      setErrorMsg("Network error: Failed to save doctor notes.");
      setTimeout(() => setErrorMsg(""), 3000);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Add scheduled medication for the selected encounter
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedDrug.trim()) {
      setErrorMsg("Please enter the medication name.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    if (!activePatient) return;

    setIsAddingMed(true);
    try {
      const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
      const staffAccount = getStaffAccountByEmail(loggedEmail);
      const doctorName = selectedVisitApt?.doctorName || staffAccount?.name || "Attending Physician";

      const newRx = {
        drugName: newMedDrug.trim(),
        dosage: newMedDosage.trim(),
        frequency: newMedFreq,
        instructions: newMedInstructions.trim(),
        prescribedBy: doctorName,
        date: selectedVisitApt?.date || new Date().toISOString().split("T")[0]
      };

      const res = await fetch(`/api/patients/${encodeURIComponent(activePatient.email)}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRx)
      });

      if (res.ok) {
        const savedRx = await res.json();
        // Update local patient state
        setPatients(prev => prev.map(p => {
          if (p.id === activePatient.id || p.email === activePatient.email) {
            return {
              ...p,
              prescriptions: [savedRx, ...(p.prescriptions || [])]
            };
          }
          return p;
        }));

        setNewMedDrug("");
        setNewMedDosage("1 Tablet");
        setNewMedInstructions("Take after meals");
        setSuccessMsg("Medication scheduled successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg("Failed to add medication schedule.");
        setTimeout(() => setErrorMsg(""), 3000);
      }
    } catch (err) {
      console.error("Failed to add medication schedule", err);
      setErrorMsg("Network error: Failed to schedule medication.");
      setTimeout(() => setErrorMsg(""), 3000);
    } finally {
      setIsAddingMed(false);
    }
  };

  // Delete scheduled medication
  const handleDeleteMedication = async (rxId: string) => {
    if (!window.confirm("Are you sure you want to remove this medication from the scheduler?")) return;
    if (!activePatient) return;

    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(activePatient.email)}/prescriptions/${encodeURIComponent(rxId)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setPatients(prev => prev.map(p => {
          if (p.id === activePatient.id || p.email === activePatient.email) {
            return {
              ...p,
              prescriptions: (p.prescriptions || []).filter((rx: any) => rx.id !== rxId)
            };
          }
          return p;
        }));
        setSuccessMsg("Medication removed from scheduler.");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Failed to delete medication", err);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      (p.name || "").toLowerCase().includes(searchVal.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchVal.toLowerCase()) ||
      (p.phone || "").toLowerCase().includes(searchVal.toLowerCase())
    );
  }, [patients, searchVal]);

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 1: PATIENT DIRECTORY INDEX (LIST VIEW)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isDetailView) {
    return (
      <div className="space-y-6 font-sans text-neutral-800">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2.5">
              <span>Patient Directory</span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full font-mono">
                {filteredPatients.length} Active {filteredPatients.length === 1 ? 'Profile' : 'Profiles'}
              </span>
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all h-10"
            />
          </div>
        </div>

        {/* Patients Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <Clock className="w-8 h-8 animate-spin text-teal-600 mb-2" />
            <p className="text-xs">Loading patient registry records...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-sm text-slate-700">No patient records found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((p) => {
              const initials = (p.name || "PT").split(' ').map((n: string) => n[0]).join('').slice(0, 2);

              return (
                <div
                  key={p.id || p.email}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setIsDetailView(true);
                  }}
                  className="bg-white border border-neutral-200/80 hover:border-teal-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{p.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                          {p.phone || "No phone"}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {p.gender || "Patient"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">DOB: {p.dob || "—"}</span>
                    <span className="text-xs font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform">
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

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 2: PATIENT DETAIL VIEW (REAL DATA ONLY, SIMPLIFIED WORKFLOW)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!activePatient) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setIsDetailView(false)}
          className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
        >
          Back to Patient Directory
        </button>
        <div className="bg-white p-8 rounded-2xl text-center text-slate-400">
          No patient record selected.
        </div>
      </div>
    );
  }

  const patientInitials = (activePatient.name || "PT").split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const prescriptionsList: Prescription[] = activePatient.prescriptions || [];

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Top Navigation Bar: Back to Patient Directory (Clean, no arrow, no label, no filter) */}
      <div className="flex items-center justify-between bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs">
        <button
          onClick={() => setIsDetailView(false)}
          className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer active:scale-98 shadow-xs"
        >
          Back to Patient Directory
        </button>
      </div>

      {/* Floating Status Feedback */}
      {successMsg && (
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl shadow-xs animate-fadeIn">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 p-3.5 rounded-xl shadow-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── CARD 1: PATIENT INFORMATION (Demographics & Biometrics, No Edit Button) ── */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-neutral-100">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 text-lg font-black flex items-center justify-center border border-teal-200 shadow-xs shrink-0">
            {patientInitials}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {activePatient.name}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Email: {activePatient.email}
            </p>
          </div>
        </div>

        {/* Patient Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Date of Birth
            </span>
            <p className="font-bold text-slate-800 font-mono">{activePatient.dob || "—"}</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Gender
            </span>
            <p className="font-bold text-slate-800">{activePatient.gender || "—"}</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Phone Number
            </span>
            <p className="font-bold text-slate-800 font-mono">{activePatient.phone || "—"}</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Blood Type
            </span>
            <p className="font-bold text-slate-800 font-mono">{activePatient.bloodType || "—"}</p>
          </div>
        </div>

        {/* Clinical Biometrics Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Known Allergies
            </span>
            <p className="font-semibold text-slate-800">
              {Array.isArray(activePatient.allergies) && activePatient.allergies.length > 0
                ? activePatient.allergies.join(", ")
                : "No known drug allergies reported"}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Chronic Conditions
            </span>
            <p className="font-semibold text-slate-800">
              {Array.isArray(activePatient.chronicConditions) && activePatient.chronicConditions.length > 0
                ? activePatient.chronicConditions.filter((c: string) => c && c !== "None").join(", ") || "None declared"
                : "None declared"}
            </p>
          </div>
        </div>
      </div>

      {/* ── CARD 2: VISIT & CONSULTATION HISTORY (Real data from appointments ledger) ── */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Visit &amp; Consultation History</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real attendance times, consultation records, and hospital encounters.</p>
          </div>
          <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            {patientAppointments.length} Recorded {patientAppointments.length === 1 ? 'Visit' : 'Visits'}
          </span>
        </div>

        {isLoadingApts ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
            <span>Loading visit history...</span>
          </div>
        ) : patientAppointments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <p className="font-semibold text-slate-600">No clinical consultation visits recorded for this patient yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Upcoming check-ins and completed encounters will automatically be logged here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {patientAppointments.map((apt, idx) => {
              const isDone = apt.status === 'Completed' || apt.status === 'COMPLETED' || apt.status === 'Done';
              const isCheckedIn = apt.checkedIn || apt.status === 'CHECKED_IN' || apt.status === 'Checked In';

              return (
                <div 
                  key={apt.id || idx}
                  onClick={() => setSelectedVisitAptId(apt.id)}
                  className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                    selectedVisitApt?.id === apt.id 
                      ? 'bg-teal-50/60 border-teal-500 shadow-xs ring-2 ring-teal-500/20' 
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {apt.date} • {apt.timeSlot}
                      </span>
                      {apt.queueNumber && (
                        <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          {apt.queueNumber}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        isDone 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : isCheckedIn 
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {apt.status || 'Scheduled'}
                      </span>
                      {selectedVisitApt?.id === apt.id && (
                        <span className="text-[10px] font-extrabold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" /> Selected Encounter
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>Doctor:</strong> {apt.doctorName || "Specialist"} • <strong>Specialty:</strong> {apt.specialty || "General"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      <strong>Facility:</strong> {apt.clinic || apt.hospital || "Pantai Hospital"}
                      {apt.symptoms && <> • <strong>Complaint:</strong> <em>{apt.symptoms}</em></>}
                    </p>

                    {/* Recorded Clinical Notes / Diagnosis */}
                    {(apt.clinicalNotes || apt.diagnosis) && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-teal-900 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100">
                        {apt.diagnosis && <p><strong>Diagnosis:</strong> {apt.diagnosis}</p>}
                        {apt.clinicalNotes && <p className="mt-0.5 whitespace-pre-wrap"><strong>Clinical Notes:</strong> {apt.clinicalNotes}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                    {apt.checkInTime && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-mono block">Arrived at</span>
                        <span className="text-xs font-bold text-slate-700 font-mono">{apt.checkInTime}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVisitAptId(apt.id);
                        const notesCard = document.getElementById("clinical-doctor-notes-card");
                        if (notesCard) notesCard.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition shadow-2xs"
                    >
                      {selectedVisitApt?.id === apt.id ? "Editing This Date" : "Select & Edit"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CARD 3: WRITE DOCTOR NOTES (OPTIONAL) ── */}
      <div id="clinical-doctor-notes-card" className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Clinical Doctor Notes (Optional)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Record examination remarks, diagnostic findings, or clinical follow-up instructions for this patient.</p>
          </div>
          {selectedVisitApt && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-mono text-[11px] font-bold">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>{selectedVisitApt.date} • {selectedVisitApt.timeSlot}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveDoctorNotes} className="space-y-3">
          <textarea
            rows={3}
            value={doctorNoteInput}
            onChange={(e) => setDoctorNoteInput(e.target.value)}
            placeholder="Type clinical notes, diagnostic evaluations, or observations here (optional)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all resize-y"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingNote || !doctorNoteInput.trim()}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isSavingNote ? "Saving Notes…" : "Save Doctor Notes"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── CARD 4: MEDICATION SCHEDULER (Clean & Easy) ── */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>Medication Scheduler</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage scheduled medications, dosages, and dosing frequencies for this patient.</p>
          </div>
          <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full font-mono">
            {prescriptionsList.length} Active {prescriptionsList.length === 1 ? 'Med' : 'Meds'}
          </span>
        </div>

        {/* Existing Scheduled Medications Table */}
        {prescriptionsList.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            No active medication formulas currently scheduled. Use the form below to add a medication.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2.5">Medication Name</th>
                  <th className="pb-2.5">Dosage</th>
                  <th className="pb-2.5">Frequency</th>
                  <th className="pb-2.5">Instructions</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {prescriptionsList.map((rx: Prescription, idx: number) => (
                  <tr key={rx.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3">
                      <p className="font-extrabold text-slate-900 text-xs">{rx.drugName}</p>
                      {rx.date && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Prescribed: {rx.date}</p>}
                    </td>
                    <td className="py-3 font-semibold text-slate-800">{rx.dosage}</td>
                    <td className="py-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                        {rx.frequency}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{rx.instructions || rx.duration || "Standard dosage"}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteMedication(rx.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="Delete from scheduler"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Medication Form */}
        <div className="pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl border border-slate-200/80">
          <h4 className="text-xs font-extrabold text-slate-800 mb-3 flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>Add Medication to Scheduler</span>
          </h4>

          <form onSubmit={handleAddMedication} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Medication Name</label>
              <input
                type="text"
                placeholder="e.g. Paracetamol"
                value={newMedDrug}
                onChange={(e) => setNewMedDrug(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Dosage</label>
              <input
                type="text"
                placeholder="e.g. 500mg (1 Tablet)"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Frequency</label>
              <select
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer h-9"
              >
                <option value="Once Daily">Once Daily (QD)</option>
                <option value="Twice Daily">Twice Daily (BID)</option>
                <option value="Three Times Daily">Three Times Daily (TID)</option>
                <option value="Four Times Daily">Four Times Daily (QID)</option>
                <option value="PRN / As Needed">PRN / As Needed</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Instructions</label>
              <input
                type="text"
                placeholder="e.g. After meals"
                value={newMedInstructions}
                onChange={(e) => setNewMedInstructions(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end pt-1">
              <button
                type="submit"
                disabled={isAddingMed || !newMedDrug.trim()}
                className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAddingMed ? "Adding…" : "Schedule Medication"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
