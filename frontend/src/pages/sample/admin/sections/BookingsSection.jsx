
import {
    CalendarCheck,
    Clock,
    HardHat,
    RefreshCw,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

function BookingsSection({
    bookings,
    bookingsLoading,
    bookingsError,
    filteredBookings,
    approvedTechnicians,
    selectedTechnicians,
    assigningBooking,
    setSelectedTechnicians,
    handleAssignTechnician,
    fetchBookings,
    formatDateTime,
    getBookingStatusClass,
    searchTerm
}) {
    return (
        <div className="admin-bookings-page">

            {/* Welcome Section */}
            <div className="admin-welcome">
                <div>
                    <h1>Booking Management</h1>
                    <p>
                        View customer service requests and assign approved technicians.
                    </p>
                </div>

                <span className="admin-role-label">
                    <CalendarCheck size={17} />
                    {bookings.length} Bookings
                </span>
            </div>

            {/* Booking Summary */}
            <div className="admin-booking-summary">

                <div>
                    <Clock size={19} />
                    <span>
                        Pending: {
                            bookings.filter(b => b.status === 'pending').length
                        }
                    </span>
                </div>

                <div>
                    <HardHat size={19} />
                    <span>
                        Assigned: {
                            bookings.filter(b => b.status === 'assigned').length
                        }
                    </span>
                </div>

                <div>
                    <RefreshCw size={19} />
                    <span>
                        In Progress: {
                            bookings.filter(b => b.status === 'in-progress').length
                        }
                    </span>
                </div>

                <div>
                    <CheckCircle size={19} />
                    <span>
                        Completed: {
                            bookings.filter(b => b.status === 'completed').length
                        }
                    </span>
                </div>

            </div>

            {/* Toolbar */}
            <div className="admin-technician-toolbar">
                <h3>All Service Bookings</h3>

                <button
                    onClick={fetchBookings}
                    disabled={bookingsLoading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {bookingsError && (
                <p className="admin-stat-error">
                    {bookingsError}
                </p>
            )}

            {/* Loading State */}
            {bookingsLoading ? (

                <div className="admin-customer-message">
                    <RefreshCw size={25} />
                    <p>Loading bookings...</p>
                </div>

            ) : bookingsError ? (

                /* Error State */
                <div className="admin-customer-message">
                    <AlertCircle size={30} />
                    <p>Booking records could not be loaded.</p>
                </div>

            ) : filteredBookings.length === 0 ? (

                /* Empty State */
                <div className="admin-customer-message">
                    <CalendarCheck size={35} />

                    <h3>No bookings found</h3>

                    <p>
                        {searchTerm
                            ? 'Try another search term.'
                            : 'Customer bookings will appear here.'}
                    </p>
                </div>

            ) : (

                /* Booking Table */
                <div className="admin-customer-table-wrapper">
                    <table className="admin-booking-table">

                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Customer</th>
                                <th>Repair Service</th>
                                <th>Booking Date</th>
                                <th>Address & Description</th>
                                <th>Technician</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredBookings.map((booking, index) => (
                                <tr key={booking._id}>

                                    <td>{index + 1}</td>

                                    <td>
                                        <strong>
                                            {booking.customer?.name || 'N/A'}
                                        </strong>
                                        <small>
                                            {booking.customer?.email || 'N/A'}
                                        </small>
                                        <small>
                                            {booking.customer?.phone || 'N/A'}
                                        </small>
                                    </td>

                                    <td>
                                        <strong>
                                            {booking.repairType?.name || 'N/A'}
                                        </strong>
                                        <small>
                                            ₹{booking.repairType?.price ?? 'N/A'}
                                        </small>
                                    </td>

                                    <td>
                                        {formatDateTime(booking.bookingDate)}
                                    </td>

                                    <td className="admin-booking-address">
                                        <span>
                                            {booking.address || 'N/A'}
                                        </span>

                                        {booking.description && (
                                            <small>{booking.description}</small>
                                        )}
                                    </td>

                                    <td>
                                        {booking.technician ? (
                                            <>
                                                <strong>
                                                    {booking.technician.name || 'N/A'}
                                                </strong>
                                                <small>
                                                    {booking.technician.phone || ''}
                                                </small>
                                            </>
                                        ) : (
                                            'Not assigned'
                                        )}
                                    </td>

                                    <td>
                                        <span
                                            className={`admin-status-badge ${getBookingStatusClass(booking.status)}`}
                                        >
                                            {booking.status || 'pending'}
                                        </span>
                                    </td>

                                    <td>
                                        {['pending', 'rejected'].includes(booking.status) ? (

                                            <div className="admin-booking-assign">

                                                <select
                                                    value={
                                                        selectedTechnicians[booking._id] || ''
                                                    }
                                                    onChange={(e) =>
                                                        setSelectedTechnicians(prev => ({
                                                            ...prev,
                                                            [booking._id]: e.target.value
                                                        }))
                                                    }
                                                >
                                                    <option value="">
                                                        Select technician
                                                    </option>

                                                    {approvedTechnicians.map(technician => (
                                                        <option
                                                            key={technician._id}
                                                            value={technician._id}
                                                        >
                                                            {technician.name}
                                                        </option>
                                                    ))}
                                                </select>

                                                <button
                                                    onClick={() =>
                                                        handleAssignTechnician(booking._id)
                                                    }
                                                    disabled={
                                                        assigningBooking === booking._id ||
                                                        approvedTechnicians.length === 0
                                                    }
                                                >
                                                    {assigningBooking === booking._id
                                                        ? 'Assigning...'
                                                        : 'Assign'}
                                                </button>

                                            </div>

                                        ) : (

                                            <span className="admin-action-completed">
                                                No action
                                            </span>

                                        )}
                                    </td>

                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            )}

        </div>
    );
}

export default BookingsSection;
