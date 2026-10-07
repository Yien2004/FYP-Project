import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  Volume2,
  LayoutDashboard,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  Building2,
  ChevronDown,
  HelpCircle,
  Phone,
  FileText
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Clinic resolver – maps email suffix to clinic name
   ────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────
   Helper: extract initials
   ────────────────────────────────────────────── */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SJ';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface StaffSettingsProps {
  language?: string;
  setLanguage?: (lang: string) => void;
}

export default function StaffSettings({ language, setLanguage }: StaffSettingsProps) {
  // Load values from localStorage or fallback
  const staffName = localStorage.getItem('lifelink_user_name') || 'Dr. Sarah Jenkins';
  const staffEmail = localStorage.getItem('lifelink_user_email') || 'doctor@hospital.com';
  const staffRole = localStorage.getItem('lifelink_user_role') || 'Doctor';
  const clinicName = getClinicFromEmail(staffEmail);

  // ── 1. EDIT PROFILE STATES ──
  const [profileName, setProfileName] = useState(staffName);
  const [profileEmail, setProfileEmail] = useState(staffEmail);
  const [profileRole, setProfileRole] = useState(() => {
    return (staffRole === 'Nurse' || staffRole === 'Clinic Assistant') ? staffRole : 'Nurse';
  });
  const [profileClinic, setProfileClinic] = useState(clinicName || 'Pantai Hospital Penang');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Clinic to email mapping
  const clinicEmails: Record<string, string> = {
    'Hospital Pulau Pinang': 'hospitalpulaupinang@gmail.com',
    'Hospital Seberang Jaya': 'hospitalseberangjaya@gmail.com',
    'Klinik Kesihatan Jalan Perak': 'kkjalanperak@gmail.com',
    'Klinik Kesihatan Bayan Baru': 'kkbayanbaru@gmail.com',
    'Hospital Bukit Mertajam': 'hospitalbukitmertajam@gmail.com',
    'Pantai Hospital Penang': 'pantaihospital@gmail.com',
    'Hospital Lam Wah Ee': 'lamwahee@gmail.com',
    'Gleneagles Hospital Penang': 'gleneagleshospital@gmail.com',
    'Island Hospital': 'islandhospital@gmail.com',
    'Penang Adventist Hospital': 'penangadventisthospital@gmail.com',
    'Loh Guan Lye Specialists Centre': 'lohguanlye@gmail.com',
    'KPJ Penang Specialist Hospital': 'kpjpenang@gmail.com',
    'O2 Klinik': 'o2klinik@gmail.com',
    'Klinik Singapore': 'kliniksingapore@gmail.com',
    'Poliklinik Perdana': 'poliklinikperdana@gmail.com',
  };

  const handleClinicChange = (clinic: string) => {
    setProfileClinic(clinic);
    if (clinicEmails[clinic]) {
      setProfileEmail(clinicEmails[clinic]);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('lifelink_user_name', profileName);
    localStorage.setItem('lifelink_user_email', profileEmail);
    localStorage.setItem('lifelink_user_role', profileRole);
    
    setProfileSuccess('Clinical profile updated successfully!');
    setTimeout(() => {
      setProfileSuccess('');
      window.location.reload(); // Refresh the app to update the name/initials in the sidebar
    }, 1500);
  };

  // ── 2. CHANGE PASSWORD STATES ──
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);

  const handleSendVerificationCode = () => {
    setVerificationLoading(true);
    setPwSuccess('');
    setPwError('');
    setTimeout(() => {
      setVerificationSent(true);
      setVerificationLoading(false);
      setPwSuccess('Verification code sent to your registered email! (Use code: 123456)');
    }, 1200);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess('');
    setPwError('');

    if (!verificationSent) {
      setPwError('Please request and verify an email code first.');
      return;
    }
    if (verificationCode !== '123456') {
      setPwError('Invalid verification code. Please check code or try again.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setPwError('All password fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staffEmail, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Password change failed.');
      }

      setPwSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setVerificationCode('');
      setVerificationSent(false);
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err: any) {
      setPwError(err.message || 'Something went wrong.');
      setTimeout(() => setPwError(''), 4000);
    } finally {
      setPwLoading(false);
    }
  };

  // ── 3. HELP CENTER / SUPPORT TICKET STATES ──
  const [ticketCategory, setTicketCategory] = useState('System Bug');
  const [ticketSeverity, setTicketSeverity] = useState('Medium');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState('');
  const [ticketError, setTicketError] = useState('');

  const handleSupportTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSuccess('');
    setTicketError('');

    if (!ticketSubject || !ticketDescription) {
      setTicketError('Please fill out the ticket subject and description.');
      return;
    }

    setTicketLoading(true);
    try {
      const ticketMessage = `[SUPPORT TICKET] From ${staffName} (${staffEmail}) | Clinic: ${clinicName} | Category: ${ticketCategory} | Severity: ${ticketSeverity} | Subject: ${ticketSubject} | Description: ${ticketDescription}`;
      
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: ticketMessage,
          level: ticketSeverity === 'Critical' ? 'error' : 'warning',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit ticket. Please try again.');
      }

      setTicketSuccess('Your system problem report has been submitted to the admin successfully.');
      setTicketSubject('');
      setTicketDescription('');
      setTimeout(() => setTicketSuccess(''), 5000);
    } catch (err: any) {
      setTicketError(err.message || 'Something went wrong.');
    } finally {
      setTicketLoading(false);
    }
  };

  /* ───────── Shared class tokens ───────── */
  const cardBase = 'bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs animate-fadeIn';
  const labelClass = 'text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5';
  const inputClass = 'w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9';
  const selectClass = 'w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 appearance-none';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-neutral-800">
      
      {/* ========================================================
          LEFT PANEL: CLINICAL PROFILE & IDENTITY INFO
          ======================================================== */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Profile Card Summary */}
        <div className={`${cardBase} flex flex-col items-center text-center`}>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg mb-4 select-none">
            {getInitials(staffName)}
          </div>
          <h4 className="font-bold text-base text-neutral-900">{staffName}</h4>

          <div className="w-full mt-6 pt-5 border-t border-neutral-100 space-y-3.5 text-left">
            <div className="flex items-center gap-2.5 text-xs text-neutral-600">
              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{staffEmail}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-neutral-600">
              <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{clinicName || 'General Staff'}</span>
            </div>

          </div>
        </div>

        {/* Edit Profile Information Form */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-neutral-900">Edit Profile</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1">
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={inputClass}
                placeholder="Dr. Sarah Jenkins"
                required
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Clinical Role</label>
              <div className="relative">
                <select
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className={selectClass}
                >
                  <option value="Nurse">Nurse</option>
                  <option value="Clinic Assistant">Clinic Assistant</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Associated Clinic</label>
              <div className="relative">
                <select
                  value={profileClinic}
                  onChange={(e) => handleClinicChange(e.target.value)}
                  className={selectClass}
                >
                  {Object.keys(clinicEmails).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                * Choosing a clinic updates your clinical account email mapping automatically.
              </p>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                value={profileEmail}
                readOnly
                className={`${inputClass} opacity-70 bg-neutral-100 cursor-not-allowed`}
              />
            </div>

            {profileSuccess && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {profileSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-teal-600 border border-teal-700 hover:bg-teal-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer h-9"
            >
              <Save className="w-3.5 h-3.5" />
              Save Profile Info
            </button>
          </form>
        </div>

      </div>

      {/* ========================================================
          RIGHT PANEL: SECURITY, PREFERENCES, NOTIFICATIONS, SUPPORT
          ======================================================== */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Change Password Card */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-neutral-900">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {!verificationSent ? (
              <div className="flex flex-col sm:flex-row items-end gap-3 max-w-xl">
                <div className="space-y-1 flex-1 w-full">
                  <label className={labelClass}>Verification Email</label>
                  <input
                    type="email"
                    value={staffEmail}
                    disabled
                    className={`${inputClass} opacity-60 cursor-not-allowed font-medium`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={verificationLoading}
                  className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 disabled:opacity-60 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer h-9 shrink-0"
                >
                  {verificationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {verificationLoading ? 'Sending…' : 'Send Verification'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className={labelClass}>Verification Code</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={labelClass}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={labelClass}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="bg-teal-600 border border-teal-700 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    {pwLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    {pwLoading ? 'Updating…' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationSent(false);
                      setVerificationCode('');
                    }}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {pwError && (
              <div className="flex items-center gap-2 text-[11px] text-red-700 bg-red-50 border border-red-100 p-2.5 rounded-lg max-w-xl">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg max-w-xl">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {pwSuccess}
              </div>
            )}
          </form>
        </div>

        {/* Help Center & Customer Support Ticket Form */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-neutral-900">Help Center & Support Ticket</h3>
          </div>

          <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
            Report any clinical module issues, hardware connection faults, or system problems directly to the system administrator.
          </p>

          <form onSubmit={handleSupportTicketSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1">
                <label className={labelClass}>Problem Category</label>
                <div className="relative">
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className={selectClass}
                  >
                    <option value="System Bug">System Bug</option>
                    <option value="UI Layout Error">UI Layout Error</option>
                    <option value="Account Access / Password">Account Access / Password</option>
                    <option value="Patient Telemetry Sync Fault">Patient Telemetry Sync Fault</option>
                    <option value="Prescription Dispatch Bug">Prescription Dispatch Bug</option>
                    <option value="Other System Problem">Other System Problem</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Severity */}
              <div className="space-y-1">
                <label className={labelClass}>Problem Severity</label>
                <div className="relative">
                  <select
                    value={ticketSeverity}
                    onChange={(e) => setTicketSeverity(e.target.value)}
                    className={selectClass}
                  >
                    <option value="Low">Low - Cosmetic Issue</option>
                    <option value="Medium">Medium - Module Bug</option>
                    <option value="Critical">Critical - System Blocker</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className={labelClass}>Ticket Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of the occurred problem"
                className={inputClass}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className={labelClass}>Detailed Description</label>
              <textarea
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="Explain the system problem, what you were doing when it occurred, and any diagnostic details..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 min-h-[80px]"
                required
              />
            </div>

            {ticketError && (
              <div className="flex items-center gap-2 text-[11px] text-red-700 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {ticketError}
              </div>
            )}

            {ticketSuccess && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {ticketSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={ticketLoading}
              className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 disabled:opacity-65 text-white text-xs font-bold py-2 px-5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer h-9"
            >
              {ticketLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              {ticketLoading ? 'Submitting Ticket…' : 'Send Ticket to Admin'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
