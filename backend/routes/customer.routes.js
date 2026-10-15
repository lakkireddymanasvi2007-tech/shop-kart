const express = require("express");
const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer,
  changePassword,
} = require("../controllers/customer.controller");

const protect = require("../middlewares/auth.middleware");

// Public routes (no authentication needed)
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Protected routes (authentication required)
router.get("/me", protect, getMyProfile);
router.post("/logout", protect, logoutCustomer);

// Bonus: Change Password (protected)
router.patch("/change-password", protect, changePassword);

module.exports = router;
