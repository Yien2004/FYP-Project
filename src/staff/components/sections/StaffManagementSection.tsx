import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Edit, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Doctor' | 'Nurse' | 'Admin';
  approved: boolean;
  status: 'Active' | 'Suspended';
  createdAt: string;
}

export default function StaffManagementSection() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Doctor' | 'Nurse'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Suspended' | 'Pending'>('ALL');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/appointments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(err => console.warn("Failed to load appointments for stats", err));
  }, []);

  // Modals / forms states
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'Doctor' | 'Nurse'>('Doctor');
  const [editStatus, setEditStatus] = useState<'Active' | 'Suspended'>('Active');
  const [editApproved, setEditApproved] = useState(true);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter only staff roles (Doctor, Nurse)
          const staff = data.filter((u: any) => u.role === 'Doctor' || u.role === 'Nurse');
          setUsers(staff);
        }
      })
      .catch(err => console.error("Failed to load staff users", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve this staff registration?")) return;
    try {
      const res = await fetch(`/api/admin/staff-requests/${id}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        alert("Staff registration approved successfully!");
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`Failed to approve: ${err.error || "Server error"}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject and delete this registration request?")) return;
    try {
      const res = await fetch(`/api/admin/staff-requests/${id}/reject`, {
        method: "POST"
      });
      if (res.ok) {
        alert("Staff registration rejected.");
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`Failed to reject: ${err.error || "Server error"}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    }
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
          role: editRole,
          approved: editApproved,
          status: editStatus
        })
      });
      if (res.ok) {
        alert("Staff account settings updated successfully.");
        setIsEditModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
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
        alert("Staff account password changed successfully.");
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

  const openEditModal = (u: StaffUser) => {
    setSelectedUser(u);
    setEditName(u.fullName);
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditApproved(u.approved);
    setIsEditModalOpen(true);
  };

  const openPasswordModal = (u: StaffUser) => {
    setSelectedUser(u);
    setIsPasswordModalOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Active') matchesStatus = u.approved && u.status === 'Active';
    else if (statusFilter === 'Suspended') matchesStatus = u.approved && u.status === 'Suspended';
    else if (statusFilter === 'Pending') matchesStatus = !u.approved;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = React.useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (a.approved !== b.approved) {
        return a.approved ? 1 : -1; // unapproved first
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }, [filteredUsers]);

  const bookingsCount = React.useMemo(() => {
    if (!selectedUser) return 0;
    return appointments.filter(ap => 
      (ap.doctorName || '').toLowerCase().trim() === selectedUser.fullName.toLowerCase().trim()
    ).length;
  }, [selectedUser, appointments]);

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Search and Filter Panel */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff email, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="Doctor">Doctors</option>
            <option value="Nurse">Nurses</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Accounts</option>
            <option value="Suspended">Suspended Accounts</option>
            <option value="Pending">Pending Approval</option>
          </select>

          <button 
            onClick={fetchUsers} 
            className="h-9 px-4 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Main Staff Registry Table */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Clinician & Staff Registry</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Manage permissions, verification tokens, password dispatching, and block listings.</p>
          </div>
          <span className="text-xs bg-slate-100 font-extrabold text-neutral-700 px-3 py-1 rounded-xl">
            {sortedUsers.length} Members
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-500 font-mono">
            Fetching secure directory credentials...
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-450 bg-neutral-50/50">
            No matching staff records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200/60 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  <th className="py-4.5 px-6">Staff Member</th>
                  <th className="py-4.5 px-6">Clinical Role</th>
                  <th className="py-4.5 px-6">Verification Status</th>
                  <th className="py-4.5 px-6">Active Status</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-medium">
                {sortedUsers.map((u) => {
                  const roleBadge = u.role === 'Admin' 
                    ? 'bg-neutral-900 border border-neutral-800 text-white' 
                    : u.role === 'Doctor'
                      ? 'bg-teal-50 border border-teal-200/60 text-teal-800'
                      : 'bg-sky-50 border border-sky-200/60 text-sky-800';

                  return (
                    <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-800">
                            {u.fullName.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 block">{u.fullName}</span>
                            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${roleBadge}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.approved ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Approved
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {u.approved ? (
                          u.status === 'Active' ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          ) : (
                            <span className="text-red-750 bg-red-50 px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Suspended
                            </span>
                          )
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {!u.approved ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(u.id)}
                              className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-lg font-bold text-xs transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                              title="Edit Credentials"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openPasswordModal(u)}
                              className="p-1.5 text-neutral-500 hover:text-teal-650 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Modal: Edit Credentials */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <form onSubmit={handleSaveEdit} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 space-y-4">
            <h4 className="font-extrabold text-base text-neutral-900">Edit Staff Account</h4>
            <p className="text-xs text-neutral-500">Modify credentials and active system clearances for clinical staff member.</p>
            
            <div className="space-y-3.5 pt-2">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Email Address (Read-only)</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Clinical Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="font-semibold">Total Consults Handled:</span>
                  <span className="font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200/60 shadow-2xs">
                    {bookingsCount} Bookings
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="font-semibold">Supabase Password:</span>
                  <span className="font-mono text-[10px] text-teal-800 bg-white px-2 py-0.5 rounded border border-neutral-200/60 shadow-2xs">
                    [Argon2id/Bcrypt Secured]
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="font-semibold">Authentication UID:</span>
                  <span className="font-mono text-[9px] text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200/60 shadow-2xs">
                    {selectedUser.id}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50/45 border border-amber-200/60 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">
                  <strong>Warning:</strong> Suspending an account will immediately block this user from logging into the clinician dashboards. Password decryption is prevented by Supabase Auth security; use the reset dispatch key if they forgot it.
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
                Save Updates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Reset Password */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <form onSubmit={handleChangePassword} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 space-y-4">
            <h4 className="font-extrabold text-base text-neutral-900">Change Staff Password</h4>
            <p className="text-xs text-neutral-500">Dispatch a new credential passkey for staff: <strong className="text-neutral-900">{selectedUser.fullName}</strong>.</p>
            
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
