# 🚀 Lunargistics Setup Guide

## 🔴 IMPORTANT: Current Issues & Solutions

### Issue 1: TEA Sepolia RPC Not Working
The TEA Sepolia network RPC endpoints are currently not functional. We've temporarily switched to Ethereum Sepolia testnet.

**Status:** TEA Sepolia has been disabled until a working RPC endpoint is available.

### Issue 2: Invalid Privy App ID
The default Privy app ID is for testing only and won't work in production.

## ✅ Quick Fix Instructions

### Step 1: Set Up Privy Authentication (REQUIRED)

1. **Create a Privy Account:**
   - Go to [https://dashboard.privy.io](https://dashboard.privy.io)
   - Sign up for a free account
   
2. **Create a New App:**
   - Click "Create App"
   - Name it "Lunargistics" or similar
   - Select "Web" as platform
   
3. **Configure Your App:**
   - In the dashboard, go to "Settings"
   - Add your domains:
     - Development: `http://localhost:3000`
     - Production: `https://www.lunargistics.com`
   
4. **Get Your App ID:**
   - Copy the App ID from the dashboard
   - It should look like: `clxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Create Environment File

Create a file `packages/nextjs/.env.local` with this content:

```bash
# ============================================
# CRITICAL: REPLACE WITH YOUR ACTUAL VALUES
# ============================================

# Privy Authentication (GET FROM https://dashboard.privy.io)
NEXT_PUBLIC_PRIVY_APP_ID=YOUR_ACTUAL_PRIVY_APP_ID_HERE

# Network Configuration
NEXT_PUBLIC_NETWORK=sepolia  # Using Sepolia until TEA is fixed

# Optional: Use your own Alchemy API key for better performance
# Get one free at: https://dashboard.alchemyapi.io
# NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here

# Optional: WalletConnect Project ID
# Get one at: https://cloud.walletconnect.com
# NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

### Step 3: For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add these variables:
   - `NEXT_PUBLIC_PRIVY_APP_ID` = Your actual Privy app ID
   - `NEXT_PUBLIC_NETWORK` = sepolia

## 🎯 Testing Your Setup

### Local Testing:
```bash
cd packages/nextjs
yarn dev
```

Visit http://localhost:3000 and click "Sign In" - you should see the Privy login modal.

### Production Testing:
After deploying to Vercel with the environment variables set, the "Sign In" button should work on your live site.

## 🔧 Optional: Re-enable TEA Sepolia (When RPC is Fixed)

When a working TEA Sepolia RPC becomes available:

1. Update `.env.local`:
```bash
NEXT_PUBLIC_NETWORK=teaSepolia
NEXT_PUBLIC_TEA_RPC_URL=<working_rpc_url_here>
```

2. Uncomment TEA Sepolia in `scaffold.config.ts` and `privyConfig.ts`

## 📞 Getting Help

- **Privy Support:** [https://docs.privy.io](https://docs.privy.io)
- **TEA Network Status:** Check their official channels for RPC updates
- **Scaffold-ETH:** [https://docs.scaffoldeth.io](https://docs.scaffoldeth.io)

## ⚡ Quick Checklist

- [ ] Created Privy account
- [ ] Created Privy app and got app ID
- [ ] Created `.env.local` with your Privy app ID
- [ ] Added environment variables to Vercel
- [ ] Tested login functionality locally
- [ ] Deployed and tested on production

---

**Note:** The application is currently configured to use Ethereum Sepolia testnet. Once TEA Sepolia RPC issues are resolved, we can switch back.
