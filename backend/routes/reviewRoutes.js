
import express from 'express';
import mongoose from 'mongoose';

import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();


// ========================================
// POST - Customer submits a review
// ========================================

router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Only customers can submit reviews'
            });
        }

        const { bookingId, rating, comment } = req.body;

        if (!bookingId || rating === undefined || rating === null) {
            return res.status(400).json({
                message: 'Booking ID and rating are required'
            });
        }

        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({
                message: 'Invalid booking ID'
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be an integer between 1 and 5'
            });
        }

        if (
            comment !== undefined &&
            (typeof comment !== 'string' || comment.trim().length > 500)
        ) {
            return res.status(400).json({
                message: 'Comment must be text with a maximum of 500 characters'
            });
        }

        const booking = await Booking.findOne({
            _id: bookingId,
            customer: req.user.id,
            status: 'completed'
        });

        if (!booking) {
            return res.status(404).json({
                message: 'Completed booking not found'
            });
        }

        if (!booking.technician) {
            return res.status(400).json({
                message: 'No technician is assigned to this booking'
            });
        }

        const existingReview = await Review.findOne({
            booking: bookingId
        });

        if (existingReview) {
            return res.status(409).json({
                message: 'You have already reviewed this booking'
            });
        }

        const technician = await User.findOne({
            _id: booking.technician,
            role: 'technician'
        });

        if (!technician) {
            return res.status(404).json({
                message: 'Technician not found'
            });
        }

        const newReview = new Review({
            customer: req.user.id,
            technician: booking.technician,
            booking: bookingId,
            rating,
            comment: comment?.trim() || ''
        });

        const savedReview = await newReview.save();

        return res.status(201).json({
            message: 'Review submitted successfully',
            review: savedReview
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'You have already reviewed this booking'
            });
        }

        console.error('Review submission error:', error);

        return res.status(500).json({
            message: 'Unable to submit review'
        });
    }
});


// ========================================
// GET - Admin views all reviews
// ========================================

router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin only.'
            });
        }

        const reviews = await Review.find()
            .populate('customer', 'name')
            .populate('technician', 'name')
            .populate('booking')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'All reviews fetched successfully',
            count: reviews.length,
            reviews
        });

    } catch (error) {
        console.error('Admin reviews error:', error);

        return res.status(500).json({
            message: 'Unable to fetch reviews'
        });
    }
});


// ========================================
// GET - View reviews for a technician
// ========================================

router.get('/technician/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'Invalid technician ID'
            });
        }

        const technician = await User.findOne({
            _id: id,
            role: 'technician'
        }).select('_id');

        if (!technician) {
            return res.status(404).json({
                message: 'Technician not found'
            });
        }

        const reviews = await Review.find({
            technician: id
        })
            .populate('customer', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Technician reviews fetched successfully',
            count: reviews.length,
            reviews
        });

    } catch (error) {
        console.error('Fetch reviews error:', error);

        return res.status(500).json({
            message: 'Unable to fetch reviews'
        });
    }
});

export default router;
