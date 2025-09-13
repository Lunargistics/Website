import { hardhat, sepolia } from "viem/chains";

type LoginMethod =
  | "email"
  | "line"
  | "wallet"
  | "apple"
  | "discord"
  | "github"
  | "google"
  | "instagram"
  | "linkedin"
  | "spotify"
  | "twitter"
  | "sms"
  | "tiktok"
  | "farcaster"
  | "telegram"
  | "passkey";

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

const isLocal = process.env.NEXT_PUBLIC_NETWORK === "localhost" || process.env.NODE_ENV !== "production";

export const privyConfig = {
  // Default to your app ID; can be overridden by env var
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmfgwngbo00blkz0bh38m5ffc",
  config: {
    logo: "/logo.svg",
    appearance: {
      theme: "auto" as const,
      accentColor: "#6366F1" as `#${string}`,
      showWalletLoginFirst: false,
    },
    // Enable only the providers configured and approved
    // Disable Google OAuth to avoid "Login with Google not allowed" errors
    // Disable Telegram to avoid CORS issues from oauth.telegram.org
    loginMethods: ["email", "wallet", "github", "linkedin"] as LoginMethod[],
    // Disable WalletConnect to prevent Reown popup
    // Disable Coinbase Smart Wallet entirely
    walletList: ["metamask", "embedded"],
    embeddedWallets: {
      createOnLogin: "users-without-wallets" as const,
      noPromptOnSignature: false,
    },
    mfa: {
      noPromptOnMfaRequired: false,
    },
    defaultChain: isLocal ? hardhat : sepolia,
    supportedChains: isLocal ? [hardhat, sepolia] : [sepolia],
  },
};
