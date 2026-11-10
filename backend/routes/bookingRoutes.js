
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';

import User from '../models/User.js';
import Booking from '../models/Booking.js';
import RepairType from '../models/RepairType.js';
import authMiddleware from '../middleware/authMiddleware.js';
import uploadBookingPhoto from '../middleware/uploadBookingPhoto.js';

const router = express.Router();


// ==========================================
// POST - Customer creates a booking
// ==========================================
router.post(
    '/',
    authMiddleware,
    uploadBookingPhoto.single('issuePhoto'),
    async (req, res) => {
        try {
            if (req.user.role !== 'customer') {
                return res.status(403).json({
                    message: 'Only customers can create bookings'
                });
            }

            const {
                repairType,
                bookingDate,
                address,
                description
            } = req.body;

            if (!repairType && !req.file) {
                return res.status(400).json({
                    message: 'Please select a repair service or upload a photo.'
                });
            }

            if (!bookingDate || !address) {
                return res.status(400).json({
                    message: 'Booking date and address are required'
                });
            }

            if (repairType) {
                if (!mongoose.isValidObjectId(repairType)) {
                    return res.status(400).json({
                        message: 'Invalid repair type ID'
                    });
                }

                const selectedRepair = await RepairType.findById(repairType);

                if (!selectedRepair) {
                    return res.status(404).json({
                        message: 'Repair type not found'
                    });
                }
            }

            if (
                typeof address !== 'string' ||
                address.trim().length < 5 ||
                address.trim().length > 300
            ) {
                return res.status(400).json({
                    message: 'Address must contain 5 to 300 characters'
                });
            }

            if (
                description !== undefined &&
                (
                    typeof description !== 'string' ||
                    description.length > 500
                )
            ) {
                return res.status(400).json({
                    message: 'Description cannot exceed 500 characters'
                });
            }

            const selectedDate = new Date(bookingDate);

            if (
                isNaN(selectedDate.getTime()) ||
                selectedDate <= new Date()
            ) {
                return res.status(400).json({
                    message: 'Please provide a valid future booking date'
                });
            }

            const photoUrl = req.file
                ? `/uploads/bookings/${req.file.filename}`
                : '';

            const newBooking = new Booking({
                customer: req.user.id,
                repairType: repairType || null,
                bookingDate: selectedDate,
                address: address.trim(),
                description: description?.trim() || '',
                issuePhoto: {
                    url: photoUrl,
                    filename: req.file?.filename || ''
                }
            });

            const savedBooking = await newBooking.save();

            return res.status(201).json({
                message: 'Repair booking created successfully',
                booking: savedBooking
            });

        } catch (error) {
            console.error('Create booking error:', error);

            if (req.file) {
                const fs = await import('fs/promises');
                const path = await import('path');

                await fs.unlink(
                    path.join(
                        process.cwd(),
                        'uploads',
                        'bookings',
                        req.file.filename
                    )
                ).catch(() => {});
            }

            return res.status(
                error instanceof multer.MulterError ? 400 : 500
            ).json({
                message: error.message || 'Failed to create booking'
            });
        }
    }
);


// ==========================================
// GET - Customer views their bookings
// ==========================================
router.get('/my-bookings', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Only customers can view their bookings'
            });
        }

        const bookings = await Booking.find({
            customer: req.user.id
        })
            .populate('repairType', 'name price')
            .populate('technician', 'name phone specialization')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Customer bookings fetched successfully',
            bookings
        });

    } catch (error) {
        console.error('Customer bookings error:', error);

        return res.status(500).json({
            message: 'Failed to fetch bookings'
        });
    }
});


// ==========================================
// GET - Admin views all bookings
// ==========================================
router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can view all bookings'
            });
        }

        const bookings = await Booking.find()
            .populate('customer', 'name email phone')
            .populate('repairType', 'name price')
            .populate('technician', 'name phone specialization')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'All bookings fetched successfully',
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error('Admin bookings error:', error);

        return res.status(500).json({
            message: 'Failed to fetch bookings'
        });
    }
});


