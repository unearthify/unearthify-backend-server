// // Required dependencies
// const dotenv = require("dotenv");
// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// // require("./cron/recurringEvents.cron");
 
 
// // Load environment variables from .env file
// dotenv.config();
 
// // Import the database connection
// const database = require("./database/database");
 
// // Import existing routers
// const router = require("./router/registerRoutes");
// const routerFam = require("./router/family");
 
// // Import new routers for the main application
// const dashboardRoutes = require("./router/dashboardRoutes")
// const artistRoutes = require("./router/artistRoutes");
// const eventRoutes = require("./router/eventRoutes");
// const artFormRoutes = require("./router/artFormRoutes");
// const contributeRoutes = require("./router/contributeRoutes");
// const applicationRoutes = require("./router/applicationRoutes");
// const eventApplicationRoutes = require("./router/eventApplicationRoutes");
// const submissionRoutes = require("./router/submissionRoutes");
// const contactArtistRoutes = require("./router/contactArtistRoutes");
// const adminRoutes = require("./router/adminRoutes");
// const artistAuthRoutes = require("./router/artistAuthRoutes");
// const eventSubmissionRoutes = require("./router/eventSubmissionRoutes");
 
// const app = express();
 
// // Middleware to parse JSON bodies
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
 
// // Initialize database connection
// database();
 
// // Set up CORS to allow requests from the frontend domains
// const allowedOrigins = process.env.REACT_APP_API_BASE_URL
//   ? process.env.REACT_APP_API_BASE_URL.split(",").map((url) => url.trim())
//   : [
//       "http://localhost:3000",
//       "http://localhost:5173",
//       "http://localhost:8080",
//       "https://unearthify.com",
//       "https://admin.unearthify.com",
//     ];
 
// // Manual CORS middleware for maximum control and reliability on Vercel
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
 
//   // Check if the origin is allowed (subdomains of unearthify.com or local dev)
//   const isAllowed = !origin ||
//                    allowedOrigins.includes(origin) ||
//                    origin.endsWith(".unearthify.com") ||
//                    origin === "https://unearthify.com";
 
//   if (isAllowed) {
//     // If the origin is allowed, echo it back in the Access-Control-Allow-Origin header
//     res.setHeader('Access-Control-Allow-Origin', origin || '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
//     res.setHeader('Access-Control-Allow-Credentials', 'true');
//     // Debug header to verify this specific code is running
//     res.setHeader('X-Backend-Version', '1.0.1');
//   }
 
//   // Handle preflight requests
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);
//   }
//   next();
// });
 
// // Health check route
// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Unearthify API Server is running",
//     version: "1.0.0",
//   });
// });
 
// // Define the routes - New API routes
// app.use("/api", dashboardRoutes);    // dashboard routes
// app.use("/api", artistRoutes);      // Artist routes
// app.use("/api", eventRoutes);       // Event routes
// app.use("/api", artFormRoutes);     // Art Form routes
 
// app.use("/api", contributeRoutes); // Contribution routes
// app.use("/api", applicationRoutes); // Application routes
// app.use("/api", eventApplicationRoutes); // Event Application routes
// app.use("/api", contactArtistRoutes); // Contact Artist routes
// app.use("/api/admin", adminRoutes);      // Admin routes
// app.use("/api", artistAuthRoutes); // Artist Authentication routes
// app.use("/api", eventSubmissionRoutes); // Event Submission routes
 
// // Existing routes
// app.use("/api", router);            // Main API routes
// app.use("/api", routerFam);         // Family-related API routes
// app.use("/api", submissionRoutes);  
 
// // Static file serving for images
// app.use('/api/eventImage', express.static(path.join(__dirname, 'eventImage')));
// app.use('/api/familyImage', express.static(path.join(__dirname, 'familyImage')));
// app.use("/api/bannerImage", express.static(path.join(__dirname, "bannerImage")));
// app.use("/api/galleryImage", express.static(path.join(__dirname, "galleryImage")));
// app.use("/api/uploadArtistImage", express.static(path.join(__dirname, "uploadArtistImage")));
// app.use("/api/artFormImage", express.static(path.join(__dirname, "artFormImage")));
 
// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || "Internal Server Error",
//     error: process.env.NODE_ENV === "development" ? err : {},
//   });
// });
 
// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });
 
// // Start the server and log that it's running
// app.listen(process.env.PORT, () => {
//   console.log(`Server is running on port ${process.env.PORT}`);
//   console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
//   console.log(` Base URL: http://localhost:${process.env.PORT}/api`);
// });
// Required dependencies
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const path = require("path");
// require("./cron/recurringEvents.cron");
 
 
// Load environment variables from .env file
dotenv.config();
 
// Import the database connection
const database = require("./database/database");
 
// Import existing routers
const router = require("./router/registerRoutes");
const routerFam = require("./router/family");
 
// Import new routers for the main application
const dashboardRoutes = require("./router/dashboardRoutes")
const artistRoutes = require("./router/artistRoutes");
const eventRoutes = require("./router/eventRoutes");
const artFormRoutes = require("./router/artFormRoutes");
const contributeRoutes = require("./router/contributeRoutes");
const applicationRoutes = require("./router/applicationRoutes");
const eventApplicationRoutes = require("./router/eventApplicationRoutes");
const submissionRoutes = require("./router/submissionRoutes");
const contactArtistRoutes = require("./router/contactArtistRoutes");
const adminRoutes = require("./router/adminRoutes");
const artistAuthRoutes = require("./router/artistAuthRoutes");
const eventSubmissionRoutes = require("./router/eventSubmissionRoutes");
 
const app = express();
 
// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// Initialize database connection
database();
 
// Set up CORS to allow requests from the frontend domains
const allowedOrigins = process.env.REACT_APP_API_BASE_URL
  ? process.env.REACT_APP_API_BASE_URL.split(",").map((url) => url.trim())
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8080",
      "https://unearthify.com",
      "https://admin.unearthify.com",
    ];
 
// Manual CORS middleware with Cache-Control to fix the '304 Not Modified' caching issue
app.use((req, res, next) => {
  const origin = req.headers.origin;
 
  const isAllowed = !origin ||
                   allowedOrigins.includes(origin) ||
                   origin.endsWith(".unearthify.com") ||
                   origin === "https://unearthify.com";
 
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
   
    // Crucial: Tell the browser/proxies that the response depends on the Origin
    res.setHeader('Vary', 'Origin');
   
    // Debug header
    res.setHeader('X-Backend-Version', '1.0.2');
  }
 
  // Force revalidation to clear any old '304' cached errors in user browsers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
 
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
 
// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Unearthify API Server is running",
    version: "1.0.0",
  });
});
 
// Define the routes - New API routes
app.use("/api", dashboardRoutes);    // dashboard routes
app.use("/api", artistRoutes);      // Artist routes
app.use("/api", eventRoutes);       // Event routes
app.use("/api", artFormRoutes);     // Art Form routes
 
app.use("/api", contributeRoutes); // Contribution routes
app.use("/api", applicationRoutes); // Application routes
app.use("/api", eventApplicationRoutes); // Event Application routes
app.use("/api", contactArtistRoutes); // Contact Artist routes
app.use("/api/admin", adminRoutes);      // Admin routes
app.use("/api", artistAuthRoutes); // Artist Authentication routes
app.use("/api", eventSubmissionRoutes); // Event Submission routes
 
// Existing routes
app.use("/api", router);            // Main API routes
app.use("/api", routerFam);         // Family-related API routes
app.use("/api", submissionRoutes);  
 
// Static file serving for images
app.use('/api/eventImage', express.static(path.join(__dirname, 'eventImage')));
app.use('/api/familyImage', express.static(path.join(__dirname, 'familyImage')));
app.use("/api/bannerImage", express.static(path.join(__dirname, "bannerImage")));
app.use("/api/galleryImage", express.static(path.join(__dirname, "galleryImage")));
app.use("/api/uploadArtistImage", express.static(path.join(__dirname, "uploadArtistImage")));
app.use("/api/artFormImage", express.static(path.join(__dirname, "artFormImage")));
 
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});
 
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});
 
// Start the server and log that it's running
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(` Base URL: http://localhost:${process.env.PORT}/api`);
});
 
 