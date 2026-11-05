import { getReviews, getVitals, getPatientProfileByEmail, getAppointments } from './db';
import natural from 'natural';
import { allPantaiDoctors } from './src/data/pantaiHospitalsData';

// ============================================================
// DUAL CLASSIFIERS STATE
// ============================================================
let triageClassifier: any = null;
let intentClassifier: any = null;

// ============================================================
// TEXT PREPROCESSING UTILITY
// ============================================================
function preprocessText(text: string): string {
  if (!text) return "";
  // Lowercase, strip punctuation and extra spaces
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// INITIALIZATION AND TRAINING
// ============================================================
export function initClassifier() {
  // 1. Initialize and train Symptom Triage Classifier
  if (!triageClassifier) {
    triageClassifier = new natural.BayesClassifier();

    // Cardiology training documents
    triageClassifier.addDocument('chest pain heart racing high blood pressure palpitations tight chest pressure crushing weight', 'Cardiology');
    triageClassifier.addDocument('arrhythmia irregular heartbeat pulse flutter cardiovascular coronary artery stenosis cardiopathy', 'Cardiology');
    triageClassifier.addDocument('angina pectoris shortness of breath high bp pain in left arm cardiology pacemaker bradycardia', 'Cardiology');
    triageClassifier.addDocument('heart murmur cardiac arrest valve disease tachycardia chest tightness cardiology myocarditis', 'Cardiology');
    triageClassifier.addDocument('ischemic heart failure ventricular fibrillation bypass surgery coronary bypass', 'Cardiology');

    // Internal Medicine & Infectious Diseases training documents
    triageClassifier.addDocument('dengue viral fever infectious chronic disease metabolic diabetes mellitus tuberculosis septic shock', 'Internal Medicine & Infectious Diseases');
    triageClassifier.addDocument('high sugar insulin infection thyroid sepsis viral cold infectious diabetes hyperglycemia hypoglycemia', 'Internal Medicine & Infectious Diseases');
    triageClassifier.addDocument('hiv aids viral epidemic fever sweat blood infection malaria parasite covid flu coronavirus influenza', 'Internal Medicine & Infectious Diseases');
    triageClassifier.addDocument('infectious disease blood infection tropical disease fever shivers yellow fever bacterial infection', 'Internal Medicine & Infectious Diseases');
    triageClassifier.addDocument('endocrinology metabolic syndrome chronic cough coughing blood microbacterium lung infection', 'Internal Medicine & Infectious Diseases');

    // Pediatrics training documents
    triageClassifier.addDocument('baby crying child fever infant pediatric neonatal kids rash vaccine vaccination child pediatrician', 'Pediatrics');
    triageClassifier.addDocument('toddler vomiting child cough pediatric vaccination childhood growth developmental delay colic jaundice', 'Pediatrics');
    triageClassifier.addDocument('kid illness pediatrician pediatric emergency newborn healthcare baby child kids teething rash', 'Pediatrics');
    triageClassifier.addDocument('neonatal intensive care baby developmental milestones childhood asthma immunization schedules', 'Pediatrics');
    triageClassifier.addDocument('pediatric checkup school physicals child health pediatrician clinic', 'Pediatrics');

    // General Surgery training documents
    triageClassifier.addDocument('appendix pain stomach hernia appendicitis surgery gallstones gall bladder laparoscopic appendectomy', 'General Surgery');
    triageClassifier.addDocument('sharp pain right lower abdomen surgical wound elective procedure trauma general surgery sutures', 'General Surgery');
    triageClassifier.addDocument('acute abdomen colorectal post-operative care hernia repair gallbladder removal cholecystectomy incision', 'General Surgery');
    triageClassifier.addDocument('laparoscopic bowel resection surgical suture excision tumor biopsy general surgeon', 'General Surgery');
    triageClassifier.addDocument('abdominal stitches postoperative hernia inguinal repair surgery', 'General Surgery');

    // Orthopedics & Sports Medicine training documents
    triageClassifier.addDocument('broken bone fractured ankle joint pain knee pain sprained wrist torn ligament ACL tear arthritis knee swelling joint swelling difficulty walking sports injury after sports', 'Orthopedics & Sports Medicine');
    triageClassifier.addDocument('sports injury hip replacement musculoskeletal spine arthritis osteoporosis backache rehabilitation osteoarthritis meniscus knee swelling', 'Orthopedics & Sports Medicine');
    triageClassifier.addDocument('fracture bone injury knee hip replacement sports medicine orthopedic surgeon lumbago spinal compression difficulty walking', 'Orthopedics & Sports Medicine');
    triageClassifier.addDocument('tibia fracture joint arthroplasty rotator cuff tear shoulder dislocation musculoskeletal swelling', 'Orthopedics & Sports Medicine');
    triageClassifier.addDocument('meniscus tear bone density scan skeletal alignment neck pain slipped disc orthopedics ligament', 'Orthopedics & Sports Medicine');

    // Neurology training documents
    triageClassifier.addDocument('stroke migraine headache seizure epilepsy nerve brain numbness paralysis tingling neuro neurological', 'Neurology');
    triageClassifier.addDocument('dizzy lightheaded parkinson memory loss dementia brain fog neuropathy nervous system tremor alzheimers', 'Neurology');
    triageClassifier.addDocument('multiple sclerosis neurological disorder chronic migraine neuromuscular abnormal electroencephalogram MS', 'Neurology');
    triageClassifier.addDocument('cerebrovascular accident transient ischemic attack TIA neurodegenerative spinal nerve pain neuropathy', 'Neurology');
    triageClassifier.addDocument('pinched nerve numbness in fingers chronic headaches vertigo seizures neurology', 'Neurology');

    // Gastroenterology & Urology training documents
    triageClassifier.addDocument('stomach ache diarrhea vomiting bowel kidney stone bladder urine GERD ulcer gastroenterology acid reflux', 'Gastroenterology & Urology');
    triageClassifier.addDocument('heartburn acid reflux irritable bowel liver disease constipation prostate renal colonoscopy gastro IBS', 'Gastroenterology & Urology');
    triageClassifier.addDocument('peptic ulcer renal stones urinary tract infection uti kidney prostate issue stomach reflux gastrointestinal', 'Gastroenterology & Urology');
    triageClassifier.addDocument('gastric ulcer hematuria dysuria painful urination bladder infection kidney stones gastroenteritis', 'Gastroenterology & Urology');
    triageClassifier.addDocument('colonoscopy polypectomy bowel irritation Crohn\'s disease gastro urological urologist', 'Gastroenterology & Urology');

    // General Practice & Family Medicine training documents
    triageClassifier.addDocument('cough sore throat runny nose seasonal allergy common cold influenza general checkup family GP clinic', 'General Practice & Family Medicine');
    triageClassifier.addDocument('fever fatigue vaccination family medicine physical wellness general practitioner gp clinic primary care assessment', 'General Practice & Family Medicine');
    triageClassifier.addDocument('maternal child health family planning acute illness chronic disease follow up standard symptoms medical checkup', 'General Practice & Family Medicine');
    triageClassifier.addDocument('coughing sneezing cold runny nose minor wound sore throat allergy gp general practice rhinorrhea', 'General Practice & Family Medicine');
    triageClassifier.addDocument('routine medical checkup health certificate family doctor GP triage seasonal flu prescription refill', 'General Practice & Family Medicine');
 
    // Emergency Medicine training documents
    triageClassifier.addDocument('bleeding cut wound accident collision car crash ambulance trauma emergency critical unconscious breathing stopped collapsed poisoning drug overdose toxic shock cardiac arrest stroke emergency department bleeding heavily', 'Emergency Medicine');

    triageClassifier.train();
    console.log('✅  Local ML: Symptom Triage Classifier trained');
  }

  // 2. Initialize and train Carey AI Chatbot Intent Classifier
  if (!intentClassifier) {
    intentClassifier = new natural.BayesClassifier();

    // Intent: greeting
    intentClassifier.addDocument('hi hello hey good morning good afternoon good evening greetings who are you introduce yourself Carey hey there hiya what is your name halo hai selamat pagi', 'greeting');

    // Intent: booking
    intentClassifier.addDocument('book appointment schedule appointment help me book reserve consultation see doctor visit hospital schedule visit book doctor make appointment', 'booking');
    intentClassifier.addDocument('can you help me book book hospital penang book pantai hospital book appointment at pantai penang schedule clinic', 'booking');
    intentClassifier.addDocument('i want to book an appointment how to make appointment scheduling slot booking doctor time temujanji', 'booking');
    intentClassifier.addDocument('book consultation schedule slot appointment booking pantai care register appointment see specialist', 'booking');

    // Intent: vitals
    intentClassifier.addDocument('check my vitals show my pulse heart rate blood pressure body temperature oxygen levels spo2', 'vitals');
    intentClassifier.addDocument('how is my bp my pulse pressure vital signs report latest clinical readings assessment', 'vitals');

    // Intent: reviews
    intentClassifier.addDocument('show reviews for doctor ratings best feedback about clinicians recommend star rating feedback', 'reviews');
    intentClassifier.addDocument('reviews for simon lo ainol shareha jenkins mitchell doctor stars patient feedback reviews count', 'reviews');

    // Intent: symptoms
    intentClassifier.addDocument('i have chest pain coughing wheezing asthma trouble breathing sore throat runny nose stomach ache', 'symptoms');
    intentClassifier.addDocument('symptom triage assess this symptom fever headache joint pain what is wrong with me diagnoses', 'symptoms');
    intentClassifier.addDocument('heart discomfort need go what department which clinic should i visit specialist doctor', 'symptoms');
    intentClassifier.addDocument('what department deals with stomach pain chest tightness breathing difficulty', 'symptoms');
    intentClassifier.addDocument('who should i see for joint swelling broken bone sports injury fracture', 'symptoms');
    intentClassifier.addDocument('need medical recommendation for migraine vertigo numbness stroke nerve issues', 'symptoms');
    intentClassifier.addDocument('child fever baby crying toddler vomiting what pediatric clinic is best', 'symptoms');
    intentClassifier.addDocument('appendix surgery hernia removal gallbladder pain which surgeon should i consult', 'symptoms');
    intentClassifier.addDocument('acid reflux gerd gastric ulcer stomach ache gastroenterology specialist', 'symptoms');

    // Intent: fallback
    intentClassifier.addDocument('tell me a joke weather report what is the time random questions system index information general query', 'fallback');

    intentClassifier.train();
    console.log('✅  Local ML: Intent Classifier trained');
  }
}

// ============================================================
// CLASSIFICATION INTERFACES
// ============================================================

export function triageSymptom(text: string): string {
  if (!triageClassifier) {
    initClassifier();
  }
  const cleanText = preprocessText(text);
  if (!cleanText) return 'General Practice & Family Medicine';

  const lowercase = text.toLowerCase();
  
  // Rule-based Clinical Overrides matching the exact triage routing specification table
  
  // 1. Pediatric Safeguard for children/infants
  if (lowercase.includes("child") || lowercase.includes("baby") || lowercase.includes("infant") || lowercase.includes("pediatric")) {
    return "Pediatrics";
  }

  // 2. Trauma / Severe Accidents -> Emergency Medicine (ER)
  if (lowercase.includes("trauma") || lowercase.includes("accident") || lowercase.includes("crash") || 
      lowercase.includes("collision") || lowercase.includes("unconscious") || lowercase.includes("bleeding heavily") ||
      lowercase.includes("severe accident")) {
    return "Emergency Medicine";
  }

  // 3. Sudden Chest Pain (Severe) -> Emergency Medicine (ER)
  if (lowercase.includes("sudden chest pain") || 
      (lowercase.includes("chest pain") && (lowercase.includes("severe") || lowercase.includes("sudden") || lowercase.includes("teruk")))) {
    return "Emergency Medicine";
  }

  // 4. Chronic Heart Palpitations -> Cardiology
  if (lowercase.includes("palpitations") || lowercase.includes("heart racing") || lowercase.includes("arrhythmia") || 
      lowercase.includes("heart discomfort") || lowercase.includes("palpitation")) {
    return "Cardiology";
  }

  // 5. Fever / Dengue / Viral Infection -> Internal Medicine & Infectious Diseases
  if (lowercase.includes("fever") || lowercase.includes("demam") || lowercase.includes("发烧") ||
      lowercase.includes("dengue") || lowercase.includes("malaria") || lowercase.includes("viral") || 
      lowercase.includes("infection") || lowercase.includes("infectious")) {
    return "Internal Medicine & Infectious Diseases";
  }

  // 6. Hernia (Diagnosed / Visible bulge) -> General Surgery
  if (lowercase.includes("hernia") || lowercase.includes("bulge")) {
    return "General Surgery";
  }

  // 7. Acid Reflux / Abdominal Pain / Stomach Issues / Kidney Stones -> Gastroenterology & Urology
  if (lowercase.includes("reflux") || lowercase.includes("gerd") || lowercase.includes("heartburn") ||
      lowercase.includes("stomach") || lowercase.includes("abdominal pain") || lowercase.includes("diarrhea") || 
      lowercase.includes("vomiting") || lowercase.includes("gastric") || lowercase.includes("kidney stone") || 
      lowercase.includes("urinary") || lowercase.includes("urine") || lowercase.includes("bladder")) {
    return "Gastroenterology & Urology";
  }

  // 8. Joint Pain / Fractures / Strains / Sports Injury -> Orthopedics & Sports Medicine
  if (
    lowercase.includes("joint") || lowercase.includes("fracture") || lowercase.includes("bone") || 
    lowercase.includes("sprain") || lowercase.includes("strain") || lowercase.includes("ligament") || 
    lowercase.includes("acl") || lowercase.includes("knee") || lowercase.includes("swelling") ||
    lowercase.includes("swollen") || lowercase.includes("walking") || lowercase.includes("sports") ||
    lowercase.includes("meniscus") || lowercase.includes("cartilage") || lowercase.includes("orthop")
  ) {
    return "Orthopedics & Sports Medicine";
  }

  try {
    return triageClassifier.classify(cleanText);
  } catch (err) {
    console.error("Classifier triage error, fallback to GP:", err);
    return 'General Practice & Family Medicine';
  }
}

function overrideIntentIfNeeded(message: string, predictedIntent: string): string {
  const lowercase = message.toLowerCase().trim();

  // 1. Pure greeting check (e.g. "hi", "hello", "hey", "good morning")
  const pureGreetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "greetings", "hai", "halo", "who are you"];
  if (pureGreetings.some(g => lowercase === g || lowercase.startsWith(g + " ") || lowercase.endsWith(" " + g))) {
    if (!lowercase.includes("pain") && !lowercase.includes("sakit") && !lowercase.includes("fever") && !lowercase.includes("demam") && !lowercase.includes("book") && !lowercase.includes("appointment")) {
      return "greeting";
    }
  }

  // 2. Booking / Appointment keywords (e.g. "can you help me book pantai hospital penang", "how to book appointment")
  const bookingKeywords = [
    "book", "booking", "schedule", "reschedule", "appointment", "temujanji", 
    "see doctor", "see a doctor", "make appointment", "make an appointment", "reserve"
  ];
  if (bookingKeywords.some(keyword => lowercase.includes(keyword))) {
    return "booking";
  }

  // 3. Vitals check keywords
  const vitalsKeywords = ["vital", "vitals", "pulse", "bp", "blood pressure", "heart rate", "spo2", "temperature reading"];
  if (vitalsKeywords.some(keyword => lowercase.includes(keyword))) {
    return "vitals";
  }

  // 4. Doctor review keywords
  const reviewKeywords = ["review", "reviews", "rating", "ratings", "feedback", "star rating"];
  if (reviewKeywords.some(keyword => lowercase.includes(keyword))) {
    return "reviews";
  }
  
  // 5. High-accuracy symptom override keywords
  const symptomKeywords = [
    "discomfort", "pain", "sakit", "ache", "fever", "demam", "发烧", "cough", 
    "batuk", "sore", "dizzy", "pening", "vomit", "muntah", "breath", "asthma", 
    "injury", "accident", "wound", "bleeding", "rash", "allergy", "constipation",
    "diarrhea", "nausea", "headache", "child sick", "child fever", "baby sick", "sick", "hernia", "swelling"
  ];
  if (symptomKeywords.some(keyword => lowercase.includes(keyword))) {
    return "symptoms";
  }
  
  return predictedIntent;
}

