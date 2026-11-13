
import { useState } from 'react';

import {
    Package,
    AlertCircle,
    RefreshCw,
    Eye
} from 'lucide-react';

function ProductsSection({
    products = [],
    productsLoading = false,
    productsError = '',
    fetchProducts = () => {},
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleRestockProduct,
    handleToggleAvailability,
    searchTerm = ''
}) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortOption, setSortOption] = useState('default');

    const [restockProduct, setRestockProduct] = useState(null);
    const [restockQuantity, setRestockQuantity] = useState('');

    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: '',
        image: ''
    });

    // Handle form inputs
    const handleProductInputChange = (e) => {
        const { name, value } = e.target;

        setNewProduct((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Get unique categories
    const categories = [
        ...new Set(
            products
                .map((product) => product.category?.trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    // Inventory statistics
    const totalProducts = products.length;

    const totalStock = products.reduce(
        (total, product) => total + Number(product.stock || 0),
        0
    );

    const lowStockProducts = products.filter(
        (product) =>
            Number(product.stock) > 0 &&
            Number(product.stock) <= 5
    );

    const lowStockCount = lowStockProducts.length;

    const outOfStockCount = products.filter(
        (product) => Number(product.stock) === 0
    ).length;

    // Search and category filtering
    const filteredProducts = products.filter((product) => {
        const search = searchTerm.trim().toLowerCase();

        const matchesSearch =
            product.name?.toLowerCase().includes(search) ||
            product.category?.toLowerCase().includes(search) ||
            product.description?.toLowerCase().includes(search);

        const matchesCategory =
            selectedCategory === 'all' ||
            product.category?.trim().toLowerCase() ===
                selectedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
    });

    // Sort filtered products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortOption) {
            case 'name-asc':
                return (a.name || '').localeCompare(b.name || '');

            case 'name-desc':
                return (b.name || '').localeCompare(a.name || '');

            case 'price-asc':
                return Number(a.price || 0) - Number(b.price || 0);

            case 'price-desc':
                return Number(b.price || 0) - Number(a.price || 0);

            case 'stock-asc':
                return Number(a.stock || 0) - Number(b.stock || 0);

            case 'stock-desc':
                return Number(b.stock || 0) - Number(a.stock || 0);

            default:
                return 0;
        }
    });

    // Reset product form
    const resetForm = () => {
        setShowAddForm(false);
        setEditingProduct(null);

        setNewProduct({
            name: '',
            description: '',
            category: '',
            price: '',
            stock: '',
            image: ''
        });
    };

    // Open edit form
    const openEditForm = (product) => {
        setEditingProduct(product);

        setNewProduct({
            name: product.name || '',
            description: product.description || '',
            category: product.category || '',
            price: product.price ?? '',
            stock: product.stock ?? '',
            image: product.image || ''
        });

        setShowAddForm(true);
    };

    // Submit add/edit product form
    const submitProductForm = async (e) => {
        e.preventDefault();

        const price = Number(newProduct.price);
        const stock = Number(newProduct.stock);

        if (!newProduct.name.trim() || !newProduct.category.trim()) {
            alert('Please enter the product name and category.');
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            alert('Please enter a valid price.');
            return;
        }

        if (!Number.isInteger(stock) || stock < 0) {
            alert('Please enter a valid stock quantity.');
            return;
        }

        const productData = {
            ...newProduct,
            name: newProduct.name.trim(),
            description: newProduct.description.trim(),
            category: newProduct.category.trim(),
            price,
            stock
        };

        try {
            const success = editingProduct
                ? await handleUpdateProduct(
                    editingProduct._id,
                    productData
                )
                : await handleAddProduct(productData);

            if (success) {
                resetForm();
            }
        } catch (error) {
            console.error('Product form error:', error);
        }
    };

    // Delete product
    const confirmDeleteProduct = async (product) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${product.name}"?`
        );

        if (confirmed) {
            await handleDeleteProduct(product._id);
        }
    };

    // Open restock modal
    const openRestockModal = (product) => {
        setRestockProduct(product);
        setRestockQuantity('');
    };

    // Close restock modal
    const closeRestockModal = () => {
        setRestockProduct(null);
        setRestockQuantity('');
    };

    // Submit restock quantity
    const submitRestock = async (e) => {
        e.preventDefault();

        const quantity = Number(restockQuantity);

        if (!Number.isInteger(quantity) || quantity <= 0) {
            alert('Enter a valid quantity greater than zero.');
            return;
        }

        const success = await handleRestockProduct(
            restockProduct._id,
            quantity
        );

        if (success) {
            closeRestockModal();
        }
    };

    // Toggle product availability
    const toggleAvailability = async (product) => {
        await handleToggleAvailability(
            product._id,
            product.isAvailable !== false
        );
    };

    // Get stock status
    const getStockStatus = (stock) => {
        if (Number(stock) === 0) {
            return 'Out of Stock';
        }

        if (Number(stock) <= 5) {
            return 'Low Stock';
        }

        return 'In Stock';
    };

    return (
        <div className="admin-products-page">

            {/* Page Header */}
            <div className="admin-welcome">
                <div>
                    <h1>Products & Inventory</h1>
                    <p>Manage products and monitor inventory.</p>
                </div>

                <span className="admin-role-label">
                    <Package size={17} />
                    {products.length} Products
                </span>
            </div>

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
                <div className="admin-low-stock-alert">
                    <AlertCircle size={22} />

                    <div>
                        <h3>Low Stock Alert</h3>

                        <p>
                            {lowStockCount} product(s) have only
                            1–5 units remaining. Please restock them soon.
                        </p>

                        <div className="admin-low-stock-list">
                            <h3>Products Requiring Restock</h3>

                            {lowStockProducts.map((product) => (
                                <div
                                    className="admin-low-stock-item"
                                    key={product._id}
                                >
                                    <div>
                                        <strong>{product.name}</strong>
                                        <p>
                                            {product.stock} units remaining
                                        </p>
                                    </div>

                                    <button
                                        className="admin-restock-button"
                                        onClick={() =>
                                            openRestockModal(product)
                                        }
                                    >
                                        Restock
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Heading */}
            <div className="admin-section-heading">
                <h2>Inventory Management</h2>
                <p>View and manage your available products.</p>
            </div>

            {/* Statistics */}
            <div className="admin-stats-grid">

                <div className="admin-stat-card">
                    <Package size={25} />

                    <div className="admin-stat-info">
                        <h3>Total Products</h3>
                        <p className="admin-stat-value">{totalProducts}</p>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <Package size={25} />

                    <div className="admin-stat-info">
                        <h3>Total Stock</h3>
                        <p className="admin-stat-value">{totalStock}</p>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <AlertCircle size={25} />

                    <div className="admin-stat-info">
                        <h3>Low Stock</h3>
                        <p className="admin-stat-value">{lowStockCount}</p>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <AlertCircle size={25} />

                    <div className="admin-stat-info">
                        <h3>Out of Stock</h3>
                        <p className="admin-stat-value">{outOfStockCount}</p>
                    </div>
                </div>

            </div>

            {/* Products Toolbar */}
            <div className="admin-products-toolbar">

                <h3>All Products</h3>

                <div className="admin-products-toolbar-actions">

                    {/* Category Filter */}
                    <select
                        className="admin-category-filter"
                        value={selectedCategory}
                        onChange={(e) =>
                            setSelectedCategory(e.target.value)
                        }
                    >
                        <option value="all">All Categories</option>

                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    {/* Product Sorting */}
                    <select
                        className="admin-category-filter"
                        value={sortOption}
                        onChange={(e) =>
                            setSortOption(e.target.value)
                        }
                    >
                        <option value="default">Default Sorting</option>
                        <option value="name-asc">Name: A–Z</option>
                        <option value="name-desc">Name: Z–A</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="stock-asc">Stock: Low to High</option>
                        <option value="stock-desc">Stock: High to Low</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                        className="admin-refresh-button"
                        onClick={fetchProducts}
                        disabled={productsLoading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    {/* Add Product Button */}
                    <button
                        className="admin-add-button"
                        onClick={() => {
                            setEditingProduct(null);
                            setNewProduct({
                                name: '',
                                description: '',
                                category: '',
                                price: '',
                                stock: '',
                                image: ''
                            });
                            setShowAddForm(true);
                        }}
                    >
                        + Add Product
                    </button>

                </div>
            </div>

            {/* Add / Edit Product Modal */}
            {showAddForm && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">

                        <h2>
                            {editingProduct
                                ? 'Edit Product'
                                : 'Add New Product'}
                        </h2>

                        <p>
                            {editingProduct
                                ? 'Update the product details below.'
                                : 'Enter the product details below.'}
                        </p>

                        <form onSubmit={submitProductForm}>

                            <div className="admin-form-group">
                                <label>Product Name</label>

                                <input
                                    type="text"
                                    name="name"
                                    value={newProduct.name}
                                    onChange={handleProductInputChange}
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Description</label>

                                <textarea
                                    name="description"
                                    value={newProduct.description}
                                    onChange={handleProductInputChange}
                                    placeholder="Enter product description"
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Category</label>

                                <input
                                    type="text"
                                    name="category"
                                    value={newProduct.category}
                                    onChange={handleProductInputChange}
                                    placeholder="Enter category"
                                    required
                                />
                            </div>

                            <div className="admin-form-row">

                                <div className="admin-form-group">
                                    <label>Price (₹)</label>

                                    <input
                                        type="number"
                                        name="price"
                                        value={newProduct.price}
                                        onChange={handleProductInputChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter price"
                                        required
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label>Stock Quantity</label>

                                    <input
                                        type="number"
                                        name="stock"
                                        value={newProduct.stock}
                                        onChange={handleProductInputChange}
                                        min="0"
                                        step="1"
                                        placeholder="Enter stock"
                                        required
                                    />
                                </div>

                            </div>

                            <div className="admin-form-group">
                                <label>Product Image URL</label>

                                <input
                                    type="url"
                                    name="image"
                                    value={newProduct.image}
                                    onChange={handleProductInputChange}
                                    placeholder="Enter image URL (optional)"
                                />
                            </div>

                            {newProduct.image && (
                                <div className="admin-product-image-preview">
                                    <label>Image Preview</label>

                                    <img
                                        src={newProduct.image}
                                        alt="Product preview"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            <div className="admin-modal-actions">

                                <button
                                    type="button"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>

                                <button type="submit">
                                    {editingProduct
                                        ? 'Update Product'
                                        : 'Add Product'}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {restockProduct && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">

                        <h2>Restock Product</h2>

                        <p>
                            Product: <strong>{restockProduct.name}</strong>
                        </p>

                        <p>
                            Current Stock: <strong>{restockProduct.stock}</strong>
                        </p>

                        <form onSubmit={submitRestock}>

                            <div className="admin-form-group">
                                <label>Quantity to Add</label>

                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={restockQuantity}
                                    onChange={(e) =>
                                        setRestockQuantity(e.target.value)
                                    }
                                    placeholder="Enter quantity"
                                    required
                                />
                            </div>

                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    onClick={closeRestockModal}
                                >
                                    Cancel
                                </button>

                                <button type="submit">
                                    Confirm Restock
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {productsError && (
                <p className="admin-stat-error">
                    {productsError}
                </p>
            )}

            {/* Products Table */}
            {productsLoading ? (

                <div className="admin-customer-message">
                    <RefreshCw size={25} />
                    <p>Loading products...</p>
                </div>

            ) : productsError ? (

                <div className="admin-customer-message">
                    <AlertCircle size={30} />
                    <p>Products could not be loaded.</p>
                </div>

            ) : sortedProducts.length === 0 ? (

                <div className="admin-customer-message">
                    <Package size={35} />

                    <h3>No products found</h3>

                    <p>
                        {selectedCategory !== 'all' || searchTerm
                            ? 'Try changing your search or category filter.'
                            : 'Your products will appear here.'}
                    </p>

                    {(selectedCategory !== 'all' || searchTerm) && (
                        <button
                            onClick={() => {
                                setSelectedCategory('all');
                            }}
                        >
                            Clear Category Filter
                        </button>
                    )}
                </div>

            ) : (

                <div className="admin-customer-table-wrapper">
                    <table className="admin-products-table">

                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Image</th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Availability</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedProducts.map((product, index) => {

                                const isAvailable =
                                    product.isAvailable !== false;

                                return (
                                    <tr key={product._id}>

                                        <td>{index + 1}</td>

                                        <td>
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="admin-product-thumbnail"
                                                />
                                            ) : (
                                                <Package size={25} />
                                            )}
                                        </td>

                                        <td>
                                            <strong>{product.name}</strong>
                                        </td>

                                        <td>{product.category}</td>

                                        <td>
                                            ₹{Number(product.price || 0).toLocaleString('en-IN')}
                                        </td>

                                        <td>{product.stock}</td>

                                        {/* Stock Status */}
                                        <td>
                                            {Number(product.stock) === 0 ? (
                                                <span className="admin-status-badge rejected">
                                                    Out of Stock
                                                </span>
                                            ) : Number(product.stock) <= 5 ? (
                                                <span className="admin-status-badge pending">
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="admin-status-badge approved">
                                                    In Stock
                                                </span>
                                            )}
                                        </td>

                                        {/* Availability */}
                                        <td>
                                            <div className="admin-availability-actions">

                                                <span
                                                    className={`admin-status-badge ${
                                                        isAvailable
                                                            ? 'approved'
                                                            : 'rejected'
                                                    }`}
                                                >
                                                    {isAvailable
                                                        ? 'Available'
                                                        : 'Unavailable'}
                                                </span>

                                                <button
                                                    className="admin-availability-button"
                                                    onClick={() =>
                                                        toggleAvailability(product)
                                                    }
                                                >
                                                    {isAvailable
                                                        ? 'Disable'
                                                        : 'Enable'}
                                                </button>

                                            </div>
                                        </td>

                                        {/* Product Actions */}
                                        <td>
                                            <div className="admin-product-row-actions">

                                                <button
                                                    className="admin-view-button"
                                                    onClick={() =>
                                                        setViewingProduct(product)
                                                    }
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>

                                                <button
                                                    className="admin-edit-button"
                                                    onClick={() =>
                                                        openEditForm(product)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="admin-delete-button"
                                                    onClick={() =>
                                                        confirmDeleteProduct(product)
                                                    }
                                                >
                                                    Delete
                                                </button>

                                                <button
                                                    className="admin-restock-button"
                                                    onClick={() =>
                                                        openRestockModal(product)
                                                    }
                                                >
                                                    Restock
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>

                    </table>
                </div>
            )}

            {/* Product Details Modal */}
            {viewingProduct && (
                <div
                    className="admin-modal-overlay"
                    onClick={() => setViewingProduct(null)}
                >
                    <div
                        className="admin-modal product-details-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <h2>Product Details</h2>

                        {viewingProduct.image ? (
                            <img
                                src={viewingProduct.image}
                                alt={viewingProduct.name}
                                className="product-details-image"
                            />
                        ) : (
                            <div className="product-details-no-image">
                                <Package size={50} />
                                <p>No product image available</p>
                            </div>
                        )}

                        <div className="product-details-content">

                            <h3>{viewingProduct.name}</h3>

                            <p>
                                <strong>Description:</strong>{' '}
                                {viewingProduct.description ||
                                    'No description available'}
                            </p>

                            <p>
                                <strong>Category:</strong>{' '}
                                {viewingProduct.category || 'Not specified'}
                            </p>

                            <p>
                                <strong>Price:</strong>{' '}
                                ₹{Number(viewingProduct.price || 0).toLocaleString('en-IN')}
                            </p>

                            <p>
                                <strong>Available Stock:</strong>{' '}
                                {viewingProduct.stock}
                            </p>

                            <p>
                                <strong>Stock Status:</strong>{' '}
                                {getStockStatus(viewingProduct.stock)}
                            </p>

                            <p>
                                <strong>Availability:</strong>{' '}
                                {viewingProduct.isAvailable === false
                                    ? 'Disabled'
                                    : 'Enabled'}
                            </p>

                        </div>

                        <div className="admin-modal-actions">
                            <button
                                type="button"
                                onClick={() => setViewingProduct(null)}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default ProductsSection;
