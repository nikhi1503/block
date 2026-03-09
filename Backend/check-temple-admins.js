import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const checkTempleAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI + '/Temple-Fund-Management');
    console.log('Connected to MongoDB');
    
    const admins = await User.find({ role: "templeAdmin" });
    console.log(`\nFound ${admins.length} temple admins:\n`);
    
    admins.forEach(admin => {
      console.log(`Name: ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Phone: ${admin.phone}`);
      console.log(`Temple: ${admin.templeName}`);
      console.log(`Status: ${admin.status}`);
      console.log(`Password hash exists: ${admin.password ? 'Yes' : 'No'}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkTempleAdmins();
