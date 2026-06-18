import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Building2,
  Stethoscope,
  Heart,
  Baby,
  Brain,
  Bone,
  Shield,
  Clock,
  Users,
  CalendarCheck,
  Activity,
  Star,
  MapPin,
  CheckCircle,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Microscope,
  Phone,
} from "lucide-react";

interface RootLandingPageProps {
  onNavigateLogin: () => void;
  onNavigateHospitals: (params?: string) => void;
  onNavigateDoctors: (params?: string) => void;
}

/* ─── STATIC PREVIEW DATA ───────────────────────────────────── */

const featuredHospitals = [
  { id: "hpg", name: "Hospital Pulau Pinang", type: "Government Hospital", tag: "24/7 Emergency", gradient: "from-teal-500 to-teal-600" },
  { id: "hsj", name: "Hospital Seberang Jaya", type: "Government Hospital", tag: "Largest in Seberang", gradient: "from-sky-500 to-sky-600" },
  { id: "pantai", name: "Pantai Hospital Penang", type: "Private Hospital", tag: "Specialist Centre", gradient: "from-rose-500 to-rose-600" },
  { id: "gleneagles", name: "Gleneagles Hospital Penang", type: "Private Hospital", tag: "International Standards", gradient: "from-indigo-500 to-indigo-600" },
];

const allHospitalsList = [
  { id: "hpg", name: "Hospital Pulau Pinang" },
  { id: "hsj", name: "Hospital Seberang Jaya" },
  { id: "kkjp", name: "Klinik Kesihatan Jalan Perak" },
  { id: "kkbb", name: "Klinik Kesihatan Bayan Baru" },
  { id: "pantai", name: "Pantai Hospital Penang" },
  { id: "lwe", name: "Hospital Lam Wah Ee" },
  { id: "gleneagles", name: "Gleneagles Hospital Penang" },
  { id: "island", name: "Island Hospital" },
  { id: "adv", name: "Penang Adventist Hospital" },
  { id: "loh", name: "Loh Guan Lye Specialists Centre" },
  { id: "hbm", name: "Hospital Bukit Mertajam" },
  { id: "kpj", name: "KPJ Penang Specialist Hospital" },
  { id: "o2", name: "O2 Klinik" },
  { id: "ks", name: "Klinik Singapore" },
  { id: "pp", name: "Poliklinik Perdana" },
];

const specialties = [
  { id: "cardiology", name: "Cardiology", icon: Heart, desc: "Heart & cardiovascular care", count: 3 },
  { id: "internal-medicine", name: "Internal Medicine & Inf. Diseases", icon: Microscope, desc: "Complex metabolic & viral conditions", count: 2 },
  { id: "pediatrics", name: "Pediatrics", icon: Baby, desc: "Child & newborn healthcare", count: 3 },
  { id: "general-surgery", name: "General Surgery", icon: Stethoscope, desc: "Operative & laparoscopic care", count: 3 },
  { id: "neurology", name: "Neurology", icon: Brain, desc: "Brain & nervous system disorders", count: 2 },
  { id: "gastro-urology", name: "Gastroenterology & Urology", icon: Bone, desc: "GI, liver & urinary tract", count: 2 },
  { id: "orthopedics", name: "Orthopedics & Sports Medicine", icon: Bone, desc: "Bones, joints & sports injuries", count: 2 },
  { id: "gp-family", name: "General Practice & Family Medicine", icon: Stethoscope, desc: "Primary care & outpatient services", count: 11 },
];

const stats = [
  { value: "15", label: "Partner Facilities" },
  { value: "28", label: "Specialist Doctors" },
  { value: "10K+", label: "Appointments Booked" },
  { value: "98%", label: "Patient Satisfaction" },
];

