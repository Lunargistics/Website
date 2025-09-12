"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
// import { ProgressBar } from "~~/components/blockexplorer/ProgressBar"; // TODO: Implement ProgressBar
import { ErrorBoundaryProvider } from "~~/components/errors/ErrorBoundary";
import { OfflineIndicator } from "~~/components/errors/FallbackComponents";
import { initSentry } from "~~/lib/monitoring/sentry";
import { privyConfig } from "~~/services/web3/privyConfig";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      // Add error handling
      throwOnError: false,
    },
    mutations: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Add error handling
      throwOnError: false,
    },
  },
});

// Initialize Sentry on app load
if (typeof window !== "undefined") {
  initSentry();
}

export function ScaffoldEthProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryProvider>
      <PrivyProvider
        appId={privyConfig.appId}
        config={{
          ...privyConfig.config,
          appearance: {
            ...privyConfig.config.appearance,
            theme: "light",
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </PrivyProvider>
    </ErrorBoundaryProvider>
  );
}

export function ScaffoldEthApp({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      {/* <ProgressBar /> TODO: Implement ProgressBar */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <OfflineIndicator />
    </>
  );
}
