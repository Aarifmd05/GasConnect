
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access token is required.' });
        }

        const token = authHeader.split(' ')[1];

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'JWT secret is not configured.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id || !decoded.role) {
            return res.status(401).json({ message: 'Invalid access token.' });
        }

        const user = await User.findById(decoded.id).select('_id role approvalStatus');

        if (!user) {
            return res.status(401).json({ message: 'User account not found.' });
        }

        if (user.role !== decoded.role) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (user.role === 'technician' && user.approvalStatus !== 'approved') {
            return res.status(403).json({
                message: user.approvalStatus === 'rejected'
                    ? 'Your technician application has been rejected.'
                    : 'Your technician account is awaiting admin approval.'
            });
        }

        req.user = {
            ...decoded,
            role: user.role,
            approvalStatus: user.approvalStatus
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid or expired access token.' });
        }

        console.error('Authentication middleware error:', error);
        return res.status(500).json({ message: 'Authentication failed.' });
    }
};

export default authMiddleware;
