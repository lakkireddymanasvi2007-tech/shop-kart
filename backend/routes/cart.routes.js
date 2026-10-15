const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartCount,
} = require("../controllers/cart.controller");

// All cart routes require authentication
router.use(protect);

// Cart collection routes
router.route("/").get(getCart).delete(clearCart);

// Cart count helper
router.route("/count").get(getCartCount);

// Single item cart routes
router
  .route("/:productId")
  .post(addToCart)
  .patch(updateCartQuantity)
  .delete(removeFromCart);

module.exports = router;
