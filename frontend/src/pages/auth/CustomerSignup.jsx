import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import {
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    ArrowLeft
} from 'lucide-react';

import AuthLayout from '../../components/AuthLayout';
import logo from '../../assets/logo.png';

import './CustomerSignup.css';

const API_URL = 'http://localhost:3006/api/users/customer';

function CustomerSignup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [resendTimer, setResendTimer] = useState(0);

    // Countdown for OTP resend
    useEffect(() => {
        if (resendTimer <= 0) return;

        const timer = setTimeout(() => {
            setResendTimer((previous) => previous - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [resendTimer]);

    const handleChange = (e) => {
        setFormData((previous) => ({
            ...previous,
            [e.target.name]: e.target.value
        }));
    };


const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSuccess('');

    if (!agreeToTerms) {
        setError('Please agree to the Terms and Conditions.');
        return;
    }

    try {
        setLoading(true);

        const credential = credentialResponse.credential;

        let response;

        try {
            // First attempt without phone number
            response = await axios.post(
                `${API_URL}/google-login`,
                { credential }
            );

        } catch (err) {
            if (err.response?.data?.code === 'PHONE_REQUIRED') {

                const phone = window.prompt(
                    'Enter your 10-digit mobile number to complete registration:'
                );

                if (!phone) {
                    setError('Phone number is required.');
                    return;
                }

                if (!/^[0-9]{10}$/.test(phone.trim())) {
                    setError('Please enter a valid 10-digit mobile number.');
                    return;
                }

                // Retry with phone number
                response = await axios.post(
                    `${API_URL}/google-login`,
                    {
                        credential,
                        phone: phone.trim()
                    }
                );

            } else {
                throw err;
            }
        }

        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem(
            'user',
            JSON.stringify(response.data.user)
        );

        navigate('/customer/dashboard');

    } catch (err) {
        setError(
            err.response?.data?.message ||
            'Google Sign-Up failed. Please try again.'
        );
    } finally {
        setLoading(false);
    }
};


    // Request OTP
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!agreeToTerms) {
            setError('Please agree to the Terms and Conditions.');
            return;
        }

        if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                `${API_URL}/signup/request-otp`,
                {
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone.trim(),
                    password: formData.password
                }
            );

            setOtpSent(true);
            setResendTimer(60);

            setSuccess(
                response.data.message ||
                'Verification OTP sent to your email.'
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to send OTP. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        setError('');
        setSuccess('');

        if (!/^[0-9]{6}$/.test(otp)) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                `${API_URL}/signup/verify-otp`,
                {
                    email: formData.email.trim().toLowerCase(),
                    otp: otp.trim()
                }
            );

            alert(
                response.data.message ||
                'Account created successfully!'
            );

            navigate('/customer/login');

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'OTP verification failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (resendTimer > 0 || loading) return;

        setError('');
        setSuccess('');

        try {
            setLoading(true);

            const response = await axios.post(
                `${API_URL}/signup/request-otp`,
                {
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone.trim(),
                    password: formData.password
                }
            );

            setOtp('');
            setResendTimer(60);

            setSuccess(
                response.data.message ||
                'A new OTP has been sent to your email.'
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to resend OTP. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Return to signup form
    const handleBack = () => {
        setOtpSent(false);
        setOtp('');
        setError('');
        setSuccess('');
    };

    return (
        <AuthLayout logo={logo}>

            <div className="signup-heading">
                <h1>
                    {otpSent ? 'Verify Your Email' : 'Create a new account'}
                </h1>

                <p>
                    {otpSent
                        ? `Enter the 6-digit OTP sent to ${formData.email}`
                        : 'Join GasConnect and manage your gas services easily'
                    }
                </p>
            </div>

            {!otpSent ? (

                <form className="signup-form" onSubmit={handleSubmit}>

                    {/* Google Sign-Up */}
                    
<div className="google-signup">
    {loading ? (
        'Please wait...'
    ) : (
        <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
                setError('Google authentication failed.');
            }}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="350"
        />
    )}
</div>


                    <div className="signup-divider">
                        <span>OR</span>
                    </div>

                    {/* Full Name */}
                    <div className="signup-input-group">
                        <User />
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            minLength={3}
                            maxLength={100}
                            autoComplete="name"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="signup-input-group">
                        <Mail />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div className="signup-input-group">
                        <Phone />
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Mobile Number"
                            value={formData.phone}
                            onChange={handleChange}
                            maxLength={10}
                            pattern="[0-9]{10}"
                            inputMode="numeric"
                            autoComplete="tel"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="signup-input-group">
                        <Lock />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Create Password"
                            value={formData.password}
                            onChange={handleChange}
                            minLength={8}
                            autoComplete="new-password"
                            required
                        />

                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="signup-input-group">
                        <Lock />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                        />

                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                                showConfirmPassword
                                    ? 'Hide confirmation password'
                                    : 'Show confirmation password'
                            }
                        >
                            {showConfirmPassword ? <EyeOff /> : <Eye />}
                        </button>
                    </div>

                    {/* Terms checkbox */}
                    <label className="signup-terms">
                        <input
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={(e) =>
                                setAgreeToTerms(e.target.checked)
                            }
                            required
                        />

                        <span>
                            I agree to the <u>Terms & Conditions</u> and{' '}
                            <u>Privacy Policy</u>.
                        </span>
                    </label>

                    {error && (
                        <p className="signup-error" role="alert">
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="signup-submit"
                        disabled={loading}
                    >
                        {loading ? 'Sending OTP...' : 'Continue'}
                    </button>

                    <p className="signup-login-link">
                        Already have an account?{' '}
                        <Link to="/customer/login">Sign In</Link>
                    </p>

                </form>

            ) : (

                /* OTP Verification Form */
                <form
                    className="signup-form"
                    onSubmit={handleVerifyOTP}
                >

                    <div className="signup-input-group">
                        <Lock />
                        <input
                            type="text"
                            name="otp"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => {
                                const value = e.target.value
                                    .replace(/\D/g, '')
                                    .slice(0, 6);

                                setOtp(value);
                            }}
                            inputMode="numeric"
                            maxLength={6}
                            autoComplete="one-time-code"
                            required
                        />
                    </div>

                    {error && (
                        <p className="signup-error" role="alert">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="signup-success" role="status">
                            {success}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="signup-submit"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    <p className="signup-login-link">
                        {resendTimer > 0 ? (
                            `Resend OTP in ${resendTimer} seconds`
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={loading}
                                className="password-toggle"
                            >
                                Resend OTP
                            </button>
                        )}
                    </p>

                    <p className="signup-login-link">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="password-toggle"
                        >
                            <ArrowLeft size={14} />
                            {' '}Back to Signup
                        </button>
                    </p>

                </form>

            )}

        </AuthLayout>
    );
}

export default CustomerSignup;