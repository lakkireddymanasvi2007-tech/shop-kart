const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
  getWishlistCount,
} = require("../controllers/wishlist.controller");

// ============================================
// Protect all wishlist routes with auth middleware
// ============================================
router.use(protect);

// Task 3: Get current authenticated user's wishlist
router.get("/", getWishlist);

// Bonus: Get current authenticated user's wishlist count
router.get("/count", getWishlistCount);

// Bonus: Toggle product in wishlist
router.patch("/:productId/toggle", toggleWishlist);
router.post("/:productId/toggle", toggleWishlist);

// Task 2: Add product to wishlist
router.post("/:productId", addToWishlist);

// Task 4: Remove product from wishlist
router.delete("/:productId", removeFromWishlist);

module.exports = router;
