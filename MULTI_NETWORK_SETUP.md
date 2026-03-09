# Multi-Network Setup Guide

## Supported Networks

1. **Hardhat Localhost** (Chain ID: 31337)
   - Local testing, instant transactions, unlimited ETH
   - RPC: http://localhost:8545
   - Use for development

2. **Polygon Amoy Testnet** (Chain ID: 80002)
   - Actual testnet, requires test MATIC
   - RPC: https://rpc-amoy.polygon.technology
   - Use for production testing

3. **Polygon Mainnet** (Chain ID: 137)
   - Live network with real MATIC
   - RPC: https://polygon-rpc.com
   - Use for production

## Local Hardhat Setup

### Start Hardhat Node
```bash
cd Backend
npx hardhat node --config hardhat.config.cjs
```

### Deploy Contracts
```bash
# In another terminal
cd Backend
npx hardhat run deploy-multi-network.js --network localhost
```

### MetaMask Configuration
1. Open MetaMask
2. Add Network:
   - Network Name: Hardhat Local
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency: ETH
3. Import test account:
   - Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad716fa3efa6dd9e2a4357b
4. You'll have 10000 ETH for testing

## Polygon Amoy Setup

### Prerequisites
1. Private key in Backend/.env:
   ```
   PRIVATE_KEY=your_private_key
   AMOY_RPC_URL=https://rpc-amoy.polygon.technology
   ```

2. Fund your wallet with test MATIC:
   - Get MATIC from: https://faucet.polygon.technology/

### Deploy to Amoy
```bash
cd Backend
npx hardhat run deploy-multi-network.js --network amoy
```

### Update Frontend Addresses
After deployment, update `Frontend/.env.local`:
```
NEXT_PUBLIC_AMOY_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_AMOY_FUND_ADDRESS=0x...
```

## Frontend Network Switching

The donation page now has a **Network Selector** button at the top that allows you to:
- Switch between Hardhat, Amoy, and Polygon Mainnet
- Automatically prompt MetaMask to add missing networks
- Display contract addresses for the current network

### How to Use
1. Open donation page: http://localhost:3000/user/donate
2. Click network button (🔧 Hardhat Local, 🌐 Polygon Amoy, etc.)
3. Confirm network switch in MetaMask
4. Donations will use the selected network's contracts

## Troubleshooting

### "Temple not registered" error
- Ensure you're on the correct network where temples are registered
- Redeploy contracts if network was restarted

### MetaMask connection issues
- Hardhat: Manually add network to MetaMask (can't be auto-added)
- Polygon: Should auto-add if not present

### Wrong contract addresses
- Check `.env.local` has correct addresses for current network
- After deployment, save addresses from output

## Environment Variables

Frontend `.env.local` variables:
```
# Hardhat (Chain 31337)
NEXT_PUBLIC_HARDHAT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_HARDHAT_FUND_ADDRESS=0x...

# Polygon Amoy (Chain 80002)
NEXT_PUBLIC_AMOY_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_AMOY_FUND_ADDRESS=0x...

# Polygon Mainnet (Chain 137)
NEXT_PUBLIC_POLYGON_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_POLYGON_FUND_ADDRESS=0x...

# Default network
NEXT_PUBLIC_DEFAULT_CHAIN_ID=31337
```

Backend `.env` variables:
```
PRIVATE_KEY=your_deployer_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=your_etherscan_key
```
