
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    HardHat,
    CalendarCheck,
    Wrench,
    Layers,
    Package,
    Star,
    Settings,
    LogOut,
    Menu,
    Bell,
    Search,
    UserCircle,
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    XCircle,
    Plus,
    Pencil,
    Trash2,
    ShoppingBag,
    Save,
    X
} from 'lucide-react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import AdminSidebar from './components/AdminSidebar';

// Section components
import DashboardSection from './sections/DashboardSection';
import CustomersSection from './sections/CustomersSection';
import TechniciansSection from './sections/TechniciansSection';
import BookingsSection from './sections/BookingsSection';
import RepairTypesSection from './sections/RepairTypesSection';
import ServiceCategoriesSection from './sections/ServiceCategoriesSection';
import ProductsSection from './sections/ProductsSection';
import ReviewsSection from './sections/ReviewsSection';
import SettingsSection from './sections/SettingsSection';
import OrdersSection from './sections/OrdersSection';

function AdminDashboard() {
    const navigate = useNavigate();

    // General dashboard states
    const [activeMenu, setActiveMenu] = useState('Dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Dashboard statistics
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalTechnicians: 0,
        pendingApprovals: 0,
        totalBookings: 0
    });

const handleInvoiceDownload = async (orderId, action = 'download') => {
    let invoiceWindow = null;

    try {
        // Open a blank tab immediately for PDF viewing
        if (action === 'view') {
            invoiceWindow = window.open('', '_blank');

            if (!invoiceWindow) {
                alert('Please allow pop-ups to view the invoice.');
                return;
            }
        }

        const token = getToken();

if (!token) {
            if (invoiceWindow) invoiceWindow.close();
            navigate('/admin/login');
            return;
        }

        const response = await axios.get(
            `http://localhost:3006/api/orders/${orderId}/invoice`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                responseType: 'blob'
            }
        );

        const pdfBlob = new Blob([response.data], {
            type: 'application/pdf'
        });

        const pdfUrl = window.URL.createObjectURL(pdfBlob);

        if (action === 'view') {
            invoiceWindow.location.href = pdfUrl;
        } else {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = 'GasConnect-Invoice.pdf';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        setTimeout(() => {
            window.URL.revokeObjectURL(pdfUrl);
        }, 60000);

    } catch (error) {
        if (invoiceWindow) {
            invoiceWindow.close();
        }

        console.error('Invoice Error:', error);
        alert('Unable to retrieve invoice. Please try again.');
    }
};

    // Fetch all customer orders
const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');

    try {
        const token = getToken();

        if (!token) {
            navigate('/admin/login');
            return;
        }

        const response = await axios.get(
            'http://localhost:3006/api/orders/admin/all',
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        setOrders(response.data.orders || []);
    } catch (error) {
        console.error('Error fetching orders:', error);

        if (handleAuthError(error)) return;

        setOrdersError(
            error.response?.data?.message ||
            'Unable to load customer orders. Please try again.'
        );
    } finally {
        setOrdersLoading(false);
    }
};
     
     // Update customer order status
