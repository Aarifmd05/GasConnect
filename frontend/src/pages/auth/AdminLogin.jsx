
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, LockKeyhole, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import AuthLayout from '../../components/AuthLayout';
import logo from '../../assets/logo.png';
import adminIllustration from '../../assets/img3.png';

import './AdminLogin.css';

function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
                'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout logo={logo} illustration={adminIllustration}>
            <div className="admin-login-heading">
                <div className="admin-login-title">
                    <ShieldCheck size={43} color="#FFD600" />
                    <h1>Admin Portal</h1>
                </div>
                <p>Sign in to manage GasConnect operations</p>
            </div>

            <form className="admin-login-form" onSubmit={handleSubmit}>
                <button
                    type="button"
                    className="admin-google-button"
                    onClick={() => setError('Google Login is not configured yet.')}
                >
                    <img
                        src="https://cdn-icons-png.flaticon.com/128/2702/2702602.png"
                        alt=""
                        className="admin-google-icon"
                    />
                    Continue with Google
                </button>

                <div className="admin-login-divider">
                    <span>or</span>
                </div>

                <div className="admin-login-input">
                    <Mail />
                    <input
                        type="email"
                        placeholder="Admin Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="admin-login-input">
                    <LockKeyhole />

                    <input
                        type={showPassword ? 'text' : 'password'}
                        className="admin-password-field"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="button"
                        className="admin-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <Eye size={23} /> : <EyeOff size={23} />}
                    </button>
                </div>

                <div className="admin-login-options">
                    <Link to="/admin/forgot-password">
                        Forgot password?
                    </Link>
                </div>

                {error && <p className="admin-login-error">{error}</p>}

                <button
                    type="submit"
                    className="admin-login-submit"
                    disabled={loading}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>
        </AuthLayout>
    );
}

export default AdminLogin;
