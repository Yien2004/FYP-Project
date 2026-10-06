import React from "react";
import { 
  MapPin, 
  Bot, 
  Calendar, 
  FolderHeart, 
  Sliders, 
  LogOut, 
  Home, 
  MessageSquare, 
  TrendingUp, 
  Car, 
  Watch, 
  Activity 
} from "lucide-react";
import { AppNotification, PatientProfile } from "../types";

interface SidebarProps {
  currentScreen: string;
  onSetScreen: (screen: string) => void;
  notifications: AppNotification[];
  onLogout: () => void;
  patientProfile: PatientProfile;
  unreadMessagesCount?: number;
}

const translations: Record<string, Record<string, string>> = {
  "English": {
    "Home": "Home",
    "Health Analytics": "Health Analytics",
    "Book Appointment": "Book Appointment",
    "AI Consultation": "AI Consultation",
    "My Appointments": "My Appointments",
    "Clinic Locator": "Clinic Locator",
    "Fetching Transit": "Fetching Transit",
    "Messages": "Messages",
    "Profile": "Profile",
    "Sign Out": "Sign Out",
    "Emergency": "Emergency",
    "Patient": "Patient"
  },
  "Bahasa Malaysia": {
    "Home": "Utama",
    "Health Analytics": "Analisis Kesihatan",
    "Book Appointment": "Tempah Temujanji",
    "AI Consultation": "Konsultasi AI",
    "My Appointments": "Temujanji Saya",
    "Clinic Locator": "Pencari Klinik",
    "Fetching Transit": "Transit Pengambilan",
    "Messages": "Mesej",
    "Profile": "Profil",
    "Sign Out": "Log Keluar",
    "Emergency": "Kecemasan",
    "Patient": "Pesakit"
  }
};

export default function Sidebar({ currentScreen, onSetScreen, notifications, onLogout, patientProfile, unreadMessagesCount = 0 }: SidebarProps) {
  const patientName = patientProfile.fullName;
  const lang = patientProfile.language || "English";

  const t = (key: string) => {
    return translations[lang]?.[key] || key;
  };

  const navSections = [
    {
      title: "Outpatient Care",
      items: [
        { id: "dashboard", label: "Home", icon: <Home className="w-4.5 h-4.5" /> },
        { id: "schedule-appointment", label: "Book Appointment", icon: <Calendar className="w-4.5 h-4.5" /> },
        { id: "clinic-search", label: "Clinic Locator", icon: <MapPin className="w-4.5 h-4.5" /> },
        { id: "fetching-transit", label: "Ride Booking", icon: <Car className="w-4.5 h-4.5" /> },
      ]
    },
    {
      title: "Clinical Telemetry & AI",
      items: [
        { id: "healthcare-analytics", label: "Health Analytics", icon: <TrendingUp className="w-4.5 h-4.5" /> },
        { id: "wearable-health", label: "Wearable Monitor", icon: <Watch className="w-4.5 h-4.5" /> },
        { id: "ai-consultation", label: "AI Consultation", icon: <Bot className="w-4.5 h-4.5" /> },
      ]
    },
    {
      title: "Records & Account",
      items: [
        { id: "appointments-history", label: "My Appointments", icon: <FolderHeart className="w-4.5 h-4.5" /> },
        { id: "communication", label: "Messages", icon: <MessageSquare className="w-4.5 h-4.5" />, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
        { id: "user-settings", label: "Profile", icon: <Sliders className="w-4.5 h-4.5" /> },
      ]
    }
  ];

  let nationalityDisplay = patientProfile.nationality || "Malaysian";
  if (nationalityDisplay === "Malaysia Client" || nationalityDisplay === "Malaysian Patient" || nationalityDisplay === "MY DATA_OK") {
    nationalityDisplay = "Malaysian";
  }

  return (
    <aside id="portal-sidebar" className="w-64 bg-white border-r border-slate-200 text-slate-700 font-sans flex flex-col justify-between py-6 shrink-0 relative shadow-xs">
      
      <div className="space-y-5">
        {/* Brand Banner - Previous Logo and Name Only */}
        <div className="px-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 text-lg tracking-tight block">
            Penang<span className="text-sky-600">Health</span>
          </span>
        </div>

        {/* Navigation list grouped by clinical sections */}
        <nav className="space-y-4 px-3 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 font-mono tracking-wider px-3 block mb-1">
                {section.title}
              </span>
              {section.items.map((item) => {
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSetScreen(item.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center justify-between transition-all group cursor-pointer ${
                      isActive 
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/15' 
                        : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'} transition-colors`}>
                        {item.icon}
                      </span>
                      <span>{t(item.label)}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="bg-rose-600 text-white rounded-full px-1.5 py-0.5 text-[9px] font-black font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Logout footer block */}
      <div className="px-4 space-y-2 pt-3 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className="w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
        >
          <LogOut className="w-4 h-4" />
          <span>{t("Sign Out")}</span>
        </button>


      </div>
    </aside>
  );
}
