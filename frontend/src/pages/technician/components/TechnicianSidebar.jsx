
import {
  LayoutDashboard,
  ClipboardList,
  BriefcaseBusiness,
  History,
  UserRound,
  LogOut,
  X
} from 'lucide-react';

import logo from '../../../assets/logo.png';
import './TechnicianSidebar.css';

const menuItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'requests', label: 'Job Requests', icon: ClipboardList },
  { id: 'assigned', label: 'Assigned Jobs', icon: BriefcaseBusiness },
  { id: 'history', label: 'Work History', icon: History },
  { id: 'profile', label: 'My Profile', icon: UserRound }
];

export default function TechnicianSidebar({
  activeSection,
  setActiveSection,
  sidebarOpen,
  setSidebarOpen,
  onLogout
}) {
  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="technician-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`technician-sidebar ${
          sidebarOpen ? 'open' : ''
        }`}
      >
        {/* GasConnect Branding */}
        <div className="technician-sidebar-header">
          <img
            src={logo}
            alt="GasConnect Technician Portal"
            className="technician-brand-logo"
          />

          <button
            type="button"
            className="technician-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation heading */}
        <div className="technician-sidebar-label">
          WORKSPACE
        </div>

        {/* Navigation menu */}
        <nav className="technician-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.id}
                className={`technician-nav-item ${
                  activeSection === item.id ? 'active' : ''
                }`}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="technician-sidebar-bottom">
          <div className="technician-sidebar-tip">
            <strong>Work Smart. Stay Safe.</strong>
            <p>
              Deliver reliable service with GasConnect.
            </p>
          </div>

          <button
            type="button"
            className="technician-logout"
            onClick={onLogout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
