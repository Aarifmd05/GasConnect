
import './DashboardSection.css';

import {
    HardHat,
    CalendarCheck,
    CheckCircle,
    AlertCircle,
    Package,
    Wrench,
    Clock
} from 'lucide-react';

function DashboardSection({
    stats,
    statsLoading,
    statsError,
    dashboardCards,
    handleMenuClick,
    bookings = []
}) {
    // Get the latest 5 bookings
    const recentBookings = [...bookings]
        .sort((a, b) => {
            return new Date(b.createdAt || b.bookingDate || 0) -
                   new Date(a.createdAt || a.bookingDate || 0);
        })
        .slice(0, 3);

    const getBookingTitle = (booking) => {
        return (
            booking.repairType?.name ||
            booking.repairType ||
            booking.serviceType ||
            booking.title ||
            'New Booking'
        );
    };

    const getCustomerName = (booking) => {
        return (
            booking.customer?.name ||
            booking.customerName ||
            booking.user?.name ||
            'Customer'
        );
    };

    const getBookingStatus = (booking) => {
        return booking.status || 'pending';
    };

    const formatActivityDate = (date) => {
        if (!date) return 'Date unavailable';

        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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

                    <button onClick={() => handleMenuClick('Technicians')}>
                        <HardHat size={19} />
                        Review Technician Approvals
                    </button>

                    <button onClick={() => handleMenuClick('Bookings')}>
                        <CalendarCheck size={19} />
                        Manage Bookings
                    </button>

                    <button onClick={() => handleMenuClick('Products & Inventory')}>
                        <Package size={19} />
                        Manage Inventory
                    </button>

                    <button onClick={() => handleMenuClick('Repair Types')}>
                        <Wrench size={19} />
                        Manage Repair Types
                    </button>
                </div>

                {/* Recent Activity */}
                <div className="admin-panel admin-activity">
                    <h2>Recent Activity</h2>
                    <p>Latest booking updates on your platform.</p>

                    {recentBookings.length === 0 ? (
                        <div className="admin-empty-activity">
                            <AlertCircle size={35} />
                            <h3>No activity to display</h3>
                            <span>
                                Recent bookings will appear here.
                            </span>
                        </div>
                    ) : (
                        <div className="admin-recent-activity-list">
                            {recentBookings.map((booking) => (
                                <div
                                    className="admin-activity-item"
                                    key={booking._id}
                                >
                                    <div className="admin-activity-icon">
                                        <CalendarCheck size={19} />
                                    </div>

                                    <div className="admin-activity-details">
                                        <h3>{getBookingTitle(booking)}</h3>

                                        <p>
                                            {getCustomerName(booking)} created a booking
                                        </p>

                                        <span>
                                            <Clock size={13} />
                                            {formatActivityDate(
                                                booking.createdAt || booking.bookingDate
                                            )}
                                        </span>
                                    </div>

                                    <span className={`admin-activity-status ${getBookingStatus(booking).toLowerCase()}`}>
                                        {getBookingStatus(booking)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        className="admin-view-all-activity"
                        onClick={() => handleMenuClick('Bookings')}
                    >
                        View All Bookings
                    </button>
                </div>

            </div>
        </>
    );
}

export default DashboardSection;
