// Business logic for this set of API routes.

import mongoose from 'mongoose';
import ServiceCategory from '../models/ServiceCategory.js';

// Shared helpers used by the route handlers.
// GET - Retrieve all service categories

// Handles GET /.
export const getAllServices = async (req, res) => {
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
};

// Handles POST /.
export const createService = async (req, res) => {
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
};

// Handles PUT /:id.
export const updateService = async (req, res) => {
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
               returnDocument: 'after',
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
};

// Handles DELETE /:id.
export const deleteService = async (req, res) => {
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
};
