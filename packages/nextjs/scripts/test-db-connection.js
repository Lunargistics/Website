require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const User = require("../models/User.ts");

async function testDBConnection() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    // Test User creation
    console.log("Testing User model...");
    const testUser = new User({
      email: "test@example.com",
      emailLower: "test@example.com",
      password: "TestPassword123!",
      name: "Test User",
      emailVerified: false,
    });

    await testUser.save();
    console.log("Test user created successfully!");

    // Test password comparison
    const isValid = await testUser.comparePassword("TestPassword123!");
    console.log("Password comparison test:", isValid ? "PASSED" : "FAILED");

    // Clean up test user
    await User.deleteOne({ email: "test@example.com" });
    console.log("Test user cleaned up successfully!");

    console.log("All database tests passed!");
  } catch (error) {
    console.error("Database test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

testDBConnection();
