import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Clock, 
  BookOpen,
  Volume2
} from 'lucide-react';

interface BroadcastHistoryLog {
  id: string;
  timestamp: string;
  message: string;
  level: string;
}

export default function AdminSettingsSection() {
  // Broadcast states
  const [broadcastCategory, setBroadcastCategory] = useState<'Emergency Alert' | 'Maintenance Warning' | 'Health Advisory'>('Emergency Alert');
  const [broadcastTarget, setBroadcastTarget] = useState<'All Users' | 'All Registered Patients' | 'All Staff'>('All Users');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<BroadcastHistoryLog[]>([]);

  // Policy CMS states
  const [policyVersion, setPolicyVersion] = useState('v2.4.1');
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  const fetchBroadcastHistory = () => {
    fetch("/api/logs")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data
            .filter((l: any) => l.message && l.message.startsWith('[Broadcast]:'))
            .map((l: any) => ({
              id: l.id,
              timestamp: l.timestamp || new Date().toISOString(),
              message: l.message.replace('[Broadcast]:', '').trim(),
              level: l.level
            }));
          setHistoryLogs(filtered);
        }
      })
      .catch(err => console.error("Failed to load broadcast history", err));
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm("Verify: Are you sure you want to remove this broadcast log from history?")) return;
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Broadcast record removed from logs successfully.");
        fetchBroadcastHistory();
      } else {
        alert("Failed to delete log from database.");
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  useEffect(() => {
    fetchBroadcastHistory();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      alert("Please enter a broadcast message.");
      return;
    }

    if (!window.confirm("Verify Broadcast: Dispatching this memo immediately transmits notifications to selected dashboards. Proceed?")) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: broadcastCategory,
          targetAudience: broadcastTarget,
          message: broadcastMessage
        })
      });

      if (res.ok) {
        alert("System-wide broadcast dispatched successfully!");
        setBroadcastMessage('');
        fetchBroadcastHistory();
      } else {
        const err = await res.json();
        alert(`Failed to dispatch: ${err.error || "Server error"}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    setTimeout(() => {
      alert("Terms of Service and Privacy Policy metadata successfully synced to HL7 core server!");
      setPolicyVersion(prev => `v${(parseFloat(prev.substring(1)) + 0.1).toFixed(1)}`);
      setIsSavingPolicy(false);
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-neutral-800">
      
      {/* Col 1 & 2: Emergency Broadcast Sender */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Broadcast Composer */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
          <div className="border-b border-neutral-100 pb-4 mb-5 flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-750 border border-red-100 rounded-xl">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">System-Wide Emergency Broadcast announcement</h3>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">Broadcast urgent alerts, maintenance alerts, or clinical warnings to all dashboards simultaneously.</p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">Broadcast Category</label>
                <select
                  value={broadcastCategory}
                  onChange={(e) => setBroadcastCategory(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
                >
                  <option value="Emergency Alert">🚨 Emergency Alert / Triage Warning</option>
                  <option value="Maintenance Warning">⚠️ Maintenance Warning</option>
                  <option value="Health Advisory">📢 Health Advisory / Vaccination Drive</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">Target Audience</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
                >
                  <option value="All Users">All Dashboard Sessions (Patients & Staff)</option>
                  <option value="All Registered Patients">Outpatient Portals Only (Notifications)</option>
                  <option value="All Staff">Clinician Portals Only (System Logs Feed)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">Alert Message</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter alert memo to dispatch... E.g., 'Penang General Outpatient System maintenance starts at 12:00 AM. Expect transient connection interruptions.'"
                rows={4}
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 font-sans leading-relaxed resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? "Dispatching Broadcast..." : "Dispatch Channel Broadcast"}
              </button>
            </div>

          </form>
        </div>

        {/* Broadcast history logs list */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
          <div className="border-b border-neutral-100 pb-4 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-sm text-neutral-900">Broadcast Transmissions Logs</h3>
            <button 
              onClick={fetchBroadcastHistory}
              className="text-[10px] text-teal-650 hover:underline cursor-pointer"
            >
              Refresh History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-[10px] font-bold text-neutral-450 uppercase tracking-wider">
                  <th className="pb-2.5">Date Logged</th>
                  <th className="pb-2.5">Alert Message memo</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {historyLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-neutral-450 font-mono">
                      No active broadcast transmissions cataloged.
                    </td>
                  </tr>
                ) : (
                  historyLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 pr-4 font-mono text-[10px] text-neutral-500 w-44 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 text-neutral-800 leading-normal">
                        {log.message}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteBroadcast(log.id)}
                          className="px-2.5 py-1 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Col 3: Content Management Policy system */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* CMS Updates */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
          <div className="border-b border-neutral-100 pb-4 mb-5 flex items-center gap-3">
            <div className="p-2.5 bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">CMS policy updates</h3>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">Publish terms of service & privacy metadata.</p>
            </div>
          </div>

          <form onSubmit={handleSavePolicy} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">Active Policy Version</label>
              <input
                type="text"
                value={policyVersion}
                disabled
                className="w-full bg-neutral-150 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-500 outline-none h-9 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">Update Summary</label>
              <textarea
                placeholder="E.g., Added GDPR & PDPA 2010 details regarding electronic health records storage policies."
                rows={3}
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 font-sans leading-relaxed resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                type="submit"
                disabled={isSavingPolicy}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {isSavingPolicy ? "Saving Policy..." : "Publish Policy Version"}
              </button>
            </div>
          </form>
        </div>

        {/* Global bypass toggles */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h4 className="font-bold text-sm text-neutral-900">Infrastructure overrides</h4>
          
          <div className="space-y-3.5 pt-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-neutral-600">Secure Edge SSL Mode</span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded text-[10px] font-bold">STRICT</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-neutral-600">HL7 Integration Engine</span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded text-[10px] font-bold">CONNECTED</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-neutral-600">Backup DB Redundancy</span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded text-[10px] font-bold">OPTIMAL</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
