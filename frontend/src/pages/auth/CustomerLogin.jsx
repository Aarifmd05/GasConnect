
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

import AuthLayout from '../../components/AuthLayout';
import logo from '../../assets/logo.png';
import './CustomerLogin.css';
import Swal from 'sweetalert2';

function CustomerLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    // Normal email/password login
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);

            const response = await axios.post(
                'http://localhost:3006/api/users/customer/login',
                { email, password }
            );

            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('user', JSON.stringify(response.data.user));

            navigate('/customer/dashboard');

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Google login


    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');

        try {
            setGoogleLoading(true);

            const credential = credentialResponse.credential;

            // STEP 1: Try normal Google login first
            let response;

            try {
                response = await axios.post(
                    'http://localhost:3006/api/users/customer/google-login',
                    { credential }
                );

                // Existing customer login successful
                sessionStorage.setItem('token', response.data.token);
                sessionStorage.setItem(
                    'user',
                    JSON.stringify(response.data.user)
                );

                navigate('/customer/dashboard');
                return;

            } catch (err) {
                if (err.response?.data?.code !== 'PHONE_REQUIRED') {
                    throw err;
                }
            }

            // STEP 2: Ask for mobile number
            const { value: phone, isConfirmed: phoneConfirmed } =
                await Swal.fire({
                    title: 'Complete Your Registration',
                    text: 'Enter your mobile number to continue with GasConnect.',
                    input: 'tel',
                    inputPlaceholder: 'Enter 10-digit mobile number',
                    inputAttributes: {
                        maxlength: 10,
                        inputmode: 'numeric',
                        autocomplete: 'tel'
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Continue',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#0754A0',
                    cancelButtonColor: '#64748b',
                    reverseButtons: true,
                    allowOutsideClick: false,
                    inputValidator: (value) => {
                        if (!value) {
                            return 'Mobile number is required.';
                        }

                        if (!/^[0-9]{10}$/.test(value.trim())) {
                            return 'Enter a valid 10-digit mobile number.';
                        }
                    }
                });

            if (!phoneConfirmed) return;

            // STEP 3: Request OTP using verified Google email
            await axios.post(
                'http://localhost:3006/api/users/customer/google-signup/request-otp',
                {
                    credential,
                    phone: phone.trim()
                }
            );

            // STEP 4: Ask customer to enter email OTP
            const { value: otp, isConfirmed: otpConfirmed } =
                await Swal.fire({
                    title: 'Verify Your Email',
                    text: 'A 6-digit OTP has been sent to your Google email address.',
                    input: 'text',
                    inputPlaceholder: 'Enter 6-digit OTP',
                    inputAttributes: {
                        maxlength: 6,
                        inputmode: 'numeric',
                        autocomplete: 'one-time-code'
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Verify & Register',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#0754A0',
                    cancelButtonColor: '#64748b',
                    reverseButtons: true,
                    allowOutsideClick: false,
                    inputValidator: (value) => {
                        if (!value) {
                            return 'OTP is required.';
                        }

                        if (!/^[0-9]{6}$/.test(value.trim())) {
                            return 'Enter a valid 6-digit OTP.';
                        }
                    }
                });

            if (!otpConfirmed) return;

            // STEP 5: Verify OTP and create customer account
            response = await axios.post(
                'http://localhost:3006/api/users/customer/google-signup/verify-otp',
                {
                    credential,
                    otp: otp.trim()
                }
            );

            // STEP 6: Save login details
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem(
                'user',
                JSON.stringify(response.data.user)
            );

            await Swal.fire({
                icon: 'success',
                title: 'Registration Successful!',
                text: 'Your GasConnect customer account has been created.',
                confirmButtonColor: '#0754A0'
            });

            // STEP 7: Navigate to dashboard
            navigate('/customer/dashboard');

        } catch (err) {
            const message =
                err.response?.data?.message ||
                'Google registration failed. Please try again.';

            setError(message);

            Swal.fire({
                icon: 'error',
                title: 'Unable to Continue',
                text: message,
                confirmButtonColor: '#0754A0'
            });

        } finally {
            setGoogleLoading(false);
        }
    };



    return (
        <AuthLayout logo={logo}>

            <div className="login-heading">
                <h1>Welcome Back!</h1>
                <p>Log in to your existing profile</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>

                <div className="login-input-group">
                    <Mail />
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="login-input-group">
                    <Lock />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="button"
                        className="login-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                    >
                        {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                </div>

                <div className="login-options">
                    <Link to="/customer/forgot-password">
                        Forgot password?
                    </Link>

                    {/* <label>
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        Show password
                    </label> */}
                </div>

                {error && <p className="login-error">{error}</p>}

                <button
                    type="submit"
                    className="login-submit"
                    disabled={loading}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="login-divider">
                    <span>OR</span>
                </div>

                <div className="google-login">
                    {googleLoading ? (
                        'Signing in with Google...'
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
                            width="400"
                        />
                    )}
                </div>

                <p className="login-signup-link">
                    Don't have an account?{' '}
                    <Link to="/customer/signup">Sign Up</Link>
                </p>

            </form>

            {/* Outside the form box */}
            <div className="back-home-wrapper">
                <Link to="/" className="back-home-btn">
                    <ArrowLeft size={18} />
                    Back to Home
                </Link>
            </div>

        </AuthLayout>
    );
}

export default CustomerLogin;
