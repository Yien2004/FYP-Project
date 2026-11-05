import React, { useState } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Clock, 
  Search, 
  Settings,
  Flame,
  Wifi,
  LogOut,
  Bell,
  Menu
} from 'lucide-react';
import { PortalType } from '../types';

interface HeaderProps {
  portal: PortalType;
  title: string;
  activeStatusText?: string;
  onSearchChange?: (val: string) => void;
  searchValue?: string;
  onLogout?: () => void;
  userName?: string;
  userRole?: string;
  userDepartment?: string;
  userSubTitle?: string;
  onSetTab?: (tab: any) => void;
  alertCount?: number;
  onRefreshBadges?: () => void;
  onMenuToggle?: () => void;
}

export default function Header({
  portal,
  title,
  activeStatusText = 'Clinic Operations Steady',
  onSearchChange,
  searchValue = '',
  onLogout,
  userName = 'Staff Member',
  userRole = 'Clinician',
  userDepartment,
  userSubTitle,
  onSetTab,
  alertCount = 0,
  onRefreshBadges,
  onMenuToggle
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-neutral-200/80 px-4 lg:px-8 py-5 flex items-center justify-between shrink-0 font-sans select-none">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button 
            onClick={onMenuToggle}
            className="block lg:hidden p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
        )}
        
        {/* Title Block */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h2>
            {userDepartment && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                Department: {userDepartment}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Global Clinical Context Telemetry / Search Panel / User Profile */}
      <div className="flex items-center gap-6">
        {/* Search Input if needed */}
        {onSearchChange !== undefined && (
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search records, diagnoses, patients..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm text-neutral-800 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all w-64 h-10"
            />
          </div>
        )}

        {/* Bell & Settings consistent with Patient dashboard */}
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => onSetTab?.('notifications')}
            className="relative p-2.5 hover:bg-neutral-100 text-neutral-600 hover:text-sky-600 rounded-xl transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center ring-2 ring-white">
                {alertCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => onSetTab?.('settings')}
            className="p-2.5 hover:bg-neutral-100 text-neutral-500 hover:text-sky-600 rounded-xl transition cursor-pointer"
            title={portal === 'admin' ? "Admin Settings" : "Staff Settings"}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Doctor Name on Top Right */}
          <div 
            onClick={() => onSetTab?.('settings')}
            className="flex items-center gap-2.5 pl-3 border-l border-neutral-200/80 cursor-pointer"
            title="Clinician Profile"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              {userName ? userName.replace(/^(dr\.|dato' dr\.)\s*/i, "").trim().charAt(0).toUpperCase() : 'D'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-neutral-800 block leading-tight">
                {userName || (portal === 'admin' ? 'Administrator' : 'Dr. Ainol Shareha')}
              </span>
              {portal !== 'admin' && userRole && (
                <span className="text-[10px] text-neutral-400 block font-medium leading-none mt-0.5">
                  {userRole}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
