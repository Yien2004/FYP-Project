import React, { useState, useEffect, useRef, useMemo } from "react";
import { Send, Image, Paperclip, CheckCheck, User, Video, Calendar, ShieldCheck, Mail, ArrowUpRight, Search, FileDown, AlertCircle } from "lucide-react";
import { Message, Doctor, Appointment } from "../types";
import { mockDoctors } from "../mockData";

interface CommunicationProps {
  messages: Message[];
  onSendMessage: (msg: Message) => void;
  onSetScreen: (screen: string) => void;
  appointments: Appointment[];
}

interface ChatChannel {
  id: string;
  name: string;
  subtitle: string;
  image?: string;
  avatarInitials?: string;
  type: 'doctor' | 'staff';
  hospital?: string;
}

function getDefaultWelcomeMessage(channel: ChatChannel): Message[] {
  return [
    {
      id: `welcome-${channel.id}`,
      sender: "doctor",
      senderName: `Nurse ${channel.hospital?.includes("Klinik") ? "Aishah" : "Mei Ling"}`,
      content: `Hello Ahmad! Thank you for scheduling your appointment at ${channel.hospital}. I am your dedicated duty nurse for general triage and facility check-in questions.

Please feel free to ask about:
- Pre-consultation instructions (e.g. fasting requirements)
- Registration procedure & documents to bring
- Directions to the clinic or parking options
- General scheduling inquiries

How can I help you today?`,
      timestamp: "Just now"
    }
  ];
}

