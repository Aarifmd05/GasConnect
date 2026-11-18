
import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  User,
  Wrench,
  RefreshCw,
  CheckCircle,
  PlayCircle,
  Navigation,
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';

import './AssignedJobs.css';
import { showConfirm } from '../../../utils/alerts';

const API_URL = 'http://localhost:3006/api';

export default function AssignedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [otpInputs, setOtpInputs] = useState({});

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/bookings/technician/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch assigned jobs.');
      }

      setJobs(data.bookings || []);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Start repair: accepted -> in-progress
  const updateJobStatus = async (jobId, status) => {
    const result = await showConfirm(
      'Are you sure you want to start this repair?',
      'Start Repair?'
    );

    if (!result.isConfirmed) return;

    try {
      setProcessingId(jobId);
      setError('');
      setMessage('');

      const response = await fetch(
        `${API_URL}/bookings/technician/update-status/${jobId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to start repair.');
      }

      setJobs(currentJobs =>
        currentJobs.map(job =>
          job._id === jobId
            ? { ...job, status: data.booking?.status || status }
            : job
        )
      );

      setMessage('Repair started successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update job.');
      fetchJobs();
    } finally {
      setProcessingId(null);
    }
  };

  // Keep only four numeric digits in the OTP input
  const handleOtpChange = (jobId, value) => {
    const cleanedOtp = value.replace(/\D/g, '').slice(0, 4);

    setOtpInputs(current => ({
      ...current,
      [jobId]: cleanedOtp
    }));
  };

  // Verify customer's OTP and complete the repair
  const verifyCompletionOtp = async jobId => {
    const otp = otpInputs[jobId] || '';

    if (!/^\d{4}$/.test(otp)) {
      setError('Please enter a valid 4-digit customer OTP.');
      return;
    }

    const result = await showConfirm(
      'Confirm that the repair is complete and the customer has shared this OTP.',
      'Verify Job Completion?'
    );

    if (!result.isConfirmed) return;

    try {
      setProcessingId(jobId);
      setError('');
      setMessage('');

      const response = await fetch(
        `${API_URL}/bookings/technician/verify-completion/${jobId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({ otp })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed.');
      }

      // Update the local booking status.
      // The completed job will disappear from the active jobs list.
      setJobs(currentJobs =>
        currentJobs.map(job =>
          job._id === jobId
            ? { ...job, status: 'completed' }
            : job
        )
      );

      setOtpInputs(current => {
        const updated = { ...current };
        delete updated[jobId];
        return updated;
      });

      setMessage('OTP verified successfully. Repair completed!');
    } catch (err) {
      setError(err.message || 'Unable to verify OTP.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = date => {
    if (!date) return 'Not available';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = date => {
    if (!date) return 'Not available';

    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPhotoUrl = photo => {
    if (!photo) return '';

    const url = typeof photo === 'string' ? photo : photo.url;

    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return `http://localhost:3006${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const openNavigation = address => {
    if (!address) {
      setError('Customer address is not available.');
      return;
    }

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const activeJobs = jobs.filter(job =>
    ['accepted', 'in-progress'].includes(job.status)
  );

  const filteredJobs = filter === 'all'
    ? activeJobs
    : activeJobs.filter(job => job.status === filter);

  return (
    <div className="assigned-jobs">
      <div className="assigned-heading">
        <div>
          <h2>Assigned Jobs</h2>
          <p>Manage your accepted repair jobs and service progress.</p>
        </div>

        <button
          className="assigned-refresh"
          onClick={fetchJobs}
          disabled={loading || processingId !== null}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="assigned-summary-grid">
        <div className="assigned-summary-card">
          <div className="assigned-summary-icon blue">
            <Wrench size={22} />
          </div>
          <div>
            <h3>{loading ? '—' : activeJobs.length}</h3>
            <p>Active Jobs</p>
          </div>
        </div>

        <div className="assigned-summary-card">
          <div className="assigned-summary-icon orange">
            <Clock size={22} />
          </div>
          <div>
            <h3>
              {loading ? '—' : activeJobs.filter(job => job.status === 'accepted').length}
            </h3>
            <p>Ready to Start</p>
          </div>
        </div>

        <div className="assigned-summary-card">
          <div className="assigned-summary-icon purple">
            <PlayCircle size={22} />
          </div>
          <div>
            <h3>
              {loading ? '—' : activeJobs.filter(job => job.status === 'in-progress').length}
            </h3>
            <p>In Progress</p>
          </div>
        </div>
      </div>

      <div className="assigned-filter-row">
        <div>
          <h3>Your Active Work</h3>
          <p>Jobs you have accepted and not yet completed.</p>
        </div>

        <div className="assigned-filters">
          {[
            { label: 'All', value: 'all' },
            { label: 'Accepted', value: 'accepted' },
            { label: 'In Progress', value: 'in-progress' }
          ].map(item => (
            <button
              key={item.value}
              className={filter === item.value ? 'active' : ''}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="assigned-alert success">
          <CheckCircle size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="assigned-alert error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="assigned-empty">
          <RefreshCw size={28} className="assigned-spinner" />
          <p>Loading assigned jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="assigned-empty">
          <div className="assigned-empty-icon">
            <Wrench size={30} />
          </div>
          <h3>No jobs found</h3>
          <p>
            {filter === 'all'
              ? 'Your accepted and active jobs will appear here.'
              : `You don't have any ${filter === 'accepted' ? 'accepted' : 'in-progress'} jobs.`}
          </p>
          <button onClick={fetchJobs}>Refresh Jobs</button>
        </div>
      ) : (
        <div className="assigned-job-list">
          {filteredJobs.map(job => {
            const customer = job.customer || {};
            const repairType = job.repairType || {};
            const photoUrl = getPhotoUrl(job.issuePhoto);

            return (
              <article className="assigned-job-card" key={job._id}>
                <div className="assigned-job-header">
                  <div>
                    <span className="assigned-job-id">
                      JOB #{job._id.slice(-6).toUpperCase()}
                    </span>
                    <h3>{repairType.name || 'Repair Service'}</h3>
                  </div>

                  <span className={`assigned-status ${job.status}`}>
                    {job.status === 'in-progress' ? 'In Progress' : 'Accepted'}
                  </span>
                </div>

                <div className="assigned-job-body">
                  <div className="assigned-customer">
                    <div className="assigned-avatar">
                      <User size={22} />
                    </div>
                    <div>
                      <h4>{customer.name || 'Customer'}</h4>
                      <p>Customer details</p>
                    </div>
                  </div>

                  <div className="assigned-details-grid">
                    <div className="assigned-detail">
                      <Phone size={17} />
                      <div>
                        <span>Phone</span>
                        <strong>{customer.phone || 'Not available'}</strong>
                      </div>
                    </div>

                    <div className="assigned-detail">
                      <CalendarDays size={17} />
                      <div>
                        <span>Service Date</span>
                        <strong>{formatDate(job.bookingDate)}</strong>
                      </div>
                    </div>

                    <div className="assigned-detail">
                      <Clock size={17} />
                      <div>
                        <span>Service Time</span>
                        <strong>{formatTime(job.bookingDate)}</strong>
                      </div>
                    </div>

                    <div className="assigned-detail">
                      <Wrench size={17} />
                      <div>
                        <span>Repair Type</span>
                        <strong>{repairType.name || 'Not specified'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="assigned-address">
                    <MapPin size={18} />
                    <div>
                      <span>Customer Address</span>
                      <p>{job.address || 'Address not available'}</p>
                    </div>
                  </div>

                  {job.description && (
                    <div className="assigned-description">
                      <h4>Problem Description</h4>
                      <p>{job.description}</p>
                    </div>
                  )}

                  {photoUrl && (
                    <div className="assigned-photo">
                      <h4>
                        <ImageIcon size={16} />
                        Customer's Problem Photo
                      </h4>
                      <a href={photoUrl} target="_blank" rel="noreferrer">
                        <img src={photoUrl} alt="Reported appliance problem" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="assigned-job-actions">
                  <button
                    className="assigned-navigation-btn"
                    onClick={() => openNavigation(job.address)}
                  >
                    <Navigation size={17} />
                    Navigate
                  </button>

                  {job.status === 'accepted' && (
                    <button
                      className="assigned-start-btn"
                      onClick={() => updateJobStatus(job._id, 'in-progress')}
                      disabled={processingId !== null}
                    >
                      <PlayCircle size={17} />
                      {processingId === job._id ? 'Updating...' : 'Start Repair'}
                    </button>
                  )}
                </div>

                {job.status === 'in-progress' && (
                  <div className="assigned-otp-section">
                    <div className="assigned-otp-heading">
                      <ShieldCheck size={22} />
                      <div>
                        <h4>Customer OTP Verification</h4>
                        <p>
                          Ask the customer for their 4-digit OTP after completing
                          the repair.
                        </p>
                      </div>
                    </div>

                    <div className="assigned-otp-input-row">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={4}
                        placeholder="Enter 4-digit OTP"
                        value={otpInputs[job._id] || ''}
                        onChange={event =>
                          handleOtpChange(job._id, event.target.value)
                        }
                        disabled={processingId === job._id}
                      />

                      <button
                        className="assigned-verify-btn"
                        onClick={() => verifyCompletionOtp(job._id)}
                        disabled={
                          processingId !== null ||
                          (otpInputs[job._id] || '').length !== 4
                        }
                      >
                        <CheckCircle size={17} />
                        {processingId === job._id
                          ? 'Verifying...'
                          : 'Verify & Complete'}
                      </button>
                    </div>

                    <p className="assigned-otp-hint">
                      The job will be marked completed only after the backend
                      verifies the customer's OTP.
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
