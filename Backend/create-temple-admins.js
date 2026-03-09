import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const createTempleAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI + '/Temple-Fund-Management');
    console.log('Connected to MongoDB');
    
    const templeAdmins = [
      {
        name: "Shiva Temple Admin",
        email: "shiva@temple.com",
        password: "Admin@123456",
        phone: "9876543210",
        role: "templeAdmin",
        status: "active",
        loginType: "email",
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        templeName: "Shiva Mandir",
      },
      {
        name: "Vishnu Temple Admin",
        email: "vishnu@temple.com",
        password: "Admin@123456",
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
        password: "Admin@123456",
        phone: "9876543212",
        role: "templeAdmin",
        status: "active",
        loginType: "email",
        walletAddress: "0x3234567890123456789012345678901234567892",
        templeName: "Krishna Mandir",
      },
    ];

    for (const admin of templeAdmins) {
      try {
        const existing = await User.findOne({ email: admin.email });
        if (!existing) {
          const newAdmin = await User.create(admin);
          console.log(`✅ Created: ${admin.name} (${admin.email})`);
        } else {
          console.log(`⚠️ Already exists: ${admin.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${admin.name}:`, error.message);
      }
    }

    console.log('\n✅ Temple admin setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createTempleAdmins();
