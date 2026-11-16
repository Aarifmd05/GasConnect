import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    getAllServices,
    createService,
    updateService,
    deleteService
} from '../controllers/serviceController.js';

const router = express.Router();

// GET /
router.get('/', getAllServices);

// POST /
router.post('/', authMiddleware, createService);

// PUT /:id
router.put('/:id', authMiddleware, updateService);

// DELETE /:id
router.delete('/:id', authMiddleware, deleteService);

export default router;
