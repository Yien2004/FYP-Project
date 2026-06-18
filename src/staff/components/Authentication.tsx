import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, Activity, ArrowLeft } from "lucide-react";

interface AuthenticationProps {
  onLoginSuccess: (email: string, role: string, name: string) => void;
  onBackToPatientPortal?: () => void;
  defaultEmail?: string;
  allowedRoles?: string[];
  enableRegistration?: boolean;
  portalName?: string;
}

type StaffRole = 'Doctor' | 'Nurse' | 'Admin';

type AuthMode = 'login' | 'reset-password' | 'update-password' | 'register';

export default function Authentication({
  onLoginSuccess,
  onBackToPatientPortal,
  defaultEmail = "",
  allowedRoles,
  enableRegistration = false,
  portalName = 'Staff Portal',
}: AuthenticationProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const isAdminPortal = portalName.toLowerCase().includes('admin');
  const [registerRole, setRegisterRole] = useState<StaffRole>(isAdminPortal ? 'Admin' : 'Doctor');
  const [strengthMeter, setStrengthMeter] = useState({ score: 0, label: "Empty", color: "bg-slate-200" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  const handlePasswordChange = (val: string) => {
    setNewPassword(val);
    
    let score = 0;
    if (val.length >= 6) score += 1;
    if (val.length >= 10) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;

    let label = "Weak";
    let color = "bg-teal-500 w-1/4";
    if (score === 0) {
      label = "Empty";
      color = "bg-slate-200 w-0";
    } else if (score <= 2) {
      label = "Weak";
      color = "bg-rose-500 w-1/3";
    } else if (score <= 4) {
      label = "Medium";
      color = "bg-amber-400 w-2/3";
    } else {
      label = "Very Strong";
      color = "bg-emerald-500 w-full";
    }

    setStrengthMeter({ score, label, color });
  };

  const handleStaffRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill all registration fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password should be at least 8 characters.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isAdminPortal && registerRole === 'Admin') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName, role: registerRole, password }),
        });
        if (!res.ok) {
          const data = await res.json();
          setErrorMessage(data.error || 'Unable to create admin account.');
          return;
        }
        setRequestSuccess('Admin account created successfully. Please sign in.');
      } else {
        const res = await fetch('/api/staff/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName, role: registerRole, password }),
        });
        if (!res.ok) {
          const data = await res.json();
          setErrorMessage(data.error || 'Unable to submit staff registration request.');
          return;
        }
        setRequestSuccess('Your staff registration request has been submitted. An admin will review and approve it.');
      }
      setMode('login');
      setFullName('');
      setPassword('');
      setConfirmPassword('');
      setRegisterRole(isAdminPortal ? 'Admin' : 'Doctor');
    } catch {
      setErrorMessage('Unable to submit the registration request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure staff login input starts empty and clear any cached staff email on mount
  useEffect(() => {
    setEmail("");
    try {
      localStorage.removeItem("lifelink_user_email");
      localStorage.removeItem("lifelink_user_role");
      localStorage.removeItem("lifelink_logged");
    } catch (e) {
      /* ignore */
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
        const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed.");
        return;
      }
      const role = data.user.role;
      if (allowedRoles && !allowedRoles.includes(role)) {
        setErrorMessage(`Access denied. ${role} accounts cannot sign in here.`);
        return;
      }
      if (!allowedRoles && role === 'Patient') {
        setErrorMessage("Access denied. Patient accounts must use the Patient Portal.");
        return;
      }
      onLoginSuccess(email, role, data.user.name);
    } catch {
      setErrorMessage("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter an email address.");
      return;
    }
    setErrorMessage("");
    setIsSubmitted(true);
    setTimeout(() => {
      setMode('update-password');
      setIsSubmitted(false);
    }, 2000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }
    if (strengthMeter.score < 2) {
      setErrorMessage("Please choose a stronger password.");
      return;
    }
    setErrorMessage("");
    setIsSubmitted(true);
    setTimeout(() => {
      setMode('login');
      setIsSubmitted(false);
      setNewPassword("");
      setConfirmPassword("");
    }, 2000);
  };

  return (
    <div id="auth-container" className="min-h-screen w-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[45%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl">
        {onBackToPatientPortal && (
          <button
            onClick={onBackToPatientPortal}
            className="absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> PATIENT PORTAL
          </button>
        )}

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5 font-sans">
            {mode === 'login' && `${portalName} Sign In`}
            {mode === 'reset-password' && "Reset Staff Access Code"}
            {mode === 'register' && "Request Staff Access"}
            {mode === 'update-password' && "Define New Password"}
          </h2>
          <p className="text-slate-400 text-xs">
            {mode === 'login' && `Authorized ${portalName} login for approved staff accounts.`}
            {mode === 'reset-password' && "We will transmit recovery credentials to your email."}
            {mode === 'register' && "Submit your details and wait for an admin to approve your staff access."}
            {mode === 'update-password' && "Establish a robust authorization password below."}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 mb-6 flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {requestSuccess && (
          <div className="bg-teal-500/10 border border-teal-500/20 text-teal-900 text-xs rounded-xl p-3 mb-6 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{requestSuccess}</span>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input 
                  id="auth-input-email"
                  type="email" 
                  required
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono tracking-wider uppercase text-slate-400">Password / Key</label>
                <button 
                  type="button"
                  onClick={() => setMode('reset-password')}
                  className="text-teal-300 hover:text-white transition text-xs font-medium"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input 
                  id="auth-input-password"
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                  placeholder="Enter your password"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              id="auth-btn-signin"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>Authenticating... <Activity className="w-4 h-4 animate-spin" /></>
              ) : (
                <>Secure Staff Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {enableRegistration && (
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                  setRequestSuccess('');
                }}
                className="w-full text-center text-xs text-slate-300 hover:text-white transition mt-4 block"
              >
                {isAdminPortal ? 'Create admin account instead' : 'Request staff access instead'}
              </button>
            )}
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleStaffRequestSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                placeholder="Dr. Amina Rahman"
              />
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Professional Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                placeholder="name@clinic.org"
              />
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Role</label>
              <select
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value as StaffRole)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
              >
                {isAdminPortal ? (
                  <option value="Admin">Admin</option>
                ) : (
                  <>
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                placeholder="Create a secure password"
              />
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                placeholder="Repeat your password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>Submitting request... <Activity className="w-4 h-4 animate-spin" /></>
              ) : (
                "Submit Registration Request"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setRequestSuccess('');
              }}
              className="w-full text-center text-xs text-slate-300 hover:text-white transition mt-4 block"
            >
              Back to Staff Sign In
            </button>
          </form>
        )}

        {mode === 'reset-password' && (
          <form onSubmit={handleResetRequest} className="space-y-5">
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition"
                  placeholder="name@lifelink.org"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitted}
              className={`w-full ${isSubmitted ? 'bg-emerald-600' : 'bg-red-600 hover:bg-red-500'} text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2`}
            >
              {isSubmitted ? (
                <>Transmitting Security Code... <Activity className="w-4 h-4 animate-spin" /></>
              ) : (
                "Send Verification Ticket"
              )}
            </button>

            <button 
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition mt-4 block"
            >
              Return back to Sign In
            </button>
          </form>
        )}

        {mode === 'update-password' && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2">Proposed New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-red-500 focus:outline-none transition animate-none"
                  placeholder="Type new secure pass code..."
                />
              </div>

              <div id="password-strength-container" className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Security Index:</span>
                  <span className={`font-mono font-bold ${
                    strengthMeter.score <= 2 ? "text-red-400" :
                    strengthMeter.score <= 4 ? "text-amber-400" : "text-emerald-400"
                  }`}>{strengthMeter.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strengthMeter.color}`} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-slate-400 mb-2 font-medium">Verify Code</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-red-500 focus:outline-none transition"
                  placeholder="Repeat code..."
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitted}
              className={`w-full ${isSubmitted ? 'bg-emerald-600' : 'bg-red-600 hover:bg-red-500'} text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2`}
            >
              {isSubmitted ? (
                <>Updating Security Credentials... <Activity className="w-4 h-4 animate-spin" /></>
              ) : (
                "Update Secure credentials"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
