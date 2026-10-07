import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Activity,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  HeartPulse,
  Building2,
  User,
  Stethoscope,
} from "lucide-react";

interface UnifiedAuthenticationProps {
  onLoginSuccess: (email: string, role: string, name: string) => void;
  onNavigateBack?: () => void;
  initialMode?: AuthMode;
}

type AuthMode = "login" | "register" | "forgot" | "reset";

export default function UnifiedAuthentication({ onLoginSuccess, onNavigateBack, initialMode = "login" }: UnifiedAuthenticationProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  /* ── Shared fields ── */
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ── Register-only fields ── */
  const [fullName, setFullName]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm]         = useState(false);
  const [registerRole, setRegisterRole]       = useState<"Patient" | "Clinic / Hospital">("Patient");

  /* ── Reset-only fields ── */
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  /* ── UI state ── */
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [errorMessage, setErrorMessage]   = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Intercept reset token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setMode("reset");
    }
  }, []);

  /* ══════════════════════════════════════════════════════
      LOGIN
  ══════════════════════════════════════════════════════ */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Please check your credentials.");
        console.error("Login error:", data.error);
        return;
      }

      const role: string = data.user?.role ?? "Patient";
      const name: string = data.user?.name ?? email.split("@")[0];
      if (role === "Patient" && data.accessToken) {
        localStorage.setItem("carepoint_access_token", data.accessToken);
      }
      onLoginSuccess(email, role, name);
    } catch {
      setErrorMessage("Unable to reach the server. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = (demoEmail: string, demoPass: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage("");
    setSuccessMessage(`Credentials populated for ${roleName}. Click 'Sign In' below to continue.`);
  };

  /* ══════════════════════════════════════════════════════
      REGISTER
  ══════════════════════════════════════════════════════ */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const isStaff = registerRole === "Clinic / Hospital";
      const endpoint = isStaff ? "/api/staff/requests" : "/api/auth/register";

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password, fullName, role: isStaff ? "Doctor" : "Patient" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Registration failed. Please try again.");
        return;
      }

      if (isStaff) {
        setSuccessMessage("Staff registration request submitted! Your account is pending administrator approval.");
      } else {
        setSuccessMessage("Account created! Please sign in with your credentials.");
      }
      setTimeout(() => {
        setMode("login");
        setEmail(""); setPassword(""); setShowPassword(false);
        setFullName(""); setConfirmPassword(""); setSuccessMessage("");
      }, 3500);
    } catch {
      setErrorMessage("Unable to reach the server. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ══════════════════════════════════════════════════════
      FORGOT PASSWORD
  ══════════════════════════════════════════════════════ */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to generate password reset request.");
        return;
      }

      setSuccessMessage(data.message || "A password reset link has been generated!");
    } catch {
      setErrorMessage("Unable to reach the server. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ══════════════════════════════════════════════════════
      RESET PASSWORD
  ══════════════════════════════════════════════════════ */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to reset password. The link may have expired.");
        return;
      }

      setSuccessMessage("Your password has been successfully reset!");
      setTimeout(() => {
        setMode("login");
        setNewPassword("");
        setConfirmNewPassword("");
        setSuccessMessage("");
        // Clear query parameter
        window.history.replaceState({}, "", "/login");
      }, 2500);
    } catch {
      setErrorMessage("Unable to reach the server. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex font-sans">

      {/* ── Left panel — illustrated branding ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 p-12 relative overflow-hidden">
        {/* Decorative soft circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-[-5rem] right-[-3rem] w-96 h-96 rounded-full bg-white/10 pointer-events-none" />

        {/* Previous Logo and Name Only */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">
            PenangHealth
          </span>
        </div>

        {/* Centre content */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Penang Centralized<br />
            <span className="text-sky-100">Smart Healthcare Gate</span>
          </h2>
          <p className="text-sky-50/90 text-xs sm:text-sm leading-relaxed max-w-sm font-medium">
            One secure login for patients, doctors, nurses and administrators across Penang's healthcare facilities.
          </p>

          {/* Feature bullets */}
          <div className="space-y-3 pt-2">
            {[
              "Book appointments in under 2 minutes",
              "Communicate directly with your doctor",
              "Automatic dashboard for each role",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="w-4.5 h-4.5 text-sky-200 shrink-0 mt-0.5" />
                <span className="text-sm text-sky-50/95 font-medium leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom space */}
        <div className="relative z-10" />
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-slate-800 text-lg">PenangHealth</span>
          </div>

          {/* Back button to return to public gate */}
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 transition mb-5 cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Public Gate</span>
            </button>
          )}

          {/* Tab Switcher for Sign In vs Register */}
          {(mode === "login" || mode === "register") && (
            <div className="flex bg-slate-200/80 p-1 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setErrorMessage(""); setSuccessMessage(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
              {mode === "login" && "Sign in to your account"}
              {mode === "register" && "Create your account"}
              {mode === "forgot" && "Recover your password"}
              {mode === "reset" && "Reset your password"}
            </h1>
            <p className="text-xs text-slate-500">
              {mode === "login" && "Enter your email and password to continue."}
              {mode === "register" && "Fill in the details below to get started."}
              {mode === "forgot" && "Provide your email address to receive a secure recovery link."}
              {mode === "reset" && "Set a strong new password for your healthcare gate profile."}
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-4 mb-5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-4 mb-5 animate-fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ─── LOGIN FORM ─── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@gmail.com"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition shadow-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setErrorMessage(""); setSuccessMessage(""); }}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-60 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
              >
                {isSubmitting
                  ? <><span>Signing in…</span><Activity className="w-4 h-4 animate-spin" /></>
                  : <><span>Sign In to Healthcare Portal</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-50 px-4 text-[11px] text-slate-400">or</span>
                </div>
              </div>

              {/* Switch */}
              <button
                type="button"
                onClick={() => { setMode("register"); setErrorMessage(""); setSuccessMessage(""); }}
                className="w-full text-center text-xs font-semibold text-sky-600 hover:text-sky-700 transition py-1 cursor-pointer"
              >
                New patient? Create a free outpatient account
              </button>

              {/* Optional Examiner / Demo Credentials Accordion */}
              <div className="mt-5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="flex items-center justify-between w-full py-1 text-[11px] font-bold tracking-wider text-slate-500 hover:text-slate-700 uppercase cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    Examiner Test Credentials ({showDemoAccounts ? "Hide" : "Show"})
                  </span>
                  <span className="text-[10px] text-sky-600 font-semibold normal-case">
                    {showDemoAccounts ? "Close" : "Click to view"}
                  </span>
                </button>

                {showDemoAccounts && (
                  <div className="mt-2.5 space-y-2">
                    <p className="text-[10px] text-slate-400">
                      Shortcut for examiners to test role dashboards without manually typing credentials.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => fillDemoCredentials("patient.ahmad.3618@gmail.com", "Password123!", "Patient Ahmad")}
                        disabled={isSubmitting}
                        className="p-2.5 bg-white hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 rounded-xl text-left transition group cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-sky-700">Patient</span>
                          <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">Ahmad</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">Outpatient Portal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fillDemoCredentials("pantaipenang@gmail.com", "12345678", "Clinic / Hospital Staff")}
                        disabled={isSubmitting}
                        className="p-2.5 bg-white hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 rounded-xl text-left transition group cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-sky-700">Clinic / Hospital</span>
                          <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">Pantai</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">Clinic Operations Portal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fillDemoCredentials("admin@gmail.com", "12345678", "Admin HQ")}
                        disabled={isSubmitting}
                        className="p-2.5 bg-white hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 rounded-xl text-left transition group cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-sky-700">Admin</span>
                          <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">HQ Admin</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">System Administration</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* ─── REGISTER FORM ─── */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="reg-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Legal Name (as per MyKad / Passport)
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmad bin Abdullah"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition shadow-xs"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition shadow-xs"
                />
              </div>

              {/* Account Type */}
              <div>
                <label htmlFor="reg-role" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Account Type
                </label>
                <select
                  id="reg-role"
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as "Patient" | "Clinic / Hospital")}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition shadow-xs font-semibold"
                >
                  <option value="Patient">Patient (Public Healthcare Account)</option>
                  <option value="Clinic / Hospital">Clinic / Hospital Staff</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                  Clinic and hospital staff registrations are securely verified by Penang healthcare administration.
                </p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-11 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-11 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="register-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-60 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
              >
                {isSubmitting
                  ? <><span>Creating account…</span><Activity className="w-4 h-4 animate-spin" /></>
                  : <><span>Complete Registration</span><UserPlus className="w-4 h-4" /></>
                }
              </button>

              {/* Switch */}
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                className="w-full text-center text-xs font-semibold text-sky-600 hover:text-sky-700 transition py-1 cursor-pointer"
              >
                Already have an account? Sign in
              </button>
            </form>
          )}

          {/* ─── FORGOT PASSWORD FORM ─── */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition shadow-xs"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-60 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
              >
                {isSubmitting
                  ? <><span>Sending Request…</span><Activity className="w-4 h-4 animate-spin" /></>
                  : <><span>Send Password Recovery Link</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>

              {/* Back Link */}
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                className="w-full flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-sky-600 hover:text-sky-700 transition py-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
            </form>
          )}

          {/* ─── RESET PASSWORD FORM ─── */}
          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirm-new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="confirm-new-password"
                    type={showConfirmNew ? "text" : "password"}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNew(!showConfirmNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showConfirmNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-60 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
              >
                {isSubmitting
                  ? <><span>Saving Password…</span><Activity className="w-4 h-4 animate-spin" /></>
                  : <><span>Save New Password</span><ShieldCheck className="w-4 h-4" /></>
                }
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
