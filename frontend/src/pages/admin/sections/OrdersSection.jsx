import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShoppingBag, Package, MapPin, CalendarDays, Eye, X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import './OrdersSection.css';

function OrdersSection({
    orders = [],
    ordersLoading,
    ordersError,
    fetchOrders,
    handleOrderStatusUpdate,
    handleInvoiceDownload,
    searchTerm = ''
}) {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [paymentFilter, setPaymentFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Reset pagination whenever the search or filters change.
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, paymentFilter, pageSize]);

    // Search and filter orders.
    const filteredOrders = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return orders.filter((order) => {
            const customerName = order.customer?.name?.toLowerCase() || '';
            const customerEmail = order.customer?.email?.toLowerCase() || '';
            const orderId = order._id?.toLowerCase() || '';
            const invoiceNumber = order.invoiceNumber?.toLowerCase() || '';
            const productNames = order.items
                ?.map((item) => item.productName || item.product?.name || '')
                .join(' ')
                .toLowerCase() || '';

            const matchesSearch = !search || (
                customerName.includes(search) ||
                customerEmail.includes(search) ||
                orderId.includes(search) ||
                invoiceNumber.includes(search) ||
                productNames.includes(search)
            );

            const orderStatus = (order.orderStatus || 'PENDING').toUpperCase();
            const paymentStatus = (order.paymentStatus || 'PENDING').toUpperCase();

            const matchesStatus = statusFilter === 'ALL' || orderStatus === statusFilter;
            const matchesPayment = paymentFilter === 'ALL' || paymentStatus === paymentFilter;

            return matchesSearch && matchesStatus && matchesPayment;
        });
    }, [orders, searchTerm, statusFilter, paymentFilter]);

    // Pagination calculations.
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredOrders.length);
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    // Keep the selected page valid if orders are removed or updated.
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Format date.
    const formatDate = (date) => {
        if (!date) return 'N/A';

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return 'N/A';

        return parsedDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format currency.
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(Number(amount) || 0);
    };

    // Available order status transitions.
    const getAvailableStatuses = (status) => {
        const transitions = {
            PENDING: ['CONFIRMED', 'CANCELLED'],
            CONFIRMED: ['PACKED', 'CANCELLED'],
            PACKED: ['SHIPPED', 'CANCELLED'],
            SHIPPED: ['DELIVERED'],
            DELIVERED: [],
            CANCELLED: []
        };

        return transitions[(status || 'PENDING').toUpperCase()] || [];
    };

    // Status CSS class.
    const getStatusClass = (status) => {
        return `orders-status orders-status-${(status || 'pending').toLowerCase()}`;
    };

    // Reset only the filters managed by this section.
    const handleResetFilters = () => {
        setStatusFilter('ALL');
        setPaymentFilter('ALL');
        setCurrentPage(1);
    };

    // Loading state.
    if (ordersLoading) {
        return (
            <div className="orders-loading">
                <RefreshCw className="orders-spinner" size={28} />
                <p>Loading customer orders...</p>
            </div>
        );
    }

    return (
        <div className="admin-orders-section">

            {/* Header */}
            <div className="orders-header">
                <div>
                    <h2>Customer Orders</h2>
                    <p>Manage product orders placed by customers.</p>
                </div>

                <button
                    type="button"
                    className="orders-refresh-btn"
                    onClick={fetchOrders}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="orders-summary">
                <div className="orders-summary-card">
                    <div className="orders-summary-icon">
                        <ShoppingBag size={22} />
                    </div>
                    <div>
                        <h3>{orders.length}</h3>
                        <p>Total Orders</p>
                    </div>
                </div>

                <div className="orders-summary-card">
                    <div className="orders-summary-icon pending">
                        <Package size={22} />
                    </div>
                    <div>
                        <h3>
                            {orders.filter((order) => (order.orderStatus || 'PENDING').toUpperCase() === 'PENDING').length}
                        </h3>
                        <p>Pending Orders</p>
                    </div>
                </div>

                <div className="orders-summary-card">
                    <div className="orders-summary-icon delivered">
                        <ShoppingBag size={22} />
                    </div>
                    <div>
                        <h3>
                            {orders.filter((order) => (order.orderStatus || '').toUpperCase() === 'DELIVERED').length}
                        </h3>
                        <p>Delivered Orders</p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {ordersError && (
                <div className="orders-error">
                    <p>{ordersError}</p>
                    <button type="button" onClick={fetchOrders}>Try Again</button>
                </div>
            )}

            {/* Filters */}
            {!ordersError && orders.length > 0 && (
                <div className="orders-toolbar">
                    <div className="orders-filter-group">
                        <div className="orders-filter-item">
                            <label htmlFor="orders-status-filter">Order Status</label>
                            <select
                                id="orders-status-filter"
                                className="orders-filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="PACKED">Packed</option>
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div className="orders-filter-item">
                            <label htmlFor="orders-payment-filter">Payment Status</label>
                            <select
                                id="orders-payment-filter"
                                className="orders-filter-select"
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                            >
                                <option value="ALL">All Payments</option>
                                <option value="PENDING">Pending</option>
                                <option value="PAID">Paid</option>
                                <option value="FAILED">Failed</option>
                                <option value="REFUNDED">Refunded</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="orders-reset-btn"
                        onClick={handleResetFilters}
                    >
                        <RotateCcw size={14} />
                        Reset Filters
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!ordersError && filteredOrders.length === 0 && (
                <div className="orders-empty">
                    <ShoppingBag size={42} />
                    <h3>
                        {orders.length === 0 ? 'No Orders Yet' : 'No Matching Orders'}
                    </h3>
                    <p>
                        {orders.length === 0
                            ? 'Customer product orders will appear here.'
                            : 'Try changing the search keyword or selected filters.'}
                    </p>
                </div>
            )}

            {/* Orders Table */}
            {!ordersError && paginatedOrders.length > 0 && (
                <>
                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order Details</th>
                                    <th>Customer</th>
                                    <th>Products</th>
                                    <th>Total Amount</th>
                                    <th>Payment</th>
                                    <th>Order Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedOrders.map((order) => {
                                    const availableStatuses = getAvailableStatuses(order.orderStatus);

                                    return (
                                        <tr key={order._id}>
                                            {/* Order Information */}
                                            <td>
                                                <div className="orders-id">
                                                    #{order.invoiceNumber || order._id?.slice(-8).toUpperCase()}
                                                </div>

                                                <div className="orders-date">
                                                    <CalendarDays size={13} />
                                                    {formatDate(order.createdAt)}
                                                </div>

                                                <button
                                                    type="button"
                                                    className="orders-view-btn"
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    <Eye size={14} />
                                                    View Details
                                                </button>
                                            </td>

                                            {/* Customer Information */}
                                            <td>
                                                <div className="orders-customer-name">
                                                    {order.customer?.name || 'Unknown Customer'}
                                                </div>
                                                <div className="orders-customer-email">
                                                    {order.customer?.email || 'N/A'}
                                                </div>
                                                <div className="orders-customer-email">
                                                    {order.customer?.phone || ''}
                                                </div>
                                            </td>

                                            {/* Product Information */}
                                            <td>
                                                <div className="orders-products-list">
                                                    {order.items?.map((item, index) => (
                                                        <div className="orders-product-item" key={item._id || index}>
                                                            <span>
                                                                {item.productName || item.product?.name || 'Product'}
                                                            </span>
                                                            <small>
                                                                Qty: {item.quantity} × {formatCurrency(item.price)}
                                                                {' = '}
                                                                {formatCurrency(item.subtotal)}
                                                            </small>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Total Amount */}
                                            <td className="orders-total">
                                                {formatCurrency(order.totalAmount)}
                                            </td>

                                            {/* Payment Information */}
                                            <td>
                                                <span className={`orders-payment orders-payment-${(order.paymentStatus || 'pending').toLowerCase()}`}>
                                                    {order.paymentStatus || 'PENDING'}
                                                </span>
                                                <div className="orders-payment-method">
                                                    {order.paymentMethod || 'COD'}
                                                </div>
                                            </td>

                                            {/* Order Status */}
                                            <td>
                                                <span className={getStatusClass(order.orderStatus)}>
                                                    {order.orderStatus || 'PENDING'}
                                                </span>

                                                {availableStatuses.length > 0 && (
                                                    <select
                                                        className="orders-status-select"
                                                        value=""
                                                        aria-label={`Update status for order ${order.invoiceNumber || order._id}`}
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                handleOrderStatusUpdate(order._id, e.target.value);
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Update status</option>
                                                        {availableStatuses.map((status) => (
                                                            <option key={status} value={status}>
                                                                {status}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Results Count */}
                    <div className="orders-results-count">
                        Showing {startIndex + 1}–{endIndex} of {filteredOrders.length} matching orders ({orders.length} total)
                    </div>

                    {/* Pagination */}
                    {filteredOrders.length > 0 && (
                        <div className="orders-pagination">
                            <div className="orders-pagination-info">
                                Page {safeCurrentPage} of {totalPages}
                            </div>

                            <div className="orders-pagination-controls">
                                <button
                                    type="button"
                                    className="orders-page-btn"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={safeCurrentPage === 1}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                    <button
                                        type="button"
                                        key={page}
                                        className={`orders-page-btn ${safeCurrentPage === page ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                        aria-current={safeCurrentPage === page ? 'page' : undefined}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="orders-page-btn"
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={safeCurrentPage === totalPages}
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={16} />
                                </button>

                                <select
                                    className="orders-page-size"
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    aria-label="Orders per page"
                                >
                                    <option value={5}>5 / page</option>
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div
                    className="orders-modal-overlay"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="orders-details-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="orders-modal-header">
                            <div>
                                <h2>Order Details</h2>
                                <p>
                                    #{selectedOrder.invoiceNumber || selectedOrder._id?.slice(-8).toUpperCase()}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="orders-modal-close"
                                onClick={() => setSelectedOrder(null)}
                                aria-label="Close order details"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="orders-modal-body">
                            {/* Customer Information */}
                            <div className="orders-detail-card">
                                <h3>Customer Information</h3>
                                <p>
                                    <strong>Name:</strong>{' '}
                                    {selectedOrder.customer?.name || 'Unknown Customer'}
                                </p>
                                <p>
                                    <strong>Email:</strong>{' '}
                                    {selectedOrder.customer?.email || 'N/A'}
                                </p>
                                <p>
                                    <strong>Phone:</strong>{' '}
                                    {selectedOrder.customer?.phone || 'N/A'}
                                </p>
                            </div>

                            {/* Delivery Address */}
                            <div className="orders-detail-card">
                                <h3>
                                    <MapPin size={18} />
                                    Delivery Address
                                </h3>
                                <p>
                                    {selectedOrder.deliveryAddress?.fullAddress || 'N/A'}
                                </p>

                                {selectedOrder.deliveryAddress?.landmark && (
                                    <p>
                                        <strong>Landmark:</strong>{' '}
                                        {selectedOrder.deliveryAddress.landmark}
                                    </p>
                                )}

                                <p>
                                    {[
                                        selectedOrder.deliveryAddress?.city,
                                        selectedOrder.deliveryAddress?.state,
                                        selectedOrder.deliveryAddress?.pincode
                                    ].filter(Boolean).join(', ') || 'N/A'}
                                </p>
                            </div>

                            {/* Ordered Products */}
                            <div className="orders-detail-card">
                                <h3>Ordered Products</h3>

                                {selectedOrder.items?.map((item, index) => (
                                    <div className="orders-modal-product" key={item._id || index}>
                                        <div>
                                            <strong>
                                                {item.productName || item.product?.name || 'Product'}
                                            </strong>
                                            <p>
                                                {item.quantity} × {formatCurrency(item.price)}
                                            </p>
                                        </div>
                                        <strong>
                                            {formatCurrency(item.subtotal)}
                                        </strong>
                                    </div>
                                ))}

                                <div className="orders-modal-total">
                                    <strong>Total Amount</strong>
                                    <strong>
                                        {formatCurrency(selectedOrder.totalAmount)}
                                    </strong>
                                </div>
                            </div>

                            {/* Payment Information */}
                            <div className="orders-detail-card">
                                <h3>Payment Information</h3>
                                <p>
                                    <strong>Payment Method:</strong>{' '}
                                    {selectedOrder.paymentMethod || 'COD'}
                                </p>
                                <p>
                                    <strong>Payment Status:</strong>{' '}
                                    {selectedOrder.paymentStatus || 'PENDING'}
                                </p>
                                <p>
                                    <strong>Order Date:</strong>{' '}
                                    {formatDate(selectedOrder.createdAt)}
                                </p>
                                <p>
                                    <strong>Invoice Number:</strong>{' '}
                                    {selectedOrder.invoiceNumber || 'N/A'}
                                </p>
                            </div>

                            {/* Order Status */}
                            <div className="orders-detail-card">
                                <h3>Order Status</h3>
                                <span className={getStatusClass(selectedOrder.orderStatus)}>
                                    {selectedOrder.orderStatus || 'PENDING'}
                                </span>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="orders-modal-footer">
                            <div className="orders-invoice-actions">
                                <button
                                    type="button"
                                    className="orders-invoice-view-btn"
                                    onClick={() => handleInvoiceDownload(selectedOrder._id, 'view')}
                                >
                                    View Invoice
                                </button>

                                <button
                                    type="button"
                                    className="orders-invoice-download-btn"
                                    onClick={() => handleInvoiceDownload(selectedOrder._id, 'download')}
                                >
                                    Download Invoice
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrdersSection;
