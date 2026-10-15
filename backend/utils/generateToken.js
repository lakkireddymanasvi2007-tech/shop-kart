const jwt = require("jsonwebtoken");

// Generate JWT token and store it in an HttpOnly cookie
const generateToken = (res, userId) => {
  // Create JWT with user ID in payload
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  // Set token in HttpOnly cookie
  res.cookie("token", token, {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    maxAge: parseInt(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000, // Convert days to ms
  });

  return token;
};

module.exports = generateToken;
