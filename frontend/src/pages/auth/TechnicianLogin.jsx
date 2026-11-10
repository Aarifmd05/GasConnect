
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock } from 'lucide-react';

import AuthLayout from '../../components/AuthLayout';
import logo from '../../assets/logo.png';
import mascot from '../../assets/img2.png';

import './TechnicianLogin.css';

function TechnicianLogin() {
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
                'http://localhost:3006/api/users/technician/login',
                { email: email.trim().toLowerCase(), password }
            );

            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('user', JSON.stringify(response.data.user));

            navigate('/technician/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message || 'Login failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout logo={logo} illustration={mascot}>
            <div className="technician-login-heading">
                <h1>Log in to your existing profile</h1>
            </div>

            <form className="technician-login-form" onSubmit={handleSubmit}>
                <button
                    type="button"
                    className="technician-google-button"
                    onClick={() => setError('Google Login is not configured yet.')}
                >
                    <img
                        src="https://cdn-icons-png.flaticon.com/128/2702/2702602.png"
                        alt="Google"
                        className="technician-google-icon"
                    />
                    Continue with Google
                </button>

                <div className="technician-login-divider">
                    <span>or</span>
                </div>

                <div className="technician-login-input">
                    <Mail />
                    <input
                        type="email"
                        placeholder="user@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="technician-login-input">
                    <Lock />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="technician-login-options">
                    <Link to="/technician/forgot-password">
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

                {error && (
                    <p className="technician-login-error">{error}</p>
                )}

                <button
                    type="submit"
                    className="technician-login-submit"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <p className="technician-login-signup">
                    Don't have an account?{' '}
                    <Link to="/technician/signup">Sign Up</Link>
                </p>
            </form>
        </AuthLayout>
    );
}

export default TechnicianLogin;
