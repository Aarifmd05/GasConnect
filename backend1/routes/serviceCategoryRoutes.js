import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    getAllServiceCategories,
    createServiceCategory,
    updateServiceCategory,
    deleteServiceCategory
} from '../controllers/serviceCategoryController.js';

const router = express.Router();

// GET /
router.get('/', getAllServiceCategories);

// POST /
router.post('/', authMiddleware, createServiceCategory);

// PUT /:id
router.put('/:id', authMiddleware, updateServiceCategory);

// DELETE /:id
router.delete('/:id', authMiddleware, deleteServiceCategory);

export default router;
