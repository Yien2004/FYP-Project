import React, { useState, useEffect } from 'react';
import Sidebar from '../staff/components/Sidebar';
import Header from '../staff/components/Header';
import Authentication from '../staff/components/Authentication';
import AdminDashboard from '../staff/components/sections/AdminDashboard';
import StaffManagementSection from '../staff/components/sections/StaffManagementSection';
import PatientManagementSection from '../staff/components/sections/PatientManagementSection';
import AppointmentsSection from '../staff/components/sections/AppointmentsSection';
import ChatAuditSection from '../staff/components/sections/ChatAuditSection';
import ReportsSection from '../staff/components/sections/ReportsSection';
import ProblemInboxSection from '../staff/components/sections/ProblemInboxSection';
import AdminSettingsSection from '../staff/components/sections/AdminSettingsSection';
import AdminProfileSection from '../staff/components/sections/AdminProfileSection';
import { AdminTab } from '../staff/types';

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
  const [userName, setUserName] = useState(() => {
    return initialName || localStorage.getItem('lifelink_user_name') || 'System Admin';
  });
  const [userRole, setUserRole] = useState(() => {
    return initialRole || 'Administrator';
  });
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [pendingStaffCount, setPendingStaffCount] = useState(0);

  const fetchPendingCount = () => {
    fetch("/api/admin/staff-requests")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPendingStaffCount(data.length);
        }
      })
      .catch(err => console.error("Failed to fetch pending staff count", err));
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

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
      setUserName(cachedName || 'System Admin');
      setUserRole('Administrator');
      setIsLoggedIn(true);
      setAdminTab('dashboard');
    }
  }, [initialEmail, initialRole, initialName]);

  const handleLoginSuccess = (email: string, role: string, name: string) => {
    localStorage.setItem('lifelink_user_email', email);
    localStorage.setItem('lifelink_user_role', role);
    localStorage.setItem('lifelink_user_name', name);
    localStorage.setItem('lifelink_logged', 'true');

    setUserEmail(email);
    setUserRole(role === 'Admin' ? 'Administrator' : role);
    setUserName(name);
    setIsLoggedIn(true);
    setAdminTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('lifelink_user_email');
    localStorage.removeItem('lifelink_user_role');
    localStorage.removeItem('lifelink_user_name');
    localStorage.removeItem('lifelink_logged');

    setUserEmail('');
    setUserRole('Administrator');
    setUserName('');
    setIsLoggedIn(false);

    if (onBackToPatientPortal) {
      onBackToPatientPortal();
    }
  };

  const getPageTitle = () => {
    const titles: Record<AdminTab, string> = {
      dashboard: 'Administrative Command Center',
      staff: 'Staff Credentials & Registrations',
      patients: 'Patient Identity & Enrollment',
      appointments: 'Enterprise Scheduling Matrix',
      chats: 'Communication Audits',
      reports: 'Audit Reports & Security Logs',
      problems: 'Support Problem Inbox',
      notifications: 'Create System-Wide Notifications',
      settings: 'System Administrator Account Settings',
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased text-sm">
      <Sidebar
        portal="admin"
        hidePortalSwitcher
        setPortal={() => {}}
        staffTab="dashboard"
        setStaffTab={() => {}}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        userName={userName}
        pendingStaffCount={pendingStaffCount}
        onLogout={handleLogout}
      />

      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header
          portal="admin"
          title={getPageTitle()}
          activeStatusText="Secure audit and approval mode"
          onLogout={handleLogout}
          userName={userName || 'System Administrator'}
          userRole={userRole}
        />

        <main className="flex-1 overflow-y-auto p-8 bg-neutral-50/60">
          <div className="max-w-[1450px] mx-auto min-h-full">
            {adminTab === 'dashboard' && <AdminDashboard />}
            {adminTab === 'staff' && <StaffManagementSection />}
            {adminTab === 'patients' && <PatientManagementSection />}
            {adminTab === 'appointments' && <AppointmentsSection />}
            {adminTab === 'chats' && <ChatAuditSection />}
            {adminTab === 'reports' && <ReportsSection />}
            {adminTab === 'problems' && <ProblemInboxSection />}
            {adminTab === 'notifications' && <AdminSettingsSection />}
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
