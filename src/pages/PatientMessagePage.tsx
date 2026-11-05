import React, { useState, useEffect } from 'react';
import { Building2, Stethoscope, Mail, Send, CheckCircle2, Clock, MessageSquare, AlertCircle, ArrowLeft } from 'lucide-react';

interface PatientMessagePageProps {
  onBack?: () => void;
  patientEmail?: string;
  patientName?: string;
}

export const PatientMessagePage: React.FC<PatientMessagePageProps> = ({
  onBack,
  patientEmail = localStorage.getItem('carepoint_user_email') || 'user@gmail.com',
  patientName = localStorage.getItem('carepoint_user_name') || 'Patient'
}) => {
  const [facilities] = useState([
    { id: 1, name: 'Pantai Hospital Penang (Main Hospital)' },
    { id: 2, name: 'Pantai Heart & Wellness Pavilion' },
    { id: 3, name: 'Pantai Premier Clinic & Day Surgery' },
    { id: 4, name: 'Pantai Specialist Centre' }
  ]);

  const [selectedFacilityId, setSelectedFacilityId] = useState<number | ''>(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // History of inquiries submitted by this patient
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadInquiries = () => {
    setLoadingHistory(true);
    fetch(`/api/inquiries?patientId=${encodeURIComponent(patientEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data?.inquiries) {
          setInquiries(data.inquiries);
        }
      })
      .catch(err => console.warn("Failed to load inquiries:", err))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    loadInquiries();
  }, [patientEmail]);

  // 1. 当院区改变时，从数据库动态拉取该院区所有审批通过（ACTIVE）的科室和医生
  useEffect(() => {
    if (selectedFacilityId) {
      fetch(`/api/metadata/active-departments-doctors?facilityId=${selectedFacilityId}`)
        .then(res => res.json())
        .then(data => {
          setDepartments(data.departments || []);
          setDoctorsList(data.doctors || []);
          setSelectedDept('');
          setFilteredDoctors([]);
          setSelectedDoctorId('');
        })
        .catch(err => {
          console.warn("Failed to fetch active metadata:", err);
        });
    } else {
      setDepartments([]);
      setDoctorsList([]);
    }
  }, [selectedFacilityId]);

  // 2. 当科室改变时，仅筛选出本科室名下的在岗医生
  useEffect(() => {
    if (selectedDept) {
      const cleanDept = selectedDept.toLowerCase().trim();
      const docs = doctorsList.filter(d => {
        const dDept = (d.department || '').toLowerCase().trim();
        return dDept === cleanDept || dDept.includes(cleanDept) || cleanDept.includes(dDept);
      });
      setFilteredDoctors(docs);
      setSelectedDoctorId('');
    } else {
      setFilteredDoctors([]);
    }
  }, [selectedDept, doctorsList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityId || !selectedDept || !subject || !message) {
      setErrorMsg('Please select facility, department, and enter subject and message.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const selectedDoc = filteredDoctors.find(d => String(d.id) === String(selectedDoctorId));
      const res = await fetch('/api/inquiries/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: selectedFacilityId,
          department: selectedDept,
          doctorId: selectedDoctorId || null,
          doctorName: selectedDoc?.full_name || 'General Clinic Desk',
          subject,
          message,
          patientId: patientEmail,
          patientName: patientName,
          patientEmail: patientEmail
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

      setSuccessMsg('Inquiry submitted successfully to the department frontdesk!');
      setSubject('');
      setMessage('');
      loadInquiries();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              <span>Contact Clinic & Specialist Desk (门诊咨询留言)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct patient inquiries routed dynamically to the active department desk and attending physicians.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Send Clinical Inquiry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Departments and doctor availability are dynamically verified from the enterprise registry.
            </p>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Level 1: Facility */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>1. Select Facility (选择院区):</span>
              </label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                required
              >
                <option value="">-- Choose PantaiCare Facility --</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Level 2: Dynamic Active Departments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>2. Department (专科科室 - 动态同步):</span>
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                disabled={!selectedFacilityId}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                required
              >
                <option value="">-- {selectedFacilityId ? `Select active department (${departments.length} available)` : 'Please select a facility first'} --</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level 3: Filtered Doctors */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>3. Specific Physician (可选指定医生):</span>
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                disabled={!selectedDept}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">Default: Send to Department Frontdesk (General Clinic Desk)</option>
                {filteredDoctors.map((doc: any) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name || doc.name} ({doc.room_number || 'Consultation Room'}) - [{doc.employment_type || 'Resident'}]
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Inquiry Subject (咨询标题):
              </label>
              <input
                type="text"
                placeholder="e.g., Query regarding blood test results / Follow-up schedule"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message Content (详细描述):
              </label>
              <textarea
                rows={4}
                placeholder="Type your clinical inquiry or operational query here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-600/20 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Inquiry...' : 'Submit Inquiry (提交门诊咨询)'}</span>
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Your Inquiry Ledger
                </h3>
                <p className="text-[11px] text-slate-400">Past communications and responses</p>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                {inquiries.length} Inquiries
              </span>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading inquiries...</div>
            ) : inquiries.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
                No inquiries submitted yet. Submit a message using the form to consult with clinic frontdesk.
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {inquiries.map((inq: any) => {
                  const isReplied = inq.status === 'REPLIED' || inq.status === 'RESOLVED';
                  return (
                    <div
                      key={inq.id}
                      className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 truncate">{inq.subject}</span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                          isReplied
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {inq.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-mono">
                        Dept: {inq.department} • {inq.doctor_name || 'Frontdesk'}
                      </p>

                      <p className="text-slate-700 text-xs bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {inq.message}
                      </p>

                      {inq.reply_text && (
                        <div className="mt-2 p-2.5 bg-teal-50/80 border border-teal-200/70 rounded-lg text-teal-900 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            <span>Response from {inq.replied_by || 'Clinic Desk'}:</span>
                          </div>
                          <p className="text-xs">{inq.reply_text}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(inq.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientMessagePage;
