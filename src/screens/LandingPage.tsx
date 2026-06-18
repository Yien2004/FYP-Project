import React, { useState } from "react";
import { 
  Heart, 
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
  PlusCircle,
  Video
} from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onNavigateLogin: () => void;
}

export default function LandingPage({ onNavigateLogin }: LandingPageProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const stats = [
    { value: "45+", label: "CarePoint Clinics" },
    { value: "150+", label: "Top Specialists" },
    { value: "98.4%", label: "Patient Satisfaction" },
    { value: "24/7", label: "Smart Triage Assistant" }
  ];

  const services = [
    {
      icon: <Bot className="w-8 h-8 text-teal-600" />,
      title: "Carey AI Chat Assistant",
      desc: "Instant medical symptom checker grounded by clinic database logic.",
      target: "ai-consultation"
    },
    {
      icon: <MapPin className="w-8 h-8 text-rose-600" />,
      title: "Clinic Search & Map",
      desc: "Locate physical healthcare branches near you by zip with live queue status.",
      target: "clinic-search"
    },
    {
      icon: <Video className="w-8 h-8 text-blue-600" />,
      title: "Digital Consultations",
      desc: "Book telehealth video sessions or schedule standard in-clinic appointments.",
      target: "schedule-appointment"
    },
    {
      icon: <PlusCircle className="w-8 h-8 text-indigo-600" />,
      title: "Universal Patient Portal",
      desc: "Check active MyKad/Passport records, physical bio-vitals and history logs.",
      target: "dashboard"
    }
  ];

  const testimonials = [
    {
      quote: "The live queue countdown and Carey AI assistant resolved my asthma questions at 3 AM. Incredible innovation for Malaysian clinics!",
      author: "Danish Razali",
      title: "CarePoint Patient, Cheras"
    },
    {
      quote: "I looked up nearest available clinics, drove over, and logged in directly using my MyKad profile. Clean, transparent, and extremely fast.",
      author: "Mei Ling Tan",
      title: "Corporate Member, Damansara"
    }
  ];

  return (
    <div id="landing-container" className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
            <Heart className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-xl text-slate-900 leading-none block">CarePoint</span>
            <span className="text-xs text-slate-500 tracking-wider uppercase font-mono">Digital Health</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button onClick={onNavigateLogin} className="hover:text-teal-600 transition">Dashboard</button>
          <button onClick={onNavigateLogin} className="hover:text-teal-600 transition">Clinics</button>
          <button onClick={onNavigateLogin} className="hover:text-teal-600 transition">AI Triage</button>
          <button onClick={onNavigateLogin} className="hover:text-teal-600 transition">Medical Records</button>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            id="btn-login-gate"
            onClick={onNavigateLogin}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition"
          >
            Sign In
          </button>
          <button 
            id="btn-launch"
            onClick={onNavigateLogin}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition shadow-lg shadow-teal-600/15 flex items-center gap-2"
          >
            Launch Patient Portal <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/55 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <ShieldCheck className="w-4 h-4 text-teal-600" /> Secure Healthcare Portal
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-none mb-6">
            Next-gen Healthcare, <span className="text-teal-600">Patient-Centric</span> Precision.
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
            Welcome to Malaysia's premier unified patient ecosystem. Connect with peerless clinical professionals, check physical diagnostic reports, locate real-time queues, and engage our interactive AI Health Assistant.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <button 
              id="hero-cta-portal"
              onClick={onNavigateLogin}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              Enter Clinic Portal <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              id="hero-cta-ai"
              onClick={onNavigateLogin}
              className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-medium px-8 py-3.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Bot className="w-5 h-5" /> Consult Carey AI
            </button>
          </div>

          {/* Stats widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-200">
            {stats.map((st, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-slate-900">{st.value}</div>
                <div className="text-xs text-slate-500">{st.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Graphics Mock */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-lg bg-teal-900/5 rounded-3xl p-6 border border-teal-500/10">
            {/* Interactive medical dashboard card teaser */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 relative z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-semibold bg-emerald-500 rounded-full animate-ping"></span>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-mono block">LIVE QUEUE ticker</span>
                    <span className="font-semibold text-slate-900 text-sm">Damansara Heights Clinic</span>
                  </div>
                </div>
                <span className="bg-red-50 text-red-600 font-mono text-xs font-bold px-2.5 py-1 rounded">EST. 12 MINS</span>
              </div>

              <div className="py-6 flex items-center justify-around">
                <div className="text-center">
                  <div className="text-xs text-slate-500">Your Ticket</div>
                  <div className="text-3xl font-extrabold text-teal-600 font-mono">1045</div>
                </div>
                <div className="h-10 w-[1px] bg-slate-200"></div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Current Serving</div>
                  <div className="text-3xl font-extrabold text-slate-800 font-mono">1041</div>
                </div>
              </div>

              <button 
                onClick={onNavigateLogin}
                className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                Track Live Queue <Activity className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Quick alert banner */}
            <div className="absolute -bottom-4 left-6 bg-slate-900 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 max-w-sm border border-slate-800 z-20">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                !
              </div>
              <div>
                <span className="font-medium text-xs block text-amber-400">Medication Reminder</span>
                <span className="text-xs text-slate-300">Renew Ventolin Inhaler today.</span>
              </div>
            </div>

            {/* Background design elements */}
            <div className="absolute top-10 -left-6 w-12 h-12 rounded-2xl bg-teal-500/10 blur-xl"></div>
            <div className="absolute bottom-20 -right-4 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl"></div>
          </div>
        </div>
      </section>

      {/* Feature Grid / Services */}
      <section className="bg-white border-y border-slate-200 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
              Integrated Digital Healthcare Services
            </h2>
            <p className="text-slate-600 text-sm">
              CarePoint unifies every step of your medical lifecycle inside a single secure browser view.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((ser, index) => (
              <div 
                key={index}
                className="bg-slate-50 hover:bg-white border border-slate-100 rounded-2xl p-6 transition duration-300 hover:shadow-xl hover:shadow-slate-100 group flex flex-col justify-between"
              >
                <div>
                  <div className="mb-4 bg-white w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform">
                    {ser.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{ser.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">{ser.desc}</p>
                </div>
                <button 
                  onClick={onNavigateLogin}
                  className="text-teal-600 font-medium text-xs inline-flex items-center gap-1.5 hover:text-teal-700 transition"
                >
                  Configure Service <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Workflow Stepper */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
              A Seamless Experience For Physical & Remote Care
            </h2>
            <p className="text-slate-600 text-sm mb-8 leading-relaxed">
              Say goodbye to repetitive registration sheets and unclear dispatch times. Registered patients can log in immediately, check diagnostic history, map distance scopes, and configure health reports globally.
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">Secure Email Login</h4>
                  <p className="text-slate-500 text-xs">Sign in with your registered email to open your secure patient portal.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">Access Your Health Summary</h4>
                  <p className="text-slate-500 text-xs">Browse appointment details, lab summaries, and care reminders without needing MyKad verification.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">On-demand Medical Advice</h4>
                  <p className="text-slate-500 text-xs">Generate instant advice with Carey AI, or coordinate active secure messaging direct to doctors.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-8 relative overflow-hidden text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-400" />
                  <span className="text-xs tracking-wider uppercase font-mono text-slate-300">Malaysia Clinical Standard</span>
                </div>
                <div className="text-xs bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full font-semibold">ISO 27001 Secured</div>
              </div>

              <blockquote className="text-lg md:text-xl italic font-serif leading-relaxed mb-6 text-slate-100">
                "{testimonials[activeTestimonial].quote}"
              </blockquote>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{testimonials[activeTestimonial].author}</div>
                  <div className="text-xs text-slate-400">{testimonials[activeTestimonial].title}</div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTestimonial(0)} 
                    className={`w-2.5 h-2.5 rounded-full transition ${activeTestimonial === 0 ? "bg-teal-400" : "bg-slate-700"}`}
                  />
                  <button 
                    onClick={() => setActiveTestimonial(1)} 
                    className={`w-2.5 h-2.5 rounded-full transition ${activeTestimonial === 1 ? "bg-teal-400" : "bg-slate-700"}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-slate-200 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 bg-slate-950 text-white rounded-3xl p-10 shadow-2xl border border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-200 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Emergency SOS Support</h3>
                  <p className="text-sm text-slate-300 mt-1">Activate an immediate emergency signal from the portal to notify responders, secure ambulance routing, and alert your care team.</p>
                </div>
              </div>

              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>When seconds matter, CarePoint gives you a built-in emergency SOS flow to escalate severe symptoms, create an alert record, and connect you with first responders.</p>
                <ul className="space-y-3 list-disc list-inside">
                  <li><strong>24/7 urgent alert dispatch</strong> for chest pain, difficulty breathing, trauma, or sudden severe illness.</li>
                  <li><strong>Ambulance coordination</strong> to route aid directly to your registered clinic, home address, or current location.</li>
                  <li><strong>Care team escalation</strong> that sends alerts to nurses and doctors in the system with priority notification.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
                <span className="inline-flex items-center gap-2 text-red-600 font-semibold mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Emergency Ready
                </span>
                <p className="text-sm text-slate-700">Any patient can trigger the SOS dispatcher from the portal and see an emergency response confirmation screen.</p>
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-3xl p-6 shadow-sm">
                <span className="inline-flex items-center gap-2 text-teal-700 font-semibold mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-700" /> Built-in Response Log
                </span>
                <p className="text-sm text-slate-700">Every SOS activation is logged so staff can review response time, patient status, and follow-up actions later.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-teal-600 text-white text-center py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Heart className="w-12 h-12 mx-auto mb-6 opacity-90 animate-bounce" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to Experience the Future of Clinical Services?
          </h2>
          <p className="text-teal-50 text-sm md:text-base max-w-xl mx-auto mb-8">
            Access registration metrics, book live clinics, consult Carey AI assistant, and verify treatment documents interactively right now.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button 
              onClick={onNavigateLogin}
              className="bg-white hover:bg-slate-100 text-teal-900 font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-teal-700/25 text-sm"
            >
              Access Dashboard
            </button>
            <button 
              onClick={onNavigateLogin}
              className="bg-teal-700 hover:bg-teal-800 border border-teal-500 text-teal-50 px-8 py-3 rounded-xl transition text-sm"
            >
              Sign In Securely
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 px-6 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center text-white">
              <Heart className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-white tracking-tight">CarePoint Health Malaysia</span>
          </div>

          <div>
            &copy; 2026 CarePoint Inc. Licensed by Ministry of Health Malaysia (MOH).
          </div>

          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Support Helpdesk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
