import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  // Load deployed addresses
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const contractAddress = deployed.TempleFund.contractAddress;

  // Get default signer from Hardhat
  const [signer] = await ethers.getSigners();
  console.log("Donor address:", signer.address);

  // Load ABI
  const abiPath = path.resolve("artifacts", "contracts", "TempleFund.sol", "TempleFund.json");
  const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

  // Connect to the TempleFund contract
  const fund = new ethers.Contract(contractAddress, contractABI, signer);

  // Define temple address and donation amount (in wei)
  const templeAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Shiva Temple wallet
  const amountInEther = "0.01"; // donation amount

  // Send donation transaction
  const tx = await fund.donateEthToTemple(templeAddress, {
    value: ethers.parseEther(amountInEther),
  });

  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Donated ${amountInEther} ETH to ${templeAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
