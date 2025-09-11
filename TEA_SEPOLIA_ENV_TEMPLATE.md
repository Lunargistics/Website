# TEA Sepolia Environment Configuration Template

## 🔧 Environment Variables Setup

Create a `.env.local` file in `packages/nextjs/` with the following configuration:

```bash
# TEA Sepolia Network Configuration
NEXT_PUBLIC_NETWORK=teaSepolia
NEXT_PUBLIC_CHAIN_ID=10218
NEXT_PUBLIC_RPC_URL=https://tea-sepolia.g.alchemy.com/public

# Contract Addresses (TEA Sepolia - DEPLOYED)
NEXT_PUBLIC_YOUR_CONTRACT_ADDRESS=0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1
NEXT_PUBLIC_SPACE_ACTIVITY_MANAGER_ADDRESS=0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44
NEXT_PUBLIC_MISSION_REGISTRY_ADDRESS=0x4A679253410272dd5232B3Ff7cF5dbB88f295319
NEXT_PUBLIC_SPACE_EQUIPMENT_NFT_ADDRESS=0x7a2088a1bFc9d81c55368AE168C2C02570cB814F
NEXT_PUBLIC_SPACE_DOCUMENT_NFT_ADDRESS=0x09635F643e140090A9A8Dcd712eD6285858ceBef
NEXT_PUBLIC_ASTEROID_COMMODITY_TOKEN_ADDRESS=0xc5a5C42992dECbae36851359345FE25997F5C42d

# Web3 Services (REQUIRED)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here

# IPFS/Pinata Configuration (REQUIRED for Mission Data Storage)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud

# Stripe Configuration (REQUIRED for Credits/Payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# NextAuth Configuration (REQUIRED for Authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_char_random_string_here

# Database Configuration (OPTIONAL - defaults to in-memory)
DATABASE_URL=mongodb://localhost:27017/mission-planning
# Or for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/mission_planning

# Monitoring (OPTIONAL)
SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_DSN=your_public_sentry_dsn_here

# Redis Configuration (OPTIONAL - for rate limiting)
REDIS_URL=redis://localhost:6379
```

## 📋 Service Setup Instructions

### 1. Pinata (IPFS)
1. Sign up at https://pinata.cloud
2. Go to API Keys section
3. Create a new API key with permissions
4. Copy the API Key and Secret Key

### 2. Stripe
1. Sign up at https://stripe.com
2. Get test keys from Dashboard > Developers > API keys
3. Set up webhook endpoint for `/api/webhooks/stripe`
4. Copy the webhook signing secret

### 3. Alchemy
1. Sign up at https://www.alchemy.com
2. Create a new app for TEA Sepolia
3. Copy the API key

### 4. WalletConnect
1. Sign up at https://cloud.walletconnect.com
2. Create a new project
3. Copy the Project ID

### 5. NextAuth Secret
Generate a secure random string:
```bash
openssl rand -base64 32
```

## 🚀 Running the Application

After setting up the environment variables:

```bash
# Install dependencies
cd packages/nextjs
yarn install

# Run the application
yarn dev
```

The application will be available at http://localhost:3000

## 🔗 Connecting to TEA Sepolia

1. Add TEA Sepolia to your wallet:
   - Network Name: TEA Sepolia
   - RPC URL: https://tea-sepolia.g.alchemy.com/public
   - Chain ID: 10218
   - Currency Symbol: TEA
   - Block Explorer: https://testnet.explorer.tea.xyz

2. Get test TEA tokens from the faucet (if available)

3. Connect your wallet to the application

## ✅ Deployed Contracts on TEA Sepolia

| Contract | Address | Explorer |
|----------|---------|----------|
| YourContract | 0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1 | [View](https://testnet.explorer.tea.xyz/address/0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1) |
| SpaceActivityManager | 0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44 | [View](https://testnet.explorer.tea.xyz/address/0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44) |
| MissionRegistry | 0x4A679253410272dd5232B3Ff7cF5dbB88f295319 | [View](https://testnet.explorer.tea.xyz/address/0x4A679253410272dd5232B3Ff7cF5dbB88f295319) |
| SpaceEquipmentNFT | 0x7a2088a1bFc9d81c55368AE168C2C02570cB814F | [View](https://testnet.explorer.tea.xyz/address/0x7a2088a1bFc9d81c55368AE168C2C02570cB814F) |
| SpaceDocumentNFT | 0x09635F643e140090A9A8Dcd712eD6285858ceBef | [View](https://testnet.explorer.tea.xyz/address/0x09635F643e140090A9A8Dcd712eD6285858ceBef) |
| AsteroidCommodityToken | 0xc5a5C42992dECbae36851359345FE25997F5C42d | [View](https://testnet.explorer.tea.xyz/address/0xc5a5C42992dECbae36851359345FE25997F5C42d) |
