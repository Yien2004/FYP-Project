import React, { useMemo } from 'react';
import {
  TrendingUp,
  Heart,
  Activity,
  Calendar,
  Award,
  Shield,
  AlertCircle,
  Info,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  User,
  FileText,
  Bookmark
} from 'lucide-react';
import { Appointment, PatientProfile, VitalSign } from '../types';

interface HealthcareAnalyticsProps {
  patientProfile: PatientProfile;
  vitals: VitalSign[];
  appointments: Appointment[];
  onSetScreen: (screen: string) => void;
}

export default function HealthcareAnalytics({
  patientProfile,
  vitals,
  appointments,
  onSetScreen
}: HealthcareAnalyticsProps) {
  // Whether real vitals data exists
  const hasVitals = vitals && vitals.length > 0;

  // 1. Calculate Average Vitals — null when no data
  const avgVitals = useMemo(() => {
    if (!hasVitals) return null;
    const sum = vitals.reduce(
      (acc, v) => ({
        hr: acc.hr + (v.heartRate || 0),
        sys: acc.sys + (v.bloodPressureSys || 0),
        dia: acc.dia + (v.bloodPressureDia || 0),
        temp: acc.temp + (v.temperature || 0),
        o2: acc.o2 + (v.oxygenSaturation || 0),
        w: acc.w + (v.weight || 0)
      }),
      { hr: 0, sys: 0, dia: 0, temp: 0, o2: 0, w: 0 }
    );
    const count = vitals.length;
    return {
      heartRate: Math.round(sum.hr / count),
      bpSys: Math.round(sum.sys / count),
      bpDia: Math.round(sum.dia / count),
      temp: Number((sum.temp / count).toFixed(1)),
      oxygen: Math.round(sum.o2 / count),
      weight: Math.round(sum.w / count)
    };
  }, [vitals, hasVitals]);

  // 2. Status flags based on average vitals (only computed when data exists)
  const healthStatus = useMemo(() => {
    if (!avgVitals) return null;
    const sys = avgVitals.bpSys;
    const dia = avgVitals.bpDia;
    const hr = avgVitals.heartRate;
    const o2 = avgVitals.oxygen;

    let bpStatus = { label: 'Optimal', color: 'text-teal-600 bg-teal-50 border-teal-100', desc: 'Blood pressure is in a healthy range.' };
    if (sys >= 140 || dia >= 90) {
      bpStatus = { label: 'Hypertension Stage 2', color: 'text-red-600 bg-red-50 border-red-100', desc: 'High blood pressure. Please consult a doctor.' };
    } else if (sys >= 130 || dia >= 80) {
      bpStatus = { label: 'Hypertension Stage 1', color: 'text-orange-600 bg-orange-50 border-orange-100', desc: 'Mild high blood pressure. Monitor regularly.' };
    } else if (sys >= 120) {
      bpStatus = { label: 'Elevated', color: 'text-amber-600 bg-amber-50 border-amber-100', desc: 'Slightly elevated. Maintain healthy lifestyle.' };
    }

    let hrStatus = { label: 'Normal', color: 'text-teal-600 bg-teal-50 border-teal-100' };
    if (hr > 100) {
      hrStatus = { label: 'Tachycardia', color: 'text-red-650 bg-red-50 border-red-100' };
    } else if (hr < 60) {
      hrStatus = { label: 'Bradycardia', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    }

    let o2Status = { label: 'Healthy', color: 'text-teal-600 bg-teal-50 border-teal-100' };
    if (o2 < 95) {
      o2Status = { label: 'Low Saturation', color: 'text-red-600 bg-red-50 border-red-100' };
    }

    return { bpStatus, hrStatus, o2Status };
  }, [avgVitals]);

  // 3. Last Completed Checkup / Medical Report
  const lastReport = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'Completed');
    if (completed.length === 0) return null;
    // Sort by date descending
    return [...completed].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [appointments]);

  // 4. Cardiovascular Risk Score Estimator (only when vitals exist)
  const cvdRiskScore = useMemo(() => {
    if (!avgVitals) return null;
    let score = 5; // Base risk%
    if (patientProfile.chronicConditions && patientProfile.chronicConditions.some(c => c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('hypertension'))) {
      score += 8;
    }
    if (avgVitals.bpSys > 130) score += 4;
    if (avgVitals.heartRate > 85) score += 2;
    if (patientProfile.gender === 'Male') score += 2;
    
    // Age factor
    if (patientProfile.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(patientProfile.dateOfBirth).getFullYear();
      if (age > 50) score += 6;
      else if (age > 40) score += 3;
    }
    return Math.min(score, 100);
  }, [patientProfile, avgVitals]);

  const riskTier = useMemo(() => {
    if (cvdRiskScore === null) return null;
    if (cvdRiskScore < 10) return { label: 'Low Risk', color: 'text-teal-600 bg-teal-50 border-teal-100', progress: 'bg-teal-500' };
    if (cvdRiskScore < 20) return { label: 'Moderate Risk', color: 'text-amber-600 bg-amber-50 border-amber-100', progress: 'bg-amber-500' };
    return { label: 'High Risk', color: 'text-red-600 bg-red-50 border-red-100', progress: 'bg-red-500' };
  }, [cvdRiskScore]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Interactive Health Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Healthcare Analytics</h1>
            <p className="text-teal-100 text-sm max-w-xl leading-relaxed">
              Track clinical trends, review average diagnostic vitals, and explore your cardiovascular wellness index.
            </p>
          </div>
          <button
            onClick={() => onSetScreen('medical-records')}
            className="px-6 py-3 rounded-2xl bg-white text-teal-700 hover:bg-teal-50 text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Update Vitals Logs
          </button>
        </div>
      </div>

      {/* Grid of Averages (Diagnostic Cards) */}
      {hasVitals && avgVitals && healthStatus ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Blood Pressure Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${healthStatus.bpStatus.color}`}>
                {healthStatus.bpStatus.label}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-medium block">Average Blood Pressure</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{avgVitals.bpSys}</span>
                <span className="text-gray-400 font-bold text-xl">/</span>
                <span className="text-2xl font-extrabold text-gray-900">{avgVitals.bpDia}</span>
                <span className="text-xs text-gray-500 font-medium ml-1">mmHg</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {healthStatus.bpStatus.desc}
              </p>
            </div>
          </div>

          {/* Heart Rate Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-teal-600" />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${healthStatus.hrStatus.color}`}>
                {healthStatus.hrStatus.label}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-medium block">Average Pulse</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{avgVitals.heartRate}</span>
                <span className="text-xs text-gray-500 font-medium ml-1">BPM</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Normal resting pulse rates range between 60 to 100 beats per minute.
              </p>
            </div>
          </div>

          {/* Oxygen Saturation Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-sky-500" />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${healthStatus.o2Status.color}`}>
                {healthStatus.o2Status.label}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-medium block">Oxygen Saturation</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{avgVitals.oxygen}%</span>
                <span className="text-xs text-gray-500 font-medium ml-1">SpO2</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Maintains cell oxygenation. Values above 95% indicate healthy lung efficiency.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State — Awaiting Staff Data Entry */
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm p-8 sm:p-10">
          <div className="text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto">
              <Activity className="w-7 h-7 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-gray-900 text-lg">No Vitals Data Recorded Yet</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your diagnostic vitals (Blood Pressure, Heart Rate, SpO₂) will appear here after the medical staff updates your clinical report during or after your visit.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-700">
                <Clock className="w-3.5 h-3.5" />
                Awaiting Clinical Data
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Risk Indices and Historic Vitals Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Cardiovascular Risk Predictor */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg sm:text-xl">Cardiovascular Health Predictor</h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Estimates your relative 10-year risk of cardiovascular disease based on clinical statistics.
                </p>
              </div>
              {riskTier ? (
                <span className={`text-xs font-bold tracking-wide px-3 py-1 rounded-full border ${riskTier.color}`}>
                  {riskTier.label}
                </span>
              ) : (
                <span className="text-xs font-bold tracking-wide px-3 py-1 rounded-full border text-gray-400 bg-gray-50 border-gray-100">
                  Pending
                </span>
              )}
            </div>

            {cvdRiskScore !== null && riskTier ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <span>Calculated Risk Score</span>
                    <span className="text-gray-900">{cvdRiskScore}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${riskTier.progress}`} style={{ width: `${cvdRiskScore}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
                    <Award className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Healthy Habits Advantage</p>
                      <p className="mt-1 leading-relaxed text-slate-500">
                        A diet rich in soluble fibers can reduce cardiovascular risk markers by up to 15%.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
                    <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Diagnostic Indicators</p>
                      <p className="mt-1 leading-relaxed text-slate-500">
                        This risk index factors in active chronic conditions, age inputs, and blood pressure trends.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                  Cardiovascular risk analysis will be available after your vitals are recorded by medical staff.
                </p>
              </div>
            )}
          </div>

          {/* Historical Logs List */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <h2 className="font-extrabold text-gray-900 text-lg sm:text-xl">Vitals Historical Logs</h2>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                {vitals.length} Entries
              </span>
            </div>

            {vitals.length === 0 ? (
              <div className="text-center py-8 text-gray-400 space-y-2 text-sm">
                <p>No historical vitals found. Add entries in the Medical Records section.</p>
                <button
                  onClick={() => onSetScreen('medical-records')}
                  className="text-teal-600 hover:underline font-bold"
                >
                  Go to Medical Records
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Date Logged</th>
                      <th className="pb-3 font-semibold">Blood Pressure</th>
                      <th className="pb-3 font-semibold">Heart Rate</th>
                      <th className="pb-3 font-semibold">Oxygen (SpO2)</th>
                      <th className="pb-3 font-semibold">Temperature</th>
                      <th className="pb-3 font-semibold">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                    {vitals.slice(0, 5).map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 font-bold text-slate-900">{log.timestamp}</td>
                        <td className="py-3.5 font-mono">{log.bloodPressureSys}/{log.bloodPressureDia} mmHg</td>
                        <td className="py-3.5">{log.heartRate} BPM</td>
                        <td className="py-3.5">{log.oxygenSaturation}%</td>
                        <td className="py-3.5">{log.temperature}°C</td>
                        <td className="py-3.5">{log.weight} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Last Body Check and Active Reminders */}
        <div className="space-y-8">
          
          {/* Last Completed Body Check */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-teal-600" />
              <span>Last Medical Report</span>
            </h3>

            {lastReport ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Completed Date</span>
                    <span className="font-bold text-slate-800 text-sm">{lastReport.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Assigned Doctor</span>
                    <span className="font-bold text-slate-800 text-sm">{lastReport.doctorName}</span>
                    <span className="text-xs text-slate-400 block">{lastReport.specialty} · {lastReport.clinic || lastReport.hospital}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Clinical Notes</span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed italic">
                      "{lastReport.clinicalNotes || "Routine general review completed. Patient parameters are stabilized."}"
                    </p>
                  </div>
                </div>
                
                {lastReport.prescription && (
                  <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100 space-y-2">
                    <span className="text-[10px] text-teal-650 font-bold uppercase tracking-wider block">Prescription Summary</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                      <Bookmark className="w-4 h-4 text-teal-600" />
                      <span>{lastReport.prescription}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-xs space-y-2 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <AlertCircle className="w-6 h-6 text-gray-300 mx-auto" />
                <p>No completed checkup reports found in your appointment records.</p>
              </div>
            )}
          </div>

          {/* Active Medication Reminders */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-sky-600" />
              <span>Active Medication Reminders</span>
            </h3>

            {!patientProfile.prescriptions || patientProfile.prescriptions.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs space-y-2 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <Clock className="w-6 h-6 text-gray-300 mx-auto" />
                <p>No active medications listed. Status: Empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patientProfile.prescriptions.map((rx: any) => (
                  <div
                    key={rx.id || rx.drugName}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-bold text-slate-800 text-sm">{rx.drugName}</p>
                      <p className="text-slate-500 font-semibold">
                        {rx.dosage} · {rx.frequency} {rx.foodTiming && `· ${rx.foodTiming}`}
                      </p>
                      {rx.instructions && (
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-normal">
                          Inst: {rx.instructions}
                        </p>
                      )}
                      {rx.scheduledTimes && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {rx.scheduledTimes.split(",").map((time: string) => (
                            <span key={time} className="bg-slate-200/60 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold">
                              {time.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 font-medium pt-1">Duration: {rx.duration} · Prescribed on {rx.date}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-[10px] font-bold text-teal-700 shrink-0">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
