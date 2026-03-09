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

    console.log("Registering temples with address:", signer.address);

    // Get contract ABI
    const abiPath = path.resolve("artifacts", "contracts", "TempleRegistry.sol", "TempleRegistry.json");
    const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

    // Connect to the contract
    const registry = new ethers.Contract(contractAddress, contractABI, signer);

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

    console.log("\n📍 Registering temples on blockchain...\n");

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
