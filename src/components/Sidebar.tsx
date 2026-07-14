import React from "react";
import { 
  Activity, 
  MapPin, 
  Bot, 
  FileText, 
  Calendar, 
  FolderHeart, 
  Sliders, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  Heart,
  Home,
  MessageSquare,
  TrendingUp,
  Car
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
    "Exit Portal Sessions": "Exit Portal Sessions",
    "Secure Sandbox node v12": "Secure Sandbox node v12",
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
    "Exit Portal Sessions": "Log Keluar Portal",
    "Secure Sandbox node v12": "Nod Sandbox Selamat v12",
    "Patient": "Pesakit"
  }
};

export default function Sidebar({ currentScreen, onSetScreen, notifications, onLogout, patientProfile, unreadMessagesCount = 0 }: SidebarProps) {
  const patientName = patientProfile.fullName;
  const lang = patientProfile.language || "English";

  const t = (key: string) => {
    return translations[lang]?.[key] || key;
  };

  const menuItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    highlight?: boolean;
    badge?: number;
  }> = [
    { id: "dashboard", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "healthcare-analytics", label: "Health Analytics", icon: <TrendingUp className="w-5 h-5" /> },
    { id: "schedule-appointment", label: "Book Appointment", icon: <Calendar className="w-5 h-5" /> },
    { id: "ai-consultation", label: "AI Consultation", icon: <Bot className="w-5 h-5" /> },
    { id: "appointments-history", label: "My Appointments", icon: <FolderHeart className="w-5 h-5" /> },
    { id: "clinic-search", label: "Clinic Locator", icon: <MapPin className="w-5 h-5" /> },
    { id: "fetching-transit", label: "Fetching Transit", icon: <Car className="w-5 h-5" /> },
    { id: "communication", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: "user-settings", label: "Profile", icon: <Sliders className="w-5 h-5" /> }
  ];

  let nationalityDisplay = patientProfile.nationality || "Malaysian";
  if (nationalityDisplay === "Malaysia Client" || nationalityDisplay === "Malaysian Patient" || nationalityDisplay === "MY DATA_OK") {
    nationalityDisplay = "Malaysian";
  }

  return (
    <aside id="portal-sidebar" className="w-64 bg-white border-r border-slate-200 text-slate-700 font-sans flex flex-col justify-between py-6 shrink-0 relative shadow-sm">
      {/* Dynamic background glow */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-teal-200/30 rounded-full blur-2xl pointer-events-none"></div>

      <div className="space-y-6">
        {/* Brand Banner */}
        <div className="px-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center shadow-md shadow-teal-500/30 shrink-0">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-md tracking-tight block">
              Penang<span className="text-teal-600">Health</span>
            </span>
            <span className="text-[9px] text-teal-600 font-mono tracking-widest uppercase font-bold block leading-none mt-0.5">MOH MALAYSIA</span>
          </div>
        </div>

        {/* Small Patient quick summary card */}
        <div className="px-5">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
              {patientName ? patientName[0] : "P"}
            </div>
            <div className="overflow-hidden">
              <span className="font-extrabold text-slate-900 text-xs block leading-tight truncate">{patientName || "Patient"}</span>
              <span className="text-[9px] text-slate-500 block font-mono mt-0.5">{nationalityDisplay} {t("Patient")}</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5 px-3">
          {menuItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSetScreen(item.id)}
                className={`w-full py-2.5 px-4.5 rounded-2xl text-xs font-semibold leading-none flex items-center justify-between transition-all group ${
                  isActive 
                    ? 'bg-teal-600 border border-teal-600 text-white shadow-md shadow-teal-600/10' 
                    : 'bg-transparent text-slate-650 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span>{t(item.label)}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[9px] font-black font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout footer block */}
      <div className="px-3 space-y-4">
        <button 
          onClick={onLogout}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold leading-none flex items-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>{t("Exit Portal Sessions")}</span>
        </button>

        <div className="border-t border-slate-850 pt-4 text-center">
          <span className="text-[10px] text-slate-600 font-mono tracking-wide uppercase font-bold block">{t("Secure Sandbox node v12")}</span>
        </div>
      </div>
    </aside>
  );
}
