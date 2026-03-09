#!/bin/bash

# Simple script to send a test donation to a temple on hardhat

echo "🧪 Sending Test Donation to Blockchain"
echo "======================================"
echo ""

# Using hardhat localhost network
export AMOY_RPC_URL="http://localhost:8545"

# Temple address from your donation page
TEMPLE_ADDRESS="0x1234567890123456789012345678901234567890"
DONATION_AMOUNT="0.1"  # in ETH

echo "Temple Address: $TEMPLE_ADDRESS"
echo "Donation Amount: $DONATION_AMOUNT ETH"
echo ""

# Create a simple Hardhat script inline and run it
npx hardhat run --network localhost <<'EOF'
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Sender:", signer.address);

  // Load deployed addresses
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const fundAddress = deployed.TempleFund.contractAddress;

  const abiPath = path.resolve("artifacts", "contracts", "TempleFund.sol", "TempleFund.json");
  const abi = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

  const fund = new ethers.Contract(fundAddress, abi, signer);

  const templeAddress = "0x1234567890123456789012345678901234567890";
  const amount = ethers.parseEther("0.1");

  console.log("\nSending donation...");
  const tx = await fund.donateEthToTemple(templeAddress, { value: amount });
  console.log("TX Hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ Confirmed in block", receipt.blockNumber);

  // Check balance
  const balance = await fund.getTempleEthBalance(templeAddress);
  console.log("Balance after donation:", ethers.formatEther(balance), "ETH");
}

main().catch(console.error);
EOF
