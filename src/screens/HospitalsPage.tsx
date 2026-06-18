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

// ─── Data ────────────────────────────────────────────────────────────────────

export const publicHospitals: Hospital[] = [
  {
    id: 'hpg',
    name: 'Hospital Pulau Pinang',
    type: 'Government Hospital',
    tag: '24/7 Emergency',
    address: 'Jalan Residensi, 10990 Georgetown, Penang',
    phone: '04-222 5333',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'The largest public hospital in Penang and the main referral centre for Penang Island. It provides comprehensive specialist services including emergency, cardiology, oncology, and intensive care.',
    services: [
      'Emergency & Trauma Centre',
      'Cardiology & Cardiac Surgery',
      'Oncology & Cancer Care',
      'Internal Medicine',
      'Infectious Diseases',
      'Neurology & Neurosurgery',
      'Intensive Care Unit (ICU)',
      'Obstetrics & Gynaecology',
      'Radiology & Imaging',
    ],
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    id: 'hsj',
    name: 'Hospital Seberang Jaya',
    type: 'Government Hospital',
    tag: 'Largest in Seberang',
    address: 'Jalan Tun Hussein Onn, 13700 Seberang Jaya, Penang',
    phone: '04-382 3333',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'The main public hospital serving the Seberang Perai region. Specialises in pediatrics, obstetrics, and general surgery for the mainland Penang population.',
    services: [
      'Pediatrics & Neonatology',
      'Obstetrics & Maternity',
      'General Surgery',
      'Internal Medicine',
      'Pharmacy & Dispensary',
      'Pathology & Laboratory',
      'Rehabilitation Services',
    ],
    gradient: 'from-sky-500 to-sky-600',
  },
  {
    id: 'kkjp',
    name: 'Klinik Kesihatan Jalan Perak',
    type: 'Government Clinic',
    tag: 'Primary Care',
    address: 'Jalan Perak, 10150 Georgetown, Penang',
    phone: '04-261 5266',
    hours: 'Mon–Fri: 7:30 AM – 5:00 PM | Sat: 7:30 AM – 1:00 PM',
    description:
      'A government primary care clinic in Georgetown providing affordable outpatient care, chronic disease management, and community health services for urban Penang Island residents.',
    services: [
      'General Outpatient Care',
      'Maternal & Child Health',
      'Chronic Disease Management',
      'Immunisation & Vaccination',
      'Family Planning',
      'Health Screenings',
      'Oral Health Services',
    ],
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    id: 'kkbb',
    name: 'Klinik Kesihatan Bayan Baru',
    type: 'Government Clinic',
    tag: 'Family Health',
    address: 'Jalan Mahsuri, 11950 Bayan Baru, Penang',
    phone: '04-642 2222',
    hours: 'Mon–Fri: 7:30 AM – 5:00 PM | Sat: 7:30 AM – 1:00 PM',
    description:
      'Serves the Bayan Baru township with a focus on family medicine, non-communicable disease management, and dental services.',
    services: [
      'Family Medicine',
      'Dental & Oral Care',
      'Non-Communicable Diseases',
      'Mental Health & Counselling',
      'Elderly Care',
      'Antenatal & Postnatal',
      'Nutritional Counselling',
    ],
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'hbm',
    name: 'Hospital Bukit Mertajam',
    type: 'Government Hospital',
    tag: 'District Care',
    address: 'Jalan Kulim, 14000 Bukit Mertajam, Penang',
    phone: '04-549 7333',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'A public hospital located in Bukit Mertajam serving the Central Seberang Perai district with outpatient, emergency, pediatric, and general medicine services.',
    services: ['Emergency & Trauma Care', 'Pediatrics & Child Health', 'General Medicine', 'Obstetrics & Gynaecology'],
    gradient: 'from-teal-400 to-emerald-500',
  },
];

