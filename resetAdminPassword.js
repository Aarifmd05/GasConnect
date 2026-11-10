import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const resetAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        const admin = await User.findOne({
            email: 'mahuaarif191@gmail.com',
            role: 'admin'
        });

        if (!admin) {
            console.log('Admin account not found');
            return;
        }

        // Replace this with your own new password.
        const newPassword = 'admin123';

        admin.password = newPassword;

        await admin.save();

        console.log('Admin password reset successfully!');
    } catch (error) {
        console.error('Password reset failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

resetAdminPassword();