// ==========================================
// PUT - Admin publishes or directly assigns
// ==========================================
router.put('/admin/assign/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can assign bookings'
            });
        }

        const { technicianId } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid booking ID'
            });
        }

        // Validate selected technician for direct assignment.
        if (technicianId) {
            if (!mongoose.isValidObjectId(technicianId)) {
                return res.status(400).json({
                    message: 'Invalid technician ID'
                });
            }

            const technician = await User.findOne({
                _id: technicianId,
                role: 'technician',
                approvalStatus: 'approved'
            });

            if (!technician) {
                return res.status(404).json({
                    message: 'Approved technician not found'
                });
            }
        }

        // If technicianId exists: direct assignment.
        // Otherwise: publish to all approved technicians.
        const update = {
            technician: technicianId || null,
            status: 'assigned',
            declinedBy: []
        };

        const booking = await Booking.findOneAndUpdate(
            {
                _id: req.params.id,
                status: { $in: ['pending', 'rejected'] }
            },
            {
                $set: update
            },
            {
                new: true,
                runValidators: true
            }
        )
            .populate('customer', 'name email phone')
            .populate('repairType', 'name price')
            .populate('technician', 'name phone specialization');

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found or cannot be published'
            });
        }

        return res.status(200).json({
            message: technicianId
                ? 'Booking directly assigned to technician successfully'
                : 'Booking published to all approved technicians successfully',
            booking
        });

    } catch (error) {
        console.error('Admin assignment error:', error);

        return res.status(500).json({
            message: 'Failed to assign booking'
        });
    }
});


// ==========================================
// PUT - Technician accepts or rejects booking
// ==========================================
router.put('/technician/respond/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'technician') {
            return res.status(403).json({
                message: 'Only technicians can respond to bookings'
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid booking ID'
            });
        }

        const { response } = req.body;
        const technicianId = req.user.id;
        const bookingId = req.params.id;

        if (!['accepted', 'rejected'].includes(response)) {
            return res.status(400).json({
                message: 'Response must be accepted or rejected'
            });
        }

        // ----------------------------------
        // REJECT BOOKING
        // ----------------------------------
        if (response === 'rejected') {

            // Case 1: Technician rejects a job directly assigned to them.
            // Release it back to the shared pool.
            let rejectedBooking = await Booking.findOneAndUpdate(
                {
                    _id: bookingId,
                    technician: technicianId,
                    status: 'assigned'
                },
                {
                    $set: {
                        technician: null
                    },
                    $addToSet: {
                        declinedBy: technicianId
                    }
                },
                {
                    new: true
                }
            );

            // Case 2: Technician rejects a shared-pool job.
            // Hide it only from this technician.
            if (!rejectedBooking) {
                rejectedBooking = await Booking.findOneAndUpdate(
                    {
                        _id: bookingId,
                        technician: null,
                        status: 'assigned',
                        declinedBy: { $ne: technicianId }
                    },
                    {
                        $addToSet: {
                            declinedBy: technicianId
                        }
                    },
                    {
                        new: true
                    }
                );
            }

            if (!rejectedBooking) {
                return res.status(409).json({
                    message: 'This booking is no longer available to reject.'
                });
            }

            return res.status(200).json({
                message: 'Booking rejected successfully. It is available to other technicians.',
                booking: rejectedBooking
            });
        }


        // ----------------------------------
        // ACCEPT BOOKING
        // ----------------------------------

        // Case 1: Try accepting a shared-pool job.
        // Atomic operation ensures only one technician wins.
        let acceptedBooking = await Booking.findOneAndUpdate(
            {
                _id: bookingId,
                technician: null,
                status: 'assigned',
                declinedBy: { $ne: technicianId }
            },
            {
                $set: {
                    technician: technicianId,
                    status: 'accepted'
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        // Case 2: Try accepting a job directly assigned
        // to this technician.
        if (!acceptedBooking) {
            acceptedBooking = await Booking.findOneAndUpdate(
                {
                    _id: bookingId,
                    technician: technicianId,
                    status: 'assigned'
                },
                {
                    $set: {
                        status: 'accepted'
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        }

        if (!acceptedBooking) {
            const existingBooking = await Booking.findById(bookingId)
                .populate('technician', 'name phone');

            if (!existingBooking) {
                return res.status(404).json({
                    message: 'Booking not found'
                });
            }

            if (existingBooking.technician) {
                return res.status(409).json({
                    message: existingBooking.technician._id.toString() === technicianId.toString()
                        ? 'This booking is no longer available.'
                        : `Already accepted by ${existingBooking.technician.name || 'another technician'}`,
                    alreadyAccepted: true,
                    technician: existingBooking.technician.name
                });
            }

            return res.status(409).json({
                message: 'This job is no longer available.',
                alreadyAccepted: false
            });
        }

        await acceptedBooking.populate('customer', 'name email phone');
        await acceptedBooking.populate('repairType', 'name description price');
        await acceptedBooking.populate('technician', 'name phone specialization');

        return res.status(200).json({
            message: 'Congratulations! You accepted this job.',
            booking: acceptedBooking
        });

    } catch (error) {
        console.error('Technician response error:', error);

        return res.status(500).json({
            message: 'Failed to respond to booking'
        });
    }
});


// ==========================================
// GET - Technician views available jobs
// and their own bookings
// ==========================================
router.get('/technician/my-bookings', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'technician') {
            return res.status(403).json({
                message: 'Only technicians can view bookings'
            });
        }

        const technician = await User.findOne({
            _id: req.user.id,
            role: 'technician',
            approvalStatus: 'approved'
        });

        if (!technician) {
            return res.status(403).json({
                message: 'Your technician account is not approved'
            });
        }

        const bookings = await Booking.find({
            $or: [
                // Shared jobs not yet accepted or rejected by this technician.
                {
                    technician: null,
                    status: 'assigned',
                    declinedBy: { $ne: req.user.id }
                },

                // Directly assigned jobs and jobs accepted by this technician.
                {
                    technician: req.user.id
                }
            ]
        })
            .populate('customer', 'name email phone')
            .populate('repairType', 'name description price')
            .populate('technician', 'name phone specialization')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Technician bookings fetched successfully',
            bookings
        });

    } catch (error) {
        console.error('Technician bookings error:', error);

        return res.status(500).json({
            message: 'Failed to fetch technician bookings'
        });
    }
});


