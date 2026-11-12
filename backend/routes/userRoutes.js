
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import PasswordResetOTP from '../models/PasswordResetOTP.js';
import sendOtpEmail from '../utils/emailService.js';
import upload from '../middleware/upload.js';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==========================================
// COMMON VALIDATION FOR ALL ACCOUNT TYPES
// ==========================================

const validateStrongPassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,128}$/.test(password);
};

const validateRegistration = (name, email, password, phone) => {

    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        typeof phone !== 'string'
    ) {
        return 'All fields must be valid text values';
    }

    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
        return 'All fields are required';
    }

    const cleanName = name.trim();

    // Name: letters, spaces, apostrophes and hyphens
    const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

    if (!nameRegex.test(cleanName)) {
        return 'Name can contain only letters, spaces, hyphens and apostrophes';
    }

    if (cleanName.length < 2 || cleanName.length > 50) {
        return 'Name must contain between 2 and 50 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
        return 'Please enter a valid email address';
    }

    // Strong password validation
    if (!validateStrongPassword(password)) {
        return 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character';
    }

    // Phone validation
    if (!/^\d{10}$/.test(phone.trim())) {
        return 'Phone number must contain exactly 10 digits';
    }

    return null;
};

// ==========================================
// SIGNUP OTP HELPERS
// ==========================================

// Encrypt password before temporarily storing signup details
const encryptPassword = (password) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    const key = crypto
        .createHash('sha256')
        .update(process.env.JWT_SECRET)
        .digest();

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        iv: iv.toString('hex'),
        tag: cipher.getAuthTag().toString('hex'),
        data: encrypted
    };
};

const decryptPassword = (encryptedData) => {
    const key = crypto
        .createHash('sha256')
        .update(process.env.JWT_SECRET)
        .digest();

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};


// ==========================================
// REQUEST SIGNUP OTP
// ==========================================

const requestSignupOTP = async (req, res, role) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            specialization,
            experience
        } = req.body || {};

        // Technician must provide a profile photo
        if (role === 'technician' && !req.file) {
            return res.status(400).json({
                message: 'Technician profile photo is required.'
            });
        }

        const validationError = validateRegistration(
            name,
            email,
            password,
            phone
        );

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

       

        // Additional technician validation
        if (role === 'technician') {
            if (
                typeof specialization !== 'string' ||
                !specialization.trim() ||
                specialization.trim().length > 100
            ) {
                return res.status(400).json({
                    message: 'Please enter a valid specialization'
                });
            }

            if (
                experience === undefined ||
                experience === null ||
                experience === '' ||
                !Number.isFinite(Number(experience)) ||
                Number(experience) < 0
            ) {
                return res.status(400).json({
                    message: 'Please enter valid experience'
                });
            }
        }

        // Check whether this email is already registered
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        const otpQuery = {
            email: normalizedEmail,
            role,
            purpose: 'signup'
        };

        // Enforce 60-second resend cooldown
        const existingOTP = await PasswordResetOTP.findOne(otpQuery);

        if (
            existingOTP &&
            Date.now() - existingOTP.createdAt.getTime() < 60 * 1000
        ) {
            return res.status(429).json({
                message: 'Please wait 60 seconds before requesting another OTP.'
            });
        }

        await PasswordResetOTP.deleteMany(otpQuery);

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        const pendingData = {
            name: name.trim(),
            email: normalizedEmail,
            password: encryptPassword(password),
            phone: phone.trim()
        };

        // Upload technician profile photo to Cloudinary
if (role === 'technician') {
    pendingData.profilePhoto = await uploadToCloudinary(
        req.file.buffer
    );
}

        if (role === 'technician') {
            pendingData.specialization = specialization.trim();
            pendingData.experience = Number(experience);
        }

        const otpRecord = new PasswordResetOTP({
            email: normalizedEmail,
            role,
            purpose: 'signup',
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0,
            pendingData
        });

        await otpRecord.save();

        try {
            await sendOtpEmail(
                normalizedEmail,
                otp,
                'signup',
                role
            );
        } catch (emailError) {
            await PasswordResetOTP.deleteMany(otpQuery);
            throw emailError;
        }

        return res.status(200).json({
            message: 'Verification OTP sent to your email.'
        });

    } catch (error) {
        console.error(`${role} signup OTP error:`, error.message);

        return res.status(500).json({
            message: 'Unable to send verification OTP. Please try again.'
        });
    }
};


// ==========================================
// VERIFY SIGNUP OTP AND CREATE ACCOUNT
// ==========================================

const verifySignupOTP = async (req, res, role) => {
    try {
        const { email, otp } = req.body || {};

        if (
            typeof email !== 'string' ||
            typeof otp !== 'string' ||
            !email.trim() ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                message: 'Please enter a valid email and 6-digit OTP.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const otpQuery = {
            email: normalizedEmail,
            role,
            purpose: 'signup'
        };

        const otpRecord = await PasswordResetOTP.findOne(otpQuery);

        if (!otpRecord) {
            return res.status(400).json({
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        if (otpRecord.expiresAt.getTime() <= Date.now()) {
            await PasswordResetOTP.deleteMany(otpQuery);

            return res.status(400).json({
                message: 'OTP has expired. Please request a new one.'
            });
        }

        if (otpRecord.attempts >= 5) {
            await PasswordResetOTP.deleteMany(otpQuery);

            return res.status(429).json({
                message: 'Too many incorrect attempts. Please request a new OTP.'
            });
        }

        const isOTPValid = await bcrypt.compare(
            otp,
            otpRecord.otpHash
        );

        if (!isOTPValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            return res.status(400).json({
                message: 'Incorrect OTP. Please try again.'
            });
        }

        if (!otpRecord.pendingData) {
            await PasswordResetOTP.deleteMany(otpQuery);

            return res.status(400).json({
                message: 'Signup session is invalid. Please register again.'
            });
        }

        // Make sure the email has not been registered in the meantime
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            await PasswordResetOTP.deleteMany(otpQuery);

            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        const signupData = otpRecord.pendingData;

        if (role === 'technician' && !signupData.profilePhoto) {
    await PasswordResetOTP.deleteMany(otpQuery);

    return res.status(400).json({
        message: 'Technician profile photo is missing. Please register again.'
    });
}

        const newUser = new User({
            name: signupData.name,
            email: signupData.email,
            password: decryptPassword(signupData.password),
            phone: signupData.phone,
            role
        });

        if (role === 'technician') {
            newUser.specialization = signupData.specialization;
            newUser.experience = signupData.experience;
            newUser.approvalStatus = 'pending';
            newUser.profilePhoto = signupData.profilePhoto;
        }

        await newUser.save();

        // OTP cannot be reused after successful verification
        await PasswordResetOTP.deleteMany(otpQuery);

        return res.status(201).json({
            message: role === 'customer'
                ? 'Customer registered successfully!'
                : 'Technician registered successfully! Waiting for admin approval.'
        });

    } catch (error) {
        console.error(`${role} signup verification error:`, error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        return res.status(500).json({
            message: 'Signup verification failed. Please try again.'
        });
    }
};


// ==========================================
// CUSTOMER SIGNUP OTP ROUTES
// ==========================================

router.post('/customer/signup/request-otp', (req, res) => {
    return requestSignupOTP(req, res, 'customer');
});

router.post('/customer/signup/verify-otp', (req, res) => {
    return verifySignupOTP(req, res, 'customer');
});


// ==========================================
// TECHNICIAN SIGNUP OTP ROUTES
// ==========================================

router.post(
    '/technician/signup/request-otp',
    upload.single('profilePhoto'),
    (req, res) => {
        return requestSignupOTP(req, res, 'technician');
    }
);

router.post('/technician/signup/verify-otp', (req, res) => {
    return verifySignupOTP(req, res, 'technician');
});

// Admin - View All Customers
router.get('/admin/customers', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        const customers = await User.find({
            role: 'customer'
        }).select('-password');

        res.status(200).json({
            message: 'Customers fetched successfully!',
            customers
        });
    } catch (error) {
        console.error('Fetch customers error:', error.message);

        res.status(500).json({
            message: 'Failed to fetch customers'
        });
    }
});

// Admin - View All Technicians
router.get('/admin/technicians', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        const technicians = await User.find({
            role: 'technician'
        }).select('-password');

        res.status(200).json({
            message: 'Technicians fetched successfully!',
            technicians
        });
    } catch (error) {
        console.error('Fetch technicians error:', error.message);

        res.status(500).json({
            message: 'Failed to fetch technicians'
        });
    }
});

