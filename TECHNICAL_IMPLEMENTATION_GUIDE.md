# 🛠️ Complete Technical Implementation Guide

## Part 1: Smart Contracts Deep Dive

### TempleRegistry.sol - Complete Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TempleRegistry {
    // State variables
    address public superAdmin;
    mapping(address => bool) private registeredTemples;
    address[] private templeList;

    // Events for audit trail
    event TempleRegistered(address indexed temple);
    event TempleRemoved(address indexed temple);
    event SuperAdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    // Access control modifier
    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Not super admin");
        _;
    }

    // Constructor - deploys with caller as superAdmin
    constructor() {
        superAdmin = msg.sender;
    }

    // REGISTER A TEMPLE
    // Only super admin can call
    // Checks if temple already registered
    function registerTemple(address _templeWallet) external onlySuperAdmin {
        require(_templeWallet != address(0), "Invalid address");
        require(!registeredTemples[_templeWallet], "Already registered");
        
        // Update mapping and array
        registeredTemples[_templeWallet] = true;
        templeList.push(_templeWallet);
        
        emit TempleRegistered(_templeWallet);
    }

    // REMOVE A TEMPLE
    // Only super admin can call
    // Efficiently removes from array by swapping with last element
    function removeTemple(address _templeWallet) external onlySuperAdmin {
        require(registeredTemples[_templeWallet], "Not registered");

        registeredTemples[_templeWallet] = false;

        // Find and remove from array
        for (uint i = 0; i < templeList.length; i++) {
            if (templeList[i] == _templeWallet) {
                // Swap with last element
                templeList[i] = templeList[templeList.length - 1];
                templeList.pop();
                break;
            }
        }

        emit TempleRemoved(_templeWallet);
    }

    // CHECK IF TEMPLE IS REGISTERED
    // Public view - doesn't consume gas
    // Used by TempleFund before accepting donations
    function isRegistered(address _templeWallet) public view returns (bool) {
        return registeredTemples[_templeWallet];
    }

    // GET ALL REGISTERED TEMPLES
    // Returns array of all temple addresses
    function getAllTemples() external view returns (address[] memory) {
        return templeList;
    }

    // TRANSFER SUPER ADMIN ROLE
    // Allows current super admin to hand over control
    function transferSuperAdmin(address newAdmin) external onlySuperAdmin {
        require(newAdmin != address(0), "Invalid address");
        address oldAdmin = superAdmin;
        superAdmin = newAdmin;
        emit SuperAdminTransferred(oldAdmin, newAdmin);
    }
}
```

### TempleFund.sol - Complete Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./TempleRegistry.sol";

// ERC20 interface for token support
interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TempleFund {
    // Reference to registry
    TempleRegistry public templeRegistry;

    // Mappings
    mapping(address => uint256) public ethFunds;           // temple → ETH balance
    mapping(address => mapping(address => uint256)) public tokenFunds; // token → temple → balance

    // Events
    event EthDonationReceived(address indexed donor, address indexed temple, uint256 amount);
    event TokenDonationReceived(address indexed donor, address indexed token, address indexed temple, uint256 amount);
    event EthFundsWithdrawn(address indexed temple, uint256 amount);
    event TokenFundsWithdrawn(address indexed token, address indexed temple, uint256 amount);

    // Constructor
    constructor(address _templeRegistry) {
        require(_templeRegistry != address(0), "Invalid registry address");
        templeRegistry = TempleRegistry(_templeRegistry);
    }

    // ==================== ETH/MATIC FLOW ====================

    // DONATE ETH TO TEMPLE
    // Anyone can call (payable)
    // Checks temple is registered
    // Updates balance mapping
    function donateEthToTemple(address temple) external payable {
        require(msg.value > 0, "Donation amount must be greater than zero");
        require(templeRegistry.isRegistered(temple), "Temple is not registered");

        ethFunds[temple] += msg.value;
        emit EthDonationReceived(msg.sender, temple, msg.value);
    }

    // WITHDRAW ETH FROM TEMPLE
    // Only registered temple can call (msg.sender must be registered)
    // Subtracts from balance and transfers to temple
    function withdrawEth(uint256 amount) external {
        require(templeRegistry.isRegistered(msg.sender), "Only registered temple can withdraw");
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(ethFunds[msg.sender] >= amount, "Insufficient ETH funds");

        // Update balance
        ethFunds[msg.sender] -= amount;
        
        // Transfer ETH
        payable(msg.sender).transfer(amount);

        emit EthFundsWithdrawn(msg.sender, amount);
    }

    // GET TEMPLE ETH BALANCE
    // Public view - check how much ETH a temple has
    function getTempleEthBalance(address temple) external view returns (uint256) {
        return ethFunds[temple];
    }

    // ==================== TOKEN FLOW ====================

    // DONATE ERC20 TOKEN TO TEMPLE
    // Requires prior approval from donor
    // Transfers token from donor to contract
    function donateTokenToTemple(address token, address temple, uint256 amount) external {
        require(amount > 0, "Donation amount must be greater than zero");
        require(templeRegistry.isRegistered(temple), "Temple is not registered");

        // Transfer token from donor to contract
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");

        // Update balance
        tokenFunds[token][temple] += amount;
        
        emit TokenDonationReceived(msg.sender, token, temple, amount);
    }

    // WITHDRAW TOKEN FUNDS
    // Only registered temple can withdraw
    // Transfers token to temple
    function withdrawTokenFunds(address token, uint256 amount) external {
        require(templeRegistry.isRegistered(msg.sender), "Only registered temple can withdraw");
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(tokenFunds[token][msg.sender] >= amount, "Insufficient token funds");

        // Update balance
        tokenFunds[token][msg.sender] -= amount;

        // Transfer token
        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Token transfer failed");

        emit TokenFundsWithdrawn(token, msg.sender, amount);
    }

    // GET TEMPLE TOKEN BALANCE
    // Query how much of a specific token a temple has
    function getTempleTokenBalance(address token, address temple) external view returns (uint256) {
        return tokenFunds[token][temple];
    }
}
```

