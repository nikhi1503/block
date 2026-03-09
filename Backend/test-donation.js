import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  console.log("Testing donation flow...\n");

  // Get signers
  const [signer1, signer2] = await ethers.getSigners();
  console.log("Signer1:", signer1.address);
  console.log("Signer2:", signer2.address);

  // Load deployed addresses
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const registryAddress = deployed.TempleRegistry.contractAddress;
  const fundAddress = deployed.TempleFund.contractAddress;

  console.log("\nTempleFund:", fundAddress);
  console.log("TempleRegistry:", registryAddress);

  // Get ABIs
  const registryAbiPath = path.resolve("artifacts", "contracts", "TempleRegistry.sol", "TempleRegistry.json");
  const fundAbiPath = path.resolve("artifacts", "contracts", "TempleFund.sol", "TempleFund.json");
  const registryABI = JSON.parse(fs.readFileSync(registryAbiPath, "utf8")).abi;
  const fundABI = JSON.parse(fs.readFileSync(fundAbiPath, "utf8")).abi;

  // Connect contracts
  const registry = new ethers.Contract(registryAddress, registryABI, signer1);
  const fund = new ethers.Contract(fundAddress, fundABI, signer1);

  // Check if temple is registered
  const templeAddress = "0x1234567890123456789012345678901234567890";
  const isRegistered = await registry.isRegistered(templeAddress);
  console.log("\nTemple registered:", isRegistered);

  if (!isRegistered) {
    console.log("❌ Temple not registered! Registering now...");
    const tx = await registry.registerTemple(templeAddress);
    await tx.wait();
    console.log("✅ Temple registered!");
  }

  // Test donation
  console.log("\nTesting donation...");
  const donationAmount = ethers.parseEther("0.1");
  console.log("Donation amount:", ethers.formatEther(donationAmount), "ETH");

  try {
    const tx = await fund.donateEthToTemple(templeAddress, {
      value: donationAmount,
    });
    console.log("✅ Donation transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Donation confirmed!");
    console.log("Block:", receipt.blockNumber);
  } catch (error) {
    console.error("❌ Donation failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
