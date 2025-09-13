import React, { ReactElement } from "react";
import { wagmiConfig } from "../../services/web3/wagmiConfig";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RenderOptions, render, fireEvent, screen, waitFor } from "@testing-library/react";
import { WagmiProvider } from "wagmi";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <PrivyProvider
      appId="test-app-id"
      config={{
        appearance: {
          theme: "light",
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from @testing-library/react
export * from "@testing-library/react";
// Override the render function with our custom one
export { customRender as render };
// Explicitly re-export commonly used functions
export { fireEvent, screen, waitFor };
