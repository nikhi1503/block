import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/temple-fund");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Define Temple Schema
const templeSchema = new mongoose.Schema({
  templeName: String,
  walletAddress: String,
  location: {
    address: String,
    city: String,
    state: String,
  },
  contactEmail: String,
  phone: String,
  isActive: Boolean,
  createdAt: { type: Date, default: Date.now },
});

const Temple = mongoose.model("Temple", templeSchema);

async function addTemples() {
  await connectDB();

  const temples = [
    {
      templeName: "Shiva Mandir",
      walletAddress: "0x1234567890123456789012345678901234567890",
      location: {
        address: "123 Temple Street",
        city: "Delhi",
        state: "Delhi",
      },
      contactEmail: "shiva@temple.com",
      phone: "+91-1234567890",
      isActive: true,
    },
    {
      templeName: "Vishnu Temple",
      walletAddress: "0x2234567890123456789012345678901234567891",
      location: {
        address: "456 Temple Road",
        city: "Mumbai",
        state: "Maharashtra",
      },
      contactEmail: "vishnu@temple.com",
      phone: "+91-1234567891",
      isActive: true,
    },
    {
      templeName: "Krishna Mandir",
      walletAddress: "0x3234567890123456789012345678901234567892",
      location: {
        address: "789 Temple Lane",
        city: "Bangalore",
        state: "Karnataka",
      },
      contactEmail: "krishna@temple.com",
      phone: "+91-1234567892",
      isActive: true,
    },
  ];

  try {
    // Clear existing temples
    await Temple.deleteMany({});
    console.log("Cleared existing temples");

    // Add new temples
    const result = await Temple.insertMany(temples);
    console.log("✅ Added temples to database:");
    result.forEach((temple) => {
      console.log(`   - ${temple.templeName}: ${temple.walletAddress}`);
    });
  } catch (error) {
    console.error("❌ Error adding temples:", error);
  } finally {
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  }
}

addTemples();
