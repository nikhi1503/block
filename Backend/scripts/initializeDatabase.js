import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/user.model.js";
import { Temple } from "../src/models/templeDetails.model.js";
import bcryptjs from "bcryptjs";

dotenv.config({ path: "./.env" });

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/Temple-Fund-Management`);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("MongoDB connection error:", error);
    process.exit(1);
  }
};

const initializeDatabase = async () => {
  try {
    // Create Super Admin
    const superAdminData = {
      name: process.env.SUPERADMIN_NAME || "Super Admin",
      email: process.env.SUPERADMIN_EMAIL || "admin@temple.com",
      password: await bcryptjs.hash(process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123456", 10),
      phone: process.env.SUPERADMIN_PHONE || "9999999999",
      role: "superAdmin",
      status: "active",
      loginType: "email",
      walletAddress: process.env.SUPERADMIN_WALLET || "0x0000000000000000000000000000000000000000",
    };

    const existingSuperAdmin = await User.findOne({ role: "superAdmin" });
    if (!existingSuperAdmin) {
      await User.create(superAdminData);
      console.log(`✅ Created Super Admin: ${superAdminData.email}`);
    } else {
      console.log("⚠️ Super Admin already exists");
    }

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
        walletAddress: "0x1234567890123456789012345678901234567890",
        templeName: "Shiva Mandir",
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
      },
    ];

    // Insert temple admins
    const createdAdmins = await User.insertMany(templeAdmins, { ordered: false }).catch(
      (error) => {
        if (error.code === 11000) {
          console.log("Some admins already exist, continuing...");
          return [];
        }
        throw error;
      }
    );

    console.log(`✅ Created ${createdAdmins.length} temple admins`);

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
        isVerified: true,
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
        isVerified: true,
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
        isVerified: true,
      },
    ];

    const createdTemples = await Temple.insertMany(temples, { ordered: false }).catch(
      (error) => {
        if (error.code === 11000) {
          console.log("Some temples already exist, continuing...");
          return [];
        }
        throw error;
      }
    );

    console.log(`✅ Created ${createdTemples.length} temple details`);
    console.log("\n📋 Database Initialization Complete!");
    console.log("\n� Super Admin Credentials:");
    console.log(`  - ${superAdminData.name}: ${superAdminData.email} / ${process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123456"}`);
    console.log("\n�🔑 Temple Admin Credentials:");
    templeAdmins.forEach((admin) => {
      console.log(`  - ${admin.name}: ${admin.email} / Admin@123456`);
    });
    console.log("\n💰 Wallet Addresses:");
    templeAdmins.forEach((admin) => {
      console.log(`  - ${admin.templeName}: ${admin.walletAddress}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};

connectDB().then(() => initializeDatabase());
