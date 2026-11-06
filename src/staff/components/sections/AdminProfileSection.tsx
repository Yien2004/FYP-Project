import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Key,
  Loader2
} from 'lucide-react';

interface AdminProfileSectionProps {
  userName: string;
  userEmail: string;
  onUpdateProfile: (name: string, email: string) => void;
}

interface AdminDetails {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  status: string;
  approved: boolean;
}

export default function AdminProfileSection({
  userName,
  userEmail,
  onUpdateProfile
}: AdminProfileSectionProps) {
  const [adminDetails, setAdminDetails] = useState<AdminDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Profile states
  const [profileName, setProfileName] = useState(userName);
  const [profileEmail, setProfileEmail] = useState(userEmail);

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

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

  // Fetch admin user object from the API to get ID and creation date
  const fetchAdminDetails = () => {
    setLoadingDetails(true);
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const matched = data.find((u: any) => u.email.toLowerCase() === userEmail.toLowerCase());
          if (matched) {
            setAdminDetails(matched);
            const resolvedName = matched.email.toLowerCase() === 'pantaipenangadmin@gmail.com' || matched.fullName === 'Main Hospital Admin'
              ? 'Main Pantai Hospital Penang Admin'
              : matched.fullName;
            setProfileName(resolvedName);
            setProfileEmail(matched.email);
          }
        }
      })
      .catch((err) => console.error('Failed to resolve admin account details', err))
      .finally(() => setLoadingDetails(false));
  };

  useEffect(() => {
    fetchAdminDetails();
  }, [userEmail]);

  const handleChangePassword = async (e: React.FormEvent) => {
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

    setPwSubmitting(true);

    try {
      const targetId = adminDetails?.id;
      const res = targetId
        ? await fetch(`/api/admin/users/${targetId}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
          })
        : await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, newPassword })
          });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Password update failed.');
      }

      setPwSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setVerificationCode('');
      setVerificationSent(false);
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err: any) {
      setPwError(err.message || 'Something went wrong updating password.');
    } finally {
      setPwSubmitting(false);
    }
  };

  const cardBase = 'bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs animate-fadeIn';
  const labelClass = 'text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5';
  const inputClass = 'w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-850 outline-none focus:bg-white focus:ring-1 focus:ring-sky-400 h-9';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-neutral-800">
      
      {/* LEFT COLUMN: IDENTITY PROFILE CARD & SUMMARY */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Profile Card Summary */}
        <div className={`${cardBase} flex flex-col items-center text-center`}>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg mb-4 select-none">
            {userName ? userName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() : 'AD'}
          </div>
          <h4 className="font-bold text-base text-neutral-900">{profileName || userName || 'Main Pantai Hospital Penang Admin'}</h4>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 mt-1 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-full">
            {adminDetails?.role || 'Administrator'}
          </span>

          <div className="w-full mt-6 pt-5 border-t border-neutral-100 space-y-3.5 text-left">
            <div className="flex items-center gap-2.5 text-xs text-neutral-600">
              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{userEmail}</span>
            </div>
            
            <div className="flex items-center gap-2.5 text-xs text-neutral-600">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">
                Registered: {adminDetails ? new Date(adminDetails.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: EDIT FORMS */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Card: Edit Profile */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
            <User className="w-4.5 h-4.5 text-sky-600" />
            <h3 className="font-bold text-sm text-neutral-900">Administrator Profile Details</h3>
          </div>

          {loadingDetails ? (
            <div className="py-6 text-center text-xs text-neutral-450 font-mono">
              Resolving database identity details...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Administrator Full Name</label>
                  <input
                    type="text"
                    value={profileName || 'Main Pantai Hospital Penang Admin'}
                    disabled
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-600 outline-none h-9 cursor-not-allowed select-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Login Email Address</label>
                  <input
                    type="email"
                    value={profileEmail || userEmail}
                    disabled
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-600 outline-none h-9 cursor-not-allowed select-none font-medium"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card: Change Password */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
            <Lock className="w-4.5 h-4.5 text-teal-600" />
            <h3 className="font-bold text-sm text-neutral-900">Change Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {!verificationSent ? (
              <div className="flex flex-col sm:flex-row items-end gap-3 max-w-xl">
                <div className="space-y-1 flex-1 w-full">
                  <label className={labelClass}>Verification Email</label>
                  <input
                    type="email"
                    value={userEmail}
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
                      placeholder="123456"
                      className={inputClass}
                      required
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
                      required
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
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={pwSubmitting}
                    className="bg-teal-600 border border-teal-700 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer h-9"
                  >
                    {pwSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Key className="w-3.5 h-3.5" />
                    )}
                    {pwSubmitting ? 'Updating Password...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVerificationSent(false); setPwError(''); }}
                    className="text-xs text-neutral-500 hover:text-neutral-800 px-3 py-2 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {pwError && (
              <div className="text-[11px] text-red-700 bg-red-50 border border-red-100 p-2.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {pwError}
              </div>
            )}

            {pwSuccess && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {pwSuccess}
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
