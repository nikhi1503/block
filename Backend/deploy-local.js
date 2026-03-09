import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  console.log("Deploying contracts to local Hardhat network...\n");

  // Get the first signer (default account with funds)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // ===== Deploy TempleRegistry =====
  console.log("\n📦 Deploying TempleRegistry...");
  const TempleRegistry = await ethers.getContractFactory("TempleRegistry");
  const registry = await TempleRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ TempleRegistry deployed at:", registryAddress);

  // ===== Deploy TempleFund =====
  console.log("\n📦 Deploying TempleFund...");
  const TempleFund = await ethers.getContractFactory("TempleFund");
  const fund = await TempleFund.deploy(registryAddress);
  await fund.waitForDeployment();
  const fundAddress = await fund.getAddress();
  console.log("✅ TempleFund deployed at:", fundAddress);

  // ===== Register Temples =====
  console.log("\n📍 Registering temples...");
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
    
    const tx = await registry.registerTemple(templeAddr);
    await tx.wait();
    console.log(`✅ ${templeName} registered`);
  }

  // ===== Save addresses =====
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployedAddresses = {
    TempleRegistry: {
      contractAddress: registryAddress,
      deployedBy: deployer.address,
    },
    TempleFund: {
      contractAddress: fundAddress,
      deployedBy: deployer.address,
    },
  };

  fs.writeFileSync(addressesPath, JSON.stringify(deployedAddresses, null, 2));
  console.log("\n✅ Addresses saved to:", addressesPath);
  console.log("\nDeployment complete!");
  console.log("TempleRegistry:", registryAddress);
  console.log("TempleFund:", fundAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