---

## Part 2: Frontend Implementation Details

### MetaMask Hook with Error Handling

```typescript
// Frontend/app/hooks/useMetamask.ts

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

interface UseMetamaskReturn {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  error: string | null;
}

export function useMetamask(): UseMetamaskReturn {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect wallet with timeout protection
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Timeout for wallet connection
      const connectionPromise = window.ethereum!.request({
        method: "eth_requestAccounts",
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 30000)
      );

      const accounts = (await Promise.race([
        connectionPromise,
        timeoutPromise,
      ])) as string[];

      const ethProvider = new ethers.BrowserProvider(window.ethereum!);
      const network = await ethProvider.getNetwork();

      setProvider(ethProvider);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
    } catch (err: any) {
      if (err.code === 4001) {
        setError("User rejected the connection request");
      } else if (err.code === -32002) {
        setError("Connection request already pending");
      } else if (err.message === "Connection timeout") {
        setError("Connection request timed out");
      } else {
        setError(err.message || "Failed to connect wallet");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const autoConnect = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum!.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          const ethProvider = new ethers.BrowserProvider(window.ethereum!);
          
          // Fetch network with timeout
          try {
            const networkPromise = ethProvider.getNetwork();
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Network timeout")), 5000)
            );

            const network = await Promise.race([
              networkPromise,
              timeoutPromise,
            ]);

            setProvider(ethProvider);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
          } catch (networkError) {
            // RPC error - set defaults but don't block
            console.warn("RPC error, using defaults:", networkError);
            setProvider(ethProvider);
            setAccount(accounts[0]);
            setChainId(31337); // Hardhat default
          }
        }
      } catch (err) {
        console.warn("Auto-connect failed:", err);
      }
    };

    autoConnect();

    // Listen for account/chain changes
    window.ethereum?.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
      } else {
        setAccount(accounts[0]);
      }
    });

    window.ethereum?.on("chainChanged", () => {
      window.location.reload();
    });

    return () => {
      window.ethereum?.removeAllListeners();
    };
  }, []);

  return { account, provider, chainId, isConnecting, connectWallet, error };
}
```

### Withdrawal Page (Fixed Implementation)