// Admin - Approve or Reject Technician
router.put('/admin/technicians/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid technician ID' });
        }

        const { approvalStatus } = req.body;

        if (!['approved', 'rejected'].includes(approvalStatus)) {
            return res.status(400).json({
                message: 'Status must be approved or rejected'
            });
        }

        const technician = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                role: 'technician'
            },
            { approvalStatus },
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        if (!technician) {
            return res.status(404).json({ message: 'Technician not found' });
        }

        res.status(200).json({
            message: `Technician ${approvalStatus} successfully!`,
            technician
        });
    } catch (error) {
        console.error('Technician status update error:', error.message);

        res.status(500).json({
            message: 'Failed to update technician status'
        });
    }
});


// Admin - Delete Technician
router.delete('/admin/technicians/:id', authMiddleware, async (req, res) => {
    try {
        // Only admins can delete technicians
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        const technicianId = req.params.id;

        // Validate technician ID
        if (!mongoose.isValidObjectId(technicianId)) {
            return res.status(400).json({
                message: 'Invalid technician ID'
            });
        }

        // Find the technician
        const technician = await User.findOne({
            _id: technicianId,
            role: 'technician'
        });

        if (!technician) {
            return res.status(404).json({
                message: 'Technician not found'
            });
        }

        // Unassign technician from existing bookings.
        // Preserve booking records and reset active assignments to pending.
        await Booking.updateMany(
            {
                technician: technicianId,
                status: {
                    $in: ['pending', 'assigned', 'accepted', 'in-progress']
                }
            },
            {
                $set: {
                    technician: null,
                    status: 'pending'
                }
            }
        );

        // Delete technician's Cloudinary profile photo
        if (technician.profilePhoto) {
            try {
                const imageUrl = new URL(technician.profilePhoto);
                const uploadMarker = '/upload/';
                const uploadIndex = imageUrl.pathname.indexOf(uploadMarker);

                if (uploadIndex !== -1) {
                    let publicId = imageUrl.pathname
                        .slice(uploadIndex + uploadMarker.length);

                    const parts = publicId.split('/');

                    // Remove Cloudinary version segment
                    if (/^v\d+$/.test(parts[0])) {
                        parts.shift();
                    }

                    // Remove image extension
                    const lastPart = parts.pop();
                    parts.push(lastPart.replace(/\.[^.]+$/, ''));

                    publicId = parts.join('/');

                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (cloudinaryError) {
                console.error(
                    'Cloudinary photo deletion error:',
                    cloudinaryError.message
                );
            }
        }

        // Delete technician account and credentials
        await technician.deleteOne();

        return res.status(200).json({
            message: 'Technician account deleted successfully!'
        });

    } catch (error) {
        console.error('Delete technician error:', error.message);

        return res.status(500).json({
            message: 'Failed to delete technician'
        });
    }
});

// Admin - Forgot Password: Generate and Send OTP
router.post('/admin/forgot-password', async (req, res) => {
    try {
        const { email } = req.body || {};

        // Validate email
        if (typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({
                message: 'Please enter your admin email'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Only the authorized GasConnect admin can reset an admin password
if (normalizedEmail !== 'gasconnect4@gmail.com') {
    return res.status(403).json({
        message: 'This email is not authorized for admin password recovery.'
    });
}

        // Find admin account
        const admin = await User.findOne({
            email: normalizedEmail,
            role: 'admin'
        });

        if (!admin) {
            return res.status(200).json({
                message: 'If this admin email is registered, an OTP will be sent.'
            });
        }

        // Admin-specific OTP query
        const adminOTPQuery = {
            email: normalizedEmail,
            role: 'admin',
            purpose: 'password-reset'
        };

        // Check existing OTP
        const existingOTP = await PasswordResetOTP.findOne(adminOTPQuery);

        // Prevent requesting OTP repeatedly within 60 seconds
        if (
            existingOTP &&
            Date.now() - existingOTP.createdAt.getTime() < 60 * 1000
        ) {
            return res.status(429).json({
                message: 'Please wait 60 seconds before requesting another OTP.'
            });
        }

        // Delete only the previous admin password-reset OTP
        await PasswordResetOTP.deleteMany(adminOTPQuery);

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Hash OTP before storing it
        const otpHash = await bcrypt.hash(otp, 10);

        // Save OTP record
        const otpRecord = new PasswordResetOTP({
            email: normalizedEmail,
            role: 'admin',
            purpose: 'password-reset',
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0
        });

        await otpRecord.save();

        // Send OTP to admin email
        try {
            await sendOtpEmail(normalizedEmail, otp);
        } catch (emailError) {
            await PasswordResetOTP.deleteMany(adminOTPQuery);
            throw emailError;
        }

        return res.status(200).json({
            message: 'OTP sent successfully to your registered admin email.'
        });

    } catch (error) {
        console.error('Admin forgot password error:', error.message);

        return res.status(500).json({
            message: 'Unable to send OTP. Please try again later.'
        });
    }
});


// Admin - Verify Password Reset OTP
router.post('/admin/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body || {};

        // Validate email and OTP
        if (
            typeof email !== 'string' ||
            typeof otp !== 'string' ||
            !email.trim() ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                message: 'Please enter a valid email and 6-digit OTP.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Allow only the authorized GasConnect admin
        if (normalizedEmail !== 'gasconnect4@gmail.com') {
            return res.status(403).json({
                message: 'This email is not authorized for admin password recovery.'
            });
        }

        // Find the existing admin account
        const admin = await User.findOne({
            email: normalizedEmail,
            role: 'admin'
        });

        if (!admin) {
            return res.status(404).json({
                message: 'Admin account not found.'
            });
        }

        // Admin-specific OTP query
        const adminOTPQuery = {
            email: normalizedEmail,
            role: 'admin',
            purpose: 'password-reset'
        };

        // Find only the admin password-reset OTP
        const otpRecord = await PasswordResetOTP.findOne(adminOTPQuery);

        if (!otpRecord) {
            return res.status(400).json({
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        // Check OTP expiry
        if (otpRecord.expiresAt.getTime() <= Date.now()) {
            await PasswordResetOTP.deleteMany(adminOTPQuery);

            return res.status(400).json({
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Check maximum attempts
        if (otpRecord.attempts >= 5) {
            await PasswordResetOTP.deleteMany(adminOTPQuery);

            return res.status(429).json({
                message: 'Too many incorrect attempts. Please request a new OTP.'
            });
        }

        // Compare entered OTP with stored hash
        const isOTPValid = await bcrypt.compare(
            otp,
            otpRecord.otpHash
        );

        if (!isOTPValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            return res.status(400).json({
                message: 'Incorrect OTP. Please try again.'
            });
        }

        // Check JWT configuration
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Server authentication configuration error.'
            });
        }

        // Generate password-reset token
        const resetToken = jwt.sign(
            {
                id: admin._id.toString(),
                email: normalizedEmail,
                role: 'admin',
                purpose: 'admin-password-reset'
            },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        // Delete only the verified admin OTP
        await PasswordResetOTP.deleteMany(adminOTPQuery);

        return res.status(200).json({
            message: 'OTP verified successfully.',
            resetToken
        });

    } catch (error) {
        console.error('Admin OTP verification error:', error.message);

        return res.status(500).json({
            message: 'OTP verification failed. Please try again.'
        });
    }
});



// Admin - Reset Password
router.post('/admin/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body || {};

        // Validate reset token
        if (
            typeof resetToken !== 'string' ||
            !resetToken.trim()
        ) {
            return res.status(400).json({
                message: 'A valid reset token is required.'
            });
        }

        // Validate strong password
        if (
            typeof newPassword !== 'string' ||
            !validateStrongPassword(newPassword)
        ) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.'
            });
        }

        // Check JWT configuration
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Server authentication configuration error.'
            });
        }

        // Verify reset token
        let decoded;

        try {
            decoded = jwt.verify(
                resetToken,
                process.env.JWT_SECRET
            );
        } catch {
            return res.status(401).json({
                message: 'Password reset session expired or invalid. Please start again.'
            });
        }

        // Verify token purpose and account details
        if (
            decoded.purpose !== 'admin-password-reset' ||
            decoded.role !== 'admin' ||
            !decoded.id ||
            !decoded.email ||
            decoded.email.toLowerCase() !== 'gasconnect4@gmail.com'
        ) {
            return res.status(401).json({
                message: 'Invalid password reset session.'
            });
        }

        // Find only the authorized admin account
        const admin = await User.findOne({
            _id: decoded.id,
            email: 'gasconnect4@gmail.com',
            role: 'admin'
        });

        if (!admin) {
            return res.status(404).json({
                message: 'Admin account not found.'
            });
        }

        // Prevent reusing the existing password
        if (admin.password) {
            const isSamePassword = await bcrypt.compare(
                newPassword,
                admin.password
            );

            if (isSamePassword) {
                return res.status(400).json({
                    message: 'New password must be different from your current password.'
                });
            }
        }

        // Update password
        admin.password = newPassword;
        await admin.save();

        return res.status(200).json({
            message: 'Admin password reset successfully. You can now log in.'
        });

    } catch (error) {
        console.error('Admin password reset error:', error.message);

        return res.status(500).json({
            message: 'Unable to reset password. Please try again.'
        });
    }
});

