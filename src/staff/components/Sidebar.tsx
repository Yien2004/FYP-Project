import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  MessageSquare, 
  Bell, 
  ShieldCheck, 
  Activity, 
  Settings, 
  HelpCircle, 
  LogOut,
  Clock,
  TrendingUp,
  ShieldAlert,
  Megaphone,
  Send,
  X,
  ClipboardCheck,
  CalendarOff,
  CalendarClock
} from 'lucide-react';
import { PortalType, StaffTab, AdminTab } from '../types';

interface SidebarProps {
  portal: PortalType;
  setPortal: (p: PortalType) => void;
  staffTab: StaffTab;
  setStaffTab: (t: StaffTab) => void;
  adminTab: AdminTab;
  setAdminTab: (t: AdminTab) => void;
  unreadCount?: number;
  alertCount?: number;
  pendingStaffCount?: number;
  pendingApprovalsCount?: number;
  hidePortalSwitcher?: boolean;
  userName?: string;
  department?: string;
  onLogout?: () => void;
  language?: string;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  isSuperAdmin?: boolean;
}

const translations: Record<string, Record<string, string>> = {
  "English": {
    "Dashboard": "Dashboard",
    "Appointments": "Appointments",
    "Patient Directory": "Patient Directory",
    "Schedule Manager": "Schedule Manager",
    "Notifications": "Notifications",
    "Settings": "Settings",
    "System Overview": "System Overview",
    "User Directory": "User Directory",
    "Scheduling Matrix": "Scheduling Matrix",
    "Reports & Logs": "Reports & Logs",
    "Settings & Rules": "Settings & Rules",
    "Clinical Workspace": "Clinical Workspace",
    "Branch Administration": "Branch Administration",
    "Group Super Administration": "Group Super Administration",
    "Core Infrastructure": "Branch Administration",
    "Secure Sign Out": "Secure Sign Out",
    "Support Suite": "Support Suite",
    "Data Analytics": "Data Analytics",
    "Staff Accounts": "Doctors & Staff",
    "Create Notification": "Create Notification",
    "Send Notification": "Send Notification",
    "Branch Overview": "Branch Overview",
    "Clinical Approvals": "Clinical Approvals",
    "Holiday & Recess Console": "Holiday & Recess Console",
    "Doctor Rosters": "Doctor Rosters"
  },
  "Bahasa Malaysia": {
    "Dashboard": "Papan Pemuka",
    "Appointments": "Temujanji",
    "Patient Directory": "Direktori Pesakit",
    "Schedule Manager": "Pengurus Jadual",
    "Notifications": "Pengumuman",
    "Settings": "Tetapan",
    "System Overview": "Gambaran Keseluruhan",
    "User Directory": "Direktori Pengguna",
    "Scheduling Matrix": "Matriks Penjadualan",
    "Reports & Logs": "Laporan & Log",
    "Settings & Rules": "Tetapan & Peraturan",
    "Clinical Workspace": "Ruang Kerja Klinikal",
    "Branch Administration": "Pentadbiran Cawangan",
    "Group Super Administration": "Pentadbiran Super Kumpulan",
    "Core Infrastructure": "Pentadbiran Cawangan",
    "Secure Sign Out": "Log Keluar Selamat",
    "Support Suite": "Suite Sokongan",
    "Data Analytics": "Analisis Data",
    "Staff Accounts": "Doktor & Kakitangan",
    "Create Notification": "Buat Pemberitahuan",
    "Send Notification": "Hantar Pemberitahuan",
    "Branch Overview": "Gambaran Cawangan",
    "Clinical Approvals": "Kelulusan Klinikal",
    "Holiday & Recess Console": "Konsol Cuti & Rehat",
    "Doctor Rosters": "Jadual Doktor"
  },
  "中文 (Chinese)": {
    "Dashboard": "仪表板",
    "Appointments": "预约管理",
    "Patient Directory": "患者档案",
    "Schedule Manager": "排班管理",
    "Notifications": "系统通知",
    "Settings": "系统设置",
    "System Overview": "院区总览",
    "User Directory": "患者目录",
    "Scheduling Matrix": "排班矩阵",
    "Reports & Logs": "报告与日志",
    "Settings & Rules": "设置与规则",
    "Clinical Workspace": "临床工作区",
    "Branch Administration": "院区行政管理",
    "Group Super Administration": "集团超级管理员总控",
    "Core Infrastructure": "院区行政管理",
    "Secure Sign Out": "安全登出",
    "Support Suite": "技术支持",
    "Data Analytics": "数据分析",
    "Staff Accounts": "医生与员工",
    "Create Notification": "创建通知",
    "Send Notification": "发送通知",
    "Branch Overview": "院区总览",
    "Clinical Approvals": "临床资质审批",
    "Holiday & Recess Console": "院区节假日阻断",
    "Doctor Rosters": "医生排班号源"
  }
};

