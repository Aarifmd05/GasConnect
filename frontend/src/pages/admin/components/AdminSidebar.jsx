import {
    LayoutDashboard,
    Users,
    HardHat,
    CalendarCheck,
    Wrench,
    Layers,
    Package,
    ShoppingBag,
    Star,
    Settings,
    LogOut,
    X
} from 'lucide-react';

import logo from '../../../assets/logo.png';
import './AdminSidebar.css';

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Customers', icon: Users },
    { name: 'Technicians', icon: HardHat },
    { name: 'Bookings', icon: CalendarCheck },
    { name: 'Repair Types', icon: Wrench },
    { name: 'Service Categories', icon: Layers },
    { name: 'Products & Inventory', icon: Package },
    { name: 'Orders', icon: ShoppingBag },
    { name: 'Reviews', icon: Star },
    { name: 'Settings', icon: Settings }
];

export default function AdminSidebar({
    activeMenu,
    onMenuClick,
    sidebarOpen,
    onClose,
    onLogout
}) {
    return (
        <>
            {sidebarOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
                aria-label="Admin navigation"
            >
                <div className="admin-sidebar-logo">
                    <img src={logo} alt="GasConnect Logo" />
                    <button
                        type="button"
                        className="admin-sidebar-close"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="admin-sidebar-heading">ADMIN MENU</div>

                <nav className="admin-navigation">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                type="button"
                                key={item.name}
                                className={`admin-nav-item ${activeMenu === item.name ? 'active' : ''}`}
                                onClick={() => onMenuClick(item.name)}
                                aria-current={activeMenu === item.name ? 'page' : undefined}
                            >
                                <Icon size={20} />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="admin-sidebar-bottom">
                    <button
                        type="button"
                        className="admin-logout"
                        onClick={onLogout}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
