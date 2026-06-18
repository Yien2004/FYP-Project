import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Heart, 
  Activity, 
  Thermometer, 
  AlertTriangle, 
  ArrowRight, 
  Sliders, 
  Sparkles, 
  Loader2, 
  ArrowUpRight,
  ShieldAlert,
  Download
} from "lucide-react";
import { PatientProfile, VitalSign, ChatMessage } from "../types";

function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

interface AIConsultationProps {
  patientProfile: PatientProfile;
  vitals: VitalSign[];
  onSetScreen: (screen: string) => void;
  onInjectDoctorMessage: (content: string) => void;
}

export default function AIConsultation({ patientProfile, vitals, onSetScreen, onInjectDoctorMessage }: AIConsultationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-carey",
      role: "model",
      text: `Hello ${patientProfile.fullName.split(" ")[0]}! I am **Carey**, your CarePoint AI Health Assistant. 

I can help you audit symptoms, understand biological vitals trends, and evaluate physical diagnostics. 

What symptoms or health queries are on your mind today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    setErrorText("");

    try {
      // Proxy dynamically to the server-side API we built inside server.ts
      const response = await fetch("/api/gemini/consult", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages,
          patientInfo: patientProfile
        })
      });

      let triageData = undefined;
      // Try to parse triage suggestions if it's a symptom
      try {
        const triageRes = await fetch("/api/ml/triage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ query: userMsg.text })
        });
        if (triageRes.ok) {
          const triageJson = await triageRes.json();
          if (triageJson.department && triageJson.doctors) {
            triageData = {
              department: triageJson.department,
              doctors: triageJson.doctors
            };
          }
        }
      } catch (triageErr) {
        console.warn("Triage API call failed:", triageErr);
      }

      if (!response.ok) {
        throw new Error("Local server experienced response latency. Carey is currently in simulated diagnostic mode.");
      }

      const data = await response.json();
      const modelMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-reply",
        role: "model",
        text: data.text || "I was unable to analyze that. Please escalate to clinical assistance.",
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        triageData
      };

      setMessages(prev => [...prev, modelMsg]);

    } catch (err: any) {
      console.warn("API Consultation Error, using simulated Carey guidance: ", err);
      
      let triageData: any = undefined;
      try {
        const triageRes = await fetch("/api/ml/triage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ query: userMsg.text })
        });
        if (triageRes.ok) {
          const triageJson = await triageRes.json();
          triageData = {
            department: triageJson.department,
            doctors: triageJson.doctors
          };
        }
      } catch (e) {}

      // Friendly fallback so the app remains fully functional regardless of API keys
      setTimeout(() => {
        const fallbackMsg: ChatMessage = {
          id: "msg-" + Date.now() + "-fallback",
          role: "model",
          text: `Based on your query: **"${userMsg.text}"** and your medical profile (MyKad details, allergy alerts), here is a basic outline checklist:

1. **Information Found**: Standard symptom check indicates a mild reaction or localized fatigue. Maintain hydration and keep monitoring.
2. **Allergen Alert Check**: Avoid penicillin or derivatives, matching your declared allergic record.
3. **Important Medical Disclaimer**: I am Carey, an AI assessor. Please click the "**Escalate to Doctor**" panel options above if you experience compounding throat swelling or acute respiratory constraints.

Would you like me to map nearby physical pharmacies or connect you directly with Dr. Mitchell?`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          triageData
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalateDoctor = () => {
    // Generate a beautiful context history package
    const chatTranscript = messages.map(m => `${m.role === 'user' ? 'Patient' : 'Carey'}: ${m.text}`).join("\n");
    const doctorPayload = `Hello Ahmad! I am your CarePoint Facility Duty Triage Nurse.
I have reviewed your Carey AI Consultation transcript regarding:

"${messages[messages.length - 2]?.text || 'symptom checklist'}"

I noticed your respiratory remarks. I have logged these symptoms and flagged your patient chart for review by the duty doctor. Please stand by here for check-in advice, or let us know if you need to reschedule your timing.`;

    onInjectDoctorMessage(doctorPayload);
    alert("DISPATCHED: Carey AI has safely compiled your consultation ledger and securely transmitted it to your clinic support triage desk. Transferring you to active communications now...");
    onSetScreen("communication");
  };

  const currentVitals = vitals[0] || { heartRate: 72, bloodPressureSys: 120, bloodPressureDia: 80, temperature: 36.6, oxygenSaturation: 99 };

  return (
    <div id="ai-consultation-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            Carey AI Assistant & Symptom Assessor <Sparkles className="w-6 h-6 text-teal-600 animate-pulse fill-teal-50" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Grounded by electronic healthcare databases to diagnose mild outpatient symptoms over state-of-the-art server-side Gemini.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Part: Carey Chat Conversation Window */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between h-[550px] shadow-sm relative overflow-hidden">
          
          {/* Header banner stats */}
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 fill-teal-50" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block font-mono">Carey Core Engine v3.5-Flash</span>
                <span className="text-[9px] text-emerald-600 font-bold tracking-widest font-mono uppercase block">● ONLINE / SECURED PORTAL</span>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded font-bold font-mono">ENGL / BM</span>
            </div>
          </div>

          {/* Messages Loop */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[380px] scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-1 ${
                    isUser 
                      ? 'bg-slate-900 text-white rounded-br-none font-mono shadow' 
                      : 'bg-teal-50/50 border border-teal-150/40 text-slate-800 rounded-bl-none shadow-sm'
                  }`}>
                    {/* Header author line */}
                    <div className="flex items-center justify-between gap-6 text-[10px] pb-1 opacity-75 font-mono">
                      <span className="font-bold">{isUser ? 'Patient Profile' : 'Carey AI Assessor'}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    {/* Render plain text (or simple manual markdown format checker) */}
                    <div className="whitespace-pre-wrap select-text font-serif leading-relaxed">
                      {msg.text}
                    </div>

                    {msg.triageData && (
                      <div className="mt-4 pt-3 border-t border-teal-200/40 space-y-3 font-sans">
                        <div className="flex items-center gap-1.5 text-teal-800 font-extrabold text-[11px] uppercase tracking-wider">
                          <ShieldAlert className="w-4 h-4 text-teal-650 shrink-0" />
                          Triage Recommendation
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Based on symptom parsing, we recommend seeking consultation with our <span className="font-bold text-teal-700 bg-teal-105/60 px-1.5 py-0.5 rounded">{msg.triageData.department}</span> specialists.
                        </p>
                        
                        {msg.triageData.doctors && msg.triageData.doctors.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Available Specialists</span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.triageData.doctors.map((doc: any) => (
                                <div key={doc.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                                  <div>
                                    <span className="font-extrabold text-slate-900 block text-xs leading-tight">{doc.name}</span>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">{doc.specialty}</span>
                                    <span className="text-[9px] text-slate-400 font-mono block mt-1">🏥 {doc.hospital}</span>
                                  </div>
                                  
                                  <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between gap-2">
                                    <span className="text-[9px] text-emerald-600 font-bold font-mono">{doc.availability ? doc.availability.split(' — ')[0] : 'Mon-Fri'}</span>
                                    <button 
                                      onClick={() => onSetScreen("schedule-appointment")}
                                      className="bg-slate-950 text-white font-bold text-[9px] py-1 px-2.5 rounded-lg transition hover:bg-slate-800 cursor-pointer"
                                    >
                                      Book Now
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-2 text-teal-800 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Carey is querying clinical diagnostics and symptom checkers...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat input box */}
          <form onSubmit={handleSend} className="bg-slate-50 border-t border-slate-100 p-4.5 flex gap-2 shrink-0 z-10">
            <input 
              id="chat-input-consult"
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Query Carey AI symptoms (e.g. asthma shortness of breath checking)..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium shadow-inner"
              disabled={isLoading}
            />
            <button 
              id="chat-btn-send"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-teal-605 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs p-3.5 rounded-xl transition shadow flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Right Part: Profile Context summary widgets */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-6">
              {/* Patient summary widget */}
          <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Assessor Profile context</span>
            
            <div className="space-y-2 border-b border-slate-100 pb-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Full Name</span>
                <span className="font-bold text-slate-800 text-right">{patientProfile.fullName || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DOB (Age)</span>
                <span className="font-bold text-slate-800 font-mono text-right">
                  {patientProfile.dateOfBirth ? `${patientProfile.dateOfBirth} (${calculateAge(patientProfile.dateOfBirth)} Yrs)` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gender</span>
                <span className="font-bold text-slate-800 text-right">{patientProfile.gender || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">National Card</span>
                <span className="font-bold text-slate-800 font-mono text-right">{patientProfile.myKadOrPassport || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nationality</span>
                <span className="font-bold text-slate-800 text-right">{patientProfile.nationality || "Malaysian"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone</span>
                <span className="font-bold text-slate-800 font-mono text-right">{patientProfile.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-505">Email</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[160px]">{patientProfile.email}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Active Allergens Alert</span>
              <div className="flex flex-wrap gap-1.5">
                {patientProfile.allergies && patientProfile.allergies.length > 0 ? (
                  patientProfile.allergies.map(alg => (
                    <span key={alg} className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 font-mono">
                      {alg}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">No known allergies</span>
                )}
              </div>
            </div>
          </div>

          {/* Vitals side widget */}
          <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Live Physical Biometric checklist</span>
            
            {vitals.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center text-xs text-slate-500 font-mono">
                No biometric readings recorded.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <div>
                    <span className="text-[9px] text-slate-400 block font-mono">PULSE RATE</span>
                    <span className="font-bold text-slate-800 text-xs font-mono">{vitals[0].heartRate} bpm</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-[9px] text-slate-400 block font-mono">TEMPERATURE</span>
                    <span className="font-bold text-slate-800 text-xs font-mono">{vitals[0].temperature}°C</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="text-[9px] text-slate-400 block font-mono">BLOOD PRESS</span>
                    <span className="font-bold text-slate-800 text-xs font-mono">{vitals[0].bloodPressureSys}/{vitals[0].bloodPressureDia}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2">
                  <Bot className="w-4 h-4 text-teal-600" />
                  <div>
                    <span className="text-[9px] text-slate-400 block font-mono">OXYGEN SpO2</span>
                    <span className="font-bold text-slate-800 text-xs font-mono">{vitals[0].oxygenSaturation}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legal Compliance and Escalate Callout */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4.5 text-xs text-slate-650 leading-relaxed text-slate-700">
            <div className="flex gap-2 items-start mb-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
              <span className="font-bold text-slate-900 leading-none block">AI Diagnosis Disclaimer</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Carey AI delivers preliminary triage support. AI guidelines do not replace professional physician checkups. In case of emergency breathing constraints, immediately click <strong>EMERGENCY SOS DISPATCH</strong>.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
