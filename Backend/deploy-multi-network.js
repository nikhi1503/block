import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  const network = process.env.HARDHAT_NETWORK || "localhost";
  console.log(`\n🚀 Deploying to ${network} network...\n`);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get network info
  const networkData = await ethers.provider.getNetwork();
  console.log("Network:", networkData.name);
  console.log("Chain ID:", networkData.chainId);

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

  const templeNames = ["Shiva Mandir", "Vishnu Temple", "Krishna Mandir"];

  for (let i = 0; i < templeAddresses.length; i++) {
    const templeAddr = templeAddresses[i];
    const templeName = templeNames[i];

    const tx = await registry.registerTemple(templeAddr);
    await tx.wait();
    console.log(`✅ ${templeName} registered`);
  }

  // ===== Save addresses =====
  const networkName = network.toLowerCase();
  const addressesPath = path.resolve("scripts", `deployedAddresses-${networkName}.json`);
  const deployedAddresses = {
    network: networkName,
    chainId: networkData.chainId,
    timestamp: new Date().toISOString(),
    TempleRegistry: {
      contractAddress: registryAddress,
      deployedBy: deployer.address,
    },
    TempleFund: {
      contractAddress: fundAddress,
      deployedBy: deployer.address,
    },
    Temples: templeNames.map((name, i) => ({
      name,
      address: templeAddresses[i],
    })),
  };

  fs.writeFileSync(addressesPath, JSON.stringify(deployedAddresses, null, 2));
  console.log("\n✅ Addresses saved to:", addressesPath);
  console.log("\nDeployment complete!");
  console.log("Network:", networkName);
  console.log("TempleRegistry:", registryAddress);
  console.log("TempleFund:", fundAddress);
  console.log("\nFrontend addresses config:");
  console.log(`Chain ID ${networkData.chainId}: registry=${registryAddress.toLowerCase()}, fund=${fundAddress.toLowerCase()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
