
import { useState } from 'react';
import {
    Layers,
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    AlertCircle
} from 'lucide-react';

function ServiceCategoriesSection({
    serviceCategories = [],
    serviceCategoriesLoading,
    serviceCategoriesError,
    fetchCategories,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    searchTerm
}) {
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const filteredCategories = serviceCategories.filter((category) => {
        const search = (searchTerm || '').toLowerCase();

        return (
            category.name?.toLowerCase().includes(search) ||
            category.description?.toLowerCase().includes(search)
        );
    });

    const openAddForm = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
        setShowForm(true);
    };

    const openEditForm = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || '',
            description: category.description || ''
        });
        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) return;

        setShowForm(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
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

        if (!formData.name || !formData.description.trim()) {
            window.alert('Please fill in all fields.');
            return;
        }

        try {
            setSaving(true);

            let success;

            if (editingCategory) {
                success = await handleUpdateCategory(
                    editingCategory._id,
                    formData
                );
            } else {
                success = await handleAddCategory(formData);
            }

            if (success) {
                setShowForm(false);
                setEditingCategory(null);
                setFormData({ name: '', description: '' });
            }
        } catch (error) {
            console.error('Category form submission failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (category) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${category.name}"?`
        );

        if (confirmed) {
            handleDeleteCategory(category._id);
        }
    };

    return (
        <div className="admin-service-categories-page">

            <div className="admin-welcome">
                <div>
                    <h1>Service Category Management</h1>
                    <p>Organize repair services into service categories.</p>
                </div>

                <span className="admin-role-label">
                    <Layers size={17} />
                    {serviceCategories.length} Categories
                </span>
            </div>

            <div className="admin-section-heading">
                <h2>All Service Categories</h2>
                <p>
                    Add, edit and manage Domestic and Commercial categories.
                </p>
            </div>

            <div className="admin-technician-toolbar">
                <h3>Service Categories</h3>

                <div>
                    <button
                        onClick={fetchCategories}
                        disabled={serviceCategoriesLoading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button onClick={openAddForm}>
                        <Plus size={17} />
                        Add Category
                    </button>
                </div>
            </div>

            {serviceCategoriesError && (
                <p className="admin-stat-error">
                    {serviceCategoriesError}
                </p>
            )}

            {serviceCategoriesLoading ? (
                <div className="admin-customer-message">
                    <RefreshCw size={25} />
                    <p>Loading service categories...</p>
                </div>
            ) : serviceCategoriesError ? (
                <div className="admin-customer-message">
                    <AlertCircle size={30} />
                    <p>Service categories could not be loaded.</p>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="admin-customer-message">
                    <Layers size={35} />
                    <h3>No categories found</h3>
                    <p>
                        {searchTerm
                            ? 'Try another search term.'
                            : 'Service categories will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="admin-customer-table-wrapper">
                    <table className="admin-category-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Category Name</th>
                                <th>Description</th>
                                <th>Created Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredCategories.map((category, index) => (
                                <tr key={category._id}>
                                    <td>{index + 1}</td>
                                    <td><strong>{category.name}</strong></td>
                                    <td>{category.description}</td>
                                    <td>
                                        {category.createdAt
                                            ? new Date(category.createdAt).toLocaleDateString('en-IN')
                                            : 'N/A'}
                                    </td>
                                    <td>
                                        <div className="admin-technician-actions">
                                            <button
                                                className="admin-approve-button"
                                                onClick={() => openEditForm(category)}
                                            >
                                                <Pencil size={15} />
                                                Edit
                                            </button>

                                            <button
                                                className="admin-reject-button"
                                                onClick={() => handleDelete(category)}
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

            {showForm && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">

                        <div className="admin-modal-header">
                            <h2>
                                {editingCategory
                                    ? 'Edit Service Category'
                                    : 'Add Service Category'}
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
                            <label>Category Name</label>

                            <select
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select category</option>
                                <option value="Domestic">Domestic</option>
                                <option value="Commercial">Commercial</option>
                            </select>

                            <label>Description</label>

                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter category description"
                                rows={4}
                                maxLength={500}
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
                                        : editingCategory
                                            ? 'Update Category'
                                            : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ServiceCategoriesSection;
