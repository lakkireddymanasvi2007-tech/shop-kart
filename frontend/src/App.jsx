import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import OrderSuccess from './pages/OrderSuccess';
import { CartProvider } from './context/CartContext';
import { getMe, getWishlistCount } from './services/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Refresh wishlist count from backend
  const refreshWishlistCount = useCallback(async () => {
    try {
      const response = await getWishlistCount();
      if (response.data && typeof response.data.count === 'number') {
        setWishlistCount(response.data.count);
      }
    } catch {
      // Ignored if unauthenticated
    }
  }, []);

  // Check authentication session on mount & page refresh
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getMe();
        setIsLoggedIn(true);
        refreshWishlistCount();
      } catch {
        setIsLoggedIn(false);
        setWishlistCount(0);
      }
    };

    checkAuth();
  }, [refreshWishlistCount]);

  // When user logs in, update wishlist count
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    refreshWishlistCount();
  };

  return (
    <CartProvider isLoggedIn={isLoggedIn}>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          wishlistCount={wishlistCount}
          setWishlistCount={setWishlistCount}
        />
        <main className="flex-1">
          <Routes>
            {/* Auth Routes */}
            <Route path="/register" element={<Register />} />
            <Route
              path="/login"
              element={<Login setIsLoggedIn={handleLoginSuccess} />}
            />

            {/* User Profile / Dashboard Route */}
            <Route
              path="/home"
              element={<Home setIsLoggedIn={setIsLoggedIn} />}
            />

            {/* Product Discovery Routes */}
            <Route
              path="/products"
              element={
                <Products
                  isLoggedIn={isLoggedIn}
                  onWishlistChange={refreshWishlistCount}
                />
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProductDetails
                  isLoggedIn={isLoggedIn}
                  onWishlistChange={refreshWishlistCount}
                />
              }
            />

            {/* Wishlist Route */}
            <Route
              path="/wishlist"
              element={<Wishlist onWishlistUpdated={refreshWishlistCount} />}
            />

            {/* Shopping Cart Route */}
            <Route
              path="/cart"
              element={<Cart isLoggedIn={isLoggedIn} />}
            />

            {/* Lab-06 Checkout Route */}
            <Route
              path="/checkout"
              element={<Checkout isLoggedIn={isLoggedIn} />}
            />

            {/* Lab-06 Order Confirmation Route */}
            <Route
              path="/order-success/:id"
              element={<OrderSuccess />}
            />

            {/* Lab-06 My Orders Route */}
            <Route
              path="/orders"
              element={<Orders isLoggedIn={isLoggedIn} />}
            />

            {/* Lab-06 Single Order Details Route */}
            <Route
              path="/orders/:id"
              element={<OrderDetails isLoggedIn={isLoggedIn} />}
            />

            {/* Root and Catch-all redirects */}
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
          <p>© 2026 ShopKart Inc. Fullstack Engineering Lab 06 — Checkout & Orders.</p>
        </footer>
      </div>
    </CartProvider>
  );
}

export default App;
