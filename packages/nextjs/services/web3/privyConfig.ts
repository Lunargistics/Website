import { defineChain } from "viem";

type LoginMethod = "email" | "line" | "wallet" | "apple" | "discord" | "github" | "google" | "instagram" | "linkedin" | "spotify" | "twitter" | "sms" | "tiktok" | "farcaster" | "telegram" | "passkey";

// Define TEA Sepolia chain
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
      http: ["https://tea-sepolia.g.alchemy.com/public"],
    },
    public: {
      http: ["https://tea-sepolia.g.alchemy.com/public"],
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

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
  config: {
    logo: "/logo.svg",
    appearance: {
      theme: "auto" as const,
      accentColor: "#6366F1" as `#${string}`,
      showWalletLoginFirst: false,
    },
    loginMethods: ["email", "wallet", "google", "github", "discord", "twitter"] as LoginMethod[],
    // Disable WalletConnect to prevent Reown popup
    walletList: ["metamask", "coinbase_wallet", "embedded"],
    embeddedWallets: {
      createOnLogin: "users-without-wallets" as const,
      noPromptOnSignature: false,
    },
    mfa: {
      noPromptOnMfaRequired: false,
    },
    defaultChain: teaSepolia,
    supportedChains: [
      teaSepolia,
      // Add other chains as needed
    ],
  },
};
