
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
    User,
    Mail,
    Phone,
    Lock,
    Briefcase,
    Eye,
    EyeOff,
    ArrowLeft,
    Camera
} from 'lucide-react';

import AuthLayout from '../../components/AuthLayout';

import logo from '../../assets/logo.png';
import mascot from '../../assets/img2.png';

import './TechnicianSignup.css';

function TechnicianSignup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        experience: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Profile Photo
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    // OTP
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Camera
    const [cameraOpen, setCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const cameraStreamRef = useRef(null);

    // OTP resend countdown
    useEffect(() => {
        if (resendTimer <= 0) return;

        const timer = setTimeout(() => {
            setResendTimer((previous) => previous - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [resendTimer]);

    // Connect camera stream to video element
    useEffect(() => {
        if (cameraOpen && videoRef.current && cameraStreamRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current;

            videoRef.current.play().catch((error) => {
                console.error('Video playback error:', error);
            });
        }
    }, [cameraOpen]);

    // Stop camera when component is removed
    useEffect(() => {
        return () => {
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });

                cameraStreamRef.current = null;
            }
        };
    }, []);

    // Handle input changes
    const handleChange = (e) => {
        setFormData((previous) => ({
            ...previous,
            [e.target.name]: e.target.value
        }));
    };

    // Handle profile photo selection
    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Profile photo must be smaller than 5 MB.');
            return;
        }

        setProfilePhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
        setError('');
    };

    // Open device camera
    const openCamera = async () => {
        try {
            setError('');

            if (!navigator.mediaDevices?.getUserMedia) {
                setError('Camera is not supported in this browser or connection.');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user'
                },
                audio: false
            });

            cameraStreamRef.current = stream;
            setCameraOpen(true);

        } catch (error) {
            console.error('Camera access error:', error);

            setError(
                'Unable to access camera. Please allow camera permission.'
            );
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => {
                track.stop();
            });

            cameraStreamRef.current = null;
        }

        setCameraOpen(false);
    };

    // Capture photo
    const capturePhoto = () => {
        const video = videoRef.current;

        if (!video || !video.videoWidth) {
            setError('Camera is not ready. Please try again.');
            return;
        }

        const canvas = document.createElement('canvas');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob((blob) => {
            if (!blob) {
                setError('Unable to capture photo. Please try again.');
                return;
            }

            if (blob.size > 5 * 1024 * 1024) {
                setError('Captured photo must be smaller than 5 MB.');
                return;
            }

            const photoFile = new File(
                [blob],
                'technician-profile.jpg',
                { type: 'image/jpeg' }
            );

            setProfilePhoto(photoFile);
            setPhotoPreview(URL.createObjectURL(photoFile));
            setError('');

            stopCamera();

        }, 'image/jpeg', 0.9);
    };

    // Request Technician Signup OTP
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setSuccess('');

        // Password validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Terms validation
        if (!agreeToTerms) {
            setError('Please agree to the Terms and Conditions.');
            return;
        }

        // Profile photo validation
        if (!profilePhoto) {
            setError('Please take your profile photo.');
            return;
        }

        // Phone validation
        if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        // Specialization validation
        if (!formData.specialization.trim()) {
            setError('Please enter your specialization.');
            return;
        }

        // Experience validation
        if (
            formData.experience === '' ||
            !Number.isFinite(Number(formData.experience)) ||
            Number(formData.experience) < 0 ||
            Number(formData.experience) > 60
        ) {
            setError('Please enter valid experience.');
            return;
        }

        try {
            setLoading(true);

            const signupData = new FormData();

            signupData.append('name', formData.name.trim());
            signupData.append(
                'email',
                formData.email.trim().toLowerCase()
            );
            signupData.append('phone', formData.phone.trim());
            signupData.append(
                'specialization',
                formData.specialization.trim()
            );
            signupData.append(
                'experience',
                Number(formData.experience)
            );
            signupData.append('password', formData.password);
            signupData.append('profilePhoto', profilePhoto);

            const response = await axios.post(
                'http://localhost:3006/api/users/technician/signup/request-otp',
                signupData
            );

            setOtpSent(true);
            setResendTimer(60);

            setSuccess(
                response.data.message ||
                'Verification OTP sent to your email.'
            );

        } catch (err) {
            console.error('Technician Signup Error:', err);
            console.error('Backend Response:', err.response?.data);

            setError(
                err.response?.data?.message ||
                'Unable to complete registration. Please try again.'
            );

        } finally {
            setLoading(false);
        }
    };

    // Verify Technician Signup OTP
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
                'http://localhost:3006/api/users/technician/signup/verify-otp',
                {
                    email: formData.email.trim().toLowerCase(),
                    otp: otp.trim()
                }
            );

            alert(
                response.data.message ||
                'Technician registered successfully!'
            );

            navigate('/technician/login');

        } catch (err) {
            console.error('OTP Verification Error:', err);

            setError(
                err.response?.data?.message ||
                'OTP verification failed. Please try again.'
            );

        } finally {
            setLoading(false);
        }
    };

    // Resend Technician Signup OTP
    const handleResendOTP = async () => {
        if (resendTimer > 0 || loading) return;

        setError('');
        setSuccess('');

        if (!profilePhoto) {
            setError('Please take your profile photo again.');
            return;
        }

        try {
            setLoading(true);

            const signupData = new FormData();

            signupData.append('name', formData.name.trim());
            signupData.append(
                'email',
                formData.email.trim().toLowerCase()
            );
            signupData.append('phone', formData.phone.trim());
            signupData.append(
                'specialization',
                formData.specialization.trim()
            );
            signupData.append(
                'experience',
                Number(formData.experience)
            );
            signupData.append('password', formData.password);
            signupData.append('profilePhoto', profilePhoto);

            const response = await axios.post(
                'http://localhost:3006/api/users/technician/signup/request-otp',
                signupData
            );

            setOtp('');
            setResendTimer(60);

            setSuccess(
                response.data.message ||
                'A new OTP has been sent to your email.'
            );

        } catch (err) {
            console.error('Resend OTP Error:', err);

            setError(
                err.response?.data?.message ||
                'Unable to resend OTP. Please try again.'
            );

        } finally {
            setLoading(false);
        }
    };

    // Return to technician signup form
    const handleBack = () => {
        setOtpSent(false);
        setOtp('');
        setError('');
        setSuccess('');
    };

    return (
        <AuthLayout logo={logo} illustration={mascot}>

            {/* Heading */}
            <div className="technician-signup-heading">
                <h1>
                    {otpSent
                        ? 'Verify Your Email'
                        : 'Technician Registration'
                    }
                </h1>

                <p>
                    {otpSent
                        ? `Enter the 6-digit OTP sent to ${formData.email}`
                        : 'Join our GasConnect service team'
                    }
                </p>
            </div>

            {!otpSent ? (

                /* Technician Signup Form */
                <form
                    className="technician-signup-form"
                    onSubmit={handleSubmit}
                >

                    {/* Technician Profile Photo */}
                    <div className="technician-signup-photo">
                        <label>
                            Profile Photo <span>*</span>
                        </label>

                        {!photoPreview && !cameraOpen && (
                            <button
                                type="button"
                                className="technician-camera-button"
                                onClick={openCamera}
                            >
                                <Camera size={20} />
                                Take Profile Photo
                            </button>
                        )}

                        {cameraOpen && (
                            <div className="technician-camera-container">

                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="technician-camera-video"
                                />

                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="technician-camera-button"
                                >
                                    <Camera size={20} />
                                    Capture Photo
                                </button>

                                <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="technician-camera-cancel"
                                >
                                    Cancel
                                </button>

                            </div>
                        )}

                        {photoPreview && (
                            <div className="technician-photo-preview">

                                <img
                                    src={photoPreview}
                                    alt="Technician profile preview"
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setProfilePhoto(null);
                                        setPhotoPreview('');
                                        openCamera();
                                    }}
                                    className="technician-camera-button"
                                >
                                    <Camera size={18} />
                                    Retake Photo
                                </button>

                            </div>
                        )}
                    </div>

                    {/* Full Name */}
                    <div className="technician-signup-input">
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
                    <div className="technician-signup-input">
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
                    <div className="technician-signup-input">
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

                    {/* Specialization */}
                    <div className="technician-signup-input">
                        <Briefcase />

                        <input
                            type="text"
                            name="specialization"
                            placeholder="Specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />
                    </div>

                    {/* Experience */}
                    <div className="technician-signup-input">
                        <Briefcase />

                        <input
                            type="number"
                            name="experience"
                            placeholder="Years of Experience"
                            value={formData.experience}
                            onChange={handleChange}
                            min="0"
                            max="60"
                            step="1"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="technician-signup-input">
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
                            className="technician-password-toggle"
                            onClick={() =>
                                setShowPassword(!showPassword)
                            }
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="technician-signup-input">
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
                            className="technician-password-toggle"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label="Toggle confirmation password visibility"
                        >
                            {showConfirmPassword ? <EyeOff /> : <Eye />}
                        </button>
                    </div>

                    {/* Terms */}
                    <label className="technician-signup-terms">
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

                    {/* Error */}
                    {error && (
                        <p
                            className="technician-signup-error"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}

                    {/* Success */}
                    {success && (
                        <p
                            className="technician-signup-success"
                            role="status"
                        >
                            {success}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="technician-signup-submit"
                        disabled={loading}
                    >
                        {loading ? 'Sending OTP...' : 'Continue'}
                    </button>

                    <p className="technician-signup-login">
                        Already registered?{' '}
                        <Link to="/technician/login">
                            Sign In
                        </Link>
                    </p>

                </form>

            ) : (

                /* OTP Verification Form */
                <form
                    className="technician-signup-form"
                    onSubmit={handleVerifyOTP}
                >

                    <div className="technician-signup-input">
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

                    {/* Error */}
                    {error && (
                        <p
                            className="technician-signup-error"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}

                    {/* Success */}
                    {success && (
                        <p
                            className="technician-signup-success"
                            role="status"
                        >
                            {success}
                        </p>
                    )}

                    {/* Verify OTP */}
                    <button
                        type="submit"
                        className="technician-signup-submit"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    {/* Resend OTP */}
                    <p className="technician-signup-login">
                        {resendTimer > 0 ? (
                            `Resend OTP in ${resendTimer} seconds`
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={loading}
                                className="technician-password-toggle"
                            >
                                Resend OTP
                            </button>
                        )}
                    </p>

                    {/* Back to Signup */}
                    <p className="technician-signup-login">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="technician-password-toggle"
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

export default TechnicianSignup;
