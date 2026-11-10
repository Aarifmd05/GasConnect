import mongoose from 'mongoose';

const passwordResetOTPSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },

        // Identifies which account type requested the OTP
        role: {
            type: String,
            enum: ['customer', 'technician', 'admin'],
            default: 'admin',
            required: true
        },

        // Identifies why the OTP was requested
        purpose: {
            type: String,
            enum: ['signup', 'password-reset'],
            default: 'password-reset',
            required: true
        },

        otpHash: {
            type: String,
            required: true
        },

        expiresAt: {
            type: Date,
            required: true,
            expires: 0
        },

        attempts: {
            type: Number,
            default: 0
        },

        // Temporary signup details, used only until OTP verification
        pendingData: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent OTP records for different purposes or roles from colliding
passwordResetOTPSchema.index({
    email: 1,
    role: 1,
    purpose: 1
});

const PasswordResetOTP = mongoose.model(
    'PasswordResetOTP',
    passwordResetOTPSchema
);

export default PasswordResetOTP;