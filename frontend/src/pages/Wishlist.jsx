import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../services/api';
import WishlistCard from '../components/WishlistCard';

function Wishlist({ onWishlistUpdated }) {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Fetch current user's wishlist
  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getWishlist();

      if (response.data && Array.isArray(response.data.wishlist)) {
        setWishlist(response.data.wishlist);
      } else if (Array.isArray(response.data)) {
        setWishlist(response.data);
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      const status = err.response?.status;
      if (status === 401) {
        // If unauthenticated, redirect to login
        navigate('/login', {
          state: { message: 'Please log in to view your wishlist.' },
        });
      } else {
        setError(
          err.response?.data?.message || "We couldn't load your wishlist."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Handle removing a product from the wishlist
  const handleRemoveProduct = async (productId) => {
    try {
      await removeFromWishlist(productId);

      // Remove from local state without full page refresh
      setWishlist((prev) => prev.filter((item) => item._id !== productId));
      setActionSuccess('Product removed from your wishlist.');
      setTimeout(() => setActionSuccess(''), 3000);

      if (onWishlistUpdated) {
        onWishlistUpdated();
      }
    } catch (err) {
      console.error('Error removing item from wishlist:', err);
      alert(
        err.response?.data?.message ||
          'Failed to remove product. Please try again.'
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-10rem)]">
      {/* 1. LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800">
            Loading your wishlist...
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Retrieving your saved items from the server
          </p>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <div className="max-w-md mx-auto my-16 bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-900 mb-2">
            Something went wrong.
          </h2>
          <p className="text-sm text-red-700 mb-6">{error}</p>
          <button
            onClick={fetchWishlist}
            className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 3. EMPTY STATE */}
      {!loading && !error && wishlist.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
          <div className="text-6xl mb-4 animate-bounce">❤️</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
            Save products you love and find them here later. Start exploring our
            collection today!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all hover:shadow-lg"
          >
            <span>Browse Products</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* 4. SUCCESS / WISHLIST CONTENT */}
      {!loading && !error && wishlist.length > 0 && (
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>My Wishlist</span>
                <span className="text-red-500 text-2xl">❤️</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {wishlist.length} {wishlist.length === 1 ? 'product' : 'products'} saved
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors"
            >
              <span>← Continue Shopping</span>
            </Link>
          </div>

          {/* Action Success Toast Notification */}
          {actionSuccess && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm text-center font-medium animate-fade-in">
              {actionSuccess}
            </div>
          )}

          {/* Wishlist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <WishlistCard
                key={product._id}
                product={product}
                onRemove={handleRemoveProduct}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Wishlist;
