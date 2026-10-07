import React, { useState } from "react";
import { Search, Filter, Calendar, Clock, RefreshCw, Building2, FileText, Pill, Eye, X } from "lucide-react";
import { Appointment, Doctor } from "../types";

interface AppointmentsHistoryProps {
  appointments: Appointment[];
  onResubmitBooking: (apt: Appointment) => void;
  onSetScreen: (screen: string) => void;
  doctors?: Doctor[];
}

export default function AppointmentsHistory({ appointments, onResubmitBooking, onSetScreen }: AppointmentsHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Completed'>('All');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          apt.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          apt.symptoms.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && apt.status === statusFilter;
  });

  return (
    <div id="appointments-history-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Consultation Log & Archive</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, reschedule, or quickly book previous healthcare appointments and specialist consultations.
        </p>
      </div>

      {/* Main consultation list container */}
      <div className="max-w-4xl mx-auto space-y-6">
          {/* Filters shelf */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specialty, physician, symptom..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setStatusFilter('All')}
                className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl transition ${statusFilter === 'All' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('Upcoming')}
                className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl transition ${statusFilter === 'Upcoming' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                Upcoming
              </button>
              <button 
                onClick={() => setStatusFilter('Completed')}
                className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl transition ${statusFilter === 'Completed' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500 text-sm">
                No recorded appointments match the requested query. Alternatively, register a new appointment booking.
              </div>
            ) : (
              filteredAppointments.slice(0, 20).map((apt) => (
                <div 
                  key={apt.id} 
                  className={`bg-white border rounded-2xl p-5 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    selectedApt?.id === apt.id ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200'
                  }`}
                  onClick={() => setSelectedApt(apt)}
                >
                  <div className="flex gap-4">
                    <img 
                      src={apt.doctorImage} 
                      alt={apt.doctorName} 
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm block">{apt.doctorName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          apt.status === 'Upcoming' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          apt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                        <span>{apt.specialty}</span>
                        {apt.clinic && (
                          <>
                            <span className="text-slate-300">&middot;</span>
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {apt.clinic}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1 italic mt-1 font-mono">
                        " {apt.symptoms} "
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-right font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" /> {apt.date}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-sky-600" /> {apt.timeSlot}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApt(apt);
                      }}
                      className="text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Consultation Details Card Modal (Centred in viewport, immune to scroll) */}
      {selectedApt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedApt(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full font-mono">
                  Consultation Record
                </span>
                <h3 className="text-base font-extrabold text-slate-950 mt-1 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-sky-600" />
                  Visit Details & Results
                </h3>
              </div>
              <button 
                onClick={() => setSelectedApt(null)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Doctor & Facility Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedApt.doctorImage} 
                      alt={selectedApt.doctorName} 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{selectedApt.doctorName}</h4>
                      <p className="text-[11px] text-sky-700 font-semibold">{selectedApt.specialty}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase border shrink-0 ${
                    selectedApt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                    selectedApt.status === 'Upcoming' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedApt.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>{selectedApt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>{selectedApt.timeSlot || "Scheduled slot"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">{selectedApt.clinic || "Penang Healthcare Facility"}</span>
                </div>
              </div>

              {/* Reported Symptoms */}
              {selectedApt.symptoms && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                    Reported Symptoms
                  </span>
                  <p className="text-slate-700 text-xs leading-relaxed italic">
                    "{selectedApt.symptoms}"
                  </p>
                </div>
              )}

              {/* Doctor Clinical Notes */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  Doctor Clinical Notes
                </span>
                <p className="text-slate-800 text-xs leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {selectedApt.clinicalNotes || "General outpatient consultation recorded."}
                </p>
              </div>

              {/* Prescribed Medication */}
              <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-3.5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-800 block font-mono flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-sky-600" />
                  Prescribed Medication
                </span>
                <p className="text-sky-950 font-semibold text-xs leading-relaxed bg-white p-2.5 rounded-xl border border-sky-100 select-all font-mono">
                  {selectedApt.prescription || "No medications prescribed."}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button 
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close View
              </button>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setSelectedApt(null);
                    onSetScreen("communication");
                  }}
                  className="px-3.5 py-2 border border-slate-200 hover:border-sky-500 hover:text-sky-700 bg-white text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Contact Clinic
                </button>
                <button 
                  onClick={() => {
                    const aptToResubmit = selectedApt;
                    setSelectedApt(null);
                    onResubmitBooking(aptToResubmit);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Book Again
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
