
import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        enum: ['Domestic', 'Commercial'],
        unique: true
    },

    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    }

}, { timestamps: true });

const ServiceCategory = mongoose.model(
    'ServiceCategory',
    serviceCategorySchema
);

export default ServiceCategory;
