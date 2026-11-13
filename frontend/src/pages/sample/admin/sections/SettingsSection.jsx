
import axios from 'axios';
import { useState, useEffect } from 'react';

import {
    User,
    UserCircle,
    Bell,
    Shield,
    ShieldCheck,
    Info,
    Edit,
    X,
    Save,
    Settings,
    Mail,
    Phone,
    CalendarCheck,
    Users,
    AlertCircle,
    Lock,
    Sun,
Moon,
Monitor
} from 'lucide-react';
import { useTheme } from "../../../context/ThemeContext";
import './SettingsSection.css';

function SettingsSection() {
    const { theme, setTheme } = useTheme();
    // ==========================================
    // GET LOGGED-IN ADMIN DETAILS
    // ==========================================

    const getAdminDetails = () => {
        try {
            return JSON.parse(sessionStorage.getItem('user')) || {};
        } catch {
            return {};
        }
    };

    const admin = getAdminDetails();

    // ==========================================
    // ADMIN PROFILE STATES
    // ==========================================

    const [adminProfile, setAdminProfile] = useState(admin);

    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const [profileLoading, setProfileLoading] = useState(false);

    const [profileMessage, setProfileMessage] = useState('');

    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        alternativeEmail: '',
        phone: '',
        alternativePhone: '',
        dateOfBirth: '',
        gender: 'Prefer not to say'
    });

    // ==========================================
    // FETCH ADMIN PROFILE
    // ==========================================

    useEffect(() => {

        const fetchAdminProfile = async () => {

            try {

                const token = sessionStorage.getItem('token');

                if (!token) {
                    setProfileMessage('Please log in again.');
                    return;
                }

                const response = await axios.get(
                    'http://localhost:3006/api/users/admin/profile',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = response.data.admin;

                setAdminProfile(data);

                setProfileForm({
                    firstName: data.firstName || data.name?.split(' ')[0] || '',
                    lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
                    email: data.email || '',
                    alternativeEmail: data.alternativeEmail || '',
                    phone: data.phone || '',
                    alternativePhone: data.alternativePhone || '',
                    dateOfBirth: data.dateOfBirth
                        ? data.dateOfBirth.substring(0, 10)
                        : '',
                    gender: data.gender || 'Prefer not to say'
                });

                sessionStorage.setItem('user', JSON.stringify(data));

            } catch (error) {

                console.error('Error fetching admin profile:', error);

                setProfileMessage(
                    error.response?.data?.message ||
                    'Unable to load admin profile.'
                );

            }
        };

        fetchAdminProfile();

    }, []);

    // ==========================================
    // HANDLE PROFILE INPUT CHANGES
    // ==========================================

    const handleProfileChange = (e) => {

        const { name, value } = e.target;

        setProfileForm((prev) => ({
            ...prev,
            [name]: value
        }));

    };

    // ==========================================
    // SAVE ADMIN PROFILE
    // ==========================================

    const handleProfileSave = async (e) => {

        e.preventDefault();

        try {

            setProfileLoading(true);
            setProfileMessage('');

            const token = sessionStorage.getItem('token');

            if (!token) {
                setProfileMessage('Please log in again.');
                return;
            }

            const response = await axios.put(
                'http://localhost:3006/api/users/admin/profile',
                profileForm,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const updatedAdmin = response.data.admin;

            setAdminProfile(updatedAdmin);

            setProfileForm({
                firstName: updatedAdmin.firstName || '',
                lastName: updatedAdmin.lastName || '',
                email: updatedAdmin.email || '',
                alternativeEmail: updatedAdmin.alternativeEmail || '',
                phone: updatedAdmin.phone || '',
                alternativePhone: updatedAdmin.alternativePhone || '',
                dateOfBirth: updatedAdmin.dateOfBirth
                    ? updatedAdmin.dateOfBirth.substring(0, 10)
                    : '',
                gender: updatedAdmin.gender || 'Prefer not to say'
            });

            sessionStorage.setItem(
                'user',
                JSON.stringify(updatedAdmin)
            );

            setIsEditingProfile(false);

            setProfileMessage('Profile updated successfully!');

        } catch (error) {

            console.error('Profile update error:', error);

            setProfileMessage(
                error.response?.data?.message ||
                'Unable to update profile.'
            );

        } finally {

            setProfileLoading(false);

        }

    };

    // ==========================================
    // CANCEL PROFILE EDITING
    // ==========================================

    const handleProfileCancel = () => {

        setProfileForm({
            firstName: adminProfile.firstName || adminProfile.name?.split(' ')[0] || '',
            lastName: adminProfile.lastName || adminProfile.name?.split(' ').slice(1).join(' ') || '',
            email: adminProfile.email || '',
            alternativeEmail: adminProfile.alternativeEmail || '',
            phone: adminProfile.phone || '',
            alternativePhone: adminProfile.alternativePhone || '',
            dateOfBirth: adminProfile.dateOfBirth
                ? adminProfile.dateOfBirth.substring(0, 10)
                : '',
            gender: adminProfile.gender || 'Prefer not to say'
        });

        setIsEditingProfile(false);
        setProfileMessage('');

    };

    // ==========================================
    // NOTIFICATION PREFERENCES
    // ==========================================

    const [notifications, setNotifications] = useState(() => {

        try {

            const saved = localStorage.getItem('adminNotifications');

            return saved
                ? JSON.parse(saved)
                : {
                    bookings: true,
                    customers: true,
                    system: true
                };

        } catch {

            return {
                bookings: true,
                customers: true,
                system: true
            };

        }

    });

    const [saveMessage, setSaveMessage] = useState('');

    // Update notification settings
    const handleNotificationChange = (key) => {

        const updated = {
            ...notifications,
            [key]: !notifications[key]
        };

        setNotifications(updated);

        localStorage.setItem(
            'adminNotifications',
            JSON.stringify(updated)
        );

        setSaveMessage('Notification preferences saved successfully!');

        setTimeout(() => {
            setSaveMessage('');
        }, 3000);

    };

    // ==========================================
    // PASSWORD CHANGE
    // ==========================================

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordMessage, setPasswordMessage] = useState('');

    // Handle password input
    const handlePasswordChange = (e) => {

        setPasswordForm({
            ...passwordForm,
            [e.target.name]: e.target.value
        });

    };

    // Handle password submission
    const handlePasswordSubmit = async (e) => {

        e.preventDefault();

        setPasswordMessage('');

        if (
            !passwordForm.currentPassword ||
            !passwordForm.newPassword ||
            !passwordForm.confirmPassword
        ) {
            setPasswordMessage('Please fill in all password fields.');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setPasswordMessage(
                'New password must contain at least 8 characters.'
            );
            return;
        }

        if (
            passwordForm.newPassword !== passwordForm.confirmPassword
        ) {
            setPasswordMessage('New passwords do not match.');
            return;
        }

        try {

            const token = sessionStorage.getItem('token');

            if (!token) {
                setPasswordMessage('Please log in again.');
                return;
            }

            const response = await axios.put(
                'http://localhost:3006/api/users/change-password',
                {
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setPasswordMessage(response.data.message);

            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

        } catch (error) {

            console.error('Change password error:', error);

            setPasswordMessage(
                error.response?.data?.message ||
                'Unable to change password. Please try again.'
            );

        }

    };

    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="admin-settings-page">

            {/* PAGE HEADER */}

            <div className="admin-welcome">

                <div>
                    <h1>Settings</h1>

                    <p>
                        Manage your GasConnect admin account and preferences.
                    </p>
                </div>

                <span className="admin-role-label">
                    <Settings size={17} />
                    Settings
                </span>

            </div>

            {/* ACCOUNT SETTINGS HEADING */}

            <div className="settings-section-heading">

                <h2>Account & Application Settings</h2>

                <p>
                    Manage your account, notifications and security.
                </p>

            </div>

            
{/* APPEARANCE SETTINGS */}

<div className="settings-card settings-appearance-card">

    <div className="settings-card-header">
        <div className="settings-icon">
            <Settings size={23} />
        </div>

        <div>
            <h3>Appearance Settings</h3>
            <p>Customize how GasConnect looks on your device.</p>
        </div>
    </div>

    <div className="settings-theme-options">

        <button
            type="button"
            className={`settings-theme-option ${
                theme === 'light' ? 'active' : ''
            }`}
            onClick={() => setTheme('light')}
            aria-pressed={theme === 'light'}
        >
            <Sun size={25} />
            <span>Light Mode</span>
            <small>Clean and bright appearance</small>
        </button>

        <button
            type="button"
            className={`settings-theme-option ${
                theme === 'dark' ? 'active' : ''
            }`}
            onClick={() => setTheme('dark')}
            aria-pressed={theme === 'dark'}
        >
            <Moon size={25} />
            <span>Dark Mode</span>
            <small>Comfortable low-light appearance</small>
        </button>

        <button
            type="button"
            className={`settings-theme-option ${
                theme === 'system' ? 'active' : ''
            }`}
            onClick={() => setTheme('system')}
            aria-pressed={theme === 'system'}
        >
            <Monitor size={25} />
            <span>System Default</span>
            <small>Follow your device preference</small>
        </button>

    </div>

    <p className="settings-theme-description">
        Your appearance preference is saved automatically.
    </p>

</div>


            {/* ======================================
                ADMIN PROFILE
            ====================================== */}

            <div className="settings-card">

                <div className="settings-card-header">

                    <div className="settings-icon">
                        <User size={23} />
                    </div>

                    <div>
                        <h3>Admin Profile</h3>
                        <p>Your administrator account information.</p>
                    </div>

                </div>

                {/* PROFILE TOP SECTION */}

                <div className="settings-profile">

                    <div className="settings-avatar">
                        <UserCircle size={55} />
                    </div>

                    <div>

                        <h3>
                            {adminProfile.name || 'Administrator'}
                        </h3>

                        <span className="settings-admin-badge">
                            Administrator
                        </span>

                    </div>

                    <button
                        type="button"
                        className="settings-edit-button"
                        onClick={() => {
                            setProfileMessage('');
                            setIsEditingProfile(true);
                        }}
                    >
                        <Edit size={16} />
                        Edit Profile
                    </button>

                </div>

                {/* PROFILE MESSAGE */}

                {profileMessage && (

                    <p
                        className={
                            profileMessage.includes('successfully')
                                ? 'settings-success-message'
                                : 'settings-password-message'
                        }
                    >
                        <Info size={16} />
                        {profileMessage}
                    </p>

                )}

                {/* PROFILE EDIT FORM */}

                {isEditingProfile ? (

                    <form
                        className="settings-profile-form"
                        onSubmit={handleProfileSave}
                    >

                        <div className="settings-profile-input-grid">

                            <div className="settings-form-group">
                                <label>First Name *</label>

                                <input
                                    type="text"
                                    name="firstName"
                                    value={profileForm.firstName}
                                    onChange={handleProfileChange}
                                    placeholder="Enter first name"
                                    required
                                    maxLength={50}
                                />
                            </div>

                            <div className="settings-form-group">
                                <label>Last Name *</label>

                                <input
                                    type="text"
                                    name="lastName"
                                    value={profileForm.lastName}
                                    onChange={handleProfileChange}
                                    placeholder="Enter last name"
                                    required
                                    maxLength={50}
                                />
                            </div>

                            <div className="settings-form-group">
                                <label>Email Address *</label>

                                <input
    type="email"
    name="email"
    value={profileForm.email}
    readOnly
    placeholder="Enter email address"
    required
/>
                            </div>

                            <div className="settings-form-group">
                                <label>Alternative Email</label>

                                <input
                                    type="email"
                                    name="alternativeEmail"
                                    value={profileForm.alternativeEmail}
                                    onChange={handleProfileChange}
                                    placeholder="Enter alternative email"
                                />
                            </div>

                            <div className="settings-form-group">
                                <label>Phone Number *</label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileForm.phone}
                                    onChange={handleProfileChange}
                                    placeholder="Enter 10-digit phone number"
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    required
                                />
                            </div>

                            <div className="settings-form-group">
                                <label>Alternative Phone Number</label>

                                <input
                                    type="tel"
                                    name="alternativePhone"
                                    value={profileForm.alternativePhone}
                                    onChange={handleProfileChange}
                                    placeholder="Enter alternative phone"
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                />
                            </div>

                            <div className="settings-form-group">
                                <label>Date of Birth</label>

                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={profileForm.dateOfBirth}
                                    onChange={handleProfileChange}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="settings-form-group">
                                <label>Gender</label>

                                <select
                                    name="gender"
                                    value={profileForm.gender}
                                    onChange={handleProfileChange}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">
                                        Prefer not to say
                                    </option>
                                </select>
                            </div>

                        </div>

                        {/* FORM BUTTONS */}

                        <div className="settings-profile-actions">

                            <button
                                type="button"
                                className="settings-cancel-button"
                                onClick={handleProfileCancel}
                                disabled={profileLoading}
                            >
                                <X size={17} />
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="settings-save-button"
                                disabled={profileLoading}
                            >
                                <Save size={17} />
                                {profileLoading
                                    ? 'Saving...'
                                    : 'Save Changes'}
                            </button>

                        </div>

                    </form>

                ) : (

                    /* PROFILE DETAILS VIEW */

                    <div className="settings-info-grid">

                        <div className="settings-info-item">
                            <label>
                                <UserCircle size={16} />
                                First Name
                            </label>

                            <p>
                                {adminProfile.firstName ||
                                    adminProfile.name?.split(' ')[0] ||
                                    'Not available'}
                            </p>
                        </div>

                        <div className="settings-info-item">
                            <label>
                                <UserCircle size={16} />
                                Last Name
                            </label>

                            <p>
                                {adminProfile.lastName ||
                                    adminProfile.name?.split(' ').slice(1).join(' ') ||
                                    'Not available'}
                            </p>
                        </div>

                        <div className="settings-info-item">
                            <label>
                                <Mail size={16} />
                                Email Address
                            </label>

                            <p>{adminProfile.email || 'Not available'}</p>
                        </div>

                        <div className="settings-info-item">
                            <label>
                                <Mail size={16} />
                                Alternative Email
                            </label>

                            <p>
                                {adminProfile.alternativeEmail || 'Not available'}
                            </p>
                        </div>

                        <div className="settings-info-item">
                            <label>
                                <Phone size={16} />
                                Phone Number
                            </label>

                            <p>{adminProfile.phone || 'Not available'}</p>
                        </div>

                        <div className="settings-info-item">
                            <label>
                                <Phone size={16} />
                                Alternative Phone Number
                            </label>

                            <p>
                                {adminProfile.alternativePhone || 'Not available'}
                            </p>
                        </div>

                        <div className="settings-info-item">
                            <label>
                                <CalendarCheck size={16} />
                                Date of Birth
                            </label>

                            <p>
                                {adminProfile.dateOfBirth
                                    ? new Date(adminProfile.dateOfBirth).toLocaleDateString()
                                    : 'Not available'}
                            </p>
                        </div>

                        <div className="settings-info-item">
                            <label>
                                <Users size={16} />
                                Gender
                            </label>

                            <p>
                                {adminProfile.gender || 'Prefer not to say'}
                            </p>
                        </div>

                    </div>

                )}

            </div>

            {/* ======================================
                NOTIFICATION SETTINGS
            ====================================== */}

            <div className="settings-card">

                <div className="settings-card-header">

                    <div className="settings-icon">
                        <Bell size={23} />
                    </div>

                    <div>
                        <h3>Notification Preferences</h3>
                        <p>Choose which notification preferences to enable.</p>
                    </div>

                </div>

                <div className="settings-options">

                    {/* BOOKING NOTIFICATIONS */}

                    <div className="settings-option">

                        <div className="settings-option-info">

                            <CalendarCheck size={20} />

                            <div>
                                <h4>Booking Notifications</h4>
                                <p>Preferences for new booking notifications.</p>
                            </div>

                        </div>

                        <label className="settings-switch">

                            <input
                                type="checkbox"
                                checked={notifications.bookings}
                                onChange={() =>
                                    handleNotificationChange('bookings')
                                }
                            />

                            <span className="settings-slider"></span>

                        </label>

                    </div>

                    {/* CUSTOMER NOTIFICATIONS */}

                    <div className="settings-option">

                        <div className="settings-option-info">

                            <Users size={20} />

                            <div>
                                <h4>Customer Notifications</h4>
                                <p>Preferences for customer-related notifications.</p>
                            </div>

                        </div>

                        <label className="settings-switch">

                            <input
                                type="checkbox"
                                checked={notifications.customers}
                                onChange={() =>
                                    handleNotificationChange('customers')
                                }
                            />

                            <span className="settings-slider"></span>

                        </label>

                    </div>

                    {/* SYSTEM NOTIFICATIONS */}

                    <div className="settings-option">

                        <div className="settings-option-info">

                            <AlertCircle size={20} />

                            <div>
                                <h4>System Notifications</h4>
                                <p>Preferences for system alerts and updates.</p>
                            </div>

                        </div>

                        <label className="settings-switch">

                            <input
                                type="checkbox"
                                checked={notifications.system}
                                onChange={() =>
                                    handleNotificationChange('system')
                                }
                            />

                            <span className="settings-slider"></span>

                        </label>

                    </div>

                </div>

                {saveMessage && (

                    <p className="settings-success-message">
                        <Save size={16} />
                        {saveMessage}
                    </p>

                )}

            </div>

            {/* ======================================
                SECURITY SETTINGS
            ====================================== */}

            <div className="settings-card">

                <div className="settings-card-header">

                    <div className="settings-icon">
                        <Shield size={23} />
                    </div>

                    <div>
                        <h3>Security Settings</h3>
                        <p>Manage your administrator password.</p>
                    </div>

                </div>

                <form
                    className="settings-password-form"
                    onSubmit={handlePasswordSubmit}
                >

                    <div className="settings-form-group">

                        <label>Current Password</label>

                        <input
                            type="password"
                            name="currentPassword"
                            placeholder="Enter current password"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            required
                        />

                    </div>

                    <div className="settings-form-group">

                        <label>New Password</label>

                        <input
                            type="password"
                            name="newPassword"
                            placeholder="Enter new password"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            minLength={8}
                            required
                        />

                    </div>

                    <div className="settings-form-group">

                        <label>Confirm New Password</label>

                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm new password"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                        />

                    </div>

                    {passwordMessage && (

                        <p className="settings-password-message">
                            <Info size={16} />
                            {passwordMessage}
                        </p>

                    )}

                    <button
                        type="submit"
                        className="settings-save-button"
                    >
                        <Lock size={17} />
                        Change Password
                    </button>

                </form>

            </div>

            {/* ======================================
                APPLICATION INFORMATION
            ====================================== */}

            <div className="settings-card">

                <div className="settings-card-header">

                    <div className="settings-icon">
                        <Info size={23} />
                    </div>

                    <div>
                        <h3>Application Information</h3>
                        <p>Information about your dashboard.</p>
                    </div>

                </div>

                <div className="settings-info-grid">

                    <div className="settings-info-item">
                        <label>Application Name</label>
                        <p>GasConnect</p>
                    </div>

                    <div className="settings-info-item">
                        <label>Application Type</label>
                        <p>Admin Dashboard</p>
                    </div>

                    <div className="settings-info-item">
                        <label>Version</label>
                        <p>1.0.0</p>
                    </div>

                    <div className="settings-info-item">
                        <label>Platform</label>
                        <p>Web Application</p>
                    </div>

                </div>

            </div>

        </div>

    );

}

export default SettingsSection;
