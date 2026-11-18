import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import {
    requestCustomerSignupOtp,
    verifyCustomerSignupOtp,
    requestTechnicianSignupOtp,
    verifyTechnicianSignupOtp,
    getAllCustomersForAdmin,
    getAllTechniciansForAdmin,
    updateTechnicianApprovalStatus,
    deleteTechnicianForAdmin,
    requestAdminPasswordReset,
    verifyAdminPasswordResetOtp,
    resetAdminPassword,
    requestTechnicianPasswordReset,
    verifyTechnicianPasswordResetOtp,
    resetTechnicianPassword,
    requestCustomerPasswordReset,
    verifyCustomerPasswordResetOtp,
    resetCustomerPassword,
    requestGoogleCustomerSignupOtp,
    verifyGoogleCustomerSignupOtp,
    adminLogin,
    customerLogin,
    adminGoogleLogin,
    technicianLogin,
    getCustomerProfile,
    customerGoogleLogin,
    technicianGoogleLogin,
    technicianGoogleSignup,
    updateCustomerProfile,
    getTechnicianProfile,
    updateTechnicianProfile,
    getAdminDashboardStats,
    changePassword,
    getAdminProfile,
    updateAdminProfile,
    getCustomerAddresses,
    addCustomerAddress,
    updateCustomerAddress,
    setDefaultCustomerAddress,
    deleteCustomerAddress
} from '../controllers/userController.js';

const router = express.Router();

// POST /customer/signup/request-otp
router.post('/customer/signup/request-otp', requestCustomerSignupOtp);

// POST /customer/signup/verify-otp
router.post('/customer/signup/verify-otp', verifyCustomerSignupOtp);

// POST /technician/signup/request-otp
router.post('/technician/signup/request-otp', upload.single('profilePhoto'), requestTechnicianSignupOtp);

// POST /technician/signup/verify-otp
router.post('/technician/signup/verify-otp', verifyTechnicianSignupOtp);

// GET /admin/customers
router.get('/admin/customers', authMiddleware, getAllCustomersForAdmin);

// GET /admin/technicians
router.get('/admin/technicians', authMiddleware, getAllTechniciansForAdmin);

// PUT /admin/technicians/:id/status
router.put('/admin/technicians/:id/status', authMiddleware, updateTechnicianApprovalStatus);

// DELETE /admin/technicians/:id
router.delete('/admin/technicians/:id', authMiddleware, deleteTechnicianForAdmin);

// POST /admin/forgot-password
router.post('/admin/forgot-password', requestAdminPasswordReset);

// POST /admin/verify-reset-otp
router.post('/admin/verify-reset-otp', verifyAdminPasswordResetOtp);

// POST /admin/reset-password
router.post('/admin/reset-password', resetAdminPassword);

// POST /technician/forgot-password
router.post('/technician/forgot-password', requestTechnicianPasswordReset);

// POST /technician/verify-reset-otp
router.post('/technician/verify-reset-otp', verifyTechnicianPasswordResetOtp);

// POST /technician/reset-password
router.post('/technician/reset-password', resetTechnicianPassword);

// POST /customer/forgot-password
router.post('/customer/forgot-password', requestCustomerPasswordReset);

// POST /customer/verify-reset-otp
router.post('/customer/verify-reset-otp', verifyCustomerPasswordResetOtp);

// POST /customer/reset-password
router.post('/customer/reset-password', resetCustomerPassword);

// POST /admin/login
router.post('/admin/login', adminLogin);

// POST /customer/login
router.post('/customer/login', customerLogin);

// POST /admin/google-login
router.post('/admin/google-login', adminGoogleLogin);

// POST /technician/login
router.post('/technician/login', technicianLogin);

// GET /customer/profile
router.get('/customer/profile', authMiddleware, getCustomerProfile);

// POST /customer/google-login
router.post('/customer/google-login', customerGoogleLogin);

// POST /technician/google-login
router.post('/technician/google-login', technicianGoogleLogin);

// POST /technician/google-signup
router.post('/technician/google-signup', upload.single('profilePhoto'), technicianGoogleSignup);

// PUT /customer/profile
router.put('/customer/profile', authMiddleware, updateCustomerProfile);

// GET /technician/profile
router.get('/technician/profile', authMiddleware, getTechnicianProfile);

// PUT /technician/profile
router.put('/technician/profile', authMiddleware, updateTechnicianProfile);

// GET /admin/dashboard-stats
router.get('/admin/dashboard-stats', authMiddleware, getAdminDashboardStats);

// PUT /change-password
router.put('/change-password', authMiddleware, changePassword);

// GET /admin/profile
router.get('/admin/profile', authMiddleware, getAdminProfile);

// PUT /admin/profile
router.put('/admin/profile', authMiddleware, updateAdminProfile);

// GET /customer/addresses
router.get('/customer/addresses', authMiddleware, getCustomerAddresses);

// POST /customer/addresses
router.post('/customer/addresses', authMiddleware, addCustomerAddress);

// PUT /customer/addresses/:addressId
router.put('/customer/addresses/:addressId', authMiddleware, updateCustomerAddress);

// PATCH /customer/addresses/:addressId/default
router.patch('/customer/addresses/:addressId/default', authMiddleware, setDefaultCustomerAddress);

// DELETE /customer/addresses/:addressId
router.delete('/customer/addresses/:addressId', authMiddleware, deleteCustomerAddress);

// POST /customer/google-signup/request-otp
router.post('/customer/google-signup/request-otp',requestGoogleCustomerSignupOtp);

// POST /customer/google-signup/verify-otp
router.post('/customer/google-signup/verify-otp',verifyGoogleCustomerSignupOtp);

export default router;