// =============================================
// TECHNICIAN - FORGOT PASSWORD: SEND OTP
// =============================================

// Technician - Forgot Password: Generate and Send OTP
router.post('/technician/forgot-password', async (req, res) => {
    try {
        const { email } = req.body || {};

        // Validate email
        if (typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({
                message: 'Please enter your technician email.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find technician account
        const technician = await User.findOne({
            email: normalizedEmail,
            role: 'technician'
        });

        if (!technician) {
            return res.status(200).json({
                message: 'If this technician email is registered, an OTP will be sent.'
            });
        }

        // Technician-specific OTP query
        const technicianOTPQuery = {
            email: normalizedEmail,
            role: 'technician',
            purpose: 'password-reset'
        };

        // Check existing OTP
        const existingOTP = await PasswordResetOTP.findOne(technicianOTPQuery);

        // Prevent repeated OTP requests within 60 seconds
        if (
            existingOTP &&
            Date.now() - existingOTP.createdAt.getTime() < 60 * 1000
        ) {
            return res.status(429).json({
                message: 'Please wait 60 seconds before requesting another OTP.'
            });
        }

        // Delete only the previous technician password-reset OTP
        await PasswordResetOTP.deleteMany(technicianOTPQuery);

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Hash OTP before storing
        const otpHash = await bcrypt.hash(otp, 10);

        // Save OTP record
        const otpRecord = new PasswordResetOTP({
            email: normalizedEmail,
            role: 'technician',
            purpose: 'password-reset',
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0
        });

        await otpRecord.save();

        // Send OTP to technician email
        try {
            await sendOtpEmail(normalizedEmail, otp);
        } catch (emailError) {
            await PasswordResetOTP.deleteMany(technicianOTPQuery);
            throw emailError;
        }

        return res.status(200).json({
            message: 'OTP sent successfully to your registered technician email.'
        });

    } catch (error) {
        console.error('Technician forgot password error:', error.message);

        return res.status(500).json({
            message: 'Unable to send OTP. Please try again later.'
        });
    }
});


// =============================================
// TECHNICIAN - VERIFY RESET OTP
// =============================================

// Technician - Verify Password Reset OTP
router.post('/technician/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body || {};

        // Validate email and OTP
        if (
            typeof email !== 'string' ||
            typeof otp !== 'string' ||
            !email.trim() ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                message: 'Please enter a valid email and 6-digit OTP.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Technician-specific OTP query
        const technicianOTPQuery = {
            email: normalizedEmail,
            role: 'technician',
            purpose: 'password-reset'
        };

        // Find technician OTP
        const otpRecord = await PasswordResetOTP.findOne(technicianOTPQuery);

        if (!otpRecord) {
            return res.status(400).json({
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        // Check expiry
        if (otpRecord.expiresAt.getTime() <= Date.now()) {
            await PasswordResetOTP.deleteMany(technicianOTPQuery);

            return res.status(400).json({
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Check maximum attempts
        if (otpRecord.attempts >= 5) {
            await PasswordResetOTP.deleteMany(technicianOTPQuery);

            return res.status(429).json({
                message: 'Too many incorrect attempts. Please request a new OTP.'
            });
        }

        // Compare OTP with stored hash
        const isOTPValid = await bcrypt.compare(otp, otpRecord.otpHash);

        if (!isOTPValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            return res.status(400).json({
                message: 'Incorrect OTP. Please try again.'
            });
        }

        // Verify technician account
        const technician = await User.findOne({
            email: normalizedEmail,
            role: 'technician'
        });

        if (!technician) {
            await PasswordResetOTP.deleteMany(technicianOTPQuery);

            return res.status(400).json({
                message: 'Unable to verify technician account.'
            });
        }

        // Check JWT configuration
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Server authentication configuration error.'
            });
        }

        // Generate password-reset token
        const resetToken = jwt.sign(
            {
                id: technician._id.toString(),
                email: technician.email,
                purpose: 'technician-password-reset'
            },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        // Delete only the verified technician OTP
        await PasswordResetOTP.deleteMany(technicianOTPQuery);

        return res.status(200).json({
            message: 'OTP verified successfully.',
            resetToken
        });

    } catch (error) {
        console.error('Technician OTP verification error:', error.message);

        return res.status(500).json({
            message: 'OTP verification failed. Please try again.'
        });
    }
});


// =============================================
// TECHNICIAN - RESET PASSWORD
// =============================================

// Technician - Reset Password
router.post('/technician/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body || {};

        // Validate reset token
        if (typeof resetToken !== 'string' || !resetToken.trim()) {
            return res.status(400).json({
                message: 'A valid reset token is required.'
            });
        }

        // Validate strong password
        if (
            typeof newPassword !== 'string' ||
            !validateStrongPassword(newPassword)
        ) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.'
            });
        }

        // Check JWT configuration
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Server authentication configuration error.'
            });
        }

        // Verify reset token
        let decoded;

        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({
                message: 'Password reset session expired or invalid. Please start again.'
            });
        }

        // Verify token purpose and account details
        if (
            decoded.purpose !== 'technician-password-reset' ||
            !decoded.id ||
            !decoded.email
        ) {
            return res.status(401).json({
                message: 'Invalid password reset session.'
            });
        }

        // Find technician account
        const technician = await User.findOne({
            _id: decoded.id,
            email: decoded.email,
            role: 'technician'
        });

        if (!technician) {
            return res.status(404).json({
                message: 'Technician account not found.'
            });
        }

        // Update password
        technician.password = newPassword;
        await technician.save();

        return res.status(200).json({
            message: 'Technician password reset successfully. You can now log in.'
        });

    } catch (error) {
        console.error('Technician password reset error:', error.message);

        return res.status(500).json({
            message: 'Unable to reset password. Please try again.'
        });
    }
});


