import pkg from 'hardhat';
const { ethers } = pkg;
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  // Load deployed contract address
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const contractAddress = deployed.TempleRegistry.contractAddress;

  // Get signer from Hardhat (account 0 is the deployer/superadmin)
  const [signer] = await ethers.getSigners();
  console.log("Registering temple with account:", signer.address);

  // Get contract ABI using fs.readFileSync
  const abiPath = path.resolve("artifacts","contracts","TempleRegistry.sol", "TempleRegistry.json");
  const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

  // Connect to the contract
  const registry = new ethers.Contract(contractAddress, contractABI, signer);

  // Define temple address to register (Shiva Temple)
  const temples = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Shiva Temple
    "0x2234567890123456789012345678901234567891", // Vishnu Temple
    "0x3234567890123456789012345678901234567892", // Krishna Temple
  ];

  for (const templeAddress of temples) {
    try {
      const tx = await registry.registerTemple(templeAddress);
      console.log(`Registering temple ${templeAddress}...`);
      await tx.wait();
      console.log(`✅ Temple ${templeAddress} registered successfully.`);
    } catch (error) {
      console.log(`⚠️ Temple ${templeAddress} registration failed:`, error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});