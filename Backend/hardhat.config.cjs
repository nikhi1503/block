require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337,
    },
    amoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: [`0x${process.env.PRIVATE_KEY}`, `0x${process.env.DONOR_PRIVATE_KEY}`, `0x${process.env.TEMPLE_PRIVATE_KEY}`],
      chainId: 80002,
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: [`0x${process.env.PRIVATE_KEY}`, `0x${process.env.DONOR_PRIVATE_KEY}`, `0x${process.env.TEMPLE_PRIVATE_KEY}`],
      chainId: 137,
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
    },
  },
};