const features = [
  { icon: CalendarCheck, title: "Smart Appointment Booking", desc: "Book, reschedule or cancel in seconds across all Penang partner hospitals and clinics.", bg: "bg-teal-50", accent: "text-teal-600", border: "border-teal-100" },
  { icon: Shield, title: "Unified Secure Login", desc: "One login for Patients, Doctors, Nurses and Admins — each routed to their own dashboard.", bg: "bg-sky-50", accent: "text-sky-600", border: "border-sky-100" },
  { icon: Activity, title: "Live Health Monitoring", desc: "Track vitals, medical history and lab results in a privacy-first electronic health record.", bg: "bg-rose-50", accent: "text-rose-600", border: "border-rose-100" },
  { icon: Users, title: "Doctor–Patient Messaging", desc: "Communicate directly with your care team via secure in-app messaging with read receipts.", bg: "bg-amber-50", accent: "text-amber-600", border: "border-amber-100" },
  { icon: Clock, title: "Real-time Availability", desc: "See live doctor schedules and grab the earliest available slot — no phone calls needed.", bg: "bg-emerald-50", accent: "text-emerald-600", border: "border-emerald-100" },
  { icon: Star, title: "Patient Reviews & Ratings", desc: "Read verified patient reviews to choose the right specialist with confidence.", bg: "bg-violet-50", accent: "text-violet-600", border: "border-violet-100" },
];

const testimonials = [
  { name: "Lim Mei Ling", role: "Patient — Cardiology", text: "Booking my cardiologist appointment used to take a week of phone calls. Now I do it in under 2 minutes.", stars: 5 },
  { name: "Dr. Azmi Bin Osman", role: "Consultant, Penang General", text: "The staff dashboard is incredibly intuitive. I can review all my patients' histories in one place.", stars: 5 },
  { name: "Siti Rahimah", role: "Patient — Pediatrics", text: "I love that I can track my son's vaccination schedule and medical records from my phone.", stars: 5 },
];

