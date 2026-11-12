
import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';

import AuthLayout from '../../components/AuthLayout';
import logo from '../../assets/logo.png';
import adminIllustration from '../../assets/img3.png';

import './AdminLogin.css';

function AdminLogin() {
    const navigate = useNavigate();
    const googleButtonRef = useRef(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Google Login
    const handleGoogleResponse = async (googleResponse) => {
        if (!googleResponse.credential) {
            setError('Google authentication failed. Please try again.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await axios.post(
                'http://localhost:3006/api/users/admin/google-login',
                { credential: googleResponse.credential }
            );

            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('user', JSON.stringify(response.data.user));

            navigate('/admin/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Google login failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Email and Password Login
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                'http://localhost:3006/api/users/admin/login',
                {
                    email: email.trim().toLowerCase(),
                    password
                }
            );

            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('user', JSON.stringify(response.data.user));

            navigate('/admin/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Invalid email or password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Initialize Google Sign-In
    useEffect(() => {
        let cancelled = false;

        const initializeGoogleLogin = () => {
            if (
                cancelled ||
                !window.google?.accounts?.id ||
                !googleButtonRef.current
            ) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
                auto_select: false
            });

            googleButtonRef.current.innerHTML = '';

            window.google.accounts.id.renderButton(
                googleButtonRef.current,
                {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 320,
                    logo_alignment: 'center'
                }
            );
        };

        if (window.google?.accounts?.id) {
            initializeGoogleLogin();
        } else {
            let googleScript = document.querySelector(
                'script[src="https://accounts.google.com/gsi/client"]'
            );

            if (!googleScript) {
                googleScript = document.createElement('script');
                googleScript.src = 'https://accounts.google.com/gsi/client';
                googleScript.async = true;
                googleScript.defer = true;
                document.head.appendChild(googleScript);
            }

            googleScript.addEventListener('load', initializeGoogleLogin);
        }

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <AuthLayout logo={logo} illustration={adminIllustration}>
            <div className="admin-login-heading">
                <div className="admin-login-title">
                    <ShieldCheck size={43} color="#FFD600" />
                    <h1>Admin Portal</h1>
                </div>

                <p>Sign in to manage GasConnect operations</p>
            </div>

            <form className="admin-login-form" onSubmit={handleEmailLogin}>
                {/* Google Login */}
                <div
                    ref={googleButtonRef}
                    className="admin-google-button"
                />

                {/* OR Divider */}
                <div className="admin-login-divider">
                    <span>OR</span>
                </div>

                {/* Email */}
                <div className="admin-login-input">
                    <Mail />
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                    />
                </div>

                {/* Password */}
                <div className="admin-login-input">
                    <LockKeyhole />
                    <input
                        className="admin-password-field"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />

                    <button
                        type="button"
                        className="admin-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <p className="admin-login-error">{error}</p>
                )}

                {/* Forgot Password */}
<div className="admin-login-options">
    <Link to="/admin/forgot-password">
        Forgot Password?
    </Link>
</div>

                {/* Loading */}
                {loading && (
                    <p className="admin-login-loading">Signing in...</p>
                )}

                {/* Login Button */}
                <button
                    type="submit"
                    className="admin-login-submit"
                    disabled={loading}
                >
                    {loading ? 'Please wait...' : 'Login'}
                </button>
            </form>
        </AuthLayout>
    );
}

export default AdminLogin;
