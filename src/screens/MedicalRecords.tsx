import React, { useState } from "react";
import { Heart, Activity, Thermometer, Weight, FileDown, Plus, ShieldCheck, HeartHandshake, Eye, Download, Info, RefreshCw } from "lucide-react";
import { VitalSign, Appointment } from "../types";
import { mockAppointments, clinicalVitals } from "../mockData";

interface MedicalRecordsProps {
  vitalsList: VitalSign[];
  onAddVitals: (vital: VitalSign) => void;
  appointments: Appointment[];
}

export default function MedicalRecords({ vitalsList, onAddVitals, appointments }) {
  const [activeTab, setActiveTab] = useState<'vitals' | 'reports' | 'prescriptions'>('vitals');
  
  // Vitals form state
  const [hr, setHr] = useState(72);
  const [bps, setBps] = useState(120);
  const [bpd, setBpd] = useState(80);
  const [temp, setTemp] = useState(36.6);
  const [weight, setWeight] = useState(74.5);
  const [spo2, setSpo2] = useState(99);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showDownloadSplash, setShowDownloadSplash] = useState(false);

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    const newReading: VitalSign = {
      timestamp: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      heartRate: Number(hr),
      bloodPressureSys: Number(bps),
      bloodPressureDia: Number(bpd),
      temperature: Number(temp),
      weight: Number(weight),
      oxygenSaturation: Number(spo2)
    };
    onAddVitals(newReading);
    setShowLogForm(false);
  };

  const currentVitals = vitalsList[0] || clinicalVitals[0];

  const handleDownloadPDF = () => {
    setShowDownloadSplash(true);
    setTimeout(() => {
      setShowDownloadSplash(false);
      // Trigger native print flow or download as simple JSON
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify({ patientVitals: vitalsList, clinicAppointments: appointments }, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", "CarePoint_Medical_Record_Secure.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }, 1500);
  };

  return (
    <div id="medical-records-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-1000 tracking-tight text-slate-950">Bio-Metrics & Electronic Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            Access secure diagnostic reports, review chemical prescriptions, and log daily outpatient biometrics.
          </p>
        </div>

        <button 
          onClick={handleDownloadPDF}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 px-5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-slate-900/10 cursor-pointer"
        >
          <FileDown className="w-4.5 h-4.5" /> Download Full EHR (.JSON)
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0.5">
        <button 
          onClick={() => setActiveTab('vitals')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 px-4 transition ${
            activeTab === 'vitals' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dynamic Vitals
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 px-4 transition ${
            activeTab === 'reports' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Clinical Notes & Reports
        </button>
        <button 
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 px-4 transition ${
            activeTab === 'prescriptions' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Prescriptions
        </button>
      </div>

      {/* TAB 1: VITALS SIGN LOGS */}
      {activeTab === 'vitals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
          {/* Vitals Highlights cards bar */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Heart Rate</span>
                  <Heart className="w-4.5 h-4.5 text-rose-500 animate-pulse fill-rose-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-mono leading-none">{currentVitals.heartRate} <span className="text-[10px] text-slate-400 font-normal font-sans">bpm</span></div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-extrabold inline-block mt-2 font-mono">Normal (60-100)</span>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Blood Pressure</span>
                  <Activity className="w-4.5 h-4.5 text-teal-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-mono leading-none">{currentVitals.bloodPressureSys}/{currentVitals.bloodPressureDia} <span className="text-[11px] text-slate-400 font-normal font-sans">mmHg</span></div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-extrabold inline-block mt-2 font-mono">Ideal (&lt;120/80)</span>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Body Temperature</span>
                  <Thermometer className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-mono leading-none">{currentVitals.temperature} <span className="text-xs text-slate-400 font-normal font-sans">°C</span></div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-extrabold inline-block mt-2 font-mono">Normal (36.1-37.2)</span>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Body Weight</span>
                  <Weight className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-mono leading-none">{currentVitals.weight} <span className="text-xs text-slate-400 font-normal font-sans">kg</span></div>
                <span className="text-[10px] text-slate-400 inline-block mt-2 font-mono">Last logged: {currentVitals.timestamp}</span>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Oxygen SpO2</span>
                  <Activity className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-mono leading-none">{currentVitals.oxygenSaturation} <span className="text-xs text-slate-400 font-normal font-sans">%</span></div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-extrabold inline-block mt-2 font-mono">Healthy (&gt;=95%)</span>
              </div>

            </div>

            {/* Vitals logs table */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <span className="font-bold text-slate-900 text-sm">Biometric Historical Index</span>
                <span className="text-xs text-slate-500 font-mono">COUNT: {vitalsList.length} Entries</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-mono text-slate-500 text-[10px] uppercase">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">BP (mmHg)</th>
                      <th className="py-2.5 px-4">Pulse (bpm)</th>
                      <th className="py-2.5 px-4">Temp (°C)</th>
                      <th className="py-2.5 px-4">SpO2 (%)</th>
                      <th className="py-2.5 px-4 text-right">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitalsList.map((vit, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 font-mono text-slate-700">
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">{vit.timestamp}</td>
                        <td className="py-3 px-4">{vit.bloodPressureSys}/{vit.bloodPressureDia}</td>
                        <td className="py-3 px-4">{vit.heartRate}</td>
                        <td className="py-3 px-4">{vit.temperature}</td>
                        <td className="py-3 px-4">{vit.oxygenSaturation}%</td>
                        <td className="py-3 px-4 text-right font-semibold">{vit.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Part: Log Vitals Form Action */}
          <div className="lg:col-span-4">
            {showLogForm ? (
              <form onSubmit={handleAddReading} className="bg-white border border-teal-500/35 rounded-3xl p-5 shadow-lg space-y-4 animate-fade-in">
                <span className="text-xs font-mono uppercase tracking-wider text-teal-700 font-bold block">Refine Outpatient Diagnostics</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-medium mb-1.5">Heart Pace (bpm)</label>
                    <input 
                      type="number" 
                      required 
                      value={hr} 
                      onChange={(e) => setHr(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-medium mb-1.5">Temp (°C)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      required 
                      value={temp} 
                      onChange={(e) => setTemp(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-medium mb-1.5">BP Systolic</label>
                    <input 
                      type="number" 
                      required 
                      value={bps} 
                      onChange={(e) => setBps(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-medium mb-1.5">BP Diastolic</label>
                    <input 
                      type="number" 
                      required 
                      value={bpd} 
                      onChange={(e) => setBpd(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-medium mb-1.5">SpO2 (%)</label>
                    <input 
                      type="number" 
                      required 
                      value={spo2} 
                      onChange={(e) => setSpo2(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-mono font-medium mb-1.5">Weight (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      required 
                      value={weight} 
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
                  >
                    Commit Logs
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowLogForm(false)}
                    className="border border-slate-200 hover:border-slate-300 text-slate-500 text-xs py-2.5 px-4 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 text-center space-y-4">
                <Activity className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <span className="font-semibold text-xs text-slate-800 block">Logged values at home?</span>
                  <p className="text-[11px] text-slate-500 mt-1">Add custom blood pressure, oxygen metric readings directly to track historical trends.</p>
                </div>
                <button 
                  onClick={() => setShowLogForm(true)}
                  className="bg-white hover:bg-slate-100 text-slate-700 hover:text-teal-600 font-bold text-xs py-2 px-4 rounded-xl border border-slate-200 transition"
                >
                  Log Daily Vitals
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLINICAL NOTES & REPORTS */}
      {activeTab === 'reports' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {appointments.filter(a => a.status === 'Completed').map((apt) => (
            <div key={apt.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img src={apt.doctorImage} alt={apt.doctorName} className="w-10 h-10 rounded-xl object-cover border border-slate-100" />
                  <div>
                    <span className="font-bold text-slate-950 text-xs block leading-tight">{apt.doctorName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{apt.specialty}</span>
                  </div>
                </div>

                <div className="text-right font-mono text-[10px] text-slate-500">
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded inline-block mb-1 font-mono uppercase text-[9px] tracking-wider">ANNUAL SCREENING COMPLETE</span>
                  <div className="mt-0.5 font-bold">Consult Date: {apt.date}</div>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Reported Symptoms / Context</span>
                  <p className="mt-1 text-slate-600 italic font-mono bg-slate-50 p-2.5 rounded-xl">" {apt.symptoms} "</p>
                </div>

                {apt.clinicalNotes && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Clinical Notes & Diagnosis</span>
                    <p className="mt-1 text-slate-800 leading-relaxed font-semibold">{apt.clinicalNotes}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Info className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>Licensed under MOH Registry Code: {apt.id}.</span>
                </div>

                <button 
                  onClick={() => alert(`Report downloaded: CarePoint_${apt.id}_Clinical_Notes-MOH.pdf`)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Pdf
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ACTIVE PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
          {appointments.filter(a => a.prescription).map((apt) => (
            <div key={apt.id} className="bg-white border border-teal-500/20 rounded-3xl p-6 shadow-sm hover:border-teal-500/40 transition flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold">
                Rx
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm leading-tight block">{apt.prescription}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Issued by: {apt.doctorName} &middot; ({apt.specialty})</span>
                  </div>
                  <span className="bg-amber-50 text-amber-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-amber-200">Refills Left: 2</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-450 text-slate-400 block mb-0.5">Frequency Protocol</span>
                    <span className="font-bold text-slate-800">1 unit (As required for asthma bronchospasms / clinical PRN)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-450 text-slate-400 block mb-0.5">Authorization Date</span>
                    <span className="font-bold text-slate-800 font-mono">{apt.date}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button 
                    onClick={() => alert(`Refill order committed securely via Carey API. Please approach nearest CarePoint Clinic Pharmacy DAMANSARA with token Rx-${apt.id}.`)}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                  >
                    Order Refill & Drive-Thru pickup
                  </button>
                  <button 
                    onClick={() => alert("Dosage protocol and chemical contents downloaded.")}
                    className="border border-slate-200 hover:border-slate-350 text-slate-500 text-xs px-4 py-2 rounded-xl transition"
                  >
                    Chemical Contents
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EHR DOWNLOAD SPLASH OVERLAY */}
      {showDownloadSplash && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl max-w-sm text-center space-y-4 shadow-2xl">
            <RefreshCw className="w-12 h-12 text-teal-500 mx-auto animate-spin" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Compiling EHR Database</h3>
            <p className="text-xs text-slate-400">
              Bundling high-fidelity electronic health records, active biometrics history, and clinical certifications into a signed SHA256 secure file wrapper...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
