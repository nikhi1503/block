#!/usr/bin/env node
import fetch from 'node-fetch';

/**
 * Deploy contracts to a running Hardhat node via direct JSON-RPC calls
 */

const RPC_URL = 'http://127.0.0.1:8545';

// Simple JSON-RPC caller
async function rpcCall(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function main() {
  console.log('🚀 Getting accounts from running Hardhat node...');
  
  const accounts = await rpcCall('eth_accounts');
  const chainId = await rpcCall('eth_chainId');
  
  console.log('Deployer:', accounts[0]);
  console.log('Chain ID:', chainId);
  console.log('\n✅ Hardhat node is running and responsive!');
  console.log('\nNow run: npx hardhat run deploy-fresh-hardhat.js --network localhost');
}

main().catch(e => {
  console.error('❌ Cannot connect to Hardhat node:', e.message);
  console.log('\nMake sure Hardhat node is running: npx hardhat node');
  process.exit(1);
});
