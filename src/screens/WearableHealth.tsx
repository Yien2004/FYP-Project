import React, { useState, useMemo } from 'react';
import {
  Watch,
  Heart,
  Activity,
  Footprints,
  Moon,
  Flame,
  Droplet,
  RefreshCw,
  Cpu,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { PatientProfile, Appointment } from '../types';

interface WearableHealthProps {
  patientProfile: PatientProfile;
  appointments: Appointment[];
  onSetScreen: (screen: string) => void;
}

export default function WearableHealth({
  patientProfile,
  appointments,
  onSetScreen
}: WearableHealthProps) {
  // Wearable live sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState("Just now");
  const [syncCount, setSyncCount] = useState(0);

  // Wearable simulated live telemetry (updates on sync)
  const wearableData = useMemo(() => {
    const hrOffset = (syncCount % 3) * 2;
    const glucoseOffset = ((syncCount % 4) * 0.1).toFixed(1);
    const stepBonus = syncCount * 120;

    return {
      deviceName: "Apple Watch Series 9 / Galaxy Watch 6",
      battery: 88 - (syncCount % 5),
      restingHr: 68 + hrOffset,
      activeHr: 114 + hrOffset,
      bloodGlucose: (5.6 + Number(glucoseOffset)).toFixed(1),
      glucoseTrend: "Stable",
      spo2: 98,
      steps: 8420 + stepBonus,
      stepGoal: 10000,
      sleepDuration: "7h 24m",
      sleepScore: 86,
      deepSleep: "1h 48m",
      remSleep: "2h 05m",
      activeCalories: 485 + syncCount * 15,
      totalCalories: 2150 + syncCount * 25
    };
  }, [syncCount]);

  const handleSyncWearable = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setSyncCount(prev => prev + 1);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <div id="wearable-health-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans text-neutral-800">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Wearable Health Monitoring</h1>
            <p className="text-sky-100 text-sm max-w-xl leading-relaxed font-medium">
              Continuous biometric collection from your paired smartwatch, including continuous heart rate, glucose metrics, sleep cycles, and daily vital statistics.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Wearable Device Live Sync Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
        
        {/* Device Sync Status Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-md">
              <Watch className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">{wearableData.deviceName}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Last telemetry sync: <span className="font-bold text-slate-700">{lastSyncedTime}</span> • Battery: <span className="font-bold text-slate-700">{wearableData.battery}%</span>
              </p>
            </div>
          </div>
        </div>

        {/* 6 Monitored Key Wearable Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* 1. Real-Time Heart Rate */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 hover:border-teal-300 transition shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xs">
                <Heart className="w-4.5 h-4.5" />
                <span>Continuous Heart Rate</span>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                Normal Rhythm
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{wearableData.restingHr}</span>
                <span className="text-xs font-bold text-slate-500">BPM (Resting)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200/60">
                <span>Active Workout HR:</span>
                <span className="font-bold text-slate-700">{wearableData.activeHr} BPM</span>
              </div>
            </div>
          </div>

          {/* 2. Blood Glucose Level */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 hover:border-teal-300 transition shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xs">
                <Droplet className="w-4.5 h-4.5" />
                <span>Blood Glucose (CGM)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                In Target Window
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{wearableData.bloodGlucose}</span>
                <span className="text-xs font-bold text-slate-500">mmol/L</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200/60">
                <span>Target Window:</span>
                <span className="font-bold text-slate-700">4.4 – 7.0 mmol/L ({wearableData.glucoseTrend})</span>
              </div>
            </div>
          </div>

          {/* 3. Blood Oxygen Saturation (SpO2) */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 hover:border-teal-300 transition shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-600 font-extrabold text-xs">
                <Activity className="w-4.5 h-4.5" />
                <span>Oxygen Saturation (SpO₂)</span>
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                Optimal
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{wearableData.spo2}%</span>
                <span className="text-xs font-bold text-slate-500">Pulse Oximetry</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200/60">
                <span>Nighttime Drop Alert:</span>
                <span className="font-bold text-emerald-600">None detected (&gt;95%)</span>
              </div>
            </div>
          </div>

          {/* 4. Daily Steps */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 hover:border-teal-300 transition shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-xs">
                <Footprints className="w-4.5 h-4.5" />
                <span>Daily Steps Count</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                84% of Goal
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{wearableData.steps.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500">/ 10,000 steps</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (wearableData.steps / wearableData.stepGoal) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 5. Sleep Duration & Quality */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 hover:border-teal-300 transition shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs">
                <Moon className="w-4.5 h-4.5" />
                <span>Sleep Duration & Quality</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Score: {wearableData.sleepScore}/100
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{wearableData.sleepDuration}</span>
                <span className="text-xs font-bold text-slate-500">Restorative Sleep</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200/60">
                <span>Deep: {wearableData.deepSleep}</span>
                <span>REM: {wearableData.remSleep}</span>
              </div>
            </div>
          </div>

          {/* 6. Active Energy & Calories Burned */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 hover:border-teal-300 transition shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-600 font-extrabold text-xs">
                <Flame className="w-4.5 h-4.5" />
                <span>Daily Calories Burned</span>
              </div>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                Active Burn
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{wearableData.activeCalories}</span>
                <span className="text-xs font-bold text-slate-500">kcal (Active)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200/60">
                <span>Total Daily Burn:</span>
                <span className="font-bold text-slate-700">{wearableData.totalCalories} kcal</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Health Trend Insights & Summaries (Clean Amber/Yellow Palette) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">Health Trend Insights</h3>
                <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                  Clinical Summary
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of your continuous smartwatch readings and daily body metrics.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSetScreen('schedule-appointment')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-xl transition cursor-pointer self-stretch sm:self-auto justify-center shadow-xs"
          >
            <span>Consult Doctor</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Clinical Observation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Heart Rate Pattern Advisory */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                Health Notice
              </span>
              <span className="text-xs text-slate-500 font-mono">Today</span>
            </div>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              "Your average resting heart rate was slightly elevated (&gt; 85 bpm) today. Remember to stay well-hydrated and ensure adequate rest. Consider scheduling a routine checkup if symptoms persist."
            </p>
            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Metric: Resting Heart Rate</span>
              <button
                type="button"
                onClick={() => onSetScreen('schedule-appointment')}
                className="text-amber-800 hover:text-amber-900 font-bold underline cursor-pointer"
              >
                Book Checkup →
              </button>
            </div>
          </div>

          {/* Card 2: Biometric Stability & Oxygen Indices */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                Weekly Clinical Review
              </span>
              <span className="text-xs text-slate-500 font-mono">Past 7 Days</span>
            </div>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              "Pulse oximetry maintained a stable average of 98% throughout nighttime and active cycles. Daily recovery intervals align consistently with normal physiological parameters."
            </p>
            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Clinical Status: Stable Baseline</span>
              <span className="text-amber-900 font-bold">Within Expected Range</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
