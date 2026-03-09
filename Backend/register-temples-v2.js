import pkg from 'hardhat';
const { ethers } = pkg;
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  try {
    // Load deployed contract address
    const addressesPath = path.resolve("scripts", "deployedAddresses.json");
    const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const contractAddress = deployed.TempleRegistry.contractAddress;

    console.log("TempleRegistry Contract Address:", contractAddress);

    // Get signer from private key
    const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("Current signer address:", signer.address);

    // Get contract ABI
    const abiPath = path.resolve("artifacts", "contracts", "TempleRegistry.sol", "TempleRegistry.json");
    const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

    // Connect to the contract
    const registry = new ethers.Contract(contractAddress, contractABI, signer);

    // Check current super admin
    const currentSuperAdmin = await registry.superAdmin();
    console.log("Current Super Admin:", currentSuperAdmin);

    // If the current signer is not the super admin, you need to use the deployer's private key
    if (signer.address.toLowerCase() !== currentSuperAdmin.toLowerCase()) {
      console.error("❌ Current signer is NOT the super admin!");
      console.error("You need to use the deployer's private key (the one that deployed the contract)");
      console.error("Current signer:", signer.address);
      console.error("Super admin:", currentSuperAdmin);
      process.exit(1);
    }

    console.log("✅ Current signer IS the super admin");
    console.log("\n📍 Ready to register temples...\n");

    // Temple addresses to register
    const templeAddresses = [
      "0x1234567890123456789012345678901234567890", // Shiva Mandir
      "0x2234567890123456789012345678901234567891", // Vishnu Temple
      "0x3234567890123456789012345678901234567892", // Krishna Mandir
    ];

    const templeNames = [
      "Shiva Mandir",
      "Vishnu Temple",
      "Krishna Mandir",
    ];

    for (let i = 0; i < templeAddresses.length; i++) {
      const templeAddr = templeAddresses[i];
      const templeName = templeNames[i];

      try {
        console.log(`Registering ${templeName} (${templeAddr})...`);
        
        const tx = await registry.registerTemple(templeAddr);
        console.log(`  Transaction hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ ${templeName} registered successfully!`);
        console.log(`  Block: ${receipt.blockNumber}\n`);
      } catch (error) {
        console.error(`❌ Error registering ${templeName}:`, error.message);
      }
    }

    console.log("✅ All temples registration complete!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
