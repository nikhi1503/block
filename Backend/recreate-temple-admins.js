import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const recreateTempleAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI + '/Temple-Fund-Management');
    console.log('Connected to MongoDB');
    
    // Delete all existing temple admins
    const deleted = await User.deleteMany({ role: "templeAdmin" });
    console.log(`✅ Deleted ${deleted.deletedCount} temple admins\n`);
    
    const templeAdmins = [
      {
        name: "Shiva Temple Admin",
        email: "shiva@temple.com",
        password: "Admin@123456",  // Will be hashed by pre-save hook
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

    console.log('Creating new temple admins:\n');
    for (const admin of templeAdmins) {
      try {
        const newAdmin = await User.create(admin);
        console.log(`✅ Created: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: ${admin.password}`);
        console.log('');
      } catch (error) {
        console.error(`❌ Error creating ${admin.name}:`, error.message);
      }
    }

    console.log('✅ Temple admin setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

recreateTempleAdmins();
