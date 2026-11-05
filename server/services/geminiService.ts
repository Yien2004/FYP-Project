import { GoogleGenAI } from '@google/genai';
import { TriageResult, PENANG_FACILITIES } from './triageEngine';

function getGeminiClient(): { ai: GoogleGenAI | null; apiKey: string } {
  const rawKey = process.env.GEMINI_API_KEY || '';
  const cleanKey = (rawKey && rawKey !== 'YOUR_GEMINI_API_KEY_HERE' && !rawKey.startsWith('YOUR_')) ? rawKey.trim() : '';
  return {
    apiKey: cleanKey,
    ai: cleanKey ? new GoogleGenAI({ apiKey: cleanKey }) : null
  };
}

// 系统提示词护栏（中英双语严格约束 + 槟城 4 处院区生态范围）
const SYSTEM_GUARDRAIL_EN = `
You are "Carey AI", the clinical outpatient triage and healthcare assistant for the Pantai Hospital Penang ecosystem on Penang Island, Malaysia.
The healthcare ecosystem strictly comprises 4 authorized Penang Island facilities:
1. Pantai Hospital Penang (Main Hospital) in Bayan Lepas (24/7 Tertiary & Emergency A&E)
2. Pantai Heart & Wellness Pavilion in Georgetown (Cardiovascular, Metabolic & Preventive Wellness)
3. Pantai Premier Clinic & Day Surgery in Bayan Baru (Gastroenterology, Dermatology & Family Medicine)
4. Pantai Specialist Centre in Ayer Itam (Orthopedics, Sports Rehab & ENT)

STRICT OPERATIONAL GUARDRAILS:
1. LANGUAGE: Respond in empathetic, professional, clear ENGLISH.
2. NEVER prescribe medications or make formal definitive diagnostic assertions.
3. The deterministic clinical triage engine has already computed the recommendation and urgency score. Adhere strictly to the recommended department and facility options. DO NOT replace or downgrade the recommended department to General Practice or Internal Medicine if a specific specialty (e.g. Orthopaedics & Sports Medicine, Orthopaedic Surgery, Gastroenterology & Hepatology, Cardiology, Ear, Nose & Throat, Dermatology) was provided. In particular, musculoskeletal, joint, knee, walking difficulty, or sports-related symptoms must NEVER be routed to General Practice or Internal Medicine; they must be directed to Orthopaedics.
4. If the user is asking about non-medical topics (such as weather, coding, casual chat), politely decline and state your medical triage scope.
5. Highlight to the patient that they can choose between the 4 dedicated Penang Island facilities (Bayan Lepas, Georgetown, Bayan Baru, Ayer Itam) based on proximity to their location. NEVER mention external branches in other states (e.g. Klang, Ampang, Cheras, Kuala Lumpur).
6. Always end with the standard disclaimer: "Disclaimer: Carey AI provides initial clinical triage and navigational guidance only, and does not constitute a formal medical diagnosis."
`;

const SYSTEM_GUARDRAIL_ZH = `
你是 "Carey AI"，槟城班台医院（Pantai Hospital Penang）生态专用的门诊分诊与导医助手。
医疗生态严格限定在槟城本地 4 处院区：
1. 槟城班台医院主院（Pantai Hospital Penang Main Hospital - 峇六拜 Bayan Lepas，24小时急诊与三级住院）
2. 乔治市心脏与健康中心（Pantai Heart & Wellness Pavilion - 乔治市 Georgetown）
3. 峇央峇鲁日间专科门诊（Pantai Premier Clinic & Day Surgery - 峇央峇鲁 Bayan Baru）
4. 亚依淡专科中心（Pantai Specialist Centre - 亚依淡 Ayer Itam）

必须严格遵守以下医疗与系统边界规范：
1. 语言：必须使用专业、温和的中文回答。
2. 严禁自主给患者下达最终疾病诊断或开具处方药品。
3. 内部规则引擎已完成临床科室与病情严重度计算，必须严格依据传入的科室进行说明，严禁擅自将骨科、胃肠科、心血管科、耳鼻喉科擅自篡改为普通内科。
4. 若患者输入非医疗问题（如天气、写代码、打招呼闲聊），直接予以礼貌拒绝，引导患者描述健康症状。
5. 提示患者可根据自身居住地点就近选择槟城 4 处院区（峇六拜主院、乔治市、峇央峇鲁、亚依淡），绝对不能提及吉隆坡、雪兰莪等外州分院（如 Klang、Ampang、Cheras）。
6. 回答末尾必须附带标准免责声明：“免责声明：Carey AI 仅提供初步分诊导医指引，不构成正式医疗诊断。”
`;

