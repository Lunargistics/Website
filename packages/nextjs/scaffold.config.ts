import { Chain } from "viem";
import * as chains from "viem/chains";

// Define TEA Sepolia network
const teaSepolia = {
  id: 10218,
  name: "TEA Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "TEA",
    symbol: "TEA",
  },
  rpcUrls: {
    public: { http: ["https://tea-sepolia.g.alchemy.com/public"] },
    default: { http: ["https://tea-sepolia.g.alchemy.com/public"] },
  },
  blockExplorers: {
    default: {
      name: "TEA Explorer",
      url: "https://testnet.explorer.tea.xyz",
    },
  },
  testnet: true,
} as const satisfies Chain;

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const scaffoldConfig = {
  // The networks on which your DApp is live
  targetNetworks: [teaSepolia, chains.hardhat],

  // The interval at which your front-end polls the RPC servers for new data
  // it has no effect if you only target the local network (default is 4000)
  pollingInterval: 30000,

  // This is ours Alchemy's default API key.
  // You can get your own at https://dashboard.alchemyapi.io
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,

  // If you want to use a different RPC for a specific network, you can add it here.
  // The key is the chain ID, and the value is the HTTP RPC URL
  rpcOverrides: {
    // TEA Sepolia RPC
    10218: "https://tea-sepolia.g.alchemy.com/public",
  },

  // This is ours WalletConnect's default project ID.
  // You can get your own at https://cloud.walletconnect.com
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",

  // Only show the Burner Wallet when running on hardhat network
  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
