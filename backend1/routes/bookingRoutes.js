import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import uploadBookingPhoto from '../middleware/uploadBookingPhoto.js';
import {
    createBooking,
    getMyBookings,
    getAllBookingsForAdmin,
    assignBookingToTechnician,
    respondToBookingAsTechnician,
    getTechnicianBookings,
    updateBookingStatusAsTechnician,
    cancelBookingAsCustomer
} from '../controllers/bookingController.js';

const router = express.Router();

// POST /
router.post('/', authMiddleware, uploadBookingPhoto.single('issuePhoto'), createBooking);

// GET /my-bookings
router.get('/my-bookings', authMiddleware, getMyBookings);

// GET /admin/all
router.get('/admin/all', authMiddleware, getAllBookingsForAdmin);

// PUT /admin/assign/:id
router.put('/admin/assign/:id', authMiddleware, assignBookingToTechnician);

// PUT /technician/respond/:id
router.put('/technician/respond/:id', authMiddleware, respondToBookingAsTechnician);

// GET /technician/my-bookings
router.get('/technician/my-bookings', authMiddleware, getTechnicianBookings);

// PUT /technician/update-status/:id
router.put('/technician/update-status/:id', authMiddleware, updateBookingStatusAsTechnician);

// PUT /customer/cancel/:id
router.put('/customer/cancel/:id', authMiddleware, cancelBookingAsCustomer);

export default router;
