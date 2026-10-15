import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById, updateOrderStatus } from '../services/api';

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const STATUS_COLORS = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-300',
  PLACED: 'bg-blue-100 text-blue-800 border-blue-300',
  CONFIRMED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

function OrderDetails({ isLoggedIn }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getOrderById(id);
        if (res.data?.order) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(
          err.response?.data?.message || 'Unable to load order details.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleAdvanceStatus = async (nextStatus) => {
    try {
      setUpdating(true);
      const res = await updateOrderStatus(order._id, nextStatus);
      if (res.data?.order) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
          <p className="text-sm text-gray-500 mb-6">
            Log in to view your order details.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Login to Account
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Loading Order Details...</h2>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 sm:p-12">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">Order Not Found</h2>
          <p className="text-sm text-red-600 mb-6">{error || 'Unable to locate this order.'}</p>
          <Link
            to="/orders"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors inline-block text-sm"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const nextStep =
    currentStepIndex >= 0 && currentStepIndex < STATUS_STEPS.length - 1
      ? STATUS_STEPS[currentStepIndex + 1]
      : null;

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back Link & Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Orders
        </Link>

        {nextStep && (
          <button
            onClick={() => handleAdvanceStatus(nextStep)}
            disabled={updating}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {updating ? 'Updating...' : `⚡ Simulate Advance to ${nextStep}`}
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-8">
        {/* Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900">
                Order #{order._id.toUpperCase()}
              </h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800 border-gray-300'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Placed on {formattedDate}</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-400 block uppercase font-semibold">Total Amount</span>
            <span className="text-2xl font-black text-indigo-600">
              ₹{order.totalAmount?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Status Stepper */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Delivery Status
          </h3>
          <div className="relative flex items-center justify-between px-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gray-100 w-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-indigo-600 z-0 transition-all duration-500"
              style={{
                width: `${
                  currentStepIndex >= 0
                    ? (currentStepIndex / (STATUS_STEPS.length - 1)) * 100
                    : 0
                }%`,
              }}
            />

            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100'
                        : isCompleted
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-xs mt-2 font-semibold ${
                      isCurrent ? 'text-indigo-600 font-bold' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid of Shipping and Payment Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          {/* Shipping Address */}
          <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <span>📍</span> Shipping Address
            </h3>
            <p className="text-sm font-bold text-gray-900">{order.shippingAddress?.fullName}</p>
            <p className="text-xs text-gray-600 mt-1">{order.shippingAddress?.phone}</p>
            <p className="text-xs text-gray-600 mt-1">
              {order.shippingAddress?.addressLine1}
            </p>
            <p className="text-xs text-gray-600">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
              {order.shippingAddress?.pincode}
            </p>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <span>💳</span> Payment Information
            </h3>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold text-emerald-600">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Gateway:</span>
                <span className="font-semibold text-gray-800">Razorpay (Test Mode)</span>
              </div>
              {order.razorpayOrderId && (
                <div className="flex justify-between">
                  <span>Razorpay Order ID:</span>
                  <span className="font-mono text-gray-800 truncate max-w-[180px]">{order.razorpayOrderId}</span>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span>Razorpay Payment ID:</span>
                  <span className="font-mono text-gray-800 truncate max-w-[180px]">{order.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Snapshotted Items Table */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            Purchased Items (Purchase-Time Snapshot)
          </h3>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item, idx) => (
              <div key={item._id || idx} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                        }}
                      />
                    ) : (
                      <span className="text-xl">📦</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">
                      ₹{item.price?.toLocaleString('en-IN')} × {item.quantity}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-gray-900">
                    ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
