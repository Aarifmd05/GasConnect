
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  MapPin,
  CalendarDays,
  Clock,
  Phone,
  UserRound,
  Wrench,
  CheckCircle,
  Circle,
  RefreshCw,
  AlertCircle,
  Camera,
  UserCheck
} from 'lucide-react';

import './TrackTechnician.css';

const API_URL = 'http://localhost:3006/api';
const SERVER_URL = 'http://localhost:3006';

const TrackTechnician = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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

      const activeBookings = (response.data.bookings || []).filter(
        booking =>
          !['completed', 'cancelled'].includes(booking.status)
      );

      setBookings(activeBookings);

    } catch (err) {
      console.error('Failed to fetch tracking details:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load tracking information.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
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

  const statusSteps = [
    { id: 'pending', label: 'Booking Submitted' },
    { id: 'assigned', label: 'Technician Assigned' },
    { id: 'accepted', label: 'Technician Accepted' },
    { id: 'in-progress', label: 'Repair In Progress' },
    { id: 'completed', label: 'Repair Completed' }
  ];

  const getCurrentStep = (status) => {
    const steps = {
      pending: 0,
      assigned: 1,
      accepted: 2,
      'in-progress': 3,
      completed: 4
    };

    return steps[status] ?? 0;
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Your booking is waiting for technician assignment.',
      assigned: 'A technician has been assigned. Waiting for acceptance.',
      accepted: 'Your technician has accepted the repair request.',
      'in-progress': 'Your appliance repair is currently in progress.'
    };

    return messages[status] || 'Your booking status is being updated.';
  };

  const renderTimeline = (status) => {
    const currentStep = getCurrentStep(status);

    return (
      <div className="tracking-timeline">
        {statusSteps.map((step, index) => {
          const completed = index <= currentStep;
          const current = index === currentStep;

          return (
            <div
              className="tracking-timeline-step"
              key={step.id}
            >
              <div className="tracking-timeline-marker">
                {completed ? (
                  <CheckCircle size={20} />
                ) : (
                  <Circle size={20} />
                )}
              </div>

              <div>
                <strong className={completed ? 'step-completed' : ''}>
                  {step.label}
                </strong>

                {current && (
                  <span className="tracking-current-label">
                    Current status
                  </span>
                )}
              </div>

              {index !== statusSteps.length - 1 && (
                <div
                  className={`tracking-timeline-line ${
                    index < currentStep ? 'line-completed' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="track-technician-page">

      {/* Header */}
      <div className="tracking-header">
        <div>
          <h2>Track Technician</h2>
          <p>
            Follow your repair booking and technician assignment status.
          </p>
        </div>

        <button
          className="tracking-refresh-btn"
          onClick={() => fetchBookings(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'tracking-spinning' : ''}
          />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="tracking-empty">
          <div className="tracking-loader" />
          <p>Loading your repair tracking details...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="tracking-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => fetchBookings()}>
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && bookings.length === 0 && (
        <div className="tracking-empty">
          <div className="tracking-empty-icon">
            <Wrench size={36} />
          </div>

          <h3>No Active Repair Bookings</h3>

          <p>
            Your active bookings and technician tracking details
            will appear here.
          </p>
        </div>
      )}

      {/* Active bookings */}
      {!loading && !error && bookings.length > 0 && (
        <div className="tracking-bookings-list">

          {bookings.map((booking) => {
            const photoUrl = getPhotoUrl(booking.issuePhoto);
            const technician = booking.technician;

            return (
              <div
                className="tracking-booking-card"
                key={booking._id}
              >

                {/* Booking header */}
                <div className="tracking-card-header">
                  <div>
                    <span className="tracking-booking-label">
                      REPAIR BOOKING
                    </span>

                    <h3>
                      {booking.repairType?.name ||
                        'Photo-based Repair Request'}
                    </h3>

                    <small>
                      ID: {booking._id.slice(-8).toUpperCase()}
                    </small>
                  </div>

                  <span className={`tracking-status ${booking.status}`}>
                    {booking.status}
                  </span>
                </div>

                {/* Status message */}
                <div className="tracking-status-message">
                  <AlertCircle size={18} />
                  <span>{getStatusMessage(booking.status)}</span>
                </div>

                {/* Timeline */}
                <div className="tracking-progress-section">
                  <h4>Repair Progress</h4>
                  {renderTimeline(booking.status)}
                </div>

                {/* Technician */}
                <div className="tracking-technician-section">
                  <div className="tracking-section-heading">
                    <UserCheck size={19} />
                    <h4>Technician Details</h4>
                  </div>

                  {technician ? (
                    <div className="tracking-technician-card">
                      <div className="tracking-technician-avatar">
                        <UserRound size={28} />
                      </div>

                      <div className="tracking-technician-info">
                        <strong>{technician.name}</strong>

                        <span>
                          {technician.specialization ||
                            'Gas Appliance Technician'}
                        </span>

                        {technician.phone && (
                          <a href={`tel:${technician.phone}`}>
                            <Phone size={15} />
                            {technician.phone}
                          </a>
                        )}
                      </div>

                      {technician.phone && (
                        <a
                          href={`tel:${technician.phone}`}
                          className="tracking-call-btn"
                          aria-label="Call technician"
                        >
                          <Phone size={18} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="tracking-unassigned">
                      <Clock size={19} />
                      <div>
                        <strong>Technician not assigned yet</strong>
                        <p>
                          We will display the technician's details
                          once one is assigned to your booking.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Service information */}
                <div className="tracking-details-grid">

                  <div className="tracking-detail-item">
                    <CalendarDays size={18} />
                    <div>
                      <span>Service Date</span>
                      <strong>{formatDate(booking.bookingDate)}</strong>
                    </div>
                  </div>

                  <div className="tracking-detail-item">
                    <Clock size={18} />
                    <div>
                      <span>Preferred Time</span>
                      <strong>{formatTime(booking.bookingDate)}</strong>
                    </div>
                  </div>

                  <div className="tracking-detail-item address">
                    <MapPin size={18} />
                    <div>
                      <span>Service Address</span>
                      <strong>{booking.address}</strong>
                    </div>
                  </div>

                </div>

                {/* Problem description */}
                {booking.description && (
                  <div className="tracking-problem">
                    <strong>Problem Description</strong>
                    <p>{booking.description}</p>
                  </div>
                )}

                {/* Uploaded photo */}
                {photoUrl && (
                  <div className="tracking-photo">
                    <div>
                      <Camera size={17} />
                      <strong>Uploaded Problem Photo</strong>
                    </div>

                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={photoUrl}
                        alt="Customer repair problem"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    </a>
                  </div>
                )}

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
};

export default TrackTechnician;