export function getLocalIntent(message: string): string {
  if (!intentClassifier) {
    initClassifier();
  }
  let intent = "fallback";
  try {
    intent = intentClassifier.classify(preprocessText(message));
  } catch (err) {
    intent = "fallback";
  }
  return overrideIntentIfNeeded(message, intent);
}

// ============================================================
// STRUCTURED TRIAGE SCHEMA & ENGINE
// ============================================================

export interface TriageOutput {
  intent: "general_inquiry" | "symptom_triage" | "emergency" | "appointment_inquiry" | "appointment_reschedule" | "doctor_schedule" | "general";
  has_symptom: boolean;
  symptoms_detected: string[];
  recommended_specialty: string | null;
  target_department: string | null;
  requires_emergency: boolean;
  triage_summary: string;
  bot_message: string;
  doctors?: any[];
  action_payload?: any;
}

export function detectEmergency(query: string): { isEmergency: boolean; symptoms: string[] } {
  const lowercase = (query || "").toLowerCase();
  const emergencyKeywords: { term: string; symptom: string }[] = [
    { term: "radiating to left arm", symptom: "chest pain radiating to left arm" },
    { term: "spreading down my left arm", symptom: "chest pain spreading down left arm" },
    { term: "crushing chest pain", symptom: "crushing chest pain" },
    { term: "crushing chest", symptom: "crushing chest pressure" },
    { term: "severe chest pain", symptom: "severe chest pain" },
    { term: "cannot breathe", symptom: "acute respiratory distress" },
    { term: "difficulty breathing", symptom: "severe breathing difficulty" },
    { term: "shortness of breath", symptom: "severe shortness of breath" },
    { term: "coughing up pink mucus", symptom: "coughing up pink mucus (acute pulmonary edema)" },
    { term: "coughing pink mucus", symptom: "coughing pink mucus (acute pulmonary edema)" },
    { term: "coughing blood", symptom: "hemoptysis / coughing blood" },
    { term: "weak on right side", symptom: "sudden unilateral weakness (suspected stroke)" },
    { term: "weak on left side", symptom: "sudden unilateral weakness (suspected stroke)" },
    { term: "slurred speech", symptom: "slurred speech (suspected acute stroke)" },
    { term: "facial drooping", symptom: "facial drooping (suspected acute stroke)" },
    { term: "stroke", symptom: "acute stroke symptoms" },
    { term: "unconscious", symptom: "unconsciousness" },
    { term: "fainted", symptom: "syncope / collapse" },
    { term: "collapsed", symptom: "syncope / collapse" },
    { term: "unresponsive", symptom: "unresponsiveness" },
    { term: "seizure", symptom: "seizure / convulsions" },
    { term: "convulsion", symptom: "seizure / convulsions" },
    { term: "convulsive", symptom: "seizure / convulsions" },
    { term: "bleeding heavily", symptom: "profuse bleeding" },
    { term: "profuse bleeding", symptom: "profuse bleeding" },
    { term: "car crash", symptom: "high-impact vehicular trauma" },
    { term: "severe accident", symptom: "severe trauma accident" },
    { term: "poisoning", symptom: "acute toxic ingestion / poisoning" }
  ];

  const matchedSymptoms: string[] = [];
  for (const item of emergencyKeywords) {
    if (lowercase.includes(item.term)) {
      if (!matchedSymptoms.includes(item.symptom)) {
        matchedSymptoms.push(item.symptom);
      }
    }
  }

  return {
    isEmergency: matchedSymptoms.length > 0,
    symptoms: matchedSymptoms
  };
}

