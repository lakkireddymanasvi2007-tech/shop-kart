const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// ============================================
// Task 2 — Add Product to Cart API
// POST /cart/:productId
// ============================================
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId as a valid MongoDB ObjectId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Check if product exists in database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is in stock
    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is currently out of stock",
      });
    }

    // 3. Find current authenticated user
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not found",
      });
    }

    // Ensure cart array exists
    if (!Array.isArray(user.cart)) {
      user.cart = [];
    }

    // 4. Check if product is already in the cart
    const existingItemIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Product already in cart — increase quantity by 1
      const newQuantity = user.cart[existingItemIndex].quantity + 1;

      // Validate against stock limit
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more units. Available stock is ${product.stock}`,
        });
      }

      user.cart[existingItemIndex].quantity = newQuantity;
    } else {
      // Product not in cart — add with quantity = 1
      user.cart.push({
        product: product._id,
        quantity: 1,
      });
    }

    // 5. Save user document
    await user.save();

    // 6. Populate cart with product details
    await user.populate({
      path: "cart.product",
      select: "name description price category image stock",
    });

    // Filter any null/invalid products
    const validCart = (user.cart || []).filter(
      (item) => item.product && typeof item.product === "object"
    );

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: validCart,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding to cart",
      error: error.message,
    });
  }
};

// ============================================
// Task 3 — Get Current User Cart API
// GET /cart
// ============================================
const getCart = async (req, res) => {
  try {
    // 1. Find user from authenticated request and populate cart references
    const user = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name description price category image stock",
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not found",
      });
    }

    // 2. Filter out null/deleted product references
    const validCart = (user.cart || []).filter(
      (item) => item.product && typeof item.product === "object"
    );

    // If any referenced products were deleted from the DB, sync user document
    if (user.cart && user.cart.length !== validCart.length) {
      user.cart = validCart;
      await user.save();
    }

    // Calculate total units
    const totalUnits = validCart.reduce((sum, item) => sum + (item.quantity || 0), 0);

    return res.status(200).json({
      success: true,
      count: totalUnits,
      cart: validCart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching cart",
      error: error.message,
    });
  }
};

// ============================================
// Task 4 — Update Product Quantity API
// PATCH /cart/:productId
// ============================================
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // 1. Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Validate quantity: must be provided, must be a number/integer, must be >= 1
    const parsedQuantity = Number(quantity);
    if (
      quantity === undefined ||
      quantity === null ||
      isNaN(parsedQuantity) ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be an integer and at least 1",
      });
    }

    // 3. Find product in DB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 4. Validate quantity against stock limit
    if (parsedQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity exceeds available stock. Max available: ${product.stock}`,
      });
    }

    // 5. Find current authenticated user
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not found",
      });
    }

    if (!Array.isArray(user.cart)) {
      user.cart = [];
    }

    // 6. Check if product exists in cart
    const itemIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    // 7. Update quantity
    user.cart[itemIndex].quantity = parsedQuantity;
    await user.save();

    // 8. Populate cart and return
    await user.populate({
      path: "cart.product",
      select: "name description price category image stock",
    });

    const validCart = (user.cart || []).filter(
      (item) => item.product && typeof item.product === "object"
    );

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: validCart,
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating cart quantity",
      error: error.message,
    });
  }
};

// ============================================
// Task 5 — Remove Product from Cart API
// DELETE /cart/:productId
// ============================================
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Find user
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not found",
      });
    }

    if (!Array.isArray(user.cart)) {
      user.cart = [];
    }

    // 3. Check if product exists in cart
    const exists = user.cart.some(
      (item) => item.product && item.product.toString() === productId
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    // 4. Remove item
    user.cart = user.cart.filter(
      (item) => item.product && item.product.toString() !== productId
    );
    await user.save();

    // 5. Populate remaining cart and return
    await user.populate({
      path: "cart.product",
      select: "name description price category image stock",
    });

    const validCart = (user.cart || []).filter(
      (item) => item.product && typeof item.product === "object"
    );

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: validCart,
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing from cart",
      error: error.message,
    });
  }
};

// ============================================
// Helper / Bonus: Clear Cart API
// DELETE /cart
// ============================================
const clearCart = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    user.cart = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart: [],
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while clearing cart",
      error: error.message,
    });
  }
};

// ============================================
// Helper / Bonus: Get Cart Count API
// GET /cart/count
// ============================================
const getCartCount = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const totalUnits = (user.cart || []).reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    return res.status(200).json({
      success: true,
      count: totalUnits,
    });
  } catch (error) {
    console.error("Error getting cart count:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartCount,
};