export async function generateCareyResponse(
  userMessage: string,
  triage: TriageResult
): Promise<string> {
  const isEn = triage.language === 'en';

  // 1. 非医疗提问防御拦截 (Guardrails: 天气 / 编程 / 闲聊)
  if (triage.isNonMedical) {
    if (isEn) {
      return `Hello! I am Carey AI, the healthcare intake assistant for Pantai Hospital Penang. My scope is strictly limited to clinical symptom triage and appointment navigation across our Penang facilities.

I am unable to answer non-medical inquiries such as weather, coding, or casual banter. Please share any health symptoms you are experiencing so I can assist you.

Disclaimer: Carey AI provides initial clinical triage and navigational guidance only, and does not constitute a formal medical diagnosis.`;
    }
    return `您好！我是槟城班台医院（PantaiCare）的医疗健康分诊助手 Carey AI。我的职责严格限定于协助患者进行临床症状分诊与槟城院区门诊导医。

我无法为您回答与医疗健康无关的问题（如天气、编程或闲聊）。如果您有任何身体不适或健康疑虑，请随时向我描述您的症状。

免责声明：Carey AI 仅提供初步分诊导医指引，不构成正式医疗诊断。`;
  }

  // 2. 如果是急症，为保证零延迟，直接返回硬编码的急诊指引，无需等待大模型返回
  if (triage.isEmergency) {
    if (isEn) {
      return `🚨 EMERGENCY RED-FLAG ALERT:
Critical emergency symptoms detected (${triage.matchedKeywords.join(', ')}). Your condition poses an immediate threat to life.

Routine outpatient booking has been suspended. Please immediately dial 999 for an ambulance or proceed directly to Pantai Hospital Penang 24/7 Accident & Emergency Department (Bayan Lepas).

A&E Emergency Direct Line: +604-643 2888.`;
    }
    return `🚨 紧急红牌拦截警报：
根据检测到的高危危急症状（${triage.matchedKeywords.join('、')}），您的病情属于危重急症，随时存在生命危险。

常规门诊预约流程已被系统强制阻断。请立即拨打 999 呼叫急救车，或直接前往槟城班台医院（Bayan Lepas）24小时急救部（A&E）。

医院 24 小时急诊直线：+604-643 2888。`;
  }

  // 3. 外州医院边界拦截（询问 Klang / Cheras / KL 等外地分院）
  if (triage.intent === 'boundary_refusal') {
    if (isEn) {
      return `Hello! Regarding your inquiry about booking appointments at branches in other states (such as Pantai Hospital Klang or Cheras):

Our healthcare intake system is exclusively dedicated to the Pantai Hospital Penang ecosystem on Penang Island, Malaysia. We are unable to arrange consultations or bookings for external branches in other states such as Selangor or Kuala Lumpur.

We warmly welcome you to receive specialized care at any of our 4 Penang Island facilities: Pantai Hospital Penang (Main Hospital in Bayan Lepas), Pantai Heart & Wellness Pavilion in Georgetown, Pantai Premier Clinic & Day Surgery in Bayan Baru, or Pantai Specialist Centre in Ayer Itam. Please feel free to select the doctor or facility nearest to you and schedule your appointment using the options below.

Disclaimer: Carey AI provides initial clinical triage and navigational guidance only, and does not constitute a formal medical diagnosis.`;
    }
    return `您好！关于您咨询外州医院（如巴生、焦赖或吉隆坡）的预约：

我们的医疗预约与分诊服务专属于槟城班台医院生态系统（位于槟城岛内），无法跨州为您预约雪兰莪或吉隆坡等外州分院（如 Pantai Hospital Klang 或 Cheras）。

欢迎您在槟城岛内我们 4 处院区进行预约：峇六拜主院（Bayan Lepas）、乔治市心脏中心（Georgetown）、峇央峇鲁日间门诊（Bayan Baru）或亚依淡专科中心（Ayer Itam）。您可点击下方按钮选择就近院区与医生进行挂号。

免责声明：Carey AI 仅提供初步分诊导医指引，不构成正式医疗诊断。`;
  }

  // 4. 预约改期 / 重新安排（不执行临床症状分诊）
  if (triage.intent === 'appointment_reschedule') {
    const activeApt = triage.activeAppointment;

    if (activeApt) {
      if (isEn) {
        return `Hello! Regarding your request to change or reschedule your appointment:

We found your scheduled appointment with ${activeApt.doctorName || 'our specialist'} at ${activeApt.clinic || 'Pantai Hospital Penang'} on ${activeApt.date}${activeApt.timeSlot ? ' at ' + activeApt.timeSlot : ''}.

To select a new consultation date or time slot, please tap the "Reschedule Appointment" button below to open your booking details. Please note that rescheduling requests should be submitted at least 2 hours before your scheduled visit.

Disclaimer: Carey AI provides initial clinical triage and navigational guidance only, and does not constitute a formal medical diagnosis.`;
      }
      return `您好！关于您调整预约时间的请求：

系统已查询到您已确认的门诊预约：主诊医生为 ${activeApt.doctorName || '专科医生'}，就诊院区为 ${activeApt.clinic || '槟城班台医院'}，时间为 ${activeApt.date}${activeApt.timeSlot ? ' ' + activeApt.timeSlot : ''}。

如需更改预约日期或时间段，请点击下方的“更改此预约时间”按钮前往预约管理页面重新选取合适的时间。建议至少提前 2 小时进行改期。

免责声明：Carey AI 仅提供初步分诊导医指引，不构成正式医疗诊断。`;
    }

    // No active appointment found
    if (isEn) {
      return `Hello! Regarding your request to change or reschedule an appointment:

We checked your account records and found that you currently do not have any active appointments scheduled with Pantai Hospital Penang.

If you would like to book a consultation with one of our specialists across our 4 Penang branches (Main Hospital in Bayan Lepas, Heart & Wellness Pavilion in Georgetown, Premier Clinic in Bayan Baru, or Specialist Centre in Ayer Itam), please click the "Book New Appointment" button below.

Disclaimer: Carey AI provides initial clinical triage and navigational guidance only, and does not constitute a formal medical diagnosis.`;
    }
    return `您好！关于您调整预约时间的请求：

系统查询显示您当前没有任何已安排的门诊预约记录可供更改或改签。

如果您需要就诊咨询，欢迎点击下方的“预约新门诊”按钮，在槟城 4 处院区（主院、乔治市心脏中心、峇央峇鲁门诊、亚依淡专科中心）中选择科室与专家进行挂号预约。

免责声明：Carey AI 仅提供初步分诊导医指引，不构成正式医疗诊断。`;
  }

  // 5. 预约查询
  if (triage.intent === 'appointment_inquiry') {
    if (isEn) {
      return `Hello! Regarding your appointment schedule inquiry:

${triage.preliminaryAdvice}

Please arrive at the clinic counter 5–10 minutes before your scheduled slot for registration check-in. You can view all confirmed booking details under the Bookings tab.

Disclaimer: Carey AI provides initial clinical triage and navigational guidance only, and does not constitute a formal medical diagnosis.`;
    }
    return `您好！关于您的预约时间查询：

${triage.preliminaryAdvice}

请在就诊前 5–10 分钟到达诊所前台进行现场签到。您也可以点击下方按钮查看完整的预约凭证。

免责声明：Carey AI 仅提供初步分诊导医指引，不构成正式医疗诊断。`;
  }

  // 6. 医生排班查询
  if (triage.intent === 'doctor_schedule') {
    if (isEn) {
      return `Hello! Here is information regarding our specialist duty rosters on Penang Island:

${triage.preliminaryAdvice}

Our clinical specialists practice across Pantai Hospital Penang (Main Hospital in Bayan Lepas), Pantai Heart & Wellness Pavilion (Georgetown), Pantai Premier Clinic (Bayan Baru), and Pantai Specialist Centre (Ayer Itam). You can view available timetable slots below.

Disclaimer: Carey AI provides initial clinical triage and navigational guidance only, and does not constitute a formal medical diagnosis.`;
    }
    return `您好！关于槟城班台专家的出诊与坐诊安排：

${triage.preliminaryAdvice}

我们的医生分布在槟城 4 处院区（峇六拜主院、乔治市心脏中心、峇央峇鲁门诊、亚依淡专科中心）。您可查看下方医生卡片直接预约。

免责声明：Carey AI 仅提供初步分诊导医指引，不构成正式医疗诊断。`;
  }

  // 7. 症状分诊本地熔断降级模板（应对超时、网络波动或无 Key 场景）
  const fallbackTemplateEn = `Clinical Triage Assessment Summary:
Based on your description: "${userMessage}"

• Recommended Specialty: ${triage.recommendedSpecialty}
• Clinical Urgency Score: ${triage.severityScore} / 10
• Primary Recommended Facility: ${triage.facilityName || 'Pantai Hospital Penang (Main Hospital)'}
• Initial Clinical Guidance: ${triage.preliminaryAdvice}

Our specialists are available across Penang Island at our Main Hospital (Bayan Lepas), Heart & Wellness Pavilion (Georgetown), Premier Clinic (Bayan Baru), and Specialist Centre (Ayer Itam). You can choose the clinic closest to your location below.

Disclaimer: Carey AI provides initial clinical triage and navigational guidance only, and does not constitute a formal medical diagnosis. If you develop acute chest pain or breathlessness, call 999 immediately.`;

  const fallbackTemplateZh = `症状分诊评估结论：
根据您的描述："${userMessage}"

• 建议就诊科室：${triage.recommendedSpecialty}
• 病情关注度评分：${triage.severityScore} / 10
• 推荐首选院区：${triage.facilityName || '槟城班台医院主院（Bayan Lepas）'}
• 临床护理指导：${triage.preliminaryAdvice}

槟城班台医疗生态在岛内设有 4 处院区（峇六拜主院、乔治市心脏中心、峇央峇鲁日间门诊、亚依淡专科中心），您可根据距离远近自由选择就诊。

免责声明：Carey AI 仅提供初步分诊导医指引，不构成正式医疗诊断。若出现胸部剧痛或呼吸困难，请立即拨打 999。`;

  const fallbackTemplate = isEn ? fallbackTemplateEn : fallbackTemplateZh;

  const { ai, apiKey } = getGeminiClient();

  if (!ai || !apiKey) {
    console.warn('[Carey AI] 未检测到有效的 GEMINI_API_KEY，已启动本地安全降级模板。');
    return fallbackTemplate;
  }

  const promptEn = `
Patient query: "${userMessage}"
Deterministic Rule Triage Result:
- Recommended Specialty: ${triage.recommendedSpecialty} (CRITICAL: Adhere to this exact specialty! Do NOT downgrade or alter to General Practice)
- Severity Score: ${triage.severityScore} / 10
- Primary Suggested Facility: ${triage.facilityName || 'Pantai Hospital Penang (Main Hospital)'}
- Clinical Care Advice: ${triage.preliminaryAdvice}

TASK INSTRUCTIONS:
Write a warm, professional 2-paragraph response in ENGLISH.
Paragraph 1: Empathetically explain why consulting an ${triage.recommendedSpecialty} specialist is the appropriate and targeted clinical step for the patient's symptoms (${userMessage}), and integrate the clinical home-care advice (${triage.preliminaryAdvice}). Never suggest General Practice if ${triage.recommendedSpecialty} was determined.
Paragraph 2: Inform the patient that PantaiCare operates 4 convenient branch locations across Penang Island (Main Hospital in Bayan Lepas, Heart & Wellness Pavilion in Georgetown, Premier Clinic in Bayan Baru, and Specialist Centre in Ayer Itam), so they may choose the doctor or facility nearest to them. Guide them to book an appointment below.
End with the disclaimer.`;

  const promptZh = `
患者输入： "${userMessage}"
确定性规则引擎分诊结果：
- 推荐科室： ${triage.recommendedSpecialty} （关键要求：必须严格基于【${triage.recommendedSpecialty}】进行说明，严禁篡改或降级为普通内科）
- 严重度评分： ${triage.severityScore} / 10
- 推荐首选院区： ${triage.facilityName || '槟城班台医院主院'}
- 护理建议： ${triage.preliminaryAdvice}

任务要求：
请以温和、专业的口吻撰写 2 段文字（使用中文）：
第一段：向患者解释推荐该科室（${triage.recommendedSpecialty}）的原因，融合护理建议。
第二段：告知患者班台医院在槟城岛内拥有 4 处院区（峇六拜主院、乔治市心脏中心、峇央峇鲁门诊、亚依淡专科中心），患者可根据自身所在位置就近预约就诊。引导其点击下方按钮进行门诊预约挂号。
末尾附带免责声明。`;

  try {
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API 调用超时')), 12000)
    );

    const apiCallPromise = (async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: isEn ? promptEn : promptZh,
        config: {
          systemInstruction: isEn ? SYSTEM_GUARDRAIL_EN : SYSTEM_GUARDRAIL_ZH,
          temperature: 0.2
        }
      });
      return response.text || fallbackTemplate;
    })();

    return await Promise.race([apiCallPromise, timeoutPromise]);
  } catch (error) {
    console.error('[Carey AI] Gemini 接口异常或超时，自动切换至确定性降级模板：', error);
    return fallbackTemplate;
  }
}
