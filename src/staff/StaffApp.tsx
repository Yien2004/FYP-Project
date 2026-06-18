import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StaffDashboard from './components/sections/StaffDashboard';
import ReportsSection from './components/sections/ReportsSection';
import PatientsSection from './components/sections/PatientsSection';
import AppointmentsSection from './components/sections/AppointmentsSection';
import StaffSettings from './components/sections/StaffSettings';
import CommunicationSection from './components/sections/CommunicationSection';
import NotificationsSection from './components/sections/NotificationsSection';
import StaffNotificationsInbox from './components/sections/StaffNotificationsInbox';
import ScheduleManager from './components/sections/ScheduleManager';
import Authentication from './components/Authentication';
import { StaffTab } from './types';
import { Volume2, X } from 'lucide-react';
import DataAnalyticsSection from './components/sections/DataAnalyticsSection';

interface StaffAppProps {
  onBackToPatientPortal?: () => void;
  initialEmail?: string;
  initialRole?: string;
  initialName?: string;
}

function getClinicFromEmail(email: string): string {
  const emailLower = (email || '').toLowerCase().trim();
  if (emailLower.includes('hospitalpulaupinang')) return 'Hospital Pulau Pinang';
  if (emailLower.includes('hospitalseberangjaya')) return 'Hospital Seberang Jaya';
  if (emailLower.includes('kkjalanperak')) return 'Klinik Kesihatan Jalan Perak';
  if (emailLower.includes('kkbayanbaru')) return 'Klinik Kesihatan Bayan Baru';
  if (emailLower.includes('hospitalbukitmertajam')) return 'Hospital Bukit Mertajam';
  if (emailLower.includes('pantaihospital')) return 'Pantai Hospital Penang';
  if (emailLower.includes('lamwahee')) return 'Hospital Lam Wah Ee';
  if (emailLower.includes('gleneagleshospital')) return 'Gleneagles Hospital Penang';
  if (emailLower.includes('islandhospital')) return 'Island Hospital';
  if (emailLower.includes('o2klinik')) return 'O2 Klinik';
  if (emailLower.includes('kliniksingapore')) return 'Klinik Singapore';
  if (emailLower.includes('poliklinikperdana')) return 'Poliklinik Perdana';
  if (emailLower.includes('penangadventisthospital')) return 'Penang Adventist Hospital';
  if (emailLower.includes('lohguanlye')) return 'Loh Guan Lye Specialists Centre';
  if (emailLower.includes('kpjpenang')) return 'KPJ Penang Specialist Hospital';
  return '';
}

const appTranslations: Record<string, Record<string, string>> = {
  "English": {
    "Staff Operations & Triage": "Staff Operations & Triage",
    "Appointment Matrix Control": "Appointment Matrix Control",
    "Patient Directory records": "Patient Directory records",
    "Clinician Schedule & Availability": "Clinician Schedule & Availability",
    "Secure Encrypted Communications": "Secure Encrypted Communications",
    "System Notifications Inbox": "System Notifications Inbox",
    "Patient Broadcast Sender": "Patient Broadcast Sender",
    "Clinical Data Analytics & Reports": "Clinical Data Analytics & Reports",
    "Profile & Account Settings": "Profile & Account Settings",
    "Steady Clinical Load": "Steady Clinical Load"
  },
  "Bahasa Malaysia": {
    "Staff Operations & Triage": "Operasi & Triage Kakitangan",
    "Appointment Matrix Control": "Kawalan Matriks Temujanji",
    "Patient Directory records": "Rekod Direktori Pesakit",
    "Clinician Schedule & Availability": "Jadual & Ketersediaan Kakitangan",
    "Secure Encrypted Communications": "Komunikasi Selamat Terenkripsi",
    "System Notifications Inbox": "Peti Masuk Pemberitahuan Sistem",
    "Patient Broadcast Sender": "Penghantar Hebahan Pesakit",
    "Clinical Data Analytics & Reports": "Analisis Data & Laporan Klinikal",
    "Profile & Account Settings": "Tetapan Profil & Akaun",
    "Steady Clinical Load": "Beban Klinikal Stabil"
  },
  "中文 (Chinese)": {
    "Staff Operations & Triage": "员工运营与分诊",
    "Appointment Matrix Control": "预约矩阵控制",
    "Patient Directory records": "患者档案记录",
    "Clinician Schedule & Availability": "医生排班与可用性",
    "Secure Encrypted Communications": "安全加密通信",
    "System Notifications Inbox": "系统通知收件箱",
    "Patient Broadcast Sender": "患者广播发送器",
    "Clinical Data Analytics & Reports": "临床数据分析与报告",
    "Profile & Account Settings": "个人资料与账户设置",
    "Steady Clinical Load": "临床负载稳定"
  }
};

