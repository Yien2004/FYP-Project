export interface TriageResult {
  intent: 'emergency' | 'symptom_triage' | 'appointment_inquiry' | 'appointment_reschedule' | 'doctor_schedule' | 'boundary_refusal' | 'non_medical' | 'general';
  severityScore: number; // 严重度评分（1 到 10）
  isEmergency: boolean; // 是否属于急症（评分 >= 7 为 true）
  isNonMedical?: boolean;
  recommendedSpecialty: string; // 推荐科室
  matchedKeywords: string[]; // 匹配到的症状关键词
  suggestedFacilityId?: number; // 1: 主院, 2: 乔治市心脏中心, 3: 峇央峇鲁日间门诊, 4: 亚依淡专科中心
  facilityName?: string;
  preliminaryAdvice: string; // 本地预设的临床护理建议
  language: 'en' | 'zh';
  activeAppointment?: any;
}

interface ClinicalRule {
  category: string;
  keywords: RegExp[];
  baseSeverity: number;
  isEmergency: boolean;
  specialty: string;
  facilityId: number; // 1: Main Hospital, 2: Georgetown, 3: Bayan Baru, 4: Ayer Itam
  adviceEn: string;
  adviceZh: string;
}

export const PENANG_FACILITIES: Record<number, { name: string; tag: string; city: string }> = {
  1: { name: 'Pantai Hospital Penang (Main Hospital)', tag: 'Bayan Lepas Main Hospital & 24/7 A&E', city: 'Bayan Lepas' },
  2: { name: 'Pantai Heart & Wellness Pavilion', tag: 'Georgetown Branch', city: 'Georgetown' },
  3: { name: 'Pantai Premier Clinic & Day Surgery', tag: 'Bayan Baru Branch', city: 'Bayan Baru' },
  4: { name: 'Pantai Specialist Centre', tag: 'Ayer Itam Branch', city: 'Ayer Itam' }
};

