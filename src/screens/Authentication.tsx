import React, { useState, useEffect } from "react";
import {
  ShieldCheck, Lock, Mail, Eye, EyeOff, Check,
  AlertCircle, ArrowRight, Activity, ArrowLeft, UserPlus
} from "lucide-react";

interface AuthenticationProps {
  onLoginSuccess: (email: string, userId?: string, accessToken?: string) => void;
  onBackToLanding: () => void;
  defaultEmail?: string;
}

type AuthMode = 'login' | 'register' | 'reset-password' | 'update-password';

export default function Authentication({
  onLoginSuccess,
  onBackToLanding,
  defaultEmail = ""
}: AuthenticationProps) {
  const [mode, setMode] = useState<AuthMode>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState(defaultEmail);
  const [password, setPassword]     = useState("");

  // Register fields
  const [registerEmail, setRegisterEmail] = useState("");
  const [fullName, setFullName]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [accountType, setAccountType]     = useState<'Patient' | 'Staff'>('Patient');

  // Reset / update password fields
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strengthMeter, setStrengthMeter]     = useState({ score: 0, label: "Empty", color: "bg-slate-200 w-0" });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted]   = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const generateFallbackEmail = (name?: string) => {
    const base = (name || "guest")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.-]/g, "")
      .replace(/\.+/g, ".")
      .replace(/^\.|\.$/g, "");
    const suffix = Date.now().toString().slice(-5);
    return `${base || 'guest'}-${suffix}@example.com`;
  };

  // ─── helpers ─────────────────────────────────────────────────

  const handlePasswordStrength = (val: string) => {
    setNewPassword(val);
    let score = 0;
    if (val.length >= 6)            score++;
    if (val.length >= 10)           score++;
    if (/[A-Z]/.test(val))          score++;
    if (/[0-9]/.test(val))          score++;
    if (/[^A-Za-z0-9]/.test(val))   score++;

    const label = score === 0 ? "Empty" : score <= 2 ? "Weak" : score <= 4 ? "Medium" : "Very Strong";
    const color = score === 0
      ? "bg-slate-200 w-0"
      : score <= 2 ? "bg-cyan-500 w-1/3"
      : score <= 4 ? "bg-sky-400 w-2/3"
      : "bg-teal-500 w-full";
    setStrengthMeter({ score, label, color });
  };

  // ─── login ───────────────────────────────────────────────────

  // On mount ensure the login input is empty and clear any cached patient email
  useEffect(() => {
    setLoginEmail("");
    try {
      localStorage.removeItem("carepoint_user_email");
      localStorage.removeItem("carepoint_access_token");
      localStorage.removeItem("carepoint_logged");
    } catch (e) {
      /* ignore */
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password })
      });
      const data = await res.json();

      if (!res.ok) {
        const raw = data.error || "Authentication failed.";
        const message = /profiles/i.test(raw)
          ? "Login failed due to backend schema configuration. Please contact support."
          : raw;
        console.error("Login error:", raw);
        setErrorMessage(message);
        setIsSubmitting(false);
        return;
      }

      if (data.user?.role && data.user.role !== "Patient") {
        setErrorMessage("Access denied. Please use the Staff Portal to sign in with this account.");
        setIsSubmitting(false);
        return;
      }

      const userId      = data.user?.id;
      const accessToken = data.accessToken;
      onLoginSuccess(loginEmail, userId, accessToken);

    } catch {
      setErrorMessage("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── register ────────────────────────────────────────────────

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setConfirmationMessage("");

    if (!newPassword) {
      setErrorMessage("Password is required for registration.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (strengthMeter.score < 2) {
      setErrorMessage("Please choose a stronger password (min 6 characters).");
      return;
    }

    const emailToUse = registerEmail.trim() || generateFallbackEmail(fullName);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, password: newPassword, fullName, role: accountType })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Registration failed. Please check your connection.");
        return;
      }

      const userId      = data.user?.id;
      const accessToken = data.accessToken;
      setConfirmationMessage(
        `Your ${accountType.toLowerCase()} account has been created. Confirmation details were sent to ${emailToUse}`
      );
      onLoginSuccess(emailToUse, userId, accessToken);

    } catch (err: any) {
      setErrorMessage(
        err?.message
          ? `Server connection failed: ${err.message}`
          : "Server connection failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── reset password ──────────────────────────────────────────

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) { setErrorMessage("Please enter an email address."); return; }
    setErrorMessage("");
    setIsSubmitted(true);
    setTimeout(() => {
      setMode('update-password');
      setIsSubmitted(false);
    }, 2000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setErrorMessage("Passwords do not match!"); return; }
    if (strengthMeter.score < 2) { setErrorMessage("Please choose a stronger password."); return; }
    setErrorMessage("");
    setIsSubmitted(true);
    setTimeout(() => {
      setMode('login');
      setIsSubmitted(false);
      setNewPassword(""); setConfirmPassword("");
    }, 2000);
  };

  // ─── shared sub-components ───────────────────────────────────

  const StrengthVisualizer = () => (
    <div id="password-strength-container" className="mt-3">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-500">Security Index:</span>
        <span className={`font-mono font-bold ${
          strengthMeter.score <= 2 ? "text-red-400" :
          strengthMeter.score <= 4 ? "text-amber-400" : "text-emerald-400"
        }`}>{strengthMeter.label}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${strengthMeter.color}`} />
      </div>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2.5 text-[10px] text-slate-500 font-mono">
        {[
          ["Min 8 characters",  newPassword.length >= 8],
          ["1 Capital letter",  /[A-Z]/.test(newPassword)],
          ["1 Number digit",    /[0-9]/.test(newPassword)],
          ["Special character", /[^A-Za-z0-9]/.test(newPassword)],
        ].map(([label, met]) => (
          <li key={label as string} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            {label as string}
          </li>
        ))}
      </ul>
    </div>
  );

  // ─── render ──────────────────────────────────────────────────

  return (
    <div id="auth-container" className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-900 relative overflow-hidden font-sans">
      {/* Background soft lights */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-300/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[45%] rounded-full bg-amber-300/25 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 border border-slate-200 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBackToLanding}
            className="absolute top-6 left-6 text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> LANDING
          </button>

          <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-200/50">
            {mode === 'register' ? <UserPlus className="w-6 h-6 text-white" /> : <ShieldCheck className="w-6 h-6 text-white" />}
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1.5">
            {mode === 'login'           && "Welcome Back"}
            {mode === 'register'        && "Create Account"}
            {mode === 'reset-password'  && "Reset Access Code"}
            {mode === 'update-password' && "Define New Password"}
          </h2>
          <p className="text-slate-600 text-xs">
            {mode === 'login'           && "Access clinical appointments and CarePoint's intelligent health hub."}
            {mode === 'register'        && "Sign up for a new patient or staff account with optional email."}
            {mode === 'reset-password'  && "We will transmit recovery credentials to your email."}
            {mode === 'update-password' && "Establish a robust authorization password below."}
          </p>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-6 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {confirmationMessage && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-xl p-3 mb-6 flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{confirmationMessage}</span>
          </div>
        )}

        {/* ── MODE: LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="auth-input-email"
                  type="email" required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  name="email"
                  autoComplete="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 transition"
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono tracking-wider uppercase text-slate-400">Password</label>
                <button type="button" onClick={() => setMode('reset-password')}
                  className="text-teal-400 hover:text-teal-300 transition text-xs font-medium">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="auth-input-password"
                  type={showPassword ? "text" : "password"} required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 transition"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-btn-signin" type="submit" disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              {isSubmitting
                ? <><Activity className="w-4 h-4 animate-spin" /> Authenticating...</>
                : <>Secure Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="pt-4 border-t border-slate-200 text-center">
              <span className="text-xs text-slate-500">New to CarePoint? </span>
              <button type="button" onClick={() => { setMode('register'); setErrorMessage(""); }}
                className="text-teal-600 hover:text-teal-500 transition text-xs font-semibold">
                Create an Account
              </button>
            </div>
          </form>
        )}

        {/* ── MODE: REGISTER ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Account Type */}
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-500 mb-2">Account type</label>
              <div className="grid grid-cols-2 gap-3">
                {['Patient', 'Staff'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type as 'Patient' | 'Staff')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      accountType === type
                        ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/60'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-500 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 transition"
                placeholder="Your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-500 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="register-input-email"
                  type="email"
                  value={registerEmail}
                  onChange={e => setRegisterEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 transition"
                  placeholder="example: name@carepoint.my"
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Example email only. Leave blank to create a temporary address for demo signup.</p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="register-input-password"
                  type="password" required
                  value={newPassword}
                  onChange={e => handlePasswordStrength(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 transition"
                  placeholder="Create a secure password"
                />
              </div>
              <StrengthVisualizer />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password" required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full bg-slate-50 border rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-1 transition ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-200'
                  }`}
                  placeholder="Repeat password"
                />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-red-400 text-[10px] mt-1 font-mono">Passwords do not match</p>
              )}
            </div>

            <button
              id="auth-btn-register" type="submit" disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              {isSubmitting
                ? <><Activity className="w-4 h-4 animate-spin" /> Creating Account...</>
                : <><UserPlus className="w-4 h-4" /> Create Account</>}
            </button>

            <div className="pt-4 border-t border-slate-200 text-center">
              <span className="text-xs text-slate-500">Already have an account? </span>
              <button type="button" onClick={() => { setMode('login'); setErrorMessage(""); }}
                className="text-teal-600 hover:text-teal-500 transition text-xs font-semibold">
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── MODE: RESET PASSWORD ── */}
        {mode === 'reset-password' && (
          <form onSubmit={handleResetRequest} className="space-y-5">
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email" required value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 transition"
                  placeholder="name@carepoint.my"
                />
              </div>
            </div>
            <button type="submit" disabled={isSubmitted}
              className={`w-full ${isSubmitted ? 'bg-emerald-600' : 'bg-teal-600 hover:bg-teal-500'} text-white font-semibold text-sm py-3.5 rounded-xl transition flex items-center justify-center gap-2`}>
              {isSubmitted
                ? <><Activity className="w-4 h-4 animate-spin" /> Transmitting Security Code...</>
                : "Send Verification Ticket"}
            </button>
            <button type="button" onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition">
              Return to Sign In
            </button>
          </form>
        )}

        {/* ── MODE: UPDATE PASSWORD ── */}
        {mode === 'update-password' && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Proposed New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password" required value={newPassword}
                  onChange={e => handlePasswordStrength(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-teal-500 focus:outline-none transition"
                  placeholder="Type new secure passcode..."
                />
              </div>
              <StrengthVisualizer />
            </div>
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Verify Code</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password" required value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-teal-500 focus:outline-none transition"
                  placeholder="Repeat code..."
                />
              </div>
            </div>
            <button type="submit" disabled={isSubmitted}
              className={`w-full ${isSubmitted ? 'bg-emerald-600' : 'bg-teal-600 hover:bg-teal-500'} text-white font-semibold text-sm py-3.5 rounded-xl transition flex items-center justify-center gap-2`}>
              {isSubmitted
                ? <><Activity className="w-4 h-4 animate-spin" /> Updating Credentials...</>
                : "Update Secure Credentials"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
