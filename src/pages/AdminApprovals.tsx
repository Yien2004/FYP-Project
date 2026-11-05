import React, { useState, useEffect } from 'react';
import { getStaffAccountByEmail, PANTAI_FACILITIES, getHospitalByFacilityId } from '../data/staffAccounts';
import { Building2 } from 'lucide-react';

interface AdminApprovalsProps {
  onNavigateBack?: () => void;
}

export default function AdminApprovals({ onNavigateBack }: AdminApprovalsProps) {
  const loggedEmail = localStorage.getItem('lifelink_user_email') || '';
  const adminAccount = React.useMemo(() => getStaffAccountByEmail(loggedEmail), [loggedEmail]);
  const isSuperAdmin = adminAccount?.role === 'super_admin' || loggedEmail === 'superadmin@pantaicare.com' || loggedEmail === 'superadmin@gmail.com';
  const defaultFacId = adminAccount?.facility_id || 1;
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(isSuperAdmin ? 1 : defaultFacId);
  const facilityId = isSuperAdmin ? selectedFacilityId : defaultFacId;

  // Active Tab: Add Doctor vs Add Department
  const [activeTab, setActiveTab] = useState<'doctor' | 'department'>('doctor');

  // Available departments list for dropdown
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  // Form states: Add Doctor
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docDept, setDocDept] = useState('');
  const [docRoom, setDocRoom] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  // Form states: Add Department & Lead Specialist
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPassword, setLeadPassword] = useState('');
  const [leadRoom, setLeadRoom] = useState('');
  const [submittingDept, setSubmittingDept] = useState(false);

  // Status feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchActiveDepartments = async (facId: number = facilityId) => {
    try {
      const res = await fetch(`/api/departments/active?facilityId=${facId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.departments) && data.departments.length > 0) {
          setAvailableDepartments(data.departments);
          return;
        }
      }
      setAvailableDepartments([]);
    } catch (err) {
      console.warn("Failed to fetch active departments", err);
    }
  };

  useEffect(() => {
    fetchActiveDepartments(facilityId);
  }, [facilityId]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDept = docDept.trim();

    if (!docName.trim() || !docEmail.trim() || !docPassword.trim() || !finalDept) {
      setErrorMsg("Please complete all required fields (Doctor Name, Email Address, Password, and Department / Specialty).");
      return;
    }

    setSubmittingDoc(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/approvals/direct-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId,
          fullName: docName.trim(),
          email: docEmail.trim(),
          password: docPassword.trim(),
          department: finalDept,
          roomNumber: docRoom.trim() || 'Consultation Room 301'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Doctor ${docName.trim()} created successfully with login email: ${docEmail.trim()}`);
        setDocName('');
        setDocEmail('');
        setDocPassword('');
        setDocDept('');
        setDocRoom('');
      } else {
        setErrorMsg(data.error || 'Failed to create doctor account.');
      }
    } catch (err: any) {
      setErrorMsg(`Network communication failure: ${err.message}`);
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !leadName.trim() || !leadEmail.trim() || !leadPassword.trim()) {
      setErrorMsg("Please complete all required fields (Department Name, Lead Doctor Name, Email Address, and Password).");
      return;
    }

    setSubmittingDept(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/approvals/direct-department-with-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId,
          departmentName: deptName.trim(),
          description: deptDesc.trim(),
          leadDoctor: {
            fullName: leadName.trim(),
            email: leadEmail.trim(),
            password: leadPassword.trim(),
            roomNumber: leadRoom.trim() || 'Consultation Room 301'
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Department '${deptName.trim()}' and lead doctor created successfully.`);
        setDeptName('');
        setDeptDesc('');
        setLeadName('');
        setLeadEmail('');
        setLeadPassword('');
        setLeadRoom('');
        // Refresh department dropdown list so the newly created department appears
        fetchActiveDepartments();
      } else {
        setErrorMsg(data.error || 'Failed to create department.');
      }
    } catch (err: any) {
      setErrorMsg(`Network communication failure: ${err.message}`);
    } finally {
      setSubmittingDept(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-neutral-800 font-sans pb-12">
      {/* Title Header & Facility Scope */}
      <div className="border-b border-neutral-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
            Clinical Onboarding & Approvals Console
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Onboard credentialed clinical specialists and establish new service departments.
          </p>
        </div>

        {/* Facility Selector (Super Admin) or Locked Badge (Branch Admin) */}
        {isSuperAdmin ? (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-amber-700 whitespace-nowrap flex items-center gap-1 font-mono">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Target Facility:</span>
            </label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
              className="bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1 text-xs text-neutral-900 font-bold outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 h-9 cursor-pointer"
            >
              {PANTAI_FACILITIES.map(f => (
                <option key={f.id} value={f.id}>{f.shortTag} ({f.location})</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700">
            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate max-w-[200px]">{getHospitalByFacilityId(facilityId)}</span>
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl font-medium">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('doctor')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
            activeTab === 'doctor'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          Add Doctor
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('department')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
            activeTab === 'department'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          Add Department & Lead Specialist
        </button>
      </div>

      {/* TAB 1: ADD DOCTOR DIRECTLY */}
      {activeTab === 'doctor' && (
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs w-full space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="font-extrabold text-sm text-neutral-900">
              Direct Physician Onboarding
            </h3>
          </div>

          <form onSubmit={handleCreateDoctor} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Tan Wei Sheng"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. dr_tan_weisheng@pantaipenang.com"
                  value={docEmail}
                  onChange={(e) => setDocEmail(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={docPassword}
                  onChange={(e) => setDocPassword(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Department / Specialty *
                </label>
                <select
                  value={docDept}
                  onChange={(e) => setDocDept(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
                >
                  <option value="">Select Department / Specialty</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Assigned Consultation Room
                </label>
                <input
                  type="text"
                  placeholder="e.g. Consultation Room 301"
                  value={docRoom}
                  onChange={(e) => setDocRoom(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingDoc}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submittingDoc ? 'Creating Doctor Account...' : 'Create Doctor Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ADD DEPARTMENT & LEAD SPECIALIST */}
      {activeTab === 'department' && (
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs w-full space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="font-extrabold text-sm text-neutral-900">
              Add Department & Initial Lead Specialist
            </h3>
          </div>

          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Department Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Paediatric Cardiology"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Clinical Scope & Description
              </label>
              <textarea
                rows={2}
                placeholder="Specialist outpatient clinic description..."
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 resize-none"
              />
            </div>

            <div className="border-t border-neutral-200 pt-3 space-y-3">
              <span className="text-[11px] font-extrabold text-neutral-700 uppercase tracking-wider block">
                Founding Lead Specialist Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Lead Doctor Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Chong Chee Keong"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Doctor Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. dr_chong_pedcardio@pantaipenang.com"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={leadPassword}
                    onChange={(e) => setLeadPassword(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Consultation Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Consultation Room 301"
                    value={leadRoom}
                    onChange={(e) => setLeadRoom(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingDept}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submittingDept ? 'Creating Department & Lead Doctor...' : 'Create Department & Lead Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
