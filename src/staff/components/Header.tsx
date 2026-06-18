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
  Bell
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
  onSetTab?: (tab: any) => void;
  alertCount?: number;
  onRefreshBadges?: () => void;
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
  onSetTab,
  alertCount = 0,
  onRefreshBadges
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs");
      const logsList = await res.json();
      if (Array.isArray(logsList)) {
        let repliedMap: Record<string, boolean> = {};
        try {
          const saved = localStorage.getItem("staff-replied-alarms");
          if (saved) repliedMap = JSON.parse(saved);
        } catch (e) {}

        const alarmLogs = logsList.filter((log: any) => {
          const msg = (log.message || "").toLowerCase();
          return log.level === "error" || log.level === "warn" || msg.includes("critical") || msg.includes("alarm") || msg.includes("alert");
        });

        const unreplied = alarmLogs.filter((log, idx) => {
          const alarmId = log.id || `alarm-${idx}`;
          return !repliedMap[alarmId];
        });
        setActiveAlerts(unreplied);
      }
    } catch (err) {
      console.warn("Failed to fetch alerts in header dropdown", err);
    } finally {
      setLoading(false);
    }
  };

  const dismissSingleAlert = (alarmId: string) => {
    let repliedMap: Record<string, boolean> = {};
    const saved = localStorage.getItem("staff-replied-alarms");
    if (saved) {
      try {
        repliedMap = JSON.parse(saved);
      } catch (e) {}
    }
    repliedMap[alarmId] = true;
    localStorage.setItem("staff-replied-alarms", JSON.stringify(repliedMap));
    
    // Update local state instantly
    setActiveAlerts(prev => prev.filter(alert => {
      const id = alert.id || '';
      return id !== alarmId;
    }));
    
    if (onRefreshBadges) {
      onRefreshBadges();
    }
  };

  const dismissAllAlerts = () => {
    let repliedMap: Record<string, boolean> = {};
    const saved = localStorage.getItem("staff-replied-alarms");
    if (saved) {
      try {
        repliedMap = JSON.parse(saved);
      } catch (e) {}
    }
    
    activeAlerts.forEach((alert, idx) => {
      const alarmId = alert.id || `alarm-${idx}`;
      repliedMap[alarmId] = true;
    });

    localStorage.setItem("staff-replied-alarms", JSON.stringify(repliedMap));
    setActiveAlerts([]);
    
    if (onRefreshBadges) {
      onRefreshBadges();
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200/80 px-8 py-5 flex items-center justify-between shrink-0 font-sans select-none">
      {/* Title & Status Block */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h2>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            portal === 'staff'
              ? 'bg-teal-50 text-teal-700 border border-teal-200/50'
              : 'bg-sky-50 text-sky-700 border border-sky-200/50'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${portal === 'staff' ? 'bg-teal-500' : 'bg-sky-500'}`}></span>
            {portal === 'staff' ? 'Staff Portal' : 'Admin Operations Control'}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          HL7 Feed Live: <span className="font-semibold text-neutral-700">{activeStatusText}</span>
        </p>
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
            onClick={() => {
              const nextState = !isDropdownOpen;
              setIsDropdownOpen(nextState);
              if (nextState) {
                fetchAlerts();
              }
            }}
            className="relative p-2.5 hover:bg-neutral-100 text-neutral-500 hover:text-teal-655 rounded-xl transition cursor-pointer z-50"
            title="Recent Alerts"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 w-2 h-2 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {isDropdownOpen && (
            <>
              {/* Clicking backdrop closes dropdown */}
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsDropdownOpen(false)} />
              
              {/* Dropdown Card */}
              <div className="absolute right-0 top-12 w-96 bg-white border border-neutral-200 shadow-xl rounded-2xl p-4 z-50 animate-fadeIn space-y-3 cursor-default">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                  <h4 className="font-bold text-xs text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-teal-600" />
                    Active Alerts ({alertCount})
                  </h4>
                  {alertCount > 0 && (
                    <button
                      onClick={dismissAllAlerts}
                      className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      Dismiss All
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-6 text-neutral-400 gap-2">
                      <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-xs">Loading alerts...</span>
                    </div>
                  ) : activeAlerts.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400 space-y-1">
                      <p className="text-xs font-semibold">All caught up!</p>
                      <p className="text-[10px]">No active patient or admin alerts.</p>
                    </div>
                  ) : (
                    activeAlerts.map((alert, idx) => {
                      const alertId = alert.id || `alarm-${idx}`;
                      const isCritical = alert.level === 'error' || alert.message.toLowerCase().includes('critical') || alert.message.toLowerCase().includes('panic');
                      const isWarning = alert.level === 'warn' || alert.message.toLowerCase().includes('alert');
                      
                      let badgeColor = "bg-blue-50 text-blue-700 border-blue-100";
                      if (isCritical) badgeColor = "bg-red-50/70 text-red-800 border-red-100";
                      else if (isWarning) badgeColor = "bg-amber-50 text-amber-800 border-amber-100";

                      return (
                        <div 
                          key={alertId} 
                          className={`p-2.5 border rounded-xl flex flex-col gap-2 transition-all ${badgeColor}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] font-semibold leading-relaxed break-words flex-1">
                              {alert.message}
                            </span>
                            <button
                              onClick={() => dismissSingleAlert(alertId)}
                              className="text-[10px] font-bold text-neutral-600 hover:text-neutral-900 bg-white/90 hover:bg-white border border-neutral-200 px-1.5 py-0.5 rounded transition shrink-0 cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                          {alert.timestamp && (
                            <span className="text-[9px] text-neutral-405 self-end font-mono">
                              {alert.timestamp}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          <button 
            onClick={() => onSetTab?.('settings')}
            className="p-2.5 hover:bg-neutral-100 text-neutral-500 hover:text-teal-650 rounded-xl transition cursor-pointer"
            title="Staff Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