// =============================================
// CUSTOMER - FORGOT PASSWORD: SEND OTP
// =============================================

router.post('/customer/forgot-password', async (req, res) => {
    try {
        const { email } = req.body || {};

        if (typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({
                message: 'Please enter your customer email.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const customer = await User.findOne({
            email: normalizedEmail,
            role: 'customer'
        });

        if (!customer) {
            return res.status(200).json({
                message: 'If this customer email is registered, an OTP will be sent.'
            });
        }

        const customerOTPQuery = {
            email: normalizedEmail,
            role: 'customer',
            purpose: 'password-reset'
        };

        const existingOTP = await PasswordResetOTP.findOne(customerOTPQuery);

        // 60-second resend cooldown
        if (
            existingOTP &&
            Date.now() - existingOTP.createdAt.getTime() < 60 * 1000
        ) {
            return res.status(429).json({
                message: 'Please wait 60 seconds before requesting another OTP.'
            });
        }

        await PasswordResetOTP.deleteMany(customerOTPQuery);

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        const otpRecord = new PasswordResetOTP({
            email: normalizedEmail,
            role: 'customer',
            purpose: 'password-reset',
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0
        });

        await otpRecord.save();

        try {
            await sendOtpEmail(normalizedEmail, otp);
        } catch (emailError) {
            await PasswordResetOTP.deleteMany(customerOTPQuery);
            throw emailError;
        }

        return res.status(200).json({
            message: 'OTP sent successfully to your registered customer email.'
        });

    } catch (error) {
        console.error('Customer forgot password error:', error.message);

        return res.status(500).json({
            message: 'Unable to send OTP. Please try again later.'
        });
    }
});


// =============================================
// CUSTOMER - VERIFY RESET OTP
// =============================================

router.post('/customer/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body || {};

        if (
            typeof email !== 'string' ||
            typeof otp !== 'string' ||
            !email.trim() ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                message: 'Please enter a valid email and 6-digit OTP.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const customerOTPQuery = {
            email: normalizedEmail,
            role: 'customer',
            purpose: 'password-reset'
        };

        const otpRecord = await PasswordResetOTP.findOne(customerOTPQuery);

        if (!otpRecord) {
            return res.status(400).json({
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        // Check OTP expiry
        if (otpRecord.expiresAt.getTime() <= Date.now()) {
            await PasswordResetOTP.deleteMany(customerOTPQuery);

            return res.status(400).json({
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Maximum 5 attempts
        if (otpRecord.attempts >= 5) {
            await PasswordResetOTP.deleteMany(customerOTPQuery);

            return res.status(429).json({
                message: 'Too many incorrect attempts. Please request a new OTP.'
            });
        }

        const isOTPValid = await bcrypt.compare(otp, otpRecord.otpHash);

        if (!isOTPValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            return res.status(400).json({
                message: 'Incorrect OTP. Please try again.'
            });
        }

        const customer = await User.findOne({
            email: normalizedEmail,
            role: 'customer'
        });

        if (!customer) {
            await PasswordResetOTP.deleteMany(customerOTPQuery);

            return res.status(400).json({
                message: 'Unable to verify customer account.'
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Server authentication configuration error.'
            });
        }

        const resetToken = jwt.sign(
            {
                id: customer._id.toString(),
                email: customer.email,
                purpose: 'customer-password-reset'
            },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        // Delete verified OTP so it cannot be reused
        await PasswordResetOTP.deleteMany(customerOTPQuery);

        return res.status(200).json({
            message: 'OTP verified successfully.',
            resetToken
        });

    } catch (error) {
        console.error('Customer OTP verification error:', error.message);

        return res.status(500).json({
            message: 'OTP verification failed. Please try again.'
        });
    }
});


// =============================================
// CUSTOMER - RESET PASSWORD
// =============================================

router.post('/customer/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body || {};

        if (typeof resetToken !== 'string' || !resetToken.trim()) {
            return res.status(400).json({
                message: 'A valid reset token is required.'
            });
        }

        // Validate strong password
        if (
            typeof newPassword !== 'string' ||
            !validateStrongPassword(newPassword)
        ) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.'
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Server authentication configuration error.'
            });
        }

        let decoded;

        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({
                message: 'Password reset session expired or invalid. Please start again.'
            });
        }

        // Verify token purpose
        if (
            decoded.purpose !== 'customer-password-reset' ||
            !decoded.id ||
            !decoded.email
        ) {
            return res.status(401).json({
                message: 'Invalid password reset session.'
            });
        }

        const customer = await User.findOne({
            _id: decoded.id,
            email: decoded.email,
            role: 'customer'
        });

        if (!customer) {
            return res.status(404).json({
                message: 'Customer account not found.'
            });
        }

        customer.password = newPassword;
        await customer.save();

        return res.status(200).json({
            message: 'Customer password reset successfully. You can now log in.'
        });

    } catch (error) {
        console.error('Customer password reset error:', error.message);

        return res.status(500).json({
            message: 'Unable to reset password. Please try again.'
        });
    }
});


