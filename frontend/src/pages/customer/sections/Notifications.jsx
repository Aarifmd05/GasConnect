
import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
  UserCheck,
  Wrench,
  XCircle,
  CalendarDays,
  RefreshCw,
  BellRing,
  Inbox,
  LoaderCircle
} from 'lucide-react';

import './Notifications.css';

const API_URL = 'http://localhost:3006/api';

const getNotificationDetails = booking => {
  const status = booking.status?.toLowerCase();

  switch (status) {
    case 'pending':
      return {
        title: 'Booking request received',
        message: 'Your repair booking request has been received and is awaiting confirmation.',
        icon: Clock,
        type: 'pending'
      };

    case 'assigned':
      return {
        title: 'Technician assigned',
        message: `${booking.technician?.name || 'A technician'} has been assigned to your repair.`,
        icon: UserCheck,
        type: 'assigned'
      };

    case 'accepted':
      return {
        title: 'Technician accepted your booking',
        message: `${booking.technician?.name || 'Your technician'} has accepted the service request.`,
        icon: CheckCircle,
        type: 'accepted'
      };

    case 'in-progress':
    case 'in_progress':
      return {
        title: 'Repair in progress',
        message: 'Your technician has started working on your repair.',
        icon: Wrench,
        type: 'progress'
      };

    case 'completed':
      return {
        title: 'Repair completed',
        message: 'Your repair service has been marked as completed. You can now rate your experience.',
        icon: CheckCircle,
        type: 'completed'
      };

    case 'cancelled':
      return {
        title: 'Booking cancelled',
        message: 'Your repair booking has been cancelled.',
        icon: XCircle,
        type: 'cancelled'
      };

    default:
      return {
        title: 'Booking update',
        message: `Your booking status is ${status || 'being updated'}.`,
        icon: Bell,
        type: 'pending'
      };
  }
};

export default function Notifications() {
  const [bookings, setBookings] = useState([]);
  const [readNotifications, setReadNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    fetchNotifications();

    const saved = sessionStorage.getItem('gasconnect_read_notifications');

    if (saved) {
      try {
        setReadNotifications(JSON.parse(saved));
      } catch {
        setReadNotifications([]);
      }
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load notifications');
      }

      const bookingList = Array.isArray(data)
        ? data
        : data.bookings || [];

      setBookings(bookingList);
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const notifications = useMemo(() => {
    return bookings
      .map(booking => {
        const details = getNotificationDetails(booking);

        return {
          id: `${booking._id}-${booking.status}`,
          bookingId: booking._id,
          booking,
          ...details,
          date: booking.updatedAt || booking.createdAt || booking.bookingDate
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bookings]);

  const unreadCount = notifications.filter(
    notification => !readNotifications.includes(notification.id)
  ).length;

  const markAsRead = id => {
    setReadNotifications(previous => {
      const updated = previous.includes(id)
        ? previous
        : [...previous, id];

      sessionStorage.setItem(
        'gasconnect_read_notifications',
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(notification => notification.id);

    setReadNotifications(previous => {
      const updated = [...new Set([...previous, ...allIds])];

      sessionStorage.setItem(
        'gasconnect_read_notifications',
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  const visibleNotifications = notifications.filter(notification => {
    const isRead = readNotifications.includes(notification.id);

    if (filter === 'unread') return !isRead;
    if (filter === 'read') return isRead;

    return true;
  });

  if (loading) {
    return (
      <div className="notifications-loading">
        <LoaderCircle size={30} className="notifications-spinner" />
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-heading">
        <div>
          <span className="notifications-eyebrow">STAY UPDATED</span>
          <h2>Notifications</h2>
          <p>Keep track of your repair bookings and service updates.</p>
        </div>

        <div className="notifications-heading-icon">
          <BellRing size={27} />
          {unreadCount > 0 && (
            <span className="notifications-count">{unreadCount}</span>
          )}
        </div>
      </div>

      <div className="notifications-summary">
        <div className="notifications-summary-icon">
          <Bell size={22} />
        </div>

        <div>
          <h3>{unreadCount} Unread Notifications</h3>
          <p>You have {notifications.length} booking updates in total.</p>
        </div>

        <button
          className="notifications-refresh"
          onClick={fetchNotifications}
          title="Refresh notifications"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {error && (
        <div className="notifications-error">
          {error}
        </div>
      )}

      <div className="notifications-toolbar">
        <div className="notifications-tabs">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'read', label: 'Read' }
          ].map(tab => (
            <button
              key={tab.id}
              className={filter === tab.id ? 'active' : ''}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          className="notifications-mark-all"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <CheckCircle size={15} />
          Mark all as read
        </button>
      </div>

      {visibleNotifications.length === 0 ? (
        <div className="notifications-empty">
          <div className="notifications-empty-icon">
            <Inbox size={34} />
          </div>

          <h3>
            {notifications.length === 0
              ? 'No notifications yet'
              : 'Nothing to show here'}
          </h3>

          <p>
            {notifications.length === 0
              ? 'Your booking updates will appear here.'
              : 'There are no notifications in this category.'}
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {visibleNotifications.map(notification => {
            const Icon = notification.icon;
            const isRead = readNotifications.includes(notification.id);

            return (
              <div
                key={notification.id}
                className={`notification-card ${isRead ? 'read' : 'unread'}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className={`notification-icon ${notification.type}`}>
                  <Icon size={21} />
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3>{notification.title}</h3>

                    {!isRead && (
                      <span className="notification-unread-dot" />
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <div className="notification-meta">
                    <span>
                      <CalendarDays size={13} />
                      {notification.date
                        ? new Date(notification.date).toLocaleString()
                        : 'Date unavailable'}
                    </span>

                    <span>
                      Booking #{notification.bookingId.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>

                {!isRead && (
                  <span className="notification-new-label">NEW</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
