
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: 'Rating must be a whole number'
        }
    },

    comment: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    }

}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
