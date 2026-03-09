#!/usr/bin/env node
/**
 * Check donation transactions in MongoDB database
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/Temple-Fund-Management";

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionType: String,
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  txHash: String,
  status: String,
  gasPrice: Number,
  transactionFee: Number,
  purpose: String,
  cryptoType: String,
  templeWalletAddress: String,
  senderWalletAddress: String,
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);

async function main() {
  try {
    console.log("🔗 Connecting to MongoDB:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all transactions without population (to avoid schema errors)
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 });

    console.log(`📊 Total Transactions: ${transactions.length}\n`);

    if (transactions.length === 0) {
      console.log("❌ No transactions found in database!");
    } else {
      transactions.forEach((tx, index) => {
        console.log(`\n📝 Transaction ${index + 1}:`);
        console.log(`   TX Hash: ${tx.txHash || "❌ MISSING"}`);
        console.log(`   Amount: ${tx.amount || "❌ MISSING"} ETH`);
        console.log(`   Status: ${tx.status || "❌ MISSING"}`);
        console.log(`   Temple Wallet: ${tx.templeWalletAddress || "N/A"}`);
        console.log(`   Sender Wallet: ${tx.senderWalletAddress || "N/A"}`);
        console.log(`   Sender ID: ${tx.sender ? "✅ Has Reference: " + tx.sender : "❌ NO REFERENCE (null)"}`);
        console.log(`   Receiver ID: ${tx.receiver ? "✅ Has Reference: " + tx.receiver : "❌ NO REFERENCE (null)"}`);
        console.log(`   Created: ${tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "❌ MISSING"}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✨ Database check complete!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

main();
