
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  History,
  CheckCircle,
  XCircle,
  CalendarDays,
  MapPin,
  Image,
  Clock,
  Filter,
  AlertCircle
} from 'lucide-react';

import './BookingHistory.css';

const API_URL = 'http://localhost:3006/api';
const SERVER_URL = 'http://localhost:3006';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('token');

      const response = await axios.get(
        `${API_URL}/bookings/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const allBookings = response.data.bookings || [];

      const historyBookings = allBookings.filter((booking) =>
        ['completed', 'cancelled'].includes(booking.status)
      );

      setBookings(historyBookings);
    } catch (err) {
      console.error('Failed to fetch booking history:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load booking history. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const completedCount = bookings.filter(
    (booking) => booking.status === 'completed'
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status === 'cancelled'
  ).length;

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';

    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPhotoUrl = (photo) => {
    if (!photo) return '';

    const url = typeof photo === 'string' ? photo : photo.url;

    if (!url) return '';

    return url.startsWith('http')
      ? url
      : `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="booking-history-page">

      {/* Header */}
      <div className="history-header">
        <div>
          <div className="history-title">
            <History size={23} />
            <h2>Booking History</h2>
          </div>

          <p>
            View your completed and cancelled repair services.
          </p>
        </div>

        <button
          className="history-refresh-btn"
          onClick={fetchBookingHistory}
          disabled={loading}
        >
          <History size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="history-stats">

        <div className="history-stat-card">
          <div className="history-stat-icon total">
            <History size={22} />
          </div>
          <div>
            <span>Total History</span>
            <h3>{bookings.length}</h3>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon completed">
            <CheckCircle size={22} />
          </div>
          <div>
            <span>Completed</span>
            <h3>{completedCount}</h3>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon cancelled">
            <XCircle size={22} />
          </div>
          <div>
            <span>Cancelled</span>
            <h3>{cancelledCount}</h3>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="history-filter-section">
        <div className="history-filter-title">
          <Filter size={17} />
          <span>Filter History</span>
        </div>

        <div className="history-filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({bookings.length})
          </button>

          <button
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>

          <button
            className={filter === 'cancelled' ? 'active' : ''}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="history-message">
          <div className="history-loader"></div>
          <p>Loading your booking history...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="history-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchBookingHistory}>
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredBookings.length === 0 && (
        <div className="history-empty">
          <div className="history-empty-icon">
            <History size={38} />
          </div>

          <h3>No Booking History Found</h3>

          <p>
            {filter === 'all'
              ? 'Your completed and cancelled repair bookings will appear here.'
              : `You don't have any ${filter} bookings yet.`}
          </p>
        </div>
      )}

      {/* Booking Cards */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="history-bookings-list">

          {filteredBookings.map((booking) => {
            const photoUrl = getPhotoUrl(booking.issuePhoto);

            return (
              <div
                className="history-booking-card"
                key={booking._id}
              >

                <div className="history-card-top">
                  <div className="history-service-info">
                    <div className="history-service-icon">
                      <History size={21} />
                    </div>

                    <div>
                      <h3>
                        {booking.repairType?.name ||
                          'Photo-based Repair Request'}
                      </h3>

                      <span>
                        Booking ID: {booking._id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`history-status ${booking.status}`}
                  >
                    {booking.status === 'completed' ? (
                      <CheckCircle size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}

                    {booking.status}
                  </span>
                </div>

                <div className="history-card-details">

                  <div>
                    <CalendarDays size={16} />
                    <span>{formatDate(booking.bookingDate)}</span>
                  </div>

                  <div>
                    <Clock size={16} />
                    <span>{formatTime(booking.bookingDate)}</span>
                  </div>

                  <div>
                    <MapPin size={16} />
                    <span>{booking.address}</span>
                  </div>

                </div>

                {booking.description && (
                  <div className="history-description">
                    <strong>Problem Description</strong>
                    <p>{booking.description}</p>
                  </div>
                )}

                {photoUrl && (
                  <div className="history-photo-section">
                    <div className="history-photo-heading">
                      <Image size={16} />
                      <strong>Uploaded Problem Photo</strong>
                    </div>

                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={photoUrl}
                        alt="Customer uploaded repair problem"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    </a>
                  </div>
                )}

                <div className="history-card-footer">
                  <span>
                    Booked on {formatDate(booking.createdAt)}
                  </span>

                  {booking.technician?.name && (
                    <span>
                      Technician: {booking.technician.name}
                    </span>
                  )}
                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
};

export default BookingHistory;
