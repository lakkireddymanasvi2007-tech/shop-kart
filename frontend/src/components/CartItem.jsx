import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function CartItem({ item }) {
  const { updateQuantity, removeFromCart, getItemAction } = useCart();
  const [localError, setLocalError] = useState('');

  const product = item.product || {};
  const productId = product._id || item.product;
  const quantity = item.quantity || 1;
  const stock = product.stock !== undefined ? product.stock : 99;
  const price = product.price || 0;
  const itemTotal = price * quantity;
  const currentAction = getItemAction(productId);
  const isLoading = !!currentAction;

  const handleImageError = (e) => {
    e.target.src =
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60';
  };

  const handleIncrement = async () => {
    if (quantity >= stock) return;
    setLocalError('');
    try {
      await updateQuantity(productId, quantity + 1);
    } catch (err) {
      setLocalError(err.message || 'Failed to increase quantity');
      setTimeout(() => setLocalError(''), 3000);
    }
  };

  const handleDecrement = async () => {
    if (quantity <= 1) return;
    setLocalError('');
    try {
      await updateQuantity(productId, quantity - 1);
    } catch (err) {
      setLocalError(err.message || 'Failed to decrease quantity');
      setTimeout(() => setLocalError(''), 3000);
    }
  };

  const handleRemove = async () => {
    setLocalError('');
    try {
      await removeFromCart(productId);
    } catch (err) {
      setLocalError(err.message || 'Failed to remove product');
      setTimeout(() => setLocalError(''), 3000);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Product Details (Image + Info) */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Link
          to={`/products/${productId}`}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 block group"
        >
          <img
            src={
              product.image ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60'
            }
            alt={product.name || 'Product'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
          />
        </Link>

        <div className="flex-1 min-w-0">
          {product.category && (
            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
              {product.category}
            </span>
          )}
          <Link
            to={`/products/${productId}`}
            className="block text-base font-bold text-gray-900 hover:text-indigo-600 transition-colors truncate"
            title={product.name}
          >
            {product.name || 'Product'}
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-bold text-gray-700">
              ₹{price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-gray-400">each</span>
            {stock <= 5 && stock > 0 && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Only {stock} left
              </span>
            )}
            {stock <= 0 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          {localError && (
            <p className="text-xs text-red-600 mt-1.5 font-medium">{localError}</p>
          )}
        </div>
      </div>

      {/* Quantity Controls + Price + Remove */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
        {/* Quantity Controls [-] Qty [+] */}
        <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/50 p-1">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1 || isLoading}
            title={
              quantity <= 1
                ? 'Quantity cannot be less than 1 (use Remove)'
                : 'Decrease Quantity'
            }
            className="w-8 h-8 rounded-lg bg-white shadow-2xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
          >
            −
          </button>
          <span className="w-10 text-center font-bold text-sm text-gray-900">
            {currentAction === 'updating' ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              quantity
            )}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= stock || isLoading}
            title={
              quantity >= stock
                ? `Cannot exceed available stock (${stock})`
                : 'Increase Quantity'
            }
            className="w-8 h-8 rounded-lg bg-white shadow-2xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Item Total Price */}
        <div className="text-right min-w-[90px]">
          <p className="text-base font-extrabold text-indigo-600">
            ₹{itemTotal.toLocaleString('en-IN')}
          </p>
          {quantity > 1 && (
            <p className="text-[11px] text-gray-400">
              ({quantity} × ₹{price.toLocaleString('en-IN')})
            </p>
          )}
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={isLoading}
          title="Remove from Cart"
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          {currentAction === 'removing' ? (
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
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
                strokeWidth={1.75}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default CartItem;
