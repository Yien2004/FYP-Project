import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Megaphone,
  Clock,
  Inbox
} from 'lucide-react';

interface BroadcastMessage {
  id: string;
  timestamp: string;
  category: 'Emergency' | 'Maintenance' | 'Advisory';
  targetAudience: string;
  message: string;
  read: boolean;
}

interface StaffNotificationsInboxProps {
  alertCount: number;
  onRefreshBadges: () => void;
}

export default function StaffNotificationsInbox({
  alertCount,
  onRefreshBadges
}: StaffNotificationsInboxProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<string[]>([]);

  // Load read notifications from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("staff-read-broadcasts");
      if (saved) setReadIds(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to load read broadcasts list", e);
    }
  }, []);

  const fetchBroadcasts = () => {
    setLoading(true);
    fetch("/api/logs")
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list)) {
          // Parse broadcast logs targeting staff
          const parsed = list
            .filter((log: any) => log.message && log.message.startsWith('[Broadcast]:'))
            .map((log: any, idx: number) => {
              const fullMsg = log.message.replace('[Broadcast]:', '').trim();
              const logId = String(log.id || log.timestamp || `bc-${idx}`);
              
              // Extract target audience: e.g. (All Users) or (All Staff)
              let audience = 'All Registered Patients';
              let bodyText = fullMsg;
              if (fullMsg.startsWith('(')) {
                const closeIdx = fullMsg.indexOf(')');
                if (closeIdx > 0) {
                  audience = fullMsg.substring(1, closeIdx);
                  bodyText = fullMsg.substring(closeIdx + 1).trim();
                }
              }

              // Determine category by tags: e.g. [🚨 EMERGENCY] or [⚠️ MAINTENANCE]
              let category: 'Emergency' | 'Maintenance' | 'Advisory' = 'Advisory';
              if (bodyText.includes('🚨 EMERGENCY') || log.level === 'error') {
                category = 'Emergency';
                bodyText = bodyText.replace(/\[🚨 EMERGENCY\]/i, '').trim();
              } else if (bodyText.includes('⚠️ MAINTENANCE') || bodyText.includes('maintenance')) {
                category = 'Maintenance';
                bodyText = bodyText.replace(/\[⚠️ MAINTENANCE\]/i, '').trim();
              } else {
                bodyText = bodyText.replace(/\[📢 HEALTH NOTICE\]/i, '').trim();
              }

              return {
                id: logId,
                timestamp: log.timestamp || new Date().toISOString(),
                category,
                targetAudience: audience,
                message: bodyText,
                read: false // Evaluated later
              };
            })
            // Only keep broadcasts targeting All Staff or All Users
            .filter((b: any) => b.targetAudience === 'All Users' || b.targetAudience === 'All Staff');

          setBroadcasts(parsed);
        }
      })
      .catch(err => console.error("Failed to load broadcasts", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleMarkAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const nextReadIds = [...readIds, id];
    setReadIds(nextReadIds);
    localStorage.setItem("staff-read-broadcasts", JSON.stringify(nextReadIds));
    onRefreshBadges();
  };

  const handleMarkAllAsRead = () => {
    const allIds = broadcasts.map(b => b.id);
    const uniqueIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(uniqueIds);
    localStorage.setItem("staff-read-broadcasts", JSON.stringify(uniqueIds));
    onRefreshBadges();
  };

  // Evaluate read/unread list dynamically
  const listWithReadStatus = broadcasts.map(b => ({
    ...b,
    read: readIds.includes(b.id)
  }));

  const cardBase = 'bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs animate-fadeIn';

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-neutral-900">System Notifications Inbox</h3>
          <p className="text-xs text-neutral-500 mt-0.5 font-medium">Review administrative announcements, system bypass directives, and critical emergency logs.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          <button 
            onClick={handleMarkAllAsRead} 
            disabled={listWithReadStatus.every(b => b.read)}
            className="h-9 px-4 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold hover:bg-neutral-50 hover:text-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </button>

          <button 
            onClick={fetchBroadcasts} 
            className="h-9 px-4 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            Refresh Messages
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS CONTAINER */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500 font-mono">
            Checking system log channels...
          </div>
        ) : listWithReadStatus.length === 0 ? (
          <div className={`${cardBase} py-16 flex flex-col items-center justify-center text-center`}>
            <div className="p-4 bg-neutral-50 text-neutral-400 border border-neutral-100 rounded-full mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-neutral-800 text-sm">No notifications found</h4>
            <p className="text-xs text-neutral-450 mt-1 max-w-sm">You have resolved all administrative memos and priority alerts. High-level broadcasts will log here automatically.</p>
          </div>
        ) : (
          listWithReadStatus.map((b) => {
            const isRead = b.read;
            
            // Layout styling configuration based on broadcast category
            let boxClass = 'bg-white border-neutral-200/80';
            let iconBox = 'bg-neutral-50 text-neutral-500 border-neutral-200/40';
            let icon = <Megaphone className="w-5 h-5" />;
            let categoryLabel = 'Notice';

            if (b.category === 'Emergency') {
              boxClass = isRead ? 'bg-red-50/20 border-red-200/50' : 'bg-red-50/45 border-red-250 shadow-xs shadow-red-500/2';
              iconBox = 'bg-red-100 border border-red-200 text-red-750';
              icon = <ShieldAlert className="w-5 h-5" />;
              categoryLabel = '🚨 Critical Emergency Alert';
            } else if (b.category === 'Maintenance') {
              boxClass = isRead ? 'bg-amber-50/20 border-amber-200/50' : 'bg-amber-50/40 border-amber-250';
              iconBox = 'bg-amber-100 border border-amber-200 text-amber-700';
              icon = <AlertTriangle className="w-5 h-5" />;
              categoryLabel = '⚠️ System Maintenance Notice';
            } else {
              boxClass = isRead ? 'bg-sky-50/10 border-sky-200/50' : 'bg-sky-50/30 border-sky-250';
              iconBox = 'bg-sky-100 border border-sky-200 text-sky-750';
              icon = <Bell className="w-5 h-5" />;
              categoryLabel = '📢 Health & Safety Advisory';
            }

            return (
              <div 
                key={b.id} 
                className={`border rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 ${boxClass} relative overflow-hidden`}
              >
                {/* Visual Unread Glow Strip */}
                {!isRead && (
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                    b.category === 'Emergency' ? 'bg-red-500' : b.category === 'Maintenance' ? 'bg-amber-500' : 'bg-sky-500'
                  }`} />
                )}

                {/* Category Icon */}
                <div className={`p-2.5 rounded-xl shrink-0 ${iconBox}`}>
                  {icon}
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider leading-none">
                      {categoryLabel}
                    </span>
                    <span className="text-[10px] text-neutral-450 font-medium shrink-0 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(b.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-xs text-neutral-800 leading-relaxed font-semibold mt-2.5 pr-12">
                    {b.message}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-neutral-500 bg-neutral-100/80 border border-neutral-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Target: {b.targetAudience === 'All Users' ? 'All Channels' : 'Clinicians Only'}
                    </span>
                  </div>
                </div>

                {/* Mark as read checkbox button */}
                <div className="shrink-0 flex items-center self-center pl-2">
                  {isRead ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl text-[10px] font-bold inline-flex items-center gap-1.5 border border-emerald-150 select-none">
                      <CheckCheck className="w-3.5 h-3.5" /> Checked
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkAsRead(b.id)}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[10px] rounded-xl transition cursor-pointer select-none"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
