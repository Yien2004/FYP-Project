import React, { useState, useEffect } from 'react';
import { getStaffAccountByEmail, PANTAI_FACILITIES, getHospitalByFacilityId } from '../data/staffAccounts';
import { Building2 } from 'lucide-react';

interface AdminHolidaysProps {
  onNavigateBack?: () => void;
}

export default function AdminHolidays({ onNavigateBack }: AdminHolidaysProps) {
  const loggedEmail = localStorage.getItem('lifelink_user_email') || '';
  const adminAccount = React.useMemo(() => getStaffAccountByEmail(loggedEmail), [loggedEmail]);
  const isSuperAdmin = adminAccount?.role === 'super_admin' || loggedEmail === 'superadmin@pantaicare.com' || loggedEmail === 'superadmin@gmail.com';
  const defaultFacId = adminAccount?.facility_id || 1;

  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [targetFacilityId, setTargetFacilityId] = useState<number>(isSuperAdmin ? 1 : defaultFacId);
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState<number | 'ALL'>(isSuperAdmin ? 'ALL' : defaultFacId);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayDescription, setHolidayDescription] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const activeFac = isSuperAdmin ? (selectedFacilityFilter === 'ALL' ? '' : selectedFacilityFilter) : defaultFacId;
      const facParam = activeFac !== '' ? `?facilityId=${activeFac}` : '';
      const res = await fetch(`/api/admin/holidays/list${facParam}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.holidays)) {
        if (!isSuperAdmin) {
          setHolidays(data.holidays.filter((h: any) => Number(h.facility_id) === defaultFacId || Number(h.facility_id) === 0));
        } else {
          setHolidays(data.holidays);
        }
      }
    } catch (err: any) {
      console.warn("Failed to fetch holidays:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedFacilityFilter]);

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayTitle.trim()) {
      setErrorMsg("Please provide both a valid date and a holiday title.");
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/holidays/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: isSuperAdmin ? targetFacilityId : defaultFacId,
          holidayDate,
          title: holidayTitle.trim(),
          description: holidayDescription.trim(),
          createdBy: loggedEmail || 'admin'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Holiday recorded for ${holidayDate}. Booking slots blocked successfully.`);
        setHolidayDate('');
        setHolidayTitle('');
        setHolidayDescription('');
        fetchHolidays();
      } else {
        setErrorMsg(data.error || 'Failed to schedule holiday closure.');
      }
    } catch (err: any) {
      setErrorMsg(`Network communication failure: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to remove this holiday? The date will be unblocked on patient booking calendars.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/holidays/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Holiday block removed successfully.");
        fetchHolidays();
      } else {
        setErrorMsg(data.error || 'Failed to remove holiday.');
      }
    } catch (err: any) {
      setErrorMsg(`Deletion error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-neutral-800 font-sans pb-12">
      {/* Top Header */}
      <div className="border-b border-neutral-200 pb-4">
        <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Facility Holiday & Slot Blocking Console
        </h1>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl font-medium">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      {/* Main 2-Column Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Schedule Holiday Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="font-extrabold text-sm text-neutral-900">
              Schedule Facility Closure / Holiday
            </h3>
          </div>

          <form onSubmit={handleCreateHoliday} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Target Facility
              </label>
              {isSuperAdmin ? (
                <select
                  value={targetFacilityId}
                  onChange={(e) => setTargetFacilityId(Number(e.target.value))}
                  className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value={0}>PantaiCare Healthcare Group (All Facilities)</option>
                  {PANTAI_FACILITIES.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.location})</option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-neutral-100 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{adminAccount?.hospital || 'Pantai Hospital Penang (Main Hospital)'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Closure Date *
              </label>
              <input
                type="date"
                min={todayStr}
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Holiday Title / Occasion *
              </label>
              <input
                type="text"
                placeholder="e.g. Hari Raya Aidilfitri / Penang Heritage Day"
                value={holidayTitle}
                onChange={(e) => setHolidayTitle(e.target.value)}
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Operational Notes & Instructions
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Specialist Outpatient Clinics (SOC) closed. Emergency Department operates 24/7."
                value={holidayDescription}
                onChange={(e) => setHolidayDescription(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Applying Holiday & Locking Slots...' : 'Publish Holiday & Block Slots'}
            </button>
          </form>
        </div>

        {/* Right Column: Live Table of Active Facility Holidays */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-neutral-900">
                Active Facility Holidays & Schedules
              </h3>
              {!isSuperAdmin && (
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Showing scheduled closures for {adminAccount?.hospital || 'this branch'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <select
                  value={selectedFacilityFilter}
                  onChange={(e) => setSelectedFacilityFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1 text-xs text-neutral-800 font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="ALL">All Facilities</option>
                  {PANTAI_FACILITIES.map(f => (
                    <option key={f.id} value={f.id}>{f.shortTag}</option>
                  ))}
                </select>
              )}
              <span className="text-xs bg-neutral-100 text-neutral-700 font-mono font-bold px-3 py-1 rounded-xl">
                {holidays.length} Holidays
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              Loading active facility schedules...
            </div>
          ) : holidays.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
              No holidays scheduled for this facility. All calendar dates are available for patient appointments.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-100 text-neutral-600 uppercase text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Holiday Title</th>
                    <th className="px-4 py-3">Interlock Impact</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {holidays.map((h: any) => (
                    <tr key={h.id} className="hover:bg-neutral-50/80 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {h.holiday_date}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-neutral-900">{h.title}</p>
                        {h.description && (
                          <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{h.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
                            Slots Blocked
                          </span>
                          {h.impactedCount > 0 && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              {h.impactedCount} patients affected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
