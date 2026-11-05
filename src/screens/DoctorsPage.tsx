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
  Calendar,
  ChevronRight,
  Scissors,
  Clock,
  Sparkles,
} from 'lucide-react';
import { allPantaiDoctors, PantaiDoctor } from '../data/pantaiHospitalsData';

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
  id?: string;
  name: string;
  avatar: string;
  title: string;
  specialty: string;
  hospital: string;
  experience?: string;
  rating?: number;
  reviews?: number;
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

function mapPantaiDoctor(d: PantaiDoctor): Doctor {
  const initials = d.avatar || d.name.replace(/^(Dato'|Dr\.?|Datin)\s+/i, '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return {
    id: d.id,
    name: d.name,
    avatar: initials || 'MD',
    title: d.title || `Consultant - ${d.specialty || d.department}`,
    specialty: d.specialty || d.department,
    hospital: d.hospital,
    availability: d.availability || 'Mon–Fri: 9:00 AM – 5:00 PM',
    bio: d.bio || `${d.title || 'Consultant Specialist'} practicing at ${d.hospital}, dedicated to personalized patient treatment and clinical excellence in ${d.specialty || d.department}. Consultations available by appointment.`,
  };
}

// ─────────────────────────────────────────────
// Specialty Definitions (18 PantaiCare Specialties)
// ─────────────────────────────────────────────
interface SpecialtyMeta {
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
  match: (d: PantaiDoctor) => boolean;
}

const SPECIALTY_DEFINITIONS: SpecialtyMeta[] = [
  {
    id: 'cardiology',
    name: 'Cardiology & Cardiothoracic',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    iconColor: 'text-rose-600',
    desc: 'Heart, vascular & cardiothoracic surgical care',
    overview: 'Comprehensive diagnosis and treatment of cardiovascular diseases including coronary angiography, angioplasty, pacemaker implantation, electrophysiology, and open-heart surgeries.',
    conditions: [
      'Coronary Artery Disease',
      'Heart Failure & Cardiomyopathy',
      'Arrhythmia & Atrial Fibrillation',
      'Hypertension & Vascular Disease',
      'Valvular Heart Disease',
      'Cardiothoracic Surgery',
    ],
    match: (d) => /cardio/i.test(d.department) || /electrophysiology/i.test(d.department),
  },
  {
    id: 'internal-medicine',
    name: 'Internal Medicine & Subspecialties',
    icon: Activity,
    color: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    iconColor: 'text-teal-600',
    desc: 'Complex chronic illnesses, metabolic & infectious care',
    overview: 'Holistic clinical management of multi-system medical conditions, diabetes, renal diseases, respiratory conditions, geriatric care, and rheumatologic disorders.',
    conditions: [
      'Type 1 & 2 Diabetes Mellitus',
      'Chronic Kidney Disease (Nephrology)',
      'Respiratory & Lung Diseases',
      'Rheumatoid Arthritis & Autoimmune',
      'Infectious Diseases & Fevers',
      'Geriatric & Metabolic Health',
    ],
    match: (d) =>
      /internal medicine/i.test(d.department) ||
      /geriatric/i.test(d.department) ||
      /nephrology/i.test(d.department) ||
      /rheumatology/i.test(d.department) ||
      /endocrin/i.test(d.department) ||
      /respiratory/i.test(d.department),
  },
  {
    id: 'pediatrics',
    name: 'Paediatrics & Child Health',
    icon: Baby,
    color: 'from-sky-400 to-blue-500',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    iconColor: 'text-sky-600',
    desc: 'Infant, child & adolescent developmental health',
    overview: 'Specialized healthcare from neonates to adolescents, encompassing general paediatrics, paediatric cardiology, neonatal care, and growth development tracking.',
    conditions: [
      'Neonatal Jaundice & Infant Care',
      'Childhood Asthma & Bronchitis',
      'Paediatric Heart Conditions',
      'Growth & Nutritional Deficits',
      'Paediatric Allergy & Dermatology',
      'Childhood Immunization & Fever',
    ],
    match: (d) => /paediatric|pediatric/i.test(d.department),
  },
  {
    id: 'general-surgery',
    name: 'General & Upper GI Surgery',
    icon: Scissors,
    color: 'from-slate-600 to-slate-800',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconColor: 'text-slate-700',
    desc: 'Laparoscopic, colorectal & abdominal surgical procedures',
    overview: 'Minimally invasive keyhole surgeries, emergency trauma operations, gallbladder removal, hernia repair, colorectal oncologic resections, and upper GI surgery.',
    conditions: [
      'Acute Appendicitis & Peritonitis',
      'Inguinal & Ventral Hernias',
      'Gallbladder Stones (Cholecystectomy)',
      'Colorectal Tumors & Polyps',
      'Upper Gastrointestinal Disorders',
      'Thyroid & Soft Tissue Masses',
    ],
    match: (d) =>
      /general surgery/i.test(d.department) ||
      /colorectal/i.test(d.department) ||
      /git surgery/i.test(d.department),
  },
  {
    id: 'orthopedics',
    name: 'Orthopaedics, Sports & Spine Surgery',
    icon: Bone,
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconColor: 'text-amber-600',
    desc: 'Bones, joints, spine reconstruction & sports injuries',
    overview: 'Advanced joint replacement, arthroscopic ligament repair, sports medicine, complex bone fracture trauma, foot & ankle surgery, and spinal surgery.',
    conditions: [
      'ACL, PCL & Meniscal Knee Tears',
      'Hip & Knee Osteoarthritis',
      'Lumbar Disc Herniation & Spine Pain',
      'Rotator Cuff & Shoulder Instability',
      'Bone Fractures & Dislocations',
      'Sports Injury Rehabilitation',
    ],
    match: (d) =>
      /orthop/i.test(d.department) ||
      /sports medicine/i.test(d.department) ||
      /spine/i.test(d.department) ||
      /rehabilitation/i.test(d.department),
  },
  {
    id: 'neurology',
    name: 'Neurology & Neurosurgery',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    iconColor: 'text-purple-600',
    desc: 'Brain, spine & peripheral nervous system disorders',
    overview: 'Hyperacute stroke management, cranial neurosurgery, epilepsy evaluation, brain tumor resection, and management of neuromuscular disorders.',
    conditions: [
      'Ischemic & Hemorrhagic Stroke',
      'Brain Tumors & Cranial Lesions',
      'Epilepsy & Unexplained Seizures',
      'Migraine, Headaches & Neuropathy',
      'Parkinson’s Disease & Tremors',
      'Spinal Cord Decompression',
    ],
    match: (d) => /neuro/i.test(d.department),
  },
  {
    id: 'gastro-urology',
    name: 'Gastroenterology, Hepatology & Urology',
    icon: Microscope,
    color: 'from-emerald-500 to-teal-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconColor: 'text-emerald-700',
    desc: 'Digestive tract, liver health & urinary system care',
    overview: 'Diagnostic and therapeutic endoscopy, colonoscopy, chronic liver disease management, minimally invasive kidney stone removal, and prostate surgeries.',
    conditions: [
      'Gastroesophageal Reflux Disease (GERD)',
      'Hepatitis & Fatty Liver Disease',
      'Kidney & Bladder Stones',
      'Benign Prostatic Hyperplasia (BPH)',
      'Inflammatory Bowel Disease (IBD)',
      'Urological Oncology & Haematuria',
    ],
    match: (d) =>
      /gastro/i.test(d.department) ||
      /hepatology/i.test(d.department) ||
      /urology/i.test(d.department),
  },
  {
    id: 'obgyn',
    name: 'Obstetrics & Gynaecology (O&G)',
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    iconColor: 'text-pink-600',
    desc: "Women's health, maternity & reproductive care",
    overview: 'Comprehensive antenatal care, safe deliveries, high-risk pregnancy monitoring, fertility evaluation, and laparoscopic gynaecological surgery.',
    conditions: [
      'Antenatal Care & Delivery Options',
      'Uterine Fibroids & Endometriosis',
      'Ovarian Cysts & Pelvic Pain',
      'Menstrual Disorders & PCOS',
      'Cervical Cancer Screening & HPV',
      'Menopause & Hormone Health',
    ],
    match: (d) => /obstetric|gynaecolog/i.test(d.department),
  },
  {
    id: 'oncology',
    name: 'Oncology & Radiotherapy',
    icon: FlaskConical,
    color: 'from-violet-600 to-purple-800',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    iconColor: 'text-violet-700',
    desc: 'Comprehensive cancer therapeutics & radiotherapy',
    overview: 'Multidisciplinary tumor management, systemic chemotherapy, targeted biological therapies, immunotherapy, and high-precision linear accelerator radiotherapy.',
    conditions: [
      'Solid Tumors (Breast, Lung, GI)',
      'Colorectal & Gynaecological Cancers',
      'Radiotherapy & Intensity-Modulated Radiation',
      'Post-Surgical Adjuvant Therapy',
      'Palliative Oncology & Pain Care',
      'Cancer Surveillance & Screening',
    ],
    match: (d) => /oncology|radiotherapy/i.test(d.department),
  },
  {
    id: 'ent',
    name: 'Ear, Nose & Throat (ENT)',
    icon: Activity,
    color: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
    iconColor: 'text-cyan-700',
    desc: 'Hearing, sinus, throat & head-neck conditions',
    overview: 'Endoscopic sinus surgery, functional nasal surgery, tonsillectomy, hearing assessments, tympanoplasty, and head-and-neck tumor evaluations.',
    conditions: [
      'Chronic Sinusitis & Nasal Polyps',
      'Hearing Loss & Tinnitus',
      'Otitis Media & Ear Infections',
      'Tonsillitis & Sleep Apnea',
      'Allergic Rhinitis & Deviated Septum',
      'Vocal Cord & Swallowing Disorders',
    ],
    match: (d) => /ear|throat|otorhino/i.test(d.department),
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology (Eye Care)',
    icon: Search,
    color: 'from-blue-500 to-sky-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconColor: 'text-blue-600',
    desc: 'Vision correction, cataract & retinal care',
    overview: 'Advanced phacoemulsification cataract extraction, premium intraocular lens implantation, glaucoma management, diabetic retinopathy screening, and ocular trauma.',
    conditions: [
      'Cataracts & Refractive Errors',
      'Glaucoma & High Intraocular Pressure',
      'Diabetic Retinopathy & Maculopathy',
      'Age-Related Macular Degeneration',
      'Dry Eye Syndrome & Blepharitis',
      'Corneal & Conjunctival Disorders',
    ],
    match: (d) => /ophthalm/i.test(d.department),
  },
  {
    id: 'dermatology',
    name: 'Dermatology & Skin',
    icon: Sparkles,
    color: 'from-fuchsia-500 to-pink-500',
    bg: 'bg-fuchsia-50',
    border: 'border-fuchsia-100',
    iconColor: 'text-fuchsia-600',
    desc: 'Medical dermatology & therapeutic skin care',
    overview: 'Clinical dermatology providing targeted management for acute and chronic skin rashes, inflammatory dermatoses, eczema, psoriasis, acne vulgaris, and skin lesions.',
    conditions: [
      'Eczema & Atopic Dermatitis',
      'Psoriasis & Plaque Lesions',
      'Urticaria & Allergic Eruptions',
      'Severe Acne Vulgaris & Rosacea',
      'Fungal & Bacterial Skin Infections',
      'Suspicious Skin Lesions & Moles',
    ],
    match: (d) => /dermatolog/i.test(d.department),
  },
  {
    id: 'radiology',
    name: 'Clinical & Interventional Radiology',
    icon: Activity,
    color: 'from-indigo-500 to-blue-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    iconColor: 'text-indigo-600',
    desc: 'Advanced imaging, CT/MRI & catheter interventions',
    overview: 'High-resolution MRI, multi-slice CT, ultrasound, digital mammography, and image-guided diagnostic biopsies and vascular catheter interventions.',
    conditions: [
      'High-Resolution Neuro & Spine MRI',
      'Multi-Slice CT Chest & Abdomen',
      'Digital Mammography & Breast Ultrasound',
      'Interventional Angiography & Stenting',
      'Image-Guided Fine Needle Biopsies',
      'Musculoskeletal Ultrasound & X-Ray',
    ],
    match: (d) => /radiology/i.test(d.department) && !/oncology/i.test(d.department),
  },
  {
    id: 'anaesthesiology',
    name: 'Anaesthesiology & Critical Care',
    icon: Activity,
    color: 'from-teal-600 to-cyan-700',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    iconColor: 'text-teal-700',
    desc: 'Perioperative anaesthesia & intensive ICU care',
    overview: 'Comprehensive general and regional anaesthesia for major surgeries, post-operative acute pain relief, and round-the-clock tertiary Intensive Care Unit (ICU) care.',
    conditions: [
      'General & Regional Surgical Anaesthesia',
      'Post-Operative Epidural Analgesia',
      'Acute Sepsis & Multi-Organ Failure',
      'Mechanical Ventilation & Hemodynamic Care',
      'Sedation for Diagnostic Endoscopies',
      'Critical Care Resuscitation',
    ],
    match: (d) =>
      /anaesthes/i.test(d.department) ||
      /critical care/i.test(d.department) ||
      /intensive care/i.test(d.department),
  },
  {
    id: 'dental',
    name: 'Dental & Maxillofacial Surgery',
    icon: Stethoscope,
    color: 'from-cyan-600 to-teal-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
    iconColor: 'text-cyan-700',
    desc: 'Oral surgery, orthodontics & reconstructive dentistry',
    overview: 'Surgical extraction of impacted teeth, reconstructive oral and maxillofacial surgery, dental implantology, and corrective orthodontics.',
    conditions: [
      'Impacted Third Molar (Wisdom Teeth)',
      'Orthodontic Misalignment & Malocclusion',
      'Dental Implants & Bone Grafting',
      'Temporomandibular Joint (TMJ) Dysfunction',
      'Facial Trauma & Jaw Fractures',
      'Periodontal Disease & Oral Health',
    ],
    match: (d) => /dental|dentistry|orthodontic/i.test(d.department),
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry & Mental Health',
    icon: Brain,
    color: 'from-violet-500 to-indigo-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    iconColor: 'text-violet-600',
    desc: 'Clinical psychiatry & cognitive psychotherapy',
    overview: 'Compassionate psychiatric assessment, medication management, and psychotherapy for mood disorders, anxiety disorders, and child & adolescent mental health.',
    conditions: [
      'Major Depressive Disorder',
      'Generalized Anxiety & Panic Disorders',
      'Bipolar Mood Disorders',
      'Child & Adolescent ADHD',
      'Insomnia & Chronic Stress Disorders',
      'Obsessive-Compulsive Disorder (OCD)',
    ],
    match: (d) => /psych/i.test(d.department),
  },
  {
    id: 'plastic-surgery',
    name: 'Plastic & Reconstructive Surgery',
    icon: Scissors,
    color: 'from-rose-400 to-pink-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    iconColor: 'text-rose-600',
    desc: 'Reconstructive surgery & microsurgical procedures',
    overview: 'Post-traumatic reconstruction, scar revision, burn contracture management, cosmetic facial and body contouring, and fine microsurgery.',
    conditions: [
      'Post-Traumatic Soft Tissue Defects',
      'Burn & Surgical Scar Revision',
      'Breast Reconstruction & Symmetry',
      'Cosmetic Facial & Eyelid Procedures',
      'Skin Cancer Excision with Flap Closure',
      'Hand Soft Tissue Injuries',
    ],
    match: (d) => /plastic/i.test(d.department),
  },
  {
    id: 'gp-family',
    name: 'General Practice & Emergency Medicine',
    icon: Stethoscope,
    color: 'from-sky-500 to-teal-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    iconColor: 'text-sky-600',
    desc: 'Primary outpatient care & 24/7 urgent consultations',
    overview: 'Routine primary medical consultations, preventative checkups, vaccinations, chronic disease follow-ups, and urgent outpatient triage.',
    conditions: [
      'Acute Fevers, Coughs & Flu',
      'Hypertension & Cholesterol Monitoring',
      'Minor Cuts, Wounds & Dressing',
      'Routine Health Screenings & Blood Tests',
      'Travel Vaccines & Medical Checkups',
      'Prescription Refills & Preventive Care',
    ],
    match: (d) =>
      /emergency/i.test(d.department) ||
      /general practice/i.test(d.department) ||
      /family/i.test(d.department),
  },
];

// Dynamically construct specialties from the official 160 PantaiCare doctors dataset
export const specialties: Specialty[] = SPECIALTY_DEFINITIONS.map((def) => {
  const matchedDoctors = allPantaiDoctors.filter(def.match);
  return {
    id: def.id,
    name: def.name,
    icon: def.icon,
    color: def.color,
    bg: def.bg,
    border: def.border,
    iconColor: def.iconColor,
    desc: def.desc,
    overview: def.overview,
    conditions: def.conditions,
    doctors: matchedDoctors.map(mapPantaiDoctor),
  };
});

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

  // Collect credentialed doctors practicing at the selected hospital
  const doctorsAtHospital = useMemo(() => {
    if (!hospitalFilter) return [];
    const filterLower = hospitalFilter.toLowerCase().trim();
    const list: { doctor: Doctor; specialty: Specialty }[] = [];
    const seenDoctorNames = new Set<string>();

    specialties.forEach((sp) => {
      sp.doctors.forEach((doc) => {
        const docHosp = doc.hospital.toLowerCase().trim();
        const matches =
          docHosp === filterLower ||
          docHosp.includes(filterLower) ||
          filterLower.includes(docHosp);
        if (matches && !seenDoctorNames.has(doc.name)) {
          seenDoctorNames.add(doc.name);
          list.push({ doctor: doc, specialty: sp });
        }
      });
    });
    return list;
  }, [hospitalFilter]);

  // Filtered specialties
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return specialties;
    return specialties.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.doctors.some(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.hospital.toLowerCase().includes(q) ||
            d.specialty.toLowerCase().includes(q)
        )
    );
  }, [search]);

  const openSpecialty = (sp: Specialty) => {
    setSelectedSpecialty(sp);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDoctor = (doc: Doctor) => {
    const sp =
      specialties.find((s) => s.doctors.some((d) => d.name === doc.name)) ||
      specialties[0];
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

  const handleBookDoctor = (doc: Doctor) => {
    try {
      localStorage.setItem('pantai_booking_preselected_clinic', doc.hospital);
      localStorage.setItem('pantai_booking_preselected_doctor', doc.name);
      localStorage.setItem('pantai_booking_preselected_specialty', doc.specialty);
      localStorage.setItem('pantai_booking_initial_step', '4');
    } catch (e) {
      // ignore localStorage errors
    }
    onNavigateLogin();
  };

  // ── Render ──
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
            backToDetail();
          }
        }}
        onBookDoctor={handleBookDoctor}
      />
    );
  }

  if (view === 'detail' && selectedSpecialty) {
    return (
      <SpecialtyDetailView
        specialty={selectedSpecialty}
        onBack={backToList}
        onSelectDoctor={openDoctor}
        onBookDoctor={handleBookDoctor}
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
          window.history.replaceState({}, '', '/doctors');
          setHospitalFilter(null);
        }}
        onNavigateBack={onNavigateBack}
        onBookDoctor={handleBookDoctor}
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
}

