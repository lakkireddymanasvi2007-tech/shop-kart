import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders } from '../services/api';
import OrderCard from '../components/OrderCard';

function Orders({ isLoggedIn }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getMyOrders();
      if (res.data && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Unable to load your orders.');
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderStatusUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            📦
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In to View Orders</h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to track your order history and live delivery statuses.
          </p>
          <button
            onClick={() => navigate('/login', { state: { message: 'Please log in to view your orders.' } })}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Login to Account
          </button>
        </div>
      </div>
    );
  }

  // 1. Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Loading your orders...</h2>
        <p className="text-xs text-gray-400 mt-1">Fetching your purchase history</p>
      </div>
    );
  }

  // 2. Error state
  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 sm:p-12">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">Could Not Load Orders</h2>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 3. Empty state
  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-dashed border-gray-300 shadow-xs">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-5 text-3xl">
            📦
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            You have not placed any orders yet.
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mb-8">
            Once you complete a purchase, your order history and shipping status will appear here.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg"
          >
            <span>Start Shopping</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // 4. Orders list
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            You have placed {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <Link
          to="/products"
          className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors self-start sm:self-auto inline-flex items-center gap-1.5"
        >
          <span>Continue Shopping</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onStatusUpdated={handleOrderStatusUpdated}
          />
        ))}
      </div>
    </div>
  );
}

export default Orders;
