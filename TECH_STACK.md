# 🛠️ Tech Stack - Decentralized Secure Transaction System using Blockchain for Temple Fund Management

## 📋 Table of Contents
1. [Frontend Stack](#frontend-stack)
2. [Backend Stack](#backend-stack)
3. [Database Stack](#database-stack)
4. [Blockchain Stack](#blockchain-stack)
5. [Authentication & Security](#authentication--security)
6. [External APIs](#external-apis)
7. [Development Tools](#development-tools)
8. [Architecture Overview](#architecture-overview)

---

## 🎨 Frontend Stack

### Core Framework
- **Next.js 14+** - React framework for production
- **React** - UI library
- **TypeScript** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless component library
- **Framer Motion** - Animation library
- **Lucide Icons** - Icon library

### State Management & Data Fetching
- **React Hooks** - Built-in state management
- **Fetch API** - HTTP requests
- **Socket.io** - Real-time WebSocket communication

### Form & Validation
- **React Hook Form** - Efficient form handling
- **Custom Validation** - Input validation logic

### Notifications & Toast
- **React Toastify** - Toast notifications
- **Custom Toast Components** - Styled notifications

### Date & Time
- **Date Utilities** - Native JavaScript Date API

### Supported Pages
- `/` - Landing page
- `/signup` - User registration (4-step process)
- `/login` - User login
- `/templelogin` - Temple admin login
- `/superadminlogin` - Super admin login
- `/user/dashboard` - User dashboard
- `/user/donate` - Donation form
- `/user/receipt` - Donation receipt
- `/templeadmin/dashboard` - Temple admin dashboard
- `/templeadmin/donations` - Donation history
- `/templeadmin/withdrawal` - Fund withdrawal
- `/templeadmin/reports` - Financial reports
- `/superadmin/dashboard` - Super admin dashboard

---

## 🔧 Backend Stack

### Runtime & Framework
- **Node.js** (v18+) - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript/JavaScript** - Programming languages

### Server Configuration
- **API Port**: 5500
- **WebSocket Port**: 5050
- **CORS**: Enabled for `http://localhost:3000`

### Core Modules
- **async-handler** - Async error handling
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing
- **socket.io** - Real-time communication

### API Endpoints Structure
```
/api/v1/
├── users/
│   ├── register
│   ├── login
│   ├── logout
│   ├── verify-email
│   ├── refresh-Token
│   └── store-wallet-address
├── templeAdmin/
│   ├── register-Temple-Admin
│   ├── login-Temple-Admin
│   ├── logout-Temple-Admin
│   ├── refresh-token
│   ├── change-password
│   ├── get-current-Temple-Admin
│   ├── get-all-Temple-Admins
│   ├── get-active-Temple-Admins
│   └── for-donation-active-temple
├── superAdmin/
│   ├── register
│   ├── login
│   ├── logout
│   └── manage-temples
├── transactions/
│   ├── donate-to-temple
│   ├── get-donation-history
│   └── get-transaction-details
└── carousel/
    └── crypto-prices
```

---

## 🗄️ Database Stack

### MongoDB
- **Database Name**: `Temple-Fund-Management`
- **Connection URL**: `mongodb://localhost:27017`
- **Version**: Latest stable

### ODM (Object Data Modeling)
- **Mongoose v7+** - Schema validation and modeling

### Collections
1. **users** - User accounts with roles (user, templeAdmin, superAdmin)
2. **transactions** - Donation records
3. **templedetails** - Temple information
4. **templeadmins** - Temple admin accounts
5. **reviews** - User reviews and ratings
6. **carousel** - Carousel content

### Database Indexes
- Email (unique)
- Phone number (unique)
- Wallet Address (indexed)
- Transaction Hash (unique)

---

## ⛓️ Blockchain Stack

### Smart Contract Development
- **Solidity** - Smart contract language
  - Version: `^0.8.20`, `^0.8.26`
- **Hardhat** - Development framework
- **ethers.js** - Blockchain interaction library

### Supported Networks
| Network | Chain ID | Type | Purpose |
|---------|----------|------|---------|
| **Hardhat Local** | 31337 | Local | Development & Testing |
| **Polygon Amoy** | 80002 | Testnet | Testing on Polygon |
| **Polygon Mainnet** | 137 | Mainnet | Production |

### Smart Contracts
1. **TemplateFund.sol**
   - Functions: `donateEthToTemple()`, `withdrawEth()`, `getTempleEthBalance()`
   - Handles ETH/MATIC donations and withdrawals

2. **TempleRegistry.sol**
   - Functions: `registerTemple()`, `removeTemple()`, `isRegistered()`
   - Manages temple registration

### Wallet Integration
- **MetaMask** - Wallet browser extension
- **ethers.js** - Web3 library for contract interaction

### Blockchain Libraries
```javascript
import { ethers } from 'ethers';
import { TEMPLE_FUND_ABI, TEMPLE_FUND_ADDRESS } from '@/app/utils/TempleFund';
```

---

## 🔐 Authentication & Security

### JWT (JSON Web Tokens)
- **Access Token**: Stored in `sessionStorage`
  - Expiry: 15 minutes (configurable)
  - Format: Bearer token in Authorization header
- **Refresh Token**: Stored in `localStorage`
  - Used to generate new access tokens
  - Expiry: 7 days (configurable)

### Password Security
- **bcryptjs** - Password hashing
- **Salt Rounds**: 10
- Algorithm: bcrypt

### CORS Configuration
```javascript
corsOrigin: "http://localhost:3000"
sameSite: "Strict"
secure: true
httpOnly: true
```

### User Roles & Permissions
```
┌─────────────────┬──────────────────────────┐
│ Role            │ Permissions              │
├─────────────────┼──────────────────────────┤
│ user            │ Donate, View history     │
│ templeAdmin     │ Manage temple, Withdraw  │
│ superAdmin      │ Manage all temples+users │
└─────────────────┴──────────────────────────┘
```

---

## 🌐 External APIs

### CoinGecko API
- **Purpose**: Real-time cryptocurrency prices
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Fallback**: Mock cryptocurrency prices
- **Refresh Rate**: Every 30 seconds
- **Supported Coins**:
  - Bitcoin (BTC)
  - Ethereum (ETH)
  - Binance Coin (BNB)
  - Polygon/Matic (MATIC)
  - Cardano (ADA)
  - Solana (SOL)

### Email Service
- **Provider**: Gmail SMTP
- **Package**: Nodemailer
- **Port**: 587 (TLS)
- **Authentication**: App-specific password

### Email Templates
- Account registration confirmation
- OTP verification
- Password reset
- Transaction confirmation

---

## 🛠️ Development Tools

### Package Manager
- **npm** v9+ (Node Package Manager)

### Code Quality & Formatting
- **Prettier** - Code formatter
- **ESLint** - JavaScript linter (optional)

### Development Server
- **Nodemon** - Auto-restart on file changes
- Watches: `*.js`, `*.mjs`, `*.cjs`, `*.json`

### Build Tools
- **next build** - Production build
- **npm run dev** - Development mode

### Testing (Optional)
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library

---

## 📦 Project Dependencies

### Frontend Key Dependencies
```json
{
  "next": "14+",
  "react": "18+",
  "typescript": "5+",
  "tailwindcss": "3+",
  "framer-motion": "^10+",
  "lucide-react": "^0.x",
  "react-toastify": "^9+",
  "socket.io-client": "^4+",
  "ethers": "^6+",
  "jwt-decode": "^3+",
  "react-hook-form": "^7+"
}
```

### Backend Key Dependencies
```json
{
  "express": "^4+",
  "mongoose": "^7+",
  "bcryptjs": "^2.4+",
  "jsonwebtoken": "^9+",
  "dotenv": "^16+",
  "cors": "^2.8+",
  "socket.io": "^4+",
  "nodemailer": "^6+",
  "ethers": "^6+",
  "axios": "^1+"
}
```

---

## 🏗️ Architecture Overview

### Layered Architecture
```
┌─────────────────────────────────────────────────────┐
│                  Frontend Layer                      │
│  (Next.js, React, TypeScript, Tailwind, Socket.io)  │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ↓                     ↓
┌───────────────┐     ┌──────────────────┐
│   REST API    │     │   WebSocket      │
│   (Port 5500) │     │   (Port 5050)    │
└───────┬───────┘     └──────────────────┘
        │
┌───────┴────────────────────────────────┐
│      Backend Layer (Express.js)         │
│  (Controllers, Middlewares, Services)  │
└───────┬────────────────────────────────┘
        │
┌───────┴────────────────────────────────┐
│    Data Access Layer (Mongoose)         │
│         (Models, Schemas)               │
└───────┬────────────────────────────────┘
        │
┌───────┴────────────────────────────────┐
│      Database Layer (MongoDB)           │
│  (Users, Transactions, Temples)        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│    Blockchain Layer                     │
│  (MetaMask, ethers.js, Smart Contracts)│
└────────────────────────────────────────┘
```

### Data Flow
```
User Interface
       ↓
   Form Input
       ↓
  Validation
       ↓
API Request (HTTP/WebSocket)
       ↓
Express Middleware (Auth, CORS)
       ↓
Controller Logic
       ↓
Blockchain Interaction (Optional)
       ↓
Database Query (Mongoose)
       ↓
Response Formatting
       ↓
User Interface Update
```

---

## 🚀 Deployment Architecture

### Local Development
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5500`
- WebSocket: `ws://localhost:5050`
- MongoDB: `mongodb://localhost:27017`

### Production Considerations
- Frontend: Vercel / Netlify
- Backend: AWS EC2 / Heroku
- Database: MongoDB Atlas
- Blockchain: Polygon Mainnet

---

## 📝 Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5500
NEXT_PUBLIC_WS_URL=http://localhost:5050
```

### Backend (`.env`)
```
MONGODB_URI=mongodb://localhost:27017
PORT=5500
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
NODE_ENV=development
```

---

## 🔄 Development Workflow

### Start Development
```bash
# Terminal 1: Frontend
cd Frontend
npm install
npm run dev

# Terminal 2: Backend
cd Backend
npm install
npm run dev

# Terminal 3 (Optional): MongoDB
mongod
```

### Build for Production
```bash
# Frontend
npm run build
npm start

# Backend
npm run build
```

---

## 📊 Performance Metrics

| Metric | Target |
|--------|--------|
| **Frontend Build Time** | < 60s |
| **API Response Time** | < 200ms |
| **Database Query Time** | < 100ms |
| **Page Load Time** | < 3s |
| **Lighthouse Score** | > 80 |

---

## 🔗 Technology Version Matrix

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package Manager |
| Next.js | 14+ | Frontend Framework |
| Express | 4+ | Backend Framework |
| MongoDB | 5+ | Database |
| TypeScript | 5+ | Type Safety |
| Solidity | 0.8.20+ | Smart Contracts |
| ethers.js | 6+ | Blockchain |

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [ethers.js Documentation](https://docs.ethers.org/)
- [MetaMask Documentation](https://docs.metamask.io/)

---

**Last Updated**: March 12, 2026  
**Project**: Decentralized Secure Transaction System using Blockchain for Temple Fund Management  
**Maintained By**: DevTemple Team
