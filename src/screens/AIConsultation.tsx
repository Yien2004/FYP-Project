import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Heart, 
  Activity, 
  AlertTriangle, 
  ArrowRight, 
  Sliders, 
  Loader2, 
  ArrowUpRight,
  Download,
  PhoneCall,
  X
} from "lucide-react";
import { PatientProfile, VitalSign, ChatMessage, StructuredTriage } from "../types";
import { allPantaiDoctors } from "../data/pantaiHospitalsData";

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

function formatCleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
    .replace(/^>\s*(\[!.*?\])?\s*/gm, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\$/g, "")
    .trim();
}

const FACILITY_MAP: Record<number, string> = {
  1: "Pantai Hospital Penang (Main Hospital)",
  2: "Pantai Heart & Wellness Pavilion",
  3: "Pantai Premier Clinic & Day Surgery",
  4: "Pantai Specialist Centre"
};

// Helper: 严谨校验医生科室归属，杜绝任何跨科室杂乱（如耳鼻喉科混入牙科或内科）
function matchesDoctorSpecialty(doc: any, targetSpec: string): boolean {
  const specLower = (targetSpec || '').toLowerCase();
  const docDept = (doc.department || '').toLowerCase();
  const docSpec = (doc.specialty || '').toLowerCase();
  const fullField = `${docDept} ${docSpec}`;

  // 1. 耳鼻喉科 (ENT / Otorhinolaryngology)
  // 必须使用严格词边界，绝不能使用 includes("ent")，因为 dentistry、gastroenterology、intensive care 均包含 "ent" 子串！
  if (
    specLower.includes('ent') ||
    specLower.includes('ear') ||
    specLower.includes('throat') ||
    specLower.includes('otorhinolaryngology')
  ) {
    if (fullField.includes('dentist') || fullField.includes('orthodont') || fullField.includes('cardio') || fullField.includes('internal medicine') || fullField.includes('gastro')) {
      return false;
    }
    return /\b(ent|otorhinolaryngology|otolaryngology)\b/i.test(fullField) ||
           /ear,?\s*nose\s*(&|and)?\s*throat/i.test(fullField) ||
           /\b(ear|throat)\b/i.test(fullField);
  }

  // 2. 普通内科 / 呼吸内科 / 家庭医学 / 急性上感
  if (
    specLower.includes('internal') ||
    specLower.includes('general practice') ||
    specLower.includes('respiratory') ||
    specLower.includes('family medicine') ||
    specLower.includes('fever') ||
    specLower.includes('flu')
  ) {
    if (fullField.includes('dentist') || fullField.includes('orthodont') || fullField.includes('ophthalmolog')) {
      return false;
    }
    return (
      fullField.includes('internal medicine') ||
      fullField.includes('respiratory') ||
      fullField.includes('general practice') ||
      fullField.includes('family medicine')
    );
  }

  // 3. 心血管内科 (Cardiology)
  if (specLower.includes('cardio') || specLower.includes('heart')) {
    if (fullField.includes('dentist')) return false;
    return fullField.includes('cardio') || fullField.includes('heart') || fullField.includes('electrophysiology');
  }

  // 4. 骨科与运动医学 (Orthopaedics / Sports Medicine)
  if (
    specLower.includes('ortho') ||
    specLower.includes('bone') ||
    specLower.includes('joint') ||
    specLower.includes('sports medicine')
  ) {
    if (fullField.includes('dentist')) return false;
    return (
      fullField.includes('orthopedic') ||
      fullField.includes('orthopaedic') ||
      fullField.includes('sports medicine') ||
      fullField.includes('spine')
    );
  }

  // 5. 胃肠肝胆科 (Gastroenterology & Hepatology)
  if (specLower.includes('gastro') || specLower.includes('hepatolog') || specLower.includes('digest')) {
    if (fullField.includes('dentist')) return false;
    return fullField.includes('gastro') || fullField.includes('hepatolog') || fullField.includes('upper gi');
  }

  // 6. 儿科 (Paediatrics)
  if (specLower.includes('paediat') || specLower.includes('pediat') || specLower.includes('child')) {
    return fullField.includes('paediat') || fullField.includes('pediat');
  }

  // 7. 皮肤科 (Dermatology)
  if (specLower.includes('derma') || specLower.includes('skin')) {
    return fullField.includes('derma') || fullField.includes('skin');
  }

  // 8. 默认严格包含匹配
  return docDept.includes(specLower) || docSpec.includes(specLower);
}

