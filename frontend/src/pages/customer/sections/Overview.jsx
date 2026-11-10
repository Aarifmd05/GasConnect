
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  Wrench,
  ArrowRight,
  CalendarDays,
  MapPin,
  RefreshCw
} from 'lucide-react';

import './Overview.css';

const API_URL = 'http://localhost:3006/api';

const Overview = ({ user, onBookRepair }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
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

      const bookingData =
        response.data.bookings ||
        response.data ||
        [];

      setBookings(Array.isArray(bookingData) ? bookingData : []);

    } catch (err) {
      console.error('Failed to fetch customer bookings:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load your bookings. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const totalBookings = bookings.length;

  const pendingBookings = bookings.filter(
    booking => booking.status === 'pending'
  ).length;

  const activeBookings = bookings.filter(
    booking =>
      ['assigned', 'accepted', 'in-progress'].includes(booking.status)
  ).length;

  const completedBookings = bookings.filter(
    booking => booking.status === 'completed'
  ).length;

  const stats = [
    {
      title: 'Total Bookings',
      value: totalBookings,
      icon: ClipboardList,
      className: 'stat-blue'
    },
    {
      title: 'Pending Requests',
      value: pendingBookings,
      icon: Clock,
      className: 'stat-orange'
    },
    {
      title: 'Active Repairs',
      value: activeBookings,
      icon: Wrench,
      className: 'stat-purple'
    },
    {
      title: 'Completed',
      value: completedBookings,
      icon: CheckCircle,
      className: 'stat-green'
    }
  ];

  const recentBookings = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 4);

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    return (status || 'pending')
      .toLowerCase()
      .replaceAll('-', '');
  };

  return (
    <div className="customer-overview">

      {/* Welcome Banner */}
      <section className="overview-banner">
        <div className="overview-banner-content">
          <span className="overview-banner-label">
            GASCONNECT CUSTOMER PORTAL
          </span>

          <h2>
            Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!
          </h2>

          <p>
            Need help with your gas appliances?
            Book a professional repair service with GasConnect.
          </p>

          <button
            className="overview-book-btn"
            onClick={onBookRepair}
          >
            Book a Repair
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="overview-banner-decoration">
          <div className="overview-flame-circle">
            <Wrench size={55} />
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="overview-stats-section">
        <div className="overview-section-heading">
          <div>
            <h3>Service Overview</h3>
            <p>Check your repair booking statistics.</p>
          </div>

          <button
            className="overview-refresh-btn"
            onClick={fetchBookings}
            disabled={loading}
            title="Refresh bookings"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        <div className="overview-stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div className="overview-stat-card" key={stat.title}>
                <div className={`overview-stat-icon ${stat.className}`}>
                  <Icon size={23} />
                </div>

                <div>
                  <p>{stat.title}</p>
                  <h3>{loading ? '—' : stat.value}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Bookings */}
      <section className="overview-recent-section">
        <div className="overview-section-heading">
          <div>
            <h3>Recent Bookings</h3>
            <p>Your latest gas appliance repair requests.</p>
          </div>
        </div>

        {loading ? (
          <div className="overview-message">
            Loading your bookings...
          </div>
        ) : error ? (
          <div className="overview-message overview-error">
            <p>{error}</p>
            <button onClick={fetchBookings}>Try Again</button>
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="overview-empty">
            <div className="overview-empty-icon">
              <ClipboardList size={32} />
            </div>

            <h4>No bookings yet</h4>

            <p>
              You haven't booked any repair services.
              Your bookings will appear here.
            </p>

            <button onClick={onBookRepair}>
              Book Your First Repair
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div className="overview-booking-list">
            {recentBookings.map((booking) => (
              <div
                className="overview-booking-card"
                key={booking._id}
              >
                <div className="overview-booking-icon">
                  <Wrench size={22} />
                </div>

                <div className="overview-booking-details">
                  <h4>
                    {booking.repairType?.name || 'Repair Service'}
                  </h4>

                  <span>
                    Booking ID: {booking._id?.slice(-8).toUpperCase()}
                  </span>

                  <div className="overview-booking-meta">
                    <span>
                      <CalendarDays size={14} />
                      {formatDate(booking.bookingDate)}
                    </span>

                    <span>
                      <MapPin size={14} />
                      {booking.address || 'Address unavailable'}
                    </span>
                  </div>
                </div>

                <span
                  className={`overview-status ${getStatusClass(
                    booking.status
                  )}`}
                >
                  {booking.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default Overview;
