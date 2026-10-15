const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcrypt");

// ============================================
// Task 1 — Register a Customer
// POST /customers/register
// ============================================
const registerCustomer = async (req, res) => {
  try {
    const fullName = req.body.fullName || req.body.name;
    const { email, password, phone } = req.body;

    // Validate all fields are present
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (fullName, email, password, phone)",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Create the customer (password is hashed via pre-save hook)
    const customer = await Customer.create({
      fullName,
      email,
      password,
      phone,
    });

    // Return success (password is excluded because of select: false)
    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// Task 2 — Login
// POST /customers/login
// ============================================
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find customer by email (explicitly select password since it's hidden by default)
    const customer = await Customer.findOne({ email }).select("+password");

    // Check if customer exists AND password matches
    // Do NOT reveal whether email or password was wrong
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT and set HttpOnly cookie
    const token = generateToken(res, customer._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// Task 3 — My Profile
// GET /customers/me
// ============================================
const getMyProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const customer = req.user;

    res.status(200).json({
      _id: customer._id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// Task 4 — Logout
// POST /customers/logout
// ============================================
const logoutCustomer = async (req, res) => {
  try {
    // Clear the authentication cookie
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // Set expiry to past date to clear cookie
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================
// Bonus — Change Password
// PATCH /customers/change-password
// ============================================
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate fields
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // Get customer with password (req.user doesn't have password due to select: false)
    const customer = await Customer.findById(req.user._id).select("+password");

    // Verify old password
    const isMatch = await customer.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Set new password (pre-save hook will hash it)
    customer.password = newPassword;
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer,
  changePassword,
};
