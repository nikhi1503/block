# 📚 Quick Reference Guide - Temple Fund Management System

## 🚀 Quick Start Commands

```bash
# Backend Setup
cd Backend
npm install
npm run dev

# Hardhat Node (new terminal)
cd Backend
npx hardhat node

# Smart Contract Deployment (another terminal)
cd Backend
npx hardhat run scripts/deploy.js --network localhost

# Register Temples
cd Backend
npx hardhat run register-temples-hardhat.js --network localhost

# Frontend Setup (another terminal)
cd Frontend
npm install
npm run dev

# Access Application
Frontend:    http://localhost:3000
Backend:     http://localhost:5500
Blockchain:  http://localhost:8545
```

---

## 👥 User Roles & Access

### Regular User
```
Login:      shiva@temple.com / Admin@123456
Can:        Donate to temples, view balance, get receipts
Cannot:     Withdraw funds, create temples
```

### Temple Admin
```
Login:      shiva@temple.com / Admin@123456
Can:        View donations, withdraw funds, generate reports
Cannot:     Register new temples, manage other admins
```

### Super Admin
```
Can:        Register temples, create admins, manage system
Cannot:     Directly donate or withdraw funds
```

---

## 🏛️ Temple Blockchain Addresses

| Temple Name | Blockchain Address |
|-------------|-------------------|
| Shiva Mandir | `0x1234567890123456789012345678901234567890` |
| Vishnu Temple | `0x2234567890123456789012345678901234567891` |
| Krishna Mandir | `0x3234567890123456789012345678901234567892` |

---

## 📡 Key API Endpoints

### Authentication
```
POST   /api/v1/users/register          Register new user
POST   /api/v1/users/login             Login user
POST   /api/v1/users/refresh-Token     Refresh JWT token
POST   /api/v1/users/logout            Logout
```

### Donations
```
GET    /api/v1/templeDetails/          Get all temples
POST   /api/v1/transactions/           Record donation
GET    /api/v1/transactions/temple/id  Temple donations
```

### Temple Admin
```
GET    /api/v1/templeAdmin/get-current-Temple-Admin   Current admin info
POST   /api/v1/templeAdmin/store-wallet-address       Store wallet
GET    /api/v1/templeAdmin/change-password            Change password
```

---

## 🔗 Smart Contract Functions

### TempleRegistry.sol
```solidity
registerTemple(address _templeWallet)           // Register temple
isRegistered(address _templeWallet) → bool      // Check if registered
getAllTemples() → address[]                      // Get all temples
removeTemple(address _templeWallet)             // Remove temple
```

### TempleFund.sol
```solidity
donateEthToTemple(address temple) payable       // Donate ETH
withdrawEth(uint256 amount)                     // Withdraw ETH
getTempleEthBalance(address temple) → uint256   // Get balance
donateTokenToTemple(token, temple, amount)      // Donate ERC20
```

---

## 🎨 Frontend Page Routes

```
/                                   Landing page with temples
/user/donate                        Donate to temple
/user/dashboard                     User donation history
/templeadmin/dashboard              Temple admin dashboard
/templeadmin/withdrawal             Withdraw donations
/templeadmin/reports                Generate reports
/superadmin/dashboard               System dashboard
/login                              Login page
/signup                             Registration page
```

---

## 📊 Database Collections

### users
```javascript
{
  name, email, password, phone,
  role, templeName, templeLocation,
  walletAddress, status, loginType
}
```

### templeDetails
```javascript
{
  templeName, slug, coverImage,
  location: {address, city, state},
  description, history, darshanTimings,
  contactDetails, photoGallery,
  isVerified, registeredBy
}
```

### transactions
```javascript
{
  transactionHash, donor, temple,
  amount, currency, type, status,
  gasUsed, blockNumber
}
```

---

## 🔐 JWT Token Structure

```javascript
Access Token:
  {
    _id: "user_id",
    email: "user@example.com",
    role: "templeAdmin",
    iat: 1234567890,
    exp: 1234571490  // 1 hour
  }

Refresh Token (in HttpOnly cookie):
  Valid for 7 days
  Use to get new access token
```

---

## 🚨 Common Issues & Fixes

### "Failed to fetch ETH balance"
```
✅ FIXED: Now uses correct blockchain address mapping
   - fetch temple admin info
   - Get correct blockchain address
   - Query with temple address (not user wallet)
```

### MetaMask Connection Timeout
```
✅ FIXED: Added 30-second timeout protection
   - Graceful error handling
   - Fallback to chainId 31337
   - Won't block wallet connection
```

