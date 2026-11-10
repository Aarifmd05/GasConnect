
import React, { useState } from 'react';
import axios from 'axios';
import {
  MapPin,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import './Checkout.css';

const API_URL = 'http://localhost:3006/api';
const CART_KEY = 'gasconnect_cart';

const Checkout = ({
  selectedAddress,
  onAddressSelect,
  onBackToProducts,
  onOrderPlaced
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  const getCart = () => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  };

  const cart = getCart();

  const totalAmount = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    setError('');

    if (cart.length === 0) {
      setError('Your cart is empty. Please add products first.');
      return;
    }

    if (!selectedAddress) {
      setError('Please select a delivery address from the top navigation.');
      return;
    }

    const {
      fullAddress,
      landmark,
      city,
      state,
      pincode
    } = selectedAddress;

    if (
      !fullAddress?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !/^\d{6}$/.test(String(pincode || ''))
    ) {
      setError(
        'Your delivery address is incomplete. Please update your address with full address, city, state and a valid 6-digit pincode.'
      );
      return;
    }

    const token = sessionStorage.getItem('token');

    if (!token) {
      setError('Your session has expired. Please login again.');
      return;
    }

    const orderData = {
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      deliveryAddress: {
        fullAddress: fullAddress.trim(),
        landmark: landmark || '',
        city: city.trim(),
        state: state.trim(),
        pincode: String(pincode)
      },
      paymentMethod: 'COD'
    };

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/orders`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const order = response.data.order || response.data;

      localStorage.removeItem(CART_KEY);

      setSuccessOrder(order);
    } catch (err) {
      console.error('Order placement error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to place your order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="checkout-success">
        <CheckCircle size={65} />

        <h2>Order Placed Successfully!</h2>

        <p>
          Thank you for shopping with GasConnect.
          Your order has been received.
        </p>

        <div className="success-order-details">
          <span>Order ID</span>
          <strong>{successOrder._id || successOrder.id || 'Confirmed'}</strong>

          <span>Payment Method</span>
          <strong>Cash on Delivery</strong>

          <span>Order Total</span>
          <strong>
            ₹{Number(successOrder.totalAmount ?? totalAmount).toLocaleString('en-IN')}
          </strong>
        </div>

        <button
          className="checkout-primary-btn"
          onClick={onOrderPlaced}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">

      <button
        className="checkout-back-btn"
        onClick={onBackToProducts}
      >
        <ArrowLeft size={17} />
        Back to Products
      </button>

      <div className="checkout-heading">
        <h2>Complete Your Order</h2>
        <p>Review your items and confirm your delivery details.</p>
      </div>

      {error && (
        <div className="checkout-error">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      <div className="checkout-layout">

        <div className="checkout-main">

          <section className="checkout-card">
            <h3>
              <MapPin size={20} />
              Delivery Address
            </h3>

            {selectedAddress ? (
              <div className="checkout-address">
                <strong>
                  {selectedAddress.label || 'Selected Address'}
                </strong>

                <p>{selectedAddress.fullAddress}</p>

                {selectedAddress.landmark && (
                  <p>Landmark: {selectedAddress.landmark}</p>
                )}

                <p>
                  {selectedAddress.city}, {selectedAddress.state} -{' '}
                  {selectedAddress.pincode}
                </p>

                <span className="checkout-address-note">
                  To change this address, use the location selector
                  in the dashboard top navigation.
                </span>
              </div>
            ) : (
              <div className="checkout-no-address">
                <p>No delivery address selected.</p>
                <p>
                  Please select or add an address using the
                  location selector in the dashboard top navigation.
                </p>
              </div>
            )}
          </section>

          <section className="checkout-card">
            <h3>
              <ShoppingBag size={20} />
              Order Items ({cart.length})
            </h3>

            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div className="checkout-items">
                {cart.map(item => (
                  <div
                    className="checkout-item"
                    key={item.productId}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <p>Quantity: {item.quantity}</p>
                    </div>

                    <strong>
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="checkout-card">
            <h3>
              <Truck size={20} />
              Payment Method
            </h3>

            <div className="checkout-payment-option">
              <div>
                <strong>Cash on Delivery</strong>
                <p>Pay when your order is delivered.</p>
              </div>

              <span className="cod-selected">Selected</span>
            </div>
          </section>

        </div>

        <aside className="checkout-summary">
          <h3>Order Summary</h3>

          <div className="checkout-summary-row">
            <span>Items</span>
            <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>

          <div className="checkout-summary-row">
            <span>Subtotal</span>
            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="checkout-summary-row">
            <span>Delivery</span>
            <span>To be confirmed</span>
          </div>

          <div className="checkout-summary-total">
            <span>Total</span>
            <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>
          </div>

          <button
            className="checkout-primary-btn"
            onClick={handlePlaceOrder}
            disabled={loading || cart.length === 0}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>

          <p className="checkout-secure-note">
            <ShieldCheck size={16} />
            Secure order processing
          </p>
        </aside>

      </div>
    </div>
  );
};

export default Checkout;
