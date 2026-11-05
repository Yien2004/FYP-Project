import React, { useState, useEffect } from "react";
import PatientApp from "./PatientApp";
import StaffApp from "./staff/StaffApp";
import AdminApp from "./admin/AdminApp";
import StaffQueueManager from "./pages/StaffQueueManager";
import UnifiedAuthentication from "./screens/UnifiedAuthentication";
import RootLandingPage from "./screens/RootLandingPage";
import HospitalsPage from "./screens/HospitalsPage";
import DoctorsPage from "./screens/DoctorsPage";
import { getStaffAccountByEmail } from "./data/staffAccounts";

type UserRole = "patient" | "doctor" | "staff" | "admin" | "super_admin" | "Patient" | "Doctor" | "Staff" | "Admin" | "Nurse" | "Super Admin" | null;

// Public routes (no login required)
const PUBLIC_ROUTES = [
  "/", 
  "/login", 
  "/hospitals", 
  "/doctors", 
  "/staff/queue-manager", 
  "/admin/dashboard",
  "/admin/approvals",
  "/admin/holidays",
  "/patient/dashboard"
];

function resolveUserRole(email: string, rawRole?: string | null): string {
  const clean = (email || "").trim().toLowerCase();
  const staffAccount = getStaffAccountByEmail(clean);

  if (rawRole) {
    const r = rawRole.toLowerCase();
    if (r === "super_admin" || r === "super admin" || r === "superadmin") return "super_admin";
    if (r === "staff" || r === "nurse") return "staff";
    if (r === "doctor") return "doctor";
    if (r === "admin") return "admin";
    if (r === "patient") return "patient";
  }

  if (staffAccount) {
    const r = (staffAccount.role || "").toLowerCase();
    if (r === "super_admin" || r === "superadmin") return "super_admin";
    if (r === "staff" || r === "nurse") return "staff";
    if (r === "doctor") return "doctor";
    if (r === "admin") return "admin";
  }

  if (clean.includes("superadmin")) return "super_admin";
  if (clean.includes("frontdesk")) return "staff";
  if (clean.startsWith("dr_") || clean.includes("doctor")) return "doctor";
  if (clean.includes("admin")) return "admin";

  return "patient";
}

