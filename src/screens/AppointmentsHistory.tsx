import React, { useState } from "react";
import { Search, Filter, Calendar, Clock, ChevronRight, RefreshCw, Star, Mail, MapPin } from "lucide-react";
import { Appointment, Doctor } from "../types";
import { mockDoctors } from "../mockData";

interface AppointmentsHistoryProps {
  appointments: Appointment[];
  onResubmitBooking: (apt: Appointment) => void;
  onSetScreen: (screen: string) => void;
  doctors?: Doctor[];
}

export default function AppointmentsHistory({ appointments, onResubmitBooking, onSetScreen, doctors = [] }: AppointmentsHistoryProps) {
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
          Review, reschedule, or quickly book previous healthcare experts and specialized physician rosters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Part: List of consultations + search filters */}
        <div className="lg:col-span-8 space-y-6">
          {/* Filters shelf */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specialty, physician, symptom..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setStatusFilter('All')}
                className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl transition ${statusFilter === 'All' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('Upcoming')}
                className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl transition ${statusFilter === 'Upcoming' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                Upcoming
              </button>
              <button 
                onClick={() => setStatusFilter('Completed')}
                className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl transition ${statusFilter === 'Completed' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
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
                    selectedApt?.id === apt.id ? 'border-teal-500 ring-1 ring-teal-505/20' : 'border-slate-150'
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'Upcoming' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          apt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-500 font-medium">
                        {apt.specialty} &middot; <span className="font-mono text-slate-400">{apt.type}</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1 italic mt-1 font-mono">
                        " {apt.symptoms} "
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-right font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" /> {apt.date}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600" /> {apt.timeSlot}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 hidden md:block shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Part: Active Consultation Details Panel & Doctors Lists */}
        <div className="lg:col-span-4 space-y-6">
          {selectedApt ? (
            <div className="bg-white border border-teal-500/30 rounded-3xl p-5 shadow-lg space-y-4 animate-fade-in relative">
              <div className="absolute top-4 right-4 bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-1 rounded">
                ID: {selectedApt.id}
              </div>

              <div className="flex items-center gap-3">
                <img 
                  src={selectedApt.doctorImage} 
                  alt={selectedApt.doctorName} 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{selectedApt.doctorName}</h4>
                  <span className="text-[10px] text-slate-500 block font-mono">{selectedApt.specialty}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2.5 text-xs text-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Reported Symptoms</span>
                  <p className="p-2.5 bg-slate-50 rounded-xl leading-relaxed mt-1 text-slate-600 text-[11px] font-mono">
                    {selectedApt.symptoms}
                  </p>
                </div>

                {selectedApt.clinicalNotes && (
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Primary Diagnosis</span>
                    <p className="mt-1 leading-relaxed text-slate-800 text-[11px]">
                      {selectedApt.clinicalNotes}
                    </p>
                  </div>
                )}

                {selectedApt.prescription && (
                  <div className="bg-teal-50/50 border border-teal-100 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-teal-700 block font-extrabold">Active Prescription</span>
                    <p className="mt-1 leading-normal font-semibold text-teal-900 select-all text-[11px] font-mono">
                      {selectedApt.prescription}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button 
                  onClick={() => onResubmitBooking(selectedApt)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                  title="Resubmit previous parameters to a new booking"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Book Again
                </button>
                <button 
                  onClick={() => onSetScreen("communication")}
                  className="border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  Contact Clinic
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 text-center text-slate-500 text-xs">
              Click any consultation on the list to view attending diagnostic writeups and active chemical prescriptions.
            </div>
          )}

          {/* Attending Doctors Panel */}
          <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-950 text-sm">Top Doctors Directory</h4>
            
            <div className="space-y-3">
              {(doctors.length > 0 ? doctors : mockDoctors).slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex gap-3 items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                  <div className="flex gap-2.5 items-center">
                    <img 
                      src={doc.image} 
                      alt={doc.name} 
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-xs block leading-tight">{doc.name}</span>
                      <span className="text-[10px] text-teal-650 font-semibold block mt-0.5">{doc.specialty}</span>
                      <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{doc.hospital}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold select-none justify-end">
                      <Star className="w-3 h-3 fill-amber-500 stroke-none" /> {doc.rating}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono block">({doc.reviewsCount} reviews)</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onSetScreen("schedule-appointment")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              Book New Specialist
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
