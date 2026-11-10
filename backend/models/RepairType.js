
import mongoose from 'mongoose';

const repairTypeSchema = new mongoose.Schema({

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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCategory',
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    }

}, { timestamps: true });

const RepairType = mongoose.model(
    'RepairType',
    repairTypeSchema
);

export default RepairType;
