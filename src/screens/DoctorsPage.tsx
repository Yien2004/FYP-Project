import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Heart,
  Activity,
  Baby,
  Brain,
  Bone,
  Microscope,
  FlaskConical,
  Stethoscope,
  Building2,
  Star,
  Calendar,
  ChevronRight,
  Scissors,
  AlertTriangle,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Inline CheckCircle helper (same pattern as HospitalsPage)
// ─────────────────────────────────────────────
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface Doctor {
  name: string;
  avatar: string;
  title: string;
  specialty: string;
  hospital: string;
  experience: string;
  rating: number;
  reviews: number;
  availability: string;
  bio: string;
}

export interface Specialty {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  iconColor: string;
  desc: string;
  overview: string;
  conditions: string[];
  doctors: Doctor[];
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
export const specialties: Specialty[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    iconColor: 'text-rose-600',
    desc: 'Heart & cardiovascular care',
    overview:
      'Comprehensive diagnosis and treatment of heart and cardiovascular conditions including ECG, echocardiography, coronary angiography, angioplasty, and pacemaker procedures.',
    conditions: [
      'Coronary Artery Disease',
      'Heart Failure',
      'Arrhythmia & AF',
      'Hypertension',
      'Valvular Heart Disease',
      'Ischemic Heart Disease',
      'Post-MI Rehabilitation',
    ],
    doctors: [
      {
        name: 'Dr. Ainol Shareha Binti Sahar',
        avatar: 'AS',
        title: 'Consultant Cardiologist',
        specialty: 'Ischemic Cardiovascular Conditions',
        hospital: 'Pantai Hospital Penang',
        experience: '12 years',
        rating: 4.9,
        reviews: 203,
        availability: 'Mon, Wed, Fri — 9:00 AM to 4:00 PM',
        bio: 'Expert in managing critical ischemic cardiovascular conditions, coronary interventions, and hypertension. Dr. Ainol Shareha is renowned for her calm diagnostic precision in high-pressure cardiac emergencies at Pantai Hospital.',
      },
      {
        name: 'Dr. Simon Lo',
        avatar: 'SL',
        title: 'Interventional Cardiologist',
        specialty: 'Coronary Angioplasty & Pacemakers',
        hospital: 'Gleneagles Hospital Penang',
        experience: '16 years',
        rating: 4.9,
        reviews: 289,
        availability: 'Tue, Thu — 10:00 AM to 3:00 PM',
        bio: 'Renowned cardiologist specializing in coronary angioplasty, stent placements, and pacemaker installations. Dr. Simon Lo has performed over 3,000 interventional procedures and leads Gleneagles cardiac catheterization lab.',
      },
      {
        name: 'Dr. Tan Seng Hock',
        avatar: 'TH',
        title: 'Senior Consultant Cardiologist',
        specialty: 'Heart Valve Disease & Arrhythmias',
        hospital: 'Island Hospital',
        experience: '15 years',
        rating: 4.9,
        reviews: 142,
        availability: 'Mon, Tue, Thu — 9:00 AM to 4:00 PM',
        bio: 'Expert in valvular heart disease and cardiac rhythm management. Dr. Tan Seng Hock is known for his patient-centered care and diagnostic diligence at Island Hospital.',
      },
      {
        name: 'Dr. Lim Boon Yee',
        avatar: 'LY',
        title: 'Consultant Cardiologist',
        specialty: 'Heart Failure & Electro-physiology',
        hospital: 'Hospital Pulau Pinang',
        experience: '14 years',
        rating: 4.8,
        reviews: 125,
        availability: 'Mon, Wed — 9:00 AM to 4:00 PM',
        bio: 'Dedicated public sector cardiologist managing complex heart failure cases and pacemaker checkups at Penang General Hospital.',
      },
      {
        name: 'Dr. Ramesh Kumar',
        avatar: 'RK',
        title: 'Cardiologist',
        specialty: 'Hypertensive Heart & Preventive Care',
        hospital: 'Hospital Seberang Jaya',
        experience: '11 years',
        rating: 4.7,
        reviews: 94,
        availability: 'Tue, Thu — 8:30 AM to 4:30 PM',
        bio: 'Expert in preventive cardiology and hypertension management serving patients in the mainland Seberang Perai region.',
      },
    ],
  },
  {
    id: 'internal-medicine',
    name: 'Internal Medicine & Infectious Diseases',
    icon: FlaskConical,
    color: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    iconColor: 'text-teal-600',
    desc: 'Complex metabolic & infectious conditions',
    overview:
      'Specialist care for multi-system and infectious diseases, managing complex metabolic disorders, viral epidemics, and critical primary triage across Penang General Hospital.',
    conditions: [
      'Metabolic Syndrome',
      'Type 2 Diabetes Complications',
      'Dengue & Viral Fevers',
      'Tuberculosis Management',
      'HIV/AIDS Care',
      'Sepsis & Critical Infections',
      'Epidemiological Tracing',
    ],
    doctors: [
      {
        name: 'Dr. Azmi Bin Osman',
        avatar: 'AO',
        title: 'Senior Consultant — Internal Medicine',
        specialty: 'Complex Metabolic Diseases',
        hospital: 'Hospital Pulau Pinang',
        experience: '18 years',
        rating: 4.9,
        reviews: 312,
        availability: 'Mon–Fri — 9:00 AM to 4:00 PM',
        bio: 'Senior Consultant managing complex metabolic diseases and critical primary triage pathways at Penang General Hospital. Dr. Azmi is widely respected for his evidence-based approach to managing high-risk multi-system patients.',
      },
      {
        name: 'Dr. Chow Ting Soo',
        avatar: 'CT',
        title: 'Infectious Diseases Specialist',
        specialty: 'Epidemiology & Viral Containment',
        hospital: 'Hospital Pulau Pinang',
        experience: '14 years',
        rating: 4.8,
        reviews: 178,
        availability: 'Mon, Wed, Fri — 8:00 AM to 1:00 PM',
        bio: 'Highly respected clinical researcher specializing in epidemiological tracing and viral contagion containment. Dr. Chow Ting Soo has led several state-wide public health interventions for dengue, COVID-19, and emerging respiratory outbreaks.',
      },
      {
        name: 'Dr. Nur Farah Hana',
        avatar: 'FH',
        title: 'Internal Medicine Specialist',
        specialty: 'Endocrinology & Acute Fevers',
        hospital: 'Hospital Seberang Jaya',
        experience: '10 years',
        rating: 4.8,
        reviews: 115,
        availability: 'Mon, Wed, Fri — 9:00 AM to 4:00 PM',
        bio: 'Dedicated internist focused on acute tropical disease triage, metabolic syndrome tracking, and diabetes complications.',
      },
      {
        name: 'Dr. Alan Wong',
        avatar: 'AW',
        title: 'Consultant Physician',
        specialty: 'Infectious Diseases & Travel Health',
        hospital: 'Pantai Hospital Penang',
        experience: '13 years',
        rating: 4.9,
        reviews: 136,
        availability: 'Tue, Thu — 9:00 AM to 3:00 PM',
        bio: 'Private consultant managing complex clinical infections, travel medicine reviews, and chronic system inflammations.',
      },
    ],
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    icon: Baby,
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    iconColor: 'text-sky-650',
    desc: 'Child & newborn healthcare',
    overview:
      'Complete healthcare for infants, children, and adolescents — neonatal care, developmental assessments, vaccinations, childhood illness management, and pediatric emergency care.',
    conditions: [
      'Neonatal Jaundice',
      'Childhood Asthma & Allergies',
      'Growth & Developmental Delay',
      'Febrile Seizures',
      'Childhood Infections',
      'Infantile Colic',
      'Pediatric Nutrition',
    ],
    doctors: [
      {
        name: 'Dr. Siti Aminah',
        avatar: 'SA',
        title: 'Senior Paediatrician',
        specialty: 'Neonatology & Paediatric Emergencies',
        hospital: 'Hospital Seberang Jaya',
        experience: '15 years',
        rating: 4.9,
        reviews: 284,
        availability: 'Mon–Fri — 8:00 AM to 4:30 PM',
        bio: 'Dedicated to neonatal health, youth developmental assessments, and urgent pediatric emergencies. Dr. Siti Aminah has led Seberang Jaya Hospital neonatology unit for over a decade, improving survival rates for premature infants in the Seberang Perai region.',
      },
      {
        name: 'Dr. Priscilla Ooi Sze Kee',
        avatar: 'PO',
        title: 'Paediatrician',
        specialty: 'Infantile Allergies & Paediatric Nutrition',
        hospital: 'Island Hospital',
        experience: '10 years',
        rating: 4.8,
        reviews: 196,
        availability: 'Mon, Wed, Fri — 9:00 AM to 2:00 PM',
        bio: 'Renowned childhood practitioner focused on infantile allergies, asthma management, and general pediatric nutrition. Dr. Priscilla Ooi is known for her gentle bedside manner and ability to put anxious parents at ease during complex diagnoses.',
      },
      {
        name: 'Dr. Wong Lai Kuan',
        avatar: 'WK',
        title: 'Consultant Pediatrician',
        specialty: 'Child Development & Immunisation',
        hospital: 'Hospital Pulau Pinang',
        experience: '12 years',
        rating: 4.8,
        reviews: 98,
        availability: 'Wed, Fri — 9:00 AM to 1:00 PM',
        bio: 'Specializes in early childhood developmental health and allergy management at Penang General Hospital.',
      },
      {
        name: 'Dr. Chew Wei Lik',
        avatar: 'CW',
        title: 'Paediatric Specialist',
        specialty: 'Asthma & Respiratory Triage',
        hospital: 'Hospital Pulau Pinang',
        experience: '11 years',
        rating: 4.7,
        reviews: 87,
        availability: 'Mon, Tue, Thu — 8:30 AM to 4:30 PM',
        bio: 'Focuses on pediatric respiratory constraints, chronic childhood asthma management, and childhood infection protocols.',
      },
      {
        name: 'Dr. Melissa Lim',
        avatar: 'ML',
        title: 'Consultant Paediatrician',
        specialty: 'Neonatal Intensive Care & Development',
        hospital: 'Gleneagles Hospital Penang',
        experience: '14 years',
        rating: 4.9,
        reviews: 154,
        availability: 'Tue, Thu — 9:00 AM to 4:00 PM',
        bio: 'Expert in neonatal intensive care (NICU) monitoring, newborn developmental checking, and parent counseling.',
      },
    ],
  },
  {
    id: 'general-surgery',
    name: 'General Surgery',
    icon: Scissors,
    color: 'from-slate-600 to-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconColor: 'text-slate-600',
    desc: 'Surgical & operative care',
    overview:
      'Open and minimally-invasive surgery for abdominal, thoracic, and laparoscopic procedures. Covering emergency trauma, elective surgery, and post-operative care across both public and private Penang hospitals.',
    conditions: [
      'Acute Abdomen & Appendicitis',
      'Hernia Repair',
      'Gallbladder Disease (Cholecystectomy)',
      'Colorectal Surgery',
      'Trauma & Emergency Surgery',
      'Laparoscopic Procedures',
      'Post-Surgical Wound Care',
    ],
    doctors: [
      {
        name: 'Dr. Mohd Fakhrulsani',
        avatar: 'MF',
        title: 'General Surgeon',
        specialty: 'Emergency Surgery & Trauma',
        hospital: 'Hospital Seberang Jaya',
        experience: '13 years',
        rating: 4.8,
        reviews: 167,
        availability: 'Mon–Fri — 8:00 AM to 3:00 PM',
        bio: 'Focuses on acute abdominal traumas, emergency laparotomies, and low-income clinic operations. Dr. Mohd Fakhrulsani is one of Seberang Jaya Hospital most active surgeons, handling a high volume of emergency and elective abdominal cases.',
      },
      {
        name: 'Dr. Tan Chee Khuan',
        avatar: 'TK',
        title: 'General & Laparoscopic Surgeon',
        specialty: 'Minimally Invasive Surgery',
        hospital: 'Hospital Lam Wah Ee',
        experience: '17 years',
        rating: 4.9,
        reviews: 241,
        availability: 'Tue, Thu — 9:00 AM to 2:00 PM',
        bio: 'Accomplished surgeon specializing in modern, minimally invasive laparoscopic internal organ operations. Dr. Tan Chee Khuan is a pioneer in single-incision laparoscopic techniques in Penang, drastically reducing patient recovery time.',
      },
      {
        name: 'Dr. Raymond Chew',
        avatar: 'RC',
        title: 'Consultant General Surgeon',
        specialty: 'Laparoscopic & Hernia Surgery',
        hospital: 'Gleneagles Hospital Penang',
        experience: '13 years',
        rating: 4.9,
        reviews: 95,
        availability: 'Mon, Wed — 9:00 AM to 4:00 PM',
        bio: 'A veteran surgeon focusing on minimally invasive gastrointestinal operations and hernia repairs with standard robotic-assisted procedures.',
      },
      {
        name: 'Dr. Hanafiah Harun',
        avatar: 'HH',
        title: 'Senior Surgeon',
        specialty: 'Trauma & Hepatobiliary Surgery',
        hospital: 'Hospital Pulau Pinang',
        experience: '19 years',
        rating: 4.8,
        reviews: 182,
        availability: 'Mon, Wed, Fri — 9:00 AM to 4:00 PM',
        bio: 'Senior public sector trauma surgeon leading the emergency surgical team at Penang General Hospital.',
      },
      {
        name: 'Dr. Ong Keat Jin',
        avatar: 'OJ',
        title: 'Consultant General Surgeon',
        specialty: 'Colorectal Surgery & Endoscopy',
        hospital: 'Pantai Hospital Penang',
        experience: '15 years',
        rating: 4.9,
        reviews: 121,
        availability: 'Tue, Thu — 9:00 AM to 3:00 PM',
        bio: 'Specialist in colorectal cancer screenings, laparoscopic bowel operations, and complex hernia reconstructions.',
      },
    ],
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics & Sports Medicine',
    icon: Bone,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconColor: 'text-amber-600',
    desc: 'Bones, joints & sports injuries',
    overview:
      'Surgical and non-surgical treatment for musculoskeletal conditions — joint replacements, fracture fixation, arthroscopic surgery, and sports injury rehabilitation.',
    conditions: [
      'Knee & Hip Replacement',
      'Fractures & Bone Injuries',
      'ACL/Ligament Tears',
      'Spinal Disorders',
      'Osteoarthritis',
      'Tendon Injuries',
      'Sports Injury Rehabilitation',
    ],
    doctors: [
      {
        name: 'Mr. Boon Huck Wee',
        avatar: 'BH',
        title: 'Consultant Orthopedic Surgeon',
        specialty: 'Joint Replacement & Sports Injuries',
        hospital: 'Pantai Hospital Penang',
        experience: '19 years',
        rating: 4.9,
        reviews: 318,
        availability: 'Mon, Wed, Fri — 8:00 AM to 1:00 PM',
        bio: 'Specialist surgeon focusing on bone fractures, joint replacements, and high-impact sports injury restorations. Mr. Boon Huck Wee has performed over 2,500 joint replacement surgeries and is one of Penang most sought-after orthopedic consultants in private practice.',
      },
      {
        name: 'Dr. Susan Lim',
        avatar: 'SL',
        title: 'Orthopedic & Joint Reconstruction Surgeon',
        specialty: 'Knee & Hip Reconstruction',
        hospital: 'Hospital Pulau Pinang',
        experience: '11 years',
        rating: 4.8,
        reviews: 88,
        availability: 'Mon, Wed, Fri — 10:00 AM to 4:00 PM',
        bio: 'Specializes in reconstructive orthopedic surgeries, knee arthroscopies, and trauma fracture fixations at Penang General Hospital.',
      },
      {
        name: 'Dr. Zulkarnean',
        avatar: 'ZK',
        title: 'Consultant Orthopaedic Surgeon',
        specialty: 'Trauma & Fracture Fixation',
        hospital: 'Hospital Seberang Jaya',
        experience: '14 years',
        rating: 4.7,
        reviews: 105,
        availability: 'Tue, Thu — 9:00 AM to 5:00 PM',
        bio: 'Active public orthopedic specialist handling high-volume sports injuries, motor trauma reconstructions, and joint arthritis.',
      },
      {
        name: 'Dr. Terence Oak',
        avatar: 'TO',
        title: 'Sports Medicine Specialist',
        specialty: 'Arthroscopy & Ligament Reconstruction',
        hospital: 'Island Hospital',
        experience: '12 years',
        rating: 4.9,
        reviews: 147,
        availability: 'Wed, Fri — 9:00 AM to 4:00 PM',
        bio: 'Specializes in arthroscopic ACL repairs, rotator cuff surgeries, and high-performance athletic rehabilitation programs.',
      },
    ],
  },
  {
    id: 'neurology',
    name: 'Neurology',
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    iconColor: 'text-violet-650',
    desc: 'Brain & nervous system disorders',
    overview:
      'Diagnosis and treatment of neurological conditions including stroke, epilepsy, migraine, Parkinson disease, and peripheral neuropathies using EEG, MRI, and nerve conduction studies.',
    conditions: [
      'Stroke & TIA',
      'Epilepsy & Seizures',
      'Migraine & Chronic Headache',
      'Parkinson Disease',
      'Multiple Sclerosis',
      'Peripheral Neuropathy',
      'Neuromuscular Abnormalities',
    ],
    doctors: [
      {
        name: 'Dr. Sim Bee Fung',
        avatar: 'SF',
        title: 'Consultant Neurologist',
        specialty: 'Stroke Recovery & Neuromuscular Disorders',
        hospital: 'Gleneagles Hospital Penang',
        experience: '14 years',
        rating: 4.9,
        reviews: 227,
        availability: 'Mon, Tue, Thu — 9:00 AM to 3:00 PM',
        bio: 'Expert clinician managing degenerative stroke recovery loops, neuromuscular abnormalities, and chronic migraines. Dr. Sim Bee Fung leads the neurology department at Gleneagles and has pioneered several rehabilitation protocols for post-stroke patients in Penang.',
      },
      {
        name: 'Dr. Lee Hock Heng',
        avatar: 'LH',
        title: 'Consultant Neurologist',
        specialty: 'Stroke & Epilepsy Management',
        hospital: 'Hospital Seberang Jaya',
        experience: '14 years',
        rating: 4.9,
        reviews: 112,
        availability: 'Tue, Thu — 9:00 AM to 4:30 PM',
        bio: 'An experienced public neurologist specializing in epilepsy monitoring, neuro-triage, and acute stroke intervention protocols.',
      },
      {
        name: 'Dr. Faridah Kamal',
        avatar: 'FK',
        title: 'Senior Neurologist',
        specialty: 'Parkinson & Degenerative Disorders',
        hospital: 'Hospital Pulau Pinang',
        experience: '17 years',
        rating: 4.8,
        reviews: 136,
        availability: 'Mon, Wed — 8:30 AM to 4:00 PM',
        bio: 'Expert public consultant managing movement disorders, Parkinson therapy regimes, and chronic migraine checks.',
      },
      {
        name: 'Dr. Tan Kay Seng',
        avatar: 'KS',
        title: 'Consultant Neurologist',
        specialty: 'Neuromuscular & Sleep Diagnostics',
        hospital: 'Hospital Lam Wah Ee',
        experience: '15 years',
        rating: 4.8,
        reviews: 94,
        availability: 'Tue, Thu — 9:00 AM to 3:00 PM',
        bio: 'Specialist in nerve conduction studies, electromyography, and sleep apnea related neurological profiles.',
      },
    ],
  },
  {
    id: 'gastro-urology',
    name: 'Gastroenterology & Urology',
    icon: Microscope,
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconColor: 'text-emerald-650',
    desc: 'Digestive system & urinary tract',
    overview:
      'Advanced endoscopic procedures and management of gastrointestinal, liver, and urological conditions — from irritable bowel syndrome and liver pathologies to complex renal stone extraction.',
    conditions: [
      'Irritable Bowel Syndrome',
      'Liver Disease & Cirrhosis',
      'GERD & Peptic Ulcers',
      'Colonoscopy & Polypectomy',
      'Kidney Stones (Renal Calculi)',
      'Urinary Tract Infections',
      'Bladder & Prostate Issues',
    ],
    doctors: [
      {
        name: 'Dr. Mohamad Fadli Bin Abd Rahman',
        avatar: 'MD',
        title: 'Gastroenterologist & Hepatologist',
        specialty: 'GI Endoscopy & Liver Pathologies',
        hospital: 'Island Hospital',
        experience: '12 years',
        rating: 4.8,
        reviews: 189,
        availability: 'Mon, Wed, Fri — 9:00 AM to 4:00 PM',
        bio: 'Specializes in advanced gastrointestinal endoscopic procedures, liver pathologies, and irritable bowel management. Dr. Mohamad Fadli is accredited for ERCP and advanced endoscopic ultrasound procedures, making him one of Penang leading GI specialists.',
      },
      {
        name: 'Dr. Ng Cheok Man',
        avatar: 'NM',
        title: 'Urology Consultant',
        specialty: 'Renal Stone Extraction & Urology',
        hospital: 'Hospital Lam Wah Ee',
        experience: '16 years',
        rating: 4.8,
        reviews: 208,
        availability: 'Tue, Thu — 8:00 AM to 1:00 PM',
        bio: 'Senior practitioner dealing with advanced renal calculous extractions and complex urinary tract health. Dr. Ng Cheok Man specialises in ureteroscopy, percutaneous nephrolithotomy, and laparoscopic urology, with an impressive clinical track record at Lam Wah Ee.',
      },
      {
        name: 'Dr. Rosli Md Ali',
        avatar: 'RM',
        title: 'Consultant Urologist',
        specialty: 'Renal Calculi & Prostate Health',
        hospital: 'Hospital Pulau Pinang',
        experience: '18 years',
        rating: 4.8,
        reviews: 154,
        availability: 'Mon, Wed — 9:00 AM to 4:30 PM',
        bio: 'Senior urologist managing kidney stone extractions, prostate checks, and urological surgeries at Penang General Hospital.',
      },
      {
        name: 'Dr. Jeffrey Tan',
        avatar: 'JT',
        title: 'Gastroenterology Consultant',
        specialty: 'GERD & Colorectal Screening',
        hospital: 'Pantai Hospital Penang',
        experience: '13 years',
        rating: 4.9,
        reviews: 112,
        availability: 'Tue, Thu — 9:00 AM to 4:00 PM',
        bio: 'Specialist in digestive health, colonoscopies, acid reflux treatments, and chronic liver care.',
      },
    ],
  },
  {
    id: 'gp-family',
    name: 'General Practice & Family Medicine',
    icon: Stethoscope,
    color: 'from-sky-400 to-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    iconColor: 'text-sky-600',
    desc: 'Primary care & outpatient services',
    overview:
      'Comprehensive primary care for all ages — acute illness management, chronic disease follow-up, occupational health, maternal health, family planning, and preventive screenings at government clinics and private practices.',
    conditions: [
      'Fever & Viral Infections',
      'Hypertension & Diabetes',
      'Maternal & Child Health',
      'Occupational Health Screening',
      'Acute & Chronic Wound Care',
      'Family Planning',
      'Health Certification',
    ],
    doctors: [
      {
        name: 'Dr. K. Loganathan',
        avatar: 'KL',
        title: 'General Practitioner',
        specialty: 'Community Wellness & Outpatient Diagnostics',
        hospital: 'Klinik Kesihatan Jalan Perak',
        experience: '14 years',
        rating: 4.8,
        reviews: 267,
        availability: 'Mon–Fri — 8:00 AM to 5:00 PM',
        bio: 'Experienced public health coordinator handling everyday community wellness diagnostics and outpatient sorting. Dr. Loganathan is a pillar of the Georgetown community, providing affordable primary care to thousands of patients annually.',
      },
      {
        name: 'Dr. Noraini Ahmad',
        avatar: 'NA',
        title: 'Maternal & Child Health Specialist',
        specialty: 'Prenatal Care & Child Vaccination',
        hospital: 'Klinik Kesihatan Jalan Perak',
        experience: '11 years',
        rating: 4.9,
        reviews: 341,
        availability: 'Mon–Fri — 8:00 AM to 5:00 PM',
        bio: 'Dedicated to prenatal checkups, family planning counseling, and early child vaccination schedules. Dr. Noraini Ahmad is one of the most requested practitioners at KK Jalan Perak for her warm, patient-centered approach to maternal health.',
      },
      {
        name: 'Dr. Farah Alwani',
        avatar: 'FA',
        title: 'General Practitioner',
        specialty: 'Community & Childhood Health',
        hospital: 'Poliklinik Perdana',
        experience: '6 years',
        rating: 4.7,
        reviews: 132,
        availability: 'Mon–Fri — 8:00 AM to 5:30 PM',
        bio: 'Community doctor focused on childhood fevers, wellness counseling, and early physical health checkups. Dr. Farah Alwani is passionate about preventive care and patient education for young families in the Penang community.',
      },
      {
        name: 'Dr. Tan Aik Kah',
        avatar: 'AK',
        title: 'Medical Officer',
        specialty: 'Outpatient Triage & Primary Care',
        hospital: 'Hospital Pulau Pinang',
        experience: '10 years',
        rating: 4.8,
        reviews: 142,
        availability: 'Mon–Fri — 8:00 AM to 5:00 PM',
        bio: 'Manages outpatient triage, fever sorting, and routine health screenings at Penang General Hospital.',
      },
      {
        name: 'Dr. Nor Aziah',
        avatar: 'NA',
        title: 'Primary Care Doctor',
        specialty: 'Family Health & Triage',
        hospital: 'Hospital Seberang Jaya',
        experience: '9 years',
        rating: 4.7,
        reviews: 121,
        availability: 'Mon–Fri — 8:00 AM to 5:00 PM',
        bio: 'Coordinates primary care reviews, acute fever triage, and generic prescription extensions at Seberang Jaya Hospital.',
      },
      {
        name: 'Dr. Mohd Razali',
        avatar: 'MR',
        title: 'Medical Officer',
        specialty: 'Outpatient Medical Care & Triage',
        hospital: 'Hospital Bukit Mertajam',
        experience: '9 years',
        rating: 4.7,
        reviews: 154,
        availability: 'Mon–Fri — 8:00 AM to 5:00 PM',
        bio: 'Handles daily family medicine clinics, acute care management, and health screenings at Hospital Bukit Mertajam.',
      },
      {
        name: 'Dr. Nurul Huda',
        avatar: 'NH',
        title: 'Family Medicine Specialist',
        specialty: 'Diabetes & Non-Communicable Diseases',
        hospital: 'Klinik Kesihatan Bayan Baru',
        experience: '10 years',
        rating: 4.8,
        reviews: 312,
        availability: 'Mon–Fri — 8:00 AM to 5:00 PM',
        bio: 'Manages long-term chronic illness interventions, emphasizing public diabetes control programs. Dr. Nurul Huda regularly conducts community health talks on diabetes prevention and is a key figure in Penang MOH wellness programs.',
      },
      {
        name: 'Dr. Tan Wei Shen',
        avatar: 'TW',
        title: 'General Practitioner',
        specialty: 'Occupational & Acute Care',
        hospital: 'Klinik Kesihatan Bayan Baru',
        experience: '8 years',
        rating: 4.7,
        reviews: 189,
        availability: 'Mon–Fri — 8:00 AM to 5:00 PM',
        bio: 'Handles occupational injury triage and common acute illness screenings for local industrial zone employees. Dr. Tan Wei Shen is known for his efficient, no-frills approach to acute care and his commitment to underserved communities.',
      },
      {
        name: 'Dr. Lee Shen Rong',
        avatar: 'LS',
        title: 'General Practitioner',
        specialty: 'Family Medicine & Prescriptions',
        hospital: 'Klinik Singapore',
        experience: '9 years',
        rating: 4.7,
        reviews: 201,
        availability: 'Mon–Sat — 8:00 AM to 6:00 PM',
        bio: 'A trusted community family physician handling urgent medical checkups and long-term generic prescriptions. Dr. Lee Shen Rong runs an efficient outpatient clinic and maintains strong continuity of care for long-standing patients.',
      },
      {
        name: 'Dr. Jane Lim',
        avatar: 'JL',
        title: 'General Practitioner',
        specialty: 'Adolescent Health & Minor Procedures',
        hospital: 'Klinik Singapore',
        experience: '7 years',
        rating: 4.7,
        reviews: 154,
        availability: 'Mon–Sat — 8:00 AM to 6:00 PM',
        bio: 'Handles adolescent physical checkups, standard seasonal influenza symptoms, and minor wound suturing. Dr. Jane Lim is particularly popular among younger patients for her approachable communication style.',
      },
      {
        name: 'Dr. Sarah Lim',
        avatar: 'SR',
        title: 'General Medicine & Dermatologist',
        specialty: 'Skin Disorders & General Wellness',
        hospital: 'O2 Klinik',
        experience: '9 years',
        rating: 4.8,
        reviews: 217,
        availability: 'Mon–Sat — 8:30 AM to 9:00 PM',
        bio: 'Primary care practitioner managing skin disorders, chronic eczema outbreaks, and youth wellness. Dr. Sarah Lim bridges general medicine and dermatology, offering combined consultations that save patients multiple referrals.',
      },
      {
        name: 'Dr. Benjamin Koay',
        avatar: 'BK',
        title: 'General Practitioner',
        specialty: 'Preventive Health & Elderly Care',
        hospital: 'O2 Klinik',
        experience: '11 years',
        rating: 4.8,
        reviews: 198,
        availability: 'Mon–Sat — 8:30 AM to 9:00 PM',
        bio: 'Focuses on preventative health assessments, diagnostic blood panels, and elderly home health support. Dr. Benjamin Koay is a strong advocate of proactive wellness screening and early disease interception in the ageing Penang population.',
      },
      {
        name: 'Dr. Michael Tan',
        avatar: 'MT',
        title: 'Occupational Health & GP',
        specialty: 'Corporate Medicals & Industrial Health',
        hospital: 'Poliklinik Perdana',
        experience: '13 years',
        rating: 4.8,
        reviews: 176,
        availability: 'Mon–Fri — 8:00 AM to 5:30 PM',
        bio: 'Performs corporate medical screenings, industrial health clearance reviews, and sudden onset acute care. Dr. Michael Tan works closely with Penang industrial zone employers to maintain workforce health standards and safety compliance.',
      },
    ],
  },
  {
    id: 'emergency',
    name: 'Emergency Medicine',
    icon: AlertTriangle,
    color: 'from-red-500 to-rose-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    iconColor: 'text-red-650',
    desc: 'Critical care & trauma triage',
    overview:
      'Immediate medical evaluation, resuscitation, and life support preparation for acute illnesses and traumatic injuries ahead of hospital self-arrival.',
    conditions: [
      'Severe Bleeding & Trauma',
      'Unconsciousness & Fainting',
      'Cardiac Arrest & Chest Pain',
      'Poisoning & Overdose',
      'Respiratory Failure',
      'Stroke & Sudden Weakness',
      'Critical Accidents',
    ],
    doctors: [
      {
        name: 'Dr. Marcus Vance',
        avatar: 'MV',
        title: 'Emergency Medicine Specialist',
        specialty: 'Emergency Medicine & Trauma Care',
        hospital: 'Hospital Pulau Penang',
        experience: '11 years',
        rating: 4.9,
        reviews: 184,
        availability: '24/7 Shift Rotation — Call Hospital',
        bio: 'Senior emergency physician specializing in trauma resuscitation, advanced life support, and disaster medicine. Coordinates primary trauma responses at Penang General Hospital.',
      },
      {
        name: 'Dr. Sarah Mitchell',
        avatar: 'SM',
        title: 'Consultant Trauma & Emergency',
        specialty: 'Emergency & Critical Triage',
        hospital: 'Hospital Seberang Jaya',
        experience: '13 years',
        rating: 4.9,
        reviews: 142,
        availability: '24/7 Shift Rotation — Call Hospital',
        bio: 'Expert in critical care triage, toxicological emergencies, and cardiac resuscitation. Leads the mainland emergency preparedness training protocols.',
      },
      {
        name: 'Dr. Kelvin Tan',
        avatar: 'KT',
        title: 'Emergency Physician',
        specialty: 'Emergency & Resuscitation Care',
        hospital: 'Pantai Hospital Penang',
        experience: '9 years',
        rating: 4.8,
        reviews: 96,
        availability: '24/7 Shift Rotation — Call Hospital',
        bio: 'Specialized in acute medical emergencies, pediatric resuscitation, and trauma stabilization. Experienced in private hospital emergency room workflow.',
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface DoctorsPageProps {
  onNavigateLogin: () => void;
  onNavigateBack: () => void;
  onNavigateHospitals: (params?: string) => void;
}

// ─────────────────────────────────────────────
// View types
// ─────────────────────────────────────────────
type View = 'list' | 'detail' | 'profile';

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function DoctorsPage({
  onNavigateLogin,
  onNavigateBack,
  onNavigateHospitals,
}: DoctorsPageProps) {
  const [hospitalFilter, setHospitalFilter] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('hospital');
  });
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const specId = params.get('specialty');
    if (specId) {
      return specialties.find((s) => s.id === specId) || null;
    }
    return null;
  });
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [search, setSearch] = useState('');

