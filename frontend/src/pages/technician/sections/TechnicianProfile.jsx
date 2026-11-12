
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
const API_URL = 'http://localhost:3006/api';

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
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
  name: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  alternativeEmail: '',
  alternativePhone: '',
  dateOfBirth: '',
  gender: 'Prefer not to say',
  specialization: '',
  experience: '',
  profilePhoto: ''
});

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

useEffect(() => {
  const loadTechnicianProfile = async () => {
    try {
      const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');

      setUser(storedUser);

      const savedNotifications = JSON.parse(
        localStorage.getItem('technicianNotifications') || 'null'
      );

      if (savedNotifications) {
        setNotifications({
          ...defaultNotifications,
          ...savedNotifications
        });
      }

      const token = sessionStorage.getItem('token');

      if (!token) {
        setMessage('Please log in again to access your profile.');
        return;
      }

      const response = await fetch(`${API_URL}/users/technician/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch technician profile.');
      }

      const technician = data.technician || data.user;

      if (technician) {
        setUser(technician);

        setFormData({
          name: technician.name || '',
          firstName: technician.firstName || '',
          lastName: technician.lastName || '',
          email: technician.email || '',
          phone: technician.phone || '',
          alternativeEmail: technician.alternativeEmail || '',
          alternativePhone: technician.alternativePhone || '',
          dateOfBirth: technician.dateOfBirth
            ? new Date(technician.dateOfBirth).toISOString().split('T')[0]
            : '',
          gender: technician.gender || 'Prefer not to say',
          specialization: technician.specialization || '',
          experience: technician.experience ?? '',
          profilePhoto: technician.profilePhoto || ''
        });

        sessionStorage.setItem('user', JSON.stringify(technician));
      }

    } catch (error) {
      console.error('Unable to load technician profile:', error);
      setMessage(error.message || 'Unable to load technician profile.');
    }
  };

  loadTechnicianProfile();
}, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
  try {
    setSaving(true);
    setMessage('');

    const token = sessionStorage.getItem('token');

    if (!token) {
      throw new Error('Please log in again to update your profile.');
    }

    const response = await fetch(`${API_URL}/users/technician/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: formData.name,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: user.email,
        phone: formData.phone,
        alternativeEmail: formData.alternativeEmail,
        alternativePhone: formData.alternativePhone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        specialization: formData.specialization,
        experience: formData.experience,
        profilePhoto: formData.profilePhoto
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to update technician profile.');
    }

    const updatedUser = data.technician || data.user;

    setUser(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));

    setFormData({
  name: user.name || '',
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  email: user.email || '',
  phone: user.phone || '',
  alternativeEmail: user.alternativeEmail || '',
  alternativePhone: user.alternativePhone || '',
  dateOfBirth: user.dateOfBirth
    ? new Date(user.dateOfBirth).toISOString().split('T')[0]
    : '',
  gender: user.gender || 'Prefer not to say',
  specialization: user.specialization || '',
  experience: user.experience ?? '',
  profilePhoto: user.profilePhoto || ''
});
setEditMode(false);
setMessage('');
    setMessage('Profile updated successfully!');

  } catch (error) {
    console.error('Technician profile update error:', error);
    setMessage(error.message || 'Unable to update technician profile.');
  } finally {
    setSaving(false);
  }
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

  {/* Full Name */}
  <div className="technician-info-item">
    <span><User size={14} /> Full Name</span>
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

  {/* First Name */}
  <div className="technician-info-item">
    <span><User size={14} /> First Name</span>
    {editMode ? (
      <input
        name="firstName"
        value={formData.firstName}
        onChange={handleInputChange}
        placeholder="Enter first name"
      />
    ) : (
      <strong>{user.firstName || 'Not available'}</strong>
    )}
  </div>

  {/* Last Name */}
  <div className="technician-info-item">
    <span><User size={14} /> Last Name</span>
    {editMode ? (
      <input
        name="lastName"
        value={formData.lastName}
        onChange={handleInputChange}
        placeholder="Enter last name"
      />
    ) : (
      <strong>{user.lastName || 'Not available'}</strong>
    )}
  </div>

  {/* Registered Email - Locked */}
  <div className="technician-info-item">
    <span><Mail size={14} /> Registered Email</span>
    {editMode ? (
      <input
        type="email"
        name="email"
        value={formData.email}
        readOnly
      />
    ) : (
      <strong>{user.email || 'Not available'}</strong>
    )}
  </div>

  {/* Phone */}
  <div className="technician-info-item">
    <span><Phone size={14} /> Phone Number</span>
    {editMode ? (
      <input
        name="phone"
        value={formData.phone}
        onChange={handleInputChange}
        placeholder="Enter phone number"
        maxLength={10}
      />
    ) : (
      <strong>{user.phone || 'Not available'}</strong>
    )}
  </div>

  {/* Alternative Email */}
  <div className="technician-info-item">
    <span><Mail size={14} /> Alternative Email</span>
    {editMode ? (
      <input
        type="email"
        name="alternativeEmail"
        value={formData.alternativeEmail}
        onChange={handleInputChange}
        placeholder="Enter alternative email"
      />
    ) : (
      <strong>{user.alternativeEmail || 'Not available'}</strong>
    )}
  </div>

  {/* Alternative Phone */}
  <div className="technician-info-item">
    <span><Phone size={14} /> Alternate Phone Number</span>
    {editMode ? (
      <input
        name="alternativePhone"
        value={formData.alternativePhone}
        onChange={handleInputChange}
        placeholder="Enter alternate phone"
        maxLength={10}
      />
    ) : (
      <strong>{user.alternativePhone || 'Not available'}</strong>
    )}
  </div>

  {/* Date of Birth */}
  <div className="technician-info-item">
    <span><CalendarDays size={14} /> Date of Birth</span>
    {editMode ? (
      <input
        type="date"
        name="dateOfBirth"
        value={formData.dateOfBirth}
        onChange={handleInputChange}
      />
    ) : (
      <strong>
        {user.dateOfBirth
          ? new Date(user.dateOfBirth).toLocaleDateString()
          : 'Not available'}
      </strong>
    )}
  </div>

  {/* Gender */}
  <div className="technician-info-item">
    <span><User size={14} /> Gender</span>
    {editMode ? (
      <select
        name="gender"
        value={formData.gender}
        onChange={handleInputChange}
      >
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
        <option value="Prefer not to say">Prefer not to say</option>
      </select>
    ) : (
      <strong>{user.gender || 'Not specified'}</strong>
    )}
  </div>

  {/* Specialization */}
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

  {/* Experience */}
  <div className="technician-info-item">
    <span><BriefcaseBusiness size={14} /> Experience (Years)</span>
    {editMode ? (
      <input
        type="number"
        name="experience"
        value={formData.experience}
        onChange={handleInputChange}
        placeholder="Enter experience"
        min="0"
        max="60"
      />
    ) : (
      <strong>
        {user.experience ?? 'Not specified'}
        {user.experience !== null && user.experience !== undefined ? ' years' : ''}
      </strong>
    )}
  </div>

  {/* Approval Status - Admin Controlled */}
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
  disabled={saving}
>
  <Save size={16} />
  {saving ? 'Saving...' : 'Save Changes'}
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
