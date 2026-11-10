
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
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import './JobRequests.css';

const API_URL = 'http://localhost:3006/api';

function JobRequests() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getToken = () => sessionStorage.getItem('token');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await fetch(
        `${API_URL}/bookings/technician/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load job requests.');
      }

      const bookings = data.bookings || [];

      // Only bookings waiting for this technician's response.
      setJobs(bookings.filter(job => job.status === 'assigned'));
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const respondToJob = async (jobId, responseType) => {
    const action = responseType === 'accepted' ? 'accept' : 'reject';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this repair request?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(jobId);
      setError('');
      setMessage('');

      const response = await fetch(
        `${API_URL}/bookings/technician/respond/${jobId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            response: responseType
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Unable to ${action} this request.`);
      }

      setMessage(
        responseType === 'accepted'
          ? 'Job request accepted successfully.'
          : 'Job request rejected successfully.'
      );

      // Remove the responded booking from this request list.
      setJobs(currentJobs =>
        currentJobs.filter(job => job._id !== jobId)
      );
    } catch (err) {
      setError(err.message || 'Unable to process this request.');
      fetchRequests();
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

  return (
    <div className="technician-requests">
      <div className="requests-heading">
        <div>
          <h2>Job Requests</h2>
          <p>Review and respond to repair jobs assigned to you.</p>
        </div>

        <button
          className="requests-refresh"
          onClick={fetchRequests}
          disabled={loading || processingId !== null}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="requests-summary">
        <div className="requests-summary-icon">
          <Clock size={23} />
        </div>
        <div>
          <h3>{loading ? '—' : jobs.length}</h3>
          <p>Requests waiting for your response</p>
        </div>
      </div>

      {message && (
        <div className="requests-alert success">
          <CheckCircle size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="requests-alert error">
          <XCircle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="requests-empty">
          <RefreshCw size={28} className="requests-loading-icon" />
          <p>Loading job requests...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="requests-empty">
          <div className="requests-empty-icon">
            <BriefcaseIcon />
          </div>
          <h3>No new job requests</h3>
          <p>
            When an admin assigns a repair booking to you,
            it will appear here.
          </p>
          <button onClick={fetchRequests}>Check Again</button>
        </div>
      ) : (
        <div className="requests-grid">
          {jobs.map(job => {
            const customer = job.customer || {};
            const repairType = job.repairType || {};
            const photoUrl = getPhotoUrl(job.issuePhoto);

            return (
              <article className="request-card" key={job._id}>
                <div className="request-card-header">
                  <div>
                    <span className="request-label">NEW REQUEST</span>
                    <h3>{repairType.name || 'Repair Service'}</h3>
                  </div>

                  <span className="request-status">Awaiting response</span>
                </div>

                <div className="request-customer">
                  <div className="request-avatar">
                    <User size={21} />
                  </div>

                  <div>
                    <h4>{customer.name || 'Customer'}</h4>
                    <p>Customer</p>
                  </div>
                </div>

                <div className="request-details">
                  <div className="request-detail">
                    <Phone size={17} />
                    <span>{customer.phone || 'Phone not available'}</span>
                  </div>

                  <div className="request-detail">
                    <CalendarDays size={17} />
                    <span>{formatDate(job.bookingDate)}</span>
                  </div>

                  <div className="request-detail">
                    <Clock size={17} />
                    <span>{formatTime(job.bookingDate)}</span>
                  </div>

                  <div className="request-detail">
                    <MapPin size={17} />
                    <span>{job.address || 'Address not available'}</span>
                  </div>

                  <div className="request-detail">
                    <Wrench size={17} />
                    <span>
                      {repairType.name || 'Repair type not specified'}
                    </span>
                  </div>
                </div>

                {job.description && (
                  <div className="request-description">
                    <h4>Problem Description</h4>
                    <p>{job.description}</p>
                  </div>
                )}

                {photoUrl && (
                  <div className="request-photo">
                    <h4>
                      <ImageIcon size={16} />
                      Customer's Problem Photo
                    </h4>
                    <a href={photoUrl} target="_blank" rel="noreferrer">
                      <img src={photoUrl} alt="Customer's reported appliance problem" />
                    </a>
                  </div>
                )}

                <div className="request-actions">
                  <button
                    className="request-reject-btn"
                    onClick={() => respondToJob(job._id, 'rejected')}
                    disabled={processingId !== null}
                  >
                    <XCircle size={17} />
                    {processingId === job._id ? 'Processing...' : 'Reject'}
                  </button>

                  <button
                    className="request-accept-btn"
                    onClick={() => respondToJob(job._id, 'accepted')}
                    disabled={processingId !== null}
                  >
                    <CheckCircle size={17} />
                    {processingId === job._id ? 'Processing...' : 'Accept Job'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BriefcaseIcon() {
  return <Wrench size={30} />;
}

export default JobRequests;