const handleOrderStatusUpdate = async (orderId, orderStatus) => {
    const confirmed = window.confirm(
        `Are you sure you want to change this order status to ${orderStatus}?`
    );

    if (!confirmed) return;

    try {
        const token = getToken();

        if (!token) {
            navigate('/admin/login');
            return;
        }

        const response = await axios.put(
            `http://localhost:3006/api/orders/admin/${orderId}/status`,
            { orderStatus },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        await fetchOrders();

        // Refresh inventory when an order is cancelled
        if (orderStatus === 'CANCELLED') {
            await fetchProducts();
        }

        window.alert(
            response.data.message || 'Order status updated successfully.'
        );
    } catch (error) {
        console.error('Error updating order status:', error);

        if (handleAuthError(error)) return;

        window.alert(
            error.response?.data?.message ||
            'Unable to update order status.'
        );
    }
};

    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState('');

    // Customers management
    const [customers, setCustomers] = useState([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [customersError, setCustomersError] = useState('');

    // Technicians management
    const [technicians, setTechnicians] = useState([]);
    const [techniciansLoading, setTechniciansLoading] = useState(false);
    const [techniciansError, setTechniciansError] = useState('');
    const [updatingTechnician, setUpdatingTechnician] = useState('');
    const [deletingTechnician, setDeletingTechnician] = useState('');

    // Bookings management
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [bookingsError, setBookingsError] = useState('');
    const [assigningBooking, setAssigningBooking] = useState('');
    const [selectedTechnicians, setSelectedTechnicians] = useState({});
    const [approvedTechnicians, setApprovedTechnicians] = useState([]);

    // Repair Types management
    const [repairTypes, setRepairTypes] = useState([]);
    const [repairTypesLoading, setRepairTypesLoading] = useState(false);
    const [repairTypesError, setRepairTypesError] = useState('');

    const [repairForm, setRepairForm] = useState({
        name: '',
        description: '',
        category: '',
        price: ''
    });

    const [editingRepairId, setEditingRepairId] = useState('');
    const [savingRepair, setSavingRepair] = useState(false);
    const [deletingRepairId, setDeletingRepairId] = useState('');

    // Service Categories management
    const [serviceCategories, setServiceCategories] = useState([]);
    const [serviceCategoriesLoading, setServiceCategoriesLoading] = useState(false);
    const [serviceCategoriesError, setServiceCategoriesError] = useState('');

    // Products management
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState('');

    // Reviews management
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState('');

       // Orders Management
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState('');

    // Get authentication token
    const getToken = () => sessionStorage.getItem('token');

    // Handle authentication errors
    const handleAuthError = (error) => {
        if (
            error.response?.status === 401 ||
            error.response?.status === 403
        ) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            navigate('/admin/login');
            return true;
        }

        return false;
    };

    // Fetch dashboard statistics
    const fetchDashboardStats = async () => {
        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return;
            }

            const response = await axios.get(
                'http://localhost:3006/api/users/admin/dashboard-stats',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setStats(response.data.stats);
        } catch (error) {
            console.error('Dashboard statistics error:', error);

            if (handleAuthError(error)) return;

            setStatsError('Unable to load dashboard statistics.');
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    // Fetch customers
    useEffect(() => {
        if (activeMenu !== 'Customers') return;

        const fetchCustomers = async () => {
            setCustomersLoading(true);
            setCustomersError('');

            try {
                const token = getToken();

                if (!token) {
                    navigate('/admin/login');
                    return;
                }

                const response = await axios.get(
                    'http://localhost:3006/api/users/admin/customers',
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setCustomers(response.data.customers || []);
            } catch (error) {
                console.error('Fetch customers error:', error);

                if (handleAuthError(error)) return;

                setCustomersError('Unable to load customers. Please try again.');
            } finally {
                setCustomersLoading(false);
            }
        };

        fetchCustomers();
    }, [activeMenu]);

    useEffect(() => {
    if (activeMenu === 'Orders') {
        fetchOrders();
    }
}, [activeMenu]);

    // Fetch technicians
    const fetchTechnicians = async () => {
        setTechniciansLoading(true);
        setTechniciansError('');

        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return;
            }

            const response = await axios.get(
                'http://localhost:3006/api/users/admin/technicians',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setTechnicians(response.data.technicians || []);
        } catch (error) {
            console.error('Fetch technicians error:', error);

            if (handleAuthError(error)) return;

            setTechniciansError('Unable to load technicians. Please try again.');
        } finally {
            setTechniciansLoading(false);
        }
    };

    useEffect(() => {
        if (activeMenu === 'Technicians') {
            fetchTechnicians();
        }
    }, [activeMenu, navigate]);

    // Approve or reject technician
    const handleTechnicianStatus = async (technicianId, approvalStatus) => {
        const action = approvalStatus === 'approved' ? 'approve' : 'reject';

        const confirmed = window.confirm(
            `Are you sure you want to ${action} this technician?`
        );

        if (!confirmed) return;

        setUpdatingTechnician(technicianId);

        try {
            const token = getToken();

            await axios.put(
                `http://localhost:3006/api/users/admin/technicians/${technicianId}/status`,
                { approvalStatus },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await fetchTechnicians();
            await fetchDashboardStats();

            window.alert(
                approvalStatus === 'approved'
                    ? 'Technician approved successfully!'
                    : 'Technician rejected successfully!'
            );
        } catch (error) {
            console.error('Technician status update error:', error);

            if (handleAuthError(error)) return;

            window.alert(
                error.response?.data?.message ||
                'Unable to update technician status.'
            );
        } finally {
            setUpdatingTechnician('');
        }
    };

    
const handleDeleteTechnician = async (technician) => {
    const confirmed = window.confirm(
        `Are you sure you want to permanently delete ${technician.name}'s account?\n\nTheir login credentials and profile will be deleted. This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingTechnician(technician._id);

    try {
        const token = getToken();

        if (!token) {
            navigate('/admin/login');
            return;
        }

        const response = await axios.delete(
            `http://localhost:3006/api/users/admin/technicians/${technician._id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        await fetchTechnicians();
        await fetchDashboardStats();

        window.alert(
            response.data.message || 'Technician deleted successfully!'
        );

    } catch (error) {
        console.error('Delete technician error:', error);

        if (handleAuthError(error)) return;

        window.alert(
            error.response?.data?.message ||
            'Unable to delete technician. Please try again.'
        );

    } finally {
        setDeletingTechnician('');
    }
};


    // Fetch all bookings for admin
    const fetchBookings = async () => {
        setBookingsLoading(true);
        setBookingsError('');

        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return;
            }

            const [bookingResponse, technicianResponse] = await Promise.all([
                axios.get(
                    'http://localhost:3006/api/bookings/admin/all',
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                ),
                axios.get(
                    'http://localhost:3006/api/users/admin/technicians',
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                )
            ]);

            setBookings(bookingResponse.data.bookings || []);

            setApprovedTechnicians(
                (technicianResponse.data.technicians || []).filter(
                    technician => technician.approvalStatus === 'approved'
                )
            );
        } catch (error) {
            console.error('Fetch bookings error:', error);

            if (handleAuthError(error)) return;

            setBookingsError(
                error.response?.data?.message ||
                'Unable to load bookings. Please try again.'
            );
        } finally {
            setBookingsLoading(false);
        }
    };

    useEffect(() => {
        if (activeMenu === 'Bookings') {
            fetchBookings();
        }
    }, [activeMenu]);

    // ==========================================
    // REPAIR TYPES MANAGEMENT
    // ==========================================

    // Fetch repair types and service categories
    const fetchRepairTypes = async () => {
        setRepairTypesLoading(true);
        setRepairTypesError('');

        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return;
            }

            const response = await axios.get(
                'http://localhost:3006/api/repairs',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRepairTypes(response.data.repairs || []);

        } catch (error) {
            console.error('Fetch repair types error:', error);

            if (handleAuthError(error)) return;

            setRepairTypesError(
                error.response?.data?.message ||
                'Unable to load repair types. Please try again.'
            );
        } finally {
            setRepairTypesLoading(false);
        }
    };

    // ==========================================
    // SERVICE CATEGORIES MANAGEMENT
    // ==========================================

    // Fetch service categories
    const fetchCategories = async () => {
        setServiceCategoriesLoading(true);
        setServiceCategoriesError('');

        const token = getToken();

        if (!token) {
            setServiceCategoriesLoading(false);
            navigate('/admin/login');
            return;
        }

        try {
            const response = await axios.get(
                'http://localhost:3006/api/service-categories',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    timeout: 10000
                }
            );

            const fetchedCategories = Array.isArray(response.data)
                ? response.data
                : response.data.categories || [];

            setServiceCategories(fetchedCategories);

        } catch (error) {
            console.error('Fetch service categories error:', error);

            if (handleAuthError(error)) return;

            setServiceCategoriesError(
                error.code === 'ECONNABORTED'
                    ? 'Request timed out. Please check your backend server.'
                    : error.response?.data?.message ||
                      'Unable to load service categories. Please try again.'
            );

        } finally {
            setServiceCategoriesLoading(false);
        }
    };

    // ==========================================
    // PRODUCTS MANAGEMENT
    // ==========================================

    const fetchProducts = async () => {
        setProductsLoading(true);
        setProductsError('');

        try {
            const response = await axios.get(
                'http://localhost:3006/api/products'
            );

            setProducts(response.data.products || []);

        } catch (error) {
            console.error('Fetch products error:', error);

            setProductsError(
                error.response?.data?.message ||
                'Unable to load products. Please try again.'
            );

        } finally {
            setProductsLoading(false);
        }
    };

    // ==========================================
    // REVIEWS MANAGEMENT
    // ==========================================

    // Fetch all reviews for admin
    const fetchReviews = async () => {
        setReviewsLoading(true);
        setReviewsError('');

        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return;
            }

            const response = await axios.get(
                'http://localhost:3006/api/reviews/admin/all',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setReviews(response.data.reviews || []);

        } catch (error) {
            console.error('Fetch reviews error:', error);

            if (handleAuthError(error)) return;

            setReviewsError(
                error.response?.data?.message ||
                'Unable to load reviews. Please try again.'
            );

        } finally {
            setReviewsLoading(false);
        }
    };

    // Add product
    const handleAddProduct = async (productData) => {
        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            const response = await axios.post(
                'http://localhost:3006/api/products',
                {
                    ...productData,
                    price: Number(productData.price),
                    stock: Number(productData.stock),
                    image: productData.image || ''
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(response.data.message);

            await fetchProducts();

            return true;

        } catch (error) {
            console.error('Add product error:', error);

            if (handleAuthError(error)) {
                return false;
            }

            alert(
                error.response?.data?.message ||
                'Unable to add product. Please try again.'
            );

            return false;
        }
    };

    // Update product
    const handleUpdateProduct = async (productId, productData) => {
        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            const response = await axios.put(
                `http://localhost:3006/api/products/${productId}`,
                {
                    ...productData,
                    price: Number(productData.price),
                    stock: Number(productData.stock),
                    image: productData.image || ''
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(response.data.message);

            await fetchProducts();

            return true;

        } catch (error) {
            console.error('Update product error:', error);

            if (handleAuthError(error)) {
                return false;
            }

            alert(
                error.response?.data?.message ||
                'Unable to update product. Please try again.'
            );

            return false;
        }
    };

    // Delete product
    const handleDeleteProduct = async (productId) => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this product?'
        );

        if (!confirmDelete) {
            return false;
        }

        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            const response = await axios.delete(
                `http://localhost:3006/api/products/${productId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(response.data.message);

            await fetchProducts();

            return true;

        } catch (error) {
            console.error('Delete product error:', error);

            if (handleAuthError(error)) {
                return false;
            }

            alert(
                error.response?.data?.message ||
                'Unable to delete product. Please try again.'
            );

            return false;
        }
    };

    // Restock product
    const handleRestockProduct = async (productId) => {
        const quantity = window.prompt(
            'Enter the quantity you want to add:'
        );

        if (quantity === null) {
            return false;
        }

        const restockQuantity = Number(quantity);

        if (
            !Number.isSafeInteger(restockQuantity) ||
            restockQuantity <= 0
        ) {
            alert('Please enter a valid positive whole number.');
            return false;
        }

        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            const response = await axios.put(
                `http://localhost:3006/api/products/admin/restock/${productId}`,
                {
                    quantity: restockQuantity
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(response.data.message);

            await fetchProducts();

            return true;

        } catch (error) {
            console.error('Restock product error:', error);

            if (handleAuthError(error)) {
                return false;
            }

            alert(
                error.response?.data?.message ||
                'Unable to restock product. Please try again.'
            );

            return false;
        }
    };

    // Enable or disable product availability
    const handleToggleAvailability = async (productId, isAvailable) => {
        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            await axios.put(
                `http://localhost:3006/api/products/${productId}`,
                {
                    isAvailable: !isAvailable
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            await fetchProducts();

            return true;

        } catch (error) {
            console.error('Availability update error:', error);

            if (handleAuthError(error)) {
                return false;
            }

            alert(
                error.response?.data?.message ||
                'Unable to update product availability.'
            );

            return false;
        }
    };

    // Load categories and products when admin opens their sections
    useEffect(() => {
        if (activeMenu === 'Service Categories') {
            fetchCategories();
        }

        if (activeMenu === 'Products & Inventory') {
            fetchProducts();
        }
    }, [activeMenu, navigate]);

    // Load repair types when admin opens the section
    useEffect(() => {
        if (activeMenu === 'Repair Types') {
            fetchRepairTypes();
        }
    }, [activeMenu]);

    // Load reviews when admin opens the Reviews section
    useEffect(() => {
        if (activeMenu === 'Reviews') {
            fetchReviews();
        }
    }, [activeMenu]);

    // ==========================================
    // REPAIR TYPES CRUD HANDLERS
    // ==========================================

    // Add repair type
    const handleAddRepairType = async (formData) => {
        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            await axios.post(
                'http://localhost:3006/api/repairs',
                {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    category: formData.category,
                    price: Number(formData.price)
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await fetchRepairTypes();
            window.alert('Repair type added successfully!');
            return true;

        } catch (error) {
            console.error('Add repair type error:', error);

            if (handleAuthError(error)) return false;

            window.alert(
                error.response?.data?.message ||
                'Unable to add repair type.'
            );

            return false;
        }
    };

    // Update repair type
    const handleUpdateRepairType = async (repairId, formData) => {
        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            await axios.put(
                `http://localhost:3006/api/repairs/${repairId}`,
                {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    category: formData.category,
                    price: Number(formData.price)
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await fetchRepairTypes();
            window.alert('Repair type updated successfully!');
            return true;

        } catch (error) {
            console.error('Update repair type error:', error);

            if (handleAuthError(error)) return false;

            window.alert(
                error.response?.data?.message ||
                'Unable to update repair type.'
            );

            return false;
        }
    };

    // Delete repair type
    const handleDeleteRepairType = async (repairId) => {
        setDeletingRepairId(repairId);

        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            await axios.delete(
                `http://localhost:3006/api/repairs/${repairId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await fetchRepairTypes();

            window.alert('Repair type deleted successfully!');
            return true;

        } catch (error) {
            console.error('Delete repair type error:', error);

            if (handleAuthError(error)) return false;

            window.alert(
                error.response?.data?.message ||
                'Unable to delete repair type.'
            );

            return false;

        } finally {
            setDeletingRepairId('');
        }
    };

    // ==========================================
    // SERVICE CATEGORIES CRUD HANDLERS
    // ==========================================

    // Add service category
    const handleAddCategory = async (formData) => {
        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            await axios.post(
                'http://localhost:3006/api/service-categories',
                {
                    name: formData.name,
                    description: formData.description.trim()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await fetchCategories();
            await fetchRepairTypes();

            window.alert('Service category added successfully!');
            return true;

        } catch (error) {
            console.error('Add service category error:', error);

            if (handleAuthError(error)) return false;

            window.alert(
                error.response?.data?.message ||
                'Unable to add service category.'
            );

            return false;
        }
    };

    // Update service category
    const handleUpdateCategory = async (categoryId, formData) => {
        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            await axios.put(
                `http://localhost:3006/api/service-categories/${categoryId}`,
                {
                    name: formData.name,
                    description: formData.description.trim()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await fetchCategories();
            await fetchRepairTypes();

            window.alert('Service category updated successfully!');
            return true;

        } catch (error) {
            console.error('Update service category error:', error);

            if (handleAuthError(error)) return false;

            window.alert(
                error.response?.data?.message ||
                'Unable to update service category.'
            );

            return false;
        }
    };

    // Delete service category
    const handleDeleteCategory = async (categoryId) => {
        try {
            const token = getToken();

            if (!token) {
                navigate('/admin/login');
                return false;
            }

            await axios.delete(
                `http://localhost:3006/api/service-categories/${categoryId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await fetchCategories();
            await fetchRepairTypes();

            window.alert('Service category deleted successfully!');
            return true;

        } catch (error) {
            console.error('Delete service category error:', error);

            if (handleAuthError(error)) return false;

            window.alert(
                error.response?.data?.message ||
                'Unable to delete service category.'
            );

            return false;
        }
    };

    // ==========================================
    // BOOKING ASSIGNMENT
    // ==========================================

    
const handleAssignTechnician = async (bookingId, technicianId = null) => {
    try {
        setAssigningBooking(bookingId);

        const token = getToken();

        if (!token) {
            navigate('/admin/login');
            return;
        }

        const response = await fetch(
            `http://localhost:3006/api/bookings/admin/assign/${bookingId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(
                    technicianId ? { technicianId } : {}
                )
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Assignment failed.');
        }

        window.alert(
            data.message ||
            (technicianId
                ? 'Technician assigned successfully!'
                : 'Booking published to all technicians!')
        );

        setSelectedTechnicians(prev => ({
            ...prev,
            [bookingId]: ''
        }));

        await fetchBookings();

    } catch (error) {
        console.error('Booking assignment error:', error);
        window.alert(error.message || 'Failed to assign booking.');
    } finally {
        setAssigningBooking('');
    }
};


    // ==========================================
    // FILTERING AND HELPER FUNCTIONS
    // ==========================================

    const filteredBookings = bookings.filter((booking) => {
        const search = searchTerm.toLowerCase();

        return (
            booking.customer?.name?.toLowerCase().includes(search) ||
            booking.customer?.email?.toLowerCase().includes(search) ||
            booking.customer?.phone?.toString().includes(search) ||
            booking.repairType?.name?.toLowerCase().includes(search) ||
            booking.status?.toLowerCase().includes(search) ||
            booking.address?.toLowerCase().includes(search) ||
            booking.technician?.name?.toLowerCase().includes(search)
        );
    });

    const filteredCustomers = customers.filter((customer) => {
        const search = searchTerm.toLowerCase();

        return (
            customer.name?.toLowerCase().includes(search) ||
            customer.email?.toLowerCase().includes(search) ||
            customer.phone?.toString().includes(search)
        );
    });

    const filteredTechnicians = technicians.filter((technician) => {
        const search = searchTerm.toLowerCase();

        return (
            technician.name?.toLowerCase().includes(search) ||
            technician.email?.toLowerCase().includes(search) ||
            technician.phone?.toString().includes(search) ||
            technician.specialization?.toLowerCase().includes(search)
        );
    });

    const formatDate = (date) => {
        if (!date) return 'N/A';

        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        if (!date) return 'N/A';

        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusClass = (status) => {
        if (status === 'approved') return 'approved';
        if (status === 'rejected') return 'rejected';
        return 'pending';
    };

    const getBookingStatusClass = (status) => {
        if (status === 'completed' || status === 'accepted') return 'approved';
        if (status === 'rejected' || status === 'cancelled') return 'rejected';
        if (status === 'in-progress') return 'in-progress';
        return 'pending';
    };

    // ==========================================
    // SIDEBAR MENU AND DASHBOARD DATA
    // ==========================================


    const dashboardCards = [
        {
            title: 'Total Customers',
            description: 'Registered customer accounts',
            icon: Users,
            value: stats.totalCustomers
        },
        {
            title: 'Total Technicians',
            description: 'Technician accounts',
            icon: HardHat,
            value: stats.totalTechnicians
        },
        {
            title: 'Pending Approvals',
            description: 'Technicians awaiting approval',
            icon: Clock,
            value: stats.pendingApprovals
        },
        {
            title: 'Total Bookings',
            description: 'All service bookings',
            icon: CalendarCheck,
            value: stats.totalBookings
        }
    ];

    // Logout
    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/admin/login');
    };

    // Change active section
    const handleMenuClick = (name) => {
        setActiveMenu(name);
        setSidebarOpen(false);
        setSearchTerm('');
    };

    return (
    <div className="admin-dashboard">

        {/* Admin Sidebar */}
        <AdminSidebar
            activeMenu={activeMenu}
            onMenuClick={handleMenuClick}
            sidebarOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onLogout={handleLogout}
        />
{/* Main Section */}
            <main className="admin-main">

                {/* Topbar */}
                <header className="admin-topbar">
                    <button
                        className="admin-menu-toggle"
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        aria-label="Toggle sidebar"
                        aria-expanded={sidebarOpen}
                    >
                        <Menu size={25} />
                    </button>

                    <div className="admin-search">
                        <Search size={19} />

                       <input
    type="text"
    placeholder={
        activeMenu === 'Customers'
            ? 'Search customers...'
            : activeMenu === 'Technicians'
                ? 'Search technicians...'
                : activeMenu === 'Bookings'
                    ? 'Search bookings...'
                    : activeMenu === 'Repair Types'
                        ? 'Search repair types...'
                        : activeMenu === 'Service Categories'
                            ? 'Search categories...'
                            : activeMenu === 'Orders'
                                ? 'Search orders...'
                                : activeMenu === 'Reviews'
                                    ? 'Search reviews...'
                                    : 'Search anything...'
    }
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
/>
                    </div>

                    <div className="admin-topbar-right">
                        <button className="admin-notification">
                            <Bell size={22} />
                        </button>

                        <div className="admin-profile">
                            <UserCircle size={36} />

                            <div>
                                <h4>Administrator</h4>
                                <p>Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <section className="admin-content">

                    {/* Dashboard Section */}
                    {activeMenu === 'Dashboard' && (
                        <DashboardSection
                            stats={stats}
                            statsLoading={statsLoading}
                            statsError={statsError}
                            dashboardCards={dashboardCards}
                            handleMenuClick={handleMenuClick}
                        />
                    )}

                    {/* Customers Section */}
                    {activeMenu === 'Customers' && (
                        <CustomersSection
                            customers={customers}
                            customersLoading={customersLoading}
                            customersError={customersError}
                            filteredCustomers={filteredCustomers}
                            searchTerm={searchTerm}
                            formatDate={formatDate}
                        />
                    )}

                    {/* Technicians Section */}
                    {activeMenu === 'Technicians' && (
                        <TechniciansSection
                            technicians={technicians}
                            techniciansLoading={techniciansLoading}
                            techniciansError={techniciansError}
                            filteredTechnicians={filteredTechnicians}
                            updatingTechnician={updatingTechnician}
                            handleDeleteTechnician={handleDeleteTechnician}
                            deletingTechnician={deletingTechnician}
                            handleTechnicianStatus={handleTechnicianStatus}
                            fetchTechnicians={fetchTechnicians}
                            formatDate={formatDate}
                            getStatusClass={getStatusClass}
                            searchTerm={searchTerm}
                        />
                    )}

                    {/* Bookings Section */}
                    {activeMenu === 'Bookings' && (
                        <BookingsSection
                            bookings={bookings}
                            bookingsLoading={bookingsLoading}
                            bookingsError={bookingsError}
                            filteredBookings={filteredBookings}
                            approvedTechnicians={approvedTechnicians}
                            selectedTechnicians={selectedTechnicians}
                            assigningBooking={assigningBooking}
                            setSelectedTechnicians={setSelectedTechnicians}
                            handleAssignTechnician={handleAssignTechnician}
                            fetchBookings={fetchBookings}
                            formatDateTime={formatDateTime}
                            getBookingStatusClass={getBookingStatusClass}
                            searchTerm={searchTerm}
                        />
                    )}

                    {/* Repair Types Section */}
                    {activeMenu === 'Repair Types' && (
                        <RepairTypesSection
                            repairTypes={repairTypes}
                            serviceCategories={serviceCategories}
                            repairTypesLoading={repairTypesLoading}
                            repairTypesError={repairTypesError}
                            fetchRepairTypes={fetchRepairTypes}
                            handleAddRepairType={handleAddRepairType}
                            handleUpdateRepairType={handleUpdateRepairType}
                            handleDeleteRepairType={handleDeleteRepairType}
                            searchTerm={searchTerm}
                        />
                    )}

                    {/* Service Categories Section */}
                    {activeMenu === 'Service Categories' && (
                        <ServiceCategoriesSection
                            serviceCategories={serviceCategories}
                            serviceCategoriesLoading={serviceCategoriesLoading}
                            serviceCategoriesError={serviceCategoriesError}
                            fetchCategories={fetchCategories}
                            handleAddCategory={handleAddCategory}
                            handleUpdateCategory={handleUpdateCategory}
                            handleDeleteCategory={handleDeleteCategory}
                            searchTerm={searchTerm}
                        />
                    )}

                    {/* Products Section */}
                    {activeMenu === 'Products & Inventory' && (
                        <ProductsSection
                            products={products}
                            productsLoading={productsLoading}
                            productsError={productsError}
                            fetchProducts={fetchProducts}
                            handleAddProduct={handleAddProduct}
                            handleUpdateProduct={handleUpdateProduct}
                            handleDeleteProduct={handleDeleteProduct}
                            handleRestockProduct={handleRestockProduct}
                            handleToggleAvailability={handleToggleAvailability}
                            searchTerm={searchTerm}
                        />
                    )}

                    {/* Orders Section */}
{activeMenu === 'Orders' && (
    <OrdersSection
        orders={orders}
        ordersLoading={ordersLoading}
        ordersError={ordersError}
        fetchOrders={fetchOrders}
        handleOrderStatusUpdate={handleOrderStatusUpdate}
        handleInvoiceDownload={handleInvoiceDownload}
        searchTerm={searchTerm}
    />
)}

                    {/* Reviews Section */}
                    {activeMenu === 'Reviews' && (
                        <ReviewsSection
                            reviews={reviews}
                            reviewsLoading={reviewsLoading}
                            reviewsError={reviewsError}
                            fetchReviews={fetchReviews}
                            searchTerm={searchTerm}
                        />
                    )}

                    {/* Settings Section */}
                    {activeMenu === 'Settings' && (
                        <SettingsSection />
                    )}

                </section>
            </main>
        </div>
    );
}

export default AdminDashboard;