export const privateHospitals: Hospital[] = [
  {
    id: 'pantai',
    name: 'Pantai Hospital Penang',
    type: 'Private Hospital',
    tag: 'Specialist Centre',
    address: '82 Jalan Tengah, 10450 Georgetown, Penang',
    phone: '04-643 3888',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'A leading private hospital in Penang offering world-class specialist care in cardiology, orthopedics, and oncology with modern surgical suites and international-standard facilities.',
    services: [
      'Cardiology & Interventional Cardiology',
      'Orthopedic & Sports Surgery',
      'Oncology',
      'Obstetrics & Gynaecology',
      'Neurosurgery',
      'Ophthalmology',
      'ENT',
      'ICU & Emergency',
    ],
    gradient: 'from-rose-500 to-rose-600',
  },
  {
    id: 'lwe',
    name: 'Hospital Lam Wah Ee',
    type: 'Private Hospital',
    tag: 'Community Trust',
    address: '141 Jalan Tan Sri Teh Ewe Lim, 11600 Georgetown, Penang',
    phone: '04-652 2888',
    hours: 'Open 24 hours, 7 days a week',
    description:
      "One of Penang's oldest and most trusted private hospitals, known for its general surgery, urology, and affordable specialist care for the local community.",
    services: [
      'General Surgery (Laparoscopic)',
      'Urology & Renal Services',
      'Internal Medicine',
      'Gastroenterology',
      'Orthopaedics',
      'Obstetrics',
      'Anaesthesiology',
    ],
    gradient: 'from-amber-500 to-amber-600',
  },
  {
    id: 'gleneagles',
    name: 'Gleneagles Hospital Penang',
    type: 'Private Hospital',
    tag: 'International Standards',
    address: '1 Jalan Pangkor, 10050 Georgetown, Penang',
    phone: '04-222 9111',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'An internationally-accredited private hospital offering advanced cardiology, neurology, and full specialist services to both local and medical tourism patients.',
    services: [
      'Interventional Cardiology',
      'Neurology & Stroke Unit',
      'General Surgery',
      'Paediatrics',
      'Oncology & Radiation',
      'Orthopaedics',
      'Rehabilitation',
      'International Patient Services',
    ],
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    id: 'island',
    name: 'Island Hospital',
    type: 'Private Hospital',
    tag: 'Centre of Excellence',
    address: '308 Macalister Road, 10450 Georgetown, Penang',
    phone: '04-228 8222',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'A renowned Penang private hospital with a strong track record in gastroenterology, hepatology, and paediatrics, with award-winning specialist teams and modern diagnostic equipment.',
    services: [
      'Gastroenterology & Hepatology',
      'Paediatrics & Child Health',
      'Cardiology',
      'General Surgery',
      'Haematology & Oncology',
      'Radiology',
      'Emergency & Trauma',
    ],
    gradient: 'from-cyan-500 to-cyan-600',
  },
  {
    id: 'adv',
    name: 'Penang Adventist Hospital',
    type: 'Private Hospital',
    tag: 'Community Trust',
    address: '465 Jalan Burma, 10350 Georgetown, Penang',
    phone: '04-222 7200',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'Established in 1924, Penang Adventist Hospital is a non-profit private hospital and part of the international Adventist Health Network, offering comprehensive specialist services and a dedicated oncology and cardiac center.',
    services: ['Cardiology & Interventional Cardiology', 'Oncology & Cancer Care', 'Internal Medicine', 'General Surgery', 'Pediatrics & Child Health', 'Orthopedic & Sports Surgery'],
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'loh',
    name: 'Loh Guan Lye Specialists Centre',
    type: 'Private Hospital',
    tag: 'Multi-Specialty',
    address: '238 Macalister Road, 10400 Georgetown, Penang',
    phone: '04-238 8888',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'A premier private hospital in the heart of Georgetown offering a wide range of medical specialties, diagnostic imaging, and health screening packages with state-of-the-art facilities.',
    services: ['Cardiology', 'Neurology & Stroke Unit', 'Internal Medicine', 'General Surgery', 'Pediatrics & Child Health', 'Orthopedic & Sports Surgery'],
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'kpj',
    name: 'KPJ Penang Specialist Hospital',
    type: 'Private Hospital',
    tag: 'KPJ Healthcare Network',
    address: '570 Jalan Perda Utama, Bandar Perda, 14000 Bukit Mertajam, Penang',
    phone: '04-548 6688',
    hours: 'Open 24 hours, 7 days a week',
    description:
      'Part of the KPJ Healthcare Group, providing high-quality specialist services on the mainland of Penang including cardiology, orthopedics, and robotic surgery.',
    services: ['Cardiology', 'Orthopedic & Sports Surgery', 'General Surgery', 'Pediatrics', 'Internal Medicine'],
    gradient: 'from-sky-400 to-blue-600',
  },
];

