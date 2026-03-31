const jwt = require("jsonwebtoken");
const Admin = require("../model/Admin");
const Registration = require("../model/registration");
const ArtistRequest = require("../model/ArtistRequest");

// Protect routes - verify JWT token
const protectRoute = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login to access this resource.",
      });
    }
    
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "familyConnect"
    );
    
    // 1. Try to find in Admin collection
    let user = await Admin.findById(decoded.id).select("-password");
    
    // 2. If not found in Admin, try Registration collection
    if (!user) {
      user = await Registration.findById(decoded.id).select("-Password");
      if (user) {
        // Map Registration fields to match Admin structure for middleware compatibility
        user.username = user.FirstName + " " + user.LastName;
        // If it's a regular user from Registration, we'll default their role
        // You can change this to "admin" if you want all registered users to test artist features
        user.role = user.role || "admin"; 
        user.status = user.status || "active";
      }
    }

     if (!user) {
      user = await ArtistRequest.findById(decoded.id).select("-password");
      if (user) {
        user.role = "artist";
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Token is invalid or user was deleted.",
      });
    }
    
    // Attach user to request
    req.admin = user;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Token verification failed.",
      error: error.message,
    });
  }
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};

module.exports = { protectRoute, restrictTo };
