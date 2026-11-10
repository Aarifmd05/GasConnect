
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  ClipboardList,
  CalendarDays,
  MapPin,
  UserRound,
  Phone,
  RefreshCw,
  XCircle,
  Wrench
} from 'lucide-react';

import './MyBookings.css';

const API_URL = 'http://localhost:3006/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
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

      const data = response.data.bookings || response.data;
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load your bookings. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this repair booking?'
    );

    if (!confirmed) return;

    try {
      setCancellingId(bookingId);
      setError('');

      const token = sessionStorage.getItem('token');

      await axios.put(
        `${API_URL}/bookings/customer/cancel/${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      await fetchBookings();
    } catch (err) {
      console.error('Booking cancellation failed:', err);
      setError(
        err.response?.data?.message ||
        'Unable to cancel this booking. Please try again.'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    return (status || 'pending').toLowerCase().replaceAll('-', '');
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return ['pending', 'assigned', 'accepted', 'in-progress'].includes(
        booking.status
      );
    }
    if (filter === 'completed') return booking.status === 'completed';
    if (filter === 'cancelled') {
      return ['cancelled', 'rejected'].includes(booking.status);
    }
    return true;
  });

  const canCancel = (status) =>
    ['pending', 'assigned'].includes(status);

  return (
    <div className="my-bookings-page">

      <div className="my-bookings-heading">
        <div>
          <h2>Your Repair Bookings</h2>
          <p>View and manage your gas appliance repair requests.</p>
        </div>

        <button
          className="my-bookings-refresh"
          onClick={fetchBookings}
          disabled={loading}
          title="Refresh bookings"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="booking-filter-tabs">
        {[
          { id: 'all', label: 'All Bookings' },
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map((item) => (
          <button
            key={item.id}
            className={filter === item.id ? 'selected' : ''}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="my-bookings-error">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="my-bookings-empty">
          Loading your bookings...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="my-bookings-empty">
          <div className="my-bookings-empty-icon">
            <ClipboardList size={34} />
          </div>
          <h3>No bookings found</h3>
          <p>
            {filter === 'all'
              ? "You haven't booked a repair service yet."
              : `You don't have any ${filter} bookings.`}
          </p>
        </div>
      ) : (
        <div className="my-bookings-list">
          {filteredBookings.map((booking) => (
            <article className="my-booking-card" key={booking._id}>

              <div className="my-booking-top">
                <div className="my-booking-service">
                  <div className="my-booking-icon">
                    <Wrench size={22} />
                  </div>

                  <div>
                    <h3>
                      {booking.repairType?.name || 'Repair Service'}
                    </h3>
                    <span>
                      Booking ID: {booking._id?.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>

                <span className={`my-booking-status ${getStatusClass(booking.status)}`}>
                  {(booking.status || 'pending').replaceAll('-', ' ')}
                </span>
              </div>

              <div className="my-booking-info-grid">
                <div className="my-booking-info">
                  <CalendarDays size={17} />
                  <div>
                    <small>Preferred date & time</small>
                    <strong>{formatDate(booking.bookingDate)}</strong>
                  </div>
                </div>

                <div className="my-booking-info">
                  <MapPin size={17} />
                  <div>
                    <small>Service address</small>
                    <strong>{booking.address || 'Not available'}</strong>
                  </div>
                </div>

                <div className="my-booking-info">
                  <UserRound size={17} />
                  <div>
                    <small>Technician</small>
                    <strong>
                      {booking.technician?.name || 'Not assigned yet'}
                    </strong>
                  </div>
                </div>

                {booking.technician?.phone && (
                  <div className="my-booking-info">
                    <Phone size={17} />
                    <div>
                      <small>Technician contact</small>
                      <strong>{booking.technician.phone}</strong>
                    </div>
                  </div>
                )}
              </div>

              {booking.description && (
                <div className="my-booking-description">
                  <strong>Problem description</strong>
                  <p>{booking.description}</p>
                </div>
              )}

              {canCancel(booking.status) && (
                <div className="my-booking-actions">
                  <button
                    className="my-booking-cancel"
                    onClick={() => handleCancel(booking._id)}
                    disabled={cancellingId === booking._id}
                  >
                    <XCircle size={16} />
                    {cancellingId === booking._id
                      ? 'Cancelling...'
                      : 'Cancel Booking'}
                  </button>
                </div>
              )}

            </article>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyBookings;
