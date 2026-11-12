
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

import AuthLayout from '../../components/AuthLayout';
import logo from '../../assets/logo.png';
import './CustomerLogin.css';

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

        let response;

        try {
            // First attempt
            response = await axios.post(
                'http://localhost:3006/api/users/customer/google-login',
                { credential }
            );

        } catch (err) {
            // New customer needs a phone number
            if (err.response?.data?.code === 'PHONE_REQUIRED') {

                const phone = window.prompt(
                    'Enter your 10-digit mobile number to complete registration:'
                );

                if (!phone) {
                    setError('Phone number is required for registration.');
                    return;
                }

                if (!/^[0-9]{10}$/.test(phone.trim())) {
                    setError('Please enter a valid 10-digit phone number.');
                    return;
                }

                // Retry with phone number
                response = await axios.post(
                    'http://localhost:3006/api/users/customer/google-login',
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
            'Google login failed. Please try again.'
        );
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

                    <label>
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        Show password
                    </label>
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
                            width="280"
                        />
                    )}
                </div>

                <p className="login-signup-link">
                    Don't have an account?{' '}
                    <Link to="/customer/signup">Sign Up</Link>
                </p>

            </form>

        </AuthLayout>
    );
}

export default CustomerLogin;
