import { Link, useNavigate } from 'react-router-dom';
import { logoutCustomer } from '../services/api';
import { useCart } from '../context/CartContext';

function Navbar({ isLoggedIn, setIsLoggedIn, wishlistCount, setWishlistCount }) {
  const navigate = useNavigate();
  const { totalItems, resetCartState } = useCart();

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      if (setWishlistCount) setWishlistCount(0);
      resetCartState();
      navigate('/login');
    }
  };

  return (
    <header className="bg-indigo-600 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/products" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 bg-white/10 group-hover:bg-white/20 transition-colors rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
            </div>
            <span className="text-white text-xl font-extrabold tracking-tight">
              ShopKart
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <Link
              to="/products"
              className="text-indigo-100 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Products
            </Link>

            {/* Wishlist Link with dynamic count */}
            <Link
              to="/wishlist"
              className="text-indigo-100 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <span>Wishlist</span>
              {wishlistCount > 0 ? (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {wishlistCount}
                </span>
              ) : (
                <span className="text-xs text-indigo-200">♡</span>
              )}
            </Link>

            {/* Cart Link with dynamic total units count (Task 16) */}
            <Link
              to="/cart"
              className="text-indigo-100 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <span>Cart</span>
              {totalItems > 0 ? (
                <span className="bg-amber-400 text-indigo-950 text-xs px-2 py-0.5 rounded-full font-extrabold animate-fade-in shadow-2xs">
                  {totalItems}
                </span>
              ) : (
                <span className="text-xs text-indigo-200">(0)</span>
              )}
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/orders"
                  className="text-indigo-100 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  My Orders
                </Link>
                <Link
                  to="/home"
                  className="text-indigo-100 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors hidden md:block"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-indigo-100 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-indigo-600 hover:bg-indigo-50 px-3.5 py-1.5 rounded-lg text-sm font-semibold shadow-xs transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