### Hardhat Node Not Running
```
Solution:
  npx hardhat node
  
Check if running:
  curl http://localhost:8545
```

### Temples Not Registered
```
Solution:
  npx hardhat run register-temples-hardhat.js --network localhost
  
Verify:
  curl -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'
```

---

## 📈 Performance Tips

### Frontend
- Images are cached in browser
- API responses are paginated
- Lazy loading for components

### Backend
- Database indexes on email, phone, temple
- JWT caching to reduce verification
- Connection pooling

### Blockchain
- Only critical data stored on-chain
- Most data in database
- RPC has fallback endpoints

---

## 🔒 Security Checklist

- ✅ Passwords hashed with bcryptjs
- ✅ JWT tokens with 1-hour expiry
- ✅ Refresh tokens in HttpOnly cookies
- ✅ Role-based access control
- ✅ Input validation on all endpoints
- ✅ No private keys in code
- ✅ Environment variables for secrets
- ✅ CORS properly configured

---

## 💾 Database Backup Commands

```bash
# Backup MongoDB
mongodump --db Temple-Fund-Management --out ./backup

# Restore MongoDB
mongorestore --db Temple-Fund-Management ./backup/Temple-Fund-Management

# Check database size
mongo Temple-Fund-Management --eval "db.stats()"
```

---

## 🧪 Testing Commands

### Backend Testing
```bash
# Test user registration
curl -X POST http://localhost:5500/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@123456",
    "phone": "9999999999"
  }'

# Test temple donation (requires token)
curl -X GET http://localhost:5500/api/v1/templeDetails/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Blockchain Testing
```bash
# Test donation script
cd Backend && npx hardhat run test-donation-to-blockchain.js --network localhost

# Check balance
cd Backend && npx hardhat run scripts/getTempleEthBalance.js --network localhost
```

---

## 📊 Current Contract Deployment Status

```
Network:              Hardhat Local (chainId: 31337)
Status:               ✅ DEPLOYED & RUNNING

TempleRegistry:       0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
TempleFund:           0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

Temples Registered:   ✅ 3 (All working)
  • Shiva Mandir      ✅ Registered
  • Vishnu Temple     ✅ Registered
  • Krishna Mandir    ✅ Registered

Test Donation:        ✅ 0.1 ETH confirmed
Balance Query:        ✅ Returns correct balance
Withdrawal:           ✅ Ready to test
```

---

## 🎯 Development Workflow

### Adding a New Feature

1. **Create Branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Backend Change**
   - Modify controller/model
   - Update routes if needed
   - Test with API calls

3. **Frontend Change**
   - Update page/component
   - Test with browser
   - Check console for errors

4. **Blockchain Change (if needed)**
   - Modify smart contract
   - Redeploy to local node
   - Update contract addresses

5. **Test Everything**
   - Backend: API endpoints
   - Frontend: UI/UX
   - Blockchain: Contract calls
   - Database: Data integrity

6. **Commit and Push**
   ```bash
   git add .
   git commit -m "Feature: description"
   git push origin feature/new-feature-name
   ```

---

## 📞 Support & Debugging

### Enable Debug Mode
```javascript
// Add to browser console
localStorage.debug = '*'

// For specific service
localStorage.debug = 'templeService:*'
```

### Check Logs
```bash
# Backend logs
npm run dev

# Hardhat logs
npx hardhat node

# Frontend logs
Browser console (F12)
```

### Monitor Blockchain
```bash
# Watch blockchain activity
curl http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'
```

---

## 🚀 Scaling for Production

### Backend Scaling
```
1. Use Node.js clustering for multiple cores
2. Implement Redis caching layer
3. Use load balancer (Nginx/HAProxy)
4. Database replication for HA
```

### Frontend Scaling
```
1. Deploy to CDN (Vercel/Netlify)
2. Enable image optimization
3. Implement lazy loading
4. Use service workers for caching
```

### Blockchain Scaling
```
1. Use Polygon L2 (lower gas costs)
2. Implement batch transactions
3. Cache RPC calls
4. Monitor gas prices
```

---

## 📚 Additional Resources

- [Solidity Docs](https://docs.soliditylang.org/)
- [Ethers.js Docs](https://docs.ethers.org/)
- [Hardhat Docs](https://hardhat.org/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Polygon Docs](https://polygon.technology/developers)

---

**Last Updated: February 4, 2026** ✅
