import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Key
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

  // Profile forms states
  const [profileName, setProfileName] = useState(userName);
  const [profileEmail, setProfileEmail] = useState(userEmail);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

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
            setProfileName(matched.fullName);
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminDetails) {
      setProfileError('Admin account information not resolved.');
      return;
    }
    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError('Name and Email are required.');
      return;
    }

    setProfileSuccess('');
    setProfileError('');
    setProfileSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${adminDetails.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileName,
          email: profileEmail,
          role: adminDetails.role,
          approved: adminDetails.approved,
          status: adminDetails.status
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update profile.');
      }

      onUpdateProfile(profileName, profileEmail);
      setProfileSuccess('Administrative credentials updated successfully!');
      
      // Update local details object state
      setAdminDetails(prev => prev ? { ...prev, fullName: profileName, email: profileEmail } : null);
      
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Something went wrong updating profile.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminDetails) {
      setPwError('Admin account information not resolved.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setPwError('All password fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    setPwSuccess('');
    setPwError('');
    setPwSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${adminDetails.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to change password.');
      }

      setPwSuccess('Administrative access password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err: any) {
      setPwError(err.message || 'Something went wrong resetting password.');
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
          <h4 className="font-bold text-base text-neutral-900">{userName || 'System Administrator'}</h4>
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

            <div className="flex items-center gap-2.5 text-xs text-neutral-600">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="truncate font-mono text-[9px] text-neutral-500 bg-neutral-50 border border-neutral-200/60 px-2 py-0.5 rounded">
                UUID: {adminDetails?.id || 'fetching...'}
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
            <h3 className="font-bold text-sm text-neutral-900">Edit Administrator Profile</h3>
          </div>

          {loadingDetails ? (
            <div className="py-6 text-center text-xs text-neutral-450 font-mono">
              Resolving database identity details...
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Administrator Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Login Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {profileError && (
                <div className="text-[11px] text-red-700 bg-red-50 border border-red-100 p-2.5 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {profileSuccess}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-neutral-100">
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer h-9"
                >
                  {profileSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {profileSubmitting ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Card: Change Password */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
            <Lock className="w-4.5 h-4.5 text-sky-600" />
            <h3 className="font-bold text-sm text-neutral-900">Change Admin Access Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Define New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Confirm New Password</label>
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

            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                type="submit"
                disabled={pwSubmitting}
                className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 disabled:opacity-60 text-white text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer h-9"
              >
                {pwSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Key className="w-3.5 h-3.5" />
                )}
                {pwSubmitting ? 'Updating Password...' : 'Update Access Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
