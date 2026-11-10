import { useState } from 'react';

import TechnicianSidebar from './components/TechnicianSidebar';
import TechnicianTopbar from './components/TechnicianTopbar';

import Overview from './sections/Overview';
import JobRequests from './sections/JobRequests';
import AssignedJobs from './sections/AssignedJobs';
import WorkHistory from './sections/WorkHistory';
import TechnicianProfile from './sections/TechnicianProfile';

import './TechnicianDashboard.css';

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export default function TechnicianDashboard() {
  const [user] = useState(getStoredUser);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    window.location.href = '/technician/login';
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview user={user} />;

      case 'requests':
        return <JobRequests />;

      case 'assigned':
        return <AssignedJobs />;

      case 'history':
        return <WorkHistory />;

      case 'profile':
        return <TechnicianProfile />;

      default:
        return <Overview user={user} />;
    }
  };

  return (
    <div className="technician-dashboard">
      <TechnicianSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <main className="technician-main">
        <TechnicianTopbar
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => setActiveSection('profile')}
        />

        <div className="technician-content">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}