// Common Login Function for All Three Roles
const loginUser = async (req, res, role) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Restrict admin email/password login to the authorized admin
if (
    role === 'admin' &&
    normalizedEmail !== 'gasconnect4@gmail.com'
) {
    return res.status(403).json({
        message: 'This email is not authorized for admin login.'
    });
}

        const user = await User.findOne({
            email: normalizedEmail,
            role
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        if (!user.password) {
    return res.status(401).json({
        message: 'Invalid email or password'
    });
}

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        if (role === 'technician' && user.approvalStatus !== 'approved') {
            return res.status(403).json({
                message: 'Your technician account is not approved yet'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is missing');

            return res.status(500).json({
                message: 'Server authentication configuration error'
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);

        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin Email and Password Login API
router.post('/admin/login', (req, res) => {
    loginUser(req, res, 'admin');
});

// Customer Login API
router.post('/customer/login', (req, res) => {
    loginUser(req, res, 'customer');
});


// Google Admin Login API
router.post('/admin/google-login', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                message: 'Google credential is required.'
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Authentication configuration is missing.'
            });
        }

        // Verify Google ID token on the backend
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email || !payload.sub) {
            return res.status(401).json({
                message: 'Invalid Google account information.'
            });
        }

        const googleEmail = payload.email.trim().toLowerCase();

        // Only the authorized admin email is allowed
        if (
            googleEmail !== 'gasconnect4@gmail.com' ||
            payload.email_verified !== true
        ) {
            return res.status(403).json({
                message: 'Access denied. This Google account is not authorized as an admin.'
            });
        }

        // Find the existing admin account
        const admin = await User.findOne({
            email: 'gasconnect4@gmail.com',
            role: 'admin'
        });

        if (!admin) {
            return res.status(404).json({
                message: 'Authorized admin account was not found.'
            });
        }

        // Prevent another Google account from taking over the admin account
        if (admin.googleId && admin.googleId !== payload.sub) {
            return res.status(403).json({
                message: 'This admin account is already linked to another Google account.'
            });
        }

        // Link the verified Google identity to the existing admin
        admin.googleId = payload.sub;
        admin.authProvider = 'google';
        admin.emailVerified = true;

        await admin.save();

        // Generate GasConnect JWT
        const token = jwt.sign(
            {
                id: admin._id.toString(),
                role: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: 'Google admin login successful.',
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Google admin login error:', error.message);

        return res.status(401).json({
            message: 'Google authentication failed. Please try again.'
        });
    }
});


// Technician Login API
router.post('/technician/login', (req, res) => {
    loginUser(req, res, 'technician');
});

// Customer Profile API
router.get('/customer/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Access denied. Customers only.'
            });
        }

        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json({
            message: 'Profile fetched successfully!',
            user
        });
    } catch (error) {
        console.error('Customer profile error:', error.message);

        res.status(500).json({
            message: 'Failed to fetch profile'
        });
    }
});


// Google Customer Login API
router.post('/customer/google-login', async (req, res) => {
    try {
        const { credential, phone } = req.body;

        if (!credential) {
            return res.status(400).json({
                message: 'Google credential is required.'
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Authentication configuration is missing.'
            });
        }

        // Verify Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.email ||
            !payload.sub ||
            payload.email_verified !== true
        ) {
            return res.status(401).json({
                message: 'Invalid or unverified Google account.'
            });
        }

        const googleEmail = payload.email.trim().toLowerCase();

        // Admin cannot use customer login
        if (googleEmail === 'gasconnect4@gmail.com') {
            return res.status(403).json({
                message: 'Please use Admin Login.'
            });
        }

        // Check whether account already exists
        let customer = await User.findOne({ email: googleEmail });

        if (customer) {
            // Prevent login using another role
            if (customer.role !== 'customer') {
                return res.status(403).json({
                    message: 'This email is registered with another account type.'
                });
            }

            // Prevent Google account takeover
            if (
                customer.googleId &&
                customer.googleId !== payload.sub
            ) {
                return res.status(403).json({
                    message: 'This account is linked to another Google account.'
                });
            }

            customer.googleId = payload.sub;
            customer.emailVerified = true;

            await customer.save();

        } else {
            // New customer must provide phone number
            if (!phone || !/^[0-9]{10}$/.test(phone)) {
                return res.status(400).json({
                    code: 'PHONE_REQUIRED',
                    message: 'Please provide a valid 10-digit phone number.'
                });
            }

            customer = new User({
                name: payload.name || 'Customer',
                email: googleEmail,
                phone,
                role: 'customer',
                authProvider: 'google',
                googleId: payload.sub,
                emailVerified: true
            });

            await customer.save();
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: customer._id.toString(),
                role: 'customer'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: 'Google customer login successful.',
            token,
            user: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                role: customer.role
            }
        });

    } catch (error) {
        console.error('Google customer login error:', error.message);

        return res.status(401).json({
            message: 'Google authentication failed. Please try again.'
        });
    }
});

// Google Technician Login API
router.post('/technician/google-login', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                message: 'Google credential is required.'
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Authentication configuration is missing.'
            });
        }

        // Verify Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.email ||
            !payload.sub ||
            payload.email_verified !== true
        ) {
            return res.status(401).json({
                message: 'Invalid or unverified Google account.'
            });
        }

        const googleEmail = payload.email.trim().toLowerCase();

        // Prevent Admin from using Technician Login
        if (googleEmail === 'gasconnect4@gmail.com') {
            return res.status(403).json({
                message: 'Please use Admin Login.'
            });
        }

        // Find existing technician account
        const technician = await User.findOne({
            email: googleEmail
        });

        if (!technician) {
            return res.status(404).json({
                code: 'TECHNICIAN_NOT_REGISTERED',
                message: 'Technician account not found. Please register first.'
            });
        }

        // Check account role
        if (technician.role !== 'technician') {
            return res.status(403).json({
                message: 'This email is registered with another account type.'
            });
        }

        // Prevent Google account takeover
        if (
            technician.googleId &&
            technician.googleId !== payload.sub
        ) {
            return res.status(403).json({
                message: 'This account is linked to another Google account.'
            });
        }

        // Check Admin approval
        if (technician.approvalStatus === 'pending') {
            return res.status(403).json({
                message: 'Your account is waiting for Admin approval.'
            });
        }

        if (technician.approvalStatus === 'rejected') {
            return res.status(403).json({
                message: 'Your technician registration has been rejected. Please contact Admin.'
            });
        }

        if (technician.approvalStatus !== 'approved') {
            return res.status(403).json({
                message: 'Your technician account is not approved.'
            });
        }

        // Link Google account
        technician.googleId = payload.sub;
        technician.authProvider = 'google';
        technician.emailVerified = true;

        await technician.save();

        // Generate JWT
        const token = jwt.sign(
            {
                id: technician._id.toString(),
                role: 'technician'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: 'Google technician login successful.',
            token,
            user: {
                id: technician._id,
                name: technician.name,
                email: technician.email,
                phone: technician.phone,
                role: technician.role,
                approvalStatus: technician.approvalStatus
            }
        });

    } catch (error) {
        console.error('Google technician login error:', error.message);

        return res.status(401).json({
            message: 'Google authentication failed. Please try again.'
        });
    }
});

