import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const ADMIN_READ_KEY = 'gasconnect_admin_read_notifications';

export default function useAdminNotifications() {
    const [notifications, setNotifications] = useState([]);

    const [readNotifications, setReadNotifications] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem(ADMIN_READ_KEY) || '[]');
        } catch {
            return [];
        }
    });

    // Fetch booking updates and technicians waiting for approval.
    const fetchAdminNotifications = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const headers = {
                Authorization: `Bearer ${token}`
            };

            const [bookingResponse, technicianResponse] = await Promise.all([
                axios.get('http://localhost:3006/api/bookings/admin/all', { headers }),
                axios.get('http://localhost:3006/api/users/admin/technicians', { headers })
            ]);

            const allBookings = bookingResponse.data.bookings || [];
            const allTechnicians = technicianResponse.data.technicians || [];

            const bookingNotifications = allBookings.map((booking) => {
                const status = booking.status || 'pending';

                let title = 'Booking Status Updated';
                let message = `Booking for ${booking.customer?.name || 'a customer'} has been updated.`;

                if (status === 'pending') {
                    title = 'New Booking Received';
                    message = `New ${booking.repairType?.name || 'service'} booking received from ${booking.customer?.name || 'a customer'}.`;
                } else if (status === 'assigned') {
                    title = 'Technician Assigned';
                    message = `A technician has been assigned to ${booking.customer?.name || 'a customer'}'s booking.`;
                } else if (status === 'accepted') {
                    title = 'Booking Accepted';
                    message = 'A technician has accepted a booking.';
                } else if (status === 'in-progress' || status === 'in_progress') {
                    title = 'Work In Progress';
                    message = 'A service booking is now in progress.';
                } else if (status === 'completed') {
                    title = 'Booking Completed';
                    message = 'A service booking has been completed.';
                } else if (status === 'cancelled') {
                    title = 'Booking Cancelled';
                    message = 'A service booking has been cancelled.';
                }

                return {
                    id: `booking-${booking._id}-${status}`,
                    title,
                    message,
                    date: booking.updatedAt || booking.createdAt,
                    type: 'booking',
                    bookingId: booking._id
                };
            });

            const technicianNotifications = allTechnicians
                .filter((technician) => technician.approvalStatus === 'pending')
                .map((technician) => ({
                    id: `technician-${technician._id}-pending`,
                    title: 'Technician Approval Pending',
                    message: `${technician.name || 'A technician'} is waiting for account approval.`,
                    date: technician.createdAt || technician.updatedAt,
                    type: 'technician',
                    technicianId: technician._id
                }));

            const combinedNotifications = [
                ...bookingNotifications,
                ...technicianNotifications
            ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

            setNotifications(combinedNotifications);
        } catch (error) {
            console.error(
                'Admin notification error:',
                error.response?.data || error.message
            );
        }
    }, []);

    // Refresh notifications every 30 seconds while the dashboard is open.
    useEffect(() => {
        fetchAdminNotifications();

        const interval = setInterval(fetchAdminNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchAdminNotifications]);

    // Save read notification IDs for the current session.
    const markAdminNotificationAsRead = (notificationId) => {
        setReadNotifications((previous) => {
            if (previous.includes(notificationId)) return previous;

            const updated = [...previous, notificationId];
            sessionStorage.setItem(ADMIN_READ_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const unreadNotificationCount = notifications.filter(
        (notification) => !readNotifications.includes(notification.id)
    ).length;

    return {
        notifications,
        readNotifications,
        unreadNotificationCount,
        markAdminNotificationAsRead,
        fetchAdminNotifications
    };
}
