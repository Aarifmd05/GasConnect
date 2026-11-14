import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import TechnicianSidebar from './components/TechnicianSidebar';
import TechnicianTopbar from './components/TechnicianTopbar';

import Overview from './sections/Overview';
import JobRequests from './sections/JobRequests';
import AssignedJobs from './sections/AssignedJobs';
import WorkHistory from './sections/WorkHistory';
import TechnicianProfile from './sections/TechnicianProfile';

import './TechnicianDashboard.css';

const API_URL = 'http://localhost:3006/api';
const READ_KEY = 'gasconnect_technician_read_notifications';

// Track the first dashboard login for each technician on this browser.
// localStorage keeps this value after logout and browser refresh.
function getIsFirstLogin(role, user) {
    const userId = user?._id || user?.id || user?.email || user?.name;
    const storageKey = `gasconnect_${role}_has_logged_in_${userId || 'account'}`;

    try {
        if (localStorage.getItem(storageKey) === 'true') {
            return false;
        }

        localStorage.setItem(storageKey, 'true');
        return true;
    } catch {
        return true;
    }
}

function getStoredUser() {
    try {
        return JSON.parse(sessionStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
}

function getStoredReadNotifications() {
    try {
        return JSON.parse(sessionStorage.getItem(READ_KEY) || '[]');
    } catch {
        return [];
    }
}

function getNotificationDetails(booking, technicianId) {
    const status = booking.status?.toLowerCase();
    const assignedTechnician =
        booking.technician?._id || booking.technician;

    if (status === 'assigned' && !assignedTechnician) {
        return {
            title: 'New Job Available',
            message: `A new ${booking.repairType?.name || 'repair'} job is available. Check your job requests.`
        };
    }

    if (
        technicianId &&
        String(assignedTechnician) === String(technicianId)
    ) {
        switch (status) {
            case 'assigned':
                return {
                    title: 'New Job Assigned',
                    message: 'A new booking has been assigned to you.'
                };
            case 'accepted':
                return {
                    title: 'Booking Accepted',
                    message: 'Your booking has been accepted.'
                };
            case 'in-progress':
            case 'in_progress':
                return {
                    title: 'Work In Progress',
                    message: 'Your assigned repair job is in progress.'
                };
            case 'completed':
                return {
                    title: 'Job Completed',
                    message: 'Your assigned repair job has been completed.'
                };
            case 'cancelled':
                return {
                    title: 'Booking Cancelled',
                    message: 'Your assigned booking has been cancelled.'
                };
            default:
                return null;
        }
    }

    return null;
}

export default function TechnicianDashboard() {
    const [user] = useState(getStoredUser);
    const [isFirstLogin] = useState(() => getIsFirstLogin('technician', user));
    const [activeSection, setActiveSection] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [readNotifications, setReadNotifications] = useState(
        getStoredReadNotifications
    );

    const fetchNotifications = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(
                `${API_URL}/bookings/technician/my-bookings`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const bookings = response.data.bookings || [];
            const technicianId = user?._id || user?.id;

            const formattedNotifications = bookings
                .map((booking) => {
                    const details = getNotificationDetails(booking, technicianId);
                    if (!details) return null;

                    return {
                        id: `${booking._id}-${booking.status}`,
                        bookingId: booking._id,
                        title: details.title,
                        message: details.message,
                        status: booking.status,
                        date: booking.updatedAt || booking.createdAt || booking.bookingDate
                    };
                })
                .filter(Boolean)
                .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

            setNotifications(formattedNotifications);
        } catch (error) {
            console.error(
                'Technician notification error:',
                error.response?.data || error.message
            );
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = (notificationId) => {
        setReadNotifications((previous) => {
            if (previous.includes(notificationId)) return previous;

            const updated = [...previous, notificationId];
            sessionStorage.setItem(READ_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const unreadCount = notifications.filter(
        (notification) => !readNotifications.includes(notification.id)
    ).length;

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/technician/login';
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return <Overview user={user} isFirstLogin={isFirstLogin} />;
            case 'requests':
                return <JobRequests />;
            case 'assigned':
                return <AssignedJobs />;
            case 'history':
                return <WorkHistory />;
            case 'profile':
                return <TechnicianProfile />;
            default:
                return <Overview user={user} isFirstLogin={isFirstLogin} />;
        }
    };

    return (
        <div className="technician-dashboard">
            <TechnicianSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                onLogout={handleLogout}
            />

            <main className="technician-main">
                <TechnicianTopbar
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                    onProfileClick={() => setActiveSection('profile')}
                    notifications={notifications}
                    readNotifications={readNotifications}
                    unreadCount={unreadCount}
                    markAsRead={markAsRead}
                />

                <div className="technician-content">
                    {renderSection()}
                </div>
            </main>
        </div>
    );
}
