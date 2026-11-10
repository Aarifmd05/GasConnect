
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Wrench,
  RefreshCw,
  CheckCircle,
  XCircle,
  History,
  Search,
  Image as ImageIcon
} from 'lucide-react';

import './WorkHistory.css';

const API_URL = 'http://localhost:3006/api';

export default function WorkHistory() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchHistory = useCallback(async () => {
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
        throw new Error(data.message || 'Unable to load work history.');
      }

      setJobs(data.bookings || []);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const historyJobs = useMemo(() => {
    return jobs.filter(job =>
      ['completed', 'rejected', 'cancelled'].includes(job.status)
    );
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return historyJobs.filter(job => {
      const matchesFilter =
        filter === 'all' || job.status === filter;

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        (job.customer?.name || '').toLowerCase().includes(searchText) ||
        (job.repairType?.name || '').toLowerCase().includes(searchText) ||
        (job.address || '').toLowerCase().includes(searchText) ||
        (job.description || '').toLowerCase().includes(searchText) ||
        String(job._id || '').toLowerCase().includes(searchText);

      return matchesFilter && matchesSearch;
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [historyJobs, filter, search]);

  const completedCount = historyJobs.filter(
    job => job.status === 'completed'
  ).length;

  const rejectedCount = historyJobs.filter(
    job => job.status === 'rejected'
  ).length;

  const cancelledCount = historyJobs.filter(
    job => job.status === 'cancelled'
  ).length;

  const formatDate = date => {
    if (!date) return 'Not available';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
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

  const getStatusLabel = status => {
    const labels = {
      completed: 'Completed',
      rejected: 'Rejected',
      cancelled: 'Cancelled'
    };

    return labels[status] || status;
  };

  return (
    <div className="technician-history">
      <div className="history-heading">
        <div>
          <h2>Work History</h2>
          <p>Review your previous repair jobs and service activities.</p>
        </div>

        <button
          className="history-refresh"
          onClick={fetchHistory}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="history-stats">
        <div className="history-stat-card">
          <div className="history-stat-icon blue">
            <History size={22} />
          </div>
          <div>
            <h3>{loading ? '—' : historyJobs.length}</h3>
            <p>Total History</p>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon green">
            <CheckCircle size={22} />
          </div>
          <div>
            <h3>{loading ? '—' : completedCount}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon red">
            <XCircle size={22} />
          </div>
          <div>
            <h3>{loading ? '—' : rejectedCount}</h3>
            <p>Rejected</p>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon orange">
            <Clock size={22} />
          </div>
          <div>
            <h3>{loading ? '—' : cancelledCount}</h3>
            <p>Cancelled</p>
          </div>
        </div>
      </div>

      <div className="history-toolbar">
        <div className="history-toolbar-heading">
          <h3>Previous Jobs</h3>
          <p>{loading ? 'Loading...' : `${filteredJobs.length} jobs found`}</p>
        </div>

        <div className="history-controls">
          <div className="history-search">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search customer, service, address..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={event => setFilter(event.target.value)}
            aria-label="Filter work history"
          >
            <option value="all">All History</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="history-error">
          {error}
          <button onClick={fetchHistory}>Try Again</button>
        </div>
      )}

      {loading ? (
        <div className="history-empty">
          <RefreshCw size={28} className="history-spinner" />
          <p>Loading your work history...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">
            <History size={30} />
          </div>

          <h3>No work history found</h3>

          <p>
            {search || filter !== 'all'
              ? 'Try changing your search or filter.'
              : 'Your completed, rejected and cancelled jobs will appear here.'}
          </p>

          {(search || filter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="history-list">
          {filteredJobs.map(job => {
            const customer = job.customer || {};
            const repairType = job.repairType || {};
            const photoUrl = getPhotoUrl(job.issuePhoto);

            return (
              <article className="history-job-card" key={job._id}>
                <div className="history-job-header">
                  <div>
                    <span className="history-job-id">
                      JOB #{job._id.slice(-6).toUpperCase()}
                    </span>
                    <h3>{repairType.name || 'Repair Service'}</h3>
                  </div>

                  <span className={`history-status ${job.status}`}>
                    {getStatusLabel(job.status)}
                  </span>
                </div>

                <div className="history-job-content">
                  <div className="history-customer">
                    <div className="history-avatar">
                      <User size={20} />
                    </div>

                    <div>
                      <h4>{customer.name || 'Customer'}</h4>
                      <p>Customer</p>
                    </div>
                  </div>

                  <div className="history-details">
                    <div>
                      <CalendarDays size={16} />
                      <span>
                        Booking: {formatDate(job.bookingDate)}
                      </span>
                    </div>

                    <div>
                      <Clock size={16} />
                      <span>{formatTime(job.bookingDate)}</span>
                    </div>

                    <div>
                      <MapPin size={16} />
                      <span>{job.address || 'Address unavailable'}</span>
                    </div>

                    <div>
                      <Wrench size={16} />
                      <span>{repairType.name || 'Repair service'}</span>
                    </div>
                  </div>

                  {job.description && (
                    <div className="history-description">
                      <strong>Problem Description</strong>
                      <p>{job.description}</p>
                    </div>
                  )}

                  {photoUrl && (
                    <div className="history-photo">
                      <h4>
                        <ImageIcon size={15} />
                        Customer's Problem Photo
                      </h4>
                      <a href={photoUrl} target="_blank" rel="noreferrer">
                        <img src={photoUrl} alt="Customer's reported appliance problem" />
                      </a>
                    </div>
                  )}

                  <div className="history-completion-date">
                    <span>Last updated</span>
                    <strong>{formatDate(job.updatedAt)}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
