import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Wrench,
  ClipboardList,
  History,
  MapPin,
  Star,
  Bell,
  MessageCircle,
  UserRound,
  LogOut
} from 'lucide-react';

import logo from '../../../assets/logo.png';
import './CustomerSidebar.css';

const navigationItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'myOrders', label: 'My Orders', icon: Package },
  { id: 'bookRepair', label: 'Book a Repair', icon: Wrench },
  { id: 'myBookings', label: 'My Bookings', icon: ClipboardList },
  { id: 'history', label: 'Booking History', icon: History },
  { id: 'trackTechnician', label: 'Track Technician', icon: MapPin },
  { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'chatbot', label: 'AI Chatbot', icon: MessageCircle },
  { id: 'profile', label: 'My Profile', icon: UserRound }
];

const CustomerSidebar = ({
  activeSection,
  onSectionChange,
  sidebarOpen,
  onLogout
}) => {
  return (
    <aside className={`customer-sidebar ${sidebarOpen ? '' : 'closed'}`}>

      {/* GasConnect Branding */}
      <div className="customer-sidebar-brand">
        {sidebarOpen && (
          <img
            src={logo}
            alt="GasConnect Customer Portal"
            className="customer-brand-logo"
          />
        )}
      </div>

      <div className="sidebar-menu-heading">
        {sidebarOpen && 'CUSTOMER MENU'}
      </div>

      {/* Navigation */}
      <nav className="customer-sidebar-nav">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.id}
              className={`sidebar-nav-item ${
                activeSection === item.id ? 'active' : ''
              }`}
              onClick={() => onSectionChange(item.id)}
              title={!sidebarOpen ? item.label : ''}
            >
              <Icon size={20} />

              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="customer-sidebar-bottom">
        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
          title={!sidebarOpen ? 'Logout' : ''}
        >
          <LogOut size={20} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
};

export default CustomerSidebar;
