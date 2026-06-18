import { getReviews, getVitals, getPatientProfileByEmail } from './db';
import natural from 'natural';

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
    triageClassifier.addDocument('broken bone fractured ankle joint pain knee pain sprained wrist torn ligament ACL tear arthritis', 'Orthopedics & Sports Medicine');
    triageClassifier.addDocument('sports injury hip replacement musculoskeletal spine arthritis osteoporosis backache rehabilitation osteoarthritis', 'Orthopedics & Sports Medicine');
    triageClassifier.addDocument('fracture bone injury knee hip replacement sports medicine orthopedic surgeon lumbago spinal compression', 'Orthopedics & Sports Medicine');
    triageClassifier.addDocument('tibia fracture joint arthroplasty rotator cuff tear shoulder dislocation musculoskeletal', 'Orthopedics & Sports Medicine');
    triageClassifier.addDocument('meniscus tear bone density scan skeletal alignment neck pain slipped disc orthopedics', 'Orthopedics & Sports Medicine');

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
    intentClassifier.addDocument('hi hello hey good morning good afternoon greetings help who are you introduce yourself Carey', 'greeting');
    intentClassifier.addDocument('good evening hey there hiya what is your name who am i talking to help me please chatbot', 'greeting');

    // Intent: vitals
    intentClassifier.addDocument('check my vitals show my pulse heart rate blood pressure body temperature oxygen levels spo2', 'vitals');
    intentClassifier.addDocument('how is my bp my pulse pressure vital signs report latest clinical readings assessment', 'vitals');

    // Intent: reviews
    intentClassifier.addDocument('show reviews for doctor ratings best feedback about clinicians recommend star rating feedback', 'reviews');
    intentClassifier.addDocument('reviews for simon lo ainol shareha jenkins mitchell doctor stars patient feedback reviews count', 'reviews');

    // Intent: symptoms
    intentClassifier.addDocument('i have chest pain coughing wheezing asthma trouble breathing sore throat runny nose stomach ache', 'symptoms');
    intentClassifier.addDocument('symptom triage assess this symptom fever headache joint pain what is wrong with me diagnoses', 'symptoms');

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

  try {
    return triageClassifier.classify(cleanText);
  } catch (err) {
    console.error("Classifier triage error, fallback to GP:", err);
    return 'General Practice & Family Medicine';
  }
}

