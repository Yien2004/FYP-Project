import React, { useState } from "react";
import { 
  Search, 
  Bot, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  PhoneCall, 
  Clock, 
  Award, 
  Users, 
  Activity, 
  Calendar,
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  ChevronRight,
  Stethoscope,
  HeartPulse
} from "lucide-react";

interface LandingPageProps {
  onNavigateLogin: () => void;
}

export default function LandingPage({ onNavigateLogin }: LandingPageProps) {
  const [selectedHospital, setSelectedHospital] = useState("Pantai Hospital Penang");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Consultant Cardiologist");

  const partnerHospitals = [
    { name: "Pantai Hospital Penang", area: "Bayan Baru", waitTime: "~14 Mins", badge: "Accredited JCI" },
    { name: "Gleneagles Hospital Penang", area: "George Town", waitTime: "~16 Mins", badge: "Premier Tertiary" },
    { name: "Island Hospital", area: "Peel Avenue", waitTime: "~11 Mins", badge: "Medical Tourism Centre" },
    { name: "Loh Guan Lye Specialists Centre", area: "Logan Road", waitTime: "~12 Mins", badge: "Specialist Hub" },
    { name: "Lam Wah Ee Hospital", area: "Jalan Perak", waitTime: "~15 Mins", badge: "Acute & Outpatient" },
    { name: "KPJ Penang Specialist Hospital", area: "Bukit Mertajam", waitTime: "~22 Mins", badge: "Mainland Campus" },
  ];

  const corePillars = [
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      tag: "Live Telemetry",
      title: "Real-Time Outpatient Queue Radar",
      desc: "Monitor your exact queue ticket and live physician consultation counter from home. Receive arrival notifications within the optimal 5–10 minute check-in window.",
      highlight: "Reduces lobby waiting by 42%"
    },
    {
      icon: <MapPin className="w-6 h-6 text-emerald-600" />,
      tag: "Facility Finder",
      title: "Nearby Hospital & Clinic Discovery",
      desc: "Instantly locate nearby hospitals and clinics based on your current location or selected region, view available healthcare services, and check real-time queue delays.",
      highlight: "Proximity-based GPS matching"
    },
    {
      icon: <Bot className="w-6 h-6 text-indigo-600" />,
      tag: "Intelligent Triage",
      title: "Health Assistant Pre-Consultation",
      desc: "Audit symptoms prior to your visit. The Health Assistant analyzes reported concerns, recommends suitable healthcare services, and identifies nearby hospital facilities.",
      highlight: "AI-assisted clinical guidance"
    },
    {
      icon: <Calendar className="w-6 h-6 text-sky-600" />,
      tag: "Online Booking",
      title: "Seamless Appointment Scheduling",
      desc: "Select preferred specialist physicians, schedule available time slots, and monitor real-time queue numbers and estimated wait times.",
      highlight: "Real-time slot reservation"
    }
  ];

  return (
    <div id="landing-container" className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      
      {/* 1. TOP ANNOUNCEMENT & CONTACT STRIP (Clean light design) */}
      <div className="bg-slate-100 text-slate-600 text-[11px] font-medium py-2 px-4 sm:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Emergency 999
            </span>
            <span>Penang Hospital Hotline: <strong className="text-slate-900 font-mono">+60 4-222 7788</strong></span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline text-slate-500">Integrated Outpatient Network across Penang</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[10px]">
            <span className="flex items-center gap-1 text-sky-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              Outpatient Network: Active
            </span>
            <span className="hidden sm:inline">MOH Regulatory Compliant</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN INSTITUTIONAL HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo & Identification (Logo and Name Only) */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
              Penang<span className="text-sky-600">Health</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <button onClick={onNavigateLogin} className="hover:text-sky-600 transition cursor-pointer">Find Specialist</button>
            <button onClick={onNavigateLogin} className="hover:text-sky-600 transition cursor-pointer">Partner Hospitals</button>
            <button onClick={onNavigateLogin} className="hover:text-sky-600 transition cursor-pointer">Queue Telemetry</button>
            <button onClick={onNavigateLogin} className="hover:text-sky-600 transition cursor-pointer">EMR & Medical Records</button>
            <button onClick={onNavigateLogin} className="hover:text-sky-600 transition cursor-pointer">Health Assistant Triage</button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onNavigateLogin}
              className="text-xs font-bold text-slate-700 hover:text-sky-600 px-3 py-2 rounded-xl transition cursor-pointer hidden sm:block"
            >
              Doctor / Staff Sign In
            </button>
            <button 
              id="btn-login-gate"
              onClick={onNavigateLogin}
              className="bg-sky-600 hover:bg-sky-700 active:scale-98 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition shadow-sm shadow-sky-600/20 flex items-center gap-2 cursor-pointer"
            >
              <span>Patient Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION WITH SPLIT-SCREEN CLINICAL PORTAL */}
      <section className="relative px-6 sm:px-8 pt-12 pb-16 md:pt-16 md:pb-24 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Authoritative Clinical Narrative */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-bold px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Multi-Hospital Outpatient Portal • State of Penang</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Seamless Specialist Appointments & Real-Time Queue Updates.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Connect directly with credentialed medical specialists across <strong className="text-slate-900">Pantai Hospital Penang, Gleneagles, Island Hospital, Loh Guan Lye,</strong> and <strong className="text-slate-900">Lam Wah Ee</strong>. Manage appointments, monitor live wait times remotely, and schedule doorstep Grab transit.
            </p>

            {/* Bullet verification points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Live consultation queue radar & counter</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Smart 5–10 min on-site arrival check-in</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Health Assistant pre-consultation symptom triage</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Real-time appointment scheduling &amp; live queue tracker</span>
              </div>
            </div>

            {/* Direct Entry Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <button 
                id="hero-cta-portal"
                onClick={onNavigateLogin}
                className="bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Access Outpatient Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button 
                id="hero-cta-ai"
                onClick={onNavigateLogin}
                className="bg-white hover:bg-sky-50/60 border border-slate-300 hover:border-sky-300 text-slate-800 font-bold text-xs sm:text-sm px-5 py-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Bot className="w-4 h-4 text-sky-600" />
                <span>Consult Health Assistant</span>
              </button>
            </div>

            {/* Quick Trust Bar */}
            <div className="pt-6 border-t border-slate-200 flex items-center gap-6 text-[11px] text-slate-500 font-medium">
              <div>
                <span className="font-extrabold text-slate-900 text-base block font-mono">18+</span>
                <span>Hospitals & Clinics</span>
              </div>
              <div className="h-7 w-[1px] bg-slate-200"></div>
              <div>
                <span className="font-extrabold text-slate-900 text-base block font-mono">150+</span>
                <span>Consultant Doctors</span>
              </div>
              <div className="h-7 w-[1px] bg-slate-200"></div>
              <div>
                <span className="font-extrabold text-sky-700 text-base block font-mono">~14m</span>
                <span>Average Wait Time</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Quick Appointment Finder Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-900/5 relative">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Quick Specialist Booking</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Verified doctor availability across Penang</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full font-mono">
                  ● Live Slots
                </span>
              </div>

              {/* Form Controls */}
              <div className="space-y-4 py-5">
                {/* Hospital Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Select Hospital or Medical Centre
                  </label>
                  <select
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:border-sky-600 focus:outline-none"
                  >
                    {partnerHospitals.map(h => (
                      <option key={h.name} value={h.name}>{h.name} ({h.area})</option>
                    ))}
                  </select>
                </div>

                {/* Specialty Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Clinical Specialty
                  </label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:border-sky-600 focus:outline-none"
                  >
                    <option value="Consultant Cardiologist">Cardiology & Heart Care</option>
                    <option value="General Medicine">Internal & General Medicine</option>
                    <option value="Orthopaedic Surgeon">Orthopaedics & Joint Surgery</option>
                    <option value="Respiratory Medicine">Respiratory & Pulmonology</option>
                    <option value="Paediatrics">Paediatrics & Child Health</option>
                    <option value="Dermatologist">Dermatology & Skin Clinic</option>
                  </select>
                </div>

                {/* Teaser Preview Box */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Estimated Clinic Wait:</span>
                    <span className="font-extrabold text-sky-700 font-mono">
                      {partnerHospitals.find(h => h.name === selectedHospital)?.waitTime || "~14 Mins"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Next Earliest Consultation:</span>
                    <span className="font-bold text-emerald-700">Today, 2:30 PM (Available)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Transit Dispatch:</span>
                    <span className="text-slate-700 font-semibold">Grab Direct Ride Supported</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Check Live Slots & Schedule Consultation</span>
                </button>
              </div>

              {/* Bottom security assurance */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> End-to-end Encrypted
                </span>
                <span>Verified Outpatient Network</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. HOSPITAL PARTNER ALLIANCE CAROUSEL / RIBBON */}
      <section className="bg-white border-y border-slate-200 py-10 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 font-mono">
                Penang Healthcare Network Alliance
              </h2>
              <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                Integrated Private Hospitals & Specialist Centres
              </p>
            </div>
            <span className="text-xs text-sky-700 font-semibold">Cross-Facility Medical Record Sync Active</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {partnerHospitals.map((h, i) => (
              <div 
                key={i} 
                onClick={onNavigateLogin}
                className="bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 p-3.5 rounded-2xl transition cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Building2 className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition" />
                  <span className="text-[8px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                    {h.waitTime}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-sky-700 transition line-clamp-1 leading-tight">
                  {h.name}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">{h.area}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FOUR CORE CLINICAL PILLARS */}
      <section className="py-20 px-6 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-widest text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
            Clinical Telemetry & Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Modern Outpatient Healthcare
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Eliminate chaotic lobby waits, disorganized paper receipts, and fragmented medical records with an integrated state-wide clinical portal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {corePillars.map((p, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-slate-200 hover:border-sky-300 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {p.icon}
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 font-mono block mb-1">
                    {p.tag}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {p.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-1 rounded-md block w-fit font-mono">
                  ✓ {p.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. EMERGENCY SOS & ACCREDITATION SECTION (Clean Light Theme) */}
      <section className="bg-rose-50/50 text-slate-800 py-16 px-6 sm:px-8 border-y border-rose-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-8 space-y-4">
            <span className="text-[10px] font-extrabold tracking-widest uppercase bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full">
              Urgent Medical Protocol
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Integrated Emergency SOS & Rapid Ambulance Routing
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              For acute emergencies including chest pain, stroke symptoms, acute respiratory distress, or severe trauma, activate the portal emergency beacon to dispatch response teams and notify hospital triage desks in real time.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onNavigateLogin}
                className="bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer shadow-sm shadow-rose-600/20"
              >
                Access Emergency SOS Dispatcher
              </button>
              <div className="text-xs text-slate-600">
                Hotline: <strong className="text-rose-700 font-mono text-sm">+60 4-222 7788</strong> / <strong className="text-rose-700 font-mono text-sm">999</strong> (Malaysia Central Ambulance)
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-rose-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Award className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-900">Accredited Compliance</h4>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Ministry of Health (MOH) Healthcare Quality Standards</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Personal Data Protection Act (PDPA 2010)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Secure Cloud TLS Data Encryption</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 7. INSTITUTIONAL FOOTER */}
      <footer className="bg-white text-slate-500 text-xs py-10 px-6 sm:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center text-white">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-base">
              Penang<span className="text-sky-600">Health</span>
            </span>
          </div>

          <div className="text-center md:text-left text-[11px] text-slate-400">
            Penang State Outpatient & Specialist Care Management System
          </div>

          <div className="flex items-center gap-5 text-xs font-semibold text-slate-600">
            <button onClick={onNavigateLogin} className="hover:text-sky-600 transition cursor-pointer">Doctor Portal</button>
            <button onClick={onNavigateLogin} className="hover:text-sky-600 transition cursor-pointer">Patient Sign In</button>
            <button onClick={onNavigateLogin} className="hover:text-sky-600 transition cursor-pointer">Privacy Policy</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
