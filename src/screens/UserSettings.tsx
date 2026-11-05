import React, { useState, useEffect, useMemo } from "react";
import { 
  Sliders, 
  ShieldCheck, 
  Database, 
  Download, 
  User,
  Lock,
  CheckCircle2
} from "lucide-react";
import { PatientProfile, VitalSign, Appointment } from "../types";

interface UserSettingsProps {
  patientProfile: PatientProfile;
  vitals: VitalSign[];
  appointments: Appointment[];
  onSetScreen: (screen: string) => void;
  onLogout: () => void;
  onUpdateProfile?: (updated: PatientProfile) => void;
}

const translations: Record<string, Record<string, string>> = {
  "English": {
    "Profile & Security Settings": "Profile & Security Settings",
    "Maintain your universal medical authentication identity, verify insurance policies, and configure account access controls.": "Maintain your universal medical authentication identity, verify insurance policies, and configure account access controls.",
    "1. System Profile View (Medical Identity)": "1. System Profile View (Medical Identity)",
    "2. Account Settings View (System Controls)": "2. Account Settings View (System Controls)",
    "System Profile View (Medical Identity)": "System Profile View (Medical Identity)",
    "● SYNCED TO DATABASE": "● SYNCED TO DATABASE",
    "National Identity": "National Identity",
    "Full Legal Name": "Full Legal Name",
    "MyKad (IC) / Passport Number": "MyKad (IC) / Passport Number",
    "Date of Birth": "Date of Birth",
    "Gender": "Gender",
    "Primary Contact Number": "Primary Contact Number",
    "Nationality": "Nationality",
    "Clinical Biometrics": "Clinical Biometrics",
    "Blood Type": "Blood Type",
    "Known Allergies (Comma-separated)": "Known Allergies (Comma-separated)",
    "Chronic Conditions": "Chronic Conditions",
    "Emergency Contact Details (Next of Kin)": "Emergency Contact Details (Next of Kin)",
    "Full Contact Name": "Full Contact Name",
    "Phone Number & Relation": "Phone Number & Relation",
    "Insurance Coverage": "Insurance Coverage",
    "Provider Network": "Provider Network",
    "Policy Card ID Reference": "Policy Card ID Reference",
    "Save Profile Details": "Save Profile Details",
    "Account Settings View (System Controls)": "Account Settings View (System Controls)",
    "● Settings successfully synchronized!": "● Settings successfully synchronized!",
    "Regionalizations & Language Presets": "Regionalizations & Language Presets",
    "Default Region Portal": "Default Region Portal",
    "Primary Language": "Primary Language",
    "Notification Alerts Preferences": "Notification Alerts Preferences",
    "Biometric Vitals Push Alerts": "Biometric Vitals Push Alerts",
    "Push notification alerts to log daily values and clinical checking.": "Push notification alerts to log daily values and clinical checking.",
    "Medications Refill SMS Reminders": "Medications Refill SMS Reminders",
    "Transmit SMS reminders when Ventolin Rx refilling bounds need renew.": "Transmit SMS reminders when Ventolin Rx refilling bounds need renew.",
    "EHR Lab Results Email Triggers": "EHR Lab Results Email Triggers",
    "Secure diagnostic pdf copy dispatched directly to registered address.": "Secure diagnostic pdf copy dispatched directly to registered address.",
    "Save System Settings": "Save System Settings",
    "Change Password": "Change Password",
    "To change your account password safely, click below to receive a secure validation token link at your registered email address.": "To change your account password safely, click below to receive a secure validation token link at your registered email address.",
    "Send Reset Link to Email": "Send Reset Link to Email",
    "Sending Link...": "Sending Link...",
    "A secure reset link has been sent to your email. Please check your inbox (or use the dev link below) to verify and change your password.": "A secure reset link has been sent to your email. Please check your inbox (or use the dev link below) to verify and change your password.",
    "Secure EHR Data Management": "Secure EHR Data Management",
    "In accordance with Malaysia MOH clinical compliance regulations, you can securely export your full medical ledger and historical vital readings into a signed, Portable JSON backup.": "In accordance with Malaysia MOH clinical compliance regulations, you can securely export your full medical ledger and historical vital readings into a signed, Portable JSON backup.",
    "Select Clinical Visit Report": "Select Clinical Visit Report",
    "No completed clinic visits on record.": "No completed clinic visits on record.",
    "Export Selected Report": "Export Selected Report",
    "Export Full Medical Ledger": "Export Full Medical Ledger",
    "Verify Encryption Cert": "Verify Encryption Cert",
    "Medical Identity Index": "Medical Identity Index",
    "Registry": "Registry",
    "National ID": "National ID",
    "DOB & Gender": "DOB & Gender",
    "Insurance Provider": "Insurance Provider",
    "Policy Number": "Policy Number",
    "EHR Sync Status": "EHR Sync Status",
    "Secure Portal Logout": "Secure Portal Logout",
    "None": "None",
    "Male": "Male",
    "Female": "Female",
    "Other": "Other",
    "Asthma (Mild)": "Asthma (Mild)",
    "Seasonal Rhinitis": "Seasonal Rhinitis",
    "Hypertension": "Hypertension",
    "Diabetes Typ-2": "Diabetes Typ-2",
    "Patient Feedback": "Patient Feedback",
    "We value your input. Share your experience with our services to help us improve patient care. (Maximum 50 words)": "We value your input. Share your experience with our services to help us improve patient care. (Maximum 50 words)",
    "Write your feedback here...": "Write your feedback here...",
    "Submit Feedback": "Submit Feedback",
    "Submitting...": "Submitting...",
    "Thank you! Your feedback has been submitted successfully.": "Thank you! Your feedback has been submitted successfully.",
    "words remaining": "words remaining",
    "Word limit reached": "Word limit reached"
  },
  "Bahasa Malaysia": {
    "Profile & Security Settings": "Tetapan Profil & Keselamatan",
    "Maintain your universal medical authentication identity, verify insurance policies, and configure account access controls.": "Kekalkan identiti pengesahan perubatan universal anda, sahkan polisi insurans, dan konfigurasikan kawalan akses akaun.",
    "1. System Profile View (Medical Identity)": "1. Paparan Profil Sistem (Identiti Perubatan)",
    "2. Account Settings View (System Controls)": "2. Paparan Tetapan Akaun (Kawalan Sistem)",
    "System Profile View (Medical Identity)": "Paparan Profil Sistem (Identiti Perubatan)",
    "● SYNCED TO DATABASE": "● DISINKRONKAN DENGAN PANGKALAN DATA",
    "National Identity": "Identiti Kebangsaan",
    "Full Legal Name": "Nama Penuh Mengikut Undang-undang",
    "MyKad (IC) / Passport Number": "Nombor MyKad (KP) / Pasport",
    "Date of Birth": "Tarikh Lahir",
    "Gender": "Jantina",
    "Primary Contact Number": "Nombor Hubungan Utama",
    "Nationality": "Kewarganegaraan",
    "Clinical Biometrics": "Biometrik Klinikal",
    "Blood Type": "Kumpulan Darah",
    "Known Allergies (Comma-separated)": "Alahan Diketahui (Dipisahkan koma)",
    "Chronic Conditions": "Penyakit Kronik",
    "Emergency Contact Details (Next of Kin)": "Butiran Hubungan Kecemasan (Waris)",
    "Full Contact Name": "Nama Penuh Waris",
    "Phone Number & Relation": "Nombor Telefon & Hubungan",
    "Insurance Coverage": "Perlindungan Insurans",
    "Provider Network": "Rangkaian Pembekal",
    "Policy Card ID Reference": "Rujukan ID Kad Polisi",
    "Save Profile Details": "Simpan Butiran Profil",
    "Account Settings View (System Controls)": "Paparan Tetapan Akaun (Kawalan Sistem)",
    "● Settings successfully synchronized!": "● Tetapan berjaya disinkronkan!",
    "Regionalizations & Language Presets": "Serantau & Pratetap Bahasa",
    "Default Region Portal": "Portal Wilayah Lalai",
    "Primary Language": "Bahasa Utama",
    "Notification Alerts Preferences": "Keutamaan Pemberitahuan Makluman",
    "Biometric Vitals Push Alerts": "Makluman Tolak Vitals Biometrik",
    "Push notification alerts to log daily values and clinical checking.": "Makluman pemberitahuan tolak untuk merekod nilai harian dan semakan klinikal.",
    "Medications Refill SMS Reminders": "Peringatan SMS Isian Semula Ubat",
    "Transmit SMS reminders when Ventolin Rx refilling bounds need renew.": "Hantar peringatan SMS apabila had isian semula Ventolin Rx perlu diperbaharui.",
    "EHR Lab Results Email Triggers": "Pencetus E-mel Keputusan Makmal EHR",
    "Secure diagnostic pdf copy dispatched directly to registered address.": "Salinan pdf diagnostik selamat dihantar terus ke alamat berdaftar.",
    "Save System Settings": "Simpan Tetapan Sistem",
    "Change Password": "Tukar Kata Laluan",
    "To change your account password safely, click below to receive a secure validation token link at your registered email address.": "Untuk menukar kata laluan akaun anda dengan selamat, klik di bawah untuk menerima pautan token pengesahan selamat di alamat e-mel berdaftar anda.",
    "Send Reset Link to Email": "Hantar Pautan Set Semula ke E-mel",
    "Sending Link...": "Menghantar Pautan...",
    "A secure reset link has been sent to your e-mel. Please check your inbox (or use the dev link below) to verify and change your password.": "Pautan set semula yang selamat telah dihantar ke e-mel anda. Sila semak peti masuk anda (atau gunakan pautan pembangun di bawah) untuk mengesahkan dan menukar kata laluan anda.",
    "Secure EHR Data Management": "Pengurusan Data EHR Selamat",
    "In accordance with Malaysia MOH clinical compliance regulations, you can securely export your full medical ledger and historical vital readings into a signed, Portable JSON backup.": "Selaras dengan peraturan pematuhan klinikal KKM Malaysia, anda boleh mengeksport lejar perubatan penuh dan bacaan vital sejarah anda dengan selamat ke dalam sandaran JSON Mudah Alih yang ditandatangani.",
    "Select Clinical Visit Report": "Pilih Laporan Lawatan Klinikal",
    "No completed clinic visits on record.": "Tiada rekod lawatan klinik yang lengkap.",
    "Export Selected Report": "Eksport Laporan Terpilih",
    "Export Full Medical Ledger": "Eksport Lejar Perubatan Penuh",
    "Verify Encryption Cert": "Sahkan Sijil Penyulitan",
    "Medical Identity Index": "Indeks Identiti Perubatan",
    "Registry": "Pendaftaran",
    "National ID": "No. KP / Pasport",
    "DOB & Gender": "Tarikh Lahir & Jantina",
    "Insurance Provider": "Pembekal Insurans",
    "Policy Number": "Nombor Polisi",
    "EHR Sync Status": "Status Sinkronisasi EHR",
    "Secure Portal Logout": "Log Keluar Portal Selamat",
    "None": "Tiada",
    "Male": "Lelaki",
    "Female": "Perempuan",
    "Other": "Lain-lain",
    "Asthma (Mild)": "Asma (Ringan)",
    "Seasonal Rhinitis": "Rinitis Bermusim",
    "Hypertension": "Hipertensi",
    "Diabetes Typ-2": "Diabetes Jenis-2",
    "Patient Feedback": "Maklum Balas Pesakit",
    "We value your input. Share your experience with our services to help us improve patient care. (Maximum 50 words)": "Kami menghargai input anda. Kongsi pengalaman anda dengan perkhidmatan kami untuk membantu kami meningkatkan penjagaan pesakit. (Maksimum 50 patah perkataan)",
    "Write your feedback here...": "Tulis maklum balas anda di sini...",
    "Submit Feedback": "Hantar Maklum Balas",
    "Submitting...": "Menghantar...",
    "Thank you! Your feedback has been submitted successfully.": "Terima kasih! Maklum balas anda telah berjaya dihantar.",
    "words remaining": "perkataan lagi",
    "Word limit reached": "Had perkataan dicapai"
  }
};

