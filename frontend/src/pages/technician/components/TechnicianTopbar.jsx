
import { Menu, Bell, ChevronDown, UserRound } from 'lucide-react';

export default function TechnicianTopbar({
  user,
  onMenuClick,
  onProfileClick
}) {
  const name = user?.name || 'Technician';

  return (
    <header className="technician-topbar">
      <div className="technician-topbar-left">
        <button
          className="technician-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={23} />
        </button>

        <div>
          <h2>Technician Workspace</h2>
          <p>Manage your repair jobs and services</p>
        </div>
      </div>

      <div className="technician-topbar-right">
        <button
          className="technician-notification-button"
          title="Notifications"
          onClick={() => alert('Technician notifications will be added soon.')}
        >
          <Bell size={20} />
        </button>

        <button
          className="technician-user-button"
          onClick={onProfileClick}
        >
          <div className="technician-user-avatar">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="technician-user-details">
            <strong>{name}</strong>
            <span>Technician</span>
          </div>

          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
