import { useState, useEffect, useRef } from 'react';
import {
    Bell,
    Menu,
    Search,
    UserCircle,
    CheckCheck
} from 'lucide-react';

function AdminTopbar({
    activeMenu,
    sidebarOpen,
    onMenuToggle,
    searchTerm,
    setSearchTerm,
    notifications = [],
    readNotifications = [],
    unreadCount = 0,
    markAsRead,
    onNotificationClick,
}) {
    const [showNotifications, setShowNotifications] = useState(false);

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

    const recentNotifications = notifications.slice(0, 5);

    const formatDate = (date) => {
        if (!date) return '';

        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    };

    // Handle individual notification click
    const handleNotificationClick = (notification) => {
        markAsRead?.(notification.id);

        setShowNotifications(false);

        onNotificationClick?.(notification);
    };

    const notificationRef = useRef(null);

useEffect(() => {
  const handleOutsideClick = (event) => {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target)
    ) {
      setShowNotifications(false);
    }
  };

  document.addEventListener('mousedown', handleOutsideClick);
  document.addEventListener('touchstart', handleOutsideClick);

  return () => {
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('touchstart', handleOutsideClick);
  };
}, []);

    // Mark all displayed notifications as read
    const handleMarkAllAsRead = () => {
        notifications.forEach((notification) => {
            markAsRead?.(notification.id);
        });
    };

    return (
        <header className="admin-topbar">

            {/* Menu button */}
            <button
                className="admin-menu-toggle"
                onClick={onMenuToggle}
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
            >
                <Menu size={25} />
            </button>

            {/* Search */}
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

                {/* Notifications */}
                <div
  className="topbar-notification-wrapper"
  ref={notificationRef}
>

                    <button
                        className="admin-notification topbar-icon-btn"
                        aria-label="Notifications"
                        aria-expanded={showNotifications}
                        onClick={() =>
                            setShowNotifications((previous) => !previous)
                        }
                    >
                        <Bell size={22} />

                        {unreadCount > 0 && (
                            <span className="topbar-notification-count">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="topbar-notification-dropdown">

                            {/* Notification header */}
                            <div className="notification-dropdown-header">
                                <div>
                                    <h3>Notifications</h3>

                                    <span>
                                        {unreadCount} unread notifications
                                    </span>
                                </div>

                                <Bell size={19} />
                            </div>

                            {/* Notification list */}
                            <div className="notification-dropdown-list">

                                {recentNotifications.length > 0 ? (

                                    recentNotifications.map((notification) => {
                                        const isUnread =
                                            !readNotifications.includes(
                                                notification.id
                                            );

                                        return (
                                            <button
                                                key={notification.id}
                                                className={`notification-dropdown-item ${
                                                    isUnread ? 'unread' : ''
                                                }`}
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notification
                                                    )
                                                }
                                            >

                                                <div className="notification-dropdown-icon">
                                                    <Bell size={17} />
                                                </div>

                                                <div className="notification-dropdown-content">

                                                    <strong>
                                                        {notification.title}
                                                    </strong>

                                                    <p>
                                                        {notification.message}
                                                    </p>

                                                    <small>
                                                        {formatDate(
                                                            notification.date
                                                        )}
                                                    </small>

                                                </div>

                                                {isUnread && (
                                                    <span className="notification-unread-dot" />
                                                )}

                                            </button>
                                        );
                                    })

                                ) : (

                                    <div className="notification-dropdown-empty">
                                        <Bell size={25} />
                                        <p>No notifications yet</p>
                                    </div>

                                )}

                            </div>

                            {/* Mark all as read */}
                            {recentNotifications.length > 0 && (
                                <button
                                    className="notification-view-all"
                                    onClick={handleMarkAllAsRead}
                                >
                                    Mark all as read
                                    <CheckCheck size={17} />
                                </button>
                            )}

                        </div>
                    )}

                </div>

                {/* Admin profile */}
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
