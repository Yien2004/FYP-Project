import React, { useState, useEffect } from 'react';
import Sidebar from '../staff/components/Sidebar';
import Header from '../staff/components/Header';
import Authentication from '../staff/components/Authentication';
import AdminDashboard from '../staff/components/sections/AdminDashboard';
import StaffManagementSection from '../staff/components/sections/StaffManagementSection';
import PatientManagementSection from '../staff/components/sections/PatientManagementSection';
import AppointmentsSection from '../staff/components/sections/AppointmentsSection';
import AdminSettingsSection from '../staff/components/sections/AdminSettingsSection';
import AdminProfileSection from '../staff/components/sections/AdminProfileSection';
import AdminApprovals from '../pages/AdminApprovals';
import AdminHolidays from '../pages/AdminHolidays';
import AdminDoctorRosters from '../pages/AdminDoctorRosters';
import { AdminTab } from '../staff/types';
import { getStaffAccountByEmail } from '../data/staffAccounts';

interface AdminAppProps {
  onBackToPatientPortal?: () => void;
  initialEmail?: string;
  initialRole?: string;
  initialName?: string;
}

export default function AdminApp({
  onBackToPatientPortal,
  initialEmail = '',
  initialRole = '',
  initialName = '',
}: AdminAppProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (initialEmail) return true;
    return localStorage.getItem('lifelink_logged') === 'true';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return initialEmail || localStorage.getItem('lifelink_user_email') || '';
  });
  const staffAccount = React.useMemo(() => getStaffAccountByEmail(userEmail), [userEmail]);
  const [userName, setUserName] = useState(() => {
    return initialName || staffAccount?.name || localStorage.getItem('lifelink_user_name') || 'Hospital Admin';
  });
  const [userRole, setUserRole] = useState(() => {
    return initialRole || 'Administrator';
  });
  const [adminTab, setAdminTab] = useState<AdminTab>(() => {
    const p = window.location.pathname;
    if (p === '/admin/approvals') return 'approvals';
    if (p === '/admin/holidays') return 'holidays';
    if (p === '/admin/rosters') return 'rosters';
    return 'dashboard';
  });
  const [pendingStaffCount, setPendingStaffCount] = useState(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onPop = () => {
      const p = window.location.pathname;
      if (p === '/admin/approvals') setAdminTab('approvals');
      else if (p === '/admin/holidays') setAdminTab('holidays');
      else if (p === '/admin/rosters') setAdminTab('rosters');
      else if (p === '/admin/dashboard') setAdminTab('dashboard');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleNavigateTab = (tab: AdminTab) => {
    setAdminTab(tab);
    if (tab === 'approvals') {
      window.history.pushState({}, '', '/admin/approvals');
    } else if (tab === 'holidays') {
      window.history.pushState({}, '', '/admin/holidays');
    } else if (tab === 'rosters') {
      window.history.pushState({}, '', '/admin/rosters');
    } else if (tab === 'dashboard') {
      window.history.pushState({}, '', '/admin/dashboard');
    }
  };

  const fetchPendingCounts = () => {
    fetch("/api/admin/staff-requests")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPendingStaffCount(data.length);
        }
      })
      .catch(err => console.error("Failed to fetch pending staff count", err));

    const facId = staffAccount?.facility_id || 1;
    fetch(`/api/admin/approvals/pending-requests?facilityId=${facId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const total = (data.pendingDoctors?.length || 0) + (data.pendingDepartments?.length || 0);
          setPendingApprovalsCount(total);
        }
      })
      .catch(err => console.warn("Failed to fetch pending approvals count", err));
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchPendingCounts();
      const interval = setInterval(fetchPendingCounts, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, staffAccount]);

  useEffect(() => {
    if (initialEmail) {
      localStorage.setItem('lifelink_user_email', initialEmail);
      localStorage.setItem('lifelink_user_role', initialRole);
      localStorage.setItem('lifelink_user_name', initialName);
      localStorage.setItem('lifelink_logged', 'true');
      return;
    }
    const cachedEmail = localStorage.getItem('lifelink_user_email');
    const cachedRole = localStorage.getItem('lifelink_user_role');
    const cachedName = localStorage.getItem('lifelink_user_name');
    const cachedLogged = localStorage.getItem('lifelink_logged') === 'true';

    if (cachedLogged && cachedEmail && cachedRole === 'Admin') {
      setUserEmail(cachedEmail);
      setUserName(cachedName || staffAccount?.name || 'Hospital Admin');
      setUserRole('Administrator');
      setIsLoggedIn(true);
      setAdminTab('dashboard');
    }
  }, [initialEmail, initialRole, initialName, staffAccount]);

  const handleLoginSuccess = (email: string, role: string, name: string) => {
    const acc = getStaffAccountByEmail(email);
    const resolvedName = name || acc?.name || 'Hospital Admin';

    localStorage.setItem('lifelink_user_email', email);
    localStorage.setItem('lifelink_user_role', role);
    localStorage.setItem('lifelink_user_name', resolvedName);
    localStorage.setItem('lifelink_logged', 'true');
    if (acc) {
      localStorage.setItem('lifelink_user_clinic', acc.hospital);
      localStorage.setItem('lifelink_facility_id', String(acc.facility_id));
      localStorage.setItem('lifelink_user_department', acc.department);
    }

    setUserEmail(email);
    setUserRole(role === 'Admin' ? 'Administrator' : role);
    setUserName(resolvedName);
    setIsLoggedIn(true);
    setAdminTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('lifelink_user_email');
    localStorage.removeItem('lifelink_user_role');
    localStorage.removeItem('lifelink_user_name');
    localStorage.removeItem('lifelink_logged');
    localStorage.removeItem('lifelink_user_clinic');
    localStorage.removeItem('lifelink_facility_id');
    localStorage.removeItem('lifelink_user_department');

    setUserEmail('');
    setUserRole('Administrator');
    setUserName('');
    setIsLoggedIn(false);

    if (onBackToPatientPortal) {
      onBackToPatientPortal();
    }
  };

  const displayName = staffAccount?.name || userName || 'Hospital Admin';

  const getPageTitle = () => {
    const titles: Record<AdminTab, string> = {
      dashboard: staffAccount ? `${staffAccount.hospital} — Branch Admin Console` : 'Branch Administration Console',
      staff: 'Staff Credentials & Registrations',
      patients: 'Patient Directory & Identity Records',
      appointments: 'Enterprise Scheduling Matrix',
      notifications: 'Create System-Wide Notifications',
      settings: 'Branch Administrator Settings',
      approvals: 'Clinical Onboarding & Approvals Console',
      holidays: 'Facility Holiday & Slot Blocking Console',
      rosters: 'Doctor Roster & Appointment Slot Console',
    };
    return titles[adminTab];
  };

  if (!isLoggedIn) {
    return (
      <Authentication
        onLoginSuccess={handleLoginSuccess}
        onBackToPatientPortal={onBackToPatientPortal}
        allowedRoles={['Admin']}
        portalName="Admin Portal"
      />
    );
  }

  const isSuperAdmin = Boolean(
    userRole === 'super_admin' ||
    userRole === 'Super Admin' ||
    staffAccount?.role === 'super_admin' ||
    userEmail.toLowerCase().includes('superadmin')
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased text-sm">
      <Sidebar
        portal="admin"
        hidePortalSwitcher
        setPortal={() => {}}
        staffTab="dashboard"
        setStaffTab={() => {}}
        adminTab={adminTab}
        setAdminTab={handleNavigateTab}
        userName={displayName}
        pendingStaffCount={pendingStaffCount}
        pendingApprovalsCount={pendingApprovalsCount}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header
          portal="admin"
          title={isSuperAdmin && adminTab === 'dashboard' ? 'Group Super Executive Console' : getPageTitle()}
          activeStatusText={isSuperAdmin ? "PantaiCare Healthcare Group — Global Supervision (All Facilities)" : (staffAccount ? staffAccount.hospital : "Branch Operations Steady")}
          onLogout={handleLogout}
          userName={displayName}
          userRole={isSuperAdmin ? "Super Admin (Group Executive)" : undefined}
          onMenuToggle={() => setMobileMenuOpen(prev => !prev)}
        />

        <main className="flex-1 overflow-y-auto p-8 bg-neutral-50/60">
          <div className="max-w-[1450px] mx-auto min-h-full">
            {adminTab === 'dashboard' && <AdminDashboard isSuperAdmin={isSuperAdmin} />}
            {adminTab === 'approvals' && (
              <AdminApprovals onNavigateBack={() => handleNavigateTab('dashboard')} />
            )}
            {adminTab === 'holidays' && (
              <AdminHolidays onNavigateBack={() => handleNavigateTab('dashboard')} />
            )}
            {adminTab === 'rosters' && (
              <AdminDoctorRosters onNavigateBack={() => handleNavigateTab('dashboard')} />
            )}
            {adminTab === 'staff' && <StaffManagementSection isSuperAdmin={isSuperAdmin} />}
            {adminTab === 'patients' && <PatientManagementSection isSuperAdmin={isSuperAdmin} />}
            {adminTab === 'appointments' && <AppointmentsSection />}
            {adminTab === 'notifications' && <AdminSettingsSection isSuperAdmin={isSuperAdmin} />}
            {adminTab === 'settings' && (
              <AdminProfileSection 
                userName={userName} 
                userEmail={userEmail} 
                onUpdateProfile={(name, email) => {
                  setUserName(name);
                  setUserEmail(email);
                  localStorage.setItem('lifelink_user_name', name);
                  localStorage.setItem('lifelink_user_email', email);
                }} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
