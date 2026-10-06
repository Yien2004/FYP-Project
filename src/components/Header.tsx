import React from "react";
import { ShieldCheck, Home, Bell, Settings, Activity } from "lucide-react";
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
    "dashboard": "Outpatient Dashboard",
    "healthcare-analytics": "Clinical Health Analytics",
    "wearable-health": "Wearable Vitals Telemetry",
    "ai-consultation": "Health Assistant",
    "medical-records": "Electronic Medical Records (EMR)",
    "communication": "Direct Clinical Messages",
    "schedule-appointment": "Schedule Specialist Consultation",
    "appointments-history": "Consultation History & Past Visits",
    "clinic-search": "Penang Clinic & Hospital Finder",
    "fetching-transit": "Clinic & Hospital Ride Booking",
    "patient-registration": "Patient Demographic Verification",
    "notifications": "Notifications & Reminders",
    "user-settings": "Account Security & Preferences"
  };

  return (
    <header id="portal-header" className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/90 px-6 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-md shadow-xs">
      
      {/* Left: Brand mark & breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={onNavigateHome}
          className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          title="Return to Public Home Page"
        >
          <Home className="w-4 h-4 text-slate-600" />
          <span className="hidden md:inline font-sans">Home</span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 shrink-0"></div>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight truncate">
            {screenDisplayNames[currentScreen] || "Patient Care Space"}
          </h2>
        </div>
      </div>

      {/* Right: Notifications, settings & patient chip */}
      <div className="flex items-center gap-3 shrink-0">
        <button 
          onClick={() => onSetScreen("notifications")}
          className="relative p-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 text-slate-600 hover:text-sky-700 rounded-xl transition cursor-pointer shadow-xs"
          title="View Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadNotificationsOfCategory.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadNotificationsOfCategory.length}
            </span>
          )}
        </button>

        <button 
          onClick={() => onSetScreen("user-settings")}
          className="p-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 text-slate-600 hover:text-sky-700 rounded-xl transition cursor-pointer shadow-xs hidden sm:flex"
          title="Account Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>

        <div 
          onClick={() => onSetScreen("user-settings")}
          className="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
            {patientName ? patientName.trim().charAt(0).toUpperCase() : "P"}
          </div>
          <div className="hidden md:block text-left">
            <span className="text-xs font-bold text-slate-800 block leading-tight truncate max-w-[130px]">
              {patientName || "Patient"}
            </span>
          </div>
        </div>
      </div>

    </header>
  );
}
