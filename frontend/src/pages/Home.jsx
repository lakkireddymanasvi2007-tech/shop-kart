import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMe } from '../services/api';

function Home({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getMe();
        // Backend returns { success: true, customer: { ... } } or similar
        setCustomer(response.data?.customer || response.data);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Not authenticated:', error);
        setIsLoggedIn(false);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, setIsLoggedIn]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl shadow-lg p-8 sm:p-10 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              Authentication Active
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold">
              Welcome, {customer.name || customer.fullName || 'Customer'}! 👋
            </h1>
            <p className="mt-2 text-indigo-100 max-w-lg">
              Explore our wide variety of electronics, fashion, books, and home essentials.
            </p>
          </div>
          <div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-6 py-3.5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              Explore Products 🛒
            </Link>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Customer Profile
              </h2>
              <p className="text-xs text-gray-500">
                Verified customer details from ShopKart authentication
              </p>
            </div>
            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
              Logged In
            </span>
          </div>

          <div className="px-6 py-4 divide-y divide-gray-100">
            {/* Full Name */}
            <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Full Name
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.name || customer.fullName || 'N/A'}
              </dd>
            </div>

            {/* Email */}
            <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Email Address
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.email || 'N/A'}
              </dd>
            </div>

            {/* Phone */}
            <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Phone Number
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.phone || customer.phoneNumber || 'N/A'}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
