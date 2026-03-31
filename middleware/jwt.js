
const jwt = require("jsonwebtoken");
const Registration = require("../model/registration");

const authenticateUser = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1]; // Extract the token
  if (!token) return res.status(403).json({ message: "Token is required" });
  console.log(" get token ", token);

  try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET); // Verify the token
    console.log("decoded", decoded);

    const user = await Registration.findById(decoded.id);

    console.log("user detail", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // Attach user data to the request
    next();
  } catch (error) {
    console.error("Token verification error:", error.message); // Log error for debugging
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticateUser;
