import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MessageSquare, 
  Search, 
  Eye, 
  ShieldCheck, 
  Calendar,
  Lock,
  Download,
  Send,
  Users
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor' | 'admin';
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
  
  // Selection for Audit
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // DM Mode state
  const [mode, setMode] = useState<'audit' | 'dm'>('audit');
  const [dmTab, setDmTab] = useState<'patient' | 'staff'>('patient');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedDmUser, setSelectedDmUser] = useState<any | null>(null);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [dmSearchTerm, setDmSearchTerm] = useState('');
  const [dmInputText, setDmInputText] = useState('');

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

  // Fetch all threads from the API for Audit
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

  // Fetch all users for DM
  useEffect(() => {
    if (mode === 'dm') {
      fetch("/api/admin/users")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllUsers(data);
          }
        })
        .catch(err => console.error("Failed to load admin users", err));
    }
  }, [mode]);

  // Poll DM Messages
  useEffect(() => {
    if (mode !== 'dm' || !selectedDmUser) return;

    const cleanEmail = (selectedDmUser.email || '').replace(/[^a-zA-Z0-9]/g, '-');
    const threadId = selectedDmUser.role.toLowerCase() === 'patient'
      ? `chat-${selectedDmUser.id}`
      : `chat-staff-${cleanEmail}`;

    const fetchDmMessages = () => {
      fetch(`/api/messages/threads/${threadId}/messages`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const cleaned = data.map((m: any) => ({
              ...m,
              text: m.content || m.text || ''
            }));
            setDmMessages(cleaned);
          }
        })
        .catch(err => console.error("Failed to fetch DM messages", err));
    };

    fetchDmMessages();
    const interval = setInterval(fetchDmMessages, 4000);
    return () => clearInterval(interval);
  }, [mode, selectedDmUser]);

  const handleSendDmMessage = async () => {
    if (!dmInputText.trim() || !selectedDmUser) return;

    const cleanEmail = (selectedDmUser.email || '').replace(/[^a-zA-Z0-9]/g, '-');
    const threadId = selectedDmUser.role.toLowerCase() === 'patient'
      ? `chat-${selectedDmUser.id}`
      : `chat-staff-${cleanEmail}`;

    const payload = {
      sender: 'admin',
      senderName: 'System Administrator',
      text: dmInputText.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const res = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedMsg = await res.json();
        const cleanedSavedMsg = {
          ...savedMsg,
          text: savedMsg.content || savedMsg.text || ''
        };
        setDmMessages(prev => [...prev, cleanedSavedMsg]);
        setDmInputText('');
      }
    } catch (err) {
      console.error("Failed to send DM message", err);
    }
  };

  const handleCloseConsultation = async () => {
    if (!selectedDmUser) return;
    if (!window.confirm("Are you sure you want to close this consultation chat? The user will not be able to send further messages until you message them again.")) return;

    const cleanEmail = (selectedDmUser.email || '').replace(/[^a-zA-Z0-9]/g, '-');
    const threadId = selectedDmUser.role.toLowerCase() === 'patient'
      ? `chat-${selectedDmUser.id}`
      : `chat-staff-${cleanEmail}`;

    const payload = {
      sender: 'admin',
      senderName: 'System Administrator',
      text: '[System]: Chat closed by Administrator.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const res = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedMsg = await res.json();
        const cleanedSavedMsg = {
          ...savedMsg,
          text: savedMsg.content || savedMsg.text || ''
        };
        setDmMessages(prev => [...prev, cleanedSavedMsg]);
      }
    } catch (err) {
      console.error("Failed to close consultation", err);
    }
  };

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
    const header = `LifeLink Audit Transcript — SECURE SYSTEM FILE\n` +
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

  const filteredUsers = allUsers.filter(u => {
    const isPatient = u.role.toLowerCase() === 'patient';
    const matchesTab = dmTab === 'patient' ? isPatient : !isPatient;
    const matchesSearch = u.fullName.toLowerCase().includes(dmSearchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(dmSearchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex flex-col border border-neutral-200/80 bg-white rounded-2xl overflow-hidden h-[650px] shadow-xs font-sans text-neutral-800">
      
      {/* Mode Switcher Tab Bar */}
      <div className="flex border-b border-neutral-200 bg-neutral-50/50 shrink-0">
        <button
          onClick={() => setMode('audit')}
          className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
            mode === 'audit'
              ? 'border-teal-600 text-teal-700 bg-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/30'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Audit Compliance Logs
        </button>
        <button
          onClick={() => setMode('dm')}
          className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
            mode === 'dm'
              ? 'border-teal-600 text-teal-700 bg-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/30'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Direct Messaging Center
        </button>
      </div>

      {mode === 'audit' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Col 1: Audited Threads list */}
          <div className="lg:col-span-4 border-r border-neutral-200/80 flex flex-col h-full bg-neutral-50/50 min-h-0">
            
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
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 min-h-0">
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
          <div className="lg:col-span-8 flex flex-col h-full bg-neutral-50/30 min-h-0">
            {activeThread ? (
              <div className="flex flex-col h-full justify-between min-h-0">
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
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
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
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-450 p-8 text-center bg-neutral-50/10 h-full">
                <MessageSquare className="w-12 h-12 text-teal-650 animate-pulse mb-3" />
                <h4 className="font-extrabold text-sm text-neutral-900">Select a Chat to Audit</h4>
                <p className="text-xs text-neutral-450 max-w-xs mt-1.5 leading-relaxed">
                  Choose an outpatient from the active conversations index on the left to review communication logs for the active facility.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Direct Messaging Center Mode */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* Left Column: User Directory */}
          <div className="lg:col-span-4 border-r border-neutral-200/80 flex flex-col h-full bg-neutral-50/50 min-h-0">
            
            {/* Patients / Staff subtab selector */}
            <div className="p-4 border-b border-neutral-200/60 bg-white space-y-3 shrink-0">
              <div className="flex bg-neutral-100 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setDmTab('patient');
                    setSelectedDmUser(null);
                    setDmMessages([]);
                  }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                    dmTab === 'patient'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Patients
                </button>
                <button
                  onClick={() => {
                    setDmTab('staff');
                    setSelectedDmUser(null);
                    setDmMessages([]);
                  }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                    dmTab === 'staff'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Staff Members
                </button>
              </div>

              {/* User search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${dmTab === 'patient' ? 'patients' : 'staff'}...`}
                  value={dmSearchTerm}
                  onChange={(e) => setDmSearchTerm(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-8"
                />
              </div>
            </div>

            {/* User Directory List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 min-h-0">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-450 italic">
                  No registered {dmTab === 'patient' ? 'patients' : 'staff members'} found matching query.
                </div>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = selectedDmUser?.id === u.id;
                  const initials = u.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedDmUser(u);
                        setDmMessages([]);
                      }}
                      className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-50/50 border-l-4 border-l-teal-650' : 'hover:bg-neutral-50/70'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-neutral-900 block truncate">{u.fullName}</span>
                        <span className="text-[10px] text-neutral-550 block truncate mt-0.5">{u.email}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Direct Messaging Workspace */}
          <div className="lg:col-span-8 flex flex-col h-full bg-neutral-50/30 min-h-0">
            {selectedDmUser ? (
              <div className="flex flex-col h-full justify-between min-h-0">
                
                {/* Active Chat Header */}
                <div className="px-6 py-4 border-b border-neutral-200/60 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-55 border border-teal-200/50 flex items-center justify-center font-bold text-teal-850 text-xs">
                      {selectedDmUser.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-neutral-900 leading-none">{selectedDmUser.fullName}</h4>
                      <span className="text-[10px] text-neutral-450 block mt-1">{selectedDmUser.email} &bull; <strong className="text-teal-650">{selectedDmUser.role}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseConsultation}
                      className="text-[10px] font-bold text-red-650 hover:text-red-750 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Close Consultation
                    </button>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2 py-1.5 rounded-full select-none">
                      Active Session
                    </span>
                  </div>
                </div>

                {/* Messages Display Window */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                  {dmMessages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-neutral-400 font-mono">
                      No message history found. Type below to start direct secure chat.
                    </div>
                  ) : (
                    dmMessages.map((m) => {
                      const isAdmin = m.sender === 'admin';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col max-w-[75%] ${
                            isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[9px] font-bold text-neutral-500">{m.senderName}</span>
                            <span className="text-[8px] text-neutral-400 font-mono">{m.timestamp}</span>
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isAdmin
                                ? 'bg-neutral-950 text-white rounded-tr-none'
                                : 'bg-white border border-neutral-250 text-neutral-800 rounded-tl-none shadow-xs'
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input area */}
                <div className="p-4 border-t border-neutral-200/60 bg-white space-y-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Send direct secure message to ${selectedDmUser.fullName}...`}
                      value={dmInputText}
                      id="dm-send-input"
                      onChange={(e) => setDmInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendDmMessage();
                        }
                      }}
                      className="flex-1 bg-neutral-50 border border-neutral-250 rounded-xl px-4 py-2.5 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400"
                    />
                    <button
                      onClick={handleSendDmMessage}
                      id="dm-send-btn"
                      className="p-2.5 px-4 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-450 p-8 text-center bg-neutral-50/10 h-full">
                <Users className="w-12 h-12 text-teal-650 animate-pulse mb-3" />
                <h4 className="font-extrabold text-sm text-neutral-900">Select Contact to Message</h4>
                <p className="text-xs text-neutral-450 max-w-xs mt-1.5 leading-relaxed">
                  Choose a user from the directory on the left to start a direct messaging session with any staff member or patient.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
