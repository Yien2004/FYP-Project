import React from "react";
import { ShieldCheck, Heart, ArrowLeft, Bell, Settings, Info } from "lucide-react";
import { AppNotification } from "../types";

interface HeaderProps {
  currentScreen: string;
  onNavigateHome: () => void;
  notifications: AppNotification[];
  onSetScreen: (screen: string) => void;
  patientName: string;
}

export default function Header({ currentScreen, onNavigateHome, notifications, onSetScreen, patientName }: HeaderProps) {
  const unreadNotificationsOfCategory = notifications.filter(n => !n.read);

  const screenDisplayNames: Record<string, string> = {
    "dashboard": "Universal Patient Dashboard",
    "ai-consultation": "Carey AI Health Assistant",
    "medical-records": "Biometrics EHR & Diagnoses",
    "communication": "Provider secure messages",
    "schedule-appointment": "Schedule Consult",
    "appointments-history": "Consultation logs",
    "clinic-search": "Clinic locator & map",
    "patient-registration": "MyKad Card Registry",
    "notifications": "Important alerts index",
    "user-settings": "Platform security configurations"
  };

  return (
    <header id="portal-header" className="sticky top-0 z-40 bg-slate-50/95 border-b border-slate-200/80 px-8 py-4 flex items-center justify-between backdrop-blur-sm shadow-sm">
      
      {/* Back home gate */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onNavigateHome}
          className="p-2 border border-slate-200/70 bg-white/90 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          title="Return to corporate landing gate"
        >
          <ArrowLeft className="w-4 h-4" /> HOME GATE
        </button>

        <div className="h-6 w-[1px] bg-slate-200"></div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">CarePoint Portal Context</span>
          <h2 className="text-md font-extrabold text-slate-900 leading-none mt-0.5">
            {screenDisplayNames[currentScreen] || "Patient Session Space"}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">

        <button 
          onClick={() => onSetScreen("notifications")}
          className="relative p-2.5 hover:bg-slate-50 text-slate-500 hover:text-teal-600 rounded-xl transition"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsOfCategory.length > 0 && (
            <span className="absolute top-2 right-2 bg-red-650 bg-red-500 w-2.5 h-2.5 rounded-full ring-2 ring-white"></span>
          )}
        </button>

        <button 
          onClick={() => onSetScreen("user-settings")}
          className="p-2.5 hover:bg-slate-50 text-slate-500 hover:text-teal-600 rounded-xl transition"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

    </header>
  );
}
