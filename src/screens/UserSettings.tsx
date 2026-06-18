import React, { useState, useEffect, useMemo } from "react";
import { 
  Sliders, 
  ShieldCheck, 
  Database, 
  Globe, 
  Bell, 
  Download, 
  User,
  Lock,
  Info,
  MessageSquare,
  Send,
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
  const [gender, setGender] = useState(patientProfile.gender || "Male");
  const [phone, setPhone] = useState(patientProfile.phone || "");
  const [nationality, setNationality] = useState(patientProfile.nationality || "Malaysian");
  const [bloodType, setBloodType] = useState(patientProfile.bloodType || "O+");
  const [allergiesStr, setAllergiesStr] = useState((patientProfile.allergies || []).join(", "));
  const [chronicConditions, setChronicConditions] = useState<string[]>(patientProfile.chronicConditions || []);
  const [emergencyContactName, setEmergencyContactName] = useState(patientProfile.emergencyContactName || "Razali Bin Ahmad");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(patientProfile.emergencyContactPhone || "+60 12-987 6543 (Father)");
  const [insuranceProvider, setInsuranceProvider] = useState(patientProfile.insuranceProvider || "Allianz Health Malaysia");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(patientProfile.insurancePolicyNumber || "ALZ-88942-004");
  
  // Notification Prefs
  const [emailAlerts, setEmailAlerts] = useState(() => {
    return patientProfile.emailAlerts !== false && localStorage.getItem("carepoint_email_alerts") !== "false";
  });
  const [smsAlerts, setSmsAlerts] = useState(() => {
    return patientProfile.smsAlerts !== false && localStorage.getItem("carepoint_sms_alerts") !== "false";
  });
  const [inAppAlerts, setInAppAlerts] = useState(() => {
    return patientProfile.inAppAlerts !== false && localStorage.getItem("carepoint_in_app_alerts") !== "false";
  });

  // Region Selector
  const [defaultRegion, setDefaultRegion] = useState(() => {
    return patientProfile.defaultRegion || localStorage.getItem("carepoint_default_region") || "Penang Island";
  });

  // Language Selector
  const [language, setLanguage] = useState(() => {
    return patientProfile.language || localStorage.getItem("carepoint_default_language") || "English";
  });

  // Forgot Password / Reset Link states
  const [resetStatus, setResetStatus] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [controlsSavedMsg, setControlsSavedMsg] = useState("");

  // Feedback state
  const MAX_FEEDBACK_WORDS = 50;
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"" | "sending" | "sent">("");

  const feedbackWordCount = useMemo(() => {
    const trimmed = feedbackText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [feedbackText]);

  const feedbackWordsRemaining = MAX_FEEDBACK_WORDS - feedbackWordCount;

  const handleFeedbackChange = (val: string) => {
    const words = val.trim().split(/\s+/);
    if (val.trim() === "" || words.length <= MAX_FEEDBACK_WORDS) {
      setFeedbackText(val);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || feedbackStatus === "sending") return;
    setFeedbackStatus("sending");
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "patient_feedback",
          patientEmail: patientProfile.email,
          patientName: patientProfile.fullName,
          feedback: feedbackText.trim(),
          timestamp: new Date().toISOString()
        })
      });
    } catch { /* best-effort */ }
    // Persist locally
    const prev = JSON.parse(localStorage.getItem("carepoint_feedback_history") || "[]");
    prev.push({ text: feedbackText.trim(), date: new Date().toISOString() });
    localStorage.setItem("carepoint_feedback_history", JSON.stringify(prev));
    setFeedbackStatus("sent");
    setTimeout(() => {
      setFeedbackText("");
      setFeedbackStatus("");
    }, 3000);
  };

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

  const handleSaveControls = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("carepoint_email_alerts", String(emailAlerts));
    localStorage.setItem("carepoint_sms_alerts", String(smsAlerts));
    localStorage.setItem("carepoint_in_app_alerts", String(inAppAlerts));
    localStorage.setItem("carepoint_default_region", defaultRegion);
    localStorage.setItem("carepoint_default_language", language);

    if (onUpdateProfile) {
      onUpdateProfile({
        ...patientProfile,
        language,
        defaultRegion,
        emailAlerts,
        smsAlerts,
        inAppAlerts
      });
    }
    
    setControlsSavedMsg(t("● Settings successfully synchronized!"));
    setTimeout(() => setControlsSavedMsg(""), 2500);
  };

  const handleSendResetEmail = async () => {
    setResetStatus("Sending...");
    setDevResetUrl("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: patientProfile.email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetStatus("A secure reset link has been sent to your email. Please check your inbox (or use the dev link below) to verify and change your password.");
        if (data.resetUrl) {
          setDevResetUrl(data.resetUrl);
        }
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
        <p className="text-sm text-slate-500 mt-1">
          {t("Maintain your universal medical authentication identity, verify insurance policies, and configure account access controls.")}
        </p>
      </div>

      {/* Tab Navigation Segment */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            activeTab === "profile" 
              ? "border-b-2 border-teal-650 text-teal-700 font-extrabold" 
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {t("1. System Profile View (Medical Identity)")}
        </button>
        <button
          onClick={() => setActiveTab("controls")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            activeTab === "controls" 
              ? "border-b-2 border-teal-650 text-teal-700 font-extrabold" 
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {t("2. Account Settings View (System Controls)")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Content according to the active tab */}
        <div className="lg:col-span-8 space-y-6">
          
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-850 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5">{t("Phone Number & Relation")}</label>
                    <input 
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
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
              
              {/* Account controls form */}
              <form onSubmit={handleSaveControls} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
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

                {/* Regionalization & Visuals */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> {t("Regionalizations & Language Presets")}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <label className="block text-slate-600 mb-1.5">{t("Default Region Portal")}</label>
                      <select 
                        value={defaultRegion}
                        onChange={(e) => setDefaultRegion(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="Penang Island">Penang Island</option>
                        <option value="Seberang Perai (Mainland)">Seberang Perai (Mainland)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1.5">{t("Primary Language")}</label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="English">English (MOH Standard)</option>
                        <option value="Bahasa Malaysia">Bahasa Malaysia (MySejahtera Node)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-4 h-4" /> {t("Notification Alerts Preferences")}
                  </h3>
                  
                  <div className="space-y-4 text-xs font-semibold">
                    {/* Switch 1: In App Vitals alerts */}
                    <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-800 block">{t("Biometric Vitals Push Alerts")}</span>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">{t("Push notification alerts to log daily values and clinical checking.")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInAppAlerts(!inAppAlerts)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          inAppAlerts ? 'bg-teal-600' : 'bg-slate-250'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            inAppAlerts ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Switch 2: SMS alerts */}
                    <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-800 block">{t("Medications Refill SMS Reminders")}</span>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">{t("Transmit SMS reminders when Ventolin Rx refilling bounds need renew.")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSmsAlerts(!smsAlerts)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          smsAlerts ? 'bg-teal-600' : 'bg-slate-250'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            smsAlerts ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Switch 3: Email alerts */}
                    <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-800 block">{t("EHR Lab Results Email Triggers")}</span>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">{t("Secure diagnostic pdf copy dispatched directly to registered address.")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEmailAlerts(!emailAlerts)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          emailAlerts ? 'bg-teal-600' : 'bg-slate-250'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            emailAlerts ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider"
                  >
                    {t("Save System Settings")}
                  </button>
                </div>
              </form>

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

                  {devResetUrl && (
                    <div className="bg-amber-50/50 border border-amber-250 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-800 font-extrabold">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Developer Sandbox Reset Link</span>
                      </div>
                      <p className="text-slate-650 text-[11px] leading-relaxed">
                        Click the link below to bypass SMTP and open the CarePoint verification router:
                      </p>
                      <a 
                        href={devResetUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-mono text-[10px] text-teal-700 hover:text-teal-900 underline block break-all"
                      >
                        {devResetUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Feedback Section */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-teal-650" />
                    <span className="font-bold text-slate-900 text-sm">{t("Patient Feedback")}</span>
                  </div>
                  {feedbackStatus === "sent" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-650 bg-emerald-50 px-2.5 py-0.5 rounded-md animate-pulse">
                      <CheckCircle2 className="w-3 h-3" />
                      Submitted
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {t("We value your input. Share your experience with our services to help us improve patient care. (Maximum 50 words)")}
                </p>

                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => handleFeedbackChange(e.target.value)}
                      placeholder={t("Write your feedback here...")}
                      disabled={feedbackStatus === "sent"}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 focus:outline-none focus:border-teal-500 resize-none transition disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-350"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        feedbackWordsRemaining <= 0
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : feedbackWordsRemaining <= 10
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-slate-100 text-slate-400 border border-slate-150'
                      }`}>
                        {feedbackWordsRemaining <= 0
                          ? t("Word limit reached")
                          : `${feedbackWordsRemaining} ${t("words remaining")}`
                        }
                      </span>
                    </div>
                  </div>

                  {feedbackStatus === "sent" ? (
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{t("Thank you! Your feedback has been submitted successfully.")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {feedbackWordCount} / {MAX_FEEDBACK_WORDS} words
                      </span>
                      <button
                        type="button"
                        disabled={!feedbackText.trim() || feedbackStatus === "sending"}
                        onClick={handleSubmitFeedback}
                        className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-5 rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {feedbackStatus === "sending" ? t("Submitting...") : t("Submit Feedback")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Profile Summary preview card (always visible) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 sticky top-24">
          <h4 className="font-bold text-slate-955 text-xs uppercase tracking-wider text-center border-b border-slate-100 pb-2">{t("Medical Identity Index")}</h4>

          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold font-serif text-3xl mx-auto border-2 border-teal-100 shadow shadow-teal-500/10">
              {fullName ? fullName[0] : "P"}
            </div>

            <div>
              <span className="font-extrabold text-slate-900 text-sm block leading-tight">{fullName || patientProfile.fullName}</span>
              <span className="text-[10px] text-slate-450 font-mono block mt-1">{t("Registry")}: {myKadOrPassport || patientProfile.myKadOrPassport}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2.5 text-xs text-slate-600 font-medium">
            <div className="flex justify-between">
              <span>{t("National ID")}</span>
              <span className="font-bold font-mono text-slate-900">{myKadOrPassport || patientProfile.myKadOrPassport}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("DOB & Gender")}</span>
              <span className="font-bold text-slate-900">{dateOfBirth || "N/A"} ({t(gender)})</span>
            </div>
            <div className="flex justify-between">
              <span>{t("Blood Type")}</span>
              <span className="font-bold text-slate-900 font-mono">{bloodType}</span>
            </div>

            <div className="flex justify-between">
              <span>{t("EHR Sync Status")}</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">ENCRYPT_OK</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button 
              onClick={onLogout}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 rounded-xl transition text-center uppercase tracking-wider cursor-pointer"
            >
              {t("Secure Portal Logout")}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
