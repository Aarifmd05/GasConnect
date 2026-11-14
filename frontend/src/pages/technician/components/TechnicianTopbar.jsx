import { useState, useEffect, useRef } from 'react';
import {
    Menu,
    Bell,
    ChevronDown,
    CheckCheck
} from 'lucide-react';

export default function TechnicianTopbar({
    user,
    onMenuClick,
    onProfileClick,
    notifications = [],
    readNotifications = [],
    unreadCount = 0,
    markAsRead
}) {
    const [showNotifications, setShowNotifications] = useState(false);

    const name = user?.name || 'Technician';
    const recentNotifications = notifications.slice(0, 5);

    const formatDate = (date) => {
        if (!date) return '';

        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
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

    const handleMarkAllAsRead = () => {
        recentNotifications.forEach((notification) => {
            markAsRead?.(notification.id);
        });
    };

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

                {/* Notifications */}
                <div
  className="topbar-notification-wrapper"
  ref={notificationRef}
>
                    <button
                        className="technician-notification-button topbar-icon-btn"
                        title="Notifications"
                        aria-label="Notifications"
                        aria-expanded={showNotifications}
                        onClick={() =>
                            setShowNotifications((previous) => !previous)
                        }
                    >
                        <Bell size={20} />

                        {unreadCount > 0 && (
                            <span className="topbar-notification-count">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="topbar-notification-dropdown">
                            <div className="notification-dropdown-header">
                                <div>
                                    <h3>Notifications</h3>
                                    <span>
                                        {unreadCount} unread notifications
                                    </span>
                                </div>
                                <Bell size={19} />
                            </div>

                            <div className="notification-dropdown-list">
                                {recentNotifications.length > 0 ? (
                                    recentNotifications.map((notification) => {
                                        const isUnread = !readNotifications.includes(
                                            notification.id
                                        );

                                        return (
                                            <button
                                                key={notification.id}
                                                className={`notification-dropdown-item ${
                                                    isUnread ? 'unread' : ''
                                                }`}
                                                onClick={() =>
                                                    markAsRead?.(notification.id)
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
                                                        {formatDate(notification.date)}
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

                {/* Technician profile */}
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
