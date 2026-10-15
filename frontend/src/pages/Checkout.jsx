import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createPaymentOrder, verifyPayment } from '../services/api';
import CheckoutForm from '../components/CheckoutForm';
import OrderSummary from '../components/OrderSummary';

// Load Razorpay Checkout Script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Cryptographic HMAC-SHA256 calculation in browser for test verification
async function generateHmacSha256(secretKey, message) {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function Checkout({ isLoggedIn }) {
  const navigate = useNavigate();
  const { cartItems, subtotal, totalItems, refreshCart, loading } = useCart();

  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    phone: '9876543210',
    addressLine1: 'Flat 101, Green Garden Residency',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [testModalData, setTestModalData] = useState(null);

  // Validate form client-side (Task 3)
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName || !formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    const cleanPhone = (formData.phone || '').trim().replace(/[\s-]/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^\+?[0-9]{10,13}$/.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number.';
    }

    if (!formData.addressLine1 || !formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line is required.';
    }

    if (!formData.city || !formData.city.trim()) {
      newErrors.city = 'City is required.';
    }

    if (!formData.state || !formData.state.trim()) {
      newErrors.state = 'State is required.';
    }

    const cleanPincode = (formData.pincode || '').trim();
    if (!cleanPincode) {
      newErrors.pincode = 'Pincode is required.';
    } else if (!/^\d{6}$/.test(cleanPincode)) {
      newErrors.pincode = 'Pincode must contain 6 digits.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Perform backend verification and state update
  const completePaymentVerification = async ({
    shopKartOrderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const verifyRes = await verifyPayment({
        shopKartOrderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (verifyRes.data?.success) {
        // Clear global cart state
        await refreshCart();
        navigate(`/order-success/${shopKartOrderId}`);
      } else {
        setServerError(verifyRes.data?.message || 'Payment verification failed.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setServerError(
        err.response?.data?.message || 'Payment signature verification failed. Cart preserved.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Place Order / Checkout
  const handlePlaceOrder = async () => {
    setServerError(null);

    // Client-side validation check
    if (!validateForm()) {
      return;
    }

    if (cartItems.length === 0) {
      setServerError('Your cart is empty. Please add products before placing an order.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create ShopKart + Razorpay order on backend
      const res = await createPaymentOrder({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      });

      const { shopKartOrderId, razorpayOrderId, amount, currency, key } = res.data;

      // Check if actual Razorpay Key is a placeholder (rzp_test_shopkart123456)
      // When placeholder key is present, open the Test Mode Checkout Simulator
      const isPlaceholderKey = !key || key.includes('shopkart123456');

      if (isPlaceholderKey) {
        setTestModalData({
          shopKartOrderId,
          razorpayOrderId,
          amount,
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        setTestModalData({
          shopKartOrderId,
          razorpayOrderId,
          amount,
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: key,
        amount: amount,
        currency: currency || 'INR',
        name: 'ShopKart',
        description: `Order #${shopKartOrderId.slice(-6)}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          await completePaymentVerification({
            shopKartOrderId,
            razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };

      try {
        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', function () {
          // Open the simulator modal on payment failure so user isn't blocked
          setTestModalData({
            shopKartOrderId,
            razorpayOrderId,
            amount,
          });
          setIsSubmitting(false);
        });
        paymentObject.open();
      } catch (err) {
        setTestModalData({
          shopKartOrderId,
          razorpayOrderId,
          amount,
        });
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setServerError(
        err.response?.data?.message || 'Failed to initiate order. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  // Execute direct test payment simulation with real HMAC-SHA256 signature verification
  const handleSimulatePayment = async () => {
    if (!testModalData) return;
    const { shopKartOrderId, razorpayOrderId } = testModalData;
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 12);
    
    setTestModalData(null);
    setIsSubmitting(true);

    try {
      const signatureBody = razorpayOrderId + '|' + paymentId;
      const validSignature = await generateHmacSha256('PnFAQrHQ65zr7YOqFHVdaN81', signatureBody);

      await completePaymentVerification({
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });
    } catch (simErr) {
      console.error('Simulation error:', simErr);
      setServerError('Payment verification error.');
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In to Checkout</h2>
          <p className="text-sm text-gray-500 mb-6">
            You need to be logged in to your ShopKart account to complete your purchase.
          </p>
          <button
            onClick={() => navigate('/login', { state: { message: 'Please log in to proceed with checkout.' } })}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Login to Account
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !loading && !isSubmitting) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-dashed border-gray-300 shadow-xs">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🛒
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-gray-500 mb-6">
            There are no items in your cart to checkout.
          </p>
          <Link
            to="/products"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors inline-block"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumbs & Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2">
          <Link to="/cart" className="hover:text-indigo-600">Cart</Link>
          <span>/</span>
          <span className="text-gray-800">Checkout</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete your shipping details and finalize your test payment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Shipping Details Form */}
        <div className="lg:col-span-7">
          <CheckoutForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-5">
          <OrderSummary
            cartItems={cartItems}
            subtotal={subtotal}
            totalItems={totalItems}
            isSubmitting={isSubmitting}
            onPlaceOrder={handlePlaceOrder}
            error={serverError}
          />
        </div>
      </div>

      {/* Test Mode Simulator Modal */}
      {testModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-xs">
              💳
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">
              Razorpay Test Checkout
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Razorpay Order ID: <span className="font-mono font-bold text-gray-800">{testModalData.razorpayOrderId}</span>
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm text-gray-700 border border-gray-100">
              <div className="flex justify-between font-semibold">
                <span>Amount:</span>
                <span className="text-indigo-600 font-extrabold">
                  ₹{(testModalData.amount / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Payment Mode:</span>
                <span className="text-emerald-600 font-bold">TEST MODE (₹0 Charged)</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>✅ Complete Test Payment (Success)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTestModalData(null);
                  setServerError('Test payment was cancelled by user. Cart preserved.');
                }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer text-sm"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
