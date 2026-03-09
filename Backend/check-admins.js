import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const checkTempleAdmins = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/Temple-Fund-Management`);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Find all temple admins
    const admins = await usersCollection
      .find({ role: "templeAdmin" })
      .toArray();

    console.log(`\n📋 Found ${admins.length} temple admins:\n`);
    admins.forEach((admin) => {
      console.log(`  📌 ${admin.templeName || "NO TEMPLE NAME"}`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     Phone: ${admin.phone}`);
      console.log(`     Status: ${admin.status}`);
      console.log(`     Wallet: ${admin.walletAddress || "NOT SET"}`);
      console.log(`     ID: ${admin._id}`);
      console.log("");
    });

    // Now update them with wallet addresses
    console.log("🔧 Updating wallet addresses...\n");
    
    const walletMapping = {
      "Shiva Mandir": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "Vishnu Temple": "0x2234567890123456789012345678901234567891",
      "Krishna Mandir": "0x3234567890123456789012345678901234567892",
    };

    for (const [templeName, walletAddress] of Object.entries(walletMapping)) {
      const result = await usersCollection.updateOne(
        { templeName, role: "templeAdmin" },
        { 
          $set: { 
            walletAddress,
            status: "active" // Also set status to active
          } 
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${templeName} with wallet: ${walletAddress}`);
      } else {
        console.log(`⚠️ No temple admin found for: ${templeName}`);
      }
    }

    // Verify updates
    console.log("\n✨ Verification:\n");
    const updatedAdmins = await usersCollection
      .find({ role: "templeAdmin" })
      .toArray();

    updatedAdmins.forEach((admin) => {
      console.log(`  ✅ ${admin.templeName}: ${admin.walletAddress}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

checkTempleAdmins();
