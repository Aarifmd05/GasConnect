
import express from 'express';
import mongoose from 'mongoose';

import Product from '../models/Product.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();


// Helper - Validate product ID
const isValidProductId = (id) => {
    return mongoose.isValidObjectId(id);
};


// Helper - Validate product fields
const validateProduct = (data, isUpdate = false) => {

    const {
        name,
        description,
        category,
        price,
        stock,
        image,
        isAvailable
    } = data;

    if (!isUpdate || name !== undefined) {
        if (
            typeof name !== 'string' ||
            name.trim().length < 2 ||
            name.trim().length > 100
        ) {
            return 'Product name must contain 2 to 100 characters';
        }
    }

    if (!isUpdate || description !== undefined) {
        if (
            typeof description !== 'string' ||
            !description.trim() ||
            description.trim().length > 500
        ) {
            return 'Please provide a valid product description';
        }
    }

    if (!isUpdate || category !== undefined) {
        if (
            typeof category !== 'string' ||
            !category.trim() ||
            category.trim().length > 100
        ) {
            return 'Please provide a valid product category';
        }
    }

    if (!isUpdate || price !== undefined) {
        if (
            typeof price !== 'number' ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            return 'Price must be a valid non-negative number';
        }
    }

    if (stock !== undefined) {
        if (
            !Number.isSafeInteger(stock) ||
            stock < 0
        ) {
            return 'Stock must be a non-negative integer';
        }
    } else if (!isUpdate) {
        // New products start with zero stock if omitted.
    }

    if (image !== undefined) {
        if (
            typeof image !== 'string' ||
            image.length > 1000
        ) {
            return 'Image must be a valid text URL';
        }
    }

    if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
        return 'Availability must be true or false';
    }

    return null;
};


// POST - Admin adds a new product
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can add products'
            });
        }

        const {
            name,
            description,
            category,
            price,
            stock,
            image
        } = req.body;

        const validationError = validateProduct({
            name,
            description,
            category,
            price,
            stock,
            image
        });

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const newProduct = new Product({
            name: name.trim(),
            description: description.trim(),
            category: category.trim(),
            price,
            stock: stock === undefined ? 0 : stock,
            image: image || ''
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            message: 'Product added successfully',
            product: savedProduct
        });

    } catch (error) {
        console.error('Add product error:', error.message);

        res.status(500).json({
            message: 'Failed to add product'
        });
    }
});


// GET - View all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Products fetched successfully',
            count: products.length,
            products
        });

    } catch (error) {
        console.error('Fetch products error:', error.message);

        res.status(500).json({
            message: 'Failed to fetch products'
        });
    }
});


// GET - Admin views low-stock products
router.get('/admin/low-stock', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can view low-stock products'
            });
        }

        const products = await Product.find({
            stock: { $lte: 5 }
        }).sort({ stock: 1 });

        res.status(200).json({
            message: 'Low-stock products fetched successfully',
            count: products.length,
            products
        });

    } catch (error) {
        console.error('Low-stock error:', error.message);

        res.status(500).json({
            message: 'Failed to fetch low-stock products'
        });
    }
});


// PUT - Admin restocks a product
router.put('/admin/restock/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can restock products'
            });
        }

        if (!isValidProductId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid product ID'
            });
        }

        const { quantity } = req.body;

        if (
            !Number.isSafeInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                message: 'Quantity must be a positive integer'
            });
        }

        // Atomic stock increment
        const product = await Product.findOneAndUpdate(
            {
                _id: req.params.id,
                stock: { $lte: Number.MAX_SAFE_INTEGER - quantity }
            },
            {
                $inc: { stock: quantity }
            },
            {
                new: true
            }
        );

        if (!product) {
            return res.status(404).json({
                message: 'Product not found or stock limit exceeded'
            });
        }

        res.status(200).json({
            message: 'Product restocked successfully',
            product
        });

    } catch (error) {
        console.error('Restock error:', error.message);

        res.status(500).json({
            message: 'Failed to restock product'
        });
    }
});


// PUT - Admin updates product details and stock
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can update products'
            });
        }

        if (!isValidProductId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid product ID'
            });
        }

        const allowedFields = [
            'name',
            'description',
            'category',
            'price',
            'stock',
            'image',
            'isAvailable'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: 'Please provide at least one field to update'
            });
        }

        const validationError = validateProduct(updates, true);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        // Trim text fields
        if (updates.name !== undefined) {
            updates.name = updates.name.trim();
        }

        if (updates.description !== undefined) {
            updates.description = updates.description.trim();
        }

        if (updates.category !== undefined) {
            updates.category = updates.category.trim();
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.status(200).json({
            message: 'Product updated successfully',
            product: updatedProduct
        });

    } catch (error) {
        console.error('Update product error:', error.message);

        res.status(500).json({
            message: 'Failed to update product'
        });
    }
});


// DELETE - Admin deletes a product
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Only admins can delete products'
            });
        }

        if (!isValidProductId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid product ID'
            });
        }

        const deletedProduct = await Product.findByIdAndDelete(
            req.params.id
        );

        if (!deletedProduct) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.status(200).json({
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Delete product error:', error.message);

        res.status(500).json({
            message: 'Failed to delete product'
        });
    }
});

export default router;