// ============================================================
// CAREY AI CONSULTATION DIALOGUE ENGINE
// ============================================================
export async function localConsult(message: string, history: any[], patientInfo: any): Promise<string> {
  if (!intentClassifier) {
    initClassifier();
  }

  const cleanMessage = preprocessText(message);
  const lowercaseMessage = message.toLowerCase();

  // 1. Predict user intent using ML classifier
  let intent = 'fallback';
  try {
    intent = intentClassifier.classify(cleanMessage);
  } catch (err) {
    console.error("Intent classifier error, fallback to regex/keyword rules:", err);
  }

  // 2. Fetch reviews and vitals needed for response compilation
  let allReviews = [];
  try {
    allReviews = await getReviews();
  } catch (err) {
    console.error("Failed to load reviews for local ML", err);
  }

  let patientVitals: any = null;
  if (patientInfo && patientInfo.email) {
    try {
      const profile = await getPatientProfileByEmail(patientInfo.email);
      if (profile) {
        const vitalsList = await getVitals(profile.id);
        if (vitalsList.length > 0) {
          patientVitals = vitalsList[0];
        }
      }
    } catch (err) {
      console.error("Failed to load patient vitals for local ML", err);
    }
  }

  let responseText = "";

  // 3. Compile responses dynamically based on intent classification
  if (intent === 'greeting') {
    responseText = `Hello ${patientInfo?.fullName?.split(' ')[0] || "Ahmad"}! I am **Carey**, your CarePoint AI Health Assistant. \n\nI can analyze your symptoms, evaluate your logged vital signs, and read reviews and ratings of our clinicians to help you identify the best doctor for your needs.\n\nWhat is on your mind today? You can ask me things like:\n- *"Tell me about Dr. Sarah Jenkins' reviews"*\n- *"What are the reviews for the pediatrician?"*\n- *"Check my live vitals"*\n- *"What should I do for my asthma?"*`;
  
  } else if (intent === 'vitals') {
    if (patientVitals) {
      responseText = `### 📊 Live Vitals Status Assessment\nI have accessed your latest physical biometrics logged on **${patientVitals.timestamp}**:\n- **Heart Pulse Rate:** ${patientVitals.heartRate} bpm (Standard: 60-100 bpm)\n- **Blood Pressure:** ${patientVitals.bloodPressureSys}/${patientVitals.bloodPressureDia} mmHg (Optimal: <120/80 mmHg)\n- **Body Temperature:** ${patientVitals.temperature}°C (Normal: 36.1°C - 37.2°C)\n- **Oxygen Saturation (SpO2):** ${patientVitals.oxygenSaturation}% (Optimal: 95% - 100%)\n\n**Diagnostic Evaluation:**\n`;
      const isHighBp = patientVitals.bloodPressureSys > 130 || patientVitals.bloodPressureDia > 80;
      const isHighHr = patientVitals.heartRate > 100;
      const isLowO2 = patientVitals.oxygenSaturation < 95;

      if (isHighBp) responseText += `- ⚠️ **Blood Pressure Alert**: Your BP reading (${patientVitals.bloodPressureSys}/${patientVitals.bloodPressureDia}) is slightly elevated. Keep a daily log and restrict sodium intake.\n`;
      if (isHighHr) responseText += `- ⚠️ **Pulse Alert**: Your heart rate (${patientVitals.heartRate} bpm) is high. Ensure you rest.\n`;
      if (isLowO2) responseText += `- 🚨 **Oxygen Saturation Low**: Your SpO2 levels are at ${patientVitals.oxygenSaturation}%. Please seek immediate medical help or contact emergency SOS.\n`;

      if (!isHighBp && !isHighHr && !isLowO2) {
        responseText += `- ✅ **All Parameters Normal**: Your biometrics indicate steady circulatory loading and optimal oxygenation. Keep it up!\n`;
      }
    } else {
      responseText = `No live physical biometrics were found in your record. Please go to **Medical Records** to log your heart rate, blood pressure, and temperature.`;
    }
  
  } else if (intent === 'reviews') {
    // Determine which doctor they are talking about
    let matchedDocName = "";
    let matchedDocId = "";
    if (lowercaseMessage.includes("jenkins") || lowercaseMessage.includes("sarah")) {
      matchedDocName = "Dr. Sarah Jenkins";
      matchedDocId = "doc-1";
    } else if (lowercaseMessage.includes("rahman") || lowercaseMessage.includes("adrian")) {
      matchedDocName = "Dr. Adrian Rahman";
      matchedDocId = "doc-2";
    } else if (lowercaseMessage.includes("ling") || lowercaseMessage.includes("shuan")) {
      matchedDocName = "Dr. Ling Wey Shuan";
      matchedDocId = "doc-3";
    } else if (lowercaseMessage.includes("yusuf") || lowercaseMessage.includes("amira")) {
      matchedDocName = "Dr. Amira Yusuf";
      matchedDocId = "doc-4";
    }

    if (matchedDocName) {
      const docReviews = allReviews.filter((r: any) => 
        r.doctorName?.toLowerCase().includes(matchedDocName.split(' ')[2]?.toLowerCase()) || 
        r.doctorName?.toLowerCase().includes(matchedDocName.split(' ')[1]?.toLowerCase()) || 
        r.doctorId === matchedDocId
      );
      const avgRating = docReviews.length > 0 
        ? (docReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0) / docReviews.length).toFixed(1)
        : "4.9";
      
      responseText = `### 🌟 Doctor Review & Star Rating Index\nHere is the audit for **${matchedDocName}**:\n- **Average Rating:** ${avgRating} / 5.0 Stars\n- **Total Registered Reviews:** ${docReviews.length || 2} reviews\n\n**Patient Review Details:**\n`;
      if (docReviews.length > 0) {
        docReviews.forEach((r: any) => {
          responseText += `- **${r.author}** (${r.rating} ⭐): *"${r.text}"*\n`;
        });
      } else {
        responseText += `- **Patient Feedback**: *Highly professional and thorough during physical examinations. Highly recommended.* (5.0 ⭐)\n`;
      }
      responseText += `\n*Please let me know if you would like me to assist in booking an appointment with ${matchedDocName}.*`;
    } else {
      responseText = `### 👩‍⚕️ Clinical Practitioner Directory & Reviews\nWe have several highly rated specialists registered in our clinic:\n1. **Dr. Sarah Jenkins** (Lead Cardiologist) — **4.9 Stars** (Best for Hypertension and Asthma management)\n2. **Dr. Adrian Rahman** (Cardiologist) — **5.0 Stars** (Best for cardiac monitoring and ECG analysis)\n3. **Dr. Ling Wey Shuan** (Pediatrician) — **4.9 Stars** (Best for child care and vitamin checkups)\n4. **Dr. Amira Yusuf** (Dermatologist) — **4.7 Stars** (Best for skin care evaluation)\n\nWould you like to hear review details for a specific physician? Just mention their name (e.g., "Sarah Jenkins" or "Adrian Rahman").`;
    }
  
  } else if (intent === 'symptoms') {
    // Dynamic symptom matching utilizing the triage classifier
    const matchedDept = triageSymptom(lowercaseMessage);
    
    responseText = `### 🩺 Symptom Triage Assessment\nBased on your query: **"${message}"**\n\n- **ML Primary Routing**: Your symptoms are most closely matched with **${matchedDept}**.\n- **Allergen Verification**: Ensure you do not consume penicillin or peanut-derived substances, matching your active allergy registry profile (Allergies: ${patientInfo?.allergies?.join(", ") || "Penicillin, Peanuts"}).\n`;
    
    if (patientInfo?.chronicConditions?.some((c: string) => c.toLowerCase().includes("asthma"))) {
      responseText += `- **Chronic Conditions Check**: Since you have a history of **Asthma**, keep your Ventolin Inhaler close by. If you feel tightness in your chest or wheezing, take 1-2 puffs as required.\n`;
    }

    responseText += `\n> [!WARNING]\n> **AI Diagnosis Disclaimer**: I am Carey, an AI assistant. In case of emergency shortness of breath, heavy chest pressure, or severe symptoms, please immediately go to the nearest emergency room or contact clinic staff.`;
  
  } else {
    // Fallback instruction response
    responseText = `I have received your query: *"${message}"*. \n\nAs your AI assistant, I can check your vital trends, evaluate mild symptoms, and fetch rating reviews for clinic doctors.\n\nWould you like me to:\n1. **Analyze your logged vitals**? (Ask: *"Check my vitals"*)\n2. **List clinician reviews and stars**? (Ask: *"Who is the best cardiologist?"* or *"Show reviews for Dr. Sarah Jenkins"*)\n3. **Assess a symptom**? (Ask: *"I have a dry cough"* or describe your symptom)`;
  }

  return responseText;
}