function SpecialtyListView({
  specialties,
  allSpecialties,
  search,
  onSearch,
  onSelectSpecialty,
  onNavigateBack,
}: SpecialtyListViewProps) {
  const totalDoctors = allSpecialties.reduce((acc, s) => acc + s.doctors.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sticky top bar - matching HospitalsPage layout & branding */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm">PantaiCare</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero header */}
      <div className="bg-gradient-to-br from-teal-600 via-sky-600 to-blue-600 py-14 px-4 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/20">
            <Stethoscope className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold">
              {allSpecialties.length} Specialties · {totalDoctors} Doctors
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-8 tracking-tight">
            Find Your Specialist Doctor
          </h1>
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search specialties, doctor names, or facilities…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-white shadow-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs sm:text-sm font-medium"
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
            <p className="text-gray-500 text-lg">No specialties or doctors found for "{search}"</p>
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
const SpecialtyCard: React.FC<{ specialty: Specialty; onClick: () => void }> = ({
  specialty: sp,
  onClick,
}) => {
  const Icon = sp.icon;
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-3xl border ${sp.border} shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between`}
    >
      {/* Colored top strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${sp.color}`} />

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sp.color} flex items-center justify-center mb-5 shadow-sm`}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>

          <h3 className="font-bold text-gray-900 text-lg leading-snug mb-1">{sp.name}</h3>
          <p className="text-gray-500 text-xs sm:text-sm mb-5 leading-relaxed">{sp.desc}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
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
};

// ═════════════════════════════════════════════
// VIEW 2 — Specialty Detail
// ═════════════════════════════════════════════
interface SpecialtyDetailViewProps {
  specialty: Specialty;
  onBack: () => void;
  onSelectDoctor: (d: Doctor) => void;
  onBookDoctor: (d: Doctor) => void;
}

function SpecialtyDetailView({
  specialty: sp,
  onBack,
  onSelectDoctor,
  onBookDoctor,
}: SpecialtyDetailViewProps) {
  const Icon = sp.icon;
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Specialties</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm">PantaiCare</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200" />
            <span className={`text-xs font-bold ${sp.iconColor} truncate`}>{sp.name}</span>
          </div>
        </div>
      </header>

      {/* Gradient specialty hero */}
      <div className={`bg-gradient-to-br ${sp.color} py-14 px-4 text-white`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shrink-0 shadow-lg border border-white/20">
            <Icon className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">{sp.name}</h1>
            <p className="text-white/90 text-sm sm:text-base max-w-2xl leading-relaxed">{sp.overview}</p>
          </div>
        </div>
      </div>

      {/* Body — 3-col grid: 1 col conditions + 2 col doctors */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Conditions */}
          <div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sticky top-20">
              <h2 className="font-bold text-slate-900 text-base mb-5 flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${sp.iconColor}`} />
                Conditions Treated
              </h2>
              <ul className="space-y-3">
                {sp.conditions.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${sp.iconColor}`} />
                    <span className="text-slate-700 text-xs sm:text-sm leading-snug">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — Doctor cards (2 cols inside) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900 text-lg">
                {sp.doctors.length} {sp.doctors.length === 1 ? 'Credentialed Doctor' : 'Credentialed Doctors'} in {sp.name}
              </h2>
              <span className="text-xs text-slate-500 font-medium">Across PantaiCare Penang</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {sp.doctors.map((doc) => (
                <DoctorCard
                  key={doc.name}
                  doctor={doc}
                  specialty={sp}
                  onViewProfile={() => onSelectDoctor(doc)}
                  onBook={() => onBookDoctor(doc)}
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
// Doctor Card (used in specialty detail & hospital view)
// ─────────────────────────────────────────────
const DoctorCard: React.FC<{
  doctor: Doctor;
  specialty: Specialty;
  onViewProfile: () => void;
  onBook: () => void;
}> = ({ doctor: doc, specialty: sp, onViewProfile, onBook }) => {
  return (
    <div className="group bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        {/* Avatar + name row */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${sp.color} flex items-center justify-center shrink-0 shadow-sm text-white font-extrabold text-sm`}
          >
            {doc.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-sm leading-snug truncate" title={doc.name}>
              {doc.name}
            </h3>
            <p className={`text-xs font-semibold ${sp.iconColor} mt-0.5 truncate`}>{doc.title}</p>
            <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{doc.hospital}</span>
            </div>
          </div>
        </div>

        {/* Availability Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 truncate">
            <Clock className="w-3 h-3 text-teal-600 shrink-0" />
            <span className="truncate">{doc.availability}</span>
          </span>
        </div>

        {/* Bio — line clamped */}
        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
          {doc.bio}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={onViewProfile}
            className={`flex-1 text-center text-xs font-bold py-2.5 rounded-xl border ${sp.border} ${sp.iconColor} hover:bg-slate-50 transition-colors cursor-pointer`}
          >
            View Profile
          </button>
          <button
            onClick={onBook}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl bg-gradient-to-r ${sp.color} text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs cursor-pointer`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Book
          </button>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════
// VIEW 3 — Doctor Profile
// ═════════════════════════════════════════════
interface DoctorProfileViewProps {
  doctor: Doctor;
  specialty: Specialty;
  onBack: () => void;
  onBookDoctor: (d: Doctor) => void;
}

function DoctorProfileView({
  doctor: doc,
  specialty: sp,
  onBack,
  onBookDoctor,
}: DoctorProfileViewProps) {
  const Icon = sp.icon;
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {sp.name}</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm">PantaiCare</span>
            </div>
          </div>
        </div>
      </header>

      {/* Profile hero header card */}
      <div className={`bg-gradient-to-br ${sp.color} py-12 px-4 text-white`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Large avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-xl border-2 border-white/40">
            <span className="text-white font-extrabold text-3xl tracking-wide">{doc.avatar}</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-1">
              {doc.name}
            </h1>
            <p className="text-white/90 font-semibold text-base sm:text-lg">{doc.title}</p>
            <p className="text-white/80 text-xs sm:text-sm mt-1">{doc.specialty}</p>
            <div className="flex items-center gap-2 mt-3">
              <Building2 className="w-4 h-4 text-white/90" />
              <span className="text-white/90 text-xs sm:text-sm font-medium">{doc.hospital}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-col body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column — Quick Info */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
              <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-5">
                Doctor Information
              </h2>
              <div className="space-y-4">
                {/* Facility */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sp.color} flex items-center justify-center shrink-0 shadow-xs text-white`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">Practicing Facility</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {doc.hospital}
                    </p>
                  </div>
                </div>

                {/* Specialty */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sp.color} flex items-center justify-center shrink-0 shadow-xs text-white`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">Department &amp; Specialty</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {doc.specialty}
                    </p>
                  </div>
                </div>

                {/* Availability */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center shrink-0 shadow-xs text-white">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">Consultation Hours</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {doc.availability}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Book Appointment CTA button */}
            <button
              onClick={() => onBookDoctor(doc)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment with {doc.name.replace(/^(Dato'|Dr\.?|Datin)\s+/i, '').split(' ')[0]}</span>
            </button>
          </div>

          {/* Right 2 columns — bio + CTA card */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-8">
              <h2 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sp.color} flex items-center justify-center text-white`}
                >
                  <Stethoscope className="w-4 h-4" />
                </div>
                About {doc.name}
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{doc.bio}</p>
            </div>

            {/* Specialty context card */}
            <div className="bg-gradient-to-br from-teal-50 to-sky-50 rounded-3xl border border-teal-100 p-8">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${sp.color} flex items-center justify-center shrink-0 shadow-sm text-white`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-1">{sp.name}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">{sp.overview}</p>
                  <div className="flex flex-wrap gap-2">
                    {sp.conditions.map((c) => (
                      <span
                        key={c}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-full ${sp.bg} ${sp.iconColor}`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {c}
                      </span>
                    ))}
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
  onBookDoctor: (d: Doctor) => void;
}

function HospitalDoctorsListView({
  hospitalName,
  doctors,
  onSelectDoctor,
  onClearFilter,
  onNavigateBack,
  onBookDoctor,
}: HospitalDoctorsListViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sticky top bar - matching HospitalsPage layout & branding */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm">PantaiCare</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero header */}
      <div className="bg-gradient-to-br from-teal-600 via-sky-600 to-blue-600 py-14 px-4 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 border border-white/20">
            <Building2 className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold">{hospitalName}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Clinical Specialists
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm max-w-xl mx-auto mb-6 font-medium">
            Consult with credentialed medical specialists practicing at {hospitalName}.
          </p>
          <button
            onClick={onClearFilter}
            className="bg-white text-teal-700 font-bold px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-xs sm:text-sm shadow-md cursor-pointer"
          >
            Show All Specialties ({doctors.length} Doctors Registered)
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
            <p className="text-gray-500 text-base">No doctors currently registered for {hospitalName}.</p>
            <button
              onClick={onClearFilter}
              className="mt-4 text-teal-600 font-semibold hover:underline text-sm cursor-pointer"
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
                onBook={() => onBookDoctor(item.doctor)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
