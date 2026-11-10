
import express from 'express';
import mongoose from 'mongoose';
import RepairType from '../models/RepairType.js';
import ServiceCategory from '../models/ServiceCategory.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET - Retrieve all repair types
router.get('/', async (req, res) => {
    try {
        const repairs = await RepairType.find()
            .populate('category', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Repair types fetched successfully!',
            repairs
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch repair types',
            error: error.message
        });
    }
});

// POST - Add a new repair type (Admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        const { name, description, category, price } = req.body;

        if (!name || !description || !category || price === undefined || price === '') {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({
                message: 'Invalid category ID'
            });
        }

        const existingCategory = await ServiceCategory.findById(category);

        if (!existingCategory) {
            return res.status(404).json({
                message: 'Service category not found'
            });
        }

        const newRepair = new RepairType({
            name,
            description,
            category,
            price
        });

        await newRepair.save();

        const savedRepair = await RepairType.findById(newRepair._id)
            .populate('category', 'name');

        res.status(201).json({
            message: 'Repair type added successfully!',
            repair: savedRepair
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to add repair type',
            error: error.message
        });
    }
});

// PUT - Update repair type (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        const { id } = req.params;
        const { name, description, category, price } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid repair type ID'
            });
        }

        if (!name || !description || !category || price === undefined || price === '') {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({
                message: 'Invalid category ID'
            });
        }

        const existingCategory = await ServiceCategory.findById(category);

        if (!existingCategory) {
            return res.status(404).json({
                message: 'Service category not found'
            });
        }

        const updatedRepair = await RepairType.findByIdAndUpdate(
            id,
            { name, description, category, price },
            { new: true, runValidators: true }
        ).populate('category', 'name');

        if (!updatedRepair) {
            return res.status(404).json({
                message: 'Repair type not found'
            });
        }

        res.status(200).json({
            message: 'Repair type updated successfully!',
            repair: updatedRepair
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to update repair type',
            error: error.message
        });
    }
});

// DELETE - Delete repair type (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admins only.'
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid repair type ID'
            });
        }

        const deletedRepair = await RepairType.findByIdAndDelete(id);

        if (!deletedRepair) {
            return res.status(404).json({
                message: 'Repair type not found'
            });
        }

        res.status(200).json({
            message: 'Repair type deleted successfully!'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete repair type',
            error: error.message
        });
    }
});

export default router;
