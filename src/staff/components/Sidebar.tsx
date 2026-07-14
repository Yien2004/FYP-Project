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
  X
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
  hidePortalSwitcher?: boolean;
  userName?: string;
  onLogout?: () => void;
  language?: string;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

const translations: Record<string, Record<string, string>> = {
  "English": {
    "Dashboard": "Dashboard",
    "Appointments": "Appointments",
    "Patient Directory": "Patient Directory",
    "Schedule Manager": "Schedule Manager",
    "Communication": "Communication",
    "Notifications": "Notifications",
    "Settings": "Settings",
    "System Overview": "System Overview",
    "User Directory": "User Directory",
    "Scheduling Matrix": "Scheduling Matrix",
    "Reports & Logs": "Reports & Logs",
    "Settings & Rules": "Settings & Rules",
    "Clinical Workspace": "Clinical Workspace",
    "Core Infrastructure": "Core Infrastructure",
    "Secure Sign Out": "Secure Sign Out",
    "Support Suite": "Support Suite",
    "Data Analytics": "Data Analytics",
    "Staff Accounts": "Staff Accounts",
    "Chat Audits": "Chat Audits",
    "Problem Inbox": "Problem Inbox",
    "Create Notification": "Create Notification",
    "Send Notification": "Send Notification"
  },
  "Bahasa Malaysia": {
    "Dashboard": "Papan Pemuka",
    "Appointments": "Temujanji",
    "Patient Directory": "Direktori Pesakit",
    "Schedule Manager": "Pengurus Jadual",
    "Communication": "Komunikasi",
    "Notifications": "Pengumuman",
    "Settings": "Tetapan",
    "System Overview": "Gambaran Keseluruhan",
    "User Directory": "Direktori Pengguna",
    "Scheduling Matrix": "Matriks Penjadualan",
    "Reports & Logs": "Laporan & Log",
    "Settings & Rules": "Tetapan & Peraturan",
    "Clinical Workspace": "Ruang Kerja Klinikal",
    "Core Infrastructure": "Infrastruktur Teras",
    "Secure Sign Out": "Log Keluar Selamat",
    "Support Suite": "Suite Sokongan",
    "Data Analytics": "Analisis Data",
    "Staff Accounts": "Akaun Kakitangan",
    "Chat Audits": "Audit Sembang",
    "Problem Inbox": "Peti Masuk Masalah",
    "Create Notification": "Buat Pemberitahuan",
    "Send Notification": "Hantar Pemberitahuan"
  },
  "中文 (Chinese)": {
    "Dashboard": "仪表板",
    "Appointments": "预约管理",
    "Patient Directory": "患者档案",
    "Schedule Manager": "排班管理",
    "Communication": "在线沟通",
    "Notifications": "系统通知",
    "Settings": "系统设置",
    "System Overview": "系统总览",
    "User Directory": "用户目录",
    "Scheduling Matrix": "排班矩阵",
    "Reports & Logs": "报告与日志",
    "Settings & Rules": "设置与规则",
    "Clinical Workspace": "临床工作区",
    "Core Infrastructure": "核心基础设施",
    "Secure Sign Out": "安全登出",
    "Support Suite": "技术支持",
    "Data Analytics": "数据分析",
    "Staff Accounts": "员工账户",
    "Chat Audits": "聊天审计",
    "Problem Inbox": "问题收件箱",
    "Create Notification": "创建通知",
    "Send Notification": "发送通知"
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
  hidePortalSwitcher = false,
  userName = 'Staff Member',
  onLogout,
  language = 'English',
  mobileMenuOpen = false,
  onCloseMobileMenu,
}: SidebarProps) {
  const t = (key: string) => {
    return translations[language]?.[key] || key;
  };

  const staffMenu: { id: StaffTab; label: string; icon: React.FC<any>; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patient Directory', icon: Users },
    { id: 'schedule', label: 'Schedule Manager', icon: Clock },
    { id: 'communication', label: 'Communication', icon: MessageSquare, count: unreadCount },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: alertCount },
    { id: 'send_notifications', label: 'Send Notification', icon: Send },
    { id: 'analytics', label: 'Data Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminMenu: { id: AdminTab; label: string; icon: React.FC<any>; count?: number }[] = [
    { id: 'dashboard', label: 'System Overview', icon: LayoutDashboard },
    { id: 'staff', label: 'Staff Accounts', icon: Users, count: pendingStaffCount },
    { id: 'patients', label: 'User Directory', icon: Users },
    { id: 'appointments', label: 'Scheduling Matrix', icon: Calendar },
    { id: 'chats', label: 'Chat Audits', icon: MessageSquare },
    { id: 'reports', label: 'Reports & Logs', icon: Activity },
    { id: 'problems', label: 'Problem Inbox', icon: ShieldAlert },
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

      <div className={`w-72 bg-slate-100 border-r border-slate-200 text-slate-900 flex flex-col h-full shrink-0 select-none font-sans justify-between
        fixed lg:static inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`
      }>
        {/* Brand Section */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center shadow-md shadow-teal-500/30 shrink-0">
                <Activity className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-md tracking-tight block">
                  Penang<span className="text-teal-600">Health</span>
                </span>
                <span className="text-[9px] text-teal-655 font-mono tracking-widest uppercase font-bold block leading-none mt-0.5">MOH MALAYSIA</span>
              </div>
            </div>
            {onCloseMobileMenu && (
              <button 
                onClick={onCloseMobileMenu}
                className="block lg:hidden p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-550 hover:text-neutral-800 transition cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
  
          {/* Portal Switcher Tabs */}
          {!hidePortalSwitcher && (
            <div className="px-5 pt-5 pb-3">
              <div className="bg-white p-1 rounded-xl flex gap-1 border border-slate-200 shadow-sm">
                <button
                  id="sidebar-portal-toggle-staff"
                  onClick={() => {
                    setPortal('staff');
                    onCloseMobileMenu?.();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    portal === 'staff' 
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20' 
                      : 'text-slate-655 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Clinical Staff
                </button>
                <button
                  id="sidebar-portal-toggle-admin"
                  onClick={() => {
                    setPortal('admin');
                    onCloseMobileMenu?.();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    portal === 'admin' 
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20' 
                      : 'text-slate-655 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sys Admin
                </button>
              </div>
            </div>
          )}
  
          {/* Doctor Summary Card */}
          <div className="px-5 pt-4 pb-2">
            <div className="bg-white border border-slate-205 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-extrabold text-xs shrink-0 select-none">
                {userName ? userName.replace("Dr. ", "")[0] : "D"}
              </div>
              <div className="overflow-hidden">
                <span className="font-extrabold text-slate-900 text-xs block leading-tight truncate">
                  {userName || "Staff Member"}
                </span>
                <span className="text-[9px] text-teal-655 block font-mono mt-0.5 font-bold uppercase tracking-wider">
                  {portal === 'admin' ? 'System Administrator' : 'Pantai Hospital Staff'}
                </span>
              </div>
            </div>
          </div>
  
          {/* Navigation Menu */}
          <div className="px-3 py-4 flex flex-col gap-1.5" id="sidebar-nav-menu">
            <p className="px-3 text-[10px] font-bold text-neutral-550 tracking-wider uppercase mb-2">
              {portal === 'staff' ? t('Clinical Workspace') : t('Core Infrastructure')}
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
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-50 text-teal-600 border-l-[3px] border-teal-500 pl-[11px]'
                        : 'text-slate-605 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComp className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-neutral-450'}`} />
                      <span>{t(item.label)}</span>
                    </div>
                    {item.count && item.count > 0 ? (
                      <span className="bg-teal-500/20 text-teal-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
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
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-sky-50 text-sky-600 border-l-[3px] border-sky-500 pl-[11px]'
                        : 'text-slate-605 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComp className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-neutral-450'}`} />
                      <span>{t(item.label)}</span>
                    </div>
                    {item.count && item.count > 0 ? (
                      <span className="bg-sky-500/20 text-sky-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
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
      <div className="p-4 border-t border-slate-200 flex flex-col gap-3 bg-white">
        {/* Secure Logout button at the bottom left */}
        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold leading-none flex items-center gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer border border-transparent hover:border-red-200/50"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("Secure Sign Out")}</span>
          </button>
        )}

        {/* Bottom Utility Controls */}
        <div className="flex items-center justify-between px-2 text-xs text-neutral-500">
          <div className="flex items-center gap-1 hover:text-neutral-700 cursor-pointer transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t("Support Suite")}</span>
          </div>
          <span className="text-[10px] text-neutral-600 font-mono">v4.14-Prod</span>
        </div>
      </div>
    </div>
  </>
  );
}
