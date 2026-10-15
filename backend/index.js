const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import routes
const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();

// ============================================
// Middleware
// ============================================
app.use(
  cors({
    origin: true, // Allow request origin dynamically (supports localhost:5173, 5174, etc.)
    credentials: true, // Allow cookies
  })
);
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies (needed for JWT HttpOnly cookies)

// ============================================
// Routes
// ============================================
app.use("/customers", customerRoutes);
app.use("/auth", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "🛒 ShopKart API (Auth, Product Discovery, Wishlist & Cart)",
    endpoints: {
      auth: {
        register: "POST /customers/register",
        login: "POST /customers/login",
        profile: "GET /customers/me (protected)",
        logout: "POST /customers/logout (protected)",
        changePassword: "PATCH /customers/change-password (protected)",
      },
      products: {
        createProduct: "POST /products",
        getAllProducts: "GET /products",
        searchAndFilter: "GET /products?search=:name&category=:cat&sort=:sort",
        getProductById: "GET /products/:id",
      },
      wishlist: {
        addToWishlist: "POST /wishlist/:productId (protected)",
        getWishlist: "GET /wishlist (protected)",
        removeFromWishlist: "DELETE /wishlist/:productId (protected)",
        toggleWishlist: "PATCH /wishlist/:productId/toggle (protected)",
        getWishlistCount: "GET /wishlist/count (protected)",
      },
      cart: {
        addToCart: "POST /cart/:productId (protected)",
        getCart: "GET /cart (protected)",
        updateQuantity: "PATCH /cart/:productId (protected)",
        removeFromCart: "DELETE /cart/:productId (protected)",
        clearCart: "DELETE /cart (protected)",
        getCartCount: "GET /cart/count (protected)",
      },
    },
  });
});

// ============================================
// MongoDB Connection & Server Start
// ============================================
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("✅ MongoDB Connected Successfully");
      console.log(`   Database: ${mongoose.connection.name}`);

      app.listen(PORT, () => {
        console.log(`\n🛒 ShopKart Server running on http://localhost:${PORT}`);
        console.log(`   Products:  GET  http://localhost:${PORT}/products`);
        console.log(`   Create:    POST http://localhost:${PORT}/products`);
        console.log(`   Register:  POST http://localhost:${PORT}/customers/register`);
        console.log(`   Login:     POST http://localhost:${PORT}/customers/login\n`);
      });
    })
    .catch((error) => {
      console.error("❌ MongoDB Connection Failed:", error.message);
      process.exit(1);
    });
}

module.exports = app;