// 对应论文 Table 3.2 完整知识库矩阵（双语对称匹配、涵盖中风 FAST、心梗、致命出血、骨科运动医学、胃肠消化、心血管筛查、耳鼻喉、皮肤科）
export const CLINICAL_RULES: ClinicalRule[] = [
  // =========================================================================
  // 1. 致命与高危急症 (Severity 8 - 10, isEmergency: true) -> 触发 999 拦截
  // =========================================================================
  // 级别 10：断指、断肢与创伤性截肢 (Traumatic Amputation & Severed Limb)
  {
    category: '断指与创伤性截肢 (Traumatic Amputation)',
    keywords: [
      /(severed|amputat|cut off|chopped off).*(finger|thumb|toe|hand|arm|limb|leg|foot)/i,
      /(finger|thumb|toe|hand|arm|limb|leg|foot).*(severed|amputated|cut off|chopped off)/i,
      /severed/i,
      /amputation/i,
      /amputat/i,
      /cut.*(finger|thumb|toe|hand|arm|wrist)/i,
      /(finger|thumb|toe|hand|arm|wrist).*cut/i,
      /knife.*(cut|wound|injury)/i,
      /cut by.*(knife|blade|glass|saw|machete|cleaver)/i,
      /(knife|blade|glass|saw|machete|cleaver).*cut/i,
      /blade/i,
      /sliced.*(finger|thumb|hand|wrist|arm)/i,
      /deep.*laceration/i,
      /断指/i,
      /手指断了/i,
      /手指被切断/i,
      /断肢/i,
      /截肢/i,
      /手指切飞/i,
      /切到手指/i,
      /手指被刀割/i,
      /刀割伤/i,
      /菜刀剁到/i
    ],
    baseSeverity: 10,
    isEmergency: true,
    specialty: 'Emergency A&E',
    facilityId: 1, // 班台医院 24/7 急诊（具备显微外科再植能力）
    adviceEn: 'CRITICAL TRAUMATIC AMPUTATION & CUT: 1. Apply firm direct pressure to the wound with clean cloth to control bleeding. 2. If digit/limb is severed, wrap in sterile dry gauze, seal inside a clean waterproof plastic bag, and place ON ICE (do not submerge directly in ice or water). 3. Call 999 or proceed immediately to Pantai Hospital Penang 24/7 A&E for microsurgical replantation.',
    adviceZh: '严重断指与创伤性截肢/切割伤：1. 立即用清洁布料持续用力压迫残端止血；2. 若有离断手指，用无菌干燥纱布包裹后放入干燥塑料袋密封，再置于冰块上冷藏（切勿直接浸泡在水或冰中）；3. 常规门诊已阻断，请立即拨打 999 或前往急诊部抢救。'
  },
  {
    category: '严重烧伤与烫伤 (Severe Burns & Scalds)',
    keywords: [
      /burned by (fire|flame|chemical|steam|hot water|explosion)/i,
      /burn.*(serious|severe|bad|terrible|critical|face|body|hands|skin|fire)/i,
      /(severe|serious|deep|third.*degree|second.*degree).*burn/i,
      /burn.*(fire|flame|hot)/i,
      /scald/i,
      /chemical.*burn/i,
      /caught on fire/i,
      /on fire/i,
      /burned by/i,
      /burned.*fire/i,
      /fire.*burn/i,
      /被火烧/i,
      /烧伤/i,
      /严重烫伤/i,
      /起水泡.*大面积/i,
      /火灾/i,
      /着火/i,
      /化学灼伤/i
    ],
    baseSeverity: 9,
    isEmergency: true,
    specialty: 'Emergency A&E',
    facilityId: 1, // 槟城班台医院主院 24 小时急诊
    adviceEn: 'CRITICAL BURN INJURY: Cool immediately with clean running cool tap water for 20 minutes. Do NOT apply ice or butter. Routine outpatient booking is suspended. Call 999 or proceed to 24/7 A&E immediately.',
    adviceZh: '严重烧烫伤急症：请立即使用流动清洁凉水冲洗伤处20分钟降温。切勿涂抹牙膏、酱油或黄油，切勿弄破水泡。常规预约已阻断，请立即拨打 999 或前往急诊部。'
  },
  {
    category: '车祸与高空坠落重大物理创伤 (Major Trauma & Accidents)',
    keywords: [
      /(fell|fall|fallen|drop).*(floor|height|building|roof|balcony|stairs|tree|ladder)/i,
      /(third|second|fourth|fifth|first|sixth|seventh|ground|\d+)\s*(th|st|nd|rd)?\s*floor/i,
      /fell.*(down|from)/i,
      /fall.*from/i,
      /high.*fall/i,
      /hit by.*(car|vehicle|truck|bike|motorcycle|bus)/i,
      /(car|vehicle|motorcycle|bike|traffic|road).*(accident|crash|collision)/i,
      /run over/i,
      /knocked down by/i,
      /motor vehicle/i,
      /stab.*wound/i,
      /gunshot/i,
      /crush.*injury/i,
      /polytrauma/i,
      /major.*trauma/i,
      /severe.*trauma/i,
      /compound fracture/i,
      /open fracture/i,
      /bone.*sticking out/i,
      /被.*(车撞|撞倒|碾压)/i,
      /车祸/i,
      /交通事故/i,
      /撞车/i,
      /从.*(楼|高处|楼顶|梯子|阳台|窗户).*摔/i,
      /坠楼/i,
      /坠落/i,
      /跌落/i,
      /严重创伤/i,
      /开放性骨折/i,
      /骨头露出来/i,
      /骨折变形/i,
      /刀伤/i,
      /枪伤/i,
      /挤压伤/i
    ],
    baseSeverity: 10,
    isEmergency: true,
    specialty: 'Trauma Surgery / Emergency A&E',
    facilityId: 1,
    adviceEn: 'Major physical trauma, high fall, or motor vehicle accident detected. High risk of internal hemorrhage, organ injury, or spinal trauma. Routine outpatient booking is strictly blocked. Call 999 or rush to 24/7 A&E immediately.',
    adviceZh: '检测到车祸、高空坠落或重大物理创伤，存在致命内出血、脏器破裂或脊椎损伤风险。常规预约流程已被系统强制阻断，请立即拨打 999 呼叫急救车或前往 24 小时急救部（A&E）。'
  },
  {
    category: '急性神经中风与意识障碍 (FAST)',
    keywords: [
      /facial droop/i,
      /face.*droop/i,
      /droop.*face/i,
      /slurred speech/i,
      /speech.*slurred/i,
      /slur.*speech/i,
      /sudden numbness/i,
      /stroke/i,
      /hemiplegia/i,
      /unconscious/i,
      /loss of consciousness/i,
      /impaired consciousness/i,
      /stupor/i,
      /coma/i,
      /unresponsive/i,
      /head impact.*conscious/i,
      /severe head impact/i,
      /head impact/i,
      /head trauma/i,
      /脸.*歪/i,
      /嘴.*歪/i,
      /面瘫/i,
      /口齿不清/i,
      /说话.*不清/i,
      /突发麻木/i,
      /中风/i,
      /神志不清/i,
      /昏迷/i,
      /意识障碍/i,
      /半身麻木/i,
      /严重头部撞击/i,
      /头部创伤/i
    ],
    baseSeverity: 9,
    isEmergency: true,
    specialty: 'Neurology / Emergency A&E',
    facilityId: 1,
    adviceEn: 'Acute stroke or neurological compromise suspected (FAST protocol). Regular outpatient booking is suspended. Call 999 or proceed to 24/7 A&E immediately.',
    adviceZh: '检测到急性脑中风（FAST）或意识障碍征兆。常规预约已阻断，请立即拨打 999 或前往急诊部抢救。'
  },
  {
    category: '致命呼吸衰竭与重度哮喘发作',
    keywords: [
      /unable to breathe/i,
      /cannot breathe/i,
      /can't breathe/i,
      /stopped breathing/i,
      /respiratory arrest/i,
      /asphyxi/i,
      /suffocat/i,
      /choking/i,
      /dyspnea/i,
      /dyspnoea/i,
      /shortness of breath/i,
      /difficulty breathing/i,
      /hard to breathe/i,
      /breathless/i,
      /gasping/i,
      /cyanosis/i,
      /stridor/i,
      /asthma attack/i,
      /acute asthma/i,
      /severe wheezing/i,
      /wheezing.*severe/i,
      /无法呼吸/i,
      /无法自主呼吸/i,
      /窒息/i,
      /呼吸骤停/i,
      /喘不上气/i,
      /呼吸急促/i,
      /呼吸困难/i,
      /气促/i,
      /喘不过气/i,
      /哮喘发作/i,
      /急性哮喘/i,
      /发绀/i,
      /嘴唇发紫/i
    ],
    baseSeverity: 9,
    isEmergency: true,
    specialty: 'Respiratory Medicine / Emergency A&E',
    facilityId: 1,
    adviceEn: 'Critical airway compromise or acute severe respiratory distress. Call 999 immediately. Regular booking suspended.',
    adviceZh: '极危呼吸窘迫或重度哮喘发作。系统已终止门诊挂号流程，请立即呼叫 999 急救。'
  },
  {
    category: '急性心血管急症',
    keywords: [
      /chest pain/i,
      /chest discomfort/i,
      /chest tightness/i,
      /chest pressure/i,
      /crushing chest/i,
      /heart attack/i,
      /myocardial/i,
      /angina/i,
      /radiating.*(arm|jaw|back|neck)/i,
      /胸痛/i,
      /胸口.*痛/i,
      /胸闷/i,
      /胸部不适/i,
      /心脏病发/i,
      /心肌梗死/i,
      /心绞痛/i,
      /放射痛/i
    ],
    baseSeverity: 9,
    isEmergency: true,
    specialty: 'Cardiology / Emergency A&E',
    facilityId: 1, // 槟城班台主院（24/7急诊与导管室）
    adviceEn: 'Critical cardiovascular symptoms detected. Regular outpatient booking is suspended. Call 999 or rush to 24/7 A&E immediately.',
    adviceZh: '检测到严重心血管急症征兆。系统已阻断常规预约，请立即拨打 999 或前往急诊部。'
  },
  {
    category: '失控大出血与大动脉喷射性出血',
    keywords: [
      /bleeding.*(non.*stop|won't.*stop|cannot.*stop|can't.*stop|heavily|profusely|excessive|severe|uncontrolled)/i,
      /(non.*stop|continuous|heavy|profuse|arterial|spurting|massive|uncontrolled).*bleed/i,
      /bleed.*(non.*stop|won't.*stop|cannot.*stop|can't.*stop)/i,
      /blood.*everywhere/i,
      /losing.*(a lot of|too much|massive).*blood/i,
      /losing.*blood/i,
      /soaked.*in.*blood/i,
      /pool.*of.*blood/i,
      /blood.*gushing/i,
      /gushing.*blood/i,
      /arterial.*bleed/i,
      /arterial.*hemorrhag/i,
      /arterial spurting/i,
      /spurting/i,
      /massive hemorrhage/i,
      /catastrophic bleed/i,
      /hemoptys/i,
      /haemoptys/i,
      /cough.*blood/i,
      /vomit.*blood/i,
      /hematemesis/i,
      /vomiting blood/i,
      /active bleed/i,
      /extensive.*bleeding/i,
      /severe.*bleeding/i,
      /uncontrolled bleed/i,
      /hemorrhag/i,
      /haemorrhag/i,
      /血流不止/i,
      /止不住血/i,
      /一直流血/i,
      /喷血/i,
      /大出血/i,
      /动脉喷血/i,
      /喷射性出血/i,
      /大动脉破裂/i,
      /咯血/i,
      /咳血/i,
      /吐血/i,
      /活动性出血/i,
      /严重出血/i,
      /流很多血/i,
      /流血不止/i
    ],
    baseSeverity: 10,
    isEmergency: true,
    specialty: 'Emergency A&E',
    facilityId: 1,
    adviceEn: 'Severe active hemorrhage or uncontrolled arterial bleeding. Apply direct pressure to wounds and call 999 or proceed to 24/7 A&E immediately.',
    adviceZh: '大动脉喷射性、剧烈咯血或血流不止大出血。请立即用力压迫止血并拨打 999 呼救，常规门诊已中止。'
  },
  {
    category: '重度脱水伴精神萎靡',
    keywords: [
      /severe dehydration/i,
      /dehydration.*lethargy/i,
      /lethargy.*stupor/i,
      /lethargic.*dehydrat/i,
      /重度脱水/i,
      /脱水.*嗜睡/i,
      /萎靡不振.*脱水/i,
      /严重脱水.*嗜睡/i
    ],
    baseSeverity: 8,
    isEmergency: true,
    specialty: 'Emergency A&E',
    facilityId: 1,
    adviceEn: 'Severe hypovolemia/dehydration with altered consciousness. Requires emergency intravenous resuscitation at 24/7 A&E.',
    adviceZh: '重度脱水伴神志萎靡。随时可能发生低血容量休克，必须立即前往急诊接受静脉补液治疗。'
  },
  {
    category: '过敏性休克与急性喉头水肿',
    keywords: [
      /anaphyla/i,
      /swelling.*(throat|tongue|lip)/i,
      /过敏性休克/i,
      /喉头水肿/i
    ],
    baseSeverity: 8,
    isEmergency: true,
    specialty: 'Emergency A&E',
    facilityId: 1,
    adviceEn: 'Anaphylactic crisis or airway swelling detected. Administer Epipen if available and call 999 immediately.',
    adviceZh: '疑似急性严重过敏性休克或气道水肿。请立即拨打 999 寻求急救。'
  },

  // =========================================================================
  // 2. 常规专科门诊 (Severity < 7, isEmergency: false) -> 中英完全对齐
  // =========================================================================
  {
    category: '骨科与运动医学 (Ayer Itam)',
    keywords: [
      /ankle/i,
      /sprain/i,
      /twisted.*ankle/i,
      /twist.*ankle/i,
      /badminton/i,
      /sports/i,
      /sports injury/i,
      /after sports/i,
      /athletic injury/i,
      /knee/i,
      /knee.*swelling/i,
      /joint.*swelling/i,
      /swelling/i,
      /swollen/i,
      /difficulty walking/i,
      /trouble walking/i,
      /cannot walk/i,
      /hard to walk/i,
      /limp/i,
      /limping/i,
      /walking/i,
      /ligament/i,
      /meniscus/i,
      /acl/i,
      /tendon/i,
      /cartilage/i,
      /dislocation/i,
      /dislocated/i,
      /musculoskeletal/i,
      /bone/i,
      /joint/i,
      /shoulder/i,
      /elbow/i,
      /hip/i,
      /ankle/i,
      /wrist/i,
      /foot pain/i,
      /heel/i,
      /swollen.*pain.*step/i,
      /hurts.*step/i,
      /pain.*step/i,
      /bearing weight/i,
      /lumbar/i,
      /spine/i,
      /stiffness.*calf/i,
      /mechanical.*stiffness/i,
      /prolonged sitting/i,
      /lower back/i,
      /back pain/i,
      /back stiffness/i,
      /sciatica/i,
      /joint pain/i,
      /knee pain/i,
      /fracture/i,
      /stiff joint/i,
      /arthritis/i,
      /脚踝/i,
      /踝/i,
      /扭伤/i,
      /扭到/i,
      /羽毛球/i,
      /踩在地上.*痛/i,
      /下地.*痛/i,
      /脚肿/i,
      /腰椎/i,
      /腰痛/i,
      /腰部僵硬/i,
      /久坐.*加剧/i,
      /久坐.*痛/i,
      /小腿外侧/i,
      /坐骨神经/i,
      /关节痛/i,
      /膝盖痛/i,
      /骨折/i,
      /关节僵硬/i,
      /膝盖/i,
      /关节/i,
      /肿胀/i,
      /红肿/i,
      /无法行走/i,
      /难走路/i,
      /走路痛/i,
      /运动损伤/i,
      /运动后/i,
      /打球/i,
      /跑步/i,
      /韧带/i,
      /半月板/i,
      /半月板损伤/i,
      /十字韧带/i,
      /脱臼/i,
      /骨头/i,
      /肩膀/i,
      /脚腕/i
    ],
    baseSeverity: 4,
    isEmergency: false,
    specialty: 'Orthopaedics & Sports Medicine',
    facilityId: 4, // 亚依淡专科中心（Pantai Specialist Centre）
    adviceEn: 'Follow the R.I.C.E. protocol (Rest, Ice, Compression, Elevation), avoid weight-bearing on the affected knee or joint, and consult an orthopaedic and sports medicine specialist for clinical evaluation and imaging (X-ray/MRI).',
    adviceZh: '建议遵循 R.I.C.E. 原则（休息、冰敷、加压包扎、抬高患肢），避免患肢膝关节负重，并尽快预约骨科与运动医学专科医生进行详细评估与影像学检查（X光/磁共振）。'
  },
  {
    category: '胃肠肝胆与消化道 (Bayan Baru)',
    keywords: [
      /burning.*chest.*eating/i,
      /burning sensation.*chest/i,
      /acid reflux/i,
      /heartburn/i,
      /reflux/i,
      /stomach bloating/i,
      /bloating/i,
      /stomach ache/i,
      /stomach pain/i,
      /gastric/i,
      /abdominal pain/i,
      /indigestion/i,
      /烧灼感/i,
      /灼热感/i,
      /反酸/i,
      /反酸水/i,
      /胃酸/i,
      /胃酸倒流/i,
      /胀气/i,
      /胃部.*胀气/i,
      /胃胀/i,
      /胃痛/i,
      /消化不良/i,
      /胃不适/i
    ],
    baseSeverity: 3,
    isEmergency: false,
    specialty: 'Gastroenterology & Hepatology',
    facilityId: 3, // 峇央峇鲁日间门诊（Pantai Premier Clinic & Day Surgery）
    adviceEn: 'Drink small sips of water. Avoid spicy, greasy, acidic foods, and avoid lying down immediately after meals.',
    adviceZh: '少量多次饮水，清淡饮食，避免辛辣油腻及酸性食物，餐后切勿立即平卧，建议预约消化专科医生。'
  },
  {
    category: '心血管常规与心悸慢病筛查 (Georgetown)',
    keywords: [
      /palpitation/i,
      /palpitations/i,
      /irregular heartbeat/i,
      /bp cuff/i,
      /blood pressure/i,
      /hypertension/i,
      /high blood pressure/i,
      /cholesterol/i,
      /cardiac screening/i,
      /heart checkup/i,
      /desk work.*palpitation/i,
      /心悸/i,
      /偶发心悸/i,
      /心慌/i,
      /心跳过快/i,
      /血压/i,
      /高血压/i,
      /家用血压计/i,
      /胆固醇/i,
      /心脏筛查/i,
      /心血管体检/i
    ],
    baseSeverity: 3,
    isEmergency: false,
    specialty: 'Cardiology',
    facilityId: 2, // 乔治市心脏中心（Pantai Heart & Wellness Pavilion）
    adviceEn: 'Maintain a daily log of blood pressure and resting heart rate, minimize stress and caffeine, and book a cardiovascular consultation.',
    adviceZh: '建议每日定时记录静息心率与血压数值，减少咖啡因与精神压力，并预约心血管专科进行筛查。'
  },
  // 1. 皮肤科专科门诊（优先捕获明确的皮疹与皮肤病变）
  {
    category: '皮肤科专科门诊 (Dermatology)',
    keywords: [
      /rash/i,
      /pruritic/i,
      /pruritus/i,
      /maculopapular/i,
      /erythematous.*rash/i,
      /erythematous/i,
      /hives/i,
      /urticaria/i,
      /eczema/i,
      /dermatitis/i,
      /itching/i,
      /itchy skin/i,
      /skin allergy/i,
      /皮疹/i,
      /红斑/i,
      /发痒/i,
      /皮肤瘙痒/i,
      /皮肤痒/i,
      /红疹/i,
      /斑丘疹/i,
      /荨麻疹/i,
      /湿疹/i
    ],
    baseSeverity: 2,
    isEmergency: false,
    specialty: 'Dermatology',
    facilityId: 3, // 峇央峇鲁日间专科门诊（Pantai Premier Clinic & Day Surgery）
    adviceEn: 'Keep the affected skin clean, cool, and dry. Avoid scratching, hot showers, or unprescribed topical creams. Schedule a Dermatology consultation.',
    adviceZh: '保持受损皮肤清洁、凉爽与干燥，避免搔抓、热水冲洗或擅自涂抹未遵医嘱的药膏，建议预约皮肤专科门诊进行面诊。'
  },
  // 2. 普通内科与急性呼吸道感染（排除否定发热的情况）
  {
    category: '急性呼吸道感染与内科门诊',
    keywords: [
      /(fever|cough).*(runny nose|cold|flu)/i,
      /(runny nose|cold|flu).*(fever|cough)/i,
      /(?<!without\s+(?:\w+\s+)?|no\s+(?:\w+\s+)?|not\s+(?:\w+\s+)?|denies\s+(?:\w+\s+)?)fever/i,
      /high fever/i,
      /mild fever/i,
      /dry cough/i,
      /cold and flu/i,
      /发烧.*(咳嗽|流鼻涕)/i,
      /(咳嗽|流鼻涕).*发烧/i,
      /轻微发烧/i,
      /高烧/i,
      /感冒/i,
      /干咳/i,
      /flu/i,
      /cough/i,
      /headache/i,
      /fatigue/i,
      /(?<!无\s*(?:[\u4e00-\u9fa5]{1,3}\s*)?|没有\s*(?:[\u4e00-\u9fa5]{1,3}\s*)?|未\s*(?:[\u4e00-\u9fa5]{1,3}\s*)?|没\s*(?:[\u4e00-\u9fa5]{1,3}\s*)?)发烧/i,
      /(?<!无\s*(?:[\u4e00-\u9fa5]{1,3}\s*)?|没有\s*(?:[\u4e00-\u9fa5]{1,3}\s*)?|未\s*(?:[\u4e00-\u9fa5]{1,3}\s*)?|没\s*(?:[\u4e00-\u9fa5]{1,3}\s*)?)发热/i,
      /咳嗽/i,
      /头痛/i,
      /乏力/i
    ],
    baseSeverity: 3,
    isEmergency: false,
    specialty: 'Internal Medicine',
    facilityId: 1, // 班台医院主院
    adviceEn: 'Stay well-hydrated, monitor temperature every 4–6 hours, get plenty of bed rest, and consult an Internal Medicine physician if fever persists.',
    adviceZh: '建议每 4 至 6 小时监测一次体温，多饮水，充分卧床休息。若发烧持续或症状加重，建议预约普通内科门诊。'
  },
  // 3. 纯粹的局部耳鼻喉科症状（不伴随急性发烧全身感染）
  {
    category: '耳鼻喉专科门诊 (Ayer Itam)',
    keywords: [
      /earache/i,
      /ear pain/i,
      /purulent rhinorrhea/i,
      /purulent/i,
      /post-nasal drip/i,
      /sinusitis/i,
      /loss of smell/i,
      /sore throat/i,
      /maxillary pressure/i,
      /facial pressure/i,
      /sinus/i,
      /nasal congestion/i,
      /throat pain/i,
      /耳朵痛/i,
      /耳痛/i,
      /流脓涕/i,
      /脓涕/i,
      /鼻后滴漏/i,
      /鼻窦炎/i,
      /鼻窦/i,
      /上颌骨.*压痛/i,
      /面部压痛/i,
      /慢性咽喉痛/i,
      /喉咙痛/i,
      /咽喉痛/i,
      /鼻塞/i
    ],
    baseSeverity: 2,
    isEmergency: false,
    specialty: 'Ear, Nose & Throat (Otorhinolaryngology)',
    facilityId: 4, // 亚依淡专科中心（Pantai Specialist Centre）
    adviceEn: 'Rest, drink warm fluids, and consult an ENT specialist.',
    adviceZh: '注意局部保暖与休息，多饮温水，建议预约耳鼻喉科（ENT）专科门诊进行检查。'
  },
  {
    category: '儿科门诊 (Main Hospital)',
    keywords: [
      /child sick/i,
      /baby sick/i,
      /pediatric/i,
      /toddler/i,
      /kid fever/i,
      /儿童生病/i,
      /小儿/i,
      /宝宝发烧/i,
      /小孩生病/i
    ],
    baseSeverity: 3,
    isEmergency: false,
    specialty: 'Paediatrics',
    facilityId: 1, // 槟城班台医院主院
    adviceEn: 'Monitor child temperature frequently, offer small sips of fluids, and consult a pediatrician promptly.',
    adviceZh: '密切监测儿童体温与精神面貌，少量多次喂水，若精神萎靡请及时就诊儿科。'
  }
];