export default function StaffApp({
  onBackToPatientPortal,
  initialEmail = '',
  initialRole = '',
  initialName = '',
}: StaffAppProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (initialEmail) return true;
    return localStorage.getItem("lifelink_logged") === "true";
  });
  const [userEmail, setUserEmail] = useState(() => {
    return initialEmail || localStorage.getItem("lifelink_user_email") || '';
  });
  const [userRole, setUserRole] = useState(() => {
    return initialRole || localStorage.getItem("lifelink_user_role") || '';
  });
  const [userName, setUserName] = useState(() => {
    return initialName || localStorage.getItem("lifelink_user_name") || 'Staff Member';
  });

  const [staffTab, setStaffTab] = useState<StaffTab>('dashboard');

  // Badge state
  const [unreadCount, setUnreadCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  // Active language
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('lifelink_staff_language') || 'English';
  });

  const translateApp = (key: string) => {
    return appTranslations[language]?.[key] || key;
  };

  // Intercom paging alert state
  const [activeIntercomCall, setActiveIntercomCall] = useState<string | null>(null);

  const handleCallPatientGlobal = (name: string) => {
    setActiveIntercomCall(name);
    setTimeout(() => {
      setActiveIntercomCall(null);
    }, 5000);
  };

  // Polling helper for dynamic badge counts
  const fetchBadgeCounts = React.useCallback(() => {
    const loggedEmail = userEmail || localStorage.getItem("lifelink_user_email") || '';

    // 1. Fetch unread messages thread count
    fetch("/api/messages/threads")
      .then(res => res.json())
      .then(threadsList => {
        if (!Array.isArray(threadsList)) return;
        
        let count = 0;
        threadsList.forEach((t: any) => {
          const lastMsg = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
          if (lastMsg && (lastMsg.sender === 'user' || lastMsg.sender === 'patient')) {
            const lastMsgId = lastMsg.id || lastMsg.timestamp || '';
            const lastReadId = localStorage.getItem('chat_last_read_' + t.id) || '';
            if (lastMsgId !== lastReadId) {
              count++;
            }
          }
        });
        setUnreadCount(count);
      })
      .catch(err => console.warn("Failed to fetch threads for badges", err));

    // 2. Fetch unreplied alerts count
    fetch("/api/logs")
      .then(res => res.json())
      .then(logsList => {
        if (!Array.isArray(logsList)) return;
        
        let repliedMap: Record<string, string> = {};
        try {
          const saved = localStorage.getItem("staff-replied-alarms");
          if (saved) repliedMap = JSON.parse(saved);
        } catch (e) {}

        const alarmLogs = logsList.filter(log => {
          const msg = (log.message || "").toLowerCase();
          return log.level === "error" || log.level === "warn" || msg.includes("critical") || msg.includes("alarm") || msg.includes("alert");
        });

        const unreplied = alarmLogs.filter((log, idx) => {
          const alarmId = log.id || `alarm-${idx}`;
          return !repliedMap[alarmId];
        }).length;

        // Fetch unread broadcasts targeting staff
        let readBroadcasts: string[] = [];
        try {
          const saved = localStorage.getItem("staff-read-broadcasts");
          if (saved) readBroadcasts = JSON.parse(saved);
        } catch (e) {}

        const staffBroadcasts = logsList.filter(log => {
          const msg = log.message || "";
          if (!msg.startsWith("[Broadcast]:")) return false;
          return msg.includes("(All Users)") || msg.includes("(All Staff)");
        });

        const unreadBroadcastsCount = staffBroadcasts.filter(b => {
          const bId = b.id || b.timestamp || '';
          return !readBroadcasts.includes(String(bId));
        }).length;

        setAlertCount(unreplied + unreadBroadcastsCount);
      })
      .catch(err => console.warn("Failed to fetch logs for badges", err));
  }, [userEmail]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchBadgeCounts();
      const interval = setInterval(fetchBadgeCounts, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchBadgeCounts]);

  // Sync state on load
  useEffect(() => {
    if (initialEmail) {
      localStorage.setItem("lifelink_user_email", initialEmail);
      localStorage.setItem("lifelink_user_role", initialRole);
      localStorage.setItem("lifelink_user_name", initialName);
      localStorage.setItem("lifelink_logged", "true");
      return;
    }
    const cachedEmail = localStorage.getItem("lifelink_user_email");
    const cachedRole = localStorage.getItem("lifelink_user_role");
    const cachedName = localStorage.getItem("lifelink_user_name");
    const cachedLogged = localStorage.getItem("lifelink_logged") === "true";

    if (cachedLogged && cachedEmail && cachedRole) {
      setUserEmail(cachedEmail);
      setUserRole(cachedRole);
      setUserName(cachedName || 'Staff Member');
      setIsLoggedIn(true);
      setStaffTab('dashboard');
    }
  }, [initialEmail, initialRole, initialName]);

  const handleLoginSuccess = (email: string, role: string, name: string) => {
    localStorage.setItem("lifelink_user_email", email);
    localStorage.setItem("lifelink_user_role", role);
    localStorage.setItem("lifelink_user_name", name);
    localStorage.setItem("lifelink_logged", "true");

    setUserEmail(email);
    setUserRole(role);
    setUserName(name);
    setIsLoggedIn(true);

    setStaffTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem("lifelink_user_email");
    localStorage.removeItem("lifelink_user_role");
    localStorage.removeItem("lifelink_user_name");
    localStorage.removeItem("lifelink_logged");

    setUserEmail('');
    setUserRole('');
    setUserName('');
    setIsLoggedIn(false);

    if (onBackToPatientPortal) {
      onBackToPatientPortal();
    }
  };

  const getPageTitle = () => {
    const titles: { [id in StaffTab]: string } = {
      dashboard: translateApp('Staff Operations & Triage'),
      appointments: translateApp('Appointment Matrix Control'),
      patients: translateApp('Patient Directory records'),
      schedule: translateApp('Clinician Schedule & Availability'),
      communication: translateApp('Secure Encrypted Communications'),
      notifications: translateApp('System Notifications Inbox'),
      send_notifications: translateApp('Patient Broadcast Sender'),
      analytics: translateApp('Clinical Data Analytics & Reports'),
      settings: translateApp('Profile & Account Settings')
    };
    return titles[staffTab];
  };

  const getStatusText = () => {
    if (activeIntercomCall) {
      return `Paging client [${activeIntercomCall}] on intercom channel`;
    }
    return translateApp('Steady Clinical Load');
  };

  // Guard: Show login page first
  if (!isLoggedIn) {
    return (
      <Authentication
        onLoginSuccess={handleLoginSuccess}
        onBackToPatientPortal={onBackToPatientPortal}
        allowedRoles={['Doctor', 'Nurse']}
        portalName="Staff Portal"
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans antialiased text-sm">
      
      {/* Global Interactive Paging Intercom Overlay */}
      {activeIntercomCall && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-neutral-900 text-white rounded-2xl border border-neutral-800 shadow-2xl p-5 flex items-start gap-4 transition-all duration-300 animate-slideUp">
          <div className="bg-red-500/15 text-red-500 p-2.5 rounded-xl border border-red-500/20 shrink-0">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Lobby Audio Intercom</span>
              <button 
                onClick={() => setActiveIntercomCall(null)} 
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="font-bold text-sm mt-1.5 leading-snug">Paging: {activeIntercomCall}</p>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-sans">Verifying patient walk-in route vector coordinates...</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        portal="staff" 
        hidePortalSwitcher
        setPortal={() => {}}
        staffTab={staffTab}
        setStaffTab={setStaffTab}
        adminTab="dashboard"
        setAdminTab={() => {}}
        unreadCount={unreadCount}
        alertCount={alertCount}
        userName={userName}
        onLogout={handleLogout}
        language={language}
      />

      {/* Right Content Space */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        
        {/* Dynamic Telemetry Header */}
        <Header 
          portal="staff" 
          title={getPageTitle()} 
          activeStatusText={getStatusText()}
          onLogout={handleLogout}
          userName={userName}
          userRole={userRole}
          onSetTab={setStaffTab}
          alertCount={alertCount}
          onRefreshBadges={fetchBadgeCounts}
        />

        {/* Dynamic Views Slot */}
        <main className="flex-1 overflow-y-auto p-8 bg-neutral-50/40">
          <div className="max-w-[1450px] mx-auto min-h-full">
            {staffTab === 'dashboard' && <StaffDashboard onCallPatient={handleCallPatientGlobal} />}
            {staffTab === 'appointments' && <AppointmentsSection />}
            {staffTab === 'patients' && <PatientsSection />}
            {staffTab === 'schedule' && <ScheduleManager doctorName={userName} />}
            {staffTab === 'communication' && <CommunicationSection />}
            {staffTab === 'notifications' && <StaffNotificationsInbox alertCount={alertCount} onRefreshBadges={fetchBadgeCounts} />}
            {staffTab === 'send_notifications' && <NotificationsSection />}
            {staffTab === 'analytics' && <DataAnalyticsSection />}
            {staffTab === 'settings' && <StaffSettings language={language} setLanguage={setLanguage} />}
          </div>
        </main>
      </div>

    </div>
  );
}
