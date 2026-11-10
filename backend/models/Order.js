
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const deliveryAddressSchema = new mongoose.Schema({
    fullAddress: {
        type: String,
        required: true,
        trim: true
    },
    landmark: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true,
        match: /^\d{6}$/
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: items => items.length > 0,
            message: 'An order must contain at least one product'
        }
    },

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    deliveryAddress: {
        type: deliveryAddressSchema,
        required: true
    },

    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE'],
        default: 'COD'
    },

    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },

    orderStatus: {
        type: String,
        enum: [
            'PENDING',
            'CONFIRMED',
            'PACKED',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED'
        ],
        default: 'PENDING'
    },

    // Invoice information
    invoiceNumber: {
        type: String,
        unique: true,
        sparse: true
    },

    invoiceGeneratedAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