// 非医疗问题拦截模式 (Guardrails: 天气、代码、闲聊、笑话、金融)
const NON_MEDICAL_PATTERNS = [
  /weather/i, /forecast/i, /temperature/i, /sunny/i, /rain/i, /raining/i,
  /天气/i, /下雨/i, /气温/i, /温度/i, /晴天/i, /阴天/i,
  /python/i, /javascript/i, /react/i, /code/i, /coding/i, /program/i, /programming/i, /代码/i, /编程/i, /写代码/i,
  /who are you/i, /你是谁/i, /what can you do/i, /你能做什么/i,
  /tell me a joke/i, /joke/i, /讲个笑话/i, /笑话/i,
  /stock/i, /bitcoin/i, /crypto/i, /股票/i, /炒股/i, /比特币/i
];

// 外州医院边界拦截模式（仅限槟城 4 处院区，严禁吉隆坡、雪兰莪等外地分院）
const OUT_OF_STATE_PATTERNS = [
  /klang/i, /cheras/i, /ampang/i, /kuala lumpur/i, /selangor/i, /subang/i, /petaling jaya/i, /ipoh/i, /melaka/i, /johor/i,
  /吉隆坡/i, /雪兰莪/i, /巴生/i, /焦赖/i, /安邦/i, /怡保/i, /马六甲/i, /柔佛/i
];

