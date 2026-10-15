function OrderSummary({ cartItems, subtotal, totalItems, isSubmitting, onPlaceOrder, error }) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm sticky top-24 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
        <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Cart Items breakdown */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {cartItems.map((item) => {
          const product = item.product || {};
          return (
            <div
              key={item._id || product._id}
              className="flex items-center justify-between text-sm py-1.5 gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                      }}
                    />
                  ) : (
                    <span className="text-xs">📦</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-xs truncate max-w-[150px]">
                    {product.name}
                  </p>
                  <p className="text-[11px] text-gray-400">Qty: {item.quantity}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold text-xs text-gray-900">
                  ₹{((product.price || 0) * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <hr className="border-gray-100" />

      {/* Price Calculations */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Items Subtotal</span>
          <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Delivery Charges</span>
          <span className="font-bold text-green-600">FREE</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Estimated Taxes (GST)</span>
          <span className="font-bold text-gray-900">₹0</span>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
          <span className="text-base font-extrabold text-gray-900">Total Amount</span>
          <span className="text-2xl font-black text-indigo-600">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Place Order Button */}
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={isSubmitting || cartItems.length === 0}
        className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Processing Order...</span>
          </>
        ) : (
          <>
            <span>Pay with Razorpay</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>

      {/* Trust Badges */}
      <div className="pt-2 text-[11px] text-gray-400 text-center space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <span className="text-green-500">🔒</span> 256-Bit Razorpay Test Mode Checkout
        </p>
        <p>No real money will be deducted</p>
      </div>
    </div>
  );
}

export default OrderSummary;