// Google Technician Signup API
router.post(
    '/technician/google-signup',
    upload.single('profilePhoto'),
    async (req, res) => {
        try {
            const {
                credential,
                phone,
                specialization,
                experience
            } = req.body || {};

            // Validate required fields
            if (!credential) {
                return res.status(400).json({
                    message: 'Google credential is required.'
                });
            }

            if (!process.env.GOOGLE_CLIENT_ID) {
                return res.status(500).json({
                    message: 'Google authentication is not configured.'
                });
            }

            if (!/^[0-9]{10}$/.test(phone || '')) {
                return res.status(400).json({
                    message: 'Please enter a valid 10-digit phone number.'
                });
            }

            if (
                typeof specialization !== 'string' ||
                !specialization.trim() ||
                specialization.trim().length > 100
            ) {
                return res.status(400).json({
                    message: 'Please enter a valid specialization.'
                });
            }

            if (
                experience === undefined ||
                experience === '' ||
                !Number.isFinite(Number(experience)) ||
                Number(experience) < 0 ||
                Number(experience) > 60
            ) {
                return res.status(400).json({
                    message: 'Please enter valid experience.'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message: 'Technician profile photo is required.'
                });
            }

            // Verify Google ID token on backend
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();

            if (
                !payload ||
                !payload.email ||
                !payload.sub ||
                payload.email_verified !== true
            ) {
                return res.status(401).json({
                    message: 'Invalid or unverified Google account.'
                });
            }

            const googleEmail = payload.email.trim().toLowerCase();

            // Prevent Admin registration as Technician
            if (googleEmail === 'gasconnect4@gmail.com') {
                return res.status(403).json({
                    message: 'Admin account cannot register as Technician.'
                });
            }

            // Check duplicate email across all roles
            const existingUser = await User.findOne({
                email: googleEmail
            });

            if (existingUser) {
                return res.status(409).json({
                    message: 'This email is already registered. Please use the correct login page.'
                });
            }

            // Upload profile photo to Cloudinary
            const profilePhoto = await uploadToCloudinary(
                req.file.buffer
            );

            if (!profilePhoto) {
                return res.status(500).json({
                    message: 'Unable to upload technician profile photo.'
                });
            }

            // Create technician account
            const technician = new User({
                name: payload.name || 'Technician',
                email: googleEmail,
                phone: phone.trim(),
                specialization: specialization.trim(),
                experience: Number(experience),
                profilePhoto,
                role: 'technician',
                authProvider: 'google',
                googleId: payload.sub,
                emailVerified: true,
                approvalStatus: 'pending'
            });

            await technician.save();

            return res.status(201).json({
                message: 'Technician registration successful! Waiting for Admin approval.',
                user: {
                    id: technician._id,
                    name: technician.name,
                    email: technician.email,
                    phone: technician.phone,
                    role: technician.role,
                    approvalStatus: technician.approvalStatus
                }
            });

        } catch (error) {
            console.error(
                'Google technician signup error:',
                error.message
            );

            if (error.code === 11000) {
                return res.status(409).json({
                    message: 'This email or Google account is already registered.'
                });
            }

            return res.status(500).json({
                message: 'Technician Google registration failed. Please try again.'
            });
        }
    }
);


// Customer Profile Update API
router.put('/customer/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Access denied. Customers only.'
            });
        }

        const { name, email, phone } = req.body || {};

        const user = await User.findOne({
            _id: req.user.id,
            role: 'customer'
        });

        if (!user) {
            return res.status(404).json({
                message: 'Customer account not found.'
            });
        }

        // Registered email cannot be changed
        if (
            typeof email !== 'string' ||
            email.trim().toLowerCase() !== user.email.toLowerCase()
        ) {
            return res.status(403).json({
                message: 'Your registered email address cannot be changed.'
            });
        }

        // Validate name
        if (
            typeof name !== 'string' ||
            name.trim().length < 2 ||
            name.trim().length > 50
        ) {
            return res.status(400).json({
                message: 'Name must be between 2 and 50 characters.'
            });
        }

        // Phone number is editable but must contain exactly 10 digits
        const cleanPhone = typeof phone === 'string' ? phone.trim() : '';

        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({
                message: 'Phone number must be exactly 10 digits.'
            });
        }

        // Update permitted fields
        user.name = name.trim();
        user.phone = cleanPhone;

        await user.save();

        return res.status(200).json({
            message: 'Customer profile updated successfully!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Customer profile update error:', error);

        return res.status(500).json({
            message: 'Unable to update customer profile.'
        });
    }
});

// Technician Profile Update API
router.put('/technician/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'technician') {
            return res.status(403).json({
                message: 'Access denied. Technicians only.'
            });
        }

        const technician = await User.findOne({
            _id: req.user.id,
            role: 'technician'
        });

        if (!technician) {
            return res.status(404).json({
                message: 'Technician account not found.'
            });
        }

        const {
            name,
            firstName,
            lastName,
            email,
            phone,
            alternativeEmail,
            alternativePhone,
            dateOfBirth,
            gender,
            specialization,
            experience,
            profilePhoto
        } = req.body || {};

        // Registered email cannot be changed
        if (
            email !== undefined &&
            (
                typeof email !== 'string' ||
                email.trim().toLowerCase() !== technician.email.toLowerCase()
            )
        ) {
            return res.status(403).json({
                message: 'Your registered email address cannot be changed.'
            });
        }

        // Validate and update name
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length < 2) {
                return res.status(400).json({
                    message: 'Please enter a valid name.'
                });
            }
            technician.name = name.trim();
        }

        // First and last name
        if (firstName !== undefined) {
            technician.firstName = String(firstName).trim();
        }

        if (lastName !== undefined) {
            technician.lastName = String(lastName).trim();
        }

        // Phone number is editable
        if (phone !== undefined) {
            const cleanPhone = String(phone).trim();

            if (!/^\d{10}$/.test(cleanPhone)) {
  return res.status(400).json({
    message: 'Phone number must be exactly 10 digits'
  });
}

user.phone = cleanPhone;
        }

        // Alternative email
        if (alternativeEmail !== undefined) {
            const cleanEmail = String(alternativeEmail).trim().toLowerCase();

            if (
                cleanEmail &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
            ) {
                return res.status(400).json({
                    message: 'Please enter a valid alternative email.'
                });
            }

            technician.alternativeEmail = cleanEmail;
        }

        // Alternative phone
        if (alternativePhone !== undefined) {
            const cleanPhone = String(alternativePhone).trim();

            if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
                return res.status(400).json({
                    message: 'Alternative phone must contain exactly 10 digits.'
                });
            }

            technician.alternativePhone = cleanPhone;
        }

        // Date of birth
        if (dateOfBirth !== undefined) {
            if (dateOfBirth === null || dateOfBirth === '') {
                technician.dateOfBirth = null;
            } else {
                const parsedDate = new Date(dateOfBirth);

                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({
                        message: 'Please enter a valid date of birth.'
                    });
                }

                technician.dateOfBirth = parsedDate;
            }
        }

        // Gender
        if (gender !== undefined) {
            const allowedGenders = [
                'Male',
                'Female',
                'Other',
                'Prefer not to say'
            ];

            if (!allowedGenders.includes(gender)) {
                return res.status(400).json({
                    message: 'Please select a valid gender.'
                });
            }

            technician.gender = gender;
        }

        // Specialization
        if (specialization !== undefined) {
            if (
                typeof specialization !== 'string' ||
                specialization.trim().length > 100
            ) {
                return res.status(400).json({
                    message: 'Specialization must not exceed 100 characters.'
                });
            }

            technician.specialization = specialization.trim();
        }

        // Experience
        if (experience !== undefined) {
            const cleanExperience = Number(experience);

            if (
                experience === '' ||
                experience === null ||
                !Number.isFinite(cleanExperience) ||
                cleanExperience < 0 ||
                cleanExperience > 60
            ) {
                return res.status(400).json({
                    message: 'Experience must be between 0 and 60 years.'
                });
            }

            technician.experience = cleanExperience;
        }

        // Profile photo
        if (profilePhoto !== undefined) {
            if (typeof profilePhoto !== 'string') {
                return res.status(400).json({
                    message: 'Invalid profile photo.'
                });
            }

            technician.profilePhoto = profilePhoto.trim();
        }

        await technician.save();

        return res.status(200).json({
            message: 'Technician profile updated successfully!',
            technician: {
                id: technician._id,
                name: technician.name,
                firstName: technician.firstName,
                lastName: technician.lastName,
                email: technician.email,
                phone: technician.phone,
                alternativeEmail: technician.alternativeEmail,
                alternativePhone: technician.alternativePhone,
                dateOfBirth: technician.dateOfBirth,
                gender: technician.gender,
                specialization: technician.specialization,
                experience: technician.experience,
                profilePhoto: technician.profilePhoto,
                role: technician.role,
                approvalStatus: technician.approvalStatus
            }
        });

    } catch (error) {
        console.error('Technician profile update error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: 'Unable to update technician profile.'
        });
    }
});



