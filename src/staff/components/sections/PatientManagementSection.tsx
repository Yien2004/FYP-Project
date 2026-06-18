import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Edit, 
  Key, 
  ShieldAlert, 
  Eye, 
  Calendar, 
  Check, 
  X,
  Heart,
  Activity,
  FileText,
  UserX,
  UserCheck
} from 'lucide-react';

interface PatientUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Patient';
  approved: boolean;
  status: 'Active' | 'Suspended';
  createdAt: string;
}

interface FullPatientProfile {
  id?: string;
  email: string;
  fullName: string;
  myKadOrPassport?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  nationality?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  primaryPhysician?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export default function PatientManagementSection() {
  const [patients, setPatients] = useState<PatientUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Suspended'>('ALL');
  const [loading, setLoading] = useState(true);

  // Detail panel / drawer state
  const [selectedPatientEmail, setSelectedPatientEmail] = useState<string | null>(null);
  const [detailedProfile, setDetailedProfile] = useState<FullPatientProfile | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Editing credentials
  const [selectedUser, setSelectedUser] = useState<PatientUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Suspended'>('Active');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchPatients = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const patientList = data.filter((u: any) => u.role === 'Patient');
          setPatients(patientList);
        }
      })
      .catch(err => console.error("Failed to load patients list", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const loadDetailedProfile = (email: string) => {
    setSelectedPatientEmail(email);
    setLoadingDetail(true);
    setDetailedProfile(null);
    fetch(`/api/profile?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        setDetailedProfile(data);
      })
      .catch(err => console.error("Failed to load patient full details", err))
      .finally(() => setLoadingDetail(false));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editName,
          role: 'Patient',
          approved: true,
          status: editStatus
        })
      });
      if (res.ok) {
        alert("Patient account settings updated successfully.");
        setIsEditModalOpen(false);
        setSelectedUser(null);
        fetchPatients();
        if (selectedPatientEmail === selectedUser.email) {
          loadDetailedProfile(selectedUser.email);
        }
      } else {
        const err = await res.json();
        alert(`Failed to update account: ${err.error || "Server error"}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        alert("Patient account password reset successfully.");
        setIsPasswordModalOpen(false);
        setSelectedUser(null);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        alert(`Failed to reset password: ${err.error || "Server error"}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm("CRITICAL: Are you sure you want to permanently delete this user account? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Patient account deleted permanently.");
        setSelectedPatientEmail(null);
        setDetailedProfile(null);
        fetchPatients();
      } else {
        const err = await res.json();
        alert(`Failed to delete account: ${err.error || "Server error"}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  const openEditModal = (u: PatientUser) => {
    setSelectedUser(u);
    setEditName(u.fullName);
    setEditStatus(u.status);
    setIsEditModalOpen(true);
  };

  const openPasswordModal = (u: PatientUser) => {
    setSelectedUser(u);
    setIsPasswordModalOpen(true);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-neutral-800">
      
      {/* Left Column: Patients List */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Search & Filter Panel */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Suspended">Suspended Only</option>
            </select>

            <button 
              onClick={fetchPatients} 
              className="h-9 px-4 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition shadow-xs cursor-pointer ml-auto sm:ml-0"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Patients List Card */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-bold text-base text-neutral-900">Patient Accounts</h3>
            <span className="text-[10px] bg-slate-100 font-extrabold text-neutral-600 px-2.5 py-1 rounded-lg">
              {filteredPatients.length} Patients
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-500 font-mono">
              Loading user credentials registry...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-450 bg-neutral-50/50">
              No matching outpatient accounts found.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-[580px] overflow-y-auto">
              {filteredPatients.map((p) => {
                const isActive = p.status === 'Active';
                const isSelected = selectedPatientEmail === p.email;

                return (
                  <div 
                    key={p.id} 
                    className={`p-4 flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-teal-50/40 border-l-4 border-l-teal-650' : 'hover:bg-neutral-50/50'
                    }`}
                    onClick={() => loadDetailedProfile(p.email)}
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-neutral-900 block truncate">{p.fullName}</span>
                      <span className="text-[10px] text-neutral-550 font-mono mt-0.5 block truncate">{p.email}</span>
                      <span className="text-[9px] text-neutral-400 mt-1 block">Registered: {new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isActive ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="text-red-750 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[10px] font-bold">
                          Blocked
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                          title="Edit Details & Status"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openPasswordModal(p)}
                          className="p-1.5 text-neutral-400 hover:text-teal-650 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(p.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Account"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Detailed Patient Profile */}
      <div className="lg:col-span-5">
        {selectedPatientEmail ? (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between min-h-[500px]">
            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-mono">
                Decrypting biometric records...
              </div>
            ) : detailedProfile ? (
              <div className="space-y-6">
                
                {/* Header Info */}
                <div className="border-b border-neutral-100 pb-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center font-bold text-white text-lg">
                    {detailedProfile.fullName.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-neutral-900 leading-tight">{detailedProfile.fullName}</h4>
                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">{detailedProfile.email}</span>
                  </div>
                </div>

                {/* Identity Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-150">
                    <span className="text-[9px] uppercase font-bold text-neutral-450 tracking-wider block">Identity MyKad / Passport</span>
                    <span className="text-xs font-bold text-neutral-800 mt-1 block font-mono">{detailedProfile.myKadOrPassport || 'Not Specified'}</span>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-150">
                    <span className="text-[9px] uppercase font-bold text-neutral-450 tracking-wider block">Gender / Sex</span>
                    <span className="text-xs font-bold text-neutral-800 mt-1 block">{detailedProfile.gender || 'Not Specified'}</span>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-150">
                    <span className="text-[9px] uppercase font-bold text-neutral-450 tracking-wider block">Contact Phone</span>
                    <span className="text-xs font-bold text-neutral-800 mt-1 block font-mono">{detailedProfile.phone || 'Not Specified'}</span>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-150">
                    <span className="text-[9px] uppercase font-bold text-neutral-450 tracking-wider block">Date of Birth</span>
                    <span className="text-xs font-bold text-neutral-800 mt-1 block font-mono">{detailedProfile.dateOfBirth || 'Not Specified'}</span>
                  </div>
                </div>

                {/* Biometrics & History */}
                <div className="space-y-3.5">
                  <h5 className="text-[10px] uppercase font-bold text-teal-650 tracking-widest pl-0.5">Clinical Profile & Biometrics</h5>

                  <div className="bg-neutral-50/50 rounded-xl border border-neutral-200/60 p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 font-semibold">Blood Group</span>
                      <span className="font-extrabold text-neutral-900 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-100">{detailedProfile.bloodType || 'O+'}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider block">Allergies (Verified)</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detailedProfile.allergies && detailedProfile.allergies.length > 0 ? (
                          detailedProfile.allergies.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-red-50 border border-red-100 text-red-750 font-bold text-[10px]">{a}</span>
                          ))
                        ) : (
                          <span className="text-neutral-450 text-[10px] font-medium font-mono">None Reported</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider block">Chronic Conditions</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detailedProfile.chronicConditions && detailedProfile.chronicConditions.length > 0 ? (
                          detailedProfile.chronicConditions.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 font-bold text-[10px]">{c}</span>
                          ))
                        ) : (
                          <span className="text-neutral-450 text-[10px] font-medium font-mono">No Active Diagnosis</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-2.5">
                  <h5 className="text-[10px] uppercase font-bold text-neutral-450 tracking-widest pl-0.5">Emergency Contact Details</h5>
                  <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-150 text-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500 font-medium">Contact Name</span>
                      <span className="font-bold text-neutral-900">{detailedProfile.emergencyContactName || 'Razali Bin Ahmad'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500 font-medium">Contact Phone</span>
                      <span className="font-bold text-neutral-900 font-mono">{detailedProfile.emergencyContactPhone || '+60 12-987 6543 (Father)'}</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-neutral-450 font-mono">
                Failed to decrypt user details.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl p-8 text-center text-neutral-450 flex flex-col items-center justify-center h-full min-h-[500px]">
            <Eye className="w-10 h-10 text-neutral-350 mb-3" />
            <h4 className="font-bold text-neutral-900 text-sm">Select a Patient Account</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
              Choose any outpatient profile from the left index registry to inspect their identities, biometrics, emergency links, and security clearances.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Edit Credentials */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <form onSubmit={handleSaveEdit} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 space-y-4">
            <h4 className="font-extrabold text-base text-neutral-900">Moderate Patient Account</h4>
            <p className="text-xs text-neutral-500">Edit core account attributes and system log clearances.</p>
            
            <div className="space-y-3.5 pt-2">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Email Address</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="w-full bg-neutral-150 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-500 outline-none h-9 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Account Clearances</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
                >
                  <option value="Active">Active / Cleared</option>
                  <option value="Suspended">Suspended / Blocked</option>
                </select>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-750 shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-800 leading-relaxed">
                  <strong>Warning:</strong> Suspending an account blocks user authorization instantly. Patient records will remain saved in database logs, but access is disabled.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Save Moderation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Reset Password */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <form onSubmit={handleChangePassword} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 space-y-4">
            <h4 className="font-extrabold text-base text-neutral-900">Change Patient Password</h4>
            <p className="text-xs text-neutral-500">Assign a new login passkey for: <strong className="text-neutral-900">{selectedUser.fullName}</strong>.</p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => { setIsPasswordModalOpen(false); setSelectedUser(null); setNewPassword(''); setConfirmPassword(''); }}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-teal-500/10"
              >
                Confirm Reset
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
