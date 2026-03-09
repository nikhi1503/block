#!/usr/bin/env node

/**
 * Simple deployment script for Hardhat local network
 * Deploys both TempleRegistry and TempleFund contracts
 */

import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying contracts to Hardhat Local Network...");

  // Get signer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Deploy TempleRegistry
  console.log("\n📋 Deploying TempleRegistry...");
  const TempleRegistry = await hre.ethers.getContractFactory("TempleRegistry");
  const registry = await TempleRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ TempleRegistry deployed at:", registryAddress);

  // Deploy TempleFund
  console.log("\n💰 Deploying TempleFund...");
  const TempleFund = await hre.ethers.getContractFactory("TempleFund");
  const fund = await TempleFund.deploy(registryAddress);
  await fund.waitForDeployment();
  const fundAddress = await fund.getAddress();
  console.log("✅ TempleFund deployed at:", fundAddress);

  // Save addresses
  const addresses = {
    network: "localhost (31337)",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    registry: registryAddress.toLowerCase(),
    fund: fundAddress.toLowerCase(),
  };

  const outputPath = path.join(__dirname, "deployedAddresses-localhost.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("\n📁 Addresses saved to:", outputPath);

  // Output for frontend
  console.log("\n🔧 Update Frontend config/networks.ts:");
  console.log(`Registry: "${registryAddress.toLowerCase()}"`);
  console.log(`Fund:     "${fundAddress.toLowerCase()}"`);

  return addresses;
}


main()
  .then((addresses) => {
    console.log("\n✨ Deployment complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

