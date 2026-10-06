import React, { useState, useEffect } from "react";
import PatientApp from "./PatientApp";
import StaffApp from "./staff/StaffApp";
import AdminApp from "./admin/AdminApp";
import UnifiedAuthentication from "./screens/UnifiedAuthentication";
import RootLandingPage from "./screens/RootLandingPage";
import HospitalsPage from "./screens/HospitalsPage";
import DoctorsPage from "./screens/DoctorsPage";

type UserRole = "Patient" | "Doctor" | "Nurse" | "Admin" | null;

// Public routes (no login required)
const PUBLIC_ROUTES = ["/", "/login", "/hospitals", "/doctors"];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("lifelink_logged") === "true" || localStorage.getItem("carepoint_logged") === "true";
  });
  const [userRole, setUserRole]     = useState<UserRole>(() => {
    return (localStorage.getItem("lifelink_user_role") || localStorage.getItem("carepoint_user_role") || null) as UserRole;
  });
  const [userEmail, setUserEmail]   = useState(() => {
    return localStorage.getItem("lifelink_user_email") || localStorage.getItem("carepoint_user_email") || "";
  });
  const [userName, setUserName]     = useState(() => {
    return localStorage.getItem("lifelink_user_name") || localStorage.getItem("carepoint_user_name") || "";
  });
  const [route, setRoute]           = useState<string>(window.location.pathname || "/");

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname || "/");
    window.addEventListener("popstate", onPopState);

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

  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register">("login");

  const navigateToLogin     = (mode?: "login" | "register") => {
    setAuthInitialMode(mode || "login");
    navigate("/login");
  };
  const navigateToHome      = () => navigate("/");
  const navigateToHospitals = (params?: string) => navigate(params ? `/hospitals?${params}` : "/hospitals");
  const navigateToDoctors   = (params?: string) => navigate(params ? `/doctors?${params}` : "/doctors");

  /* ── Auth callbacks ── */
  const handleLoginSuccess = (email: string, role: string, name: string) => {
    setUserEmail(email);
    setUserRole(role as UserRole);
    setUserName(name);
    setIsLoggedIn(true);

    if (role === "Doctor" || role === "Nurse" || role === "Admin") {
      localStorage.setItem("lifelink_user_email", email);
      localStorage.setItem("lifelink_user_role", role);
      localStorage.setItem("lifelink_user_name", name);
      localStorage.setItem("lifelink_logged", "true");
    } else {
      localStorage.setItem("carepoint_user_email", email);
      localStorage.setItem("carepoint_user_role", role);
      localStorage.setItem("carepoint_user_name", name);
      localStorage.setItem("carepoint_logged", "true");
    }

    window.history.replaceState({}, "", "/");
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

    localStorage.removeItem("carepoint_user_email");
    localStorage.removeItem("carepoint_user_role");
    localStorage.removeItem("carepoint_user_name");
    localStorage.removeItem("carepoint_logged");
    localStorage.removeItem("carepoint_access_token");

    window.history.replaceState({}, "", "/");
    setRoute("/");
  };

  /* ── Not logged in: public routes ── */
  if (!isLoggedIn) {
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
     Patient  → PatientApp  (general patient portal)
     Doctor   → StaffApp    (clinical staff dashboard)
     Nurse    → StaffApp    (clinical staff dashboard)
     Admin    → AdminApp    (system administration panel)
  ── */
  switch (userRole) {
    case "Admin":
      return (
        <AdminApp
          onBackToPatientPortal={handleLogout}
          initialEmail={userEmail}
          initialRole={userRole}
          initialName={userName}
        />
      );
    case "Doctor":
    case "Nurse":
      return (
        <StaffApp
          onBackToPatientPortal={handleLogout}
          initialEmail={userEmail}
          initialRole={userRole}
          initialName={userName}
        />
      );
    case "Patient":
    default:
      return <PatientApp onLogout={handleLogout} />;
  }
}
