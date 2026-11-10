
import {
    HardHat,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    AlertCircle,
    Trash2
} from 'lucide-react';

function TechniciansSection({
    technicians,
    techniciansLoading,
    techniciansError,
    filteredTechnicians,
    updatingTechnician,
    handleTechnicianStatus,
    fetchTechnicians,
    formatDate,
    handleDeleteTechnician,
    deletingTechnician,
    getStatusClass,
    searchTerm
}) {
    return (
        <div className="admin-technicians-page">

            {/* Welcome Section */}
            <div className="admin-welcome">
                <div>
                    <h1>Technician Management</h1>
                    <p>
                        Review technician registrations and manage approvals.
                    </p>
                </div>

                <span className="admin-role-label">
                    <HardHat size={17} />
                    {technicians.length} Technicians
                </span>
            </div>

            {/* Section Heading */}
            <div className="admin-section-heading">
                <h2>All Technicians</h2>
                <p>
                    Approve or reject technician registration requests
                </p>
            </div>

            {/* Technician Summary */}
            <div className="admin-technician-summary">

                <div>
                    <Clock size={20} />
                    <span>
                        Pending: {
                            technicians.filter(
                                t => t.approvalStatus === 'pending'
                            ).length
                        }
                    </span>
                </div>

                <div>
                    <CheckCircle size={20} />
                    <span>
                        Approved: {
                            technicians.filter(
                                t => t.approvalStatus === 'approved'
                            ).length
                        }
                    </span>
                </div>

                <div>
                    <XCircle size={20} />
                    <span>
                        Rejected: {
                            technicians.filter(
                                t => t.approvalStatus === 'rejected'
                            ).length
                        }
                    </span>
                </div>

            </div>

            {/* Toolbar */}
            <div className="admin-technician-toolbar">
                <h3>Technician Records</h3>

                <button
                    onClick={fetchTechnicians}
                    disabled={techniciansLoading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {techniciansError && (
                <p className="admin-stat-error">
                    {techniciansError}
                </p>
            )}

            {/* Loading, Error and Empty States */}
            {techniciansLoading ? (

                <div className="admin-customer-message">
                    <RefreshCw size={25} />
                    <p>Loading technicians...</p>
                </div>

            ) : techniciansError ? (

                <div className="admin-customer-message">
                    <AlertCircle size={30} />
                    <p>Technician records could not be loaded.</p>
                </div>

            ) : filteredTechnicians.length === 0 ? (

                <div className="admin-customer-message">
                    <HardHat size={35} />
                    <h3>No technicians found</h3>

                    <p>
                        {searchTerm
                            ? 'Try another search term.'
                            : 'Technician registrations will appear here.'}
                    </p>
                </div>

            ) : (

                /* Technician Table */
                <div className="admin-customer-table-wrapper">
                    <table className="admin-technician-table">

                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Technician</th>
                                <th>Photo</th>
                                <th>Contact</th>
                                <th>Specialization</th>
                                <th>Experience</th>
                                <th>Registered</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredTechnicians.map((technician, index) => (
                                <tr key={technician._id}>

                                    <td>{index + 1}</td>

                                    <td>
                                        <strong>
                                            {technician.name || 'N/A'}
                                        </strong>
                                    </td>

                                    {/* Profile Photo */}
                                    <td>
                                        {technician.profilePhoto ? (
                                            <a
                                                href={technician.profilePhoto}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="View full profile photo"
                                            >
                                                <img
                                                    src={technician.profilePhoto}
                                                    alt={`${technician.name || 'Technician'} profile`}
                                                    className="admin-technician-profile-photo"
                                                />
                                            </a>
                                        ) : (
                                            <span className="admin-technician-no-photo">
                                                No Photo
                                            </span>
                                        )}
                                    </td>

                                    {/* Contact */}
                                    <td>
                                        <div>
                                            {technician.email || 'N/A'}
                                        </div>
                                        <small>
                                            {technician.phone || 'N/A'}
                                        </small>
                                    </td>

                                    {/* Specialization */}
                                    <td>
                                        {technician.specialization || 'N/A'}
                                    </td>

                                    {/* Experience */}
                                    <td>
                                        {technician.experience ?? 0} years
                                    </td>

                                    {/* Registration Date */}
                                    <td>
                                        {formatDate(technician.createdAt)}
                                    </td>

                                    {/* Approval Status */}
                                    <td>
                                        <span
                                            className={`admin-status-badge ${getStatusClass(technician.approvalStatus)}`}
                                        >
                                            {technician.approvalStatus || 'pending'}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td>
                                        <div className="admin-technician-actions">

                                            {/* Approve and Reject - Pending Only */}
                                            {technician.approvalStatus === 'pending' && (
                                                <>
                                                    <button
                                                        className="admin-approve-button"
                                                        onClick={() =>
                                                            handleTechnicianStatus(
                                                                technician._id,
                                                                'approved'
                                                            )
                                                        }
                                                        disabled={
                                                            updatingTechnician === technician._id ||
                                                            deletingTechnician === technician._id
                                                        }
                                                    >
                                                        <CheckCircle size={15} />
                                                        {updatingTechnician === technician._id
                                                            ? 'Please wait...'
                                                            : 'Approve'}
                                                    </button>

                                                    <button
                                                        className="admin-reject-button"
                                                        onClick={() =>
                                                            handleTechnicianStatus(
                                                                technician._id,
                                                                'rejected'
                                                            )
                                                        }
                                                        disabled={
                                                            updatingTechnician === technician._id ||
                                                            deletingTechnician === technician._id
                                                        }
                                                    >
                                                        <XCircle size={15} />
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {/* Delete - Available for All Statuses */}
                                            <button
                                                className="admin-reject-button"
                                                onClick={() =>
                                                    handleDeleteTechnician(technician)
                                                }
                                                disabled={
                                                    updatingTechnician === technician._id ||
                                                    deletingTechnician === technician._id
                                                }
                                            >
                                                <Trash2 size={15} />
                                                {deletingTechnician === technician._id
                                                    ? 'Deleting...'
                                                    : 'Delete'}
                                            </button>

                                        </div>
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

export default TechniciansSection;