export const privateClinics: Hospital[] = [
  {
    id: 'o2',
    name: 'O2 Klinik',
    type: 'Private Clinic',
    tag: 'GP & Aesthetics',
    address: 'Penang Island (Multiple Branches)',
    phone: '04-XXX XXXX',
    hours: 'Mon–Sat: 8:30 AM – 9:00 PM',
    description:
      'A modern private GP and aesthetics clinic offering general medicine, dermatology, and wellness services for Georgetown residents.',
    services: [
      'General Medicine',
      'Dermatology & Skin Health',
      'Aesthetics',
      'Chronic Disease Screening',
      'Health Screenings',
      'Minor Surgical Procedures',
    ],
    gradient: 'from-orange-400 to-orange-500',
  },
  {
    id: 'ks',
    name: 'Klinik Singapore',
    type: 'Private Clinic',
    tag: 'Community Clinic',
    address: 'Georgetown, Penang',
    phone: '04-XXX XXXX',
    hours: 'Mon–Sat: 8:00 AM – 6:00 PM',
    description:
      'A trusted community GP clinic in Penang Island providing affordable family medicine, acute care, and prescription services for local residents.',
    services: [
      'Family Medicine',
      'Acute Illness Care',
      'Vaccinations',
      'Minor Wound Care',
      'Health Certificates',
      'Prescription Renewals',
    ],
    gradient: 'from-teal-400 to-teal-500',
  },
  {
    id: 'pp',
    name: 'Poliklinik Perdana',
    type: 'Private Clinic',
    tag: 'Occupational Health',
    address: 'Penang (Mainland & Island)',
    phone: '04-XXX XXXX',
    hours: 'Mon–Fri: 8:00 AM – 5:30 PM',
    description:
      'A multi-branch private clinic in Penang specialising in occupational health screenings, corporate medical panels, and general practice for industrial zone employees.',
    services: [
      'Occupational Health Screenings',
      'Corporate Medical Panels',
      'General Practice',
      'Industrial Health Clearance',
      'Wellness Programmes',
    ],
    gradient: 'from-lime-500 to-lime-600',
  },
];

const allHospitals = [...publicHospitals, ...privateHospitals, ...privateClinics];

// ─── Helper: type badge colour ────────────────────────────────────────────────