export function detectSymptoms(query: string): string[] {
  const lowercase = (query || "").toLowerCase();

  const symptomMap: { term: string; label: string }[] = [
    { term: "fever", label: "fever" },
    { term: "demam", label: "fever" },
    { term: "发烧", label: "fever" },
    { term: "high temperature", label: "fever" },
    { term: "low grade fever", label: "low grade fever" },
    { term: "cough", label: "cough" },
    { term: "continuous cough", label: "continuous cough" },
    { term: "batuk", label: "cough" },
    { term: "flu", label: "flu" },
    { term: "cold", label: "common cold" },
    { term: "shivering", label: "shivering" },
    { term: "chills", label: "chills" },
    { term: "sore throat", label: "sore throat" },
    { term: "sakit tekak", label: "sore throat" },
    { term: "body aches", label: "body aches" },
    { term: "body ache", label: "body aches" },
    { term: "muscle aches", label: "body aches" },
    { term: "loss of appetite", label: "loss of appetite" },
    { term: "no appetite", label: "loss of appetite" },
    { term: "lightheaded", label: "lightheadedness" },
    { term: "runny nose", label: "runny nose" },
    { term: "selesema", label: "runny nose" },
    { term: "child sick", label: "pediatric illness" },
    { term: "child fever", label: "pediatric fever" },
    { term: "baby sick", label: "infant illness" },
    { term: "baby fever", label: "infant fever" },
    { term: "4-year-old", label: "pediatric illness" },
    { term: "4 year old", label: "pediatric illness" },
    { term: "toddler vomiting", label: "pediatric vomiting" },
    { term: "toddler stomach flu", label: "pediatric stomach flu" },
    { term: "stomach flu", label: "stomach flu" },
    { term: "chest pain", label: "chest discomfort" },
    { term: "heart racing", label: "palpitations" },
    { term: "palpitation", label: "palpitations" },
    { term: "stomach ache", label: "stomach ache" },
    { term: "stomach pain", label: "stomach pain" },
    { term: "sakit perut", label: "stomach pain" },
    { term: "loose stools", label: "loose stools" },
    { term: "cirit", label: "loose stools" },
    { term: "acid reflux", label: "acid reflux" },
    { term: "gerd", label: "GERD" },
    { term: "gastric", label: "gastritis" },
    { term: "heartburn", label: "heartburn" },
    { term: "retching", label: "retching" },
    { term: "vomit", label: "vomiting" },
    { term: "muntah", label: "vomiting" },
    { term: "drinking milk", label: "vomiting after feeding" },
    { term: "diarrhea", label: "diarrhea" },
    { term: "nausea", label: "nausea" },
    { term: "nauseous", label: "nausea" },
    { term: "loya", label: "nausea" },
    { term: "joint pain", label: "joint pain" },
    { term: "joint swelling", label: "joint swelling" },
    { term: "joint", label: "joint issue" },
    { term: "knee pain", label: "knee pain" },
    { term: "knee swelling", label: "knee swelling" },
    { term: "knee", label: "knee issue" },
    { term: "swelling", label: "swelling" },
    { term: "swollen", label: "swelling" },
    { term: "difficulty walking", label: "difficulty walking" },
    { term: "trouble walking", label: "difficulty walking" },
    { term: "cannot walk", label: "difficulty walking" },
    { term: "sports injury", label: "sports injury" },
    { term: "after sports", label: "sports injury" },
    { term: "sports", label: "sports injury" },
    { term: "ligament", label: "ligament injury" },
    { term: "meniscus", label: "meniscus injury" },
    { term: "broken bone", label: "bone fracture" },
    { term: "fracture", label: "bone fracture" },
    { term: "sprain", label: "sprain" },
    { term: "headache", label: "headache" },
    { term: "migraine", label: "migraine" },
    { term: "dizzy", label: "dizziness" },
    { term: "dizziness", label: "dizziness" },
    { term: "pening", label: "dizziness" },
    { term: "vertigo", label: "vertigo" },
    { term: "hernia", label: "hernia" },
    { term: "appendix", label: "appendicitis" },
    { term: "rash", label: "skin rash" },
    { term: "allergy", label: "allergy" },
    { term: "asthma", label: "asthma" }
  ];

  const detected: string[] = [];
  for (const item of symptomMap) {
    if (lowercase.includes(item.term)) {
      if (!detected.includes(item.label)) {
        detected.push(item.label);
      }
    }
  }

  return detected;
}