// Admin - Dashboard Statistics API
router.get('/admin/dashboard-stats', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        const totalCustomers = await User.countDocuments({
            role: 'customer'
        });

        const totalTechnicians = await User.countDocuments({
            role: 'technician'
        });

        const pendingApprovals = await User.countDocuments({
            role: 'technician',
            approvalStatus: 'pending'
        });

        const totalBookings = await Booking.countDocuments();

        res.status(200).json({
            message: 'Dashboard statistics fetched successfully',
            stats: {
                totalCustomers,
                totalTechnicians,
                pendingApprovals,
                totalBookings
            }
        });
    } catch (error) {
        console.error('Dashboard statistics error:', error.message);

        res.status(500).json({
            message: 'Failed to fetch dashboard statistics'
        });
    }
});
// ==========================================
// ADMIN - CHANGE PASSWORD
// ==========================================

// Common - Change Password for Customer, Technician and Admin
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};

        // Validate input
        if (
            typeof currentPassword !== 'string' ||
            typeof newPassword !== 'string' ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                message: 'Please provide current and new passwords.'
            });
        }

        // Validate strong password
        if (!validateStrongPassword(newPassword)) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.'
            });
        }

        // Validate authenticated user role
        if (!['customer', 'technician', 'admin'].includes(req.user.role)) {
            return res.status(403).json({
                message: 'Access denied. Invalid account role.'
            });
        }

        // Find logged-in user
        const user = await User.findOne({
            _id: req.user.id,
            role: req.user.role
        });

        if (!user) {
            return res.status(404).json({
                message: 'Account not found.'
            });
        }

        // Restrict admin password changes to the authorized admin
        if (
            user.role === 'admin' &&
            user.email?.toLowerCase() !== 'gasconnect4@gmail.com'
        ) {
            return res.status(403).json({
                message: 'Access denied.'
            });
        }

        // Ensure the account supports password login
        if (!user.password) {
            return res.status(400).json({
                message: 'Password login is not enabled for this account.'
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(400).json({
                message: 'Current password is incorrect.'
            });
        }

        // Prevent reusing the same password
        const isSamePassword = await bcrypt.compare(
            newPassword,
            user.password
        );

        if (isSamePassword) {
            return res.status(400).json({
                message: 'New password must be different from current password.'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            message: 'Password changed successfully.'
        });

    } catch (error) {
        console.error('Change password error:', error.message);

        return res.status(500).json({
            message: 'Unable to change password. Please try again.'
        });
    }
});


// ==========================================
// ADMIN - GET PROFILE
// ==========================================
router.get('/admin/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        const admin = await User.findOne({
            _id: req.user.id,
            role: 'admin'
        }).select('-password');

        if (!admin) {
            return res.status(404).json({
                message: 'Admin account not found.'
            });
        }

        // Prevent changes to the registered phone number
if (cleanPhone !== admin.phone) {
    return res.status(403).json({
        message: 'The registered phone number cannot be changed.'
    });
}

        return res.status(200).json({
            admin
        });

    } catch (error) {
        console.error('Get admin profile error:', error);

        return res.status(500).json({
            message: 'Unable to fetch admin profile.'
        });
    }
});

// ==========================================
// ADMIN - UPDATE PROFILE
// ==========================================

router.put('/admin/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        const {
            firstName,
            lastName,
            email,
            alternativeEmail,
            phone,
            alternativePhone,
            dateOfBirth,
            gender
        } = req.body || {};

        if (
            typeof firstName !== 'string' ||
            typeof lastName !== 'string' ||
            typeof email !== 'string' ||
            typeof phone !== 'string' ||
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !phone.trim()
        ) {
            return res.status(400).json({
                message: 'First name, last name, email and phone are required.'
            });
        }

        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.trim();

        const cleanAlternativeEmail =
            typeof alternativeEmail === 'string'
                ? alternativeEmail.trim().toLowerCase()
                : '';

        const cleanAlternativePhone =
            typeof alternativePhone === 'string'
                ? alternativePhone.trim()
                : '';

        // Primary admin email cannot be changed
        if (cleanEmail !== 'gasconnect4@gmail.com') {
            return res.status(403).json({
                message: 'The authorized admin email address cannot be changed.'
            });
        }

        // Validate names
        const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

        if (
            !nameRegex.test(cleanFirstName) ||
            !nameRegex.test(cleanLastName)
        ) {
            return res.status(400).json({
                message: 'Please enter valid first and last names.'
            });
        }

        // Validate emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            cleanAlternativeEmail &&
            !emailRegex.test(cleanAlternativeEmail)
        ) {
            return res.status(400).json({
                message: 'Please enter a valid alternative email.'
            });
        }

        if (cleanAlternativeEmail === cleanEmail) {
            return res.status(400).json({
                message: 'Alternative email must be different from primary email.'
            });
        }

        // Validate editable primary phone
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({
                message: 'Phone number must contain exactly 10 digits.'
            });
        }

        // Validate alternative phone
        if (
            cleanAlternativePhone &&
            !/^\d{10}$/.test(cleanAlternativePhone)
        ) {
            return res.status(400).json({
                message: 'Alternative phone must contain exactly 10 digits.'
            });
        }

        if (
            cleanAlternativePhone &&
            cleanAlternativePhone === cleanPhone
        ) {
            return res.status(400).json({
                message: 'Alternative phone must be different from primary phone.'
            });
        }

        // Validate gender
        const allowedGenders = [
            'Male',
            'Female',
            'Other',
            'Prefer not to say'
        ];

        const selectedGender = gender || 'Prefer not to say';

        if (!allowedGenders.includes(selectedGender)) {
            return res.status(400).json({
                message: 'Please select a valid gender.'
            });
        }

        // Validate date of birth
        let parsedDateOfBirth = null;

        if (dateOfBirth) {
            parsedDateOfBirth = new Date(dateOfBirth);

            if (
                Number.isNaN(parsedDateOfBirth.getTime()) ||
                parsedDateOfBirth > new Date()
            ) {
                return res.status(400).json({
                    message: 'Please enter a valid date of birth.'
                });
            }
        }

        // Find logged-in admin
        const admin = await User.findOne({
            _id: req.user.id,
            role: 'admin'
        });

        if (!admin) {
            return res.status(404).json({
                message: 'Admin account not found.'
            });
        }

        // Verify authorized admin account
        if (admin.email !== 'gasconnect4@gmail.com') {
            return res.status(403).json({
                message: 'Admin account email verification failed.'
            });
        }

        // Check alternative email against registered primary emails
        if (cleanAlternativeEmail) {
            const existingEmail = await User.findOne({
                email: cleanAlternativeEmail,
                _id: { $ne: admin._id }
            });

            if (existingEmail) {
                return res.status(409).json({
                    message: 'This alternative email address is already registered.'
                });
            }
        }

        // Update admin details
        admin.firstName = cleanFirstName;
        admin.lastName = cleanLastName;
        admin.name = `${cleanFirstName} ${cleanLastName}`;

        // Keep primary email permanently locked
        admin.email = 'gasconnect4@gmail.com';

        // Phone number is now editable
        admin.phone = cleanPhone;

        admin.alternativeEmail = cleanAlternativeEmail;
        admin.alternativePhone = cleanAlternativePhone;
        admin.dateOfBirth = parsedDateOfBirth;
        admin.gender = selectedGender;

        await admin.save();

        return res.status(200).json({
            message: 'Admin profile updated successfully!',
            admin: {
                id: admin._id,
                name: admin.name,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                alternativeEmail: admin.alternativeEmail,
                phone: admin.phone,
                alternativePhone: admin.alternativePhone,
                dateOfBirth: admin.dateOfBirth,
                gender: admin.gender,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Admin profile update error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: 'This email address is already registered.'
            });
        }

        return res.status(500).json({
            message: 'Unable to update admin profile.'
        });
    }
});


