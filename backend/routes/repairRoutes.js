import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    getAllRepairTypes,
    createRepairType,
    updateRepairType,
    deleteRepairType
} from '../controllers/repairController.js';

const router = express.Router();

// GET /
router.get('/', getAllRepairTypes);

// POST /
router.post('/', authMiddleware, createRepairType);

// PUT /:id
router.put('/:id', authMiddleware, updateRepairType);

// DELETE /:id
router.delete('/:id', authMiddleware, deleteRepairType);

export default router;