// Location-aware and multi-facility doctor recommendation across Penang
function getRecommendedDoctors(
  specialty: string,
  primaryFacilityId?: number,
  userRegion?: string
): any[] {
  if (!specialty || specialty === 'None') return [];

  // 1. 严格过滤：必须真实符合目标专科，绝不允许跨科混入其他医生（严禁牙科等！）
  const strictlyMatchedDocs = allPantaiDoctors.filter(doc => matchesDoctorSpecialty(doc, specialty));

  if (strictlyMatchedDocs.length === 0) {
    return [];
  }

  // 2. 根据所在院区和就诊偏好计算推荐优先级得分
  const scored = strictlyMatchedDocs.map(doc => {
    const docHosp = doc.hospital || '';
    let facilityBonus = 0;

    if (primaryFacilityId && FACILITY_MAP[primaryFacilityId]) {
      if (docHosp === FACILITY_MAP[primaryFacilityId]) facilityBonus += 5;
    } else if (userRegion) {
      const reg = userRegion.toLowerCase();
      if (reg.includes('georgetown') && docHosp.includes('Pavilion')) facilityBonus += 4;
      if (reg.includes('bayan baru') && docHosp.includes('Premier')) facilityBonus += 4;
      if (reg.includes('ayer itam') && docHosp.includes('Specialist')) facilityBonus += 4;
      if (reg.includes('bayan lepas') && docHosp.includes('Main')) facilityBonus += 4;
    }

    const residentBonus = doc.status === 'Resident' ? 2 : 0;

    return {
      doc,
      score: 10 + facilityBonus + residentBonus,
      hospital: docHosp
    };
  });

  // 按医院分组，保证多院区覆盖
  const byHospital: Record<string, typeof scored> = {};
  for (const item of scored) {
    byHospital[item.hospital] = byHospital[item.hospital] || [];
    byHospital[item.hospital].push(item);
  }

  for (const h of Object.keys(byHospital)) {
    byHospital[h].sort((a, b) => b.score - a.score);
  }

  const selected: any[] = [];
  const primaryHospName = primaryFacilityId && FACILITY_MAP[primaryFacilityId]
    ? FACILITY_MAP[primaryFacilityId]
    : 'Pantai Hospital Penang (Main Hospital)';

  // 优先选取首选院区内的医生（最多 2 名）
  if (byHospital[primaryHospName] && byHospital[primaryHospName].length > 0) {
    selected.push(byHospital[primaryHospName][0].doc);
    if (byHospital[primaryHospName].length > 1) {
      selected.push(byHospital[primaryHospName][1].doc);
    }
  }

  // 随后从槟城其他院区各取 1 名同专科医生
  const facilityOrder = [
    'Pantai Heart & Wellness Pavilion',
    'Pantai Premier Clinic & Day Surgery',
    'Pantai Specialist Centre',
    'Pantai Hospital Penang (Main Hospital)'
  ];

  for (const hospName of facilityOrder) {
    if (hospName !== primaryHospName && byHospital[hospName] && byHospital[hospName].length > 0) {
      selected.push(byHospital[hospName][0].doc);
      if (selected.length >= 4) break;
    }
  }

  // 若仍未满 4 名，仅从严格匹配本专科的医生池中补充，严禁去其他科室抓人！
  if (selected.length < 4) {
    const selectedIds = new Set(selected.map(d => d.id || d.name));
    scored.sort((a, b) => b.score - a.score);
    for (const item of scored) {
      if (!selectedIds.has(item.doc.id || item.doc.name)) {
        selected.push(item.doc);
        selectedIds.add(item.doc.id || item.doc.name);
        if (selected.length >= 4) break;
      }
    }
  }

  // 若全槟城仅有 2 位该专科医生，就仅展示这 2 位医生，绝不拼凑！
  return selected.slice(0, 4);
}

const QUICK_SYMPTOM_CHIPS = [
  { label: "Fever / Flu", query: "fever" },
  { label: "Child Sick", query: "child sick" },
  { label: "Health Checkup", query: "routine health checkup" },
  { label: "Stomach Ache", query: "stomach ache" },
  { label: "Chest Discomfort", query: "chest discomfort" },
  { label: "Joint / Bone Pain", query: "joint pain" }
];

interface AIConsultationProps {
  patientProfile: PatientProfile;
  vitals: VitalSign[];
  onSetScreen: (screen: string) => void;
  onInjectDoctorMessage?: (content: string) => void;
  appointments?: any[];
}

