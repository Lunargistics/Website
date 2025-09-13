import { sepolia, hardhat } from "viem/chains";

type LoginMethod = "email" | "line" | "wallet" | "apple" | "discord" | "github" | "google" | "instagram" | "linkedin" | "spotify" | "twitter" | "sms" | "tiktok" | "farcaster" | "telegram" | "passkey";

// TEA Sepolia temporarily disabled - RPC endpoints not working
// Will re-enable when proper RPC is available
/*
const teaRpcUrl = process.env.NEXT_PUBLIC_TEA_RPC_URL || "https://tea-testnet.rpc.thirdweb.com";

export const teaSepolia = defineChain({
  id: 10218,
  name: "TEA Sepolia",
  network: "tea-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "TEA",
    symbol: "TEA",
  },
  rpcUrls: {
    default: {
      http: [teaRpcUrl],
    },
    public: {
      http: [teaRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "TEA Explorer",
      url: "https://testnet.explorer.tea.xyz",
    },
  },
  testnet: true,
});
*/

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clcmiq2wd0bhgxh0f0j0qb8z8", // Default test app ID - replace with your own
  config: {
    logo: "/logo.svg",
    appearance: {
      theme: "auto" as const,
      accentColor: "#6366F1" as `#${string}`,
      showWalletLoginFirst: false,
    },
    loginMethods: ["email", "wallet", "google", "github", "discord", "twitter"] as LoginMethod[],
    // Disable WalletConnect to prevent Reown popup
    // Temporarily disable Coinbase Smart Wallet due to unsupported chains error
    walletList: ["metamask", "embedded"],
    embeddedWallets: {
      createOnLogin: "users-without-wallets" as const,
      noPromptOnSignature: false,
    },
    mfa: {
      noPromptOnMfaRequired: false,
    },
  defaultChain: process.env.NEXT_PUBLIC_NETWORK === "localhost" ? hardhat : sepolia,
  supportedChains: [
    sepolia,
    hardhat,
    // teaSepolia, // Re-enable when RPC is working
  ],
  },
};
