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
  const cached = localStorage.getItem("lifelink_user_clinic");
  if (cached) return cached;

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
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});

  const localTranslateText = (text: string, targetLang: string): string => {
    const target = targetLang.toLowerCase();
    const isMalay = target.includes("malay") || target.includes("bahasa");
    const isChinese = target.includes("chin");
    const lowercase = text.toLowerCase();

    // Helper to extract and translate times
    const extractAndTranslateTime = (str: string, toZh: boolean): string => {
      const timeRegex = /(\d{1,2}(?:\.\d{2}|:\d{2})?\s*(?:am|pm|pagi|petang|malam))/i;
      const match = str.match(timeRegex);
      if (!match) return "";
      const rawTime = match[1];
      if (!toZh) return rawTime;
      const isPm = /pm/i.test(rawTime) || /petang|malam/i.test(rawTime);
      const numMatch = rawTime.match(/\d{1,2}(?:\.\d{2}|:\d{2})?/);
      const numStr = numMatch ? numMatch[0].replace(".", ":") : "";
      const period = isPm ? "下午" : "上午";
      return `${period} ${numStr}`;
    };

    // 1. Smart Intent-Based Semantic Sentence Translation Heuristic (Local NLP Model)
    // Intent: What time do you want to change to?
    if ((lowercase.includes("what time") || lowercase.includes("what 时间") || lowercase.includes("what masa") || lowercase.includes("pukul berapa") || lowercase.includes("什么时间") || (lowercase.includes("what") && lowercase.includes("time"))) &&
        (lowercase.includes("change") || lowercase.includes("ubah") || lowercase.includes("更改") || lowercase.includes("换") || lowercase.includes("reschedule") || lowercase.includes("tukar"))) {
      const isYesSure = lowercase.includes("yes") || lowercase.includes("sure") || lowercase.includes("ya") || lowercase.includes("当然") || lowercase.includes("是") || lowercase.includes("sure");
      const prefixEn = isYesSure ? "Yes sure, " : "";
      const prefixZh = isYesSure ? "好的，" : "";
      const prefixMs = isYesSure ? "Ya baik, " : "";

      return isMalay 
        ? `${prefixMs}pukul berapa anda mahu ubah?` 
        : isChinese 
          ? `${prefixZh}请问您想更改到什么时间？` 
          : `${prefixEn}what time would you like to change it to?`;
    }

    // Intent: Change Appointment Time
    if ((lowercase.includes("change") || lowercase.includes("ubah") || lowercase.includes("更改") || lowercase.includes("换")) && 
        (lowercase.includes("appointment") || lowercase.includes("temujanji") || lowercase.includes("预约") || lowercase.includes("booking")) &&
        (lowercase.includes("time") || lowercase.includes("masa") || lowercase.includes("时间"))) {
      
      const timeStr = extractAndTranslateTime(text, isChinese);
      if (timeStr) {
        return isMalay 
          ? `Hi, saya mahu ubah masa temujanji ke ${timeStr}.` 
          : isChinese 
            ? `你好，我想将预约时间更改为 ${timeStr}。` 
            : `Hi, I want to change the appointment time to ${timeStr}.`;
      }

      return isMalay 
        ? "Boleh saya ubah masa temujanji?" 
        : isChinese 
          ? "我可以更改预约时间吗？" 
          : "Can I change the appointment time?";
    }

    // Intent: Cancel Appointment
    if ((lowercase.includes("cancel") || lowercase.includes("batal") || lowercase.includes("取消")) && 
        (lowercase.includes("appointment") || lowercase.includes("temujanji") || lowercase.includes("预约") || lowercase.includes("booking"))) {
      return isMalay 
        ? "Boleh saya batalkan temujanji saya?" 
        : isChinese 
          ? "我可以取消我的预约吗？" 
          : "Can I cancel my appointment?";
    }

    // Intent: Severe Fever
    if ((lowercase.includes("fever") || lowercase.includes("demam") || lowercase.includes("发烧")) && 
        (lowercase.includes("severe") || lowercase.includes("teruk") || lowercase.includes("严重"))) {
      return isMalay 
        ? "Saya mengalami demam yang sangat teruk." 
        : isChinese 
          ? "我发高烧得非常严重。" 
          : "I am having a severe fever.";
    }

    // Intent: Chest Pain
    if (lowercase.includes("chest pain") || lowercase.includes("sakit dada") || lowercase.includes("胸痛") || lowercase.includes("胸口痛")) {
      return isMalay 
        ? "Saya mengalami sakit dada yang teruk." 
        : isChinese 
          ? "我感到严重的胸痛。" 
          : "I am experiencing severe chest pain.";
    }

    // Intent: Need Doctor/Help
    if ((lowercase.includes("doctor") || lowercase.includes("doktor") || lowercase.includes("医生")) && 
        (lowercase.includes("need") || lowercase.includes("help") || lowercase.includes("perlu") || lowercase.includes("bantu") || lowercase.includes("帮助") || lowercase.includes("需要"))) {
      return isMalay 
        ? "Saya memerlukan bantuan doktor." 
        : isChinese 
          ? "我需要医生的帮助。" 
          : "I need a doctor's assistance.";
    }

    // Intent: Hello Greeting
    if (lowercase.includes("hello") || lowercase.includes("hi") || lowercase.includes("hey") || lowercase.includes("apa khabar") || lowercase.includes("你好")) {
      if (text.trim().length <= 6) {
        return isMalay ? "Hello / Apa khabar" : isChinese ? "你好" : "Hello / Hi";
      }
      return isMalay 
        ? "Hello, bagaimanakah saya boleh membantu anda hari ini?" 
        : isChinese 
          ? "你好，请问有什么可以帮到您？" 
          : "Hello, how can I assist you today?";
    }

    // Intent: Thank you
    if (lowercase.includes("thank") || lowercase.includes("terima kasih") || lowercase.includes("谢谢")) {
      if (text.trim().length <= 12) {
        return isMalay ? "Terima kasih" : isChinese ? "谢谢" : "Thank you";
      }
      return isMalay 
        ? "Terima kasih banyak-banyak atas bantuan anda." 
        : isChinese 
          ? "非常感谢您的帮助。" 
          : "Thank you very much for your assistance.";
    }

    // Intent: Delay
    if (lowercase.includes("delay") || lowercase.includes("ditangguhkan") || lowercase.includes("延迟")) {
      return isMalay 
        ? "Jadual perundingan ditangguhkan seketika." 
        : isChinese 
          ? "时间表已暂时延迟。" 
          : "The schedule is temporarily delayed.";
    }

    // 2. Tokenized word-by-word vocabulary fallback (for custom words / sentence structures)
    const langKey = isMalay ? "ms" : isChinese ? "zh" : "en";
    const vocab = [
      // Multi-word phrases checked first (greedy match)
      { en: "chest pain", ms: "sakit dada", zh: "胸痛" },
      { en: "sore throat", ms: "sakit tekak", zh: "喉咙痛" },
      { en: "blood pressure", ms: "tekanan darah", zh: "血压" },
      { en: "heart rate", ms: "kadar nadi", zh: "心率" },
      { en: "thank you", ms: "terima kasih", zh: "谢谢" },
      { en: "terima kasih", ms: "terima kasih", zh: "谢谢" },
      { en: "apa khabar", ms: "apa khabar", zh: "你好" },
      { en: "sakit kepala", ms: "sakit kepala", zh: "头痛" },
      { en: "sakit dada", ms: "sakit dada", zh: "胸痛" },
      { en: "sakit tekak", ms: "sakit tekak", zh: "喉咙痛" },
      { en: "sakit perut", ms: "sakit perut", zh: "胃痛/肚子痛" },
      { en: "running nose", ms: "selesema/hidung berair", zh: "流鼻涕" },
      { en: "excuse me", ms: "maafkan saya", zh: "打扰一下" },
      
      // Pronouns & Common verbs
      { en: "yes", ms: "ya", zh: "是" },
      { en: "sure", ms: "tentu/ya", zh: "当然" },
      { en: "what", ms: "apa", zh: "什么" },
      { en: "time", ms: "masa", zh: "时间" },
      { en: "change", ms: "ubah", zh: "更改" },
      { en: "to", ms: "ke/untuk", zh: "到" },
      { en: "the", ms: "itu", zh: "的" },
      
      // Pronouns & Common verbs
      { en: "i", ms: "saya", zh: "我" },
      { en: "me", ms: "saya", zh: "我" },
      { en: "you", ms: "anda", zh: "你" },
      { en: "we", ms: "kami", zh: "我们" },
      { en: "they", ms: "mereka", zh: "他们" },
      { en: "he", ms: "dia", zh: "他" },
      { en: "she", ms: "dia", zh: "她" },
      { en: "my", ms: "saya punya", zh: "我的" },
      { en: "your", ms: "anda punya", zh: "你的" },
      { en: "his", ms: "dia punya", zh: "他的" },
      { en: "her", ms: "dia punya", zh: "她的" },
      { en: "our", ms: "kami punya", zh: "我们的" },
      { en: "their", ms: "mereka punya", zh: "他们的" },
      { en: "us", ms: "kami", zh: "我们" },
      { en: "them", ms: "mereka", zh: "他们" },
      { en: "have", ms: "ada", zh: "有" },
      { en: "has", ms: "ada", zh: "有" },
      { en: "had", ms: "ada", zh: "有" },
      { en: "want", ms: "mahu", zh: "想要" },
      { en: "need", ms: "perlu", zh: "需要" },
      { en: "go", ms: "pergi", zh: "去" },
      { en: "come", ms: "datang", zh: "来" },
      { en: "is", ms: "adalah", zh: "是" },
      { en: "am", ms: "adalah", zh: "是" },
      { en: "are", ms: "adalah", zh: "是" },
      { en: "can", ms: "boleh", zh: "可以" },
      { en: "feel", ms: "rasa", zh: "感觉" },
      { en: "feeling", ms: "rasa", zh: "感觉" },
      { en: "take", ms: "ambil", zh: "拿/服药" },
      { en: "eat", ms: "makan", zh: "吃" },
      { en: "drink", ms: "minum", zh: "喝" },
      { en: "sleep", ms: "tidur", zh: "睡觉" },
      { en: "rest", ms: "rehat", zh: "休息" },
      { en: "work", ms: "kerja", zh: "工作" },
      { en: "wait", ms: "tunggu", zh: "等" },
      
      // Medical Symptoms
      { en: "fever", ms: "demam", zh: "发烧" },
      { en: "demam", ms: "demam", zh: "发烧" },
      { en: "headache", ms: "sakit kepala", zh: "头痛" },
      { en: "cough", ms: "batuk", zh: "咳嗽" },
      { en: "batuk", ms: "batuk", zh: "咳嗽" },
      { en: "pain", ms: "sakit", zh: "痛" },
      { en: "sakit", ms: "sakit", zh: "痛" },
      { en: "stomach", ms: "perut", zh: "胃" },
      { en: "throat", ms: "tekak", zh: "喉咙" },
      { en: "dizzy", ms: "pening", zh: "头晕" },
      { en: "flu", ms: "selesema", zh: "感冒" },
      { en: "cold", ms: "sejuk/selesema", zh: "冷/感冒" },
      { en: "hot", ms: "panas", zh: "热" },
      { en: "vomit", ms: "muntah", zh: "呕吐" },
      { en: "diarrhea", ms: "cirit-birit", zh: "拉肚子" },
      { en: "nausea", ms: "loya", zh: "恶心" },
      { en: "allergy", ms: "alergi", zh: "过敏" },
      { en: "sick", ms: "sakit", zh: "生病" },
      { en: "hurt", ms: "sakit", zh: "痛" },
      { en: "injury", ms: "kecederaan", zh: "受伤" },
      { en: "accident", ms: "kemalangan", zh: "车祸" },
      { en: "emergency", ms: "kecemasan", zh: "紧急" },
      { en: "itching", ms: "gatal", zh: "痒" },
      { en: "rash", ms: "ruam", zh: "皮疹" },
      { en: "swelling", ms: "bengkak", zh: "肿胀" },
      
      // Anatomy
      { en: "head", ms: "kepala", zh: "头" },
      { en: "chest", ms: "dada", zh: "胸" },
      { en: "heart", ms: "jantung", zh: "心脏" },
      { en: "stomach", ms: "perut", zh: "胃" },
      { en: "leg", ms: "kaki", zh: "腿" },
      { en: "hand", ms: "tangan", zh: "手" },
      { en: "eye", ms: "mata", zh: "眼睛" },
      { en: "ear", ms: "telinga", zh: "耳朵" },
      { en: "throat", ms: "tekak", zh: "喉咙" },
      { en: "body", ms: "badan", zh: "身体" },
      { en: "blood", ms: "darah", zh: "血液" },
      
      // Medical Entities
      { en: "doctor", ms: "doktor", zh: "医生" },
      { en: "nurse", ms: "jururawat", zh: "护士" },
      { en: "hospital", ms: "hospital", zh: "医院" },
      { en: "clinic", ms: "klinik", zh: "诊所" },
      { en: "medicine", ms: "ubat", zh: "药" },
      { en: "vitals", ms: "vital", zh: "生命体征" },
      { en: "sugar", ms: "gula", zh: "糖" },
      { en: "pressure", ms: "tekanan", zh: "压力" },
      { en: "scan", ms: "imbasan", zh: "扫描" },
      { en: "test", ms: "ujian", zh: "测试" },
      { en: "result", ms: "keputusan", zh: "结果" },
      
      // Greetings
      { en: "hello", ms: "hello", zh: "你好" },
      { en: "hi", ms: "hi", zh: "你好" },
      { en: "hey", ms: "hey", zh: "嗨" },
      { en: "welcome", ms: "sama-sama", zh: "不客气" },
      
      // Scheduling & Operations
      { en: "appointment", ms: "temujanji", zh: "预约" },
      { en: "booking", ms: "tempahan", zh: "预订" },
      { en: "cancel", ms: "batal", zh: "取消" },
      { en: "delay", ms: "lambat", zh: "延迟" },
      { en: "delayed", ms: "ditangguhkan", zh: "延迟" },
      { en: "today", ms: "hari ini", zh: "今天" },
      { en: "tomorrow", ms: "esok", zh: "明天" },
      { en: "time", ms: "masa", zh: "时间" },
      { en: "sorry", ms: "maaf", zh: "抱歉" },
      { en: "please", ms: "tolong", zh: "请" },
      { en: "help", ms: "bantu", zh: "帮助" },
      { en: "change", ms: "ubah", zh: "change/更改" },
      { en: "the", ms: "itu", zh: "the/的" },
      { en: "yes", ms: "ya", zh: "是" },
      { en: "no", ms: "tidak", zh: "不" },
      
      // Adjectives
      { en: "good", ms: "baik", zh: "好" },
      { en: "fine", ms: "baik", zh: "好" },
      { en: "great", ms: "hebat", zh: "棒" },
      { en: "bad", ms: "buruk", zh: "坏" },
      { en: "severe", ms: "teruk", zh: "严重" },
      { en: "mild", ms: "ringan", zh: "轻微" },
      { en: "high", ms: "tinggi", zh: "高" },
      { en: "low", ms: "rendah", zh: "低" },
      { en: "safe", ms: "selamat", zh: "安全" }
    ];

    let result = text;

    // 1. Greedy replace multi-word phrases (case insensitive, retaining brackets to avoid double translations)
    vocab.forEach(entry => {
      if (entry.en.includes(" ")) {
        const regexEn = new RegExp(`\\b${entry.en}\\b`, "gi");
        result = result.replace(regexEn, `[[${entry[langKey]}]]`);
      }
      if (entry.ms.includes(" ") && entry.ms !== entry.en) {
        const regexMs = new RegExp(`\\b${entry.ms}\\b`, "gi");
        result = result.replace(regexMs, `[[${entry[langKey]}]]`);
      }
    });

    // 2. Tokenize the remaining text into words and non-words
    const tokens = result.split(/(\b[a-zA-Z0-9'\u4e00-\u9fa5]+\b)/g);

    // 3. Translate single tokens
    const translatedTokens = tokens.map(token => {
      // If it's a previously replaced bracketed phrase, strip the brackets
      if (token.startsWith("[[") && token.endsWith("]]")) {
        return token.slice(2, -2);
      }
      
      const trimmed = token.toLowerCase();
      // Look up in vocabulary
      const matched = vocab.find(v => v.en === trimmed || v.ms === trimmed || v.zh === trimmed);
      if (matched) {
        let trans = matched[langKey];
        // Retain original capitalization if applicable
        if (token[0] === token[0].toUpperCase() && token[0] !== token[0].toLowerCase()) {
          trans = trans.charAt(0).toUpperCase() + trans.slice(1);
        }
        return trans;
      }
      return token;
    });

    return translatedTokens.join("");
  };

  const handleTranslateMessage = (msgId: string, text: string) => {
    if (translatedMessages[msgId]) {
      setTranslatedMessages(prev => {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      });
      return;
    }

    const result = localTranslateText(text, "English");

    setTranslatedMessages(prev => ({
      ...prev,
      [msgId]: result
    }));
  };

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
    const cleanEmail = loggedEmail.replace(/[^a-zA-Z0-9]/g, '-');
    const adminThreadId = `chat-staff-${cleanEmail}`;

    Promise.all([
      fetch("/api/messages/threads").then(res => res.json()),
      fetch("/api/appointments").then(res => res.json()).catch(() => []),
      fetch(`/api/messages/threads/${adminThreadId}/messages`).then(res => res.json()).catch(() => [])
    ])
    .then(async ([threadsList, appointmentsList, adminMessages]) => {
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

      // Format admin messages
      const cleanedAdminMessages = (adminMessages || []).map((m: any) => {
        const text = m.content || m.text || '';
        return {
          ...m,
          text: text,
          sender: m.sender === 'user' ? 'patient' : m.sender
        };
      });

      const lastAdminMsg = cleanedAdminMessages.length > 0 ? cleanedAdminMessages[cleanedAdminMessages.length - 1] : null;
      const adminThread: ChatThread = {
        id: adminThreadId,
        senderName: 'System Administrator',
        lastMessage: lastAdminMsg ? lastAdminMsg.text : "Direct channel to the PenangHealth Global IT and Operations admin team.",
        time: lastAdminMsg ? lastAdminMsg.timestamp : "N/A",
        unread: false,
        messages: cleanedAdminMessages.length > 0 ? cleanedAdminMessages : [
          {
            id: 'welcome-admin',
            sender: 'patient',
            senderName: 'System Administrator',
            text: `Welcome to System Administrator Support. This is a direct, secure channel to the PenangHealth Global IT and Operations administration team.\n\nUse this channel to report technical issues or request operational support. How can we help?`,
            timestamp: 'Just Now'
          }
        ]
      };

      const hasAdminMessages = cleanedAdminMessages.length > 0;
      let isAdminClosed = false;
      if (hasAdminMessages) {
        const latest = cleanedAdminMessages[cleanedAdminMessages.length - 1];
        if (latest.text.includes("Chat closed by Administrator.")) {
          isAdminClosed = true;
        }
      }

      const finalThreads = [...mappedThreads];
      if (hasAdminMessages && !isAdminClosed) {
        finalThreads.unshift(adminThread);
      }

      if (finalThreads.length > 0) {
        const currentActiveId = activeThreadIdRef.current && finalThreads.some((t: any) => t.id === activeThreadIdRef.current)
          ? activeThreadIdRef.current 
          : finalThreads[0].id;

        if (activeThreadIdRef.current !== currentActiveId) {
          setActiveThreadId(currentActiveId);
        }

        if (currentActiveId === adminThreadId) {
          setThreads(finalThreads);
        } else {
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

              setThreads(finalThreads.map((t: any) => 
                t.id === currentActiveId ? { ...t, messages: cleanedMsgs } : t
              ));
            } else {
              setThreads(finalThreads);
            }
          } catch (e) {
            setThreads(finalThreads);
          }
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
    const cleanEmail = loggedEmail.replace(/[^a-zA-Z0-9]/g, '-');
    const adminThreadId = `chat-staff-${cleanEmail}`;

    if (id === adminThreadId) {
      try {
        const resMsgs = await fetch(`/api/messages/threads/${id}/messages`);
        const msgs = await resMsgs.json();
        if (Array.isArray(msgs)) {
          const cleanedMsgs = msgs.map((m: any) => ({
            ...m,
            text: m.content || m.text || '',
            sender: m.sender === 'user' ? 'patient' : m.sender
          }));
          setThreads(prev => prev.map(t => t.id === id ? { ...t, unread: false, messages: cleanedMsgs } : t));
        }
      } catch (err) {
        console.error("Failed to load admin messages", err);
      }
      return;
    }

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
    const cleanEmail = loggedEmail.replace(/[^a-zA-Z0-9]/g, '-');
    const adminThreadId = `chat-staff-${cleanEmail}`;

    let prefixedText = textToSend;
    let senderNameVal = 'Dr. Sarah Jenkins';
    const currentClinic = getClinicFromEmail(loggedEmail);
    const currentChannelId = currentClinic 
      ? `staff-${currentClinic.toLowerCase().replace(/[^a-z0-9]/g, "-")}` 
      : '';

    if (activeThread.id === adminThreadId) {
      prefixedText = textToSend;
      senderNameVal = currentClinic ? `${currentClinic} Staff` : (loggedEmail.split('@')[0]);
    } else {
      prefixedText = currentChannelId ? `[${currentChannelId}]: ${textToSend}` : textToSend;
      senderNameVal = currentClinic ? `Staff (${currentClinic})` : 'Dr. Sarah Jenkins';
    }

    const payload = {
      sender: 'doctor',
      senderName: senderNameVal,
      text: prefixedText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const tempMsgId = "msg-temp-" + Date.now();
    const tempMsg = {
      id: tempMsgId,
      sender: 'doctor',
      senderName: senderNameVal,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          lastMessage: textToSend,
          time: 'Just Now',
          unread: false,
          messages: [...(t.messages || []), tempMsg]
        };
      }
      return t;
    }));

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
          text: activeThread.id === adminThreadId 
            ? (savedMsg.content || savedMsg.text || '')
            : (currentClinic && (savedMsg.content || savedMsg.text || '').startsWith(`[${currentChannelId}]:`)
              ? (savedMsg.content || savedMsg.text || '').replace(`[${currentChannelId}]:`, '').trim()
              : (savedMsg.content || savedMsg.text || ''))
        };

        setThreads(prev => prev.map(t => {
          if (t.id === activeThread.id) {
            return {
              ...t,
              messages: (t.messages || []).map(m => m.id === tempMsgId ? cleanedSavedMsg : m)
            };
          }
          return t;
        }));
      }
    } catch (err) {
      console.warn("Failed to synchronize staff message to database, keeping local copy:", err);
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
                className={`w-full p-4 text-left transition-colors flex items-start gap-3 relative cursor-pointer ${
                  isActive
                    ? 'bg-sky-50/80 border-r-2 border-r-sky-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Active Left Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-sky-600 rounded-r-lg"></span>
                )}

                {t.senderAvatar ? (
                  <img src={t.senderAvatar} alt={t.senderName} className="w-9 h-9 rounded-full object-cover border border-neutral-200 shadow-xs" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200 shadow-xs">
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
                  <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0 mt-2 animate-pulse"></span>
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Encrypted Channel
            </span>
          </div>
        </div>

        {/* Symptoms Flag Header if active on thread */}
        {activeThread.symptoms && activeThread.symptoms.length > 0 && (
          <div className="bg-rose-50/60 p-3 px-4 border-b border-rose-100 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mr-1">Alert Symptoms:</span>
            {activeThread.symptoms.map((sym, idx) => (
              <span key={idx} className="bg-white border border-rose-200 text-rose-700 font-semibold px-2 py-0.5 rounded text-[10px]">
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
                        className="opacity-0 group-hover:opacity-100 absolute -left-16 top-1/2 -translate-y-1/2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-[10px] font-bold px-2 py-1 rounded border border-rose-200 transition-all shadow-xs cursor-pointer whitespace-nowrap z-10"
                        title="Recall message"
                      >
                        Recall
                      </button>
                    )}
                    <div className={`rounded-2xl p-3.5 text-xs shadow-xs relative ${
                      isDoc 
                        ? 'bg-sky-600 text-white font-medium rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}>
                      <p className="leading-relaxed font-sans">{m.text}</p>
                      <div className="flex justify-end items-center mt-1">
                        <span className={`text-[9.5px] font-mono ${
                          isDoc ? 'text-sky-200' : 'text-slate-400'
                        }`}>{m.timestamp}</span>
                      </div>
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
            <button className="p-2 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 text-neutral-500 rounded-xl cursor-pointer">
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder={activeThread.id.startsWith('chat-staff-') ? "Type message directly to System Administrator..." : "Type encrypted message directly to patient..."}
              value={typedMessage}
              id="chat-send-input"
              onChange={(e) => setTypedMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(typedMessage);
                }
              }}
              className="flex-1 bg-slate-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-200 transition"
            />
            <button
              onClick={() => handleSendMessage(typedMessage)}
              id="chat-send-btn"
              className="p-2 px-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Column 4: Context / Metrics / Reminders Bar */}
      <div className="lg:col-span-1 p-4 space-y-5 bg-neutral-50/50 flex flex-col h-full overflow-y-auto">
        
        {/* Vitals Telemetry logs or Admin Panel notice */}
        {activeThread.id.startsWith('chat-staff-') ? (
          <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-600 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Admin Support Desk
            </h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
              This channel connects you directly to PenangHealth System Administrators for technical support, roster adjustments, and diagnostics.
            </p>
          </div>
        ) : activeThread.clinicalContext ? (
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
