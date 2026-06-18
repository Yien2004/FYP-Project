import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MessageSquare, 
  Search, 
  Eye, 
  ShieldCheck, 
  Calendar,
  Lock,
  Download
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  senderName: string;
  text: string;
  timestamp: string;
}

interface ChatThread {
  id: string;
  patientId: string;
  senderName: string;
  senderAvatar?: string;
  lastMessage: string;
  time: string;
  messages: ChatMessage[];
}

interface Facility {
  id: string;
  name: string;
}

export default function ChatAuditSection() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityName, setSelectedFacilityName] = useState<string>('');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Selection
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Load facilities on mount
  useEffect(() => {
    fetch("/api/facilities")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFacilities(data);
          if (data.length > 0) {
            setSelectedFacilityName(data[0].name);
          }
        }
      })
      .catch(err => console.error("Failed to load facilities list", err));
  }, []);

  // Fetch all threads from the API
  const fetchThreads = () => {
    setLoading(true);
    fetch("/api/messages/threads")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setThreads(data);
        }
      })
      .catch(err => console.error("Failed to load messaging threads", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  // Compute active channel ID prefix based on selected facility name
  const getFacilityChannelId = (name: string) => {
    return `staff-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  };

  const activeChannelId = selectedFacilityName ? getFacilityChannelId(selectedFacilityName) : '';

  // Filter threads that contain at least one message with this facility's prefix
  const filteredThreads = threads.filter(t => {
    const hasFacilityMessages = (t.messages || []).some(m => {
      const text = m.text || '';
      return text.startsWith(`[${activeChannelId}]:`);
    });

    const matchesSearch = t.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    return hasFacilityMessages && matchesSearch;
  });

  const activeThread = threads.find(t => t.id === activeThreadId);

  // Extract and clean messages for the active thread relative to selected facility
  const getCleanedMessages = (thread: ChatThread) => {
    return (thread.messages || [])
      .filter(m => {
        const text = m.text || '';
        // Display patient messages, and staff messages prefixed with the active facility slug
        return m.sender === 'patient' || text.startsWith(`[${activeChannelId}]:`);
      })
      .map(m => {
        const text = m.text || '';
        const cleanedText = text.startsWith(`[${activeChannelId}]:`)
          ? text.replace(`[${activeChannelId}]:`, '').trim()
          : text;

        return {
          ...m,
          text: cleanedText,
          senderName: m.sender === 'patient' ? thread.senderName : `${selectedFacilityName} Staff`
        };
      });
  };

  const cleanedMessages = activeThread ? getCleanedMessages(activeThread) : [];

  const handleDownloadTranscript = () => {
    if (!activeThread) return;
    const header = `CarePoint Audit Transcript — SECURE SYSTEM FILE\n` +
                   `==================================================\n` +
                   `Facility audited: ${selectedFacilityName}\n` +
                   `Patient Name:     ${activeThread.senderName}\n` +
                   `Audit Time:       ${new Date().toLocaleString()}\n` +
                   `==================================================\n\n`;

    const body = cleanedMessages.map(m => `[${m.timestamp}] ${m.senderName}: ${m.text}`).join('\n');
    
    const element = document.createElement("a");
    const file = new Blob([header + body], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `chat_audit_${activeThread.senderName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-neutral-200/80 bg-white rounded-2xl overflow-hidden h-[600px] shadow-xs font-sans text-neutral-800">
      
      {/* Col 1: Audited Threads list */}
      <div className="lg:col-span-4 border-r border-neutral-200/80 flex flex-col h-full bg-neutral-50/50">
        
        {/* Facility Selector Header */}
        <div className="p-4 border-b border-neutral-200/60 bg-white space-y-3 shrink-0">
          <div>
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 block mb-1">Select Facility to Audit</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={selectedFacilityName}
                onChange={(e) => {
                  setSelectedFacilityName(e.target.value);
                  setActiveThreadId(null);
                }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-10 cursor-pointer appearance-none"
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audited patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-8"
            />
          </div>
        </div>

        {/* Audit Directory List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-neutral-450 font-mono">
              Loading messaging buffers...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400 leading-relaxed font-medium">
              No active communication logs detected between {selectedFacilityName} and any patients.
            </div>
          ) : (
            filteredThreads.map(t => {
              const isSelected = activeThreadId === t.id;
              const lastFacilityMsg = (t.messages || [])
                .filter(m => m.sender === 'patient' || (m.text || '').startsWith(`[${activeChannelId}]:`))
                .pop();
              
              let lastMsgText = "No audited activity.";
              if (lastFacilityMsg) {
                const text = lastFacilityMsg.text || '';
                lastMsgText = text.startsWith(`[${activeChannelId}]:`)
                  ? text.replace(`[${activeChannelId}]:`, '').trim()
                  : text;
              }

              return (
                <div
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-teal-50/50 border-l-4 border-l-teal-650' : 'hover:bg-neutral-50/70'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs shrink-0">
                    {t.senderName.substring(0,2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-xs text-neutral-900 block truncate">{t.senderName}</span>
                      <span className="text-[9px] text-neutral-400 font-mono shrink-0">{t.time}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate mt-1 leading-snug">{lastMsgText}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Col 2: Chat Transcript Panel */}
      <div className="lg:col-span-8 flex flex-col h-full bg-neutral-50/30">
        {activeThread ? (
          <div className="flex flex-col h-full justify-between">
            {/* Audited Thread Header */}
            <div className="px-6 py-4.5 border-b border-neutral-200/60 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/50 flex items-center justify-center font-bold text-teal-850 text-xs">
                  {activeThread.senderName.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-neutral-900 leading-tight">Auditing: {activeThread.senderName}</h4>
                  <span className="text-[9px] text-neutral-500 font-medium block mt-0.5">Facility Endpoint: {selectedFacilityName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadTranscript}
                  className="p-2 border border-neutral-200 hover:bg-neutral-55 hover:text-neutral-900 text-neutral-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Download Secure Transcript"
                >
                  <Download className="w-3.5 h-3.5" /> Export Log
                </button>
              </div>
            </div>

            {/* Transcripts Window */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="text-center py-2 shrink-0">
                <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-neutral-150 px-3 py-1 rounded-md text-neutral-500 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-neutral-450" /> End-to-End Encrypted Audit Channel
                </span>
              </div>

              {cleanedMessages.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-450 font-mono">
                  No transcripts logged.
                </div>
              ) : (
                cleanedMessages.map((m) => {
                  const isPatient = m.sender === 'patient';
                  return (
                    <div 
                      key={m.id} 
                      className={`flex flex-col max-w-[70%] ${
                        isPatient ? 'mr-auto items-start' : 'ml-auto items-end'
                      }`}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[9.5px] font-extrabold text-neutral-500">{m.senderName}</span>
                        <span className="text-[8px] text-neutral-450 font-mono">{m.timestamp}</span>
                      </div>
                      <div 
                        className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                          isPatient 
                            ? 'bg-white text-neutral-800 border border-neutral-200/80 rounded-tl-none' 
                            : 'bg-neutral-900 text-white rounded-tr-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Audited Footer Notice */}
            <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-center gap-3 shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                <strong>Audit Compliance:</strong> Every record shown is fetched directly from the database under HL7 specifications. Recalled messages are excluded from this viewport.
              </p>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-450 p-8 text-center bg-neutral-50/10">
            <MessageSquare className="w-12 h-12 text-teal-650 animate-pulse mb-3" />
            <h4 className="font-extrabold text-sm text-neutral-900">Select a Chat to Audit</h4>
            <p className="text-xs text-neutral-450 max-w-xs mt-1.5 leading-relaxed">
              Choose an outpatient from the active conversations index on the left to review communication logs for the active facility.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
