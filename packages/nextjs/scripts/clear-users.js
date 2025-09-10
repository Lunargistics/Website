const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function clearUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "lunar",
    });

    console.log("Connected to MongoDB");

    // Drop the users collection
    const result = await mongoose.connection.db.collection("users").deleteMany({});

    console.log(`Deleted ${result.deletedCount} users from the database`);

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error clearing users:", error);
    process.exit(1);
  }
}

clearUsers();
