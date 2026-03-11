import pkg from "hardhat";
const { ethers } = pkg;
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function main() {
  const addressesPath = path.resolve("scripts", "deployedAddresses.json");
  const deployed = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const contractAddress = deployed.TempleFund.contractAddress;

  // Use localhost instead of AMOY
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");

  const abiPath = path.resolve("artifacts", "contracts", "TempleFund.sol", "TempleFund.json");
  const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;

  const fund = new ethers.Contract(contractAddress, contractABI, provider);

  // Use Shiva Temple's wallet address
  const templeAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  const balance = await fund.getTempleEthBalance(templeAddress);
  console.log(`Temple ${templeAddress} ETH Balance: ${ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