export default function Sidebar({
  portal,
  setPortal,
  staffTab,
  setStaffTab,
  adminTab,
  setAdminTab,
  unreadCount = 0,
  alertCount = 0,
  pendingStaffCount = 0,
  pendingApprovalsCount = 0,
  hidePortalSwitcher = false,
  userName = 'Staff Member',
  department,
  onLogout,
  language = 'English',
  mobileMenuOpen = false,
  onCloseMobileMenu,
  isSuperAdmin = false,
}: SidebarProps) {
  const t = (key: string) => {
    return translations[language]?.[key] || key;
  };

  const userRole = (localStorage.getItem("lifelink_user_role") || localStorage.getItem("carepoint_user_role") || "").toLowerCase();
  const isDoctorUser = userRole === "doctor";

  const staffMenu: { id: StaffTab; label: string; icon: React.FC<any>; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patient Directory', icon: Users },
    ...(isDoctorUser ? [{ id: 'schedule' as StaffTab, label: 'Schedule Manager', icon: Clock }] : []),
    { id: 'send_notifications', label: 'Send Notification', icon: Send },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminMenu: { id: AdminTab; label: string; icon: React.FC<any>; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'approvals', label: 'Clinical Approvals', icon: ClipboardCheck, count: pendingApprovalsCount },
    { id: 'holidays', label: 'Holiday & Recess Console', icon: CalendarOff },
    { id: 'rosters', label: 'Doctor Rosters', icon: CalendarClock },
    { id: 'staff', label: isSuperAdmin ? 'Staff & Branch Admins' : 'Staff Accounts', icon: Users, count: pendingStaffCount },
    { id: 'patients', label: 'Patient Directory', icon: Users },
    { id: 'appointments', label: 'Scheduling Matrix', icon: Calendar },
    { id: 'notifications', label: 'Create Notification', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={onCloseMobileMenu}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden transition-opacity"
        />
      )}

      <div className={`w-64 bg-white border-r border-slate-200 text-slate-700 flex flex-col h-full shrink-0 select-none font-sans justify-between
        fixed lg:static inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`
      }>
        {/* Brand Section */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="px-5 py-5 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight block leading-tight">
                  Pantai<span className="text-teal-600">Care</span>
                </span>
              </div>
            </div>
            {onCloseMobileMenu && (
              <button 
                onClick={onCloseMobileMenu}
                className="block lg:hidden p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
  
          {/* Portal Switcher Tabs */}
          {!hidePortalSwitcher && (
            <div className="px-4 pt-4 pb-2">
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200 shadow-2xs">
                <button
                  id="sidebar-portal-toggle-staff"
                  onClick={() => {
                    setPortal('staff');
                    onCloseMobileMenu?.();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    portal === 'staff' 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Staff
                </button>
                <button
                  id="sidebar-portal-toggle-admin"
                  onClick={() => {
                    setPortal('admin');
                    onCloseMobileMenu?.();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    portal === 'admin' 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </button>
              </div>
            </div>
          )}
  
          {/* Navigation Menu */}
          <div className="px-3 py-3 flex flex-col gap-1" id="sidebar-nav-menu">
            <p className="px-3 text-[9px] font-extrabold text-slate-400 font-mono tracking-wider uppercase mb-1">
              {portal === 'staff' ? t('Clinical Workspace') : (isSuperAdmin ? t('Group Super Administration') : t('Branch Administration'))}
            </p>
  
            {portal === 'staff' ? (
              staffMenu.map((item) => {
                const IconComp = item.icon;
                const isActive = staffTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-staff-${item.id}`}
                    onClick={() => {
                      setStaffTab(item.id);
                      onCloseMobileMenu?.();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold leading-none transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/15'
                        : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-600'} transition-colors`} />
                      <span>{t(item.label)}</span>
                    </div>
                    {item.count && item.count > 0 ? (
                      <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-teal-700' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              adminMenu.map((item) => {
                const IconComp = item.icon;
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-admin-${item.id}`}
                    onClick={() => {
                      setAdminTab(item.id);
                      onCloseMobileMenu?.();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold leading-none transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/15'
                        : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'} transition-colors`} />
                      <span>{t(item.label)}</span>
                    </div>
                    {item.count && item.count > 0 ? (
                      <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-sky-700' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

      {/* User / Footer Section */}
      <div className="p-4 border-t border-slate-200 flex flex-col gap-2.5 bg-white">
        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-[11px] font-bold text-teal-800 truncate">
            {department ? `Department: ${department}` : (portal === 'admin' ? 'Administration' : 'Clinical Workspace')}
          </p>
        </div>

        {/* Secure Logout button at the bottom left */}
        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center gap-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer border border-transparent hover:border-red-200/50"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("Secure Sign Out")}</span>
          </button>
        )}
      </div>
    </div>
  </>
  );
}
