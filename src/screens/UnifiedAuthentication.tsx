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
} from "lucide-react";

interface UnifiedAuthenticationProps {
  onLoginSuccess: (email: string, role: string, name: string) => void;
}

type AuthMode = "login" | "register" | "forgot" | "reset";

export default function UnifiedAuthentication({ onLoginSuccess }: UnifiedAuthenticationProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [resetToken, setResetToken] = useState<string | null>(null);

  /* ── Shared fields ── */
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ── Register-only fields ── */
  const [fullName, setFullName]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm]         = useState(false);
  const [registerRole, setRegisterRole]       = useState<"Patient" | "Doctor" | "Nurse">("Patient");

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
      const isStaff = registerRole === "Doctor" || registerRole === "Nurse";
      const endpoint = isStaff ? "/api/staff/requests" : "/api/auth/register";

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password, fullName, role: registerRole }),
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
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between bg-gradient-to-br from-teal-600 via-teal-500 to-sky-500 p-12 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/8" />
        <div className="absolute bottom-[-5rem] right-[-3rem] w-96 h-96 rounded-full bg-white/6" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-white/4" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            PenangHealth
          </span>
        </div>

        {/* Centre content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-5">
            Penang Centralized<br />
            <span className="text-teal-100">Smart Healthcare Gate</span>
          </h2>
          <p className="text-teal-50/80 text-sm leading-relaxed mb-10 max-w-sm">
            One secure login for patients, doctors, nurses and administrators across
            Penang's public hospitals and government clinics.
          </p>

          {/* Feature bullets */}
          {[
            "Book appointments in under 2 minutes",
            "Access health records & prescriptions",
            "Communicate directly with your doctor",
            "Automatic dashboard for each role",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-4.5 h-4.5 text-teal-200 shrink-0" />
              <span className="text-sm text-teal-50/90">{item}</span>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-xs text-teal-100/60">
          © {new Date().getFullYear()} Penang Health Gate — PDPA Compliant
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center shadow-md">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-base">PenangHealth</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
              {mode === "login" && "Sign in to your account"}
              {mode === "register" && "Create your account"}
              {mode === "forgot" && "Recover your password"}
              {mode === "reset" && "Reset your password"}
            </h1>
            <p className="text-sm text-slate-500">
              {mode === "login" && "Enter your email and password to continue."}
              {mode === "register" && "Fill in the details below to get started."}
              {mode === "forgot" && "Provide your email address to receive a secure recovery link."}
              {mode === "reset" && "Set a strong new password for your healthcare gate profile."}
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-6 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl p-4 mb-6 animate-fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-teal-650" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ─── LOGIN FORM ─── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
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
                    placeholder="your@email.com"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setErrorMessage(""); setSuccessMessage(""); }}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
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
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
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
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-teal-500/30 hover:shadow-lg hover:shadow-teal-500/40 hover:-translate-y-px cursor-pointer"
              >
                {isSubmitting
                  ? <><span>Signing in…</span><Activity className="w-4 h-4 animate-spin" /></>
                  : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-50 px-4 text-xs text-slate-400">or</span>
                </div>
              </div>

              {/* Switch */}
              <button
                type="button"
                onClick={() => { setMode("register"); setErrorMessage(""); setSuccessMessage(""); }}
                className="w-full text-center text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors py-1 cursor-pointer"
              >
                Create a new account
              </button>
            </form>
          )}

          {/* ─── REGISTER FORM ─── */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmad bin Abdullah"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-2">
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
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm"
                />
              </div>

              {/* Account Type */}
              <div>
                <label htmlFor="reg-role" className="block text-sm font-semibold text-slate-700 mb-2">
                  Account Type
                </label>
                <select
                  id="reg-role"
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as "Patient" | "Doctor" | "Nurse")}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm font-semibold"
                >
                  <option value="Patient">User</option>
                  <option value="Doctor">Staff</option>
                </select>
                <p className="text-xs text-slate-400 mt-1.5 px-1">
                  Admin accounts are provisioned directly by system administrators.
                </p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-2">
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
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-semibold text-slate-700 mb-2">
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
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
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
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-teal-500/30 hover:-translate-y-px cursor-pointer"
              >
                {isSubmitting
                  ? <><span>Creating account…</span><Activity className="w-4 h-4 animate-spin" /></>
                  : <><span>Create Account</span><UserPlus className="w-4 h-4" /></>
                }
              </button>

              {/* Switch */}
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                className="w-full text-center text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors py-1 cursor-pointer"
              >
                Already have an account? Sign in
              </button>
            </form>
          )}

          {/* ─── FORGOT PASSWORD FORM ─── */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 mb-2">
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
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-teal-500/30 hover:shadow-lg hover:shadow-teal-500/40 hover:-translate-y-px cursor-pointer"
              >
                {isSubmitting
                  ? <><span>Sending Request…</span><Activity className="w-4 h-4 animate-spin" /></>
                  : <><span>Send Recovery Link</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>

              {/* Back Link */}
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                className="w-full flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-teal-600 hover:text-teal-700 transition py-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
            </form>
          )}

          {/* ─── RESET PASSWORD FORM ─── */}
          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 mb-2">
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
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirm-new-password" className="block text-sm font-semibold text-slate-700 mb-2">
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
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNew(!showConfirmNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirmNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-teal-500/30 hover:shadow-lg hover:shadow-teal-500/40 hover:-translate-y-px cursor-pointer"
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
