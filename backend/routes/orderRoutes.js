import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
    createOrder,
    getMyOrders,
    getAllOrdersForAdmin,
    getOrderForAdmin,
    downloadOrderInvoice,
    updateOrderStatus,
    adminOnly
} from '../controllers/orderController.js';

const router = express.Router();

// POST /
router.post('/', authMiddleware, createOrder);

// GET /my-orders
router.get('/my-orders', authMiddleware, getMyOrders);

// GET /admin/all
router.get('/admin/all', authMiddleware, adminOnly, getAllOrdersForAdmin);

// GET /admin/:id
router.get('/admin/:id', authMiddleware, adminOnly, getOrderForAdmin);

// GET /:id/invoice
router.get('/:id/invoice', authMiddleware, downloadOrderInvoice);

// PUT /admin/:id/status
router.put('/admin/:id/status', authMiddleware, adminOnly, updateOrderStatus);

export default router;