export default function UserSettings({ 
  patientProfile, 
  vitals, 
  appointments, 
  onSetScreen, 
  onLogout, 
  onUpdateProfile 
}: UserSettingsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "controls">("profile");

  // Medical Identity Form states
  const [fullName, setFullName] = useState(patientProfile.fullName || "");
  const [myKadOrPassport, setMyKadOrPassport] = useState(patientProfile.myKadOrPassport || "");
  const [dateOfBirth, setDateOfBirth] = useState(patientProfile.dateOfBirth || "");
  const [gender, setGender] = useState(patientProfile.gender || "");
  const [phone, setPhone] = useState(patientProfile.phone || "");
  const [nationality, setNationality] = useState(patientProfile.nationality || "");
  const [bloodType, setBloodType] = useState(patientProfile.bloodType || "");
  const [allergiesStr, setAllergiesStr] = useState((patientProfile.allergies || []).join(", "));
  const [chronicConditions, setChronicConditions] = useState<string[]>(patientProfile.chronicConditions || []);
  const [emergencyContactName, setEmergencyContactName] = useState(patientProfile.emergencyContactName || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(patientProfile.emergencyContactPhone || "");
  const [insuranceProvider, setInsuranceProvider] = useState(patientProfile.insuranceProvider || "");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(patientProfile.insurancePolicyNumber || "");

  // Region Selector
  const [defaultRegion, setDefaultRegion] = useState(() => {
    return patientProfile.defaultRegion || "";
  });

  // Language Selector
  const [language, setLanguage] = useState(() => {
    return patientProfile.language || "English";
  });

  // Synchronize form fields whenever patientProfile updates (e.g. from async backend load)
  useEffect(() => {
    if (patientProfile) {
      setFullName(patientProfile.fullName || "");
      setMyKadOrPassport(patientProfile.myKadOrPassport || "");
      setDateOfBirth(patientProfile.dateOfBirth || "");
      setGender(patientProfile.gender || "");
      setPhone(patientProfile.phone || "");
      setNationality(patientProfile.nationality || "");
      setBloodType(patientProfile.bloodType || "");
      setAllergiesStr((patientProfile.allergies || []).join(", "));
      setChronicConditions(patientProfile.chronicConditions || []);
      setEmergencyContactName(patientProfile.emergencyContactName || "");
      setEmergencyContactPhone(patientProfile.emergencyContactPhone || "");
      setInsuranceProvider(patientProfile.insuranceProvider || "");
      setInsurancePolicyNumber(patientProfile.insurancePolicyNumber || "");
      if (patientProfile.defaultRegion !== undefined) {
        setDefaultRegion(patientProfile.defaultRegion || "");
      }
      if (patientProfile.language !== undefined) {
        setLanguage(patientProfile.language || "English");
      }
    }
  }, [patientProfile]);

  // Forgot Password / Reset Link states
  const [resetStatus, setResetStatus] = useState("");

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [controlsSavedMsg, setControlsSavedMsg] = useState("");


  // Completed Appointments for EHR select-and-export
  const completedAppointments = useMemo(() => {
    return appointments.filter(apt => apt.status === "Completed");
  }, [appointments]);

  const [selectedVisitId, setSelectedVisitId] = useState(completedAppointments[0]?.id || "");

  // Sync selectedVisitId when completedAppointments are loaded
  useEffect(() => {
    if (completedAppointments.length > 0 && !selectedVisitId) {
      setSelectedVisitId(completedAppointments[0].id);
    }
  }, [completedAppointments, selectedVisitId]);

  const t = (key: string) => {
    return translations[language]?.[key] || key;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;

    const allergies = allergiesStr
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const updatedProfile: PatientProfile = {
      ...patientProfile,
      fullName,
      myKadOrPassport,
      dateOfBirth,
      gender,
      phone,
      nationality,
      bloodType,
      allergies,
      chronicConditions,
      insuranceProvider,
      insurancePolicyNumber,
      emergencyContactName,
      emergencyContactPhone
    };

    onUpdateProfile(updatedProfile);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleSendResetEmail = async () => {
    setResetStatus("Sending...");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: patientProfile.email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetStatus("A secure reset link has been sent to your email address. Please check your inbox to verify and change your password.");
      } else {
        setResetStatus(`Error: ${data.error || "Failed to request password reset."}`);
      }
    } catch (err: any) {
      setResetStatus(`Error: Connection error. ${err.message}`);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      profile: patientProfile,
      vitalsIndex: vitals,
      appointmentsHistory: appointments,
      backupTimestamp: new Date().toISOString()
    }, null, 2));
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CarePoint_Secure_Data_Backup_${patientProfile.myKadOrPassport || "EHR"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert("SUCCESS: Secure database profile exported! Check your Downloads folder.");
  };

  const handleExportSingleVisit = () => {
    const apt = appointments.find(a => a.id === selectedVisitId);
    if (!apt) return;
    const matchingVitals = vitals.filter(v => v.timestamp.substring(0, 10) === apt.date);
    
    const reportData = {
      patientEmail: patientProfile.email,
      patientName: patientProfile.fullName,
      visitDetails: {
        id: apt.id,
        doctorName: apt.doctorName,
        specialty: apt.specialty,
        date: apt.date,
        timeSlot: apt.timeSlot,
        clinic: apt.clinic || apt.doctorName,
        symptoms: apt.symptoms,
        clinicalNotes: apt.clinicalNotes || "No clinical notes entered.",
        prescription: apt.prescription || "No prescriptions on this visit."
      },
      matchingVitals: matchingVitals,
      exportTimestamp: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CarePoint_Report_${apt.date}_${apt.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert("SUCCESS: Clinic visit report exported!");
  };

  const toggleCondition = (cond: string) => {
    if (cond === "None") {
      setChronicConditions(["None"]);
    } else {
      const withoutNone = chronicConditions.filter(c => c !== "None");
      const next = withoutNone.includes(cond) 
        ? withoutNone.filter(c => c !== cond) 
        : [...withoutNone, cond];
      setChronicConditions(next.length > 0 ? next : ["None"]);
    }
  };

  return (
    <div id="settings-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-955 tracking-tight">{t("Profile & Security Settings")}</h1>
      </div>

      {/* Tab Navigation Segment */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
            activeTab === "profile" 
              ? "border-b-2 border-teal-650 text-teal-700 font-extrabold" 
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {t("1. System Profile View (Medical Identity)")}
        </button>
        <button
          onClick={() => setActiveTab("controls")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
            activeTab === "controls" 
              ? "border-b-2 border-teal-650 text-teal-700 font-extrabold" 
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {t("2. Account Settings View (System Controls)")}
        </button>
      </div>

      <div className="max-w-4xl space-y-6">
          
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-650" />
                  <span className="font-bold text-slate-900 text-sm">{t("System Profile View (Medical Identity)")}</span>
                </div>
                {showSavedToast && (
                  <span className="text-[10px] font-bold text-emerald-650 bg-emerald-50 px-2.5 py-0.5 rounded-md font-mono animate-pulse">
                    {t("● SYNCED TO DATABASE")}
                  </span>
                )}
              </div>

              {/* Section 1: Personal Profile */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">{t("National Identity")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Full Legal Name")}</label>
                    <input 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("MyKad (IC) / Passport Number")}</label>
                    <input 
                      type="text"
                      value={myKadOrPassport}
                      onChange={(e) => setMyKadOrPassport(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-855 focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Date of Birth")}</label>
                    <input 
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Gender")}</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                    >
                      <option value="">{t("Select Gender")}</option>
                      <option value="Male">{t("Male")}</option>
                      <option value="Female">{t("Female")}</option>
                      <option value="Other">{t("Other")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Primary Contact Number")}</label>
                    <input 
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +60 12-345 6789"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Nationality")}</label>
                    <input 
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      placeholder="e.g. Malaysian"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Email Address")}</label>
                    <input 
                      type="email"
                      value={patientProfile.email || ""}
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Medical Identity */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">{t("Clinical Biometrics")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Blood Type")}</label>
                    <select 
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                    >
                      <option value="">{t("Select Blood Type")}</option>
                      <option value="O+">O Positive (O+)</option>
                      <option value="O-">O Negative (O-)</option>
                      <option value="A+">A Positive (A+)</option>
                      <option value="A-">A Negative (A-)</option>
                      <option value="B+">B Positive (B+)</option>
                      <option value="AB+">AB Positive (AB+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Known Allergies (Comma-separated)")}</label>
                    <input 
                      type="text"
                      value={allergiesStr}
                      onChange={(e) => setAllergiesStr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                      placeholder="e.g. Penicillin, Peanuts"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-2">{t("Chronic Conditions")}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {["Asthma (Mild)", "Seasonal Rhinitis", "Hypertension", "Diabetes Typ-2", "None"].map(cond => {
                        const active = chronicConditions.includes(cond);
                        return (
                          <div 
                            key={cond}
                            onClick={() => toggleCondition(cond)}
                            className={`p-2.5 rounded-xl border text-[11px] font-bold font-mono cursor-pointer transition text-center ${
                              active ? 'border-teal-600 bg-teal-50/20 text-teal-800' : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            {t(cond)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Emergency & Next of Kin */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">{t("Emergency Contact Details (Next of Kin)")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Full Contact Name")}</label>
                    <input 
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="e.g. Next of Kin Full Name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Phone Number & Relation")}</label>
                    <input 
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="e.g. +60 12-345 6789 (Relation)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button 
                  type="submit"
                  className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider"
                >
                  {t("Save Profile Details")}
                </button>
              </div>
            </form>
          )}

          {activeTab === "controls" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Regionalization & Language Presets */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-teal-655" />
                    <span className="font-bold text-slate-900 text-sm">{t("Account Settings View (System Controls)")}</span>
                  </div>
                  {controlsSavedMsg && (
                    <span className="text-[10px] font-bold text-emerald-650 bg-emerald-50 px-2.5 py-0.5 rounded-md font-mono animate-pulse">
                      {controlsSavedMsg}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    {t("Regionalizations & Language Presets")}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <label className="block text-slate-600 mb-1.5">{t("Default Region Portal")}</label>
                      <select 
                        value={defaultRegion}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDefaultRegion(val);
                          localStorage.setItem("carepoint_default_region", val);
                          if (onUpdateProfile) {
                            onUpdateProfile({ ...patientProfile, defaultRegion: val });
                          }
                          setControlsSavedMsg(t("● Settings successfully synchronized!"));
                          setTimeout(() => setControlsSavedMsg(""), 2000);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                      >
                        <option value="">{t("Select Region Portal")}</option>
                        <option value="Penang Island">Penang Island (General)</option>
                        <option value="Penang Island (Bayan Lepas / Main Hospital)">Penang Island (Bayan Lepas / Main Hospital)</option>
                        <option value="Penang Island (Georgetown / Heart & Wellness)">Penang Island (Georgetown / Heart & Wellness)</option>
                        <option value="Penang Island (Bayan Baru / Premier Clinic)">Penang Island (Bayan Baru / Premier Clinic)</option>
                        <option value="Penang Island (Ayer Itam / Specialist Centre)">Penang Island (Ayer Itam / Specialist Centre)</option>
                        <option value="Seberang Perai (Mainland)">Seberang Perai (Mainland Access)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1.5">{t("Primary Language")}</label>
                      <select 
                        value={language}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLanguage(val);
                          localStorage.setItem("carepoint_default_language", val);
                          if (onUpdateProfile) {
                            onUpdateProfile({ ...patientProfile, language: val });
                          }
                          setControlsSavedMsg(t("● Settings successfully synchronized!"));
                          setTimeout(() => setControlsSavedMsg(""), 2000);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                      >
                        <option value="English">English (MOH Standard)</option>
                        <option value="Bahasa Malaysia">Bahasa Malaysia (MySejahtera Node)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forgot Password Reset Form */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-teal-650" />
                    <span className="font-bold text-slate-900 text-sm">{t("Change Password")}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-normal">
                  {t("To change your account password safely, click below to receive a secure validation token link at your registered email address.")}
                </p>

                <div className="flex flex-col gap-3.5">
                  <div className="flex justify-start">
                    <button 
                      type="button"
                      onClick={handleSendResetEmail}
                      className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider"
                    >
                      {resetStatus === "Sending..." ? t("Sending Link...") : t("Send Reset Link to Email")}
                    </button>
                  </div>

                  {resetStatus && (
                    <div className={`p-3.5 rounded-2xl text-xs leading-normal font-sans border ${
                      resetStatus.startsWith("Error") 
                        ? "bg-red-50 border-red-200 text-red-750" 
                        : "bg-teal-50 border-teal-105 text-teal-800"
                    }`}>
                      {t(resetStatus)}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

      </div>
    </div>
  );
}
