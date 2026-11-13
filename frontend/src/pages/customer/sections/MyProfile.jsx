
import { useEffect, useState } from 'react';
import {
  UserRound,
  Mail,
  Phone,
  Save,
  LoaderCircle,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  User
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
      const response = await fetch(
        `${API_URL}/users/customer/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));

    setSuccess('');
    setError('');
  };

  const handleSubmit = async (event) => {
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

      const response = await fetch(
        `${API_URL}/users/customer/profile`,
        {
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
        }
      );

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

      sessionStorage.setItem(
        'user',
        JSON.stringify(updatedUser)
      );

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

      {/* PROFILE CARD */}

      <div className="profile-main-card">

        {/* BLUE COVER */}

        <div className="profile-cover">
          <div className="profile-cover-content">
            <span>GASCONNECT</span>
            <h2>Your Account, Your Control</h2>
            <p>Manage your personal details in one place.</p>
          </div>

          <div className="profile-cover-decoration">
            <UserRound size={105} />
          </div>
        </div>

        {/* CUSTOMER DETAILS */}

        <div className="profile-user-summary">

          <div className="profile-avatar">
            {initials}
          </div>

          <div className="profile-user-info">
            <span className="profile-user-label">
              CUSTOMER PROFILE
            </span>

            <h3>{form.name || 'Customer'}</h3>

            <p>
              <Mail size={15} />
              {form.email || 'No email provided'}
            </p>
          </div>

          <div className="profile-customer-badge">
            <ShieldCheck size={17} />
            <span>
              Customer Account
            </span>
          </div>

        </div>

        <div className="profile-divider" />

        {/* PERSONAL INFORMATION */}

        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >

          <div className="profile-form-heading">
            <div className="profile-section-icon">
              <User size={21} />
            </div>

            <div>
              <h3>Personal Information</h3>
              <p>
                Manage your personal information and contact details.
              </p>
            </div>
          </div>

          {/* ERROR MESSAGE */}

          {error && (
            <div className="profile-message profile-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}

          {success && (
            <div className="profile-message profile-success">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {/* FORM FIELDS */}

          <div className="profile-fields">

            {/* FULL NAME */}

            <div className="profile-field">
              <label htmlFor="profile-name">
                Full Name
              </label>

              <div className="profile-input-wrapper">
                <UserRound size={19} />

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

            {/* EMAIL */}

            <div className="profile-field">
              <label htmlFor="profile-email">
                Email Address
              </label>

              <div className="profile-input-wrapper">
                <Mail size={19} />

                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  readOnly
                />
              </div>

              <small>Email address cannot be edited here.</small>
            </div>

            {/* PHONE */}

            <div className="profile-field">
              <label htmlFor="profile-phone">
                Phone Number
              </label>

              <div className="profile-input-wrapper">
                <Phone size={19} />

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

          {/* FOOTER */}

          <div className="profile-form-footer">

            <div className="profile-footer-info">
              <ShieldCheck size={19} />
              <p>
                Your information is used to manage your
                GasConnect services securely.
              </p>
            </div>

            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="profile-spinner"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
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
