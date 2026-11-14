
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback
} from 'react';

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

const API_URL = 'http://localhost:3006/api';


// Track the first dashboard login for each customer on this browser.
// localStorage keeps this value after logout and browser refresh.
const getIsFirstLogin = (role, user) => {
  const userId = user?._id || user?.id || user?.email || user?.name;
  const storageKey = `gasconnect_${role}_has_logged_in_${userId || 'account'}`;

  try {
    if (localStorage.getItem(storageKey) === 'true') {
      return false;
    }

    localStorage.setItem(storageKey, 'true');
    return true;
  } catch {
    // If browser storage is unavailable, show the first-login greeting
    // for this dashboard session only.
    return true;
  }
};

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
  const [isFirstLogin] = useState(() => getIsFirstLogin('customer', user));

  const [activeSection, setActiveSection] = useState('overview');

  const [selectedAddress, setSelectedAddress] = useState(
    getStoredAddress
  );

  // Detect mobile screen
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );

  // Desktop sidebar state
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Actual sidebar state
  const sidebarOpen = isMobile
    ? mobileSidebarOpen
    : desktopSidebarOpen;

  // Handle screen resizing
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);

      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Prevent background scrolling while mobile menu is open
  useEffect(() => {
    if (isMobile && mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, mobileSidebarOpen]);

  // Toggle sidebar
  const handleMenuToggle = () => {
    if (isMobile) {
      setMobileSidebarOpen(previous => !previous);
    } else {
      setDesktopSidebarOpen(previous => !previous);
    }
  };

  // Close mobile drawer
  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  // Handle navigation
  const handleSectionChange = (section) => {
    setActiveSection(section);

    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  // Notification states
  const [notifications, setNotifications] = useState([]);

  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem('gasconnect_read_notifications') || '[]'
      );
    } catch {
      return [];
    }
  });

  const [notificationLoading, setNotificationLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const token = sessionStorage.getItem('token');

    if (!token) return;

    try {
      setNotificationLoading(true);

      const response = await fetch(
        `${API_URL}/bookings/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();

      const bookings = Array.isArray(data)
        ? data
        : data.bookings || [];

      const notificationList = bookings.map((booking) => {
        const status = booking.status?.toLowerCase();

        let title = 'Booking Update';
        let message = 'Your booking has been updated.';

        switch (status) {
          case 'pending':
            title = 'Booking Pending';
            message = 'Your booking is waiting for confirmation.';
            break;

          case 'assigned':
            title = 'Technician Assigned';
            message = 'A technician has been assigned to your booking.';
            break;

          case 'accepted':
            title = 'Booking Accepted';
            message = 'Your booking has been accepted.';
            break;

          case 'in-progress':
          case 'in_progress':
            title = 'Work In Progress';
            message = 'Your service is currently in progress.';
            break;

          case 'completed':
            title = 'Booking Completed';
            message = 'Your service has been completed.';
            break;

          case 'cancelled':
            title = 'Booking Cancelled';
            message = 'Your booking has been cancelled.';
            break;

          default:
            break;
        }

        return {
          id: `${booking._id}-${booking.status}`,
          bookingId: booking._id,
          title,
          message,
          status: booking.status,
          date: booking.updatedAt || booking.createdAt || booking.bookingDate,
          booking
        };
      });

      notificationList.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setNotifications(notificationList);

    } catch (error) {
      console.error('Notification error:', error);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(
      notification => !readNotifications.includes(notification.id)
    ).length;
  }, [notifications, readNotifications]);

  // Mark one notification as read
  const markAsRead = (id) => {
    setReadNotifications(previous => {
      const updated = previous.includes(id)
        ? previous
        : [...previous, id];

      sessionStorage.setItem(
        'gasconnect_read_notifications',
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const allIds = notifications.map(notification => notification.id);

    setReadNotifications(previous => {
      const updated = [...new Set([...previous, ...allIds])];

      sessionStorage.setItem(
        'gasconnect_read_notifications',
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  // Address selection
  const handleAddressSelect = (address) => {
    setSelectedAddress(address);

    sessionStorage.setItem(
      'selectedAddress',
      JSON.stringify(address)
    );
  };

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('selectedAddress');

    window.location.href = '/customer/login';
  };

  // Page titles
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

      {/* SIDEBAR */}

      <CustomerSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        sidebarOpen={sidebarOpen}
        onLogout={handleLogout}
      />

      {/* MOBILE OVERLAY */}

      {isMobile && (
        <div
          className={`customer-sidebar-overlay ${
            mobileSidebarOpen ? 'show' : ''
          }`}
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* MAIN CONTENT */}

      <main
        className={`customer-main ${
          !isMobile && !desktopSidebarOpen
            ? 'sidebar-collapsed'
            : ''
        }`}
      >

        {/* TOPBAR */}

        <CustomerTopbar
          user={user}
          selectedAddress={selectedAddress}
          onAddressSelect={handleAddressSelect}
          onMenuToggle={handleMenuToggle}
          onLogout={handleLogout}
          notifications={notifications}
          readNotifications={readNotifications}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
          onOpenNotifications={() => {
            handleSectionChange('notifications');
          }}
        />

        {/* PAGE CONTENT */}

        <div className="customer-content">

          <div className="customer-page-heading">
            <div>
              <h1>{sectionTitles[activeSection]}</h1>

              <p>
                {isFirstLogin ? 'Welcome' : 'Welcome back'}, {user?.name || 'Customer'}!
                Manage your gas appliance services here.
              </p>
            </div>
          </div>

          {activeSection === 'overview' && (
            <Overview
              user={user}
              isFirstLogin={isFirstLogin}
              onBookRepair={() => handleSectionChange('bookRepair')}
            />
          )}

          {activeSection === 'products' && (
            <Products
              onCheckout={() => handleSectionChange('checkout')}
            />
          )}

          {activeSection === 'checkout' && (
            <Checkout
              selectedAddress={selectedAddress}
              onAddressSelect={handleAddressSelect}
              onBackToProducts={() => handleSectionChange('products')}
              onOrderPlaced={() => handleSectionChange('myOrders')}
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

          {activeSection === 'notifications' && (
            <Notifications
              notifications={notifications}
              readNotifications={readNotifications}
              unreadCount={unreadCount}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
              fetchNotifications={fetchNotifications}
              loading={notificationLoading}
            />
          )}

          {activeSection === 'profile' && <MyProfile />}

          {activeSection === 'chatbot' && <Chatbot />}

          {activeSection === 'myOrders' && <MyOrders />}

        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
