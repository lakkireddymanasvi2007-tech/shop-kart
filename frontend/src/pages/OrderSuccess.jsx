import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../services/api';

function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await getOrderById(id);
        if (res.data?.order) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error('Error fetching confirmed order:', err);
        setError('Order created, but could not load latest details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Finalizing Your Order...</h2>
        <p className="text-xs text-gray-400 mt-1">Retrieving verified order confirmation</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-xs">
          ✅
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
          Thank you for your purchase. Your payment was verified and your order has been confirmed.
        </p>

        {/* Order Details Card */}
        <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 text-left space-y-4 mb-8 border border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-gray-200">
            <div>
              <span className="text-xs text-gray-400 block uppercase font-semibold">Order ID</span>
              <span className="text-xs font-mono font-bold text-gray-900 truncate block">
                {id}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block uppercase font-semibold">Payment</span>
              <span className="text-xs font-bold text-emerald-600">
                {order?.paymentStatus || 'PAID'} (Test Mode)
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block uppercase font-semibold">Order Status</span>
              <span className="text-xs font-bold text-indigo-600">
                {order?.status || 'PLACED'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block uppercase font-semibold">Total Paid</span>
              <span className="text-base font-black text-gray-900">
                ₹{order?.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Shipping snapshot */}
          {order?.shippingAddress && (
            <div className="text-xs text-gray-600 pt-2">
              <span className="font-bold text-gray-800 block mb-1">Delivering to:</span>
              <p>
                {order.shippingAddress.fullName} • {order.shippingAddress.phone}
              </p>
              <p>
                {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
            </div>
          )}

          {/* Purchased items */}
          {order?.items && order.items.length > 0 && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-800 block">Items in this order:</span>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-700">
                    <span>
                      {item.name} <span className="text-gray-400">× {item.quantity}</span>
                    </span>
                    <span className="font-bold">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/orders"
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md hover:shadow-lg text-sm text-center"
          >
            View My Orders
          </Link>
          <Link
            to="/products"
            className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-sm text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
