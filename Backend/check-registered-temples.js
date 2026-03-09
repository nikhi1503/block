import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const registryAddress = deployed.TempleRegistry.contractAddress;

  const registryAbiPath = path.resolve("artifacts", "contracts", "TempleRegistry.sol", "TempleRegistry.json");
  const registryABI = JSON.parse(fs.readFileSync(registryAbiPath, "utf8")).abi;

  const [signer] = await ethers.getSigners();
  const registry = new ethers.Contract(registryAddress, registryABI, signer);

  // Test specific addresses
  const testAddresses = [
    "0x1234567890123456789012345678901234567890",
    "0x2234567890123456789012345678901234567891",
    "0x3234567890123456789012345678901234567892",
  ];

  console.log("Checking registered temples on blockchain:");
  for (const addr of testAddresses) {
    try {
      const isReg = await registry.isRegistered(addr);
      console.log(`${addr}: ${isReg ? "✅ REGISTERED" : "❌ NOT REGISTERED"}`);
    } catch (e) {
      console.log(`${addr}: ERROR - ${e.message}`);
    }
  }
}

main().catch(console.error);
