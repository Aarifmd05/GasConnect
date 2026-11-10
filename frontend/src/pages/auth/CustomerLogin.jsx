
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

import AuthLayout from '../../components/AuthLayout';

import logo from '../../assets/logo.png';
import mascot from '../../assets/img1.png';

import './CustomerLogin.css';

function CustomerLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    return (
        <AuthLayout logo={logo} illustration={mascot}>

            <div className="login-heading">
                <h1>Welcome Back!</h1>
                <p>Log in to your existing profile</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>

                {/* Email */}
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

                {/* Password */}
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

                {/* Login options */}
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

                {/* Sign In */}
                <button
                    type="submit"
                    className="login-submit"
                    disabled={loading}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>

                {/* Divider */}
                <div className="login-divider">
                    <span>OR</span>
                </div>

                {/* Google Login */}
                <button
                    type="button"
                    className="google-login"
                    onClick={() => setError('Google Login is not configured yet.')}
                >
                    <img
                        src="https://cdn-icons-png.flaticon.com/128/2702/2702602.png"
                        alt="Google"
                        className="google-icon-image"
                    />
                    Continue with Google
                </button>

                {/* Signup link */}
                <p className="login-signup-link">
                    Don't have an account?{' '}
                    <Link to="/customer/signup">Sign Up</Link>
                </p>

            </form>

        </AuthLayout>
    );
}

export default CustomerLogin;
