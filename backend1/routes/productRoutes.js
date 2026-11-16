import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    createProduct,
    getAllProducts,
    getLowStockProducts,
    restockProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

// POST /
router.post('/', authMiddleware, createProduct);

// GET /
router.get('/', getAllProducts);

// GET /admin/low-stock
router.get('/admin/low-stock', authMiddleware, getLowStockProducts);

// PUT /admin/restock/:id
router.put('/admin/restock/:id', authMiddleware, restockProduct);

// PUT /:id
router.put('/:id', authMiddleware, updateProduct);

// DELETE /:id
router.delete('/:id', authMiddleware, deleteProduct);

export default router;
