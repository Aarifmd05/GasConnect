import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    createReview,
    getAllReviewsForAdmin,
    getTechnicianReviews
} from '../controllers/reviewController.js';

const router = express.Router();

// POST /
router.post('/', authMiddleware, createReview);

// GET /admin/all
router.get('/admin/all', authMiddleware, getAllReviewsForAdmin);

// GET /technician/:id
router.get('/technician/:id', getTechnicianReviews);

export default router;
