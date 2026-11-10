
import express from 'express';
import mongoose from 'mongoose';
import ServiceCategory from '../models/ServiceCategory.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET - Retrieve all service categories
router.get('/', async (req, res) => {
    try {
        const categories = await ServiceCategory.find().sort({ name: 1 });

        res.status(200).json({
            message: 'Service categories fetched successfully!',
            categories
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
});

// POST - Add a new service category (Admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can add service categories'
            });
        }

        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({
                message: 'Name and description are required'
            });
        }

        const category = new ServiceCategory({
            name: name.trim(),
            description: description.trim()
        });

        await category.save();

        res.status(201).json({
            message: 'Service category added successfully!',
            category
        });
    } catch (error) {
        res.status(error.code === 11000 ? 409 : 400).json({
            message: error.code === 11000
                ? 'This service category already exists'
                : 'Failed to add service category',
            error: error.message
        });
    }
});

// PUT - Update a service category (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can update service categories'
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
            {
                name: name.trim(),
                description: description.trim()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({
                message: 'Service category not found'
            });
        }

        res.status(200).json({
            message: 'Service category updated successfully!',
            category
        });
    } catch (error) {
        res.status(error.code === 11000 ? 409 : 400).json({
            message: error.code === 11000
                ? 'This service category already exists'
                : 'Failed to update service category',
            error: error.message
        });
    }
});

// DELETE - Remove a service category (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can delete service categories'
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid category ID'
            });
        }

        const category = await ServiceCategory.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({
                message: 'Service category not found'
            });
        }

        res.status(200).json({
            message: 'Service category deleted successfully!',
            category
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete service category',
            error: error.message
        });
    }
});

export default router;
