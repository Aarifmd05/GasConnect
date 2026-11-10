
import {
    Users,
    HardHat,
    Clock,
    CalendarCheck,
    CheckCircle,
    AlertCircle,
    Package,
    Wrench
} from 'lucide-react';

function DashboardSection({
    stats,
    statsLoading,
    statsError,
    dashboardCards,
    handleMenuClick
}) {
    return (
        <>
            {/* Welcome Section */}
            <div className="admin-welcome">
                <div>
                    <h1>Welcome to GasConnect!</h1>
                    <p>Manage your gas services from one place.</p>
                </div>

                <span className="admin-role-label">
                    <CheckCircle size={16} />
                    Admin Portal
                </span>
            </div>

            {/* Overview */}
            <div className="admin-section-heading">
                <h2>Overview</h2>
                <p>Your platform summary</p>
            </div>

            {statsError && (
                <p className="admin-stat-error">{statsError}</p>
            )}

            {/* Statistics Cards */}
            <div className="admin-stats-grid">
                {dashboardCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            className="admin-stat-card"
                            key={card.title}
                        >
                            <div className="admin-stat-icon">
                                <Icon size={27} />
                            </div>

                            <div className="admin-stat-info">
                                <h3>{card.title}</h3>

                                <h2 className="admin-stat-value">
                                    {statsLoading ? '...' : card.value}
                                </h2>

                                <p>{card.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Dashboard Panels */}
            <div className="admin-dashboard-bottom">

                {/* Quick Actions */}
                <div className="admin-panel admin-quick-actions">
                    <h2>Quick Actions</h2>
                    <p>Manage important operations</p>

                    <button
                        onClick={() => handleMenuClick('Technicians')}
                    >
                        <HardHat size={19} />
                        Review Technician Approvals
                    </button>

                    <button
                        onClick={() => handleMenuClick('Bookings')}
                    >
                        <CalendarCheck size={19} />
                        Manage Bookings
                    </button>

                    <button
                        onClick={() => handleMenuClick('Products & Inventory')}
                    >
                        <Package size={19} />
                        Manage Inventory
                    </button>

                    <button
                        onClick={() => handleMenuClick('Repair Types')}
                    >
                        <Wrench size={19} />
                        Manage Repair Types
                    </button>
                </div>

                {/* Recent Activity */}
                <div className="admin-panel admin-activity">
                    <h2>Recent Activity</h2>
                    <p>Platform activity will appear here.</p>

                    <div className="admin-empty-activity">
                        <AlertCircle size={35} />

                        <h3>No activity to display</h3>

                        <span>
                            Recent bookings and account updates
                            will appear here.
                        </span>
                    </div>
                </div>

            </div>
        </>
    );
}

export default DashboardSection;