export default function App() {
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("lifelink_user_email") || localStorage.getItem("carepoint_user_email") || "";
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    const email = localStorage.getItem("lifelink_user_email") || localStorage.getItem("carepoint_user_email") || "";
    const savedRole = localStorage.getItem("lifelink_user_role") || localStorage.getItem("carepoint_user_role") || null;
    return (resolveUserRole(email, savedRole) || null) as UserRole;
  });
 
  const isResetTokenPresent = () => {
    if (typeof window === "undefined") return false;
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    return search.includes("token=") || hash.includes("access_token=") || hash.includes("type=recovery");
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (isResetTokenPresent()) {
      try {
        localStorage.removeItem("carepoint_logged");
        localStorage.removeItem("lifelink_logged");
      } catch (_) {}
      return false;
    }
    return localStorage.getItem("lifelink_logged") === "true" || localStorage.getItem("carepoint_logged") === "true";
  });

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("lifelink_user_name") || localStorage.getItem("carepoint_user_name") || "";
  });

  const [route, setRoute] = useState<string>(() => {
    if (isResetTokenPresent()) return "/login";
    return window.location.pathname || "/";
  });

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname || "/");
    window.addEventListener("popstate", onPopState);

    // If URL contains reset password token, force logout and route to /login in reset mode
    if (isResetTokenPresent()) {
      setIsLoggedIn(false);
      setRoute("/login");
      setAuthInitialMode("reset");
    }

    // Sync role from cached email if present
    const email = localStorage.getItem("lifelink_user_email") || localStorage.getItem("carepoint_user_email") || "";
    if (email) {
      const resolved = resolveUserRole(email, userRole);
      if (resolved !== userRole) {
        setUserRole(resolved as UserRole);
      }
    }

    // Redirect unknown routes to "/"
    if (!PUBLIC_ROUTES.includes(route)) {
      window.history.replaceState({}, "", "/");
      setRoute("/");
    }

    return () => window.removeEventListener("popstate", onPopState);
  }, [route]);

  /* ── Navigation helpers ── */
  const navigate = (path: string) => {
    const url = new URL(path, window.location.origin);
    window.history.pushState({}, "", path);
    setRoute(url.pathname);
  };

  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register" | "forgot" | "reset">(() => {
    if (isResetTokenPresent()) return "reset";
    return "login";
  });

  const navigateToLogin = (mode?: "login" | "register" | "forgot" | "reset") => {
    setAuthInitialMode(mode || "login");
    navigate("/login");
  };
  const navigateToHome = () => navigate("/");
  const navigateToHospitals = (params?: string) => navigate(params ? `/hospitals?${params}` : "/hospitals");
  const navigateToDoctors = (params?: string) => navigate(params ? `/doctors?${params}` : "/doctors");

  /* ── Auth callbacks ── */
  const handleLoginSuccess = (email: string, role: string, name: string) => {
    const effectiveRole = resolveUserRole(email, role);
    const staffAccount = getStaffAccountByEmail(email);

    setUserEmail(email);
    setUserRole(effectiveRole as UserRole);
    setUserName(name);
    setIsLoggedIn(true);

    if (effectiveRole === "admin" || effectiveRole === "super_admin" || effectiveRole === "doctor" || effectiveRole === "staff") {
      localStorage.setItem("lifelink_user_email", email);
      localStorage.setItem("lifelink_user_role", effectiveRole);
      localStorage.setItem("lifelink_user_name", name);
      localStorage.setItem("lifelink_logged", "true");
      if (staffAccount) {
        localStorage.setItem("lifelink_user_clinic", staffAccount.hospital);
        localStorage.setItem("lifelink_user_department", staffAccount.department);
        localStorage.setItem("lifelink_facility_id", String(staffAccount.facility_id));
        if (staffAccount.room_number) {
          localStorage.setItem("lifelink_room_number", staffAccount.room_number);
        }
      }
      localStorage.removeItem("carepoint_logged");
      localStorage.removeItem("carepoint_user_role");
    } else {
      localStorage.setItem("carepoint_user_email", email);
      localStorage.setItem("carepoint_user_role", effectiveRole);
      localStorage.setItem("carepoint_user_name", name);
      localStorage.setItem("carepoint_logged", "true");
      localStorage.removeItem("lifelink_user_email");
      localStorage.removeItem("lifelink_user_role");
      localStorage.removeItem("lifelink_user_name");
      localStorage.removeItem("lifelink_logged");
    }

    window.history.replaceState({}, "", "/");
    setRoute("/");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setUserEmail("");
    setUserName("");

    localStorage.removeItem("lifelink_user_email");
    localStorage.removeItem("lifelink_user_role");
    localStorage.removeItem("lifelink_user_name");
    localStorage.removeItem("lifelink_logged");
    localStorage.removeItem("lifelink_user_clinic");
    localStorage.removeItem("lifelink_user_department");
    localStorage.removeItem("lifelink_facility_id");
    localStorage.removeItem("lifelink_room_number");

    localStorage.removeItem("carepoint_user_email");
    localStorage.removeItem("carepoint_user_role");
    localStorage.removeItem("carepoint_user_name");
    localStorage.removeItem("carepoint_logged");
    localStorage.removeItem("carepoint_access_token");
    localStorage.removeItem("carepoint_default_region");
    localStorage.removeItem("carepoint_default_language");

    window.history.replaceState({}, "", "/");
    setRoute("/");
  };

  /* ── Dedicated Standalone Workstations (Accessible anytime) ── */
  if (route === "/staff/queue-manager") {
    return <StaffQueueManager onLogout={handleLogout} />;
  }

  /* ── Password Reset / Recovery link intercept ── */
  if (isResetTokenPresent()) {
    return (
      <UnifiedAuthentication
        onLoginSuccess={handleLoginSuccess}
        onNavigateBack={navigateToHome}
        initialMode="reset"
      />
    );
  }

  /* ── Not logged in or /login route ── */
  if (!isLoggedIn || route === "/login") {
    switch (route) {
      case "/login":
        return (
          <UnifiedAuthentication
            onLoginSuccess={handleLoginSuccess}
            onNavigateBack={navigateToHome}
            initialMode={authInitialMode}
          />
        );

      case "/hospitals":
        return (
          <HospitalsPage
            onNavigateLogin={navigateToLogin}
            onNavigateBack={navigateToHome}
            onNavigateDoctors={navigateToDoctors}
          />
        );

      case "/doctors":
        return (
          <DoctorsPage
            onNavigateLogin={navigateToLogin}
            onNavigateBack={navigateToHome}
            onNavigateHospitals={navigateToHospitals}
          />
        );

      case "/staff/queue-manager":
        return <StaffQueueManager onLogout={handleLogout} />;

      default:
        return (
          <RootLandingPage
            onNavigateLogin={navigateToLogin}
            onNavigateHospitals={navigateToHospitals}
            onNavigateDoctors={navigateToDoctors}
            onLoginSuccess={handleLoginSuccess}
          />
        );
    }
  }

  /* ── Logged in: role-based dashboard redirect matrix ──
     Staff / Doctor / Nurse → StaffApp (previous clinical staff portal)
     Admin                 → AdminApp (system administration panel)
     Patient               → PatientApp (general patient portal)
  ── */
  const normalizedRole = (userRole || "").toLowerCase();

  switch (normalizedRole) {
    case "staff":
    case "doctor":
    case "nurse":
      return (
        <StaffApp
          onBackToPatientPortal={handleLogout}
          initialEmail={userEmail}
          initialRole={userRole}
          initialName={userName}
        />
      );

    case "super_admin":
    case "admin":
      return (
        <AdminApp
          onBackToPatientPortal={handleLogout}
          initialEmail={userEmail}
          initialRole={userRole}
          initialName={userName}
        />
      );

    case "patient":
    default:
      return <PatientApp onLogout={handleLogout} />;
  }
}
