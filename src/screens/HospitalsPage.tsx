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
  doctorCount?: number;
}

interface HospitalsPageProps {
  onNavigateLogin: () => void;
  onNavigateBack: () => void;
  onNavigateDoctors: (params?: string) => void;
}

// ─── PantaiCare Accredited Hospitals & Clinics (4 Official Facilities) ───────────

export const privateHospitals: Hospital[] = [
  {
    id: 'ph-penang',
    name: 'Pantai Hospital Penang (Main Hospital)',
    type: 'Tertiary Multi-Specialty Hospital',
    tag: 'Bayan Lepas (Main Hospital)',
    address: '82, Jalan Tengah, Bandar Bayan Baru, 11950 Bayan Lepas, Pulau Pinang',
    phone: '04-643 3888',
    hours: 'Open 24 hours, 7 days a week (Tertiary Inpatient & 24/7 A&E)',
    description:
      'The flagship tertiary medical center of the PantaiCare network in Penang, providing comprehensive 24/7 inpatient, emergency, and advanced surgical care across 18 specialized departments.',
    services: [
      'Cardiology & Interventional Cath Lab',
      'Cardiothoracic Surgery',
      'General & Laparoscopic Surgery',
      'Neurology & Acute Stroke Unit',
      'Clinical Oncology & Radiotherapy',
      'Orthopedic Surgery & Trauma',
      '24/7 Accident & Emergency',
    ],
    gradient: 'from-teal-600 to-cyan-700',
    doctorCount: 88,
  },
  {
    id: 'pantai-specialist',
    name: 'Pantai Specialist Centre',
    type: 'Outpatient Specialist Centre',
    tag: 'Ayer Itam Branch',
    address: '588, Jalan Air Itam, 11500 Ayer Itam, Pulau Pinang',
    phone: '04-828 5588',
    hours: 'Mon–Sat: 8:00 AM – 8:00 PM | Sun: Closed',
    description:
      'Center of excellence for orthopedic trauma, sports medicine, post-operative rehabilitation, ear-nose-throat (ENT), and ophthalmology.',
    services: [
      'Orthopedic Surgery & Arthroplasty',
      'Sports Medicine & Arthroscopy',
      'Physical Rehabilitation Medicine',
      'Ear, Nose & Throat (ENT)',
      'Ophthalmology & Cataract Eye Care',
    ],
    gradient: 'from-blue-600 to-indigo-700',
    doctorCount: 24,
  },
];

export const privateClinics: Hospital[] = [
  {
    id: 'pantai-pavilion',
    name: 'Pantai Heart & Wellness Pavilion',
    type: 'Cardiovascular & Wellness Pavilion',
    tag: 'Georgetown Branch',
    address: '128, Jalan Burma, 10050 Georgetown, Pulau Pinang',
    phone: '04-226 7888',
    hours: 'Mon–Fri: 8:30 AM – 5:30 PM | Sat: 8:30 AM – 1:00 PM',
    description:
      'Specialized cardiovascular, metabolic health, and preventive wellness pavilion situated in central Georgetown, providing comprehensive non-invasive cardiac diagnostics and executive health screenings.',
    services: [
      'Cardiology & Echocardiography',
      'Endocrinology & Diabetes Care',
      'Internal Medicine & Hypertension',
      'Executive Health Screening Packages',
    ],
    gradient: 'from-sky-500 to-blue-600',
    doctorCount: 24,
  },
  {
    id: 'pantai-premier',
    name: 'Pantai Premier Clinic & Day Surgery',
    type: 'Ambulatory & Day Surgery Centre',
    tag: 'Bayan Baru Branch',
    address: '1-1-15, Tingkat Mahsuri, 11950 Bayan Baru, Pulau Pinang',
    phone: '04-641 2288',
    hours: 'Mon–Sat: 8:00 AM – 9:00 PM | Sun: 9:00 AM – 1:00 PM',
    description:
      'Ambulatory surgical and outpatient specialist hub providing rapid GI endoscopies, minor surgeries, dermatology, dental surgery, and family medicine.',
    services: [
      'Gastroenterology & Endoscopy',
      'Upper GI & Colorectal Surgery',
      'Dermatology & Skin Consultations',
      'Plastic & Reconstructive Surgery',
      'Dental Surgery & Dentistry',
      'General Practice & Family Medicine',
    ],
    gradient: 'from-teal-500 to-emerald-600',
    doctorCount: 24,
  },
];

export const allHospitals: Hospital[] = [...privateHospitals, ...privateClinics];

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
  label?: string;
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
        {label && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 font-mono">
            {label}
          </span>
        )}
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
              title="Accredited Private Hospitals"
              hospitals={privateHospitals}
              colsClass="sm:grid-cols-2"
              onSelect={setSelected}
              filtered={filtered}
            />
            <CategorySection
              title="Private Clinics & Ambulatory Care"
              hospitals={privateClinics}
              colsClass="sm:grid-cols-3"
              onSelect={setSelected}
              filtered={filtered}
            />
          </div>
        )}


      </div>
    </div>
  );
};

export default HospitalsPage;