export default function Communication({ messages, onSendMessage, onSetScreen, appointments }: CommunicationProps) {
  const [activeInboxId, setActiveInboxId] = useState("");
  const [textInput, setTextInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  
  const [localChats, setLocalChats] = useState<Record<string, Message[]>>({});

  // Dynamic inbox channels list - ONLY show booked facility support channels
  const channels = useMemo<ChatChannel[]>(() => {
    const list: ChatChannel[] = [];

    // Find unique clinic names from booked appointments
    const bookedClinics = Array.from(
      new Set(
        appointments
          .map(apt => apt.clinic)
          .filter((c): c is string => !!c)
      )
    );

    bookedClinics.forEach(clinic => {
      const channelId = `staff-${clinic.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      if (!list.some(item => item.id === channelId)) {
        list.push({
          id: channelId,
          name: `${clinic} - Duty Nurse & Triage`,
          subtitle: "Facility General Support & Triage Desk",
          avatarInitials: clinic.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
          type: 'staff',
          hospital: clinic
        });
      }
    });

    return list;
  }, [appointments]);

  // Set default active inbox ID to first channel
  useEffect(() => {
    if (channels.length > 0 && !activeInboxId) {
      setActiveInboxId(channels[0].id);
    }
  }, [channels, activeInboxId]);

  // Active channel
  const activeChannel = useMemo(() => {
    return channels.find(c => c.id === activeInboxId) || null;
  }, [channels, activeInboxId]);

  // Sync and initialize localChats from defaults and parent messages prop
  useEffect(() => {
    const initialChats: Record<string, Message[]> = {};

    // First, set the default welcome message for all channels
    channels.forEach(ch => {
      initialChats[ch.id] = getDefaultWelcomeMessage(ch);
    });

    // Next, distribute messages from the prop into their respective channels
    messages.forEach(m => {
      const match = m.content.match(/^\[(staff-[a-z0-9-]+)\]:\s*([\s\S]*)$/);
      const cleanContent = match ? match[2] : m.content;
      
      // Determine the channel ID
      let channelId = match ? match[1] : "";
      if (!channelId && channels.length > 0) {
        // Fallback for legacy messages or reports without prefix
        channelId = channels[0].id;
      }

      if (channelId && initialChats[channelId]) {
        // Check if message already exists to avoid duplicates
        if (!initialChats[channelId].some(msg => msg.id === m.id)) {
          initialChats[channelId].push({
            ...m,
            content: cleanContent,
            sentAt: (m as any).sentAt || 0 // database messages are considered old
          } as any);
        }
      }
    });

    setLocalChats(initialChats);
  }, [channels, messages]);

  const activeMessages = useMemo(() => {
    if (!activeInboxId) return [];
    return localChats[activeInboxId] || [];
  }, [localChats, activeInboxId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // Word count check
  const wordCount = useMemo(() => {
    return textInput.trim().split(/\s+/).filter(Boolean).length;
  }, [textInput]);

  const isWordLimitExceeded = wordCount > 20;

  // Rate limit check: max 5 messages in 1 hour since last staff response
  const recentUserMessageCount = useMemo(() => {
    const chatMsgs = localChats[activeInboxId] || [];
    
    // Find index of the last staff message
    let lastStaffIndex = -1;
    for (let i = chatMsgs.length - 1; i >= 0; i--) {
      if (chatMsgs[i].sender !== "user") {
        lastStaffIndex = i;
        break;
      }
    }

    const msgsAfterStaff = lastStaffIndex === -1 ? chatMsgs : chatMsgs.slice(lastStaffIndex + 1);
    const userMsgs = msgsAfterStaff.filter(m => m.sender === "user");

    // Filter user messages sent in the last 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentMsgs = userMsgs.filter(m => {
      const sentTime = (m as any).sentAt || Date.now();
      return sentTime > oneHourAgo;
    });

    return recentMsgs.length;
  }, [localChats, activeInboxId]);

  const isRateLimitExceeded = recentUserMessageCount >= 5;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isWordLimitExceeded || isRateLimitExceeded) return;

    // Prefix the content with the channel/clinic ID
    const prefixedContent = `[${activeInboxId}]: ${textInput.trim()}`;

    const newMsg: Message = {
      id: "msg-" + Date.now(),
      sender: "user",
      senderName: "User (Ahmad Danish)",
      content: prefixedContent,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };
    // Attach current time in milliseconds to track rate limits
    (newMsg as any).sentAt = Date.now();

    onSendMessage(newMsg);
    setTextInput("");
  };

  const handleAttachReport = () => {
    if (isRateLimitExceeded) return;

    // Prefix the content with the channel/clinic ID
    const prefixedContent = `[${activeInboxId}]: Forwarded Carey AI symptom check diagnostic report file.`;

    const attachMsg: Message = {
      id: "msg-attach-" + Date.now(),
      sender: "user",
      senderName: "User (Ahmad Danish)",
      content: prefixedContent,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      attachmentName: "Carey_Triage_Summary_Secure.pdf",
      attachmentType: "document"
    };
    (attachMsg as any).sentAt = Date.now();

    onSendMessage(attachMsg);
  };

  return (
    <div id="communication-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Secure Provider Messaging</h1>
        <p className="text-sm text-slate-500 mt-1">
          Direct secure messaging pipeline protected under HIPAA and Malaysia MOH digital confidentiality standards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch h-[550px]">
        
        {/* Left Side: Inbox List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col justify-between overflow-y-auto font-sans">
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block px-2.5">Active Providers & Staff</span>
            
            <div className="space-y-2 font-sans">
              {channels.map((ch) => {
                const isActive = ch.id === activeInboxId;
                return (
                  <div 
                    key={ch.id}
                    onClick={() => setActiveInboxId(ch.id)}
                    className={`p-3 rounded-2xl flex gap-3 items-center justify-between cursor-pointer transition ${
                      isActive ? 'bg-teal-50 border border-teal-100 text-teal-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex gap-2.5 items-center">
                      {ch.image ? (
                        <img src={ch.image} alt={ch.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 font-mono">
                          {ch.avatarInitials}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block leading-none">{ch.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1 leading-normal">{ch.subtitle}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1 mt-6">
            <span className="font-bold text-slate-900 block">General Support Rules</span>
            <p className="text-[10px] text-slate-500 leading-normal">
              - Limit of 5 messages per hour before a staff member responds.<br />
              - Maximum message length is 20 words.
            </p>
          </div>
        </div>

        {/* Right Side: Conversation Thread Window */}
        {activeChannel ? (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between relative overflow-hidden">
            
            {/* Active Provider Header Panel */}
            <div className="bg-slate-50 border-b border-slate-100 p-4.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {activeChannel.image ? (
                  <img src={activeChannel.image} alt={activeChannel.name} className="w-11 h-11 rounded-xl object-cover border border-slate-100" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0 border border-slate-100 font-mono">
                    {activeChannel.avatarInitials}
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block leading-tight">{activeChannel.name}</span>
                  <span className="text-[10px] text-teal-700 font-semibold block font-mono">
                    Facility Support & Triage Desk
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button 
                  onClick={() => onSetScreen("schedule-appointment")}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                >
                  Book Appointment
                </button>
              </div>
            </div>

            {/* Active messages timeline */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[320px] scrollbar-thin">
              {activeMessages.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-1.5 ${
                      isUser 
                        ? 'bg-slate-900 text-white rounded-br-none shadow font-mono' 
                        : 'bg-teal-50/50 border border-teal-100/70 text-slate-800 rounded-bl-none shadow-sm'
                    }`}>
                      <div className="flex justify-between gap-6 text-[9px] opacity-75 font-mono">
                        <span className="font-bold">{isUser ? 'Patient (You)' : m.senderName}</span>
                        <span>{m.timestamp}</span>
                      </div>

                      <p className="leading-relaxed text-[11.5px] whitespace-pre-line font-medium font-sans">
                        {m.content}
                      </p>

                      {/* Document attachments bubble */}
                      {m.attachmentName && (
                        <div className="bg-white text-slate-800 p-2.5 rounded-xl flex items-center justify-between border border-slate-150 shadow-inner mt-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4.5 h-4.5 text-teal-600" />
                            <span className="font-semibold text-[10.5px] truncate max-w-[150px] font-mono">{m.attachmentName}</span>
                          </div>
                          <button 
                            onClick={() => alert(`Secure report PDF content fetched: ${m.attachmentName}`)}
                            className="bg-slate-100 hover:bg-slate-200 text-teal-800 font-bold p-1 px-2.5 rounded text-[10px] transition flex items-center gap-1"
                          >
                            <FileDown className="w-3.5 h-3.5" /> Open
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Form and Limits Panel */}
            <div className="bg-slate-50 border-t border-slate-100 flex flex-col shrink-0">
              {/* Warnings Area */}
              {(isWordLimitExceeded || isRateLimitExceeded) && (
                <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-rose-800 text-[11px] font-medium leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {isWordLimitExceeded && `Message length limit exceeded! Max 20 words allowed. (Current: ${wordCount} words)`}
                    {!isWordLimitExceeded && isRateLimitExceeded && `Message limit reached! You can send up to 5 messages per hour before a staff member responds.`}
                  </span>
                </div>
              )}
              
              {/* Compose message form */}
              <form onSubmit={handleSend} className="p-4 flex gap-2">
                <button 
                  type="button"
                  onClick={handleAttachReport}
                  disabled={isRateLimitExceeded}
                  className="p-3 border border-slate-200 hover:border-teal-500 bg-white hover:text-teal-600 rounded-xl text-slate-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Forward Carey AI diagnostic report attachment"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>

                <input 
                  id="message-input-doc"
                  type="text" 
                  value={textInput}
                  disabled={isRateLimitExceeded}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isRateLimitExceeded ? "Rate limit reached. Please wait for a reply..." : `Message ${activeChannel.name}...`}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500 font-bold disabled:bg-slate-100 disabled:text-slate-400"
                />

                <button 
                  id="message-btn-send"
                  type="submit"
                  disabled={!textInput.trim() || isWordLimitExceeded || isRateLimitExceeded}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs p-3 px-4.5 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-4 animate-fade-in font-sans">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900">No Support Chat Active</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                Active nursing and triage chat channels are generated automatically once you book an appointment at any of our facilities.
              </p>
            </div>
            <button
              onClick={() => onSetScreen("schedule-appointment")}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Book Appointment Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
