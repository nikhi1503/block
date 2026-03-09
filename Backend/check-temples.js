import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const checkTemples = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/Temple-Fund-Management`);
    const db = mongoose.connection.db;
    
    const temples = await db.collection('templedetails').find({}).toArray();
    console.log('📌 Temple Details:');
    temples.forEach(t => {
      console.log(`  - ${t.templeName}: ${t.walletAddress || 'NO WALLET'}`);
    });
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
};

checkTemples();
