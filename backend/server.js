
import 'dotenv/config';

import path from 'path';
import cors from 'cors';
import express from 'express';

import connectDB from './db.js';

import userRoutes from './routes/userRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import repairRoutes from './routes/repairRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import productRoutes from './routes/productRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import serviceCategoryRoutes from './routes/serviceCategoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';



const app = express();

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '10kb' }));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);

// Test API
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to GasConnect Backend!',
        status: 'Running'
    });
});

// Handle invalid JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            message: 'Invalid JSON request body'
        });
    }

    next(err);
});

// General error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);

    res.status(500).json({
        message: 'Internal Server Error'
    });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 3006;

        app.listen(PORT, () => {
            console.log(`GasConnect server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start GasConnect:', error.message);
        process.exit(1);
    }
};

startServer();
