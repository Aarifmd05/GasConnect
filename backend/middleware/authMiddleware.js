
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is missing');
            return res.status(500).json({
                message: 'Server authentication configuration error'
            });
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Access denied. Please login first.'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Authentication token is missing'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (
            !decoded.id ||
            !['customer', 'admin', 'technician'].includes(decoded.role)
        ) {
            return res.status(401).json({
                message: 'Invalid authentication token'
            });
        }

        // Verify that the account still exists
        const user = await User.findById(decoded.id).select('_id role');

        if (!user || user.role !== decoded.role) {
            return res.status(401).json({
                message: 'Your account no longer exists or is invalid.'
            });
        }

        req.user = {
            ...decoded,
            role: user.role
        };

        next();

    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError'
        ) {
            return res.status(401).json({
                message: 'Invalid or expired token'
            });
        }

        console.error('Authentication error:', error);

        return res.status(500).json({
            message: 'Authentication failed. Please try again.'
        });
    }
};

export default authMiddleware;