```typescript
// Frontend/app/templeadmin/withdrawal/page.tsx

"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { TEMPLE_FUND_ABI, getTempleFundAddress } from "@/app/utils/TempleFund";
import { getTempleBlockchainAddress } from "@/app/utils/TempleBlockchainMap";
import { useMetamask } from "@/app/hooks/useMetamask";

export default function Withdrawal() {
  const { account, provider, chainId } = useMetamask();
  
  // State
  const [templeBlockchainAddress, setTempleBlockchainAddress] = useState<string | null>(null);
  const [maticBalance, setMaticBalance] = useState<string>("0");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [txLoading, setTxLoading] = useState(false);

  // Fetch temple admin info on mount
  useEffect(() => {
    const fetchTempleAdminInfo = async () => {
      try {
        const response = await fetch(
          "http://localhost:5500/api/v1/templeAdmin/get-current-Temple-Admin",
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          const admin = data.data;
          
          // Get blockchain address for this temple
          if (admin?.templeName) {
            const blockchainAddr = getTempleBlockchainAddress(admin.templeName);
            setTempleBlockchainAddress(blockchainAddr);
            console.log(`Temple: ${admin.templeName}, Address: ${blockchainAddr}`);
          }
        }
      } catch (error) {
        console.error("Error fetching temple admin info:", error);
      }
    };

    fetchTempleAdminInfo();
  }, []);

  // Fetch temple balance from blockchain
  const fetchTempleBalance = async (templeAddr: string) => {
    if (!provider || !ethers.isAddress(templeAddr)) {
      console.warn("Invalid temple address or provider");
      return;
    }

    try {
      const signer = await provider.getSigner();
      const templeFundAddress = getTempleFundAddress(chainId || 31337);
      
      const templeFund = new ethers.Contract(
        templeFundAddress,
        TEMPLE_FUND_ABI,
        signer
      );

      // Query blockchain for temple balance
      const balance = await templeFund.getTempleEthBalance(templeAddr);
      const formattedBalance = ethers.formatEther(balance);
      
      setMaticBalance(formattedBalance);
      console.log(`Temple balance: ${formattedBalance} ETH`);
    } catch (error: any) {
      console.warn("Failed to fetch balance:", error?.message);
      setMaticBalance("0");
    }
  };

  // Fetch balance when temple address changes
  useEffect(() => {
    if (templeBlockchainAddress && provider) {
      fetchTempleBalance(templeBlockchainAddress);
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchTempleBalance(templeBlockchainAddress);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [templeBlockchainAddress, provider]);

  // Withdraw ETH
  const withdrawEth = async () => {
    if (!provider || !templeBlockchainAddress) {
      toast.error("Wallet not connected");
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      toast.error("Enter valid amount");
      return;
    }

    try {
      setTxLoading(true);
      const signer = await provider.getSigner();
      const templeFundAddress = getTempleFundAddress(chainId || 31337);
      
      const templeFund = new ethers.Contract(
        templeFundAddress,
        TEMPLE_FUND_ABI,
        signer
      );

      // Call withdraw function
      const tx = await templeFund.withdrawEth(ethers.parseEther(amount));
      
      toast.info("Transaction submitted...");
      await tx.wait();
      
      toast.success("Withdrawal successful!");
      setAmount("");
      
      // Refresh balance
      fetchTempleBalance(templeBlockchainAddress);
    } catch (error: any) {
      toast.error(`Failed: ${error?.reason || error?.message}`);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Cryptocurrency Withdrawal</h1>
      
      {/* Balance Display */}
      <div className="bg-white rounded-2xl p-6 my-6">
        <h3 className="text-sm text-gray-500">Total Temple Balance</h3>
        <p className="text-2xl font-bold">{parseFloat(maticBalance).toFixed(4)} ETH</p>
      </div>

      {/* Withdrawal Form */}
      <div className="bg-white rounded-2xl p-6">
        <div className="mb-4">
          <label>Select Cryptocurrency</label>
          <select 
            value={selectedCrypto} 
            onChange={(e) => setSelectedCrypto(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Choose...</option>
            <option value="ethereum">Ethereum (ETH)</option>
            <option value="matic">Polygon (MATIC)</option>
          </select>
        </div>

        <div className="mb-4">
          <label>Amount to Withdraw</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-2 border rounded"
          />
        </div>

        <button 
          onClick={withdrawEth}
          disabled={!selectedCrypto || !amount || txLoading}
          className="w-full bg-orange-500 text-white p-2 rounded disabled:opacity-50"
        >
          {txLoading ? "Processing..." : "Withdraw"}
        </button>
      </div>
    </div>
  );
}
```

---

## Part 3: Backend API Implementation

### User Controller with JWT

```javascript
// Backend/src/controllers/user.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, templeName } = req.body;

  // Validate input
  if (!name || !email || !password || !phone) {
    return res.status(400).json(
      new ApiResponse(400, null, "All fields are required")
    );
  }

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    return res.status(409).json(
      new ApiResponse(409, null, "User already exists")
    );
  }

  // Create user
  const user = new User({
    name,
    email,
    password,
    phone,
    templeName,
    role: "user",
    loginType: "email",
    status: "active",
  });

  await user.save();

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save();

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    })
    .json(
      new ApiResponse(201, { accessToken, user }, "User registered successfully")
    );
});

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(
      new ApiResponse(400, null, "Email and password are required")
    );
  }

  // Find user and select password
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json(
      new ApiResponse(401, null, "Invalid credentials")
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json(
      new ApiResponse(401, null, "Invalid credentials")
    );
  }

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save();

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    })
    .json(
      new ApiResponse(200, { accessToken, user }, "Login successful")
    );
});

// GET CURRENT USER
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user, "User fetched successfully")
  );
});
```

### Temple Admin Controller

