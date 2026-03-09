import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const checkSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI + '/Temple-Fund-Management');
    console.log('Connected to MongoDB');
    
    // Delete existing super admin
    const deleted = await User.deleteOne({ email: 'admin@temple.com' });
    console.log('Deleted existing super admin:', deleted.deletedCount > 0);
    
    console.log('Creating fresh super admin (let mongoose hash password)...');
    // DON'T hash with bcryptjs - let the User model pre-save hook do it
    const newUser = await User.create({
      name: 'Super Admin',
      email: 'admin@temple.com',
      password: 'SuperAdmin@123456',  // Plain password - will be hashed by pre-save hook
      phone: '9988776655',
      role: 'superAdmin',
      status: 'active',
      loginType: 'email',
      walletAddress: '0x0000000000000000000000000000000000000000'
    });
    console.log('✅ Super Admin created successfully');
    console.log('Email:', newUser.email);
    console.log('Password: SuperAdmin@123456');
    console.log('Password hashed:', newUser.password !== 'SuperAdmin@123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkSuperAdmin();
