import mongoose from 'mongoose';
import { Temple } from './src/models/templeDetails.model.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const createTemples = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI + '/Temple-Fund-Management');
    console.log('Connected to MongoDB');
    
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
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
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
        walletAddress: "0x2234567890123456789012345678901234567891",
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
        walletAddress: "0x3234567890123456789012345678901234567892",
        contactDetails: {
          phone: "9876543212",
          email: "krishna@temple.com",
        },
        isVerified: true,
      },
    ];

    console.log('Creating temples:\n');
    for (const temple of temples) {
      try {
        const existing = await Temple.findOne({ templeName: temple.templeName });
        if (!existing) {
          const newTemple = await Temple.create(temple);
          console.log(`✅ Created: ${temple.templeName}`);
          console.log(`   Wallet: ${temple.walletAddress}`);
        } else {
          console.log(`⚠️ Already exists: ${temple.templeName}`);
          // Update wallet address if different
          if (existing.walletAddress !== temple.walletAddress) {
            existing.walletAddress = temple.walletAddress;
            await existing.save();
            console.log(`   Updated wallet to: ${temple.walletAddress}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error with ${temple.templeName}:`, error.message);
      }
    }

    console.log('\n✅ Temple setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createTemples();
