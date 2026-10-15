import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getProductById,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from '../services/api';
import { useCart } from '../context/CartContext';

function ProductDetails({ isLoggedIn, onWishlistChange }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, getItemQuantity, isItemLoading } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartError, setCartError] = useState('');
  const [addedMessage, setAddedMessage] = useState('');

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistSaving, setIsWishlistSaving] = useState(false);
  const [wishlistError, setWishlistError] = useState('');

  const cartQty = getItemQuantity(id);
  const isAddingToCart = isItemLoading(id);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getProductById(id);

        if (response.data && response.data.product) {
          setProduct(response.data.product);
        } else if (response.data) {
          setProduct(response.data);
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError(
          err.response?.data?.message ||
            'Something went wrong while loading the product details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Check if product is wishlisted
  useEffect(() => {
    if (isLoggedIn && id) {
      getWishlist()
        .then((res) => {
          if (res.data?.wishlist) {
            const exists = res.data.wishlist.some(
              (item) => (item._id || item) === id
            );
            setIsWishlisted(exists);
          }
        })
        .catch(() => {});
    }
  }, [id, isLoggedIn]);

  const handleImageError = (e) => {
    e.target.src =
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60';
  };

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;

    if (cartQty >= product.stock) {
      setCartError(`Maximum stock limit (${product.stock}) already in cart.`);
      setTimeout(() => setCartError(''), 3000);
      return;
    }

    setCartError('');
    try {
      await addToCart(id);
      setAddedMessage(`Added to cart! (${cartQty + 1} units)`);
      setTimeout(() => setAddedMessage(''), 3000);
    } catch (err) {
      console.error('Add to cart error:', err);
      if (err.message?.includes('Unauthorized') || err.message?.includes('login')) {
        navigate('/login', {
          state: { message: 'Please log in to add products to your cart.' },
        });
      } else {
        setCartError(err.message || 'Failed to add to cart.');
        setTimeout(() => setCartError(''), 3500);
      }
    }
  };

  const handleWishlistToggle = async () => {
    if (isWishlistSaving) return;

    setIsWishlistSaving(true);
    setWishlistError('');

    try {
      if (isWishlisted) {
        await removeFromWishlist(id);
        setIsWishlisted(false);
      } else {
        await addToWishlist(id);
        setIsWishlisted(true);
      }
      if (onWishlistChange) {
        onWishlistChange();
      }
    } catch (err) {
      console.error('Wishlist error in details:', err);
      const status = err.response?.status;
      if (status === 401) {
        navigate('/login', {
          state: { message: 'Please log in to save items to your wishlist.' },
        });
      } else if (status === 409) {
        setIsWishlisted(true);
      } else {
        setWishlistError(
          err.response?.data?.message || 'Unable to save product. Please try again.'
        );
        setTimeout(() => setWishlistError(''), 4000);
      }
    } finally {
      setIsWishlistSaving(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading product details...</p>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Failed to Load Product
          </h2>
          <p className="text-sm text-red-600 mb-6">
            {error || 'The requested product could not be found.'}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            ← Back to Product Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isMaxStock = cartQty >= product.stock;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb / Back Link */}
      <nav className="mb-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Products
        </Link>
      </nav>

      {/* Main Product Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Large Product Image */}
          <div className="w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100 relative">
            <img
              src={
                product.image ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60'
              }
              alt={product.name}
              className="w-full h-96 sm:h-[460px] object-cover"
              onError={handleImageError}
            />
            {/* Quick Heart Icon on Image */}
            <button
              onClick={handleWishlistToggle}
              disabled={isWishlistSaving}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              className={`absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 ${
                isWishlisted
                  ? 'text-red-500 hover:text-red-600 bg-white'
                  : 'text-gray-400 hover:text-red-500 hover:bg-white'
              }`}
            >
              {isWishlistSaving ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              ) : isWishlisted ? (
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Product Details Info */}
          <div className="flex flex-col justify-between h-full">
            <div>
              {/* Category Badge */}
              <div className="mb-3">
                <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.category}
                </span>
              </div>

              {/* Product Name */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mb-6">
                <p className="text-3xl font-extrabold text-indigo-600">
                  ₹{product.price?.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Stock Status Indicator */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isOutOfStock ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  ></span>
                  <span
                    className={`text-sm font-semibold ${
                      isOutOfStock ? 'text-red-600' : 'text-green-700'
                    }`}
                  >
                    {isOutOfStock
                      ? 'Out of Stock'
                      : `In Stock (${product.stock} units available)`}
                  </span>
                </div>

                {cartQty > 0 && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                    {cartQty} already in your cart
                  </span>
                )}
              </div>

              {/* Divider */}
              <hr className="border-gray-200 my-6" />

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">
                  Product Description
                </h2>
                <p className="text-gray-600 leading-relaxed text-base">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Actions: Add to Cart & Wishlist */}
            <div className="pt-4 space-y-3">
              {wishlistError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center">
                  {wishlistError}
                </div>
              )}
              {cartError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center font-medium">
                  {cartError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isMaxStock || isAddingToCart}
                  className={`py-3.5 px-6 rounded-xl font-bold text-base transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                    isOutOfStock
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isMaxStock
                      ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white hover:shadow-md'
                  }`}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </>
                  ) : isOutOfStock ? (
                    <span>Currently Unavailable</span>
                  ) : isMaxStock ? (
                    <span>Max Stock in Cart ({cartQty})</span>
                  ) : cartQty > 0 ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span>Add Another ({cartQty})</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
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
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  disabled={isWishlistSaving}
                  className={`py-3.5 px-6 rounded-xl font-bold text-base transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border ${
                    isWishlisted
                      ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                      : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300'
                  }`}
                >
                  {isWishlistSaving ? (
                    <span>⏳ Saving...</span>
                  ) : isWishlisted ? (
                    <>
                      <span className="text-red-500 text-lg">♥</span>
                      <span>Added to Wishlist</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-500 text-lg">♡</span>
                      <span>Add to Wishlist</span>
                    </>
                  )}
                </button>
              </div>

              {addedMessage && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium text-center flex items-center justify-center gap-2">
                  <span>✅ {addedMessage}</span>
                  <Link
                    to="/cart"
                    className="underline font-bold hover:text-green-900"
                  >
                    View Cart →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
