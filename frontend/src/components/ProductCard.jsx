import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addToWishlist, removeFromWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

function ProductCard({
  product,
  isInitiallyWishlisted = false,
  onWishlistToggled,
}) {
  const navigate = useNavigate();
  const { addToCart, getItemQuantity, isItemLoading } = useCart();

  const [isWishlisted, setIsWishlisted] = useState(isInitiallyWishlisted);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const productId = product._id;
  const isOutOfStock = product.stock <= 0;
  const cartQty = getItemQuantity(productId);
  const isAddingToCart = isItemLoading(productId);
  const isMaxStockInCart = cartQty >= product.stock;

  const handleImageError = (e) => {
    e.target.src =
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60';
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaving) return;

    setIsSaving(true);
    setErrorMessage('');

    try {
      if (isWishlisted) {
        // Remove from wishlist
        await removeFromWishlist(productId);
        setIsWishlisted(false);
        if (onWishlistToggled) onWishlistToggled(productId, false);
      } else {
        // Add to wishlist
        await addToWishlist(productId);
        setIsWishlisted(true);
        if (onWishlistToggled) onWishlistToggled(productId, true);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
      const status = err.response?.status;
      if (status === 401) {
        navigate('/login', {
          state: { message: 'Please log in to save items to your wishlist.' },
        });
        return;
      } else if (status === 409) {
        setIsWishlisted(true);
      } else {
        setErrorMessage(
          err.response?.data?.message || 'Unable to save product. Please try again.'
        );
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock || isMaxStockInCart || isAddingToCart) return;

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await addToCart(productId);
      setSuccessMessage(cartQty > 0 ? `Added! (${cartQty + 1} in cart)` : 'Added to cart!');
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err) {
      console.error('Add to cart error:', err);
      // Check if unauthenticated
      if (err.message?.includes('Unauthorized') || err.message?.includes('login')) {
        navigate('/login', {
          state: { message: 'Please log in to add products to your cart.' },
        });
      } else {
        setErrorMessage(err.message || 'Failed to add to cart.');
        setTimeout(() => setErrorMessage(''), 3500);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col h-full group">
      {/* Product Image */}
      <div className="relative w-full h-52 bg-gray-100 overflow-hidden">
        <img
          src={
            product.image ||
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60'
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={handleImageError}
        />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-2xs">
          {product.category}
        </span>

        {/* Top-Right Heart Wishlist Action */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={isSaving}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 ${
            isWishlisted
              ? 'text-red-500 hover:text-red-600 bg-white'
              : 'text-gray-400 hover:text-red-500 hover:bg-white'
          }`}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : isWishlisted ? (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Product Name */}
          <Link
            to={`/products/${productId}`}
            className="block text-base font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 mb-1"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Price */}
          <p className="text-xl font-extrabold text-indigo-600 mb-2">
            ₹{product.price?.toLocaleString('en-IN')}
          </p>

          {/* Stock Status & Cart Quantity Badge */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOutOfStock ? 'bg-red-500' : 'bg-green-500'
                }`}
              ></span>
              <span
                className={`text-xs font-medium ${
                  isOutOfStock ? 'text-red-600' : 'text-green-700'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
              </span>
            </div>

            {cartQty > 0 && (
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {cartQty} in cart
              </span>
            )}
          </div>
        </div>

        {/* Feedback messages */}
        {errorMessage && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center animate-fade-in">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg text-center font-medium animate-fade-in">
            ✓ {successMessage}
          </div>
        )}

        {/* Action Buttons: Task 7 Integration */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {/* Add to Cart Button (Task 7) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isMaxStockInCart || isAddingToCart}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-2xs ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 border border-gray-200'
                : isMaxStockInCart
                ? 'bg-gray-100 text-gray-500 border border-gray-200'
                : cartQty > 0
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white'
            }`}
          >
            {isAddingToCart ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Adding...</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : isMaxStockInCart ? (
              <span>Max Stock in Cart</span>
            ) : cartQty > 0 ? (
              <>
                <span>+</span>
                <span>Add Another ({cartQty})</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
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

          {/* View Details Button */}
          <Link
            to={`/products/${productId}`}
            className="w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center border border-gray-100"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
