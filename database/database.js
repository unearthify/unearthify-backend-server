const mongoose = require("mongoose");
require("dotenv").config();

const MongoDbOne = process.env.MONGO_URI;

const databaseOne = () => {
  if (!MongoDbOne) {
    console.error("Error: MONGO_URI is not defined in the environment file");
    return;
  }

  // Debug: Log connection string with masked password
  const maskedUri = MongoDbOne.replace(/:([^:@]+)@/, ':****@');
  console.log("Attempting to connect to MongoDB...");
  console.log("Connection string:", maskedUri);
  console.log("Full URI length:", MongoDbOne.length);

  mongoose
    .connect(MongoDbOne)
    .then(() => {
      console.log("MongoDB database connected successfully");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error.message);
      console.error("Detailed error:", error);
      // Optional: Retry logic
      setTimeout(databaseOne, 5000); // Retry connection after 5 seconds
    });
};

// Log unhandled promise rejections globally
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error.message);
});

module.exports = databaseOne;
