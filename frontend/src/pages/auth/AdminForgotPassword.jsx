
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, ShieldCheck, KeyRound, LockKeyhole, Eye, EyeOff } from 'lucide-react';

import AuthLayout from '../../components/AuthLayout';
import logo from '../../assets/logo.png';
import adminIllustration from '../../assets/img3.png';

import './AdminForgotPassword.css';

function AdminForgotPassword() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post(
                'http://localhost:3006/api/users/admin/forgot-password',
                { email: email.trim().toLowerCase() }
            );

            setMessage(response.data.message);
            setStep(2);
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to send OTP. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post(
                'http://localhost:3006/api/users/admin/verify-reset-otp',
                {
                    email: email.trim().toLowerCase(),
                    otp: otp.trim()
                }
            );

            if (!response.data.resetToken) {
    setError('Password reset token was not received. Please try again.');
    return;
}

setResetToken(response.data.resetToken);
setMessage('OTP verified successfully!');
setStep(3);
        } catch (err) {
            setError(
                err.response?.data?.message || 'OTP verification failed.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,128}$/;

if (!passwordRegex.test(newPassword)) {
    setError(
        'Password must contain 8-128 characters, including uppercase, lowercase, a number and a special character. Spaces are not allowed.'
    );
    return;
}

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                'http://localhost:3006/api/users/admin/reset-password',
                {
                    resetToken,
                    newPassword
                }
            );

            setMessage(response.data.message);

            setTimeout(() => {
                navigate('/admin/login');
            }, 1500);
        } catch (err) {
            setError(
                err.response?.data?.message || 'Password reset failed.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout logo={logo} illustration={adminIllustration}>
            <div className="admin-forgot-heading">
                <div className="admin-forgot-title">
                    <ShieldCheck size={40} color="#FFD600" />
                    <h1>
                        {step === 1 && 'Forgot Password'}
                        {step === 2 && 'Verify OTP'}
                        {step === 3 && 'Reset Password'}
                    </h1>
                </div>

                <p>
                    {step === 1 && 'Enter your registered admin email to receive an OTP.'}
                    {step === 2 && `Enter the 6-digit code sent to ${email}.`}
                    {step === 3 && 'Create a new password for your admin account.'}
                </p>
            </div>

            {step === 1 && (
                <form className="admin-forgot-form" onSubmit={handleSendOTP}>
                    <div className="admin-forgot-input">
                        <Mail />
                        <input
                            type="email"
                            placeholder="Admin Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="admin-forgot-error">{error}</p>}
                    {message && <p className="admin-forgot-success">{message}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form className="admin-forgot-form" onSubmit={handleVerifyOTP}>
                    <div className="admin-forgot-input">
                        <KeyRound />
                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            inputMode="numeric"
                            required
                        />
                    </div>

                    <p className="admin-forgot-hint">
                        OTP expires in 5 minutes.
                    </p>

                    {error && <p className="admin-forgot-error">{error}</p>}
                    {message && <p className="admin-forgot-success">{message}</p>}

                    <button type="submit" disabled={loading || otp.length !== 6}>
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    <button
                        type="button"
                        className="admin-forgot-secondary"
                        onClick={() => {
                            setStep(1);
                            setOtp('');
                            setError('');
                            setMessage('');
                        }}
                    >
                        Change Email
                    </button>
                </form>
            )}

            {step === 3 && (
                <form className="admin-forgot-form" onSubmit={handleResetPassword}>
                    <div className="admin-forgot-input">
                        <LockKeyhole />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="admin-forgot-eye"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <Eye size={21} /> : <EyeOff size={21} />}
                        </button>
                    </div>

                    <div className="admin-forgot-input">
                        <LockKeyhole />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <p className="admin-forgot-hint">
    Use 8-128 characters with uppercase, lowercase, a number
    and a special character. Spaces are not allowed.
</p>

                    {error && <p className="admin-forgot-error">{error}</p>}
                    {message && <p className="admin-forgot-success">{message}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Updating Password...' : 'Reset Password'}
                    </button>
                </form>
            )}

            <div className="admin-forgot-back">
                <Link to="/admin/login">
                    <ArrowLeft size={17} />
                    Back to Admin Login
                </Link>
            </div>
        </AuthLayout>
    );
}

export default AdminForgotPassword;
