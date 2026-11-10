
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Package,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  CalendarDays,
  MapPin,
  FileDown
} from 'lucide-react';

import './MyOrders.css';

const API_URL = 'http://localhost:3006/api';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  // =====================================
  // FETCH CUSTOMER ORDERS
  // =====================================

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('token');

      const response = await axios.get(
        `${API_URL}/orders/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOrders(response.data.orders || []);

    } catch (err) {
      console.error('Error fetching orders:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load your orders. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // =====================================
  // DOWNLOAD INVOICE PDF
  // =====================================

  
const handleDownloadInvoice = async (order) => {
  try {
    setDownloadingId(order._id);

    const token = sessionStorage.getItem('token');

    if (!token) {
      throw new Error('Please login again to download your invoice.');
    }

    const response = await axios.get(
      `${API_URL}/orders/${order._id}/invoice`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      }
    );

    const pdfBlob = new Blob(
      [response.data],
      { type: 'application/pdf' }
    );

    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `${order.invoiceNumber}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 1000);

  } catch (err) {
    console.error('Invoice Download Error:', err);

    let message = 'Unable to download invoice. Please try again.';

    if (err.response?.data instanceof Blob) {
      try {
        const errorData = JSON.parse(
          await err.response.data.text()
        );
        message = errorData.message || message;
      } catch {
        // Keep the default error message.
      }
    } else {
      message = err.response?.data?.message || err.message || message;
    }

    alert(message);

  } finally {
    setDownloadingId(null);
  }
};

  // =====================================
  // FORMAT DATE
  // =====================================

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // =====================================
  // ORDER STATUS CLASS
  // =====================================

  const getStatusClass = (status) => {
    return status?.toLowerCase() || 'pending';
  };

  if (loading) {
    return (
      <div className="my-orders-loading">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="my-orders-page">

      {/* PAGE HEADING */}

      <div className="my-orders-heading">
        <div>
          <h2>My Orders</h2>
          <p>View and manage your GasConnect purchases.</p>
        </div>

        <button
          className="my-orders-refresh"
          onClick={fetchOrders}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="my-orders-error">
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      {/* EMPTY ORDERS */}

      {!error && orders.length === 0 ? (
        <div className="my-orders-empty">
          <ShoppingBag size={48} />
          <h3>No orders yet</h3>
          <p>Your placed orders will appear here.</p>
        </div>
      ) : (

        <div className="my-orders-list">

          {orders.map(order => (

            <article className="my-order-card" key={order._id}>

              {/* ORDER HEADER */}

              <div className="my-order-header">
                <div>
                  <span>Order ID</span>
                  <strong>{order._id}</strong>
                </div>

                <span
                  className={`my-order-status ${getStatusClass(order.orderStatus)}`}
                >
                  {order.orderStatus}
                </span>
              </div>

              {/* ORDER META */}

              <div className="my-order-meta">
                <span>
                  <CalendarDays size={15} />
                  {formatDate(order.createdAt)}
                </span>

                <span>
                  <Package size={15} />
                  {order.items?.length || 0} products
                </span>
              </div>

              {/* ORDER ITEMS */}

              <div className="my-order-items">

                {order.items?.map((item, index) => (

                  <div
                    className="my-order-item"
                    key={`${order._id}-${index}`}
                  >
                    <div>
                      <strong>{item.productName}</strong>
                      <p>Quantity: {item.quantity}</p>
                    </div>

                    <strong>
                      ₹{Number(item.subtotal).toLocaleString('en-IN')}
                    </strong>
                  </div>

                ))}

              </div>

              {/* DELIVERY ADDRESS */}

              <div className="my-order-address">
                <MapPin size={16} />

                <span>
                  {order.deliveryAddress?.fullAddress},{' '}
                  {order.deliveryAddress?.city},{' '}
                  {order.deliveryAddress?.state} -{' '}
                  {order.deliveryAddress?.pincode}
                </span>
              </div>

              {/* ORDER FOOTER */}

              <div className="my-order-footer">

                <div>
                  <span>Payment</span>
                  <strong>
                    {order.paymentMethod === 'COD'
                      ? 'Cash on Delivery'
                      : order.paymentMethod}
                  </strong>
                </div>

                <div>
                  <span>Total Amount</span>
                  <strong>
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </strong>
                </div>

              </div>

              {/* INVOICE DOWNLOAD */}

              <div className="my-order-invoice">

                <div className="invoice-info">
                  <FileDown size={19} />

                  <div>
                    <strong>Invoice</strong>
                    <span>
                      {order.invoiceNumber || 'Not available'}
                    </span>
                  </div>
                </div>

                <button
                  className="download-invoice-btn"
                  onClick={() => handleDownloadInvoice(order)}
                  disabled={
                    !order.invoiceNumber ||
                    downloadingId === order._id
                  }
                >
                  <FileDown size={17} />

                  {downloadingId === order._id
                    ? 'Downloading...'
                    : 'Download Invoice'}
                </button>

              </div>

            </article>

          ))}

        </div>

      )}

    </div>
  );
};

export default MyOrders;