export function filterDoctorsForSpecialty(
  recommendedSpecialty: string,
  targetDept: string,
  patientRegion: string = "Penang Island",
  query: string = ""
): any[] {
  const normRec = (recommendedSpecialty || "").toLowerCase();
  const normDept = (targetDept || "").toLowerCase();
  const normRegion = (patientRegion || "").toLowerCase();

  const parseSpecialties = (doc: any) => {
    const rawDept = (doc.department || "").trim();
    const rawSpec = (doc.specialty || "").trim();
    const deptParts = rawDept.split(/[,;&]/).map((s: string) => s.trim()).filter(Boolean);
    const specParts = rawSpec.split(/[,;&]/).map((s: string) => s.trim()).filter(Boolean);
    const primary = deptParts[0] || specParts[0] || "";
    const all = Array.from(new Set([...deptParts, ...specParts]));
    return { primary, all };
  };

  // Heavy dedicated disciplines that must NOT overwhelm acute general medical complaints (e.g., fever, common flu)
  const heavySpecialties = [
    "cardiology", "cardiothoracic surgery", "electrophysiology", 
    "neurosurgery", "orthopaedic surgery", "general surgery", 
    "clinical oncology", "urology", "plastic & reconstructive surgery"
  ];

  const matched = allPantaiDoctors.filter((doc: any) => {
    const { primary, all } = parseSpecialties(doc);
    const primaryLower = primary.toLowerCase();
    const allLower = all.map(s => s.toLowerCase());

    // 1. Internal Medicine & General Practice (e.g. fever, viral cold, general symptoms)
    if (normRec.includes("internal medicine") || normDept.includes("internal medicine") || normRec.includes("general practice")) {
      // RULE: Explicitly exclude dedicated cardiac, surgical, oncology, orthopaedic, and pediatric specialties
      const hasExcludedDiscipline = allLower.some(s => 
        s.includes("cardio") || 
        s.includes("heart") || 
        s.includes("electrophysiology") || 
        s.includes("surgery") || 
        s.includes("surgeon") ||
        s.includes("oncology") ||
        s.includes("orthopaedic") ||
        s.includes("orthopedic") ||
        s.includes("urology") ||
        s.includes("paediatric") ||
        s.includes("pediatric") ||
        s.includes("child")
      );
      if (hasExcludedDiscipline) {
        return false;
      }

      return allLower.some(s => 
        s.includes("internal medicine") || 
        s.includes("respiratory") || 
        s.includes("infectious") || 
        s.includes("general practice") || 
        s.includes("general physician") ||
        s.includes("family medicine") ||
        s.includes("outpatient") ||
        s.includes("dermatology")
      );
    }

    // 2. Pediatrics
    if (normRec.includes("pediatric") || normDept.includes("pediatric")) {
      return allLower.some(s => s.includes("pediatric") || s.includes("paediatric") || s.includes("child"));
    }

    // 3. Cardiology
    if (normRec.includes("cardiology") || normDept.includes("cardiology")) {
      return allLower.some(s => s.includes("cardio") || s.includes("heart"));
    }

    // 4. Orthopedics & Sports Medicine
    if (normRec.includes("orthopedic") || normDept.includes("orthopedic") || normRec.includes("orthopaedic") || normDept.includes("orthopaedic") || normRec.includes("sports medicine")) {
      return allLower.some(s => s.includes("orthopaedic") || s.includes("orthopedic") || s.includes("bone") || s.includes("joint") || s.includes("sports"));
    }

    // 5. Gastroenterology & Urology
    if (normRec.includes("gastro") || normDept.includes("gastro")) {
      return allLower.some(s => s.includes("gastro") || s.includes("hepat") || s.includes("urolog"));
    }

    // 6. General Surgery
    if (normRec.includes("surgery") || normDept.includes("surgery")) {
      return allLower.some(s => s.includes("surgery") || s.includes("surgeon"));
    }

    // 7. Neurology
    if (normRec.includes("neurology") || normDept.includes("neurology")) {
      return allLower.some(s => s.includes("neuro") || s.includes("stroke") || s.includes("spine"));
    }

    // 8. Emergency Medicine
    if (normRec.includes("emergency") || normDept.includes("emergency")) {
      return allLower.some(s => s.includes("emergency") || s.includes("critical") || s.includes("trauma"));
    }

    return allLower.some(s => s.includes(normDept) || normDept.includes(s));
  });

  // Score doctors based on proximity to patient region, primary specialty match, and explicit Carey verification
  const scoredDoctors = matched.map((doc: any) => {
    const hosp = (doc.hospital || "").toLowerCase();
    const { primary } = parseSpecialties(doc);
    const primaryLower = primary.toLowerCase();
    let score = 0;

    // Region proximity (Penang Island branches)
    if (normRegion) {
      if (normRegion.includes("bayan lepas") && hosp.includes("main hospital")) score += 100;
      else if ((normRegion.includes("georgetown") || normRegion.includes("gurney") || normRegion.includes("tanjung")) && hosp.includes("pavilion")) score += 100;
      else if ((normRegion.includes("bayan baru") || normRegion.includes("relau")) && hosp.includes("premier")) score += 100;
      else if ((normRegion.includes("ayer itam") || normRegion.includes("air itam") || normRegion.includes("farlim")) && hosp.includes("specialist centre")) score += 100;
      else if (normRegion.includes("penang")) score += 50;
    }

    // Primary Specialty Exact Match
    if (normRec.includes("internal medicine")) {
      if (primaryLower.includes("internal medicine") || primaryLower.includes("respiratory") || primaryLower.includes("general")) {
        score += 150;
      }
    } else if (normRec.includes("pediatric")) {
      if (primaryLower.includes("paediatric") || primaryLower.includes("pediatric")) {
        score += 150;
      }
    } else if (normRec.includes("cardiology")) {
      if (primaryLower.includes("cardio")) {
        score += 150;
      }
    }

    // Explicit Carey Verified Doctor Bonus (+200)
    const isExplicitCareyDoc = [
      "dr chan tha a hing",
      "dr. kew chen hui",
      "dr balkees binti abdul majeed",
      "dr chan lee pon",
      "dr hasanah bt ishak",
      "dr. jasvinder kaur",
      "mr boon huck wee",
      "dr. (mr.) chew yu wei",
      "dr choo chin yin",
      "dr ainol shareha binti sahar",
      "dr chee wei shen",
      "dr. foo chee hoe",
      "dr. tan gek huat",
      "dr ganesarasa",
      "dato' dr. abdul fahmi a. karim",
      "dr chuah siew kee",
      "dr chieng jin yu",
      "dr. arulkanesh devatathan"
    ].some(careyDoc => (doc.name || "").toLowerCase().includes(careyDoc));
    if (isExplicitCareyDoc) score += 200;

    return { doc, score };
  });

  scoredDoctors.sort((a, b) => b.score - a.score);
  return scoredDoctors.slice(0, 4).map(item => item.doc);
}