// ==========================================
// PUT - Technician updates repair status
// ==========================================
router.put('/technician/update-status/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'technician') {
            return res.status(403).json({
                message: 'Only technicians can update repair status'
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid booking ID'
            });
        }

        const { status } = req.body;

        if (!['in-progress', 'completed'].includes(status)) {
            return res.status(400).json({
                message: 'Status must be in-progress or completed'
            });
        }

        const allowedCurrentStatus =
            status === 'in-progress' ? 'accepted' : 'in-progress';

        const booking = await Booking.findOneAndUpdate(
            {
                _id: req.params.id,
                technician: req.user.id,
                status: allowedCurrentStatus
            },
            {
                $set: { status }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found or status transition is not allowed'
            });
        }

        return res.status(200).json({
            message: 'Repair status updated successfully',
            booking
        });

    } catch (error) {
        console.error('Repair status error:', error);

        return res.status(500).json({
            message: 'Failed to update repair status'
        });
    }
});


// ==========================================
// PUT - Customer cancels their booking
// ==========================================
router.put('/customer/cancel/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Only customers can cancel bookings'
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid booking ID'
            });
        }

        const booking = await Booking.findOneAndUpdate(
            {
                _id: req.params.id,
                customer: req.user.id,
                status: { $in: ['pending', 'assigned'] }
            },
            {
                $set: {
                    status: 'cancelled'
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found or cannot be cancelled'
            });
        }

        return res.status(200).json({
            message: 'Booking cancelled successfully',
            booking
        });

    } catch (error) {
        console.error('Booking cancellation error:', error);

        return res.status(500).json({
            message: 'Failed to cancel booking'
        });
    }
});

export default router;
