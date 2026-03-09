import pkg from "hardhat";
const { ethers } = pkg;
import hre from "hardhat";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  console.log("🧪 Testing Blockchain Donation\n");

  try {
    // Load deployed addresses
    const addressesPath = path.resolve("scripts", "deployedAddresses.json");
    const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    
    const registryAddress = deployed.TempleRegistry.contractAddress;
    const fundAddress = deployed.TempleFund.contractAddress;

    console.log("📍 Contract Addresses:");
    console.log("   TempleRegistry:", registryAddress);
    console.log("   TempleFund:", fundAddress);

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    const [signer] = await hre.ethers.getSigners();

    console.log("\n👤 Sender Address:", signer.address);

    // Load ABIs
    const registryAbiPath = path.resolve("artifacts", "contracts", "TempleRegistry.sol", "TempleRegistry.json");
    const fundAbiPath = path.resolve("artifacts", "contracts", "TempleFund.sol", "TempleFund.json");
    
    const registryABI = JSON.parse(fs.readFileSync(registryAbiPath, "utf8")).abi;
    const fundABI = JSON.parse(fs.readFileSync(fundAbiPath, "utf8")).abi;

    // Connect to contracts
    const registry = new ethers.Contract(registryAddress, registryABI, signer);
    const fund = new ethers.Contract(fundAddress, fundABI, signer);

    // Temple address to test with (using first hardcoded address from donation page)
    const templeAddress = "0x1234567890123456789012345678901234567890";

    console.log("\n🏛️  Testing with Temple Address:", templeAddress);

    // Check if temple is registered
    console.log("\n📋 Checking if temple is registered...");
    try {
      const isRegistered = await registry.isRegistered(templeAddress);
      console.log("   Is Registered:", isRegistered ? "✅ YES" : "❌ NO");

      if (!isRegistered) {
        console.log("\n⚠️  Temple is NOT registered on blockchain!");
        console.log("   You need to register it first using: npm run register-temples");
        process.exit(1);
      }
    } catch (error) {
      console.log("   ❌ Error checking registration:", error.message);
      process.exit(1);
    }

    // Check current balance
    console.log("\n💰 Checking current ETH balance in contract...");
    try {
      const balance = await fund.getTempleEthBalance(templeAddress);
      const balanceEth = ethers.formatEther(balance);
      console.log("   Current Balance:", balanceEth, "ETH");
    } catch (error) {
      console.log("   ❌ Error checking balance:", error.message);
    }

    // Send a test donation
    console.log("\n💸 Sending test donation...");
    const donationAmount = ethers.parseEther("0.1"); // 0.1 ETH

    try {
      const tx = await fund.donateEthToTemple(templeAddress, {
        value: donationAmount,
      });

      console.log("   Transaction Hash:", tx.hash);
      console.log("   Waiting for confirmation...");

      const receipt = await tx.wait();
      console.log("   ✅ Transaction Confirmed!");
      console.log("   Block Number:", receipt.blockNumber);

      // Check new balance
      console.log("\n💰 Checking new ETH balance...");
      const newBalance = await fund.getTempleEthBalance(templeAddress);
      const newBalanceEth = ethers.formatEther(newBalance);
      console.log("   New Balance:", newBalanceEth, "ETH");
      console.log("   ✅ Donation received: 0.1 ETH");

    } catch (error) {
      console.log("   ❌ Error sending donation:", error.message);
      if (error.data) {
        console.log("   Error data:", error.data);
      }
      process.exit(1);
    }

    console.log("\n✅ Test Complete! Balance should now show on withdrawal page.");

  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
