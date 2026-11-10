
import React, { useState } from 'react';

import CustomerTopbar from './components/CustomerTopbar';
import CustomerSidebar from './components/CustomerSidebar';

import './CustomerDashboard.css';

import Overview from './sections/Overview';
import BookRepair from './sections/BookRepair';
import MyBookings from './sections/MyBookings';
import BookingHistory from './sections/BookingHistory';
import TrackTechnician from './sections/TrackTechnician';
import ReviewsRatings from './sections/ReviewsRatings';
import Notifications from './sections/Notifications';
import MyProfile from './sections/MyProfile';
import Products from './sections/Products';
import Chatbot from './sections/Chatbot';
import Checkout from './sections/Checkout';
import MyOrders from './sections/MyOrders';

const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user')) || {};
  } catch {
    return {};
  }
};

const getStoredAddress = () => {
  try {
    return JSON.parse(sessionStorage.getItem('selectedAddress')) || null;
  } catch {
    return null;
  }
};

const CustomerDashboard = () => {
  const [user] = useState(getStoredUser);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedAddress, setSelectedAddress] = useState(getStoredAddress);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    sessionStorage.setItem('selectedAddress', JSON.stringify(address));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('selectedAddress');
    window.location.href = '/customer/login';
  };

  const sectionTitles = {
    overview: 'Dashboard Overview',
    products: 'Products',
    checkout: 'Checkout',
    bookRepair: 'Book a Repair',
    myBookings: 'My Bookings',
    history: 'Booking History',
    trackTechnician: 'Track Technician',
    reviews: 'Reviews & Ratings',
    notifications: 'Notifications',
    chatbot: 'AI Chatbot',
    myOrders: 'My Orders',
    profile: 'My Profile'
  };

  return (
    <div className="customer-dashboard">

      <CustomerSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sidebarOpen={sidebarOpen}
        onLogout={handleLogout}
      />

      <main className={`customer-main ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>

        <CustomerTopbar
          user={user}
          selectedAddress={selectedAddress}
          onAddressSelect={handleAddressSelect}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <div className="customer-content">

          <div className="customer-page-heading">
            <div>
              <h1>{sectionTitles[activeSection]}</h1>
              <p>
                Welcome back, {user?.name || 'Customer'}!
                Manage your gas appliance services here.
              </p>
            </div>
          </div>

          {activeSection === 'overview' && (
            <Overview
              user={user}
              onBookRepair={() => setActiveSection('bookRepair')}
            />
          )}

          {activeSection === 'products' && (
            <Products
              onCheckout={() => setActiveSection('checkout')}
            />
          )}

          {activeSection === 'checkout' && (
            <Checkout
              selectedAddress={selectedAddress}
              onAddressSelect={handleAddressSelect}
              onBackToProducts={() => setActiveSection('products')}
              onOrderPlaced={() => setActiveSection('myOrders')}
            />
          )}

          {activeSection === 'bookRepair' && (
            <BookRepair
              selectedAddress={selectedAddress}
              onAddressSelect={handleAddressSelect}
            />
          )}

          {activeSection === 'myBookings' && <MyBookings />}

          {activeSection === 'history' && <BookingHistory />}

          {activeSection === 'trackTechnician' && <TrackTechnician />}

          {activeSection === 'reviews' && <ReviewsRatings />}

          {activeSection === 'notifications' && <Notifications />}

          {activeSection === 'profile' && <MyProfile />}

          {activeSection === 'chatbot' && <Chatbot />}

          {activeSection === 'myOrders' && <MyOrders />}

        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
