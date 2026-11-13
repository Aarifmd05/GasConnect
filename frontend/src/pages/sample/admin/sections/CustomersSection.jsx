
import {
    Users,
    RefreshCw,
    AlertCircle
} from 'lucide-react';

function CustomersSection({
    customers,
    customersLoading,
    customersError,
    filteredCustomers,
    searchTerm,
    formatDate
}) {
    return (
        <div className="admin-customers-page">

            {/* Welcome Section */}
            <div className="admin-welcome">
                <div>
                    <h1>Customer Management</h1>
                    <p>
                        View and manage registered GasConnect customers.
                    </p>
                </div>

                <span className="admin-role-label">
                    <Users size={17} />
                    {customers.length} Customers
                </span>
            </div>

            {/* Section Heading */}
            <div className="admin-section-heading">
                <h2>All Customers</h2>
                <p>
                    Customer accounts registered on the platform
                </p>
            </div>

            {customersError && (
                <p className="admin-stat-error">
                    {customersError}
                </p>
            )}

            {/* Loading State */}
            {customersLoading ? (
                <div className="admin-customer-message">
                    <RefreshCw size={25} />
                    <p>Loading customers...</p>
                </div>

            ) : customersError ? (

                /* Error State */
                <div className="admin-customer-message">
                    <AlertCircle size={30} />
                    <p>Customer records could not be loaded.</p>
                </div>

            ) : filteredCustomers.length === 0 ? (

                /* Empty State */
                <div className="admin-customer-message">
                    <Users size={35} />

                    <h3>No customers found</h3>

                    <p>
                        {searchTerm
                            ? 'Try searching with another name, email or phone number.'
                            : 'Registered customers will appear here.'}
                    </p>
                </div>

            ) : (

                /* Customer Table */
                <div className="admin-customer-table-wrapper">
                    <table className="admin-customer-table">

                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Customer Name</th>
                                <th>Email Address</th>
                                <th>Phone Number</th>
                                <th>Registered Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredCustomers.map((customer, index) => (
                                <tr key={customer._id}>
                                    <td>{index + 1}</td>

                                    <td>
                                        {customer.name || 'N/A'}
                                    </td>

                                    <td>
                                        {customer.email || 'N/A'}
                                    </td>

                                    <td>
                                        {customer.phone || 'N/A'}
                                    </td>

                                    <td>
                                        {formatDate(customer.createdAt)}
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

export default CustomersSection;
