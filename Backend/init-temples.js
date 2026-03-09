import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
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

const initializeDatabase = async () => {
  const db = mongoose.connection.db;
  
  try {
    // Define User schema inline for direct insertion
    const usersCollection = db.collection("users");
    const templesCollection = db.collection("templedetails");

    // Clear existing data (optional - uncomment if needed)
    // await usersCollection.deleteMany({});
    // await templesCollection.deleteMany({});

    // Create Temple Admins with wallet addresses
    const templeAdmins = [
      {
        name: "Shiva Temple Admin",
        email: "shiva@temple.com",
        password: await bcryptjs.hash("Admin@123456", 10),
        phone: "9876543210",
        role: "templeAdmin",
        status: "active",
        loginType: "email",
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        templeName: "Shiva Mandir",
        emailVerified: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Vishnu Temple Admin",
        email: "vishnu@temple.com",
        password: await bcryptjs.hash("Admin@123456", 10),
        phone: "9876543211",
        role: "templeAdmin",
        status: "active",
        loginType: "email",
        walletAddress: "0x2234567890123456789012345678901234567891",
        templeName: "Vishnu Temple",
        emailVerified: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Krishna Temple Admin",
        email: "krishna@temple.com",
        password: await bcryptjs.hash("Admin@123456", 10),
        phone: "9876543212",
        role: "templeAdmin",
        status: "active",
        loginType: "email",
        walletAddress: "0x3234567890123456789012345678901234567892",
        templeName: "Krishna Mandir",
        emailVerified: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert temple admins - try to insert, skip if duplicate
    for (const admin of templeAdmins) {
      try {
        const existing = await usersCollection.findOne({ email: admin.email });
        if (!existing) {
          await usersCollection.insertOne(admin);
          console.log(`✅ Created temple admin: ${admin.name}`);
        } else {
          console.log(`⚠️ Temple admin already exists: ${admin.name}`);
        }
      } catch (error) {
        console.error(`Error inserting ${admin.name}:`, error.message);
      }
    }

    // Create Temple Details
    const temples = [
      {
        templeName: "Shiva Mandir",
        slug: "shiva-mandir",
        location: {
          address: "123 Temple Street",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
        },
        description: "Ancient Shiva Temple with rich heritage",
        history: "This temple was built in the 16th century and has been a center of worship for centuries.",
        contactDetails: {
          phone: "9876543210",
          email: "shiva@temple.com",
        },
        walletAddress: "0x1234567890123456789012345678901234567890",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        templeName: "Vishnu Temple",
        slug: "vishnu-temple",
        location: {
          address: "456 Divine Road",
          city: "Delhi",
          state: "Delhi",
          country: "India",
        },
        description: "Sacred Vishnu Temple dedicated to Lord Vishnu",
        history: "A revered temple known for its spiritual significance and architectural beauty.",
        contactDetails: {
          phone: "9876543211",
          email: "vishnu@temple.com",
        },
        walletAddress: "0x2234567890123456789012345678901234567891",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        templeName: "Krishna Mandir",
        slug: "krishna-mandir",
        location: {
          address: "789 Holy Lane",
          city: "Mathura",
          state: "Uttar Pradesh",
          country: "India",
        },
        description: "Lord Krishna Temple in Mathura",
        history: "One of the most sacred temples dedicated to Lord Krishna, attracting devotees worldwide.",
        contactDetails: {
          phone: "9876543212",
          email: "krishna@temple.com",
        },
        walletAddress: "0x3234567890123456789012345678901234567892",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert temple details - try to insert, skip if duplicate
    for (const temple of temples) {
      try {
        const existing = await templesCollection.findOne({ templeName: temple.templeName });
        if (!existing) {
          await templesCollection.insertOne(temple);
          console.log(`✅ Created temple: ${temple.templeName}`);
        } else {
          console.log(`⚠️ Temple already exists: ${temple.templeName}`);
        }
      } catch (error) {
        console.error(`Error inserting temple ${temple.templeName}:`, error.message);
      }
    }

    console.log("\n📋 Database Initialization Complete!");
    console.log("\n🔑 Temple Admin Credentials:");
    templeAdmins.forEach((admin) => {
      console.log(`  📌 ${admin.name}`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     Password: Admin@123456`);
      console.log(`     Wallet: ${admin.walletAddress}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
};

connectDB().then(() => initializeDatabase());
