const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// ============================================
// Task 2 — Add Product to Wishlist API
// POST /wishlist/:productId
// ============================================
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId as a valid MongoDB ObjectId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Check if the product exists in the database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 3. Find current authenticated user (req.user is set by auth middleware)
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not found",
      });
    }

    // Ensure wishlist array exists
    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }

    // 4. Duplicate prevention: Check if already in wishlist
    const isAlreadyWishlisted = user.wishlist.some(
      (id) => id.toString() === productId
    );

    if (isAlreadyWishlisted) {
      return res.status(409).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    // 5. Add product ObjectId reference
    user.wishlist.push(productId);
    await user.save();

    // 6. Return success
    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding to wishlist",
      error: error.message,
    });
  }
};

// ============================================
// Task 3 — Get Current User's Wishlist
// GET /wishlist
// ============================================
const getWishlist = async (req, res) => {
  try {
    // 1. Find user from authenticated request and populate wishlist references
    const user = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name description price category image stock",
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not found",
      });
    }

    // 2. Filter out null/deleted product references
    const validWishlist = (user.wishlist || []).filter(
      (item) => item !== null && typeof item === "object"
    );

    // If any referenced products were deleted from the DB, sync user document
    if (user.wishlist && user.wishlist.length !== validWishlist.length) {
      user.wishlist = validWishlist.map((p) => p._id);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      count: validWishlist.length,
      wishlist: validWishlist,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching wishlist",
      error: error.message,
    });
  }
};

// ============================================
// Task 4 — Remove Product from Wishlist
// DELETE /wishlist/:productId
// ============================================
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Find current authenticated user
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not found",
      });
    }

    // 3. Check if product is in wishlist
    const initialCount = user.wishlist ? user.wishlist.length : 0;
    const exists = user.wishlist && user.wishlist.some(
      (id) => id.toString() === productId
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not in wishlist",
      });
    }

    // 4. Remove product reference
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing from wishlist",
      error: error.message,
    });
  }
};

// ============================================
// Bonus Task 23 — Toggle Product in Wishlist
// PATCH /wishlist/:productId/toggle
// ============================================
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }

    const isSaved = user.wishlist.some(
      (id) => id.toString() === productId
    );

    if (isSaved) {
      // Remove product
      user.wishlist = user.wishlist.filter(
        (id) => id.toString() !== productId
      );
      await user.save();
      return res.status(200).json({
        success: true,
        saved: false,
        message: "Product removed from wishlist",
      });
    } else {
      // Add product
      user.wishlist.push(productId);
      await user.save();
      return res.status(200).json({
        success: true,
        saved: true,
        message: "Product added to wishlist",
      });
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while toggling wishlist",
      error: error.message,
    });
  }
};

// ============================================
// Bonus Task 24 — Wishlist Count
// GET /wishlist/count
// ============================================
const getWishlistCount = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      count: user.wishlist ? user.wishlist.length : 0,
    });
  } catch (error) {
    console.error("Error getting wishlist count:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
  getWishlistCount,
};