```javascript
// Backend/src/controllers/templeAdmin.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";

// STORE WALLET ADDRESS
const storeWalletAddress = asyncHandler(async (req, res) => {
  const { walletAddress } = req.body;
  const userId = req.user._id;

  // Validate wallet address format
  if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid wallet address format")
    );
  }

  // Update user wallet
  const user = await User.findByIdAndUpdate(
    userId,
    { walletAddress },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, user, "Wallet address stored successfully")
  );
});

// GET CURRENT TEMPLE ADMIN
const getCurrentTempleAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  return res.status(200).json(
    new ApiResponse(200, user, "Temple admin fetched successfully")
  );
});

// REGISTER TEMPLE ADMIN (by super admin)
const registerTempleAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone, templeName, templeLocation } = req.body;

  // Validation
  if (!name || !email || !password || !phone || !templeName) {
    return res.status(400).json(
      new ApiResponse(400, null, "All fields are required")
    );
  }

  // Check if exists
  const existingAdmin = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingAdmin) {
    return res.status(409).json(
      new ApiResponse(409, null, "Admin already exists")
    );
  }

  // Create admin
  const admin = new User({
    name,
    email,
    password,
    phone,
    role: "templeAdmin",
    templeName,
    templeLocation,
    loginType: "email",
    status: "active",
    createdBy: req.user._id,
  });

  await admin.save();

  // Remove password before sending
  admin.password = undefined;

  return res.status(201).json(
    new ApiResponse(201, admin, "Temple admin created successfully")
  );
});
```

---

## Part 4: Database Queries

### Efficient Indexes for Performance

```javascript
// MongoDB Indexes to add for performance

// Users Collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ templeName: 1 });

// Temples Collection
db.temples.createIndex({ slug: 1 }, { unique: true });
db.temples.createIndex({ "location.city": 1 });
db.temples.createIndex({ templeName: "text" }); // Full-text search

// Transactions Collection
db.transactions.createIndex({ donor: 1 });
db.transactions.createIndex({ temple: 1 });
db.transactions.createIndex({ transactionHash: 1 }, { unique: true });
db.transactions.createIndex({ status: 1 });
db.transactions.createIndex({ createdAt: -1 }); // For sorting by date
```

### Complex Queries

```javascript
// Get total donations by temple for month
db.transactions.aggregate([
  {
    $match: {
      temple: ObjectId("..."),
      createdAt: {
        $gte: new Date("2024-02-01"),
        $lte: new Date("2024-02-29")
      }
    }
  },
  {
    $group: {
      _id: "$temple",
      totalAmount: { $sum: "$amount" },
      transactionCount: { $sum: 1 }
    }
  }
]);

// Get top donors
db.transactions.aggregate([
  {
    $match: { type: "donation" }
  },
  {
    $group: {
      _id: "$donor",
      totalDonated: { $sum: "$amount" },
      donationCount: { $sum: 1 }
    }
  },
  {
    $sort: { totalDonated: -1 }
  },
  {
    $limit: 10
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "donorInfo"
    }
  }
]);
```

---

## Part 5: Deployment Configuration

### Environment Variables (Backend)

```bash
# .env file for Backend

# Server
PORT=5500
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017

# JWT
ACCESS_TOKEN_SECRET=your_secret_key_here_min_32_chars
REFRESH_TOKEN_SECRET=your_secret_key_here_min_32_chars

# Email (for OTP)
SMTP_SERVICE=gmail
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Blockchain
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_private_key_without_0x_prefix

# Cloudinary (for images)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Environment Variables (Frontend)

```bash
# .env.local file for Frontend

NEXT_PUBLIC_API_URL=http://localhost:5500
NEXT_PUBLIC_SOCKET_URL=http://localhost:5500
NEXT_PUBLIC_HARDHAT_REGISTRY=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_HARDHAT_FUND=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

---

## Part 6: Performance Metrics

### Load Testing Results (Expected)

```
Endpoint                           | Requests/sec | Response Time
-----------------------------------|--------------|---------------
GET /api/v1/templeDetails/         | 1000+        | < 100ms
POST /api/v1/users/register        | 100          | < 200ms
GET /api/v1/transactions/          | 500          | < 150ms
POST /api/v1/transactions/         | 100          | < 300ms

Database Query Performance:
- Find user by email:      < 5ms (indexed)
- Get user donations:      < 50ms (paginated)
- Get temple balance:      < 10ms (direct lookup)

Blockchain Performance:
- Temple registration:     2-3 blocks (~6-9 seconds)
- Donation confirmation:   1-2 blocks (~3-6 seconds)
- Balance query:          < 100ms (RPC call)
```

---

This comprehensive technical guide covers every aspect of the implementation!
