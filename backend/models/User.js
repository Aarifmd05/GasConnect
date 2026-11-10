
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ==========================================
// SAVED ADDRESS SCHEMA
// ==========================================

const addressSchema = new mongoose.Schema({
    label: {
        type: String,
        enum: ['Home', 'Work', 'Other'],
        required: true
    },

    fullAddress: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 300
    },

    landmark: {
        type: String,
        trim: true,
        maxlength: 150,
        default: ''
    },

    city: {
        type: String,
        trim: true,
        default: ''
    },

    state: {
        type: String,
        trim: true,
        default: ''
    },

    pincode: {
        type: String,
        match: /^\d{6}$/,
        default: ''
    },

    location: {
        latitude: {
            type: Number,
            min: -90,
            max: 90,
            default: null
        },

        longitude: {
            type: Number,
            min: -180,
            max: 180,
            default: null
        }
    },

    isDefault: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });


// ==========================================
// USER SCHEMA
// ==========================================

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
        match: /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
        validate: {
            validator: value => value.trim().length >= 2,
            message: 'Name must contain at least 2 characters.'
        }
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 254,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 128,
        match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/
    },

    phone: {
        type: String,
        required: true,
        match: /^\d{10}$/
    },

    // Admin Profile Details
    firstName: {
        type: String,
        trim: true,
        maxlength: 50
    },

    lastName: {
        type: String,
        trim: true,
        maxlength: 50
    },

    alternativeEmail: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 254,
        default: ''
    },

    alternativePhone: {
        type: String,
        trim: true,
        match: /^\d{10}$/,
        default: ''
    },

    dateOfBirth: {
        type: Date,
        default: null
    },

    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        default: 'Prefer not to say'
    },

    // Customer Saved Addresses
    savedAddresses: {
        type: [addressSchema],
        default: []
    },

    // User Role
    role: {
        type: String,
        enum: ['customer', 'technician', 'admin'],
        default: 'customer'
    },

    // Technician Details

    // Technician Profile Photo
    profilePhoto: {
        type: String,
        trim: true,
        default: ''
    },

    specialization: {
        type: String,
        trim: true,
        maxlength: 100,
        required: function () {
            return this.role === 'technician';
        }
    },

    experience: {
        type: Number,
        min: 0,
        max: 60,
        required: function () {
            return this.role === 'technician';
        }
    },

    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        required: function () {
            return this.role === 'technician';
        }
    }

}, { timestamps: true });


// ==========================================
// HASH PASSWORD BEFORE SAVING
// ==========================================

userSchema.pre('save', async function () {

    if (!this.isModified('password')) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);

});


// ==========================================
// EXPORT USER MODEL
// ==========================================

const User = mongoose.model('User', userSchema);

export default User;