function typeBadgeClass(type: string): string {
  if (type.includes('Government Hospital')) return 'bg-teal-100 text-teal-700';
  if (type.includes('Government Clinic')) return 'bg-violet-100 text-violet-700';
  if (type.includes('Private Hospital')) return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
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
      className="group w-full text-left bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
    >
      {/* colour strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${hospital.gradient}`} />

      <div className="p-5 flex flex-col gap-3">
        {/* icon + name row */}
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br ${hospital.gradient} flex items-center justify-center shadow-md`}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm leading-snug truncate">
              {hospital.name}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeClass(hospital.type)}`}
              >
                {hospital.type}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {hospital.tag}
              </span>
            </div>
          </div>
        </div>

        {/* address */}
        <div className="flex items-start gap-2 text-gray-500 text-xs">
          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
          <span className="leading-snug">{hospital.address}</span>
        </div>

        {/* hours */}
        <div className="flex items-start gap-2 text-gray-500 text-xs">
          <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
          <span className="leading-snug">{hospital.hours}</span>
        </div>

        {/* service chips */}
        <div className="flex flex-wrap gap-1">
          {hospital.services.slice(0, 3).map((s) => (
            <span
              key={s}
              className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
          {hospital.services.length > 3 && (
            <span className="text-xs text-gray-400 px-1 py-0.5">
              +{hospital.services.length - 3} more
            </span>
          )}
        </div>

        {/* hover CTA */}
        <div
          className={`flex items-center gap-1 text-xs font-semibold transition-all duration-200 ${
            hovered ? 'text-teal-600 translate-x-1' : 'text-gray-400'
          }`}
        >
          View details <ChevronRight className="w-3.5 h-3.5" />
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
        <span className="text-xs font-semibold uppercase tracking-widest text-teal-500">
          {label}
        </span>
        <h2 className="text-xl font-bold text-gray-800 mt-0.5">{title}</h2>
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
    <div className="min-h-screen bg-gray-50">
      {/* sticky back bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hospitals
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero header card */}
        <div
          className={`relative rounded-3xl bg-gradient-to-br ${hospital.gradient} overflow-hidden shadow-xl`}
        >
          {/* decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />

          <div className="relative p-8 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap gap-2 mb-1">
                  <span className="text-xs font-semibold bg-white/20 text-white px-3 py-0.5 rounded-full backdrop-blur-sm">
                    {hospital.type}
                  </span>
                  <span className="text-xs font-semibold bg-white/20 text-white px-3 py-0.5 rounded-full backdrop-blur-sm">
                    {hospital.tag}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{hospital.name}</h1>
              </div>
            </div>

            <div className="flex items-start gap-2 text-white/80 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{hospital.address}</span>
            </div>

            <button
              onClick={() => onNavigateDoctors(`hospital=${encodeURIComponent(hospital.name)}`)}
              className="mt-2 self-start flex items-center gap-2 bg-white text-teal-600 font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Book Appointment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-col body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* LEFT col */}
          <div className="flex flex-col gap-5">
            {/* Contact info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">Contact Information</h3>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-700">{hospital.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Operating Hours</p>
                  <p className="text-sm font-medium text-gray-700 leading-snug">{hospital.hours}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-sm font-medium text-gray-700 leading-snug">
                    {hospital.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Quick Actions</h3>
              <button
                onClick={() => onNavigateDoctors(`hospital=${encodeURIComponent(hospital.name)}`)}
                className="w-full flex items-center justify-between text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 px-4 py-3 rounded-2xl transition-colors"
              >
                <span>Find Doctors Here</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT 2 cols */}
          <div className="md:col-span-2 flex flex-col gap-5">
            {/* About */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-teal-500" />
                <h3 className="font-semibold text-gray-800 text-sm">About</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{hospital.description}</p>
            </div>

            {/* Services */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-teal-500" />
                <h3 className="font-semibold text-gray-800 text-sm">
                  Available Services ({hospital.services.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hospital.services.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA card */}
            <div className="rounded-3xl bg-gradient-to-r from-teal-500 to-sky-500 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div>
                <h3 className="text-white font-bold text-base">Ready to Book?</h3>
                <p className="text-white/80 text-sm mt-0.5">
                  Browse specialist doctors available at {hospital.name}.
                </p>
              </div>
              <button
                onClick={() => onNavigateDoctors(`hospital=${encodeURIComponent(hospital.name)}`)}
                className="flex-shrink-0 flex items-center gap-2 bg-white text-teal-600 font-semibold text-sm px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Find Doctors
                <ArrowRight className="w-4 h-4" />
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
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center shadow-sm">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-800 text-sm">MediConnect</span>
        </div>
        <button
          onClick={onNavigateLogin}
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          Sign In
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Page header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-600 text-xs font-semibold px-4 py-1.5 rounded-full">
            <Building2 className="w-3.5 h-3.5" />
            Penang Healthcare Directory
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">
            Hospitals & Clinics
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Explore public and private healthcare facilities across Penang Island and Seberang Perai.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, type, or service…"
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <Search className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-sm font-medium">No hospitals found for "{query}"</p>
            <button
              onClick={() => setQuery('')}
              className="text-xs text-teal-500 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Category sections */}
        {filtered.length > 0 && (
          <>
            <CategorySection
              label="Public Government Facilities"
              title="Government Hospitals & Clinics"
              hospitals={publicHospitals}
              colsClass="sm:grid-cols-2"
              onSelect={setSelected}
              filtered={filtered}
            />
            <CategorySection
              label="Private Specialist Hospitals"
              title="Private Hospitals"
              hospitals={privateHospitals}
              colsClass="sm:grid-cols-2"
              onSelect={setSelected}
              filtered={filtered}
            />
            <CategorySection
              label="Private Clinics"
              title="GP & Specialist Clinics"
              hospitals={privateClinics}
              colsClass="sm:grid-cols-3"
              onSelect={setSelected}
              filtered={filtered}
            />
          </>
        )}

        {/* CTA Banner */}
        {filtered.length > 0 && (
          <div className="rounded-3xl bg-gradient-to-r from-teal-500 to-sky-500 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl overflow-hidden relative">
            {/* decorative */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />

            <div className="relative text-center md:text-left">
              <h2 className="text-white text-xl font-bold">Looking for a doctor?</h2>
              <p className="text-white/80 text-sm mt-1">
                Browse specialist doctors available across all Penang facilities.
              </p>
            </div>

            <button
              onClick={onNavigateDoctors}
              className="relative flex-shrink-0 flex items-center gap-2 bg-white text-teal-600 font-semibold text-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Find Doctors
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalsPage;
