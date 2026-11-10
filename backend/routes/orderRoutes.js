
import express from 'express';
import mongoose from 'mongoose';

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import authMiddleware from '../middleware/authMiddleware.js';
import generateInvoice from '../utils/generateInvoice.js';

const router = express.Router();

// ==========================================
// PLACE A NEW ORDER
// POST /api/orders
// ==========================================

router.post('/', authMiddleware, async (req, res) => {
    const updatedProducts = [];

    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Only customers can place orders'
            });
        }

        const { items, deliveryAddress, paymentMethod } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Please add at least one product'
            });
        }

        if (!deliveryAddress) {
            return res.status(400).json({
                message: 'Delivery address is required'
            });
        }

        const {
            fullAddress,
            landmark = '',
            city,
            state,
            pincode
        } = deliveryAddress;

        if (
            !fullAddress?.trim() ||
            !city?.trim() ||
            !state?.trim() ||
            !/^\d{6}$/.test(String(pincode || ''))
        ) {
            return res.status(400).json({
                message: 'Please provide a valid delivery address'
            });
        }

        // Online payment will be integrated later.
        if (paymentMethod && paymentMethod !== 'COD') {
            return res.status(400).json({
                message: 'Currently, only Cash on Delivery is supported'
            });
        }

        // Combine duplicate product entries.
        const quantities = new Map();

        for (const item of items) {
            const { productId, quantity } = item;

            if (
                !mongoose.Types.ObjectId.isValid(productId) ||
                !Number.isSafeInteger(quantity) ||
                quantity < 1
            ) {
                return res.status(400).json({
                    message: 'Invalid product or quantity'
                });
            }

            const id = String(productId);
            quantities.set(id, (quantities.get(id) || 0) + quantity);

            if (!Number.isSafeInteger(quantities.get(id))) {
                return res.status(400).json({
                    message: 'Invalid total quantity'
                });
            }
        }

        const orderItems = [];
        let totalAmount = 0;

        // Verify products and reserve stock.
        for (const [productId, quantity] of quantities) {
            const product = await Product.findOneAndUpdate(
                {
                    _id: productId,
                    isAvailable: true,
                    stock: { $gte: quantity }
                },
                {
                    $inc: { stock: -quantity }
                },
                {
                    new: true
                }
            );

            if (!product) {
                throw new Error(
                    `Product ${productId} is unavailable or has insufficient stock`
                );
            }

            updatedProducts.push({
                productId,
                quantity
            });

            const subtotal = product.price * quantity;

            if (!Number.isFinite(subtotal)) {
                throw new Error('Invalid product amount');
            }

            orderItems.push({
                product: product._id,
                productName: product.name,
                price: product.price,
                quantity,
                subtotal
            });

            totalAmount += subtotal;
        }

        if (!Number.isFinite(totalAmount)) {
            throw new Error('Invalid order total');
        }

        
const invoiceGeneratedAt = new Date();

const invoiceDate = invoiceGeneratedAt
    .toISOString()
    .slice(0, 10)
    .replaceAll('-', '');

const orderId = new mongoose.Types.ObjectId();

const invoiceNumber = `GC-${invoiceDate}-${orderId.toString().toUpperCase()}`;

const order = await Order.create({
    _id: orderId,
    customer: req.user.id,
    items: orderItems,
    totalAmount,
    deliveryAddress: {
        fullAddress: fullAddress.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: String(pincode)
    },
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING',

    // Invoice details
    invoiceNumber,
    invoiceGeneratedAt
});

        return res.status(201).json({
            message: 'Order placed successfully',
            order
        });

    } catch (error) {
        // Restore stock if order creation or processing fails.
        for (const item of updatedProducts) {
            await Product.updateOne(
                { _id: item.productId },
                { $inc: { stock: item.quantity } }
            );
        }

        console.error('Place Order Error:', error);

        return res.status(400).json({
            message: error.message || 'Unable to place order'
        });
    }
});


// ==========================================
// GET LOGGED-IN CUSTOMER'S ORDERS
// GET /api/orders/my-orders
// ==========================================

router.get('/my-orders', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        const orders = await Order.find({
            customer: req.user.id
        })
            .populate('items.product', 'name image')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Orders fetched successfully',
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error('Fetch Orders Error:', error);

        return res.status(500).json({
            message: 'Unable to fetch orders'
        });
    }
});


// ==========================================
// DOWNLOAD CUSTOMER INVOICE
// GET /api/orders/:id/invoice
// ==========================================

router.get('/:id/invoice', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid order ID'
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            customer: req.user.id
        }).populate('customer', 'name email phone');

        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        if (!order.invoiceNumber) {
            return res.status(409).json({
                message: 'Invoice is not available for this order'
            });
        }

        const doc = generateInvoice(order, order.customer);

        const filename = `${order.invoiceNumber}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );

        doc.on('error', (error) => {
            console.error('Invoice PDF Error:', error);

            if (!res.headersSent) {
                res.status(500).end('Unable to generate invoice');
            } else {
                res.destroy(error);
            }
        });

        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('Download Invoice Error:', error);

        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Unable to download invoice'
            });
        }
    }
});


// ==========================================
// GET ONE CUSTOMER ORDER
// GET /api/orders/:id
// ==========================================

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid order ID'
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            customer: req.user.id
        }).populate('items.product', 'name image');

        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        return res.status(200).json({
            message: 'Order fetched successfully',
            order
        });

    } catch (error) {
        console.error('Fetch Order Error:', error);

        return res.status(500).json({
            message: 'Unable to fetch order'
        });
    }
});

export default router;
