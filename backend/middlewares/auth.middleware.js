const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");

// Middleware to protect routes — verifies JWT from cookies
const protect = async (req, res, next) => {
  try {
    // Read token from HttpOnly cookie or Authorization header (Bearer <token>)
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — please login first",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find customer in database and attach to request object
    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — customer not found",
      });
    }

    // Attach customer to req.user for use in controllers
    req.user = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized — invalid or expired token",
    });
  }
};

module.exports = protect;
