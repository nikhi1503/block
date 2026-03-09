import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/Temple-Fund-Management`);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.log("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const updateTempleWallets = async () => {
  const db = mongoose.connection.db;
  
  try {
    const usersCollection = db.collection("users");

    // Map temple names to wallet addresses
    const walletMapping = {
      "Shiva Mandir": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "Vishnu Temple": "0x2234567890123456789012345678901234567891",
      "Krishna Mandir": "0x3234567890123456789012345678901234567892",
    };

    // Update temple admins with wallet addresses
    for (const [templeName, walletAddress] of Object.entries(walletMapping)) {
      const result = await usersCollection.updateOne(
        { templeName, role: "templeAdmin" },
        { $set: { walletAddress } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${templeName} with wallet: ${walletAddress}`);
      } else {
        console.log(`⚠️ No matching temple admin found for: ${templeName}`);
      }
    }

    // Verify the updates
    console.log("\n📋 Current Temple Admins:");
    const admins = await usersCollection
      .find({ role: "templeAdmin" })
      .project({ templeName: 1, walletAddress: 1, status: 1, email: 1 })
      .toArray();

    admins.forEach((admin) => {
      console.log(`  📌 ${admin.templeName}`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     Status: ${admin.status}`);
      console.log(`     Wallet: ${admin.walletAddress || "NOT SET"}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating wallets:", error);
    process.exit(1);
  }
};

connectDB().then(() => updateTempleWallets());
