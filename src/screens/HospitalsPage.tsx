import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Activity,
  ChevronRight,
  X,
  Stethoscope,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Hospital {
  id: string;
  name: string;
  type: string;
  tag: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  services: string[];
  gradient: string;
}

interface HospitalsPageProps {
  onNavigateLogin: () => void;
  onNavigateBack: () => void;
  onNavigateDoctors: (params?: string) => void;
}

// ─── Private Accredited Hospitals & Clinics ───────────────────────────────────

export const privateHospitals: Hospital[] = [
  {
    id: 'pantai',
    name: 'Pantai Hospital Penang',
    type: 'Private Tertiary Hospital',
    tag: 'JCI Accredited Specialist',
    address: '82 Jalan Tengah, 10450 Bayan Lepas, Penang',
    phone: '04-643 3888',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'A leading private tertiary hospital in Penang offering world-class specialist care in cardiology, orthopedics, neurology, and oncology with modern surgical suites and international-standard facilities.',
    services: [
      'Cardiology & Interventional Cardiology',
      'Orthopedic & Sports Surgery',
      'Oncology & Chemotherapy',
      'Obstetrics & Gynaecology',
      'Neurosurgery',
      'Ophthalmology',
      'ENT & Sinus Surgery',
      '24/7 Accident & Emergency',
    ],
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    id: 'gleneagles',
    name: 'Gleneagles Hospital Penang',
    type: 'Private Specialist Centre',
    tag: 'Premier Tertiary Care',
    address: '1 Jalan Pangkor, 10050 Georgetown, Penang',
    phone: '04-222 9111',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'An internationally-accredited private hospital offering advanced cardiac catheterization, comprehensive neurovascular stroke care, and premier multi-disciplinary specialist treatments.',
    services: [
      'Interventional Cardiology',
      'Neurology & Acute Stroke Unit',
      'General & Laparoscopic Surgery',
      'Pediatrics & Neonatal Intensive Care',
      'Oncology & Radiation Therapy',
      'Orthopedic Reconstruction',
      'Health Screening & Wellness',
    ],
    gradient: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'island',
    name: 'Island Hospital',
    type: 'Private Tertiary Centre',
    tag: 'Centre of Excellence',
    address: '308 Macalister Road, 10450 Georgetown, Penang',
    phone: '04-228 8222',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'A renowned Penang private medical centre with an outstanding track record in gastroenterology, hepatology, heart surgery, and pediatrics, equipped with state-of-the-art diagnostic imaging.',
    services: [
      'Gastroenterology & Hepatology',
      'Pediatrics & Child Health',
      'Cardiovascular Surgery',
      'Urology & Kidney Stone Management',
      'Endocrinology & Diabetes Centre',
      'Spine & Joint Surgery',
    ],
    gradient: 'from-sky-600 to-cyan-600',
  },
  {
    id: 'loh',
    name: 'Loh Guan Lye Specialists Centre',
    type: 'Private Specialist Centre',
    tag: 'Cancer & Surgery Hub',
    address: '19 & 21 Logan Road, 10400 Georgetown, Penang',
    phone: '04-238 8888',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'Established in 1975, Loh Guan Lye is a comprehensive private healthcare institution recognized for its advanced cancer centre, fertility treatments, ENT, and pediatric specialist care.',
    services: [
      'Comprehensive Cancer Centre',
      'ENT & Cochlear Implant',
      'Obstetrics, Gynaecology & IVF',
      'Cardiology & Echocardiography',
      'Orthopedics & Arthroscopy',
      'Radiology (PET-CT & MRI)',
    ],
    gradient: 'from-blue-500 to-sky-600',
  },
  {
    id: 'lwe',
    name: 'Hospital Lam Wah Ee',
    type: 'Not-for-Profit Private Hospital',
    tag: 'Community Trust Care',
    address: '141 Jalan Tan Sri Teh Ewe Lim, 11600 Georgetown, Penang',
    phone: '04-652 2888',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'One of Penang most trusted non-profit private hospitals, known for its high-quality general surgery, urology, renal dialysis, and accessible specialist outpatient care for the community.',
    services: [
      'General Surgery & Laparoscopy',
      'Urology & Renal Care',
      'Internal Medicine & Respiratory',
      'Gastroenterology & Endoscopy',
      'Orthopedics & Joint Replacement',
      'Haemodialysis Unit',
    ],
    gradient: 'from-sky-500 to-teal-600',
  },
  {
    id: 'kpj',
    name: 'KPJ Penang Specialist Hospital',
    type: 'Private Specialist Hospital',
    tag: 'Multi-Disciplinary Hub',
    address: '570 Jalan Perda Barat, 14000 Bukit Mertajam, Penang',
    phone: '04-548 6688',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'A premier private specialist hospital located in Seberang Perai, offering modern inpatient amenities, catheterization laboratory, orthopedic suites, and prompt outpatient specialty consultations.',
    services: [
      'Cardiology & Catheterization',
      'Orthopedic & Traumatology',
      'General Surgery',
      'Pediatrics & Neonatology',
      'Obstetrics & Gynaecology',
      '24/7 Outpatient & Emergency',
    ],
    gradient: 'from-blue-600 to-sky-500',
  },
  {
    id: 'bagan',
    name: 'Bagan Specialist Centre',
    type: 'Private Specialist Hospital',
    tag: 'Mainland Healthcare',
    address: 'Jalan Bagan 1, 13400 Butterworth, Penang',
    phone: '04-340 5000',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'A purpose-built tertiary private hospital serving the northern region with comprehensive critical care, surgical specialties, health screenings, and rehabilitation.',
    services: [
      'Internal Medicine',
      'Orthopedics & Spine Care',
      'General Surgery',
      'Cardiology',
      'Pediatric Care',
      'Health Screening & Radiology',
    ],
    gradient: 'from-sky-500 to-indigo-500',
  },
  {
    id: 'mount',
    name: 'Mount Miriam Cancer Hospital',
    type: 'Private Specialist Hospital',
    tag: 'Dedicated Oncology Care',
    address: '23 Jalan Bulan, Fettes Park, 11200 Tanjung Tokong, Penang',
    phone: '04-890 7000',
    hours: 'Mon–Fri: 8:00 AM – 5:00 PM | Sat: 8:00 AM – 1:00 PM',
    description:
      'A specialized not-for-profit private cancer hospital with high-precision linear accelerators, clinical oncology, palliative care, and advanced cancer diagnostic technologies.',
    services: [
      'Radiation Oncology (Linac)',
      'Medical Oncology & Chemotherapy',
      'Palliative & Supportive Medicine',
      'PET-CT Diagnostic Imaging',
      'Oncology Pharmacy',
    ],
    gradient: 'from-sky-600 to-blue-700',
  },
];

