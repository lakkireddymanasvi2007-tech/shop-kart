import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
} from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children, isLoggedIn }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Helper to set loading state for a specific item action
  const setItemAction = (productId, action) => {
    setActionLoading((prev) => {
      if (!action) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: action };
    });
  };

  // Refresh cart from backend
  const refreshCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getCart();
      if (response.data && Array.isArray(response.data.cart)) {
        setCartItems(response.data.cart);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      // Only set error if logged in
      if (err.response?.status !== 401) {
        setError(
          err.response?.data?.message || 'Unable to load your cart. Please try again.'
        );
      } else {
        setCartItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Load cart whenever login state changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add product to cart (or increment quantity)
  const addToCart = async (productId) => {
    setItemAction(productId, 'adding');
    try {
      const response = await apiAddToCart(productId);
      if (response.data && Array.isArray(response.data.cart)) {
        setCartItems(response.data.cart);
      } else {
        await refreshCart();
      }
      return {
        success: true,
        message: response.data?.message || 'Added to cart',
      };
    } catch (err) {
      console.error('Error adding to cart:', err);
      const message =
        err.response?.data?.message || 'Failed to add product to cart';
      throw new Error(message);
    } finally {
      setItemAction(productId, null);
    }
  };

  // Update product quantity in cart
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setItemAction(productId, 'updating');
    try {
      const response = await apiUpdateCartQuantity(productId, newQuantity);
      if (response.data && Array.isArray(response.data.cart)) {
        setCartItems(response.data.cart);
      } else {
        await refreshCart();
      }
      return {
        success: true,
        message: response.data?.message || 'Quantity updated',
      };
    } catch (err) {
      console.error('Error updating cart quantity:', err);
      const message =
        err.response?.data?.message || 'Failed to update quantity';
      throw new Error(message);
    } finally {
      setItemAction(productId, null);
    }
  };

  // Remove product from cart
  const removeFromCart = async (productId) => {
    setItemAction(productId, 'removing');
    try {
      const response = await apiRemoveFromCart(productId);
      if (response.data && Array.isArray(response.data.cart)) {
        setCartItems(response.data.cart);
      } else {
        // Fallback: local filter
        setCartItems((prev) =>
          prev.filter(
            (item) =>
              (item.product?._id || item.product)?.toString() !==
              productId.toString()
          )
        );
      }
      return {
        success: true,
        message: response.data?.message || 'Product removed from cart',
      };
    } catch (err) {
      console.error('Error removing from cart:', err);
      const message =
        err.response?.data?.message || 'Failed to remove product from cart';
      throw new Error(message);
    } finally {
      setItemAction(productId, null);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      await apiClearCart();
      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  // Reset cart state upon logout
  const resetCartState = () => {
    setCartItems([]);
    setError(null);
    setActionLoading({});
  };

  // Derived Values (Task 15)
  // 1. Total items count (sum of all quantities: keyboard x 2 + mouse x 1 = 3)
  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  }, [cartItems]);

  // 2. Unique products count
  const uniqueCount = cartItems.length;

  // 3. Subtotal: Σ(product.price × quantity)
  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      const qty = item.quantity || 0;
      return total + price * qty;
    }, 0);
  }, [cartItems]);

  // 4. Helper to get product quantity in cart
  const getItemQuantity = useCallback(
    (productId) => {
      const item = cartItems.find(
        (i) => (i.product?._id || i.product)?.toString() === productId?.toString()
      );
      return item ? item.quantity : 0;
    },
    [cartItems]
  );

  // 5. Helper to check if product is in cart
  const isInCart = useCallback(
    (productId) => {
      return cartItems.some(
        (i) => (i.product?._id || i.product)?.toString() === productId?.toString()
      );
    },
    [cartItems]
  );

  const value = {
    cartItems,
    loading,
    error,
    actionLoading,
    cartCount,
    totalItems: cartCount,
    uniqueCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    resetCartState,
    getItemQuantity,
    isInCart,
    isItemLoading: (productId) => !!actionLoading[productId],
    getItemAction: (productId) => actionLoading[productId] || null,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
