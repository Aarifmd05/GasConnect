import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Optional when customer uploads a problem photo instead
    repairType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RepairType',
        default: null
    },

    bookingDate: {
        type: Date,
        required: true,
        validate: [
            {
                validator: function (value) {
                    return value instanceof Date && !isNaN(value);
                },
                message: 'Please provide a valid booking date'
            },
            {
                validator: function (value) {
                    return value > new Date();
                },
                message: 'Booking date must be in the future'
            }
        ]
    },

    address: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 300
    },

    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },

    // Customer's uploaded appliance/problem photo
    issuePhoto: {
        url: {
            type: String,
            default: ''
        },
        filename: {
            type: String,
            default: ''
        }
    },

    status: {
        type: String,
        enum: [
            'pending',
            'assigned',
            'accepted',
            'rejected',
            'in-progress',
            'completed',
            'cancelled'
        ],
        default: 'pending'
    },

    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    declinedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
}],

}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;