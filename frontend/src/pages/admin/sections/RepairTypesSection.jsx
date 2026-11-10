
import { useState } from 'react';
import {
    Wrench,
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    AlertCircle
} from 'lucide-react';

function RepairTypesSection({
    repairTypes = [],
    serviceCategories = [],
    repairTypesLoading,
    repairTypesError,
    fetchRepairTypes,
    handleAddRepairType,
    handleUpdateRepairType,
    handleDeleteRepairType,
    searchTerm
}) {
    const [showForm, setShowForm] = useState(false);
    const [editingRepair, setEditingRepair] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: ''
    });

    const filteredRepairTypes = repairTypes.filter((repair) => {
        const search = (searchTerm || '').toLowerCase();

        return (
            repair.name?.toLowerCase().includes(search) ||
            repair.description?.toLowerCase().includes(search) ||
            repair.category?.name?.toLowerCase().includes(search)
        );
    });

    const openAddForm = () => {
        setEditingRepair(null);
        setFormData({
            name: '',
            description: '',
            category: '',
            price: ''
        });
        setShowForm(true);
    };

    const openEditForm = (repair) => {
        setEditingRepair(repair);
        setFormData({
            name: repair.name || '',
            description: repair.description || '',
            category: repair.category?._id || repair.category || '',
            price: repair.price ?? ''
        });
        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) return;

        setShowForm(false);
        setEditingRepair(null);
        setFormData({
            name: '',
            description: '',
            category: '',
            price: ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !formData.name.trim() ||
            !formData.description.trim() ||
            !formData.category ||
            formData.price === '' ||
            Number(formData.price) < 0
        ) {
            window.alert('Please enter valid details in all fields.');
            return;
        }

        const data = {
            ...formData,
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: Number(formData.price)
        };

        try {
            setSaving(true);

            let success;

            if (editingRepair) {
                success = await handleUpdateRepairType(
                    editingRepair._id,
                    data
                );
            } else {
                success = await handleAddRepairType(data);
            }

            if (success) {
                setShowForm(false);
                setEditingRepair(null);
                setFormData({
                    name: '',
                    description: '',
                    category: '',
                    price: ''
                });
            }
        } catch (error) {
            console.error('Repair type submission failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (repair) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${repair.name}"?`
        );

        if (confirmed) {
            handleDeleteRepairType(repair._id);
        }
    };

    return (
        <div className="admin-repair-types-page">

            {/* Welcome Section */}
            <div className="admin-welcome">
                <div>
                    <h1>Repair Type Management</h1>
                    <p>Manage repair services and their categories.</p>
                </div>

                <span className="admin-role-label">
                    <Wrench size={17} />
                    {repairTypes.length} Repair Types
                </span>
            </div>

            {/* Section Heading */}
            <div className="admin-section-heading">
                <h2>All Repair Types</h2>
                <p>Add, update and manage available repair services.</p>
            </div>

            {/* Toolbar */}
            <div className="admin-technician-toolbar">
                <h3>Repair Services</h3>

                <div>
                    <button
                        onClick={fetchRepairTypes}
                        disabled={repairTypesLoading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button onClick={openAddForm}>
                        <Plus size={17} />
                        Add Repair Type
                    </button>
                </div>
            </div>

            {repairTypesError && (
                <p className="admin-stat-error">
                    {repairTypesError}
                </p>
            )}

            {/* Loading and Data States */}
            {repairTypesLoading ? (
                <div className="admin-customer-message">
                    <RefreshCw size={25} />
                    <p>Loading repair types...</p>
                </div>
            ) : repairTypesError ? (
                <div className="admin-customer-message">
                    <AlertCircle size={30} />
                    <p>Repair types could not be loaded.</p>
                </div>
            ) : filteredRepairTypes.length === 0 ? (
                <div className="admin-customer-message">
                    <Wrench size={35} />
                    <h3>No repair types found</h3>
                    <p>
                        {searchTerm
                            ? 'Try another search term.'
                            : 'Add a repair type to get started.'}
                    </p>
                </div>
            ) : (
                <div className="admin-customer-table-wrapper">
                    <table className="admin-repair-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Repair Type</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRepairTypes.map((repair, index) => (
                                <tr key={repair._id}>
                                    <td>{index + 1}</td>
                                    <td><strong>{repair.name}</strong></td>
                                    <td>{repair.description}</td>
                                    <td>{repair.category?.name || 'N/A'}</td>
                                    <td>
                                        ₹{Number(repair.price || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td>
                                        <div className="admin-technician-actions">
                                            <button
                                                className="admin-approve-button"
                                                onClick={() => openEditForm(repair)}
                                            >
                                                <Pencil size={15} />
                                                Edit
                                            </button>

                                            <button
                                                className="admin-reject-button"
                                                onClick={() => handleDelete(repair)}
                                            >
                                                <Trash2 size={15} />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit Modal */}
            {showForm && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">

                        <div className="admin-modal-header">
                            <h2>
                                {editingRepair
                                    ? 'Edit Repair Type'
                                    : 'Add Repair Type'}
                            </h2>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label>Repair Type Name</label>

                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter repair type name"
                                minLength={2}
                                maxLength={100}
                                required
                            />

                            <label>Description</label>

                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter repair description"
                                rows={4}
                                maxLength={500}
                                required
                            />

                            <label>Service Category</label>

                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select category</option>

                                {serviceCategories.map((category) => (
                                    <option
                                        key={category._id}
                                        value={category._id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>

                            <label>Price (₹)</label>

                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Enter price"
                                min="0"
                                step="0.01"
                                required
                            />

                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button type="submit" disabled={saving}>
                                    {saving
                                        ? 'Saving...'
                                        : editingRepair
                                            ? 'Update Repair Type'
                                            : 'Add Repair Type'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RepairTypesSection;
