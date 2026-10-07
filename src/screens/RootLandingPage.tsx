import React, { useState } from "react";
import {
  ArrowRight,
  Activity,
  ShieldCheck,
  CheckCircle,
  Compass,
  FileText,
  Calendar,
  AlertTriangle,
  Lock,
  Mail,
  User,
  Building2,
  Stethoscope,
  Phone,
  Menu,
  X
} from "lucide-react";

interface RootLandingPageProps {
  onNavigateLogin: (defaultMode?: "login" | "register") => void;
  onNavigateHospitals: (params?: string) => void;
  onNavigateDoctors: (params?: string) => void;
  onLoginSuccess?: (email: string, role: string, name: string) => void;
}

export default function RootLandingPage({
  onNavigateLogin,
  onNavigateHospitals,
  onNavigateDoctors,
  onLoginSuccess,
}: RootLandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">

      {/* ── 1. GLOBAL NAVIGATION BAR (TOP HEADER) ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 lg:px-10 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Identity: System Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight block">
              Penang<span className="text-sky-600">Health</span>
            </span>
          </div>

          {/* Quick Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600">
            <button
              onClick={() => onNavigateHospitals()}
              className="hover:text-sky-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Hospitals & Clinics</span>
            </button>
            <button
              onClick={() => onNavigateDoctors()}
              className="hover:text-sky-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>Find Doctors</span>
            </button>
            <a href="#services" className="hover:text-sky-600 transition-colors">
              Services
            </a>
          </nav>

          {/* Action Callouts */}
          <div className="flex items-center gap-2.5">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2 pb-2">
            <button
              onClick={() => { onNavigateHospitals(); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 rounded-lg"
            >
              Hospitals & Clinics
            </button>
            <button
              onClick={() => { onNavigateDoctors(); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 rounded-lg"
            >
              Find Doctors
            </button>
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 rounded-lg"
            >
              Services
            </a>
            <button
              onClick={() => { onNavigateLogin("login"); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION (SPLIT-PANE / DUAL-ZONE LAYOUT) ── */}
      <section id="about" className="relative px-6 lg:px-10 pt-10 pb-12 lg:pt-14 lg:pb-16 max-w-7xl mx-auto overflow-hidden">
        {/* Soft background ambient gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column (System Value Proposition) */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Centralized Smart Outpatient Booking & Triage
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              A unified digital healthcare coordination gateway connecting patients directly with accredited outpatient clinics and medical specialists across Penang.
            </p>

            {/* Value Highlights with Icon Bullets */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Book appointments in under 2 minutes</h4>
                  <p className="text-xs text-slate-500">Streamlined booking workflow with real-time slot reservation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Rule-based symptom assessment and specialty routing</h4>
                  <p className="text-xs text-slate-500">Structured pre-consultation notes for attending physicians.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Find nearest private facilities with zero delays</h4>
                  <p className="text-xs text-slate-500">Browser-based GPS location calculation without external mapping API fees.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Strict data privacy compliant with Malaysia PDPA 2010</h4>
                  <p className="text-xs text-slate-500">Secure role-based access control protecting patient consultation history.</p>
                </div>
              </div>
            </div>

            {/* Primary CTA buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateLogin("login")}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Get Started / Book Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigateDoctors()}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 text-sky-600" />
                <span>Find Doctors</span>
              </button>
            </div>
          </div>

          {/* Right Column (Healthcare Access Gateway Card) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 relative">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Access Your Health Portal
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Sign in to manage appointments, consult specialist doctors, and view your digital health records.
                </p>
              </div>

              {/* Primary Sign In / Register Actions */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateLogin("login")}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Sign In to Healthcare Gate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateLogin("register")}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Register New Account</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. EMERGENCY RED-FLAG BANNER (TOP PRIORITY SAFETY CALLOUT) ── */}
      <section id="emergency" className="px-6 lg:px-10 py-4 max-w-7xl mx-auto">
        <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-extrabold text-rose-900 uppercase tracking-wide flex items-center gap-2">
                <span>Emergency Red-Flag Protocol</span>
                <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">Immediate Action</span>
              </h3>
              <p className="text-xs sm:text-sm text-rose-800 leading-relaxed max-w-3xl">
                Experiencing severe chest pain, shortness of breath, or sudden trauma? This platform is for non-critical outpatient bookings only. Please call 999 or proceed immediately to the nearest Accident &amp; Emergency department.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 w-full md:w-auto">
            <a
              href="tel:999"
              className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-rose-600/20 active:scale-98"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Emergency 999</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 4. CORE FEATURE PREVIEW GRID (3-TIER HIGHLIGHTS) ── */}
      <section id="services" className="bg-white border-y border-slate-200 py-14 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-sky-700 font-mono">
              Core System Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Integrated Outpatient Care Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Designed according to Jakob Nielsen's usability heuristics to eliminate delays, prevent redundant checkups, and streamline patient triage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1: Intelligent Symptom Triage */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-3 hover:border-sky-300 transition group">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Stethoscope className="w-5 h-5 text-sky-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Intelligent Symptom Triage
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated symptom questionnaire evaluates severity and duration, routing you to the appropriate medical specialty while actively screening for emergency red flags.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                  Rule-based triage routing
                </span>
              </div>
            </div>

            {/* Feature 2: Proximity-Based Facility Discovery */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-3 hover:border-sky-300 transition group">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-sky-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Proximity-Based Facility Discovery
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Client-side GPS location sorting uses the Haversine formula to pinpoint nearest hospitals and clinics across Penang without third-party mapping API fees.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                  Zero-cost geospatial calculation
                </span>
              </div>
            </div>

            {/* Feature 3: Seamless Appointment Scheduling */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-3 hover:border-sky-300 transition group">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5 text-sky-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Seamless Appointment Scheduling
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Conveniently select healthcare facilities, choose specialist doctors, reserve preferred consultation time slots, and track real-time queue numbers.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                  Real-time slot reservation
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
