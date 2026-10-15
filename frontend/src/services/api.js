import axios from 'axios';

// Create an Axios instance with base URL pointing to backend
const API = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // Send HttpOnly cookies with every request
});

// ============================================
// Customer Authentication APIs (Lab-01 & Lab-02)
// ============================================
export const registerCustomer = (data) => {
  return API.post('/customers/register', data);
};

export const loginCustomer = (data) => {
  return API.post('/customers/login', data);
};

export const getMe = () => {
  return API.get('/customers/me');
};

export const logoutCustomer = () => {
  return API.post('/customers/logout');
};

// ============================================
// Product APIs (Lab-03)
// ============================================

// Get all products (with optional search, category, sort)
export const getAllProducts = (params = {}) => {
  return API.get('/products', { params });
};

// Get a single product by MongoDB _id
export const getProductById = (id) => {
  return API.get(`/products/${id}`);
};

// Create a new product (open API for Lab-03)
export const createProduct = (data) => {
  return API.post('/products', data);
};

// ============================================
// Wishlist APIs (Lab-04)
// ============================================

// Get current authenticated customer's populated wishlist
export const getWishlist = () => {
  return API.get('/wishlist');
};

// Add product to wishlist
export const addToWishlist = (productId) => {
  return API.post(`/wishlist/${productId}`);
};

// Remove product from wishlist
export const removeFromWishlist = (productId) => {
  return API.delete(`/wishlist/${productId}`);
};

// Toggle product in wishlist (Bonus Task 23)
export const toggleWishlist = (productId) => {
  return API.patch(`/wishlist/${productId}/toggle`);
};

// Get wishlist items count (Bonus Task 24)
export const getWishlistCount = () => {
  return API.get('/wishlist/count');
};

// ============================================
// Cart APIs (Lab-05)
// ============================================

// Get current authenticated customer's populated cart
export const getCart = () => {
  return API.get('/cart');
};

// Add product to cart (or increment quantity if already present)
export const addToCart = (productId) => {
  return API.post(`/cart/${productId}`);
};

// Update product quantity in cart
export const updateCartQuantity = (productId, quantity) => {
  return API.patch(`/cart/${productId}`, { quantity });
};

// Remove product from cart
export const removeFromCart = (productId) => {
  return API.delete(`/cart/${productId}`);
};

// Clear all items from cart
export const clearCart = () => {
  return API.delete('/cart');
};

// Get cart items count
export const getCartCount = () => {
  return API.get('/cart/count');
};

// ============================================
// Order & Checkout APIs (Lab-06)
// ============================================

// Create ShopKart pending order + Razorpay Order
export const createPaymentOrder = (shippingAddress) => {
  return API.post('/orders/create-payment-order', { shippingAddress });
};

// Verify Razorpay payment signature & confirm order
export const verifyPayment = (paymentData) => {
  return API.post('/orders/verify-payment', paymentData);
};

// Get all orders of current authenticated user
export const getMyOrders = () => {
  return API.get('/orders');
};

// Get a single order by ID
export const getOrderById = (orderId) => {
  return API.get(`/orders/${orderId}`);
};

// Bonus: Update order status progression
export const updateOrderStatus = (orderId, status) => {
  return API.patch(`/orders/${orderId}/status`, { status });
};

export default API;
