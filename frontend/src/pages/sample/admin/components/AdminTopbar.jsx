import { Bell, Menu, Search, UserCircle } from 'lucide-react';

function AdminTopbar({
    activeMenu,
    sidebarOpen,
    onMenuToggle,
    searchTerm,
    setSearchTerm
}) {
    const searchPlaceholder =
        activeMenu === 'Customers'
            ? 'Search customers...'
            : activeMenu === 'Technicians'
                ? 'Search technicians...'
                : activeMenu === 'Bookings'
                    ? 'Search bookings...'
                    : activeMenu === 'Repair Types'
                        ? 'Search repair types...'
                        : activeMenu === 'Service Categories'
                            ? 'Search categories...'
                            : activeMenu === 'Orders'
                                ? 'Search orders...'
                                : activeMenu === 'Reviews'
                                    ? 'Search reviews...'
                                    : 'Search anything...';

    return (
        <header className="admin-topbar">
            <button
                className="admin-menu-toggle"
                onClick={onMenuToggle}
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
            >
                <Menu size={25} />
            </button>

            <div className="admin-search">
                <Search size={19} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="admin-topbar-right">
                <button className="admin-notification">
                    <Bell size={22} />
                </button>

                <div className="admin-profile">
                    <UserCircle size={36} />
                    <div>
                        <h4>Administrator</h4>
                        <p>Admin</p>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default AdminTopbar;
