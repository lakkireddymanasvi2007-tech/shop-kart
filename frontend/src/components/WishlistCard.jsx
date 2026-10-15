import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function WishlistCard({ product, onRemove }) {
  const { addToCart, getItemQuantity, isItemLoading } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);
  const [cartSuccess, setCartSuccess] = useState('');
  const [cartError, setCartError] = useState('');

  const productId = product._id;
  const isOutOfStock = product.stock <= 0;
  const cartQty = getItemQuantity(productId);
  const isAdding = isItemLoading(productId);
  const isMaxStock = cartQty >= product.stock;

  const handleImageError = (e) => {
    e.target.src =
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60';
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      await onRemove(productId);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || isMaxStock || isAdding) return;
    setCartError('');
    setCartSuccess('');
    try {
      await addToCart(productId);
      setCartSuccess('Added to cart!');
      setTimeout(() => setCartSuccess(''), 2500);
    } catch (err) {
      setCartError(err.message || 'Failed to add to cart');
      setTimeout(() => setCartError(''), 3000);
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
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-xs">
          {product.category}
        </span>

        {/* Quick Remove Button (Top Right Heart) */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          title="Remove from Wishlist"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-red-500 hover:bg-white hover:text-red-600 shadow-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
        >
          {isRemoving ? (
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
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

          {/* Stock Status & Cart Qty */}
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

        {/* Alerts */}
        {cartError && (
          <div className="mb-2 p-1.5 bg-red-50 text-red-600 text-xs rounded text-center">
            {cartError}
          </div>
        )}
        {cartSuccess && (
          <div className="mb-2 p-1.5 bg-green-50 text-green-700 text-xs rounded text-center font-medium">
            ✓ {cartSuccess}
          </div>
        )}

        {/* Actions Grid */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isMaxStock || isAdding}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-2xs ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400'
                : isMaxStock
                ? 'bg-gray-100 text-gray-500'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isAdding ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : isMaxStock ? (
              <span>Max in Cart</span>
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

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/products/${productId}`}
              className="text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center border border-gray-100"
            >
              View Details
            </Link>

            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-center bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isRemoving ? <span>Removing...</span> : <span>Remove</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WishlistCard;
