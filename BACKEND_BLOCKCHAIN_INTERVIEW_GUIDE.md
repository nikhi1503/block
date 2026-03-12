# Backend & Blockchain Interview Guide - DevTemple Project

## Table of Contents
1. [Backend Architecture](#backend-architecture)
2. [Blockchain & Smart Contracts](#blockchain--smart-contracts)
3. [DevTemple Specific Solutions](#devtemple-specific-solutions)
4. [Code Examples](#code-examples)
5. [Common Scenarios & Solutions](#common-scenarios--solutions)

---

## BACKEND ARCHITECTURE

### 1. API Endpoint Design: Create Donation

**Question:** "Design the API endpoint for creating a donation with comprehensive error handling"

**Answer:**
```
POST /api/v1/donations/create

Request Body:
{
  "userId": "uuid",
  "templeId": "uuid",
  "amount": "0.5",
  "cryptocurrency": "ETH",
  "purpose": "Temple Renovation",
  "walletAddress": "0x1234..."
}

Response (Success - 201):
{
  "success": true,
  "data": {
    "donationId": "uuid",
    "transactionHash": "0x1234...",
    "status": "pending",
    "timestamp": "2026-01-17T10:30:00Z",
    "confirmations": 0
  }
}

Response (Error - 400):
{
  "success": false,
  "error": "Invalid temple ID or insufficient balance",
  "code": "INVALID_INPUT"
}
```

**Error Handling:**
- Validate user exists and is verified
- Check if temple is registered and verified
- Verify donation amount > 0
- Check user wallet balance
- Rate limit validation (max 10 donations/hour)
- Log all attempts for audit trail

**Database Entry:**
```sql
INSERT INTO donations (id, user_id, temple_id, amount, crypto, status, created_at)
VALUES (uuid, userId, templeId, amount, 'ETH', 'pending', NOW());
```

---

### 2. Authentication & Authorization

**Question:** "How do you handle role-based access control?"

**Answer:**

**Three User Roles:**
1. **Regular User**: Can only view their own donations
2. **Temple Admin**: Can manage temple funds, withdrawals, expenses
3. **Super Admin**: Manages all temples, approvals, system-wide settings

**Implementation:**
```
Middleware: verifyRole(requiredRole) {
  - Extract JWT token from headers
  - Verify token signature
  - Check user role matches required role
  - Attach user to request object
  - If unauthorized, return 403 Forbidden
}

Protected Routes:
GET /api/v1/temples/:templeId/analytics -> requires TEMPLE_ADMIN
POST /api/v1/superadmin/approve-temple -> requires SUPER_ADMIN
GET /api/v1/users/donations -> requires USER
```

---

### 3. Database Schema Design

**Question:** "Design the schema for tracking donations and blockchain mappings"

**Answer:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  walletAddress VARCHAR(255) UNIQUE,
  role ENUM('user', 'temple_admin', 'superadmin'),
  verified BOOLEAN DEFAULT false,
  createdAt TIMESTAMP
);

CREATE TABLE temples (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  adminId UUID REFERENCES users(id),
  walletAddress VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  registeredOnChain BOOLEAN DEFAULT false,
  status ENUM('pending', 'approved', 'rejected'),
  createdAt TIMESTAMP
);

CREATE TABLE donations (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  templeId UUID REFERENCES temples(id),
  amount DECIMAL(18,8),
  cryptocurrency VARCHAR(10),
  status ENUM('pending', 'confirmed', 'failed'),
  purpose VARCHAR(255),
  createdAt TIMESTAMP,
  INDEX (userId),
  INDEX (templeId),
  INDEX (status)
);

CREATE TABLE blockchain_mappings (
  id UUID PRIMARY KEY,
  donationId UUID REFERENCES donations(id),
  txHash VARCHAR(255) UNIQUE,
  blockNumber INT,
  gasUsed INT,
  confirmations INT DEFAULT 0,
  confirmedAt TIMESTAMP,
  createdAt TIMESTAMP,
  INDEX (txHash),
  INDEX (blockNumber)
);

CREATE TABLE temple_withdrawals (
  id UUID PRIMARY KEY,
  templeId UUID REFERENCES temples(id),
  amount DECIMAL(18,8),
  status ENUM('pending', 'completed', 'failed'),
  txHash VARCHAR(255),
  requestedAt TIMESTAMP,
  completedAt TIMESTAMP,
  INDEX (templeId),
  INDEX (status)
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  templeId UUID REFERENCES temples(id),
  category VARCHAR(50),
  amount DECIMAL(18,8),
  description TEXT,
  date DATE,
  createdAt TIMESTAMP,
  INDEX (templeId),
  INDEX (date)
);
```

---

### 4. Handling Concurrent Donations

**Question:** "How do you handle race conditions when multiple donations arrive simultaneously?"

**Answer:**

**Problem:** Two donations from same user at exact same time could cause:
- Duplicate funds
- Negative balance
- Race condition in wallet balance check

**Solution:**

```
1. Database-Level Locking:
   - Use PESSIMISTIC_LOCK during transaction
   - Lock wallet balance row before checking
   - Release after transaction commits

2. Optimistic Locking:
   - Add version field to wallet_balances table
   - Check version hasn't changed during transaction
   - Retry if version mismatch

3. Message Queuing:
   - Send donation to Redis/RabbitMQ queue
   - Process donations sequentially per user
   - Prevents concurrent processing

4. Idempotency:
   - Donation ID should be unique per request
   - Duplicate request returns same response
   - Use idempotency keys: sha256(userId + timestamp + amount)
```

---

### 5. Performance Optimization

**Question:** "How do you optimize the query to show total donations by temple?"

**Answer:**

**Without Optimization (Slow):**
```sql
SELECT t.id, t.name, SUM(d.amount) as total
FROM temples t
LEFT JOIN donations d ON t.id = d.templeId
WHERE d.status = 'confirmed'
GROUP BY t.id;
-- Problem: Scans entire donations table, calculates sum every time
```

**With Optimization (Fast):**
```sql
-- 1. Add materialized view that updates every 5 minutes
CREATE MATERIALIZED VIEW temple_donation_totals AS
SELECT templeId, SUM(amount) as totalDonated, COUNT(*) as donationCount
FROM donations
WHERE status = 'confirmed'
GROUP BY templeId;

-- 2. Cache in Redis
REDIS_KEY: "temple:total_donations:{templeId}"
TTL: 5 minutes
Value: {"total": 50000, "count": 234}

-- 3. Denormalized column in temples table
ALTER TABLE temples ADD COLUMN totalDonations DECIMAL(18,8);
-- Update in background job after each confirmed donation

-- Query with indices
SELECT id, name, totalDonations
FROM temples
WHERE verified = true
ORDER BY totalDonations DESC
LIMIT 10;
```

---

## BLOCKCHAIN & SMART CONTRACTS

### 1. Smart Contract Design for Donations

**Question:** "How does the smart contract handle donations and ensure transparency?"

**Answer:**

```solidity
pragma solidity ^0.8.0;

contract TempleRegistry {
    // State variables
    mapping(address => Temple) public temples;
    mapping(address => Donation[]) public userDonations;
    
    struct Temple {
        address walletAddress;
        string name;
        bool verified;
        uint256 totalFundsReceived;
        uint256 totalDonors;
    }
    
    struct Donation {
        address donor;
        address temple;
        uint256 amount;
        uint256 timestamp;
        string purpose;
        bytes32 transactionHash;
    }
    
    event DonationReceived(
        address indexed donor,
        address indexed temple,
        uint256 amount,
        string purpose,
        uint256 timestamp
    );
    
    event TempleVerified(
        address indexed temple,
        string name
    );
    
    // Functions
    function donateTo(address _templeAddress, string memory _purpose) 
        public 
        payable 
        returns (bool) 
    {
        require(msg.value > 0, "Donation must be > 0");
        require(temples[_templeAddress].verified, "Temple not verified");
        
        // Update temple stats
        temples[_templeAddress].totalFundsReceived += msg.value;
        temples[_templeAddress].totalDonors++;
        
        // Record donation
        Donation memory donation = Donation(
            msg.sender,
            _templeAddress,
            msg.value,
            block.timestamp,
            _purpose,
            blockhash(block.number - 1)
        );
        
        userDonations[msg.sender].push(donation);
        
        // Emit event for transparency
        emit DonationReceived(msg.sender, _templeAddress, msg.value, _purpose, block.timestamp);
        
        // Transfer funds
        (bool success, ) = _templeAddress.call{value: msg.value}("");
        require(success, "Transfer failed");
        
        return true;
    }
    
    function verifyTemple(address _temple, string memory _name) 
        public 
        onlyOwner 
    {
        temples[_temple].walletAddress = _temple;
        temples[_temple].name = _name;
        temples[_temple].verified = true;
        
        emit TempleVerified(_temple, _name);
    }
}
```

---

### 2. Transaction Verification Flow

**Question:** "How do you handle blockchain transaction verification?"

**Answer:**

```
User initiates donation (Frontend)
    ↓
MetaMask signs transaction
    ↓
Transaction sent to blockchain
    ↓
Backend listens for event via Web3 EventListener
    ↓
Transaction has 1 confirmation
    ↓
Backend updates database: status = 'confirmed'
    ↓
Calculate confirmation count (aim for 12 confirmations)
    ↓
Final status: 'finalized' or 'confirmed'
    ↓
User notified via WebSocket

Database Workflow:
1. Donation created with status 'pending'
2. txHash received from blockchain
3. Store in blockchain_mappings table
4. Poll for confirmation count
5. Update donation status to 'confirmed' after 12 blocks
6. If transaction fails, update status to 'failed'
```

---

### 3. Gas Optimization

**Question:** "How do you optimize gas costs for temple withdrawals?"

**Answer:**

```solidity
// INEFFICIENT: Update state multiple times
function distributeToMultiTemples(address[] memory temples) public {
    for(uint i = 0; i < temples.length; i++) {
        temples[i].transfer(amount); // State change each time = high gas
    }
}

// OPTIMIZED: Batch operations
function batchDistribute(
    address[] memory temples,
    uint256[] memory amounts
) public {
    require(temples.length == amounts.length);
    
    uint256 totalAmount = 0;
    for(uint i = 0; i < amounts.length; i++) {
        totalAmount += amounts[i];
    }
    
    require(address(this).balance >= totalAmount);
    
    // Single loop for state updates
    for(uint i = 0; i < temples.length; i++) {
        (bool success, ) = temples[i].call{value: amounts[i]}("");
        require(success);
    }
}

// Cost Reduction:
// - Batch 10 withdrawals: ~30% gas reduction
// - Use call() instead of transfer(): ~5% reduction
// - Optimize storage reads/writes: ~10% reduction
```

---

### 4. Handling Failed Blockchain Transactions

**Question:** "How would you handle a donation recorded in the database but the blockchain transaction fails?"

**Answer:**

```
SCENARIO: User donates 0.5 ETH, database records it, but blockchain fails

SOLUTION:

1. Transaction Monitoring Phase (First 5 minutes):
   - Watch blockchain for transaction
   - If confirmed within 5 minutes → Success, update status to 'confirmed'
   - If still pending after 5 minutes → alert backend service

2. Retry Logic (5-30 minutes):
   - Check if transaction is in mempool
   - If found → wait longer (might be pending)
   - If not found → transaction was dropped
   - Send notification to user: "Donation processing is delayed"

3. Rollback Logic (After 30 minutes):
   - If transaction still not confirmed:
     a. Refund user in database (credit back to wallet balance)
     b. Send message: "Transaction failed, funds refunded"
     c. Ask user to retry
   - Update donation status to 'failed'
   - Emit event for audit trail

DATABASE IMPLEMENTATION:

CREATE TABLE failed_transactions (
  id UUID PRIMARY KEY,
  donationId UUID,
  originalTxHash VARCHAR(255),
  failureReason TEXT,
  retryCount INT,
  refundedAt TIMESTAMP,
  createdAt TIMESTAMP
);

Code Example:
function handleFailedDonation(donationId) {
  donation = getFromDB(donationId);
  
  if (donation.status == 'pending' && 
      donation.createdAt < NOW() - 30 minutes) {
    
    // Refund user
    user.balance += donation.amount;
    user.save();
    
    // Update donation
    donation.status = 'failed';
    donation.failureReason = 'Blockchain confirmation timeout';
    donation.save();
    
    // Log failed transaction
    FailedTransaction.create({
      donationId: donationId,
      refundedAt: NOW()
    });
    
    // Notify user
    sendEmail(user.email, "Donation Failed - Refunded");
  }
}
```

---

## DEVTEMPLE SPECIFIC SOLUTIONS

### 1. Complete Donation Flow (End-to-End)

```
STEP 1: User Initiates Donation (Frontend)
- Selects temple, amount, purpose
- Connects MetaMask wallet
- Frontend submits to backend API

STEP 2: Backend Validation (Backend)
POST /api/v1/donations/create
{
  userId, templeId, amount, purpose, walletAddress
}
Validation:
- User is verified
- Temple is verified
- Donation amount > 0
- User has sufficient balance

STEP 3: Smart Contract Execution (Frontend)
- User signs transaction in MetaMask
- Contract.donateTo(templeAddress, purpose) called
- Event emitted: DonationReceived

STEP 4: Blockchain Recording
- Transaction enters mempool
- Confirmed in ~15 seconds
- Event listener catches it
- Backend stores txHash in blockchain_mappings

STEP 5: Database Update (Backend)
donations table:
  status: pending → confirmed
blockchain_mappings table:
  txHash, blockNumber, confirmations

STEP 6: User Notification (Frontend)
- WebSocket updates receipt page
- Shows transaction hash
- Temple receives notification

STEP 7: Temple Admin View (Backend)
GET /api/v1/temples/{templeId}/donations
Response:
{
  "totalDonated": "₹50,00,000",
  "totalDonors": "1,234",
  "recentDonations": [
    {
      "donor": "Anonymous",
      "amount": "₹50,000",
      "purpose": "Temple Renovation",
      "date": "2026-01-17",
      "blockchainHash": "0x1234..."
    }
  ]
}
```

---

### 2. Temple Withdrawal Process

```
FLOW: Temple admin requests withdrawal

STEP 1: Admin submits withdrawal request
POST /api/v1/temples/{templeId}/withdrawals
{
  amount: 100000,
  bankAccount: "xxx"
}

STEP 2: Verification checks
- Only temple admin or super admin can request
- Withdrawal amount <= available balance
- Temple wallet address verified
- Transaction not already in progress

STEP 3: Smart Contract Execution
contract.withdrawalTemple(templeAddress, amount)
- Requires super admin signature (multi-sig)
- Transfers amount to temple wallet
- Emits WithdrawalInitiated event

STEP 4: Database records
temple_withdrawals table:
status: pending → completed
txHash: blockchain transaction hash

STEP 5: Notifications
- Temple admin receives confirmation
- Super admin gets audit log
- Blockchain immutably records withdrawal

DATABASE DESIGN:
CREATE TABLE temple_withdrawals (
  id UUID,
  templeId UUID,
  amount DECIMAL,
  bankAccount VARCHAR,
  requestedBy UUID,
  status ENUM('pending','approved','completed','rejected'),
  txHash VARCHAR,
  approvalCount INT,
  requiredApprovals INT = 2,
  createdAt TIMESTAMP,
  completedAt TIMESTAMP
);
```

---

### 3. Real-time Donation Stats Dashboard

**Question:** "How do you show live donation statistics?"

**Answer:**

```
ARCHITECTURE:

1. Cache Layer (Redis):
- temple:{templeId}:totalDonations (updated every donation)
- temple:{templeId}:recentDonors (last 10 donors)
- global:allTemples:totalFunds (sum of all temples)
- Cache TTL: 1 minute

2. WebSocket Connection:
- User connects to `/socket/temple/{templeId}`
- Backend listens to blockchain events
- On new donation event:
  - Update cache
  - Broadcast to connected users
  - Update dashboard in real-time

3. Polling Fallback:
- If WebSocket unavailable
- Frontend polls GET /api/v1/temples/{templeId}/stats
- Every 5 seconds

CODE EXAMPLE:

// WebSocket Handler
io.on('connection', (socket) => {
  socket.on('join_temple', (templeId) => {
    socket.join(`temple_${templeId}`);
    
    // Send current stats
    const stats = redis.get(`temple:${templeId}:stats`);
    socket.emit('initial_stats', stats);
  });
});

// Blockchain event listener
contract.on('DonationReceived', (donor, temple, amount) => {
  // Update database
  donations.create({...});
  
  // Update cache
  redis.incrby(`temple:${temple}:totalDonations`, amount);
  
  // Broadcast to users
  io.to(`temple_${temple}`).emit('new_donation', {
    donor: maskAddress(donor),
    amount: amount,
    timestamp: Date.now()
  });
});
```

---

### 4. Data Consistency Between Database and Blockchain

**Question:** "How do you ensure consistency between off-chain database and on-chain blockchain?"

**Answer:**

```
APPROACH 1: Event-driven (Recommended)

1. Smart contract emits events
2. Backend service listens to events
3. Updates database accordingly
4. Database is source of truth
5. Blockchain is immutable audit log

Example:
contract event: DonationReceived(donor, temple, amount)
  ↓
Event listener receives it
  ↓
Backend updates: INSERT INTO donations
  ↓
If insert fails → log critical error and alert
  ↓
Database and blockchain are in sync

APPROACH 2: Periodic Reconciliation

function reconcileBlockchainData(){
  // Every hour, check if database matches blockchain
  
  for each temple:
    blockchainTotal = contract.getTotalDonations(temple)
    databaseTotal = db.sum(donations.amount where status='confirmed')
    
    if (blockchainTotal != databaseTotal) {
      // Investigate discrepancy
      log critical error
      alert admin
      // Don't auto-fix, requires manual intervention
    }
}

APPROACH 3: Idempotency + Retry Logic

// Make all operations idempotent
function recordDonation(donationId, txHash, amount) {
  // Check if already recorded
  existing = db.findByTxHash(txHash);
  
  if (existing) {
    return existing; // Idempotent - return same result
  }
  
  // Record new donation
  donation = db.create({
    externalId: txHash,
    amount: amount,
    status: 'confirmed'
  });
  
  return donation;
}

// Benefits:
// - Duplicate event from blockchain handled gracefully
// - Retry failed operations safely
// - No duplicate charges
```

---

## CODE EXAMPLES

### Complete Donation API Endpoint

```javascript
// routes/donations.js
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { templeId, amount, purpose, walletAddress } = req.body;
    const userId = req.user.id;
    
    // 1. Validation
    if (!templeId || amount <= 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    
    // 2. Check user balance
    const user = await User.findById(userId);
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // 3. Check temple is verified
    const temple = await Temple.findById(templeId);
    if (!temple || !temple.verified) {
      return res.status(400).json({ error: 'Temple not verified' });
    }
    
    // 4. Create donation record in database
    const donation = await Donation.create({
      userId,
      templeId,
      amount,
      purpose,
      status: 'pending',
      createdAt: new Date()
    });
    
    // 5. Prepare smart contract call data
    const contractCall = {
      to: CONTRACT_ADDRESS,
      data: contract.interface.encodeFunctionData('donateTo', [
        temple.walletAddress,
        purpose
      ]),
      value: web3.utils.toWei(amount.toString(), 'ether')
    };
    
    // 6. Return transaction data for frontend to sign
    return res.status(201).json({
      success: true,
      data: {
        donationId: donation.id,
        contractCall: contractCall,
        message: 'Sign transaction in MetaMask'
      }
    });
    
  } catch (err) {
    logger.error('Donation error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update donation status after blockchain confirmation
router.post('/confirm', async (req, res) => {
  const { donationId, txHash, blockNumber } = req.body;
  
  try {
    // Store blockchain mapping
    await BlockchainMapping.create({
      donationId,
      txHash,
      blockNumber,
      confirmations: 1
    });
    
    // Update donation status
    await Donation.findByIdAndUpdate(donationId, {
      status: 'confirmed'
    });
    
    // Broadcast via WebSocket
    io.emit('donation_confirmed', {
      donationId,
      txHash
    });
    
    return res.json({ success: true });
    
  } catch (err) {
    logger.error('Confirm donation error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
```

---

### Smart Contract Donation Function

```solidity
// TempleRegistry.sol
pragma solidity ^0.8.0;

contract TempleRegistry {
    // Events - for transparency and backend listeners
    event DonationReceived(
        address indexed donor,
        address indexed temple,
        uint256 amount,
        string indexed purpose,
        uint256 timestamp
    );
    
    event TempleVerified(
        address temple,
        string name
    );
    
    // Mappings
    mapping(address => Temple) public temples;
    mapping(address => uint256) public templeBalance;
    mapping(address => Donation[]) public userDonations;
    
    struct Temple {
        address templeAddress;
        string name;
        bool verified;
        uint256 totalFunds;
        uint256 donorCount;
        uint256 registeredAt;
    }
    
    struct Donation {
        address donor;
        address temple;
        uint256 amount;
        uint256 timestamp;
        string purpose;
    }
    
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyVerifiedTemple(address _temple) {
        require(temples[_temple].verified, "Temple not verified");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // Register temple (SuperAdmin calls this)
    function registerTemple(
        address _templeAddr,
        string memory _name
    ) public onlyOwner {
        temples[_templeAddr] = Temple(
            _templeAddr,
            _name,
            true,
            0,
            0,
            block.timestamp
        );
        emit TempleVerified(_templeAddr, _name);
    }
    
    // Main donation function
    function donateTo(
        address _templeAddress,
        string memory _purpose
    ) public payable onlyVerifiedTemple(_templeAddress) returns (bool) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_templeAddress != address(0), "Invalid temple address");
        
        // Update temple stats
        temples[_templeAddress].totalFunds += msg.value;
        temples[_templeAddress].donorCount++;
        templeBalance[_templeAddress] += msg.value;
        
        // Record donation
        userDonations[msg.sender].push(Donation(
            msg.sender,
            _templeAddress,
            msg.value,
            block.timestamp,
            _purpose
        ));
        
        // Emit event (backend listens to this)
        emit DonationReceived(
            msg.sender,
            _templeAddress,
            msg.value,
            _purpose,
            block.timestamp
        );
        
        return true;
    }
    
    // Withdraw temple funds (requires multi-sig approval)
    function withdrawTemple(
        address _templeAddress,
        uint256 _amount
    ) public onlyOwner {
        require(_amount <= templeBalance[_templeAddress], "Insufficient balance");
        
        templeBalance[_templeAddress] -= _amount;
        
        (bool success, ) = _templeAddress.call{value: _amount}("");
        require(success, "Withdrawal failed");
    }
    
    // Get temple stats
    function getTempleStats(address _temple) 
        public 
        view 
        returns (uint256 totalFunds, uint256 donorCount) 
    {
        return (temples[_temple].totalFunds, temples[_temple].donorCount);
    }
}
```

---

## COMMON SCENARIOS & SOLUTIONS

### Scenario 1: Blockchain Transaction Takes Too Long

**Problem:** User's donation pending for 2+ minutes

**Solution:**
```javascript
// Check transaction status
async function checkTransactionStatus(txHash) {
  const receipt = await web3.eth.getTransactionReceipt(txHash);
  
  if (receipt === null) {
    // Transaction still in mempool
    const tx = await web3.eth.getTransaction(txHash);
    
    if (tx === null) {
      // Transaction dropped from mempool
      return 'dropped';
    }
    
    // Still pending
    const gasPrice = await web3.eth.getGasPrice();
    const agePriceRatio = currentGasPrice / tx.gasPrice;
    
    if (agePriceRatio > 1.5) {
      // Network gas price increased significantly
      // User might need to increase gas price
      return 'stuck_underpriced';
    }
    
    return 'pending';
  }
  
  // Transaction mined
  if (receipt.status === 1) {
    return 'confirmed';
  } else {
    return 'failed';
  }
}
```

---

### Scenario 2: Duplicate Donation Detection

**Problem:** User clicks donate twice accidentally

**Solution:**
```javascript
// Idempotency key approach
const crypto = require('crypto');

function generateIdempotencyKey(userId, templeId, amount) {
  return crypto
    .createHash('sha256')
    .update(`${userId}${templeId}${amount}${Date.now()}`)
    .digest('hex');
}

// Save idempotency key
router.post('/create', authenticateToken, async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // Check if request already processed
  const existing = await IdempotencyKeyMap.findOne({ key: idempotencyKey });
  if (existing) {
    return res.json(existing.response);
  }
  
  // Process donation
  const response = await processDonation(req.body);
  
  // Store for future duplicate requests
  await IdempotencyKeyMap.create({
    key: idempotencyKey,
    response: response,
    expiresAt: Date.now() + 3600000 // 1 hour
  });
  
  return res.json(response);
});
```

---

### Scenario 3: Rate Limiting for Donations

**Problem:** Prevent spam/abuse donations

**Solution:**
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient();

const donationLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'donation_rl:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 donations per user per hour
  message: 'Too many donations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/create', authenticateToken, donationLimiter, async (req, res) => {
  // Process donation
});
```

---

### Scenario 4: Handling Whale Donations

**Problem:** Very large donations might impact system

**Solution:**
```javascript
const LARGE_DONATION_THRESHOLD = 1000; // $1000+

async function processDonation(donation) {
  if (donation.amount > LARGE_DONATION_THRESHOLD) {
    // Require additional verification
    const verificationCode = generateCode();
    
    await Donation.create({
      ...donation,
      status: 'pending_verification',
      verificationCode
    });
    
    // Send email to user
    sendEmail(user.email, `Verify large donation: ${verificationCode}`);
    
    return { message: 'Check your email for verification code' };
  }
  
  // Standard donation flow
  return await standardDonationFlow(donation);
}
```

---

### Scenario 5: Temple Goes Offline (Cannot Receive Funds)

**Problem:** Temple admin's wallet not responding

**Solution:**
```solidity
// Multi-sig wallet implementation
pragma solidity ^0.8.0;

contract MultiSigTempleWallet {
    address[] public owners;
    uint public requiredApprovals;
    
    mapping(uint => Withdrawal) public withdrawals;
    mapping(uint => mapping(address => bool)) public approvals;
    
    struct Withdrawal {
        address templeAddress;
        uint amount;
        uint approvalCount;
        bool executed;
    }
    
    function requestDonationDispatch(
        address _temple,
        uint _amount
    ) public returns (uint withdrawalId) {
        withdrawalId = withdrawalCount++;
        
        withdrawals[withdrawalId] = Withdrawal(
            _temple,
            _amount,
            0,
            false
        );
        
        // If temple wallet shows zero activity, flag it
        if (block.number - lastActivityBlock[_temple] > INACTIVITY_THRESHOLD) {
            withdrawals[withdrawalId].flagged = true;
            notifySuperAdmin(_temple);
        }
    }
}
```

---

## Key Takeaways for Interview

1. **Database is source of truth** - Blockchain is immutable audit log
2. **Always validate inputs** - On both frontend and backend
3. **Handle failures gracefully** - Have rollback/retry mechanisms
4. **Monitor blockchain events** - Keep systems in sync
5. **Use pagination & caching** - For scalability
6. **Idempotency is key** - Prevent duplicate operations
7. **Security first** - Role-based access, rate limiting, audit logs
8. **Real-time updates** - WebSockets for live dashboards
9. **Optimize gas costs** - Batch operations, efficient contracts
10. **Test edge cases** - Large amounts, network failures, race conditions

---

## Questions to Ask in Your Interview

1. "What blockchain network are you using and why?"
2. "How many TPS (transactions per second) do you expect?"
3. "What's your disaster recovery plan?"
4. "How do you handle regulatory compliance?"
5. "What's your strategy for smart contract audits?"
6. "How do you manage private keys for super admin?"
7. "What happens if a temple withdrawal fails mid-way?"
8. "How do you prevent front-running attacks?"
9. "What's your monitoring and alerting system?"
10. "How do you handle hard forks or blockchain transitions?"

