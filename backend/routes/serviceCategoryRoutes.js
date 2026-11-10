import express from 'express';
import mongoose from 'mongoose';
import ServiceCategory from '../models/ServiceCategory.js';
import RepairType from '../models/RepairType.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET - Get all service categories
router.get('/', async (req, res) => {
    try {
        const categories = await ServiceCategory.find().sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Service categories fetched successfully',
            categories
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch service categories',
            error: error.message
        });
    }
});

// POST - Add a new service category (Admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin only.'
            });
        }

        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({
                message: 'Name and description are required'
            });
        }

        const category = await ServiceCategory.create({
            name,
            description
        });

        res.status(201).json({
            message: 'Service category added successfully',
            category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'This service category already exists'
            });
        }

        res.status(500).json({
            message: 'Failed to add service category',
            error: error.message
        });
    }
});

// PUT - Update a service category (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        const { name, description } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid category ID'
            });
        }

        if (!name || !description) {
            return res.status(400).json({
                message: 'Name and description are required'
            });
        }

        const category = await ServiceCategory.findByIdAndUpdate(
            id,
            { name, description },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                message: 'Service category not found'
            });
        }

        res.status(200).json({
            message: 'Service category updated successfully',
            category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'A category with this name already exists'
            });
        }

        res.status(500).json({
            message: 'Failed to update service category',
            error: error.message
        });
    }
});

// DELETE - Delete a service category (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid category ID'
            });
        }

        const category = await ServiceCategory.findById(id);

        if (!category) {
            return res.status(404).json({
                message: 'Service category not found'
            });
        }

        // Prevent deletion if repair types use this category
        const linkedRepairType = await RepairType.findOne({
            category: id
        });

        if (linkedRepairType) {
            return res.status(409).json({
                message: 'Cannot delete this category because repair types are using it'
            });
        }

        await ServiceCategory.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Service category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete service category',
            error: error.message
        });
    }
});

export default router;