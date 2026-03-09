#!/usr/bin/env node
/**
 * Register temples in the TempleRegistry contract
 */

import hre from "hardhat";

const REGISTRY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Temples to register (matching frontend hardcoded values)
const TEMPLES = [
  {
    name: "Shiva Mandir",
    walletAddress: "0x1234567890123456789012345678901234567890",
    location: "North India",
  },
  {
    name: "Vishnu Temple",
    walletAddress: "0x2234567890123456789012345678901234567891",
    location: "South India",
  },
  {
    name: "Krishna Mandir",
    walletAddress: "0x3234567890123456789012345678901234567892",
    location: "Central India",
  },
];

async function main() {
  console.log("🔗 Registering temples in TempleRegistry...\n");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Registering from:", signer.address);

  // Get registry contract
  const registry = await hre.ethers.getContractAt(
    "TempleRegistry",
    REGISTRY_ADDRESS,
    signer
  );

  // Register each temple
  for (const temple of TEMPLES) {
    try {
      console.log(`\n📍 Registering: ${temple.name}`);
      console.log(`   Wallet: ${temple.walletAddress}`);

      const tx = await registry.registerTemple(temple.walletAddress);

      const receipt = await tx.wait();
      console.log(`   ✅ Registered! TX: ${tx.hash}`);
      console.log(`   Block: ${receipt.blockNumber}`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log("\n✨ Temple registration complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
