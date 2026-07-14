import React, { useState, useEffect, useRef, useMemo } from "react";
import { Send, Image, Paperclip, CheckCheck, User, Video, Calendar, ShieldCheck, Mail, ArrowUpRight, Search, FileDown, AlertCircle } from "lucide-react";
import { Message, Doctor, Appointment } from "../types";
import { mockDoctors } from "../mockData";

interface CommunicationProps {
  messages: Message[];
  onSendMessage: (msg: Message) => void;
  onSetScreen: (screen: string) => void;
  appointments: Appointment[];
  patientProfile?: any;
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
  if (channel.id === 'admin-support') {
    return [
      {
        id: `welcome-${channel.id}`,
        sender: "doctor",
        senderName: "System Administrator",
        content: `Welcome to System Administrator Support. This is a direct, secure channel to the PenangHealth Global IT and Operations administration team.

Please use this channel to:
- Report software technical issues
- Request account verification assistance
- Inquire about data privacy and HIPAA details
- Send direct support requests to the system operator

Our support desk is monitored 24/7. How can we assist you today?`,
        timestamp: "Just now"
      }
    ];
  }
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

export default function Communication({ messages, onSendMessage, onSetScreen, appointments, patientProfile }: CommunicationProps) {
  const [activeInboxId, setActiveInboxId] = useState("");
  const [textInput, setTextInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  
  const [localChats, setLocalChats] = useState<Record<string, Message[]>>({});
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

    const patientLang = patientProfile?.language || "Mandarin";
    const targetLang = patientLang.includes("Malay") ? "Bahasa Malaysia" : "Chinese";
    const result = localTranslateText(text, targetLang);

    setTranslatedMessages(prev => ({
      ...prev,
      [msgId]: result
    }));
  };

  // Dynamic inbox channels list - ONLY show booked facility support channels & active admin chat
  const channels = useMemo<ChatChannel[]>(() => {
    const list: ChatChannel[] = [];

    // Scan messages for admin support prefix
    const adminMsgs = messages.filter(m => m.content.startsWith("[admin-support]:"));
    const hasAdminMsgs = adminMsgs.length > 0;
    let isAdminClosed = false;
    if (hasAdminMsgs) {
      const latest = adminMsgs[adminMsgs.length - 1];
      if (latest.content.includes("Chat closed by Administrator.")) {
        isAdminClosed = true;
      }
    }

    if (hasAdminMsgs && !isAdminClosed) {
      list.push({
        id: 'admin-support',
        name: 'System Administrator Support',
        subtitle: 'Global Operations & Admin Desk',
        avatarInitials: 'AD',
        type: 'staff',
        hospital: 'PenangHealth Headquarters'
      });
    }

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
  }, [appointments, messages]);

  // Set default active inbox ID to first channel
  useEffect(() => {
    if (channels.length > 0) {
      if (!activeInboxId || !channels.some(c => c.id === activeInboxId)) {
        setActiveInboxId(channels[0].id);
      }
    } else {
      setActiveInboxId("");
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
      const match = m.content.match(/^\[(staff-[a-z0-9-]+|admin-support)\]:\s*([\s\S]*)$/);
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

                      {translatedMessages[m.id] && (
                        <p className="mt-2 pt-2 border-t border-slate-200/30 italic text-[11px] text-teal-600 font-semibold font-sans">
                          {translatedMessages[m.id]}
                        </p>
                      )}

                      <div className="flex justify-start pt-1.5">
                        <button
                          type="button"
                          onClick={() => handleTranslateMessage(m.id, m.content)}
                          className="text-[9px] font-bold text-teal-600 hover:underline cursor-pointer"
                        >
                          {translatedMessages[m.id] ? "Show Original" : "🌐 Translate"}
                        </button>
                      </div>

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