// Add a new address
router.post('/customer/addresses', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Access denied. Customers only.'
            });
        }

        const {
            label,
            fullAddress,
            landmark,
            city,
            state,
            pincode,
            location,
            isDefault
        } = req.body;

        if (!['Home', 'Work', 'Other'].includes(label)) {
            return res.status(400).json({
                message: 'Address label must be Home, Work or Other'
            });
        }

        if (
            typeof fullAddress !== 'string' ||
            fullAddress.trim().length < 5 ||
            fullAddress.trim().length > 300
        ) {
            return res.status(400).json({
                message: 'Please enter a valid address'
            });
        }

        if (
            pincode &&
            !/^\d{6}$/.test(String(pincode))
        ) {
            return res.status(400).json({
                message: 'Pincode must contain exactly 6 digits'
            });
        }

        if (location) {
            const { latitude, longitude } = location;

            if (
                latitude == null ||
                longitude == null ||
                !Number.isFinite(Number(latitude)) ||
                !Number.isFinite(Number(longitude)) ||
                Number(latitude) < -90 ||
                Number(latitude) > 90 ||
                Number(longitude) < -180 ||
                Number(longitude) > 180
            ) {
                return res.status(400).json({
                    message: 'Please provide valid location coordinates'
                });
            }
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Customer not found'
            });
        }

        // First address becomes default automatically.
        const makeDefault =
            user.savedAddresses.length === 0 || isDefault === true;

        if (makeDefault) {
            user.savedAddresses.forEach(address => {
                address.isDefault = false;
            });
        }

        user.savedAddresses.push({
            label,
            fullAddress: fullAddress.trim(),
            landmark: landmark?.trim() || '',
            city: city?.trim() || '',
            state: state?.trim() || '',
            pincode: pincode || '',
            location: location || undefined,
            isDefault: makeDefault
        });

        await user.save();

        res.status(201).json({
            message: 'Address added successfully',
            addresses: user.savedAddresses,
            address: user.savedAddresses[user.savedAddresses.length - 1]
        });

    } catch (error) {
        console.error('Add address error:', error.message);
        res.status(500).json({
            message: 'Failed to add address'
        });
    }
});


// Update an existing address
router.put('/customer/addresses/:addressId', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Access denied. Customers only.'
            });
        }

        const { addressId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                message: 'Invalid address ID'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Customer not found'
            });
        }

        const address = user.savedAddresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                message: 'Address not found'
            });
        }

        const {
            label,
            fullAddress,
            landmark,
            city,
            state,
            pincode,
            location,
            isDefault
        } = req.body;

        if (
            label !== undefined &&
            !['Home', 'Work', 'Other'].includes(label)
        ) {
            return res.status(400).json({
                message: 'Invalid address label'
            });
        }

        if (
            fullAddress !== undefined &&
            (
                typeof fullAddress !== 'string' ||
                fullAddress.trim().length < 5 ||
                fullAddress.trim().length > 300
            )
        ) {
            return res.status(400).json({
                message: 'Please enter a valid address'
            });
        }

        if (
            pincode !== undefined &&
            pincode !== '' &&
            !/^\d{6}$/.test(String(pincode))
        ) {
            return res.status(400).json({
                message: 'Pincode must contain exactly 6 digits'
            });
        }

        if (location !== undefined && location !== null) {
            const { latitude, longitude } = location;

            if (
                latitude == null ||
                longitude == null ||
                !Number.isFinite(Number(latitude)) ||
                !Number.isFinite(Number(longitude)) ||
                Number(latitude) < -90 ||
                Number(latitude) > 90 ||
                Number(longitude) < -180 ||
                Number(longitude) > 180
            ) {
                return res.status(400).json({
                    message: 'Please provide valid location coordinates'
                });
            }
        }

        if (label !== undefined) address.label = label;
        if (fullAddress !== undefined) address.fullAddress = fullAddress.trim();
        if (landmark !== undefined) address.landmark = landmark.trim();
        if (city !== undefined) address.city = city.trim();
        if (state !== undefined) address.state = state.trim();
        if (pincode !== undefined) address.pincode = pincode;
        if (location !== undefined) address.location = location;

        if (isDefault === true) {
            user.savedAddresses.forEach(item => {
                item.isDefault = false;
            });

            address.isDefault = true;
        }

        await user.save();

        res.status(200).json({
            message: 'Address updated successfully',
            addresses: user.savedAddresses,
            address
        });

    } catch (error) {
        console.error('Update address error:', error.message);
        res.status(500).json({
            message: 'Failed to update address'
        });
    }
});


// Set an address as default
router.patch('/customer/addresses/:addressId/default', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Access denied. Customers only.'
            });
        }

        const { addressId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                message: 'Invalid address ID'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Customer not found'
            });
        }

        const selectedAddress = user.savedAddresses.id(addressId);

        if (!selectedAddress) {
            return res.status(404).json({
                message: 'Address not found'
            });
        }

        user.savedAddresses.forEach(address => {
            address.isDefault = address._id.equals(selectedAddress._id);
        });

        await user.save();

        res.status(200).json({
            message: 'Default address updated successfully',
            addresses: user.savedAddresses,
            address: selectedAddress
        });

    } catch (error) {
        console.error('Set default address error:', error.message);
        res.status(500).json({
            message: 'Failed to set default address'
        });
    }
});


// Delete an address
router.delete('/customer/addresses/:addressId', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Access denied. Customers only.'
            });
        }

        const { addressId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                message: 'Invalid address ID'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Customer not found'
            });
        }

        const address = user.savedAddresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                message: 'Address not found'
            });
        }

        const wasDefault = address.isDefault;

        address.deleteOne();

        // If the default address was deleted,
        // make the first remaining address default.
        if (wasDefault && user.savedAddresses.length > 0) {
            user.savedAddresses[0].isDefault = true;
        }

        await user.save();

        res.status(200).json({
            message: 'Address deleted successfully',
            addresses: user.savedAddresses
        });

    } catch (error) {
        console.error('Delete address error:', error.message);
        res.status(500).json({
            message: 'Failed to delete address'
        });
    }
});


export default router;