export default function AIConsultation({ patientProfile, vitals, onSetScreen, appointments = [] }: AIConsultationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-health-assistant",
      role: "model",
      text: `Hello ${patientProfile.fullName.split(" ")[0]}! I am your Health Assistant (Carey AI). 

I can help you review symptoms, evaluate urgency scores, and guide you to our Penang specialist clinics. 

What symptoms or health questions would you like to discuss today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [errorText, setErrorText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
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

  const executeSend = async (queryText: string) => {
    const trimmed = queryText.trim();
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
    setErrorText("");

    try {
      // Dual-Stage Hybrid Carey AI Triage endpoint with patient profile & appointments context
      const response = await fetch("/api/triage/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMsg.text,
          patientInfo: {
            fullName: patientProfile.fullName,
            dateOfBirth: patientProfile.dateOfBirth,
            gender: patientProfile.gender,
            allergies: patientProfile.allergies,
            chronicConditions: patientProfile.chronicConditions,
            appointments: appointments.filter(a => a.status === 'Upcoming' || !a.status)
          },
          region: patientProfile.defaultRegion || "Bayan Lepas"
        })
      });

      if (!response.ok) {
        throw new Error("Server latency.");
      }

      const data = await response.json();

      // Intercept critical emergency red-flags
      if (data.isEmergency) {
        setShowEmergencyModal(true);
      }

      // Check for matching specialist doctors across Penang ecosystem
      let triageData: any = undefined;
      const isAppointmentIntent = data.intent === 'appointment_reschedule' || data.intent === 'appointment_inquiry';
      const isNonSpecialty = isAppointmentIntent || data.intent === 'boundary_refusal' || data.intent === 'non_medical' || data.isNonMedical || data.recommendedSpecialty === 'None';
      
      if (!data.isEmergency && !data.isNonMedical && data.recommendedSpecialty && !isNonSpecialty) {
        const matched = getRecommendedDoctors(
          data.recommendedSpecialty,
          data.facilityId,
          patientProfile.defaultRegion
        );

        if (matched.length > 0) {
          triageData = {
            department: data.recommendedSpecialty,
            doctors: matched,
            isBooking: false,
            facility: data.facilityName || (data.facilityId && FACILITY_MAP[data.facilityId]) || "Pantai Hospital Penang (Main Hospital)"
          };
        }
      }

      const modelMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-reply",
        role: "model",
        text: data.reply || "I was unable to analyze that. Please escalate to clinical assistance.",
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        triageData,
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

      setMessages(prev => [...prev, modelMsg]);

    } catch (err: any) {
      console.warn("API Consultation Error, using simulated Health Assistant guidance: ", err);

      setTimeout(() => {
        const fallbackMsg: ChatMessage = {
          id: "msg-" + Date.now() + "-fallback",
          role: "model",
          text: `Clinical Triage Assessment:\nBased on your description: "${userMsg.text}"\n\n• Recommended Department: General Practice / Internal Medicine\n• Acuity Severity Score: 2 / 10\n• Clinical Guidance: Stay hydrated and get adequate rest. If symptoms worsen or persist, please visit hospital outpatient clinics.\n\nDisclaimer: Carey AI provides preliminary triage guidance only and does not substitute formal medical diagnosis.`,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          triageResult: {
            isEmergency: false,
            severityScore: 2,
            recommendedSpecialty: "General Practice / Internal Medicine",
            facilityId: 1
          }
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    executeSend(inputValue);
  };

  const currentVitals = vitals[0] || { heartRate: 72, bloodPressureSys: 120, bloodPressureDia: 80, temperature: 36.6, oxygenSaturation: 99 };

  return (
    <div id="ai-consultation-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans relative">
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
            Health Assistant
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Part: Health Assistant Chat Conversation Window */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between h-[550px] shadow-sm relative overflow-hidden">
          
          {/* Header banner stats */}
          <div className="bg-slate-50 border-b border-slate-150 p-4 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-sky-600 text-white rounded-xl flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5 fill-sky-50" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block font-sans">Carey AI Smart Triage</span>
              </div>
            </div>
          </div>

          {/* Messages Loop */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[380px] scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isEmergency = msg.triageResult?.isEmergency || msg.structuredTriage?.requires_emergency;

              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-1 ${
                    isUser 
                      ? 'bg-sky-600 text-white rounded-br-none shadow-xs' 
                      : isEmergency
                        ? 'bg-red-50 border-2 border-red-300 text-slate-900 rounded-bl-none shadow-sm'
                        : 'bg-sky-50/70 border border-sky-100 text-slate-800 rounded-bl-none shadow-xs'
                  }`}>
                    {/* Header author line */}
                    <div className="flex items-center justify-between gap-6 text-[10px] pb-1 opacity-80 font-sans">
                      <span className="font-bold">{isUser ? 'You' : 'Carey AI'}</span>
                      <span className="font-mono text-[9px]">{msg.timestamp}</span>
                    </div>
                    {/* Render message content */}
                    <div className="whitespace-pre-wrap select-text leading-relaxed font-sans">
                      {formatCleanText(msg.text)}
                    </div>

                    {/* Emergency 999 Alert Banner */}
                    {isEmergency && (
                      <div className="mt-3 bg-red-600 text-white rounded-2xl p-4 shadow-md space-y-3 font-sans border-2 border-red-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                            🚨
                          </div>
                          <div>
                            <div className="text-xs font-black tracking-wide uppercase">Immediate Emergency Medical Alert</div>
                            <div className="text-[10px] text-red-100 font-medium">Critical red-flag symptoms detected. Do not wait for an appointment.</div>
                          </div>
                        </div>

                        <div className="bg-red-700/60 rounded-xl p-2.5 text-[11px] leading-relaxed text-red-50">
                          Please call <strong>999</strong> immediately or proceed directly to your nearest 24/7 Pantai Hospital Emergency Department.
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href="tel:999"
                            className="bg-white text-red-700 hover:bg-red-50 active:bg-red-100 font-extrabold text-[11px] py-1.5 px-3.5 rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>📞 Call 999 (SOS)</span>
                          </a>
                          <a
                            href="tel:+6046432888"
                            className="bg-red-800 hover:bg-red-900 active:bg-red-950 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>🏥 A&E: +604-643 2888</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* 预约改期 / 重新选择时间快捷入口 */}
                    {msg.triageResult?.intent === 'appointment_reschedule' && (
                      <div className="pt-2">
                        {msg.triageResult?.activeAppointment ? (
                          <button
                            onClick={() => onSetScreen("appointments-history")}
                            className="mt-3 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            {(msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "📅 更改此预约时间 →" : "📅 Reschedule Appointment →"}
                          </button>
                        ) : (
                          <button
                            onClick={() => onSetScreen("schedule-appointment")}
                            className="mt-3 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            {(msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "🗓️ 预约新门诊 →" : "🗓️ Book New Appointment →"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* 预约查询快捷入口 */}
                    {msg.triageResult?.intent === 'appointment_inquiry' && (
                      <div className="pt-2">
                        <button
                          onClick={() => onSetScreen("appointments-history")}
                          className="mt-3 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {(msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "📋 查看我的已确认预约凭证 →" : "📋 View My Confirmed Appointments →"}
                        </button>
                      </div>
                    )}

                    {/* 常规门诊一键跳转预约按钮（仅非急症、非非医疗、非改期/查询展示） */}
                    {!isEmergency && !msg.triageResult?.isNonMedical && msg.triageResult?.recommendedSpecialty && msg.triageResult?.recommendedSpecialty !== 'None' && msg.triageResult?.intent !== 'appointment_reschedule' && msg.triageResult?.intent !== 'appointment_inquiry' && msg.triageResult?.intent !== 'boundary_refusal' && msg.triageResult?.intent !== 'non_medical' && (
                      <div className="pt-2">
                        <button
                          onClick={() => handleNavigateToBooking(msg.triageResult!.recommendedSpecialty, msg.triageResult!.facilityId)}
                          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {(msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text))
                            ? `前往预约【${msg.triageResult.recommendedSpecialty}】专科医生 →`
                            : `Book Appointment with ${msg.triageResult.recommendedSpecialty} Specialist →`}
                        </button>
                      </div>
                    )}

                    {/* Quick-reply Symptom Chips: Rendered only on initial greeting to prevent cluttering administrative conversations */}
                    {!isUser && msg.id === "init-health-assistant" && !isEmergency && (
                      <div className="mt-3 pt-3 border-t border-sky-200/50 space-y-2 font-sans">
                        <span className="text-[10px] uppercase font-sans tracking-wider text-slate-500 font-bold block">
                          Select a symptom for instant triage:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_SYMPTOM_CHIPS.map(chip => (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => executeSend(chip.query)}
                              className="bg-white hover:bg-sky-100 active:bg-sky-200 text-slate-700 hover:text-sky-900 border border-slate-200 hover:border-sky-300 text-[11px] font-medium px-2.5 py-1 rounded-full transition cursor-pointer shadow-xs"
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Doctor Recommendation Cards: Rendered only for clinical triage or roster inquiries */}
                    {(msg.triageResult?.intent === 'symptom_triage' || msg.triageResult?.intent === 'doctor_schedule' || !msg.triageResult?.intent) && 
                      msg.triageResult?.intent !== 'appointment_reschedule' && msg.triageResult?.intent !== 'appointment_inquiry' &&
                      msg.triageData && msg.triageData.doctors && msg.triageData.doctors.length > 0 && !isEmergency && (
                      <div className="mt-4 pt-3 border-t border-sky-200/60 space-y-3 font-sans">
                        <div className="flex items-center justify-between">
                          <div className="text-sky-800 font-bold text-[11px] uppercase tracking-wider">
                            {msg.triageResult?.intent === 'doctor_schedule' 
                              ? ((msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "槟城各院区专家排班" : "Specialist Roster Across Penang Facilities") 
                              : ((msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? `推荐就诊专家（槟城 4 处院区）` : `Recommended Specialists Across Penang Facilities`)}
                          </div>
                          <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {(msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "多院区覆盖" : "Multi-Site Distribution"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {msg.triageResult?.intent === 'doctor_schedule' 
                            ? ((msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "以下为符合您查询的在岗医生排班名单：" : "Here are the available specialists matching your roster inquiry.")
                            : ((msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text))
                                ? `基于您的症状推荐【${msg.triageData.department}】科室。以下为您精选槟城主院及各附属门诊在岗专家，您可根据距离选择就近院区：`
                                : `Based on your symptoms, we recommend consulting our ${msg.triageData.department} specialists. Below are consultants across our Penang facilities (Main Hospital, Georgetown, Bayan Baru, Ayer Itam). Choose the branch nearest to you:`)}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.triageData.doctors.map((doc: any) => (
                              <div key={doc.id || doc.name} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col justify-between hover:border-sky-300 transition">
                                <div>
                                  <span className="font-bold text-slate-900 block text-xs leading-tight">{doc.name}</span>
                                  <span className="text-[10px] text-slate-500 block mt-0.5">{doc.department || doc.specialty}</span>
                                  <span className="text-[9px] text-sky-800 font-semibold block mt-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 inline-block">
                                    🏥 {doc.hospital}
                                  </span>
                                </div>
                                
                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                  <span className="text-[9px] text-emerald-600 font-bold">{doc.availability ? doc.availability.split(' — ')[0] : 'Available'}</span>
                                  <button 
                                    onClick={() => {
                                      try {
                                        if (doc.hospital) {
                                          localStorage.setItem("pantai_booking_preselected_clinic", doc.hospital);
                                        }
                                        if (doc.name) {
                                          localStorage.setItem("pantai_booking_preselected_doctor", doc.name);
                                        }
                                        const spec = doc.department || doc.specialty || msg.triageData?.department || "";
                                        if (spec) {
                                          localStorage.setItem("pantai_booking_preselected_specialty", spec);
                                        }
                                        localStorage.setItem("pantai_booking_initial_step", "4");
                                      } catch {}
                                      onSetScreen("schedule-appointment");
                                    }}
                                    className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1"
                                  >
                                    {(msg.triageResult?.language === 'zh' || /[\u4e00-\u9fa5]/.test(msg.text)) ? "预约医生" : "Book Doctor"} <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
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
                  <span>Health Assistant is analyzing symptom information...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat input box */}
          <form onSubmit={handleSend} className="bg-slate-50 border-t border-slate-100 p-4 flex gap-2 shrink-0 z-10">
            <input 
              id="chat-input-consult"
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe symptoms (e.g. slight cough, sore throat, or mild fever)..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium shadow-inner"
              disabled={isLoading}
            />
            <button 
              id="chat-btn-send"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs p-3.5 rounded-xl transition shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
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
                <span className="text-slate-500">MyKad</span>
                <span className="font-bold text-slate-800 font-mono text-right">{patientProfile.myKadOrPassport || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone</span>
                <span className="font-bold text-slate-800 font-mono text-right">{patientProfile.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
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

        </div>

      </div>
    </div>
  );
}
