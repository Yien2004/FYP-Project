import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  PhoneCall,
  X
} from "lucide-react";
import { PatientProfile, VitalSign, ChatMessage } from "../types";

export interface HealthAssistantProps {
  patientProfile?: PatientProfile;
  vitals?: VitalSign[];
  onSetScreen?: (screen: string) => void;
  onInjectDoctorMessage?: (content: string) => void;
  appointments?: any[];
}

const QUICK_SYMPTOM_CHIPS = [
  { label: "Fever / Flu", query: "fever" },
  { label: "Chest Discomfort", query: "chest discomfort" },
  { label: "Stomach Ache", query: "stomach ache" },
  { label: "Joint Pain", query: "joint pain" },
  { label: "Routine Checkup", query: "routine health checkup" },
  { label: "Sore Throat", query: "sore throat" }
];

const FACILITY_MAP: Record<number, string> = {
  1: "Pantai Hospital Penang (Main Hospital)",
  2: "Pantai Heart & Wellness Pavilion",
  3: "Pantai Premier Clinic & Day Surgery",
  4: "Pantai Specialist Centre"
};

export default function HealthAssistant({
  patientProfile,
  vitals = [],
  onSetScreen,
  appointments = []
}: HealthAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-carey-assistant",
      role: "model",
      text: `Hello${patientProfile?.fullName ? " " + patientProfile.fullName.split(" ")[0] : ""}! I am Carey AI, your smart health triage assistant for Pantai Hospital Penang.

I can help evaluate your symptoms, provide emergency first-response guidance for acute red flags, or connect you with the right specialist across our 4 Penang facilities.

How are you feeling today, or what symptoms would you like to assess?`,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNavigateToBooking = (specialty: string, facilityId?: number) => {
    try {
      if (specialty) {
        localStorage.setItem("pantai_booking_preselected_specialty", specialty);
      }
      if (facilityId && FACILITY_MAP[facilityId]) {
        localStorage.setItem("pantai_booking_preselected_clinic", FACILITY_MAP[facilityId]);
        localStorage.setItem("pantai_booking_preselected_facility_id", String(facilityId));
      } else {
        localStorage.setItem("pantai_booking_preselected_clinic", "Pantai Hospital Penang (Main Hospital)");
      }
      localStorage.setItem("pantai_booking_initial_step", "1");
    } catch (e) {
      console.warn("Storage error:", e);
    }

    if (onSetScreen) {
      onSetScreen("schedule-appointment");
    } else {
      window.location.href = `/book-appointment?specialty=${encodeURIComponent(specialty)}&facilityId=${facilityId || 1}`;
    }
  };

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/triage/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          patientInfo: patientProfile ? {
            fullName: patientProfile.fullName,
            dateOfBirth: patientProfile.dateOfBirth,
            gender: patientProfile.gender,
            allergies: patientProfile.allergies,
            chronicConditions: patientProfile.chronicConditions,
            appointments: appointments.filter(a => a.status === 'Upcoming' || !a.status)
          } : undefined,
          region: patientProfile?.defaultRegion || "Bayan Lepas"
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // 若返回急症标志，立即弹出全屏紧急拦截窗口
      if (data.isEmergency) {
        setShowEmergencyModal(true);
      }

      // 渲染 Carey AI 的反馈气泡
      const botMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-reply",
        role: "model",
        text: data.reply || "Unable to complete triage assessment. Please contact hospital front desk directly.",
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        triageResult: {
          success: data.success,
          intent: data.intent,
          isEmergency: Boolean(data.isEmergency),
          isNonMedical: Boolean(data.isNonMedical),
          severityScore: data.severityScore || 1,
          recommendedSpecialty: data.recommendedSpecialty || "General Practice / Internal Medicine",
          facilityId: data.facilityId,
          facilityName: data.facilityName,
          reply: data.reply,
          language: data.language,
          activeAppointment: data.activeAppointment
        }
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("[HealthAssistant] Triage request failed:", error);
      const fallbackMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-fallback",
        role: "model",
        text: `Clinical Triage Assessment:\nBased on your description: "${trimmed}"\n\n• Recommended Department: General Practice / Internal Medicine\n• Acuity Severity Score: 2 / 10\n• Clinical Guidance: Stay hydrated and get adequate rest. If symptoms worsen or persist, please consult a doctor promptly.\n\nDisclaimer: Carey AI provides baseline triage guidance only and does not replace formal medical diagnosis.`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        triageResult: {
          isEmergency: false,
          severityScore: 2,
          recommendedSpecialty: "General Practice / Internal Medicine",
          facilityId: 1
        }
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto font-sans">
      {/* Full-Screen Emergency Red-Flag Intercept Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-red-600 text-slate-900 space-y-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold shrink-0">
                🚨
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-red-600 tracking-tight leading-snug">
                  EMERGENCY PROTOCOL ACTIVATED
                </h3>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
                  Critical Clinical Triage Warning
                </span>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-900 leading-relaxed font-medium">
              Life-threatening symptoms detected (e.g., severe chest pressure, acute respiratory distress). Routine outpatient booking is suspended. Seek emergency medical attention immediately!
            </div>

            <div className="space-y-3 pt-1">
              <a 
                href="tel:999" 
                className="bg-red-600 hover:bg-red-700 text-white font-bold p-3.5 rounded-xl block text-center shadow-lg transition text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Call National Ambulance (999)</span>
              </a>

              <a 
                href="tel:+6046432888" 
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold p-3.5 rounded-xl block text-center shadow-md transition text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Pantai Penang Emergency Hotline (+604-643 2888)</span>
              </a>

              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold p-3 rounded-xl text-sm transition mt-2 cursor-pointer"
              >
                Close & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      <div className="bg-white border border-slate-200 rounded-3xl flex flex-col justify-between h-[650px] shadow-sm relative overflow-hidden">
        {/* Chat Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 block font-sans">Carey AI Smart Health Triage</span>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Two-Tier Hybrid Engine
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">Pantai Hospital Penang Network (4 Facilities)</span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[500px] scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const triage = msg.triageResult;

            return (
              <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isUser 
                    ? "bg-sky-600 text-white rounded-br-none shadow-xs" 
                    : triage?.isEmergency 
                      ? "bg-red-50 border-2 border-red-300 text-slate-800 rounded-bl-none shadow-sm"
                      : "bg-sky-50/70 border border-sky-100 text-slate-800 rounded-bl-none shadow-xs"
                }`}>
                  {/* Sender Label */}
                  <div className="flex items-center justify-between gap-6 text-[10px] pb-1 opacity-80">
                    <span className="font-bold">{isUser ? "You" : "Carey AI (Pantai Triage)"}</span>
                    <span className="font-mono text-[9px]">{msg.timestamp}</span>
                  </div>

                  {/* Message Body */}
                  <div className="whitespace-pre-wrap select-text leading-relaxed font-sans text-xs">
                    {msg.text}
                  </div>

                  {/* Inline Emergency Red Flag Alert */}
                  {triage?.isEmergency && (
                    <div className="mt-3 bg-red-600 text-white rounded-xl p-3.5 space-y-2 shadow-sm">
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
                        <span>High-Risk Emergency Red Flag Detected (Severity: {triage.severityScore}/10)</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href="tel:999"
                          className="bg-white text-red-700 font-extrabold text-[11px] py-1.5 px-3 rounded-lg shadow-xs hover:bg-red-50 transition"
                        >
                          Call National Ambulance (999)
                        </a>
                        <a
                          href="tel:+6046432888"
                          className="bg-red-800 hover:bg-red-900 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shadow-xs transition"
                        >
                          Pantai Emergency: +604-643 2888
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 预约改期 / 重新选择时间快捷入口 */}
                  {triage?.intent === 'appointment_reschedule' && (
                    <div className="pt-2">
                      {triage?.activeAppointment ? (
                        <button
                          onClick={() => onSetScreen ? onSetScreen("appointments-history") : (window.location.href = "/appointments")}
                          className="mt-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {(triage?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "📅 更改此预约时间 →" : "📅 Reschedule Appointment →"}
                        </button>
                      ) : (
                        <button
                          onClick={() => onSetScreen ? onSetScreen("schedule-appointment") : (window.location.href = "/book-appointment")}
                          className="mt-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {(triage?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "🗓️ 预约新门诊 →" : "🗓️ Book New Appointment →"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* 预约查询快捷入口 */}
                  {triage?.intent === 'appointment_inquiry' && (
                    <div className="pt-2">
                      <button
                        onClick={() => onSetScreen ? onSetScreen("appointments-history") : (window.location.href = "/appointments")}
                        className="mt-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {(triage?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "📋 查看我的已确认预约凭证 →" : "📋 View My Confirmed Appointments →"}
                      </button>
                    </div>
                  )}

                  {/* 常规门诊一键跳转按钮（仅非急诊、非非医疗、非改期/查询展示） */}
                  {!triage?.isEmergency && !triage?.isNonMedical && triage?.recommendedSpecialty && triage?.recommendedSpecialty !== 'None' && triage?.intent !== 'appointment_reschedule' && triage?.intent !== 'appointment_inquiry' && triage?.intent !== 'boundary_refusal' && triage?.intent !== 'non_medical' && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleNavigateToBooking(triage.recommendedSpecialty, triage.facilityId)}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {(triage?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text))
                          ? `前往预约【${triage.recommendedSpecialty}】专科医生 →`
                          : `Book Appointment with ${triage.recommendedSpecialty} Specialist →`}
                      </button>
                    </div>
                  )}

                  {/* Quick-reply Symptom Chips */}
                  {!isUser && msg.id === "init-carey-assistant" && (
                    <div className="mt-3 pt-3 border-t border-sky-200/50 space-y-2">
                      <span className="text-[10px] uppercase font-sans tracking-wider text-slate-500 font-bold block">
                        Quick Symptom Triage (Click to evaluate):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_SYMPTOM_CHIPS.map(chip => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => handleSendMessage(chip.query)}
                            className="bg-white hover:bg-sky-100 active:bg-sky-200 text-slate-700 hover:text-sky-900 border border-slate-200 hover:border-sky-300 text-[11px] font-medium px-2.5 py-1 rounded-full transition cursor-pointer shadow-xs"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-center gap-2 text-sky-800 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Carey AI is evaluating clinical rules and symptom acuity...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-slate-50 border-t border-slate-200 p-4 flex gap-2 shrink-0 z-10">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your symptoms (e.g., chest discomfort, fever and cough, severe stomach pain)..."
            className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium shadow-inner"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs p-3.5 rounded-xl transition shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
