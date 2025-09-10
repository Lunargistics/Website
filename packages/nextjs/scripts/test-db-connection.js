const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lunargistics";

async function testConnection() {
  try {
    console.log("Testing MongoDB connection...");
    console.log("URI:", MONGODB_URI.replace(/\/\/.*@/, "//***:***@")); // Hide credentials

    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    console.log("✅ Successfully connected to MongoDB");

    // Test creating a document
    const testSchema = new mongoose.Schema({
      test: String,
      timestamp: { type: Date, default: Date.now },
    });

    const TestModel = mongoose.models.Test || mongoose.model("Test", testSchema);

    const testDoc = await TestModel.create({
      test: "Database connection test",
    });

    console.log("✅ Successfully created test document:", testDoc._id);

    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log("✅ Successfully deleted test document");

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

testConnection();