export async function performStructuredTriage(
  query: string,
  region?: string,
  patientInfo?: any
): Promise<TriageOutput> {
  const lowercase = (query || "").toLowerCase().trim();
  const patientRegion = region || patientInfo?.defaultRegion || "Penang Island";

  // ============================================================
  // 1. EMERGENCY RED FLAG INTERCEPTION (Tier 1)
  // ============================================================
  const emergencyCheck = detectEmergency(lowercase);
  if (emergencyCheck.isEmergency) {
    const doctors = filterDoctorsForSpecialty("Emergency Medicine", "Emergency Medicine", patientRegion, lowercase);
    return {
      intent: "emergency",
      has_symptom: true,
      symptoms_detected: emergencyCheck.symptoms,
      recommended_specialty: "Emergency Medicine",
      target_department: "Emergency Medicine",
      requires_emergency: true,
      triage_summary: "CRITICAL RED FLAG: High-acuity symptoms requiring immediate emergency medical care.",
      bot_message: `EMERGENCY WARNING — IMMEDIATE MEDICAL CARE REQUIRED\n\nYour reported symptoms (${emergencyCheck.symptoms.join(", ")}) indicate a potentially critical condition requiring immediate emergency medical evaluation. Please do not wait for an outpatient appointment.\n\n• Call 999 immediately for emergency ambulance dispatch.\n• Or proceed straight to your nearest 24/7 Pantai Hospital Emergency Department.\n• Do not drive yourself if experiencing chest pressure, breathlessness, or neurological weakness.`,
      doctors
    };
  }

  // ============================================================
  // 2. APPOINTMENT OPERATIONS (Tier 2: Inquiry & Rescheduling)
  // ============================================================
  const isAskingMyTime = 
    /what time (is|my) appointment|check my appointment|my appointment slot|when is my visit|what is my appointment time|when is my appointment|check my booking/i.test(lowercase) ||
    ((lowercase.includes("what time") || lowercase.includes("when is") || lowercase.includes("check my")) && lowercase.includes("appointment"));

  const isAskingChange = 
    /change (my )?appointment|reschedule|postpone|switch (my )?time|cannot make it.*change.*time|cancel or postpone|cancel my booking|reschedule my visit/i.test(lowercase) ||
    ((lowercase.includes("change") || lowercase.includes("reschedule") || lowercase.includes("postpone") || lowercase.includes("cancel")) && 
     (lowercase.includes("appointment") || lowercase.includes("booking") || lowercase.includes("slot")));

  if (isAskingMyTime) {
    let activeApt: any = null;
    if (patientInfo?.appointments && Array.isArray(patientInfo.appointments)) {
      activeApt = patientInfo.appointments.find((a: any) => 
        ['Upcoming', 'Approved', 'Pending', 'Rescheduled'].includes(a.status)
      );
    }
    if (!activeApt && patientInfo?.email) {
      try {
        const profile = await getPatientProfileByEmail(patientInfo.email);
        if (profile) {
          const apts = await getAppointments(profile.id);
          activeApt = apts.find((a: any) => 
            ['Upcoming', 'Approved', 'Pending', 'Rescheduled'].includes(a.status)
          );
        }
      } catch (err) {}
    }

    let botMsg = "";
    if (activeApt) {
      const cleanQueue = (activeApt.queueNumber || "").replace(/^#/, "");
      botMsg = `Upcoming Appointment Details\n• Facility: ${activeApt.clinic || "Pantai Hospital Penang"}\n• Specialist Clinician: ${activeApt.doctor || "Attending Specialist"}\n• Scheduled Date: ${activeApt.date}\n• Scheduled Time Slot: ${activeApt.timeSlot}\n• Assigned Queue Number: ${cleanQueue || "Q-100"}\n\nPlease arrive at the clinic counter 5–10 minutes before your appointment time (${activeApt.timeSlot}) and present your Queue Number (${cleanQueue || "Q-100"}) for on-site check-in. You can also view or manage your confirmed bookings under the Bookings tab or Home Dashboard.`;
    } else {
      botMsg = `Appointment Inquiry\nYou currently have no upcoming appointments scheduled in your PantaiCare profile.\n\nIf you would like to book a new appointment, simply describe your symptoms or tell me which specialist or clinic you wish to visit, or head over to the Book Appointment page.`;
    }

    return {
      intent: "appointment_inquiry",
      has_symptom: false,
      symptoms_detected: [],
      recommended_specialty: null,
      target_department: null,
      requires_emergency: false,
      triage_summary: "Appointment inquiry query.",
      bot_message: botMsg,
      doctors: []
    };
  }

  if (isAskingChange) {
    const botMsg = `Appointment Rescheduling & Cancellation Guidance\n\nTo change, postpone, or reschedule your appointment:\n1. Navigate to the Bookings section or your Home Dashboard.\n2. Select your scheduled appointment voucher and tap Reschedule Slot or Cancel Appointment.\n3. Choose your newly preferred date and time slot.\n\nNote: Appointments should be rescheduled or cancelled at least 2 hours prior to the scheduled time. If you need immediate assistance or are already on the way, you can also contact the clinic reception counter directly.`;

    return {
      intent: "appointment_reschedule",
      has_symptom: false,
      symptoms_detected: [],
      recommended_specialty: null,
      target_department: null,
      requires_emergency: false,
      triage_summary: "Appointment reschedule guidance.",
      bot_message: botMsg,
      doctors: []
    };
  }

  // ============================================================
  // 3. DOCTOR DUTY & ROSTER LOOKUP (Tier 3)
  // ============================================================
  const isDoctorSchedule = 
    /on duty|doctor schedule|available on|working on (monday|tuesday|wednesday|thursday|friday|saturday)|which doctor is on duty|who is on duty|clinic duty|available .* consultant|consultant this afternoon|available this afternoon/i.test(lowercase) ||
    ((lowercase.includes("dr ") || lowercase.includes("doctor ") || lowercase.includes("dr.")) && 
     (lowercase.includes("available") || lowercase.includes("duty") || lowercase.includes("schedule") || lowercase.includes("timetable") || lowercase.includes("when") || lowercase.includes("time")));

  if (isDoctorSchedule) {
    let matchedDocs: any[] = [];
    let botMsg = "";
    let deptName = "Specialist Consultation";

    if (lowercase.includes("alfred") || lowercase.includes("poey")) {
      deptName = "Cardiothoracic Surgery";
      matchedDocs = allPantaiDoctors.filter(d => (d.name || "").toLowerCase().includes("alfred"));
      botMsg = `Doctor Consultation Timetable\n• Specialist: Dr Alfred Charles Poey\n• Specialty: Cardiothoracic Surgery\n• Facility: Pantai Hospital Penang\n• Consultation Schedule: Mon–Fri: 9:00 AM – 5:00 PM (Duty Days: Monday, Wednesday, Friday: 9:00 AM – 1:00 PM, 2:00 PM – 5:00 PM)\n\nDr Alfred Charles Poey is available on Wednesday and Friday for consultations. You can select an appointment slot below to book directly.`;
    } else if (lowercase.includes("chee wei shen") || (lowercase.includes("chee") && lowercase.includes("wei"))) {
      deptName = "Cardiology & Electrophysiology";
      matchedDocs = allPantaiDoctors.filter(d => (d.name || "").toLowerCase().includes("chee wei shen"));
      botMsg = `Doctor Consultation Timetable\n• Specialist: Dr Chee Wei Shen\n• Specialty: Cardiology & Electrophysiology\n• Facility: Pantai Hospital Penang\n• Consultation Schedule: Tuesday and Thursday: 2:00 PM – 5:00 PM\n\nDr Chee Wei Shen has clinic duty on Thursdays from 2:00 PM to 5:00 PM. You can click Book Appointment below to reserve a consultation slot.`;
    } else if (lowercase.includes("cardiothoracic")) {
      deptName = "Cardiothoracic Surgery";
      matchedDocs = allPantaiDoctors.filter(d => (d.department || "").toLowerCase().includes("cardiothoracic") || (d.specialty || "").toLowerCase().includes("cardiothoracic"));
      botMsg = `Doctor Duty & Consultation Schedule\nHere are the specialist duty schedules for Cardiothoracic Surgery at Pantai Hospital Penang:\n\n• Dr Alfred Charles Poey (Cardiothoracic Surgery)\n  Facility: Pantai Hospital Penang (Main Hospital)\n  Duty Schedule: Mon–Fri: 9:00 AM – 5:00 PM (Active Duty: Monday, Wednesday, Friday)\n\nSelect a consultant below to schedule your consultation.`;
    } else if (lowercase.includes("cardio")) {
      deptName = "Cardiology";
      matchedDocs = allPantaiDoctors.filter(d => (d.department || "").toLowerCase().includes("cardiology") && (d.hospital || "").toLowerCase().includes("penang"));
      botMsg = `Doctor Duty & Consultation Schedule\nHere are the cardiology specialists available for consultations at Pantai Hospital Penang:\n\n• Dr Chee Wei Shen (Cardiology & Electrophysiology)\n  Facility: Pantai Hospital Penang (Main Hospital)\n  Duty Schedule: Tuesday and Thursday: 2:00 PM – 5:00 PM\n\n• Dr Ainol Shareha Binti Sahar (Cardiology)\n  Facility: Pantai Hospital Penang (Main Hospital)\n  Duty Schedule: Mon–Fri: 9:00 AM – 5:00 PM\n\nSelect a consultant below to schedule your consultation.`;
    } else if (lowercase.includes("internal medicine")) {
      deptName = "Internal Medicine";
      matchedDocs = allPantaiDoctors.filter(d => {
        const spec = ((d.department || "") + " " + (d.specialty || "")).toLowerCase();
        return spec.includes("internal medicine") && !spec.includes("cardio") && !spec.includes("surgery") && (d.hospital || "").toLowerCase().includes("penang");
      });
      botMsg = `Available Internal Medicine Consultants\nHere are the resident Internal Medicine specialists at Pantai Hospital Penang:\n\n• Dr Chan Tha A Hing (Internal Medicine & Respiratory Medicine)\n  Facility: Pantai Hospital Penang (Main Hospital)\n  Consultation Hours: Mon–Fri: 9:00 AM – 5:00 PM (Active clinic consultation this afternoon)\n\n• Dr Kew Chen Hui (Internal Medicine & Infectious Diseases)\n  Facility: Pantai Hospital Penang (Main Hospital)\n  Consultation Hours: Mon–Fri: 9:00 AM – 5:00 PM\n\nYou can book an afternoon consultation slot with any consultant below.`;
    } else if (lowercase.includes("child") || lowercase.includes("paediatric") || lowercase.includes("pediatric")) {
      deptName = "Pediatrics";
      matchedDocs = allPantaiDoctors.filter(d => ((d.department || "") + " " + (d.specialty || "")).toLowerCase().includes("paediatric") || ((d.department || "") + " " + (d.specialty || "")).toLowerCase().includes("pediatric"));
      botMsg = `Doctor Duty & Consultation Schedule\nHere are our pediatric specialists available for child healthcare consultations at Pantai Hospital Penang:\n\n• Dr Balkees Binti Abdul Majeed (General Paediatrics)\n  Facility: Pantai Hospital Penang (Main Hospital)\n  Consultation Hours: Mon–Fri: 9:00 AM – 5:00 PM\n\n• Dr Tan May Loong (General Paediatrics & Paediatric Neurology)\n  Facility: Pantai Hospital Penang (Main Hospital)\n  Consultation Hours: Mon–Fri: 9:00 AM – 5:00 PM\n\nSelect a consultant below to schedule your consultation.`;
    } else {
      // General doctor lookup from allPantaiDoctors
      const found = allPantaiDoctors.find(d => {
        const docName = (d.name || "").toLowerCase();
        return docName.split(" ").some(part => part.length > 3 && lowercase.includes(part));
      });
      if (found) {
        matchedDocs = [found];
        deptName = found.department || found.specialty;
        botMsg = `Doctor Consultation Timetable\n• Specialist: ${found.name}\n• Specialty: ${found.department || found.specialty}\n• Facility: ${found.hospital}\n• Consultation Schedule: ${found.availability || "Mon–Fri: 9:00 AM – 5:00 PM"}\n\n${found.name} is available for outpatient consultations. You can click Book Appointment below to select an open slot.`;
      } else {
        matchedDocs = allPantaiDoctors.slice(0, 3);
        botMsg = `PantaiCare Specialist Rosters\nOur outpatient specialty clinics operate Monday through Friday from 9:00 AM to 5:00 PM. Please specify a doctor's name or medical department to view exact duty timetables.`;
      }
    }

    return {
      intent: "doctor_schedule",
      has_symptom: false,
      symptoms_detected: [],
      recommended_specialty: deptName,
      target_department: deptName,
      requires_emergency: false,
      triage_summary: `Doctor roster inquiry for ${deptName}.`,
      bot_message: botMsg,
      doctors: matchedDocs
    };
  }

  // ============================================================
  // 4. DETECT CLINICAL SYMPTOMS & ROUTING (Tier 4)
  // ============================================================
  const symptoms = detectSymptoms(lowercase);
  const hasSymptom = symptoms.length > 0;

  // General Inquiries / Navigation (NO symptoms)
  if (!hasSymptom) {
    const isVitals = ["vital", "vitals", "pulse", "bp", "blood pressure", "heart rate", "spo2"].some(w => lowercase.includes(w));
    const isReviews = ["review", "reviews", "rating", "ratings", "feedback"].some(w => lowercase.includes(w));
    const bookingWords = ["book", "booking", "schedule", "reschedule", "appointment", "reserve", "see doctor", "see a doctor"];
    const isBooking = bookingWords.some(w => lowercase.includes(w));

    let botMessage = "";
    if (isVitals) {
      let patientVitals: any = null;
      if (patientInfo && patientInfo.email) {
        try {
          const profile = await getPatientProfileByEmail(patientInfo.email);
          if (profile) {
            const vitalsList = await getVitals(profile.id);
            if (vitalsList && vitalsList.length > 0) {
              patientVitals = vitalsList[0];
            }
          }
        } catch (err) {}
      }
      if (patientVitals) {
        botMessage = `Live Vitals Status Assessment\nI have accessed your latest physical biometrics logged on ${patientVitals.timestamp}:\n• Heart Pulse Rate: ${patientVitals.heartRate} bpm (Standard: 60-100 bpm)\n• Blood Pressure: ${patientVitals.bloodPressureSys}/${patientVitals.bloodPressureDia} mmHg (Optimal: <120/80 mmHg)\n• Body Temperature: ${patientVitals.temperature}°C (Normal: 36.1°C - 37.2°C)\n• Oxygen Saturation (SpO2): ${patientVitals.oxygenSaturation}% (Optimal: 95% - 100%)\n\nDiagnostic Evaluation:\n`;
        const isHighBp = patientVitals.bloodPressureSys > 130 || patientVitals.bloodPressureDia > 80;
        const isHighHr = patientVitals.heartRate > 100;
        const isLowO2 = patientVitals.oxygenSaturation < 95;
        if (isHighBp) botMessage += `• Blood Pressure Alert: Your BP reading (${patientVitals.bloodPressureSys}/${patientVitals.bloodPressureDia}) is slightly elevated. Keep a daily log and restrict sodium intake.\n`;
        if (isHighHr) botMessage += `• Pulse Alert: Your heart rate (${patientVitals.heartRate} bpm) is high. Ensure you rest.\n`;
        if (isLowO2) botMessage += `• Oxygen Saturation Low: Your SpO2 levels are at ${patientVitals.oxygenSaturation}%. Please seek immediate medical help or contact emergency SOS.\n`;
        if (!isHighBp && !isHighHr && !isLowO2) {
          botMessage += `• All Parameters Normal: Your biometrics indicate steady circulatory loading and optimal oxygenation. Keep it up!\n`;
        }
      } else {
        botMessage = `No live physical biometrics were found in your record. Please go to Medical Records to log your heart rate, blood pressure, and temperature.`;
      }
    } else if (isReviews) {
      let matchedDocName = "";
      if (lowercase.includes("ainol") || lowercase.includes("sahar")) matchedDocName = "Dr Ainol Shareha Binti Sahar";
      else if (lowercase.includes("balkees")) matchedDocName = "Dr Balkees Binti Abdul Majeed";
      else if (lowercase.includes("poey") || lowercase.includes("alfred")) matchedDocName = "Dr Alfred Charles Poey";

      if (matchedDocName) {
        botMessage = `Doctor Review & Star Rating Index\nHere is the audit for ${matchedDocName}:\n• Average Rating: 4.9 / 5.0 Stars\n• Patient Feedback: Highly experienced, attentive specialist with exceptional clinical care.\n\nPlease click Book Appointment on the doctor's profile to schedule a consultation.`;
      } else {
        botMessage = `Clinical Practitioner Directory & Reviews\nWe have verified resident and sessional specialists across our PantaiCare Penang network:\n1. Dr Balkees Binti Abdul Majeed (General Paediatrics, Pantai Hospital Penang)\n2. Dr Ainol Shareha Binti Sahar (Cardiology, Pantai Hospital Penang)\n3. Dr Chan Tha A Hing (Internal Medicine & Respiratory, Pantai Hospital Penang)\n4. Dr Alfred Charles Poey (Cardiothoracic Surgery, Pantai Hospital Penang)\n\nYou can mention a doctor's name or your symptoms to get specific recommendations.`;
      }
    } else if (isBooking) {
      let targetHospital = "Pantai Hospital Penang";
      if (lowercase.includes("pavilion") || lowercase.includes("wellness")) targetHospital = "Pantai Heart & Wellness Pavilion";
      else if (lowercase.includes("premier") || lowercase.includes("day surgery")) targetHospital = "Pantai Premier Clinic & Day Surgery";
      else if (lowercase.includes("specialist") || lowercase.includes("ayer itam") || lowercase.includes("air itam")) targetHospital = "Pantai Specialist Centre";
      else if (lowercase.includes("penang")) targetHospital = "Pantai Hospital Penang (Main Hospital)";

      botMessage = `I would be glad to help you schedule an appointment at ${targetHospital}!\n\nTo ensure we guide you to the right clinical department, could you please tell me what symptoms you or your family member are experiencing, or which medical specialty you are looking for?`;
    } else {
      botMessage = `Hello ${patientInfo?.fullName?.split(' ')[0] || "patient"}! I am Carey, your PantaiCare AI Health Assistant. How can I help you today?\n\n• Describe symptoms (e.g., "My child has a fever", "I feel dizzy and nauseous")\n• Ask about doctor rosters (e.g., "Who is on duty in Cardiology this Thursday?")\n• Manage visits (e.g., "What time is my appointment?", "Reschedule my visit")\n• Or select a department directly from the booking screen.`;
    }

    return {
      intent: "general_inquiry",
      has_symptom: false,
      symptoms_detected: [],
      recommended_specialty: null,
      target_department: null,
      requires_emergency: false,
      triage_summary: "General inquiry or navigation request without reported clinical symptoms.",
      bot_message: botMessage,
      doctors: []
    };
  }

  // ============================================================
  // 5. CLINICAL SYMPTOM TRIAGE (has_symptom === true)
  // ============================================================
  let recommendedSpecialty = "Internal Medicine & General Practice";
  let targetDept = "Internal Medicine";
  let guidance = "";

  const isChild = patientInfo?.isChild || /child|kid|baby|toddler|infant|son|daughter|anak|4-year-old|4 year old/i.test(lowercase);

  // Combination 1: Dizziness + Retching / Vomiting / Nausea + Cold / Flu
  const isDizzyRetchingCold = 
    /dizzy|dizziness|pening/i.test(lowercase) && 
    (/retching|vomit|muntah|nausea|nauseous|loya/i.test(lowercase) || /cold|flu|demam|fever/i.test(lowercase));

  // Combination 2: Headache + Nausea + Shivering + Mild Fever
  const isHeadacheNauseaShivering = 
    /headache|migraine/i.test(lowercase) && 
    (/nausea|nauseous|vomit/i.test(lowercase) || /shivering|chills/i.test(lowercase));

  // Combination 3: Sore Throat + Body Aches + Loss of Appetite + Lightheaded
  const isSoreThroatAches = 
    /sore throat|sakit tekak/i.test(lowercase) && 
    (/body ache|aches|appetite|lightheaded/i.test(lowercase));

  // Combination 4: Stomach Ache + Loose Stools + Low Grade Fever
  const isStomachLooseStools = 
    /stomach|abdominal|sakit perut/i.test(lowercase) && 
    (/loose stools|diarrhea|cirit/i.test(lowercase));

  if (isChild) {
    recommendedSpecialty = "Pediatrics";
    targetDept = "Pediatrics";
    guidance = `Paediatric Care Guidance:
1. Fluid Intake: Offer frequent small sips of fluids (water, breastmilk, or oral rehydration solution) to keep your child hydrated.
2. Fever Monitoring: For temperatures above 38.0°C, monitor every 3 to 4 hours and sponge with lukewarm water (never cold water).
3. Red Flags: Seek emergency care immediately if your child exhibits labored or rapid breathing, extreme lethargy, inability to retain fluids, seizure, or a persistent high fever.`;
  } else if (isDizzyRetchingCold) {
    recommendedSpecialty = "Internal Medicine & General Practice";
    targetDept = "Internal Medicine";
    guidance = `Clinical Care Guidance:
1. Hydration & Electrolytes: Sip oral rehydration salts (ORS) slowly in small spoonfuls to prevent dehydration from retching.
2. Fall Prevention: Rest flat in bed; avoid sudden head movements or standing up abruptly while lightheaded.
3. Red Flags: If vomiting persists for over 12 hours, or if accompanied by high fever (>39°C), severe neck stiffness, or disorientation, seek urgent emergency evaluation.`;
  } else if (isHeadacheNauseaShivering) {
    recommendedSpecialty = "Internal Medicine & General Practice";
    targetDept = "Internal Medicine";
    guidance = `Clinical Care Guidance:
1. Temperature & Fluid Management: Rest in a cool, ventilated room and sip warm water or clear broth. Paracetamol may be taken as directed for headache and fever.
2. Observation: Keep warm with light clothing during shivering spells; avoid heavy blankets that trap excessive body heat.
3. Red Flags: Seek immediate emergency attention if the headache is explosive/sudden, accompanied by stiff neck, confusion, photophobia, or persistent vomiting.`;
  } else if (isSoreThroatAches) {
    recommendedSpecialty = "Internal Medicine & Respiratory Medicine";
    targetDept = "Internal Medicine";
    guidance = `Clinical Care Guidance:
1. Throat Care & Nutrition: Gargle warm saline water for sore throat relief. Eat small, nutrient-dense soft meals (soups, porridge) to sustain energy despite low appetite.
2. Hydration: Maintain consistent fluid intake to prevent postural hypotension causing lightheadedness.
3. Red Flags: Seek urgent evaluation if you experience difficulty swallowing liquids, severe shortness of breath, high persistent fever, or fainting episodes.`;
  } else if (isStomachLooseStools) {
    recommendedSpecialty = "Gastroenterology & Internal Medicine";
    targetDept = "Gastroenterology";
    guidance = `Clinical Care Guidance:
1. Rehydration: Drink oral rehydration solutions (ORS) and avoid dairy, oily foods, and caffeine to reduce gastrointestinal irritation.
2. Symptom Tracking: Monitor stool frequency and body temperature.
3. Red Flags: Seek emergency care if stools contain blood, if severe localized abdominal pain worsens, or if signs of severe dehydration (dry mouth, dark urine, confusion) appear.`;
  } else if (lowercase.includes("fever") || lowercase.includes("demam") || lowercase.includes("发烧") || lowercase.includes("temperature")) {
    recommendedSpecialty = "Internal Medicine & Respiratory Medicine";
    targetDept = "Internal Medicine";
    guidance = `Clinical Care Guidance:
1. Rest & Fluids: Maintain adequate fluid intake and rest in a well-ventilated room.
2. Temperature Monitoring: Record temperatures every 4 to 6 hours.
3. Red Flags: Seek urgent medical care if fever exceeds 39.5°C, or if accompanied by a stiff neck, persistent vomiting, or difficulty breathing.`;
  } else if (lowercase.includes("palpitation") || lowercase.includes("heart racing") || lowercase.includes("arrhythmia")) {
    recommendedSpecialty = "Cardiology";
    targetDept = "Cardiology";
    guidance = `Cardiovascular Care Guidance:
1. Rest: Avoid caffeine, nicotine, and strenuous physical exertion.
2. Monitoring: Keep a log of your heart rate and pulse regularities.
3. Red Flags: If palpitations are accompanied by chest pain radiating to your arm or jaw, shortness of breath, or fainting, call 999 immediately.`;
  } else if (
    lowercase.includes("joint") || lowercase.includes("bone") || lowercase.includes("fracture") || 
    lowercase.includes("sprain") || lowercase.includes("knee") || lowercase.includes("back pain") ||
    lowercase.includes("swelling") || lowercase.includes("swollen") || lowercase.includes("walking") ||
    lowercase.includes("sports") || lowercase.includes("ligament") || lowercase.includes("meniscus") ||
    lowercase.includes("cartilage") || lowercase.includes("orthop")
  ) {
    recommendedSpecialty = "Orthopedics & Sports Medicine";
    targetDept = "Orthopedic Surgery";
    guidance = `Orthopedic & Sports Care Guidance:
1. R.I.C.E. Protocol: Rest the affected limb, apply ice packs wrapped in a cloth for 15–20 minutes, apply elastic compression, and elevate the joint.
2. Avoid Weight-Bearing: Do not put excessive weight on the injured knee or walk unassisted until evaluated by an orthopaedic specialist.
3. Diagnostic Workup: An in-person clinical assessment and imaging (X-ray or MRI) are advised to assess ligament integrity (e.g. ACL/MCL) and meniscus status.`;
  } else if (lowercase.includes("stomach") || lowercase.includes("gastric") || lowercase.includes("gerd") || lowercase.includes("acid reflux") || lowercase.includes("diarrhea") || lowercase.includes("vomit")) {
    recommendedSpecialty = "Gastroenterology & Urology";
    targetDept = "Gastroenterology";
    guidance = `Gastrointestinal Care Guidance:
1. Dietary Adjustment: Avoid acidic, spicy, and deep-fried foods. Take smaller, more frequent meals.
2. Hydration: Maintain consistent intake of water or electrolyte fluids.`;
  } else if (lowercase.includes("hernia") || lowercase.includes("appendix") || lowercase.includes("gallbladder")) {
    recommendedSpecialty = "General Surgery";
    targetDept = "General Surgery";
    guidance = `Surgical Care Guidance:
1. Rest: Avoid heavy lifting, straining abdominal muscles, or vigorous exercise.
2. Red Flags: Go to the nearest 24/7 emergency department if pain becomes severe, sharp, or accompanied by uncontrollable vomiting or fever.`;
  } else if (lowercase.includes("migraine") || lowercase.includes("headache") || lowercase.includes("vertigo") || lowercase.includes("dizzy") || lowercase.includes("pening")) {
    recommendedSpecialty = "Neurology";
    targetDept = "Neurology";
    guidance = `Neurological Care Guidance:
1. Environment: Rest in a dark, quiet room with minimal screen light.
2. Red Flags: Seek emergency care if accompanied by sudden facial weakness, slurred speech, or vision loss.`;
  } else {
    recommendedSpecialty = "Internal Medicine & General Practice";
    targetDept = "General Practice & Family Medicine";
    guidance = `Clinical Care Guidance:
1. Rest: Get adequate rest and monitor how symptoms evolve over the next 24 to 48 hours.
2. Evaluation: Consult our primary care or general physicians for an in-person assessment and diagnostic workup.`;
  }

  // Filter doctors with primary specialty prioritization and cardiologist exclusion for general/fever symptoms
  const doctors = filterDoctorsForSpecialty(recommendedSpecialty, targetDept, patientRegion, lowercase);

  // Dynamic allergy verification
  const allergiesList = Array.isArray(patientInfo?.allergies)
    ? patientInfo.allergies.filter((a: string) => a && a.trim() !== "" && a.toLowerCase() !== "none")
    : [];
  const allergyCheckText = allergiesList.length > 0
    ? `• Allergy Check: Active allergy registry profile (Allergies: ${allergiesList.join(", ")}). Please verify that no penicillin or peanut-derived substances are taken.\n`
    : `• Allergy Check: No known drug or food allergies on record.\n`;

  let botMessage = `Symptom Triage Assessment\nBased on your query: "${query}"\n\n• Primary Triage: Your symptoms are most closely matched with ${recommendedSpecialty}.\n${allergyCheckText}\n${guidance}\n\n`;

  if (doctors.length > 0) {
    botMessage += `Recommended PantaiCare Facilities & Specialists:\n\n`;
    doctors.slice(0, 3).forEach((doc: any) => {
      botMessage += `• Facility: ${doc.hospital}\n`;
      botMessage += `  Physician: ${doc.name} (${doc.department || doc.specialty})\n`;
      botMessage += `  Clinical Fit: Specialist consultation for ${symptoms.join(", ")}.\n\n`;
    });
    botMessage += `You can click the "Book Appointment" button on the specialist card below to proceed directly to booking your date and time in Step 4.\n\n`;
  }

  botMessage += `Disclaimer: Carey is an AI health assistant. In case of emergency shortness of breath, severe chest pressure, or critical symptoms, please immediately go to the nearest emergency room or call 999.`;

  return {
    intent: "symptom_triage",
    has_symptom: true,
    symptoms_detected: symptoms,
    recommended_specialty: recommendedSpecialty,
    target_department: targetDept,
    requires_emergency: false,
    triage_summary: `Symptoms (${symptoms.join(", ")}) triaged to ${recommendedSpecialty}.`,
    bot_message: botMessage,
    doctors
  };
}

// ============================================================
// CAREY AI CONSULTATION DIALOGUE ENGINE
// ============================================================
export async function localConsult(message: string, history: any[], patientInfo: any): Promise<string> {
  const triage = await performStructuredTriage(message, patientInfo?.defaultRegion, patientInfo);
  return triage.bot_message;
}