export const privateClinics: Hospital[] = [
  {
    id: 'o2',
    name: 'O2 Klinik Georgetown',
    type: 'Private Specialist Clinic',
    tag: 'Primary & Aesthetics',
    address: '35 Jalan Burma, 10050 Georgetown, Penang',
    phone: '04-228 8822',
    hours: 'Mon–Sat: 8:30 AM – 9:00 PM | Sun: 9:00 AM – 5:00 PM',
    description:
      'A modern private outpatient clinic chain offering general medical consultations, preventive health screenings, dermatology, minor surgical procedures, and routine wellness checkups.',
    services: [
      'General Medical Practice',
      'Health Screening Packages',
      'Dermatology & Skin Consultations',
      'Vaccinations & Travel Medicine',
      'Chronic Disease Management',
      'Minor Surgery & Wound Dressing',
    ],
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    id: 'sg',
    name: 'Klinik Singapore',
    type: 'Private Clinic',
    tag: 'Family Practice',
    address: '468 Jalan Penang, 10000 Georgetown, Penang',
    phone: '04-263 3388',
    hours: 'Mon–Fri: 8:30 AM – 6:00 PM | Sat: 8:30 AM – 1:00 PM',
    description:
      'A well-established Georgetown private practice serving families and professionals with prompt outpatient consultations, health screenings, and chronic illness monitoring.',
    services: [
      'Family Medicine',
      'Acute Illness Consultation',
      'Adult & Child Immunizations',
      'Minor Wound Care',
      'Medical Checkup Reports',
      'Prescription Renewals',
    ],
    gradient: 'from-blue-400 to-sky-500',
  },
  {
    id: 'pp',
    name: 'Poliklinik Perdana',
    type: 'Private Clinic',
    tag: 'Occupational Health',
    address: 'Penang (Bayan Lepas & Butterworth Branches)',
    phone: '04-644 1122',
    hours: 'Mon–Fri: 8:00 AM – 6:00 PM | Sat: 8:00 AM – 1:00 PM',
    description:
      'A multi-branch private clinic network specializing in occupational health screenings, corporate health panels, pre-employment checkups, and general outpatient treatment.',
    services: [
      'Occupational Health Screenings',
      'Corporate Medical Panels',
      'General Outpatient Practice',
      'Industrial Health Clearance',
      'Executive Wellness Checks',
    ],
    gradient: 'from-sky-500 to-blue-600',
  },
];

