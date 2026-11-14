import { useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  Clock,
  CheckCircle,
  Wrench,
  RefreshCw,
  CalendarDays,
  MapPin,
  ArrowRight
} from 'lucide-react';
import './Overview.css';

const API_URL = 'http://localhost:3006/api';

function Overview({ user, isFirstLogin = false }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `${API_URL}/bookings/technician/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Unable to load your jobs.');
      }

      const data = await response.json();

      const jobs = Array.isArray(data)
        ? data
        : data.bookings || data.jobs || data.data || [];

      setBookings(jobs);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatus = (status = '') => status.toLowerCase().replaceAll('_', '-');

  const pending = bookings.filter(job =>
    ['pending', 'assigned', 'accepted'].includes(getStatus(job.status))
  ).length;

  const inProgress = bookings.filter(job =>
    ['in-progress', 'in progress'].includes(getStatus(job.status))
  ).length;

  const completed = bookings.filter(job =>
    getStatus(job.status) === 'completed'
  ).length;

  const stats = [
    {
      title: 'Total Jobs',
      value: bookings.length,
      icon: BriefcaseBusiness,
      color: 'blue'
    },
    {
      title: 'Pending Jobs',
      value: pending,
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: Wrench,
      color: 'purple'
    },
    {
      title: 'Completed',
      value: completed,
      icon: CheckCircle,
      color: 'green'
    }
  ];

  const recentJobs = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatDate = date => {
    if (!date) return 'Not available';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="technician-overview">
      <div className="overview-heading">
        <div>
          <h2>
            {isFirstLogin ? 'Welcome' : 'Welcome back'}, {user?.name || 'Technician'}!
          </h2>
          <p>Here's an overview of your service activities.</p>
        </div>

        <button
          className="overview-refresh"
          onClick={fetchBookings}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="technician-stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div className="technician-stat-card" key={index}>
              <div className={`technician-stat-icon ${stat.color}`}>
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

      <div className="technician-overview-content">
        <section className="recent-jobs-card">
          <div className="section-heading">
            <div>
              <h3>Recent Jobs</h3>
              <p>Your latest service bookings</p>
            </div>

            <ArrowRight size={20} />
          </div>

          {loading ? (
            <div className="overview-message">Loading your jobs...</div>
          ) : error ? (
            <div className="overview-error">
              <p>{error}</p>
              <button onClick={fetchBookings}>Try Again</button>
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="overview-message">
              <BriefcaseBusiness size={35} />
              <p>No jobs available yet.</p>
            </div>
          ) : (
            <div className="recent-jobs-list">
              {recentJobs.map(job => (
                <div className="recent-job-item" key={job._id}>
                  <div className="recent-job-icon">
                    <Wrench size={20} />
                  </div>

                  <div className="recent-job-details">
                    <h4>
                      {job.repairType?.name ||
                        job.service?.name ||
                        'Repair Service'}
                    </h4>

                    <p>
                      {job.customer?.name ||
                        job.customerName ||
                        'Customer'}
                    </p>

                    <span>
                      <CalendarDays size={13} />
                      {formatDate(job.createdAt)}
                    </span>

                    <span>
                      <MapPin size={13} />
                      {job.address || job.customerAddress || 'Address unavailable'}
                    </span>
                  </div>

                  <span
                    className={`job-status ${getStatus(job.status).replaceAll(' ', '-')}`}
                  >
                    {job.status || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="technician-tips-card">
          <div className="tips-icon">
            <CheckCircle size={25} />
          </div>

          <h3>Professional Service Matters</h3>
          <p>
            Keep your customers informed, arrive on time, and update
            the booking status at every stage of the repair.
          </p>

          <div className="tips-footer">
            <span>GasConnect Technician</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Overview;
