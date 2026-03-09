// Network configurations with fallback RPC endpoints
export const NETWORKS = {
  localhost: {
    name: "Hardhat Local",
    chainId: 31337,
    rpc: "http://localhost:8545",
    fallbackRpcs: ["http://127.0.0.1:8545"],
    currency: "ETH",
    explorer: "http://localhost:8545",
    isLocal: true,
  },
  amoy: {
    name: "Polygon Amoy Testnet",
    chainId: 80002,
    rpc: "https://rpc-amoy.polygon.technology",
    fallbackRpcs: [
      "https://polygon-amoy-pokt.nodies.app",
      "https://polygon-amoy.g.alchemy.com/v2/demo",
    ],
    currency: "MATIC",
    explorer: "https://amoy.polygonscan.com",
    isLocal: false,
  },
  polygon: {
    name: "Polygon Mainnet",
    chainId: 137,
    rpc: "https://polygon-rpc.com",
    fallbackRpcs: [
      "https://rpc-mainnet.matic.quorum.zone",
      "https://polygon.llamarpc.com",
    ],
    currency: "MATIC",
    explorer: "https://polygonscan.com",
    isLocal: false,
  },
};

// Contract addresses by network
export const CONTRACT_ADDRESSES: Record<string, { registry: string; fund: string }> = {
  // Localhost - Freshly deployed
  "31337": {
    registry: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
    fund: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
  },
  // Polygon Amoy Testnet
  "80002": {
    registry: (process.env.NEXT_PUBLIC_AMOY_REGISTRY_ADDRESS || "0x3f5ba108f32671c1dd2849d8e2640add6b47e67b").toLowerCase(),
    fund: (process.env.NEXT_PUBLIC_AMOY_FUND_ADDRESS || "0x322813fd9a801c5507c9de605d63cea4f2ce6c44").toLowerCase(),
  },
  // Polygon Mainnet
  "137": {
    registry: (process.env.NEXT_PUBLIC_POLYGON_REGISTRY_ADDRESS || "0x322813fd9a801c5507c9de605d63cea4f2ce6c44").toLowerCase(),
    fund: (process.env.NEXT_PUBLIC_POLYGON_FUND_ADDRESS || "0xa85233c63b9ee964add6f2cffe00fd84eb32338f").toLowerCase(),
  },
};

// Default network
export const DEFAULT_NETWORK = "31337"; // Hardhat

// Helper to get network config
export const getNetworkConfig = (chainId: string | number) => {
  const id = String(chainId);
  for (const [key, config] of Object.entries(NETWORKS)) {
    if (config.chainId === Number(chainId)) {
      return config;
    }
  }
  return NETWORKS.localhost; // Fallback
};

// Helper to get contract addresses (always lowercase)
export const getContractAddresses = (chainId: string | number) => {
  const id = String(chainId);
  const addresses = CONTRACT_ADDRESSES[id] || CONTRACT_ADDRESSES["31337"];
  return {
    registry: addresses.registry.toLowerCase(),
    fund: addresses.fund.toLowerCase(),
  };
};

// Helper to store addresses in localStorage (client-side only)
export const storeNetworkAddresses = (chainId: number, registryAddress: string, fundAddress: string) => {
  if (typeof window === "undefined") return; // Guard against SSR
  if (chainId === 31337) {
    localStorage.setItem("hardhat_registry_address", registryAddress);
    localStorage.setItem("hardhat_fund_address", fundAddress);
  }
};
