import React, { useState } from "react";
import { Bell, HeartPulse, ShieldAlert, Check, Trash, CheckSquare, Clock, Filter, AlertTriangle } from "lucide-react";
import { AppNotification } from "../types";
import { initialNotifications } from "../mockData";

interface NotificationsProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotif: (id: string) => void;
}

export default function Notifications({ notifications, onMarkRead, onMarkAllRead, onDeleteNotif }: NotificationsProps) {
  const [filterCategory, setFilterCategory] = useState<'all' | 'lab' | 'medication' | 'general'>('all');

  const filtered = notifications.filter(n => {
    if (filterCategory === 'all') return true;
    return n.category === filterCategory;
  });

  return (
    <div id="notifications-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-1000 tracking-tight text-slate-950">Notification Center & Pulse</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and dismiss important alerts, urgent biochemical reports, and prescription reminders.
          </p>
        </div>

        <button 
          onClick={onMarkAllRead}
          className="border border-slate-200 hover:border-teal-500 hover:text-teal-700 bg-white text-slate-705 text-xs font-bold py-2.5 px-4.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <CheckSquare className="w-4.5 h-4.5" /> Mark All as Read
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Filter Options list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-150 rounded-3xl p-4.5 shadow-sm space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Category filters</span>
            
            <div className="flex flex-col gap-1.5 text-xs font-bold">
              <button 
                onClick={() => setFilterCategory('all')} 
                className={`p-3 rounded-xl transition text-left flex items-center justify-between ${
                  filterCategory === 'all' ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>All Alerts</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{notifications.length}</span>
              </button>

              <button 
                onClick={() => setFilterCategory('lab')} 
                className={`p-3 rounded-xl transition text-left flex items-center justify-between ${
                  filterCategory === 'lab' ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>Lab results</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{notifications.filter(n=>n.category==='lab').length}</span>
              </button>

              <button 
                onClick={() => setFilterCategory('medication')} 
                className={`p-3 rounded-xl transition text-left flex items-center justify-between ${
                  filterCategory === 'medication' ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>Medication refills</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{notifications.filter(n=>n.category==='medication').length}</span>
              </button>

              <button 
                onClick={() => setFilterCategory('general')} 
                className={`p-3 rounded-xl transition text-left flex items-center justify-between ${
                  filterCategory === 'general' ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>General Updates</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{notifications.filter(n=>n.category==='general').length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Active Notifications Feed Loop */}
        <div className="lg:col-span-9 space-y-4">
          
          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500 text-sm">
              Your inbox is clean. There are no pending alerts under the selected category.
            </div>
          ) : (
            filtered.map((not) => (
              <div 
                key={not.id}
                className={`bg-white border p-5 rounded-2xl shadow-sm hover:border-slate-350 transition flex items-start justify-between gap-4 relative group ${
                  !not.read ? 'border-l-4 border-l-teal-600 border-slate-200' : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    not.category === 'lab' ? 'bg-indigo-50 text-indigo-700' :
                    not.category === 'medication' ? 'bg-amber-50 text-amber-700 font-bold' : 'bg-slate-50 text-teal-700'
                  }`}>
                    {not.category === 'lab' ? <HeartPulse className="w-5 h-5 animate-pulse" /> : 
                     not.category === 'medication' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-950 text-sm leading-snug">{not.title}</span>
                      {!not.read && (
                        <span className="bg-teal-100 text-teal-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">NEW</span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-serif max-w-2xl">{not.body}</p>
                    <span className="text-[10px] text-slate-400 font-mono block pt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-350" /> {not.time}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 items-center shrink-0">
                  {!not.read && (
                    <button 
                      onClick={() => onMarkRead(not.id)}
                      className="p-1.5 rounded-lg border border-slate-100 hover:border-teal-500 text-slate-400 hover:text-teal-700 bg-white transition"
                      title="Mark as Read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => onDeleteNotif(not.id)}
                    className="p-1.5 rounded-lg border border-slate-105 hover:border-red-500 text-slate-400 hover:text-red-500 bg-white transition cursor-pointer"
                    title="Delete Notification"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

        </div>

      </div>
    </div>
  );
}