  const [view, setView] = useState<View>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('specialty')) return 'detail';
    return 'list';
  });

  const doctorsAtHospital = useMemo(() => {
    if (!hospitalFilter) return [];
    const list: { doctor: Doctor; specialty: Specialty }[] = [];
    specialties.forEach((sp) => {
      sp.doctors.forEach((doc) => {
        if (doc.hospital.toLowerCase() === hospitalFilter.toLowerCase()) {
          list.push({ doctor: doc, specialty: sp });
        }
      });
    });
    return list;
  }, [hospitalFilter]);

  // ── filtered specialties ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return specialties;
    return specialties.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.doctors.some((d) => d.name.toLowerCase().includes(q))
    );
  }, [search]);

  const openSpecialty = (sp: Specialty) => {
    setSelectedSpecialty(sp);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDoctor = (doc: Doctor) => {
    const sp = specialties.find((s) => s.doctors.some((d) => d.name === doc.name)) || specialties[0];
    setSelectedSpecialty(sp);
    setSelectedDoctor(doc);
    setView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToList = () => {
    setView('list');
    setSelectedSpecialty(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToDetail = () => {
    setView('detail');
    setSelectedDoctor(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── render ──
  if (view === 'profile' && selectedDoctor && selectedSpecialty) {
    return (
      <DoctorProfileView
        doctor={selectedDoctor}
        specialty={selectedSpecialty}
        onBack={() => {
          if (hospitalFilter) {
            setView('list');
            setSelectedDoctor(null);
          } else {
            setView('detail');
            setSelectedDoctor(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateLogin={onNavigateLogin}
      />
    );
  }

  if (view === 'detail' && selectedSpecialty) {
    return (
      <SpecialtyDetailView
        specialty={selectedSpecialty}
        onBack={backToList}
        onSelectDoctor={openDoctor}
        onNavigateLogin={onNavigateLogin}
      />
    );
  }

  if (hospitalFilter) {
    return (
      <HospitalDoctorsListView
        hospitalName={hospitalFilter}
        doctors={doctorsAtHospital}
        onSelectDoctor={openDoctor}
        onClearFilter={() => {
          window.history.replaceState({}, "", "/doctors");
          setHospitalFilter(null);
        }}
        onNavigateBack={onNavigateBack}
        onNavigateLogin={onNavigateLogin}
      />
    );
  }

  return (
    <SpecialtyListView
      specialties={filtered}
      allSpecialties={specialties}
      search={search}
      onSearch={setSearch}
      onSelectSpecialty={openSpecialty}
      onNavigateBack={onNavigateBack}
      onNavigateHospitals={() => onNavigateHospitals()}
      onNavigateLogin={onNavigateLogin}
    />
  );
}

// ═════════════════════════════════════════════
// VIEW 1 — Specialty List
// ═════════════════════════════════════════════
interface SpecialtyListViewProps {
  specialties: Specialty[];
  allSpecialties: Specialty[];
  search: string;
  onSearch: (v: string) => void;
  onSelectSpecialty: (s: Specialty) => void;
  onNavigateBack: () => void;
  onNavigateHospitals: () => void;
  onNavigateLogin: () => void;
}

function SpecialtyListView({
  specialties,
  allSpecialties,
  search,
  onSearch,
  onSelectSpecialty,
  onNavigateBack,
  onNavigateHospitals,
  onNavigateLogin,
}: SpecialtyListViewProps) {
  const totalDoctors = allSpecialties.reduce((acc, s) => acc + s.doctors.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-sky-600 transition-colors font-bold text-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">PenangHealth</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHospitals}
              className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-1.5 rounded-xl transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Hospitals &amp; Clinics</span>
            </button>
            <button
              onClick={onNavigateLogin}
              className="text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-4 py-1.5 rounded-xl transition cursor-pointer shadow-xs"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Hero header */}
      <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 py-14 px-4 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/20">
            <Stethoscope className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold">
              {allSpecialties.length} Specialties · {totalDoctors} Doctors
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Find Your Specialist Doctor
          </h1>
          <p className="text-sky-100 text-sm max-w-2xl mx-auto mb-8 font-medium">
            Browse medical specialties and connect with credentialed doctors across Penang's accredited private hospitals.
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search specialties or doctor names…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-white shadow-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs sm:text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Specialty grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {specialties.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No specialties found for "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialties.map((sp) => (
              <SpecialtyCard key={sp.id} specialty={sp} onClick={() => onSelectSpecialty(sp)} />
            ))}
          </div>
        )}
      </div>


    </div>
  );
}

// ─────────────────────────────────────────────
// Specialty Card
// ─────────────────────────────────────────────
const SpecialtyCard: React.FC<{ specialty: Specialty; onClick: () => void }> = ({ specialty: sp, onClick }) => {
  const Icon = sp.icon;
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-3xl border ${sp.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden`}
    >
      {/* Colored top strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${sp.color}`} />

      <div className="p-6">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sp.color} flex items-center justify-center mb-5 shadow-md`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>

        <h3 className="font-bold text-gray-900 text-lg leading-snug mb-1">{sp.name}</h3>
        <p className="text-gray-500 text-sm mb-4">{sp.desc}</p>

        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${sp.bg} ${sp.iconColor}`}
          >
            {sp.doctors.length} {sp.doctors.length === 1 ? 'Doctor' : 'Doctors'}
          </span>
          <span
            className={`text-xs font-semibold ${sp.iconColor} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
          >
            View doctors <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// VIEW 2 — Specialty Detail
// ═════════════════════════════════════════════
interface SpecialtyDetailViewProps {
  specialty: Specialty;
  onBack: () => void;
  onSelectDoctor: (d: Doctor) => void;
  onNavigateLogin: () => void;
}

function SpecialtyDetailView({
  specialty: sp,
  onBack,
  onSelectDoctor,
  onNavigateLogin,
}: SpecialtyDetailViewProps) {
  const Icon = sp.icon;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky back bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            All Specialties
          </button>
          <span className="text-gray-300">/</span>
          <span className={`text-sm font-semibold ${sp.iconColor} truncate`}>{sp.name}</span>
        </div>
      </div>

      {/* Gradient specialty hero */}
      <div className={`bg-gradient-to-br ${sp.color} py-14 px-4`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Icon className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">{sp.name}</h1>
            <p className="text-white/80 text-base max-w-2xl leading-relaxed">{sp.overview}</p>
          </div>
        </div>
      </div>

      {/* Body — 3-col grid: 1 col conditions + 2 col doctors */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Conditions */}
          <div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sticky top-20">
              <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${sp.iconColor}`} />
                Conditions Treated
              </h2>
              <ul className="space-y-3">
                {sp.conditions.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${sp.iconColor}`} />
                    <span className="text-gray-700 text-sm leading-snug">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — Doctor cards (2 cols inside) */}
          <div className="lg:col-span-2">
            <h2 className="font-bold text-gray-900 text-xl mb-5">
              {sp.doctors.length} {sp.doctors.length === 1 ? 'Doctor' : 'Doctors'} in {sp.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {sp.doctors.map((doc) => (
                <DoctorCard
                  key={doc.name}
                  doctor={doc}
                  specialty={sp}
                  onViewProfile={() => onSelectDoctor(doc)}
                  onNavigateLogin={onNavigateLogin}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Doctor Card (used in specialty detail)
// ─────────────────────────────────────────────
const DoctorCard: React.FC<{
  doctor: Doctor;
  specialty: Specialty;
  onViewProfile: () => void;
  onNavigateLogin: () => void;
}> = ({ doctor: doc, specialty: sp, onViewProfile, onNavigateLogin }) => {
  return (
    <div className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        {/* Avatar + name row */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sp.color} flex items-center justify-center flex-shrink-0 shadow-md`}
          >
            <span className="text-white font-bold text-base">{doc.avatar}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-snug">{doc.name}</h3>
            <p className={`text-xs font-semibold ${sp.iconColor} mt-0.5`}>{doc.title}</p>
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 truncate">{doc.hospital}</span>
            </div>
          </div>
        </div>

        {/* Rating + experience */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="text-xs font-bold text-amber-700">{doc.rating}</span>
            <span className="text-xs text-amber-600">({doc.reviews})</span>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {doc.experience}
          </span>
        </div>

        {/* Bio — line clamped */}
        <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
          {doc.bio}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onViewProfile}
            className={`flex-1 text-center text-xs font-bold py-2.5 rounded-xl border-2 ${sp.border} ${sp.iconColor} hover:bg-opacity-10 transition-colors`}
            style={{ borderColor: 'currentColor' }}
          >
            View Profile
          </button>
          <button
            onClick={onNavigateLogin}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl bg-gradient-to-r ${sp.color} text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Book
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// VIEW 3 — Doctor Profile
// ═════════════════════════════════════════════
interface DoctorProfileViewProps {
  doctor: Doctor;
  specialty: Specialty;
  onBack: () => void;
  onNavigateLogin: () => void;
}

function DoctorProfileView({
  doctor: doc,
  specialty: sp,
  onBack,
  onNavigateLogin,
}: DoctorProfileViewProps) {
  const Icon = sp.icon;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky back bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {sp.name}
          </button>
        </div>
      </div>

      {/* Profile hero header card */}
      <div className={`bg-gradient-to-br ${sp.color} py-12 px-4`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-8">
          {/* Large avatar */}
          <div className="w-28 h-28 rounded-3xl bg-white/25 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-xl border-4 border-white/40">
            <span className="text-white font-extrabold text-3xl tracking-wide">{doc.avatar}</span>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-1">
              {doc.name}
            </h1>
            <p className="text-white/90 font-semibold text-lg">{doc.title}</p>
            <p className="text-white/70 text-sm mt-1">{doc.specialty}</p>
            <div className="flex items-center gap-2 mt-3">
              <Building2 className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-sm font-medium">{doc.hospital}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-col body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column — quick info */}
          <div className="space-y-5">
            {/* Stats card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-base mb-5">Quick Info</h2>
              <div className="space-y-4">
                {/* Experience */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sp.color} flex items-center justify-center flex-shrink-0`}>
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Experience</p>
                    <p className="text-sm font-bold text-gray-900">{doc.experience}</p>
                  </div>
                </div>
                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Rating</p>
                    <p className="text-sm font-bold text-gray-900">
                      {doc.rating} <span className="text-gray-400 font-normal">({doc.reviews} reviews)</span>
                    </p>
                  </div>
                </div>
                {/* Specialty */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sp.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Specialty</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{doc.specialty}</p>
                  </div>
                </div>
                {/* Availability */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Availability</p>
                    <p className="text-sm font-bold text-gray-900 leading-snug">{doc.availability}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <button
              onClick={onNavigateLogin}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-bold text-base hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book Appointment
            </button>
          </div>

          {/* Right 2 columns — bio + CTA card */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <h2 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sp.color} flex items-center justify-center`}>
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                About {doc.name.split(' ')[0]} {doc.name.split(' ')[1]}
              </h2>
              <p className="text-gray-600 leading-relaxed text-base">{doc.bio}</p>
            </div>

            {/* Specialty context card */}
            <div className={`bg-gradient-to-br from-teal-50 to-sky-50 rounded-3xl border border-teal-100 p-8`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${sp.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{sp.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{sp.overview}</p>
                  <div className="flex flex-wrap gap-2">
                    {sp.conditions.slice(0, 4).map((c) => (
                      <span
                        key={c}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${sp.bg} ${sp.iconColor}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {c}
                      </span>
                    ))}
                    {sp.conditions.length > 4 && (
                      <span className="text-xs text-gray-500 px-3 py-1 rounded-full bg-gray-100">
                        +{sp.conditions.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// VIEW 4 — Hospital Doctors List
// ═════════════════════════════════════════════
interface HospitalDoctorsListViewProps {
  hospitalName: string;
  doctors: { doctor: Doctor; specialty: Specialty }[];
  onSelectDoctor: (d: Doctor) => void;
  onClearFilter: () => void;
  onNavigateBack: () => void;
  onNavigateLogin: () => void;
}

function HospitalDoctorsListView({
  hospitalName,
  doctors,
  onSelectDoctor,
  onClearFilter,
  onNavigateBack,
  onNavigateLogin,
}: HospitalDoctorsListViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-sky-600 transition-colors font-bold text-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">PenangHealth</span>
          </div>
        </div>
      </div>

      {/* Hero header */}
      <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 py-14 px-4 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/20">
            <Building2 className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold">
              {hospitalName}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Clinical Specialists
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm max-w-xl mx-auto mb-6 font-medium">
            Consult with available doctors practicing at this facility. Clear filter to view all specialties.
          </p>
          <button
            onClick={onClearFilter}
            className="bg-white text-teal-600 font-bold px-6 py-2.5 rounded-xl hover:bg-teal-50 transition-all text-sm shadow-md"
          >
            Show All Specialties
          </button>
        </div>
      </div>

      {/* Doctors grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {doctors.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No doctors currently registered for {hospitalName}.</p>
            <button
              onClick={onClearFilter}
              className="mt-4 text-teal-600 font-semibold hover:underline"
            >
              Browse all specialties
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((item) => (
              <DoctorCard
                key={item.doctor.name}
                doctor={item.doctor}
                specialty={item.specialty}
                onViewProfile={() => onSelectDoctor(item.doctor)}
                onNavigateLogin={onNavigateLogin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
