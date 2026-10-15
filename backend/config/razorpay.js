const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_shopkart123456",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "shopkart_test_secret_2026",
});

module.exports = razorpay;