export default function RootLandingPage({
  onNavigateLogin,
  onNavigateHospitals,
  onNavigateDoctors,
}: RootLandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedQuickHospital, setSelectedQuickHospital] = useState("Hospital Pulau Pinang");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          NAVBAR — direct links, no dropdowns
      ══════════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm"
            : "bg-white/80 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center shadow-md shadow-teal-500/30">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-800">
              Penang<span className="text-teal-600">Health</span>
            </span>
          </a>

          {/* Desktop nav — plain buttons, click → page directly */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={onNavigateHospitals}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors px-4 py-2 rounded-lg hover:bg-teal-50"
            >
              <Building2 className="w-3.5 h-3.5" />
              Hospitals / Clinics
            </button>
            <button
              onClick={onNavigateDoctors}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors px-4 py-2 rounded-lg hover:bg-sky-50"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Doctors
            </button>
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              About
            </a>
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onNavigateLogin}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateLogin}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-teal-500/25 transition-all hover:-translate-y-px"
            >
              Book Now <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 pb-6 pt-2 shadow-lg">
            <button
              onClick={() => { onNavigateHospitals(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-teal-50 text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors"
            >
              <Building2 className="w-4 h-4" /> Hospitals / Clinics
            </button>
            <button
              onClick={() => { onNavigateDoctors(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-sky-50 text-sm font-semibold text-slate-700 hover:text-sky-700 transition-colors"
            >
              <Stethoscope className="w-4 h-4" /> Doctors
            </button>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors"
            >
              Features
            </a>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={onNavigateLogin}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 text-white font-bold text-sm shadow-md shadow-teal-500/25"
              >
                Book Now / Sign In
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-24 px-6 lg:px-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[55%] h-[80%] rounded-full bg-gradient-to-bl from-teal-100/80 via-sky-50/60 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-[-5%] w-[40%] h-[55%] rounded-full bg-gradient-to-tr from-violet-100/40 to-transparent blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Live badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              Penang's Unified Digital Healthcare Platform — Now Live
            </div>
          </div>

          <h1 className="text-center text-4xl sm:text-5xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.07] max-w-5xl mx-auto text-slate-900">
            Penang Centralized{" "}
            <span className="bg-gradient-to-r from-teal-500 via-sky-500 to-violet-500 bg-clip-text text-transparent">
              Smart Healthcare Gate
            </span>
          </h1>

          <p className="mt-7 text-center text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            One unified gateway for patients, doctors, nurses and administrators across
            Penang's public hospitals and government clinics — book appointments, manage
            health records, and connect with your care team securely.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-lg shadow-teal-500/30 transition-all hover:-translate-y-0.5"
            >
              Book Now / Sign In <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateHospitals}
              className="inline-flex items-center gap-2 border-2 border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-semibold text-sm px-8 py-4 rounded-2xl transition-all"
            >
              Explore Facilities <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-5 text-center hover:border-teal-200 hover:bg-teal-50/40 transition-colors">
                <p className="text-2xl font-extrabold text-teal-600">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOSPITALS PREVIEW — 4 featured, click → explore detail
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-teal-600 font-bold mb-2">Partner Network</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Hospitals & Clinics</h2>
            <p className="mt-2 text-slate-500 text-sm">15 partner facilities — government and private. Click any to explore services and book.</p>
          </div>
          <button onClick={() => onNavigateHospitals()} className="shrink-0 flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 px-5 py-2.5 rounded-xl transition-all">
            View All 15 Facilities <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredHospitals.map((h) => (
            <button
              key={h.id}
              onClick={() => onNavigateHospitals(`id=${h.id}`)}
              className="group text-left rounded-2xl border-2 border-slate-100 bg-white hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/8 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
            >
              <div className={`h-1.5 w-full bg-gradient-to-r ${h.gradient}`} />
              <div className="p-5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${h.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors">{h.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{h.type}</p>
                <span className="inline-block mt-2 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">{h.tag}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DOCTORS PREVIEW — click card → /doctors page
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-10 max-w-7xl mx-auto bg-slate-50/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-sky-600 font-bold mb-2">Medical Specialties</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Our Doctors</h2>
            <p className="mt-2 text-slate-500 text-sm">Browse specialties to find the right doctor — no login required.</p>
          </div>
          <button
            onClick={() => onNavigateDoctors()}
            className="shrink-0 flex items-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-700 border-2 border-sky-200 hover:border-sky-300 hover:bg-sky-50 px-5 py-2.5 rounded-xl transition-all"
          >
            View All Doctors <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {specialties.slice(0, 4).map((s) => (
            <button
              key={s.id}
              onClick={() => onNavigateDoctors(`specialty=${s.id}`)}
              className="group text-left rounded-3xl border-2 border-slate-100 bg-white hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-200 hover:-translate-y-1 p-7"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-teal-100 border border-sky-200 flex items-center justify-center mb-5 group-hover:from-sky-200 group-hover:to-teal-200 transition-colors">
                <s.icon className="w-6 h-6 text-sky-600" />
              </div>
              <p className="text-base font-extrabold text-slate-900 group-hover:text-sky-700 transition-colors">
                {s.name}
              </p>
              <p className="text-sm text-slate-400 mt-1.5 mb-4">{s.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {s.count} specialist{s.count !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  View doctors <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          QUICK ACTIONS — Select Hospital → Find Doctors
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-100 p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-teal-600 font-bold mb-2">Ready to Book?</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
                Find Doctors Here
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Browse specialist doctors available at Hospital Pulau Pinang or any of our other 14 partner facilities. Select a hospital or clinic to view its specific medical staff.
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="relative min-w-[260px]">
                <select
                  value={selectedQuickHospital}
                  onChange={(e) => setSelectedQuickHospital(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-semibold pl-4 pr-10 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent appearance-none"
                >
                  {allHospitalsList.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <button
                onClick={() => onNavigateDoctors(`hospital=${encodeURIComponent(selectedQuickHospital)}`)}
                className="bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md shadow-teal-500/20 transition-all hover:-translate-y-0.5 whitespace-nowrap text-center"
              >
                Find Doctors
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY DIGITAL
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-teal-400 font-bold mb-4">Our Mission</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-5 leading-tight">
                Why Penang's Healthcare is Going Digital
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                The Ministry of Health Malaysia's{" "}
                <span className="text-slate-200 font-semibold">MyHealth Portal</span> initiative
                identifies Penang as a pilot state for centralised digital health records.
              </p>
              {[
                "Zero paperwork — digital records synced across facilities",
                "Reduced patient waiting times by up to 40%",
                "Secure, PDPA-compliant health data management",
                "Accessible from any device, anywhere in Penang",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 mb-3">
                  <CheckCircle className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: MapPin,  label: "Coverage",     value: "Both Penang Districts" },
                { icon: Phone,   label: "Support",      value: "24/7 Available" },
                { icon: Shield,  label: "Security",     value: "PDPA Compliant" },
                { icon: Clock,   label: "Avg. Booking", value: "Under 2 Minutes" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/6 border border-white/10 p-5">
                  <item.icon className="w-5 h-5 text-teal-400 mb-2" />
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-10 max-w-7xl mx-auto" id="features">
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-violet-600 font-bold mb-3">Platform Features</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Everything You Need, In One Place</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`rounded-3xl border-2 ${f.border} ${f.bg} p-7 hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white border ${f.border} flex items-center justify-center mb-5 shadow-sm`}>
                <f.icon className={`w-5 h-5 ${f.accent}`} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-10 max-w-7xl mx-auto" id="about">
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-sky-600 p-10 lg:p-14">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-teal-200 font-bold mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Your Health Journey, Simplified</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { step: "01", title: "Browse & Explore",    desc: "Explore hospitals, clinics and doctors by specialty — no account needed to browse." },
              { step: "02", title: "Sign In or Register", desc: "Create a free patient account or sign in. One login for patients, doctors, nurses and admins." },
              { step: "03", title: "Book & Manage Care",  desc: "Book appointments, view records, track prescriptions and message your doctor — all in one place." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-5 text-white font-black text-xl">
                  {item.step}
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-teal-100/80 leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-rose-500 font-bold mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Trusted by Penang's Health Community</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-3xl border-2 border-slate-100 bg-white p-7 flex flex-col gap-4 hover:border-teal-100 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">"{t.text}"</p>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-slate-900 p-12 lg:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[45%] h-full rounded-full bg-teal-600/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-[40%] h-full rounded-full bg-sky-600/10 blur-[80px]" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
              Ready to Transform Your
              <br />
              <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">
                Healthcare Experience?
              </span>
            </h2>
            <p className="text-slate-400 text-base mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of Penang residents managing their health smarter.
              Sign in or register as a patient in under 2 minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-white font-bold text-base px-10 py-4 rounded-2xl shadow-2xl shadow-teal-500/30 transition-all hover:-translate-y-0.5"
              >
                Book Now / Sign In <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onNavigateHospitals}
                className="inline-flex items-center gap-2 border-2 border-white/20 text-slate-300 hover:text-white hover:border-white/40 font-semibold text-base px-8 py-4 rounded-2xl transition-all"
              >
                Browse Facilities <Building2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-100 py-10 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center shadow-sm">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              Penang<span className="text-teal-600">Health</span> Gate
            </span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} Penang Centralized Smart Healthcare Gate. Built for the people of Penang.
          </p>
          <div className="flex gap-5">
            <button onClick={onNavigateHospitals} className="text-xs text-slate-400 hover:text-teal-600 transition-colors font-medium">Hospitals</button>
            <button onClick={onNavigateDoctors}   className="text-xs text-slate-400 hover:text-sky-600  transition-colors font-medium">Doctors</button>
            <button onClick={onNavigateLogin}      className="text-xs text-slate-400 hover:text-slate-700 transition-colors font-medium">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
