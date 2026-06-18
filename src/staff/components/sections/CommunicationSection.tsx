import React, { useState } from 'react';
import { 
  Search, 
  MessageSquare, 
  Paperclip, 
  Send, 
  ShieldCheck, 
  CheckSquare, 
  Heart, 
  Clock, 
  Check, 
  Volume2, 
  X,
  FileCode,
  Milestone,
  Thermometer,
  Activity,
  HeartPulse
} from 'lucide-react';
import { mockChatThreads } from '../../data/mockData';
import { ChatThread, ChatMessage } from '../../types';

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

export default function CommunicationSection() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [typedMessage, setTypedMessage] = useState('');

  const activeThreadIdRef = React.useRef(activeThreadId);
  React.useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  const fetchThreadsAndActiveMessages = React.useCallback(() => {
    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const currentClinic = getClinicFromEmail(loggedEmail);
    const currentChannelId = currentClinic 
      ? `staff-${currentClinic.toLowerCase().replace(/[^a-z0-9]/g, "-")}` 
      : '';

    Promise.all([
      fetch("/api/messages/threads").then(res => res.json()),
      fetch("/api/appointments").then(res => res.json()).catch(() => [])
    ])
    .then(async ([threadsList, appointmentsList]) => {
      if (!Array.isArray(threadsList)) return;

      // Filter threads: only keep patients with appointments at this clinic,
      // or patients who have sent messages to this clinic's channel.
      const filteredThreads = threadsList.filter((t: any) => {
        if (!currentClinic) return true; // Show all if email doesn't map to clinic
        
        const hasApt = appointmentsList.some((ap: any) => 
          ap.patientId === t.patientId && 
          (ap.clinic || ap.hospital || '').toLowerCase() === currentClinic.toLowerCase()
        );
        
        const hasMsg = (t.messages || []).some((m: any) => {
          const text = m.content || m.text || '';
          return text.startsWith(`[${currentChannelId}]:`);
        });

        return hasApt || hasMsg;
      });

      // Map threads to filter and clean messages
      const mappedThreads = filteredThreads.map((t: any) => {
        const cleanedMessages = (t.messages || [])
          .filter((m: any) => {
            if (!currentClinic) return true;
            const text = m.content || m.text || '';
            return text.startsWith(`[${currentChannelId}]:`) || (!text.startsWith('[staff-'));
          })
          .map((m: any) => {
            const text = m.content || m.text || '';
            const cleanedText = currentClinic && text.startsWith(`[${currentChannelId}]:`) 
              ? text.replace(`[${currentChannelId}]:`, '').trim() 
              : text;
            return {
              ...m,
              text: cleanedText
            };
          });

        const lastMsg = cleanedMessages.length > 0 ? cleanedMessages[cleanedMessages.length - 1] : null;

        return {
          ...t,
          lastMessage: lastMsg ? lastMsg.text : "Secure workspace channels open. Click to start secure chat...",
          time: lastMsg ? lastMsg.timestamp : "N/A",
          messages: cleanedMessages
        };
      });

      if (mappedThreads.length > 0) {
        const currentActiveId = activeThreadIdRef.current && mappedThreads.some((t: any) => t.id === activeThreadIdRef.current)
          ? activeThreadIdRef.current 
          : mappedThreads[0].id;

        if (activeThreadIdRef.current !== currentActiveId) {
          setActiveThreadId(currentActiveId);
        }

        try {
          const resMsgs = await fetch(`/api/messages/threads/${currentActiveId}/messages`);
          const msgs = await resMsgs.json();
          if (Array.isArray(msgs)) {
            const cleanedMsgs = msgs
              .filter((m: any) => {
                if (!currentClinic) return true;
                const text = m.content || m.text || '';
                return text.startsWith(`[${currentChannelId}]:`) || (!text.startsWith('[staff-'));
              })
              .map((m: any) => {
                const text = m.content || m.text || '';
                const cleanedText = currentClinic && text.startsWith(`[${currentChannelId}]:`)
                  ? text.replace(`[${currentChannelId}]:`, '').trim()
                  : text;
                return {
                  ...m,
                  text: cleanedText
                };
              });

            setThreads(mappedThreads.map((t: any) => 
              t.id === currentActiveId ? { ...t, messages: cleanedMsgs } : t
            ));
          } else {
            setThreads(mappedThreads);
          }
        } catch (e) {
          setThreads(mappedThreads);
        }
      } else {
        setActiveThreadId('');
        setThreads([]);
      }
    })
    .catch(err => {
      console.warn("Failed to fetch messaging threads", err);
      // Fallback with filtering
      if (currentClinic) {
        const fallbackFiltered = mockChatThreads.filter((t: any) => {
          const channelId = `staff-${currentClinic.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
          return (t.messages || []).some((m: any) => {
            const text = m.content || m.text || '';
            return text.startsWith(`[${channelId}]:`) || (!text.startsWith('[staff-'));
          });
        });
        setThreads(fallbackFiltered);
      } else {
        setThreads(mockChatThreads);
      }
    });
  }, []);

  React.useEffect(() => {
    fetchThreadsAndActiveMessages();
    const interval = setInterval(fetchThreadsAndActiveMessages, 4000);
    return () => clearInterval(interval);
  }, [fetchThreadsAndActiveMessages]);

  const selectThread = async (id: string) => {
    setActiveThreadId(id);
    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const currentClinic = getClinicFromEmail(loggedEmail);
    const currentChannelId = currentClinic 
      ? `staff-${currentClinic.toLowerCase().replace(/[^a-z0-9]/g, "-")}` 
      : '';

    try {
      const resMsgs = await fetch(`/api/messages/threads/${id}/messages`);
      const msgs = await resMsgs.json();
      if (Array.isArray(msgs)) {
        const cleanedMsgs = msgs
          .filter((m: any) => {
            if (!currentClinic) return true;
            const text = m.content || m.text || '';
            return text.startsWith(`[${currentChannelId}]:`) || (!text.startsWith('[staff-'));
          })
          .map((m: any) => {
            const text = m.content || m.text || '';
            const cleanedText = currentClinic && text.startsWith(`[${currentChannelId}]:`)
              ? text.replace(`[${currentChannelId}]:`, '').trim()
              : text;
            return {
              ...m,
              text: cleanedText
            };
          });
        setThreads(prev => prev.map(t => t.id === id ? { ...t, unread: false, messages: cleanedMsgs } : t));
      }
    } catch (err) {
      console.error("Failed to load thread messages", err);
      setThreads(prev => prev.map(t => t.id === id ? { ...t, unread: false } : t));
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  // Staff notebook state
  const [noteText, setNoteText] = useState('');

  React.useEffect(() => {
    if (activeThread?.id) {
      setNoteText(localStorage.getItem(`staff-note-${activeThread.id}`) || '');
    }
  }, [activeThread?.id]);

  const handleNoteChange = (val: string) => {
    setNoteText(val);
    if (activeThread?.id) {
      localStorage.setItem(`staff-note-${activeThread.id}`, val);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !activeThread) return;

    const loggedEmail = localStorage.getItem("lifelink_user_email") || '';
    const currentClinic = getClinicFromEmail(loggedEmail);
    const currentChannelId = currentClinic 
      ? `staff-${currentClinic.toLowerCase().replace(/[^a-z0-9]/g, "-")}` 
      : '';
    const prefixedText = currentChannelId ? `[${currentChannelId}]: ${textToSend}` : textToSend;

    const payload = {
      sender: 'doctor',
      senderName: currentClinic ? `Staff (${currentClinic})` : 'Dr. Sarah Jenkins',
      text: prefixedText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const res = await fetch(`/api/messages/threads/${activeThread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedMsg = await res.json();
        const cleanedSavedMsg = {
          ...savedMsg,
          text: currentChannelId && (savedMsg.content || savedMsg.text || '').startsWith(`[${currentChannelId}]:`)
            ? (savedMsg.content || savedMsg.text || '').replace(`[${currentChannelId}]:`, '').trim()
            : (savedMsg.content || savedMsg.text || '')
        };

        setThreads(prev => prev.map(t => {
          if (t.id === activeThread.id) {
            return {
              ...t,
              lastMessage: textToSend,
              time: 'Just Now',
              unread: false,
              messages: [...(t.messages || []), cleanedSavedMsg]
            };
          }
          return t;
        }));
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }

    setTypedMessage('');
  };

  const handleRecallMessage = async (msgId: string) => {
    if (!activeThread) return;
    try {
      const res = await fetch(`/api/messages/${msgId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setThreads(prev => prev.map(t => {
          if (t.id === activeThread.id) {
            const updatedMessages = (t.messages || []).filter((m: any) => m.id !== msgId);
            const lastMsg = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : null;
            return {
              ...t,
              lastMessage: lastMsg ? lastMsg.text : "Secure workspace channels open. Click to start secure chat...",
              time: lastMsg ? lastMsg.timestamp : "N/A",
              messages: updatedMessages
            };
          }
          return t;
        }));
      }
    } catch (err) {
      console.error("Failed to recall message", err);
    }
  };

  if (!activeThread) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 border border-neutral-200/80 bg-white rounded-2xl overflow-hidden h-[600px] shadow-xs font-sans text-neutral-800">
        
        {/* Column 1: Messaging Thread List */}
        <div className="lg:col-span-1 border-r border-neutral-200/80 flex flex-col h-full bg-neutral-50/50">
          <div className="p-4 border-b border-neutral-100 space-y-3">
            <h3 className="font-bold text-sm text-neutral-900 tracking-tight">Outpatient Inboxes</h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-white border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-700 outline-none focus:ring-1 focus:ring-neutral-450"
                disabled
              />
            </div>
          </div>

          {/* Thread Selectors Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 flex items-center justify-center p-4">
            <p className="text-xs text-neutral-450 text-center font-mono">No active channels.</p>
          </div>
        </div>

        {/* Column 2 & 3: Chat Workspace Placeholder */}
        <div className="lg:col-span-2 border-r border-neutral-200/80 flex flex-col h-full items-center justify-center text-center text-neutral-500 p-8">
          <MessageSquare className="w-12 h-12 text-red-500 animate-pulse mb-3" />
          <h3 className="font-extrabold text-sm text-neutral-900">No Chat Channel Selected</h3>
          <p className="text-xs text-neutral-450 max-w-xs mt-1 leading-relaxed">
            Choose a patient thread from the left index list to establish a secure, encrypted messaging tunnel.
          </p>
        </div>

        {/* Column 4: Context Bar Placeholder */}
        <div className="lg:col-span-1 p-4 space-y-5 bg-neutral-50/50 flex flex-col h-full overflow-y-auto items-center justify-center text-center text-neutral-400">
          <ShieldCheck className="w-8 h-8 text-neutral-350 mb-2" />
          <p className="text-xs">No clinical context telemetry stream active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 border border-neutral-200/80 bg-white rounded-2xl overflow-hidden h-[600px] shadow-xs font-sans text-neutral-800">
      
      {/* Column 1: Messaging Thread List */}
      <div className="lg:col-span-1 border-r border-neutral-200/80 flex flex-col h-full bg-neutral-50/50 min-h-0">
        <div className="p-4 border-b border-neutral-100 space-y-3">
          <h3 className="font-bold text-sm text-neutral-900 tracking-tight">Outpatient Inboxes</h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-white border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-700 outline-none focus:ring-1 focus:ring-neutral-450"
            />
          </div>
        </div>

        {/* Thread Selectors Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 min-h-0">
          {threads.map((t) => {
            const isActive = t.id === activeThreadId;
            const initials = t.senderName.split(' ').map(n => n[0]).join('');
            
            return (
              <button
                key={t.id}
                id={`chat-thread-btn-${t.id}`}
                onClick={() => selectThread(t.id)}
                className={`w-full p-4 text-left transition-colors flex items-start gap-3 relative ${
                  isActive
                    ? 'bg-red-50/50'
                    : 'hover:bg-neutral-100/30'
                }`}
              >
                {/* Active Left Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 rounded-r-lg"></span>
                )}

                {t.senderAvatar ? (
                  <img src={t.senderAvatar} alt={t.senderName} className="w-9 h-9 rounded-full object-cover border border-neutral-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0 border border-red-200">
                    {initials}
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-neutral-900 truncate">{t.senderName}</p>
                    <span className="text-[10px] text-neutral-400 font-mono font-medium whitespace-nowrap">{t.time}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 line-clamp-1 leading-normal pr-1">{t.lastMessage || "(No messages)"}</p>
                </div>

                {t.unread && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Column 2 & 3: Interactive Dialogue Chat Area */}
      <div className="lg:col-span-2 border-r border-neutral-200/80 flex flex-col h-full justify-between min-h-0">
        {/* Active conversation header */}
        <div className="p-4 border-b border-neutral-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-sm text-neutral-900 pr-1">{activeThread.senderName}</h4>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full select-none">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
              Encrypted Channel
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">ID: {activeThread.id}</span>
        </div>

        {/* Symptoms Flag Header if active on thread */}
        {activeThread.symptoms && activeThread.symptoms.length > 0 && (
          <div className="bg-red-50/50 p-3 px-4 border-b border-red-100/65 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest mr-1">Alert Symptoms:</span>
            {activeThread.symptoms.map((sym, idx) => (
              <span key={idx} className="bg-white border border-red-200 text-red-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                {sym}
              </span>
            ))}
          </div>
        )}

        {/* Messaging Logs Dialogue stream */}
        <div className="flex-1 p-5 overflow-y-auto bg-neutral-50/20 space-y-4 min-h-0">
          {activeThread.messages === undefined || activeThread.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-xs text-neutral-400 gap-2">
              <MessageSquare className="w-8 h-8 text-neutral-300" />
              <p>No chat history available on secure workspace records.</p>
            </div>
          ) : (
            activeThread.messages.map((m) => {
              const isDoc = m.sender === 'doctor';
              return (
                <div key={m.id} className={`flex ${isDoc ? 'justify-end' : 'justify-start'}`}>
                  <div className="relative group max-w-[80%]">
                    {isDoc && (
                      <button
                        onClick={() => handleRecallMessage(m.id)}
                        className="opacity-0 group-hover:opacity-100 absolute -left-16 top-1/2 -translate-y-1/2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-[10px] font-bold px-2 py-1 rounded border border-red-200 transition-all shadow-xs cursor-pointer whitespace-nowrap z-10"
                        title="Recall message"
                      >
                        Recall
                      </button>
                    )}
                    <div className={`rounded-2xl p-3.5 text-xs shadow-xs relative ${
                      isDoc 
                        ? 'bg-neutral-900 text-white font-medium rounded-tr-none' 
                        : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none'
                    }`}>
                      <p className="leading-relaxed font-sans">{m.text}</p>
                      <span className={`text-[9px] block text-right mt-1.5 font-mono ${
                        isDoc ? 'text-neutral-400' : 'text-neutral-400'
                      }`}>{m.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions containing Custom write forms */}
        <div className="p-4 border-t border-neutral-100 bg-white space-y-3 shrink-0">

          {/* Form field */}
          <div className="flex items-center gap-2">
            <button className="p-2 bg-neutral-50 border border-neutral-250 hover:bg-neutral-100 text-neutral-500 rounded-xl cursor-pointer">
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Type encrypted message directly to patient..."
              value={typedMessage}
              id="chat-send-input"
              onChange={(e) => setTypedMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(typedMessage);
                }
              }}
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400"
            />
            <button
              onClick={() => handleSendMessage(typedMessage)}
              id="chat-send-btn"
              className="p-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Column 4: Context / Metrics / Reminders Bar */}
      <div className="lg:col-span-1 p-4 space-y-5 bg-neutral-50/50 flex flex-col h-full overflow-y-auto">
        
        {/* Vitals Telemetry logs */}
        {activeThread.clinicalContext ? (
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-600 flex items-center gap-1">
              <HeartPulse className="w-4 h-4 text-red-500 animate-pulse" />
              Patient Live Logs
            </h4>

            <div className="text-xs space-y-2.5 pt-1">
              <div className="flex justify-between items-center bg-neutral-50 p-2 border border-neutral-105 rounded-lg">
                <span className="text-neutral-500 font-semibold">Blood Pressure</span>
                <span className="font-bold font-mono text-neutral-900">{activeThread.clinicalContext.bp}</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-50 p-2 border border-neutral-105 rounded-lg">
                <span className="text-neutral-500 font-semibold">Heart Pulse</span>
                <span className="font-bold font-mono text-neutral-900">{activeThread.clinicalContext.pulse}</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-50 p-2 border border-neutral-105 rounded-lg">
                <span className="text-neutral-500 font-semibold">Body Temp</span>
                <span className="font-bold font-mono text-neutral-900">{activeThread.clinicalContext.temp}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200/85 rounded-xl p-4 text-center py-6 text-xs text-neutral-400">
            No live vitals connected for this inbox contact.
          </div>
        )}

        {/* Reminders & Tasks Checklist pane -> Staff Notebook */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs flex-1 flex flex-col justify-between">
          <div className="flex-1 flex flex-col">
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-600 border-b border-neutral-50 pb-2 mb-3">
              Staff Notebook
            </h4>
            
            <textarea
              value={noteText}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Write custom notes for this patient triage/session..."
              className="w-full flex-1 min-h-[150px] bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 resize-none font-sans"
            />
          </div>

          <div className="mt-3 text-[10px] text-neutral-400 italic font-mono pt-2 border-t border-dotted border-neutral-200">
            Notes auto-saved to local browser cache memory.
          </div>
        </div>

      </div>

    </div>
  );
}
