
import { useEffect, useState } from 'react';
import {
  UserRound,
  Mail,
  Phone,
  Save,
  LoaderCircle,
  CheckCircle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

import './MyProfile.css';

const API_URL = 'http://localhost:3006/api';

const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export default function MyProfile() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const storedUser = getStoredUser();

    setForm({
      name: storedUser.name || '',
      email: storedUser.email || '',
      phone: storedUser.phone || ''
    });

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user || data;

        setForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || ''
        });

        sessionStorage.setItem('user', JSON.stringify(user));
      } else if (response.status !== 404) {
        const data = await response.json();
        throw new Error(data.message || 'Unable to load profile');
      }
    } catch (err) {
      setError(err.message || 'Unable to load profile information.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = event => {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));

    setSuccess('');
    setError('');
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to update profile. Please try again.'
        );
      }

      const updatedUser = data.user || {
        ...getStoredUser(),
        ...form
      };

      sessionStorage.setItem('user', JSON.stringify(updatedUser));

      setForm({
        name: updatedUser.name || form.name,
        email: updatedUser.email || form.email,
        phone: updatedUser.phone || form.phone
      });

      setSuccess('Your profile has been updated successfully!');
    } catch (err) {
      setError(err.message || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };

  const initials = form.name
    ? form.name.trim().charAt(0).toUpperCase()
    : 'U';

  if (loading) {
    return (
      <div className="profile-loading">
        <LoaderCircle size={30} className="profile-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="customer-profile-page">
      <div className="profile-heading">
        <div>
          <span className="profile-eyebrow">ACCOUNT SETTINGS</span>
          <h2>My Profile</h2>
          <p>Manage your personal information and contact details.</p>
        </div>

        <div className="profile-heading-icon">
          <UserRound size={27} />
        </div>
      </div>

      <div className="profile-main-card">
        <div className="profile-cover" />

        <div className="profile-user-summary">
          <div className="profile-avatar">{initials}</div>

          <div className="profile-user-info">
            <h3>{form.name || 'Customer'}</h3>
            <p>{form.email || 'No email provided'}</p>
          </div>

          <span className="profile-customer-badge">
            <ShieldCheck size={15} />
            Customer Account
          </span>
        </div>

        <div className="profile-divider" />

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-heading">
            <h3>Personal Information</h3>
            <p>Update the information associated with your account.</p>
          </div>

          {error && (
            <div className="profile-message profile-error">
              <AlertCircle size={17} />
              {error}
            </div>
          )}

          {success && (
            <div className="profile-message profile-success">
              <CheckCircle size={17} />
              {success}
            </div>
          )}

          <div className="profile-fields">
            <div className="profile-field">
              <label htmlFor="profile-name">Full Name</label>

              <div className="profile-input-wrapper">
                <UserRound size={18} />
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-email">Email Address</label>

              <div className="profile-input-wrapper">
                <Mail size={18} />
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-phone">Phone Number</label>

              <div className="profile-input-wrapper">
                <Phone size={18} />
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="profile-form-footer">
            <p>Your information is used to manage your GasConnect services.</p>

            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="profile-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