export function evaluateDeterministicRules(
  userInput: string,
  patientInfo?: any,
  userRegion?: string
): TriageResult {
  const normalized = (userInput || '').trim().toLowerCase();
  const isChinese = /[\u4e00-\u9fa5]/.test(userInput);
  const lang: 'en' | 'zh' = isChinese ? 'zh' : 'en';

  console.log('>>> [TRIAGE DEBUG] Incoming input:', normalized);

  // ============================================================
  // 1. 非医疗提问防御拦截 (Guardrails: 天气 / 编程 / 闲聊)
  // ============================================================
  if (NON_MEDICAL_PATTERNS.some(p => p.test(normalized))) {
    console.log('[Triage Engine] NON-MEDICAL GUARDRAIL TRIGGERED.');
    return {
      intent: 'non_medical',
      severityScore: 0,
      isEmergency: false,
      isNonMedical: true,
      recommendedSpecialty: 'None',
      matchedKeywords: ['non-medical inquiry'],
      preliminaryAdvice: lang === 'zh'
        ? '您好！我是槟城班台医院（PantaiCare）的医疗健康分诊助手 Carey AI。我的职责严格限定于协助患者进行临床症状分诊与槟城院区门诊导医，无法为您回答与医疗健康无关的问题（如天气、编程或闲聊）。如果您有任何身体不适或健康疑虑，请随时向我描述您的症状。'
        : 'Hello! I am Carey AI, the clinical triage and healthcare intake assistant for Pantai Hospital Penang. My scope is strictly limited to clinical symptom triage and healthcare navigation across our Penang Island facilities. I am unable to answer non-medical inquiries such as weather, coding, or casual conversation. Please feel free to describe any health symptoms you are experiencing so I can assist you.',
      language: lang
    };
  }

  // ============================================================
  // 2. 高危急症规则（优先最高级别判定，严重度 >= 7 强行阻断）
  // ============================================================
  let highestEmergencyRule: ClinicalRule | null = null;
  const emergencyMatchedTokens: string[] = [];

  for (const rule of CLINICAL_RULES) {
    if (rule.isEmergency) {
      for (const pattern of rule.keywords) {
        if (pattern.test(normalized)) {
          emergencyMatchedTokens.push(pattern.source.replace(/\\i|\\/g, ''));
          if (!highestEmergencyRule || rule.baseSeverity > highestEmergencyRule.baseSeverity) {
            highestEmergencyRule = rule;
          }
        }
      }
    }
  }

  if (highestEmergencyRule) {
    console.log(`>>> [TRIAGE DEBUG] SUCCESS! Matched: ${highestEmergencyRule.category}, Severity: ${highestEmergencyRule.baseSeverity}, isEmergency: ${highestEmergencyRule.isEmergency}`);
    return {
      intent: 'emergency',
      severityScore: highestEmergencyRule.baseSeverity,
      isEmergency: true,
      isNonMedical: false,
      recommendedSpecialty: highestEmergencyRule.specialty,
      matchedKeywords: Array.from(new Set(emergencyMatchedTokens)),
      suggestedFacilityId: 1, // 始终导向拥有 24/7 急诊救治能力的主院（Bayan Lepas）
      facilityName: PENANG_FACILITIES[1].name,
      preliminaryAdvice: lang === 'zh' ? highestEmergencyRule.adviceZh : highestEmergencyRule.adviceEn,
      language: lang
    };
  }

  // ============================================================
  // 3. 外州医院边界拦截（询问 Klang / Cheras / KL 等外地分院）
  // ============================================================
  if (OUT_OF_STATE_PATTERNS.some(p => p.test(normalized))) {
    console.log('[Triage Engine] OUT-OF-STATE BOUNDARY TRIGGERED.');
    return {
      intent: 'boundary_refusal',
      severityScore: 1,
      isEmergency: false,
      isNonMedical: false,
      recommendedSpecialty: '',
      matchedKeywords: ['out_of_state_inquiry'],
      suggestedFacilityId: 1,
      facilityName: PENANG_FACILITIES[1].name,
      preliminaryAdvice: lang === 'zh'
        ? '关于您咨询外州医院（如巴生、焦赖或吉隆坡）的预约：\n\n我们的医疗预约与分诊服务专属于槟城班台医院生态系统（位于槟城岛内），无法跨州为您预约雪兰莪或吉隆坡等外州分院（如 Pantai Hospital Klang 或 Cheras）。\n\n欢迎您在槟城岛内我们 4 处院区进行预约：峇六拜主院（Bayan Lepas）、乔治市心脏中心（Georgetown）、峇央峇鲁日间门诊（Bayan Baru）或亚依淡专科中心（Ayer Itam）。'
        : 'Regarding your inquiry about booking appointments at branches in other states (such as Pantai Hospital Klang or Cheras):\n\nOur healthcare intake system is exclusively dedicated to the Pantai Hospital Penang ecosystem on Penang Island, Malaysia. We are unable to arrange consultations or bookings for external branches in other states such as Selangor or Kuala Lumpur.\n\nWe warmly welcome you to receive specialized care at any of our 4 Penang Island facilities: Pantai Hospital Penang (Main Hospital in Bayan Lepas), Pantai Heart & Wellness Pavilion in Georgetown, Pantai Premier Clinic & Day Surgery in Bayan Baru, or Pantai Specialist Centre in Ayer Itam.',
      language: lang
    };
  }

  // ============================================================
  // 4. 预约操作识别（更改时间 / 取消 / 重新安排）
  // ============================================================
  const isReschedule = 
    /change (my )?appointment|reschedule|postpone|switch (my )?time|change (my )?time|modify appointment|cancel or postpone|改时间|修改时间|更换预约|推迟预约|更改时间/i.test(normalized) ||
    ((normalized.includes('change') || normalized.includes('reschedule') || normalized.includes('postpone')) && 
     (normalized.includes('appointment') || normalized.includes('time') || normalized.includes('slot') || normalized.includes('booking')));

  if (isReschedule) {
    let activeApt: any = null;
    if (patientInfo?.appointments && Array.isArray(patientInfo.appointments)) {
      activeApt = patientInfo.appointments.find((a: any) => 
        ['Upcoming', 'Approved', 'Pending', 'Rescheduled'].includes(a.status) || !a.status
      );
    }

    const hasAppointment = Boolean(activeApt);

    let adviceEn = '';
    let adviceZh = '';

    if (hasAppointment) {
      adviceEn = `We found your active upcoming appointment with ${activeApt.doctorName || 'our specialist'} at ${activeApt.clinic || 'Pantai Hospital Penang'} on ${activeApt.date}${activeApt.timeSlot ? ' at ' + activeApt.timeSlot : ''}. You can click the "Reschedule Appointment" button below to choose a new preferred consultation date and time slot.`;
      adviceZh = `系统已查询到您有一条已预约的门诊：主诊医生为 ${activeApt.doctorName || '专科医生'}，就诊院区为 ${activeApt.clinic || '槟城班台医院'}，时间为 ${activeApt.date}${activeApt.timeSlot ? ' ' + activeApt.timeSlot : ''}。您可以点击下方的“更改此预约时间”按钮重新选择出诊时间。`;
    } else {
      adviceEn = `We checked your records and found that you currently do not have any scheduled appointments to change or reschedule. If you need to see a specialist, you can click "Book New Appointment" below to schedule a visit across any of our 4 Penang facilities.`;
      adviceZh = `系统查询显示您目前暂无任何已安排的门诊预约可供更改或改签。若您需要就诊，欢迎点击下方的“预约新门诊”按钮，在槟城 4 处院区中选择合适的科室与专家进行挂号预约。`;
    }

    return {
      intent: 'appointment_reschedule',
      severityScore: 1,
      isEmergency: false,
      isNonMedical: false,
      recommendedSpecialty: '',
      matchedKeywords: ['reschedule'],
      suggestedFacilityId: 1,
      facilityName: PENANG_FACILITIES[1].name,
      activeAppointment: activeApt,
      preliminaryAdvice: lang === 'zh' ? adviceZh : adviceEn,
      language: lang
    };
  }

  // ============================================================
  // 5. 预约查询识别（几点预约 / 查我的时间）
  // ============================================================
  const isInquiry = 
    /what time (is|my) appointment|check my appointment|my appointment slot|when is my visit|what is my appointment time|when is my appointment|check my booking|几点预约|我的预约时间|查预约|预约什么时候/i.test(normalized) ||
    ((normalized.includes('what time') || normalized.includes('when is') || normalized.includes('check my')) && normalized.includes('appointment'));

  if (isInquiry) {
    let activeApt: any = null;
    if (patientInfo?.appointments && Array.isArray(patientInfo.appointments)) {
      activeApt = patientInfo.appointments.find((a: any) => 
        ['Upcoming', 'Approved', 'Pending', 'Rescheduled'].includes(a.status)
      );
    }

    return {
      intent: 'appointment_inquiry',
      severityScore: 1,
      isEmergency: false,
      isNonMedical: false,
      recommendedSpecialty: '',
      matchedKeywords: ['appointment_inquiry'],
      suggestedFacilityId: 1,
      facilityName: PENANG_FACILITIES[1].name,
      activeAppointment: activeApt,
      preliminaryAdvice: lang === 'zh'
        ? (activeApt 
            ? `您已安排的预约时间为 ${activeApt.date} ${activeApt.timeSlot}，地点在 ${activeApt.clinic || '槟城班台医院'}，排队号为 ${activeApt.queueNumber || 'Q-100'}。`
            : '您可以在“预约记录”页面查看您所有已确认的预约详情、主诊医生和排队叫号信息。')
        : (activeApt
            ? `Your upcoming appointment is on ${activeApt.date} (${activeApt.timeSlot}) at ${activeApt.clinic || 'Pantai Hospital Penang'} with Queue Number ${activeApt.queueNumber || 'Q-100'}.`
            : 'You can view your confirmed booking schedule, clinician details, and assigned queue number in the "Bookings" tab.'),
      language: lang
    };
  }

  // ============================================================
  // 6. 医生排班 / 值班查询
  // ============================================================
  const isDoctorSchedule = 
    /on duty|doctor schedule|who is on duty|clinic duty|available on|doctor timetable|which doctor|医生排班|谁值班|出诊时间|坐诊/i.test(normalized);

  if (isDoctorSchedule) {
    return {
      intent: 'doctor_schedule',
      severityScore: 1,
      isEmergency: false,
      isNonMedical: false,
      recommendedSpecialty: 'Specialist Consultation',
      matchedKeywords: ['doctor_schedule'],
      suggestedFacilityId: 1,
      facilityName: PENANG_FACILITIES[1].name,
      preliminaryAdvice: lang === 'zh'
        ? '您可以查看下方医生卡片中的坐诊时间表，或在“医生列表”中筛选查看槟城各分院专家门诊。'
        : 'You can check duty schedules and clinic hours in the specialist roster cards below or explore the Doctors directory.',
      language: lang
    };
  }

  // ============================================================
  // 7. 临床非危重门诊规则匹配
  // ============================================================
  let highestMatchedRule: ClinicalRule | null = null;
  const matchedTokens: string[] = [];

  for (const rule of CLINICAL_RULES) {
    if (!rule.isEmergency) {
      for (const pattern of rule.keywords) {
        if (pattern.test(normalized)) {
          matchedTokens.push(pattern.source.replace(/\\i|\\/g, ''));
          // 冲突消解：保留严重度更高的规则
          if (!highestMatchedRule || rule.baseSeverity > highestMatchedRule.baseSeverity) {
            highestMatchedRule = rule;
          }
        }
      }
    }
  }

  if (highestMatchedRule) {
    const facility = PENANG_FACILITIES[highestMatchedRule.facilityId] || PENANG_FACILITIES[1];
    console.log(`>>> [TRIAGE DEBUG] SUCCESS! Matched: ${highestMatchedRule.category}, Severity: ${highestMatchedRule.baseSeverity}, isEmergency: ${highestMatchedRule.isEmergency}`);
    return {
      intent: 'symptom_triage',
      severityScore: highestMatchedRule.baseSeverity,
      isEmergency: false,
      isNonMedical: false,
      recommendedSpecialty: highestMatchedRule.specialty,
      matchedKeywords: Array.from(new Set(matchedTokens)),
      suggestedFacilityId: highestMatchedRule.facilityId,
      facilityName: facility.name,
      preliminaryAdvice: lang === 'zh' ? highestMatchedRule.adviceZh : highestMatchedRule.adviceEn,
      language: lang
    };
  }

  // ============================================================
  // 8. 兜底默认值（常规非危重健康咨询）
  // ============================================================
  console.log('>>> [TRIAGE DEBUG] FAILED to match any rule. Falling back to default routine outpatient!');
  return {
    intent: 'general',
    severityScore: 2,
    isEmergency: false,
    isNonMedical: false,
    recommendedSpecialty: 'General Practice / Internal Medicine',
    matchedKeywords: [lang === 'zh' ? '常规咨询' : 'general_consultation'],
    suggestedFacilityId: 1,
    facilityName: PENANG_FACILITIES[1].name,
    preliminaryAdvice: lang === 'zh'
      ? '请注意保护并休息受累部位。若发生剧烈疼痛、严重出血或呼吸困难，请立即就医急诊；如症状平稳，欢迎预约我院普通综合门诊进行评估。'
      : 'Please protect and rest the affected area. If acute pain, heavy bleeding, or difficulty breathing develops, seek emergency care immediately. Otherwise, consult our general outpatient clinic.',
    language: lang
  };
}
