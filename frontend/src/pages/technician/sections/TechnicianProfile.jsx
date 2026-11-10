
import React, { useEffect, useState } from 'react';
import {
  UserCircle,
  Bell,
  ShieldCheck,
  Info,
  User,
  Mail,
  Phone,
  BriefcaseBusiness,
  CalendarDays,
  LockKeyhole,
  Save,
  Pencil,
  X,
  CheckCircle2
} from 'lucide-react';
import './TechnicianProfile.css';

const defaultNotifications = {
  bookingNotifications: true,
  customerNotifications: true,
  systemNotifications: true
};

function TechnicianProfile() {
  const [user, setUser] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState(defaultNotifications);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    try {
      const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');

      setUser(storedUser);

      setFormData({
        name: storedUser.name || '',
        email: storedUser.email || '',
        phone: storedUser.phone || '',
        specialization: storedUser.specialization || ''
      });

      const savedNotifications = JSON.parse(
        localStorage.getItem('technicianNotifications') || 'null'
      );

      if (savedNotifications) {
        setNotifications({
          ...defaultNotifications,
          ...savedNotifications
        });
      }
    } catch (error) {
      console.error('Unable to load technician profile:', error);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    const updatedUser = {
      ...user,
      ...formData
    };

    sessionStorage.setItem('user', JSON.stringify(updatedUser));

    setUser(updatedUser);
    setEditMode(false);
    setMessage('Profile updated in this session.');

    setTimeout(() => setMessage(''), 3000);
  };

  const handleNotificationChange = (name) => {
    const updated = {
      ...notifications,
      [name]: !notifications[name]
    };

    setNotifications(updated);

    localStorage.setItem(
      'technicianNotifications',
      JSON.stringify(updated)
    );
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword) {
      setMessage('Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage('New password must contain at least 8 characters.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }

    // Connect this form to the backend password-change endpoint
    // when that endpoint is available.
    setMessage('Password change is not connected to the backend yet.');

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    setTimeout(() => setMessage(''), 4000);
  };

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'T';
  };

  const approvalStatus = user.approvalStatus ||
    user.status ||
    user.technicianStatus ||
    'Not specified';

  return (
    <div className="technician-profile-page">

      <div className="technician-profile-heading">
        <h2>Profile Settings</h2>
        <p>Manage your technician account and preferences.</p>
      </div>

      {message && (
        <div className="technician-profile-message">
          <Info size={17} />
          <span>{message}</span>
        </div>
      )}

      {/* PROFILE DETAILS */}
      <section className="technician-settings-card">

        <div className="technician-settings-title">
          <div className="technician-settings-icon">
            <UserCircle size={19} />
          </div>

          <div>
            <h3>Profile Details</h3>
            <p>Your personal and professional information.</p>
          </div>
        </div>

        <div className="technician-profile-summary">

          <div className="technician-profile-avatar">
            {getInitials(user.name)}
          </div>

          <div className="technician-profile-identity">
            <h3>{user.name || 'Technician Name'}</h3>
            <span className="technician-role-badge">
              {user.role || 'Technician'}
            </span>
          </div>

          {!editMode ? (
            <button
              className="technician-edit-button"
              onClick={() => setEditMode(true)}
            >
              <Pencil size={15} />
              Edit Profile
            </button>
          ) : (
            <button
              className="technician-cancel-button"
              onClick={() => {
                setFormData({
                  name: user.name || '',
                  email: user.email || '',
                  phone: user.phone || '',
                  specialization: user.specialization || ''
                });
                setEditMode(false);
              }}
            >
              <X size={15} />
              Cancel
            </button>
          )}

        </div>

        <div className="technician-profile-grid">

          <div className="technician-info-item">
            <span><User size={14} /> First Name</span>
            {editMode ? (
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
              />
            ) : (
              <strong>{user.name || 'Not available'}</strong>
            )}
          </div>

          <div className="technician-info-item">
            <span><BriefcaseBusiness size={14} /> Specialization</span>
            {editMode ? (
              <input
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="Enter specialization"
              />
            ) : (
              <strong>{user.specialization || 'Not specified'}</strong>
            )}
          </div>

          <div className="technician-info-item">
            <span><Mail size={14} /> Email Address</span>
            {editMode ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
              />
            ) : (
              <strong>{user.email || 'Not available'}</strong>
            )}
          </div>

          <div className="technician-info-item">
            <span><Mail size={14} /> Alternative Email</span>
            <strong>{user.alternativeEmail || 'Not available'}</strong>
          </div>

          <div className="technician-info-item">
            <span><Phone size={14} /> Phone Number</span>
            {editMode ? (
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            ) : (
              <strong>{user.phone || 'Not available'}</strong>
            )}
          </div>

          <div className="technician-info-item">
            <span><Phone size={14} /> Alternate Phone Number</span>
            <strong>{user.alternatePhone || 'Not available'}</strong>
          </div>

          <div className="technician-info-item">
            <span><CalendarDays size={14} /> Date of Birth</span>
            <strong>
              {user.dateOfBirth
                ? new Date(user.dateOfBirth).toLocaleDateString()
                : 'Not available'}
            </strong>
          </div>

          <div className="technician-info-item">
            <span><CheckCircle2 size={14} /> Approval Status</span>
            <strong className="technician-approval-status">
              {approvalStatus}
            </strong>
          </div>

        </div>

        {editMode && (
          <div className="technician-profile-actions">
            <button
              className="technician-save-button"
              onClick={handleSaveProfile}
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        )}

      </section>

      {/* NOTIFICATION PREFERENCES */}
      <section className="technician-settings-card">

        <div className="technician-settings-title">
          <div className="technician-settings-icon">
            <Bell size={19} />
          </div>

          <div>
            <h3>Notification Preferences</h3>
            <p>Choose which notifications you want to receive.</p>
          </div>
        </div>

        <div className="technician-notification-list">

          <div className="technician-notification-item">
            <div className="technician-notification-description">
              <strong>Booking Notifications</strong>
              <p>Preferences for new booking notifications.</p>
            </div>

            <label className="technician-switch">
              <input
                type="checkbox"
                checked={notifications.bookingNotifications}
                onChange={() =>
                  handleNotificationChange('bookingNotifications')
                }
              />
              <span className="technician-slider"></span>
            </label>
          </div>

          <div className="technician-notification-item">
            <div className="technician-notification-description">
              <strong>Customer Notifications</strong>
              <p>Preferences for customer updates and requests.</p>
            </div>

            <label className="technician-switch">
              <input
                type="checkbox"
                checked={notifications.customerNotifications}
                onChange={() =>
                  handleNotificationChange('customerNotifications')
                }
              />
              <span className="technician-slider"></span>
            </label>
          </div>

          <div className="technician-notification-item">
            <div className="technician-notification-description">
              <strong>System Notifications</strong>
              <p>Preferences for system alerts and updates.</p>
            </div>

            <label className="technician-switch">
              <input
                type="checkbox"
                checked={notifications.systemNotifications}
                onChange={() =>
                  handleNotificationChange('systemNotifications')
                }
              />
              <span className="technician-slider"></span>
            </label>
          </div>

        </div>
      </section>

      {/* SECURITY SETTINGS */}
      <section className="technician-settings-card">

        <div className="technician-settings-title">
          <div className="technician-settings-icon">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h3>Security Settings</h3>
            <p>Manage your account password.</p>
          </div>
        </div>

        <form
          className="technician-password-form"
          onSubmit={handlePasswordChange}
        >
          <div className="technician-password-field">
            <label>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value
                })
              }
            />
          </div>

          <div className="technician-password-field">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value
                })
              }
            />
          </div>

          <div className="technician-password-field">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value
                })
              }
            />
          </div>

          <button type="submit" className="technician-password-button">
            <LockKeyhole size={15} />
            Change Password
          </button>
        </form>

      </section>

      {/* APPLICATION INFORMATION */}
      <section className="technician-settings-card">

        <div className="technician-settings-title">
          <div className="technician-settings-icon">
            <Info size={19} />
          </div>

          <div>
            <h3>Application Information</h3>
            <p>Information about your dashboard.</p>
          </div>
        </div>

        <div className="technician-app-info-grid">

          <div className="technician-info-item">
            <span>Application Name</span>
            <strong>GasConnect</strong>
          </div>

          <div className="technician-info-item">
            <span>Application Type</span>
            <strong>Technician Dashboard</strong>
          </div>

          <div className="technician-info-item">
            <span>Version</span>
            <strong>1.0.0</strong>
          </div>

          <div className="technician-info-item">
            <span>Platform</span>
            <strong>Web Application</strong>
          </div>

        </div>
      </section>

    </div>
  );
}

export default TechnicianProfile;
