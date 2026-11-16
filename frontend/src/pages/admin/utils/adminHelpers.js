// Format dates consistently across admin sections.
export const formatDate = (date) => {
    if (!date) return 'N/A';

    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const formatDateTime = (date) => {
    if (!date) return 'N/A';

    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getStatusClass = (status) => {
    if (status === 'approved') return 'approved';
    if (status === 'rejected') return 'rejected';
    return 'pending';
};

export const getBookingStatusClass = (status) => {
    if (status === 'completed' || status === 'accepted') return 'approved';
    if (status === 'rejected' || status === 'cancelled') return 'rejected';
    if (status === 'in-progress') return 'in-progress';
    return 'pending';
};

// Filter admin lists using the shared search field.
export const filterBookings = (bookings, searchTerm) => {
    const search = searchTerm.toLowerCase();

    return bookings.filter((booking) => (
        booking.customer?.name?.toLowerCase().includes(search) ||
        booking.customer?.email?.toLowerCase().includes(search) ||
        booking.customer?.phone?.toString().includes(search) ||
        booking.repairType?.name?.toLowerCase().includes(search) ||
        booking.status?.toLowerCase().includes(search) ||
        booking.address?.toLowerCase().includes(search) ||
        booking.technician?.name?.toLowerCase().includes(search)
    ));
};

export const filterCustomers = (customers, searchTerm) => {
    const search = searchTerm.toLowerCase();

    return customers.filter((customer) => (
        customer.name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.toString().includes(search)
    ));
};

export const filterTechnicians = (technicians, searchTerm) => {
    const search = searchTerm.toLowerCase();

    return technicians.filter((technician) => (
        technician.name?.toLowerCase().includes(search) ||
        technician.email?.toLowerCase().includes(search) ||
        technician.phone?.toString().includes(search) ||
        technician.specialization?.toLowerCase().includes(search)
    ));
};