const allHospitals = [...privateHospitals, ...privateClinics];

// ─── Helper: type badge colour ────────────────────────────────────────────────

function typeBadgeClass(type: string): string {
  if (type.includes('Tertiary')) return 'bg-sky-100 text-sky-800';
  if (type.includes('Specialist Centre') || type.includes('Specialist Hospital')) return 'bg-blue-100 text-blue-800';
  if (type.includes('Clinic')) return 'bg-emerald-100 text-emerald-800';
  return 'bg-slate-100 text-slate-700';
}

// ─── HospitalCard ─────────────────────────────────────────────────────────────

interface HospitalCardProps {
  hospital: Hospital;
  onClick: () => void;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ hospital, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group w-full text-left bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
    >
      {/* Colour strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${hospital.gradient}`} />

      <div className="p-5 flex flex-col gap-3">
        {/* Icon + name row */}
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br ${hospital.gradient} flex items-center justify-center shadow-xs`}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-slate-900 text-sm leading-snug truncate group-hover:text-sky-700 transition">
              {hospital.name}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadgeClass(hospital.type)}`}
              >
                {hospital.type}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {hospital.tag}
              </span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-slate-500 text-xs">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span className="leading-snug">{hospital.address}</span>
        </div>

        {/* Hours */}
        <div className="flex items-start gap-2 text-slate-500 text-xs">
          <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span className="leading-snug">{hospital.hours}</span>
        </div>

        {/* Service chips */}
        <div className="flex flex-wrap gap-1">
          {hospital.services.slice(0, 3).map((s) => (
            <span
              key={s}
              className="text-[10px] bg-slate-50 border border-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
          {hospital.services.length > 3 && (
            <span className="text-[10px] text-slate-400 px-1 py-0.5">
              +{hospital.services.length - 3} more
            </span>
          )}
        </div>

        {/* Hover CTA */}
        <div
          className={`flex items-center gap-1 text-xs font-bold transition-all duration-200 ${
            hovered ? 'text-sky-600 translate-x-1' : 'text-slate-400'
          }`}
        >
          <span>View details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </button>
  );
};

// ─── CategorySection ──────────────────────────────────────────────────────────

interface CategorySectionProps {
  label: string;
  title: string;
  hospitals: Hospital[];
  colsClass: string;
  onSelect: (h: Hospital) => void;
  filtered: Hospital[];
}

const CategorySection: React.FC<CategorySectionProps> = ({
  label,
  title,
  hospitals,
  colsClass,
  onSelect,
  filtered,
}) => {
  const visible = hospitals.filter((h) => filtered.some((f) => f.id === h.id));
  if (visible.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 font-mono">
          {label}
        </span>
        <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{title}</h2>
      </div>
      <div className={`grid grid-cols-1 ${colsClass} gap-5`}>
        {visible.map((h) => (
          <HospitalCard key={h.id} hospital={h} onClick={() => onSelect(h)} />
        ))}
      </div>
    </section>
  );
};

// ─── DetailView ───────────────────────────────────────────────────────────────

interface DetailViewProps {
  hospital: Hospital;
  onBack: () => void;
  onNavigateDoctors: (params?: string) => void;
}

const DetailView: React.FC<DetailViewProps> = ({ hospital, onBack, onNavigateDoctors }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sticky back bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Facility Directory</span>
        </button>

        <button
          onClick={() => onNavigateDoctors(`hospital=${encodeURIComponent(hospital.name)}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Find Doctors at {hospital.name.split(' ')[0]}</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Hero header card */}
        <div
          className={`relative rounded-3xl bg-gradient-to-br ${hospital.gradient} overflow-hidden shadow-lg p-8 text-white`}
        >
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-xs">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap gap-2 mb-1.5">
                  <span className="text-[10px] font-extrabold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {hospital.type}
                  </span>
                  <span className="text-[10px] font-extrabold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {hospital.tag}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">{hospital.name}</h1>
              </div>
            </div>

            <div className="flex items-start gap-2 text-white/90 text-xs">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{hospital.address}</span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigateDoctors(`hospital=${encodeURIComponent(hospital.name)}`)}
                className="inline-flex items-center gap-2 bg-white text-sky-700 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-sky-50 transition-all cursor-pointer"
              >
                <span>Find Doctors at this Facility</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3-col body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Left col: Contact info */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-5 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Contact Information</h3>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 text-sky-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Phone Inquiry</p>
                  <p className="text-xs font-bold text-slate-800">{hospital.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 text-sky-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Operating Hours</p>
                  <p className="text-xs font-bold text-slate-800">{hospital.hours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right col: Description & Services */}
          <div className="md:col-span-2 space-y-5">
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">About This Facility</h3>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">{hospital.description}</p>
            </div>

            {/* Services */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-sky-600" />
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Clinical Specialties &amp; Services ({hospital.services.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hospital.services.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct CTA card */}
            <div className="rounded-3xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-white">
              <div>
                <h3 className="text-white font-extrabold text-sm">Consult Specialist Doctors</h3>
                <p className="text-sky-100 text-xs mt-0.5">
                  Browse doctors credentialed at {hospital.name}.
                </p>
              </div>
              <button
                onClick={() => onNavigateDoctors(`hospital=${encodeURIComponent(hospital.name)}`)}
                className="shrink-0 flex items-center gap-2 bg-white text-sky-700 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs hover:bg-sky-50 transition cursor-pointer"
              >
                <span>Find Doctors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const HospitalsPage: React.FC<HospitalsPageProps> = ({
  onNavigateLogin,
  onNavigateBack,
  onNavigateDoctors,
}) => {
  const [selected, setSelected] = useState<Hospital | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      return allHospitals.find((h) => h.id === id) || null;
    }
    return null;
  });
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allHospitals;
    return allHospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q) ||
        h.tag.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.services.some((s) => s.toLowerCase().includes(q))
    );
  }, [query]);

  // Detail view
  if (selected !== null) {
    return (
      <DetailView
        hospital={selected}
        onBack={() => {
          window.history.replaceState({}, "", "/hospitals");
          setSelected(null);
        }}
        onNavigateDoctors={onNavigateDoctors}
      />
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm">PenangHealth</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Directly accessible Find Doctors action */}
            <button
              onClick={() => onNavigateDoctors()}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-1.5 rounded-xl transition cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>Find Doctors</span>
            </button>

            <button
              onClick={onNavigateLogin}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Page header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 text-xs font-bold px-4 py-1.5 rounded-full border border-sky-200">
            <Building2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Accredited Healthcare Facilities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Penang Hospitals &amp; Clinics
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Browse private tertiary hospitals and accredited specialist clinics across Penang Island and the Mainland.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by facility name, specialty, or area…"
            className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:border-sky-500 transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Search className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
            <p className="text-xs font-bold text-slate-600">No facilities found matching "{query}"</p>
            <button
              onClick={() => setQuery('')}
              className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Category sections (Private Only) */}
        {filtered.length > 0 && (
          <div className="space-y-10">
            <CategorySection
              label="Private Specialist Centres"
              title="Accredited Private Hospitals"
              hospitals={privateHospitals}
              colsClass="sm:grid-cols-2"
              onSelect={setSelected}
              filtered={filtered}
            />
            <CategorySection
              label="Outpatient & Primary Care"
              title="Private Clinics & Ambulatory Care"
              hospitals={privateClinics}
              colsClass="sm:grid-cols-3"
              onSelect={setSelected}
              filtered={filtered}
            />
          </div>
        )}

        {/* CTA Banner */}
        {filtered.length > 0 && (
          <div className="rounded-3xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative text-white">
            {/* decorative */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />

            <div className="relative text-center md:text-left z-10 space-y-1">
              <h2 className="text-white text-lg font-extrabold">Looking for a specialist doctor?</h2>
              <p className="text-sky-100 text-xs leading-relaxed max-w-md">
                Browse credentialed doctors and medical specialists across all accredited Penang hospitals.
              </p>
            </div>

            <button
              onClick={() => onNavigateDoctors()}
              className="relative z-10 shrink-0 flex items-center gap-2 bg-white text-sky-700 font-extrabold text-xs px-6 py-3 rounded-xl shadow-xs hover:bg-sky-50 transition cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <span>Find Doctors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalsPage;
