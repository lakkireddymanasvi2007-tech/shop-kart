import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateOrderStatus } from '../services/api';

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const STATUS_COLORS = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-300',
  PLACED: 'bg-blue-100 text-blue-800 border-blue-300',
  CONFIRMED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

function OrderCard({ order: initialOrder, onStatusUpdated }) {
  const [order, setOrder] = useState(initialOrder);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleAdvanceStatus = async (nextStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await updateOrderStatus(order._id, nextStatus);
      if (res.data?.order) {
        setOrder(res.data.order);
        if (onStatusUpdated) onStatusUpdated(res.data.order);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const nextStep =
    currentStepIndex >= 0 && currentStepIndex < STATUS_STEPS.length - 1
      ? STATUS_STEPS[currentStepIndex + 1]
      : null;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Order Top Header */}
      <div className="p-5 sm:p-6 bg-gray-50/70 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
              Order #{order._id.slice(-8).toUpperCase()}
            </h3>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800 border-gray-300'
              }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Placed on {formattedDate}</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-xs text-gray-500 block">Total Amount</span>
            <span className="text-lg font-black text-indigo-600">
              ₹{order.totalAmount?.toLocaleString('en-IN')}
            </span>
          </div>
          <Link
            to={`/orders/${order._id}`}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <span>View Details</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Status Progression Stepper (Bonus Feature) */}
      <div className="px-5 sm:px-6 pt-5 pb-2">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 w-full z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 z-0 transition-all duration-500"
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
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
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
                  className={`text-[10px] sm:text-xs mt-1 font-semibold ${
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

      {/* Items List Snapshot */}
      <div className="p-5 sm:p-6 divide-y divide-gray-100">
        <div className="space-y-3 pb-4">
          {order.items?.map((item, idx) => (
            <div key={item._id || idx} className="flex items-center gap-4">
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
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                <p className="text-xs text-gray-500">
                  Qty: <span className="font-semibold text-gray-700">{item.quantity}</span> × ₹
                  {item.price?.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-sm text-gray-900">
                  ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions / Shipping Info */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            <span className="font-semibold text-gray-700">Delivery to: </span>
            {order.shippingAddress?.fullName}, {order.shippingAddress?.city} (
            {order.shippingAddress?.pincode})
          </div>

          {/* Bonus Simulator Button for Status Progression */}
          {nextStep && (
            <button
              onClick={() => handleAdvanceStatus(nextStep)}
              disabled={updatingStatus}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
              title="Bonus Simulator: Advance order status to test live progression"
            >
              {updatingStatus ? 'Updating...' : `⚡ Advance to ${nextStep}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderCard;
