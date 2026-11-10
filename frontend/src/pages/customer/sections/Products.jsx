
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import axios from 'axios';

import {
  ShoppingBag,
  Search,
  RefreshCw,
  Package,
  AlertCircle,
  ShoppingCart,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';

import './Products.css';

const API_URL = 'http://localhost:3006/api';
const CART_KEY = 'gasconnect_cart';

const getSavedCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

const Products = ({ onCheckout }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState(getSavedCart);

  // Save cart between dashboard section changes and page reloads.
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${API_URL}/products`);
      const data = response.data.products || response.data;

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load products. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => [
    'All',
    ...new Set(products.map(p => p.category).filter(Boolean))
  ], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch =
        product.name?.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const addToCart = (product) => {
    if (!product.isAvailable || product.stock <= 0) return;

    setCart(previousCart => {
      const existing = previousCart.find(
        item => item.productId === product._id
      );

      if (existing) {
        if (existing.quantity >= product.stock) {
          return previousCart;
        }

        return previousCart.map(item =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previousCart,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.image || '',
          stock: product.stock,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (productId, change) => {
    setCart(previousCart =>
      previousCart
        .map(item => {
          if (item.productId !== productId) return item;

          const newQuantity = item.quantity + change;

          if (newQuantity < 1 || newQuantity > item.stock) {
            return item;
          }

          return { ...item, quantity: newQuantity };
        })
    );
  };

  const removeFromCart = (productId) => {
    setCart(previousCart =>
      previousCart.filter(item => item.productId !== productId)
    );
  };

  return (
    <div className="customer-products-page">

      <div className="products-heading">
        <div>
          <h2>Our Products</h2>
          <p>Explore gas appliances and accessories available at GasConnect.</p>
        </div>

        <button
          className="products-refresh"
          onClick={fetchProducts}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="products-toolbar">
        <div className="products-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* SHOPPING CART */}
      <section className="shopping-cart-section">
        <div className="shopping-cart-heading">
          <h3>
            <ShoppingCart size={21} />
            Your Cart ({cartCount})
          </h3>

          <div className="cart-heading-actions">
  <strong>
    Total: ₹{cartTotal.toLocaleString('en-IN')}
  </strong>

  <button
    className="checkout-btn"
    onClick={onCheckout}
    disabled={cart.length === 0}
  >
    Proceed to Checkout
  </button>
</div>
        </div>

        {cart.length === 0 ? (
          <p className="cart-empty">
            Your cart is empty. Add products to get started.
          </p>
        ) : (
          <div className="cart-items">
            {cart.map(item => (
              <div className="cart-item" key={item.productId}>
                <div className="cart-item-info">
                  <strong>{item.name}</strong>
                  <span>
                    ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                  </span>
                </div>

                <div className="cart-item-actions">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    disabled={item.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    disabled={item.quantity >= item.stock}
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>

                  <button
                    className="cart-remove"
                    onClick={() => removeFromCart(item.productId)}
                    aria-label="Remove product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="products-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="products-empty">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="products-empty">
          <Package size={38} />
          <h3>No products found</h3>
          <p>
            {products.length === 0
              ? 'No products have been added yet.'
              : 'Try changing your search or category.'}
          </p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => {
            const available =
              product.isAvailable !== false && product.stock > 0;

            const cartItem = cart.find(
              item => item.productId === product._id
            );

            return (
              <article
                className="customer-product-card"
                key={product._id}
              >
                <div className="customer-product-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <ShoppingBag size={48} />
                  )}
                </div>

                <div className="customer-product-details">
                  <span className="customer-product-category">
                    {product.category}
                  </span>

                  <h3>{product.name}</h3>

                  <p className="customer-product-description">
                    {product.description}
                  </p>

                  <div className="customer-product-price">
                    ₹{Number(product.price || 0).toLocaleString('en-IN')}
                  </div>

                  <div className="customer-product-footer">
                    <span
                      className={`product-availability ${
                        available ? 'available' : 'unavailable'
                      }`}
                    >
                      {available ? 'Available' : 'Out of Stock'}
                    </span>

                    {available && (
                      <span className="product-stock">
                        {product.stock} in stock
                      </span>
                    )}
                  </div>

                  <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product)}
                    disabled={
                      !available ||
                      (cartItem && cartItem.quantity >= product.stock)
                    }
                  >
                    <ShoppingCart size={17} />
                    {!available
                      ? 'Out of Stock'
                      : cartItem
                        ? `In Cart (${cartItem.quantity})`
                        : 'Add to Cart'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Products;
