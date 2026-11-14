import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Bell,
  UserRound,
  ChevronDown,
  Menu,
  LogOut,
  CheckCheck
} from 'lucide-react';

import LocationSelector from './LocationSelector';
import './CustomerTopbar.css';

const CustomerTopbar = ({
  user,
  selectedAddress,
  onAddressSelect,
  onMenuToggle,
  onLogout,
  notifications = [],
  readNotifications = [],
  unreadCount = 0,
  markAsRead,
  onOpenNotifications
}) => {
  const [showLocations, setShowLocations] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const displayName = user?.name || 'Customer';

  const recentNotifications = notifications.slice(0, 5);

  const formatDate = (date) => {
    if (!date) return '';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleNotificationClick = (notification) => {
    markAsRead?.(notification.id);
    setShowNotifications(false);
    onOpenNotifications?.();
  };

  const handleViewAll = () => {
    setShowNotifications(false);
    onOpenNotifications?.();
  };

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

  return (
    <header className="customer-topbar">

      <div className="topbar-left">

        <button
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-location-wrapper">

          <button
            className="topbar-location"
            onClick={() => setShowLocations(!showLocations)}
          >
            <MapPin size={20} />

            <div className="topbar-location-text">
              <span>Service location</span>

              <strong>
                {selectedAddress?.label || 'Select address'}
              </strong>

              <small>
                {selectedAddress?.fullAddress || 'Choose your service address'}
              </small>
            </div>

            <ChevronDown size={17} />
          </button>

          {showLocations && (
            <div className="topbar-location-dropdown">

              <div className="location-dropdown-heading">
                <h3>Your saved locations</h3>

                <button onClick={() => setShowLocations(false)}>
                  ✕
                </button>
              </div>

              <LocationSelector
                selectedAddress={selectedAddress}
                onSelect={(address) => {
                  onAddressSelect?.(address);
                  setShowLocations(false);
                }}
              />

            </div>
          )}

        </div>
      </div>

      <div className="topbar-right">

        {/* Notification Bell */}
        <div
  className="topbar-notification-wrapper"
  ref={notificationRef}
>

          <button
            className="topbar-icon-btn"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={21} />

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
                   const isUnread = !readNotifications.includes(notification.id);

                    return (
                      <button
                        key={notification.id}
                        className={`notification-dropdown-item ${
                          isUnread ? 'unread' : ''
                        }`}
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                      >

                        <div className="notification-dropdown-icon">
                          <Bell size={17} />
                        </div>

                        <div className="notification-dropdown-content">
                          <strong>{notification.title}</strong>

                          <p>{notification.message}</p>

                          <small>{formatDate(notification.date)}</small>
                        </div>

                        {isUnread && (
                          <span className="notification-unread-dot"></span>
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

              <button
                className="notification-view-all"
                onClick={handleViewAll}
              >
                View All Notifications
                <CheckCheck size={17} />
              </button>

            </div>
          )}

        </div>

        {/* Profile */}
        <div className="topbar-profile-wrapper">

          <button
            className="topbar-profile"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="topbar-avatar">
              <UserRound size={20} />
            </div>

            <div className="topbar-profile-info">
              <strong>{displayName}</strong>
              <span>Customer</span>
            </div>

            <ChevronDown size={16} />
          </button>

          {showProfile && (
            <div className="topbar-profile-dropdown">
              <button onClick={onLogout}>
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}

        </div>

      </div>

    </header>
  );
};

// Helper to determine whether a notification is unread


export default CustomerTopbar;
