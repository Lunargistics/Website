// import { useSetActiveWallet } from "@privy-io/wagmi";
import { useCallback, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useDisconnect } from "wagmi";

export const usePrivyAuth = () => {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
    linkGoogle,
    linkGithub,
    linkDiscord,
    linkTwitter,
  } = usePrivy();

  const { wallets } = useWallets();
  // Ensure we read the wagmi account before using `address`
  const { address, isConnected } = useAccount();
  // const setActiveWallet = useSetActiveWallet();
  const activeWallet = wallets.find(w => w.address === address);
  const { disconnect } = useDisconnect();

  const [isLoading, setIsLoading] = useState(false);

  // Get user's primary wallet address
  const primaryWallet = wallets.find(w => w.walletClientType === "privy");
  const primaryAddress = primaryWallet?.address || address;

  // Enhanced login with wallet connection
  const loginWithWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      await login();
      // Automatically set the first wallet as active after login
      // if (wallets.length > 0 && !activeWallet) {
      //   await setActiveWallet(wallets[0]);
      // }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  // Enhanced logout
  const logoutUser = useCallback(async () => {
    setIsLoading(true);
    try {
      // Disconnect wagmi wallet first
      if (isConnected) {
        disconnect();
      }
      // Then logout from Privy
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [logout, disconnect, isConnected]);

  // Auto-connect wallet on authentication
  // useEffect(() => {
  //   if (authenticated && wallets.length > 0 && !activeWallet) {
  //     setActiveWallet(wallets[0]);
  //   }
  // }, [authenticated, wallets, activeWallet, setActiveWallet]);

  // Get user display name
  const getUserDisplayName = useCallback(() => {
    if (!user) return null;

    if (user.email) {
      return user.email.address;
    }
    if (user.google) {
      return user.google.email || user.google.name;
    }
    if (user.github) {
      return user.github.username;
    }
    if (user.discord) {
      return user.discord.username;
    }
    if (user.twitter) {
      return user.twitter.username;
    }
    if (user.wallet) {
      return `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`;
    }
    return "User";
  }, [user]);

  // Check if user has embedded wallet
  const hasEmbeddedWallet = wallets.some(w => w.walletClientType === "privy");

  // Export embedded wallet
  const exportWallet = useCallback(async () => {
    const embeddedWallet = wallets.find(w => w.walletClientType === "privy");
    if (embeddedWallet) {
      try {
        // Export wallet functionality may not be available in all wallet types
        console.log("Export wallet requested for:", embeddedWallet.address);
      } catch (error) {
        console.error("Failed to export wallet:", error);
      }
    }
  }, [wallets]);

  return {
    // Auth state
    ready,
    authenticated,
    isLoading,
    user,

    // User info
    displayName: getUserDisplayName(),
    primaryAddress,
    hasEmbeddedWallet,

    // Auth methods
    login,
    loginWithWallet,
    logout: logoutUser,

    // Link methods
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
    linkGoogle,
    linkGithub,
    linkDiscord,
    linkTwitter,

    // Wallet methods
    wallets,
    activeWallet,
    // setActiveWallet,
    exportWallet,

    // Wagmi compatibility
    address: primaryAddress,
    isConnected: authenticated && !!primaryAddress,
  };
};
