
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },

    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },

    category: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    stock: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isSafeInteger,
            message: 'Stock must be a non-negative integer'
        },
        default: 0
    },

    image: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },

    isAvailable: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
