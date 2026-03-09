import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  const [signer] = await ethers.getSigners();
  
  console.log("Current Network Check:");
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const registryAddress = deployed.TempleRegistry.contractAddress;
  const fundAddress = deployed.TempleFund.contractAddress;

  const registryAbiPath = path.resolve("artifacts", "contracts", "TempleRegistry.sol", "TempleRegistry.json");
  const fundAbiPath = path.resolve("artifacts", "contracts", "TempleFund.sol", "TempleFund.json");
  const registryABI = JSON.parse(fs.readFileSync(registryAbiPath, "utf8")).abi;
  const fundABI = JSON.parse(fs.readFileSync(fundAbiPath, "utf8")).abi;

  const registry = new ethers.Contract(registryAddress, registryABI, signer);
  const fund = new ethers.Contract(fundAddress, fundABI, signer);

  console.log("\nDeployed Contracts:");
  console.log("Registry:", registryAddress);
  console.log("Fund:", fundAddress);

  // Check registry reference in fund
  console.log("\nVerifying Fund → Registry link:");
  const registryFromFund = await fund.templeRegistry();
  console.log("Fund's registry address:", registryFromFund);
  console.log("Match:", registryFromFund.toLowerCase() === registryAddress.toLowerCase());

  // Check code at addresses
  console.log("\nContract code verification:");
  const registryCode = await ethers.provider.getCode(registryAddress);
  const fundCode = await ethers.provider.getCode(fundAddress);
  console.log("Registry has code:", registryCode !== "0x");
  console.log("Fund has code:", fundCode !== "0x");

  // Test donation with explicit error handling
  console.log("\nTesting donation...");
  const templeAddr = "0x1234567890123456789012345678901234567890";
  const donationAmount = ethers.parseEther("0.001");

  try {
    // First verify temple is registered
    const isReg = await registry.isRegistered(templeAddr);
    console.log("Temple registered:", isReg);

    // Estimate gas
    console.log("Estimating gas...");
    const gasEstimate = await ethers.provider.estimateGas({
      to: fundAddress,
      from: signer.address,
      data: fund.interface.encodeFunctionData("donateEthToTemple", [templeAddr]),
      value: donationAmount,
    });
    console.log("Gas estimate:", gasEstimate.toString());

    // Send transaction
    console.log("Sending transaction...");
    const tx = await fund.donateEthToTemple(templeAddr, { value: donationAmount });
    console.log("✅ Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.data) console.error("Error data:", error.data);
  }
}

main().catch(console.error);
