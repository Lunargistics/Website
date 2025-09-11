import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig, createStorage } from "wagmi";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Custom storage to prevent auto-reconnect on page load
const noopStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors,
  ssr: true,
  syncConnectedChain: false,
  // Use noop storage to prevent auto-reconnect
  storage: createStorage({
    storage: typeof window !== "undefined" ? noopStorage : undefined,
  }),
  client({ chain }) {
    let rpcFallbacks = [];

    // For TEA Sepolia, use the configured RPC endpoint
    if (chain.id === 10218) {
      const teaRpcUrl = process.env.NEXT_PUBLIC_TEA_RPC_URL || "https://tea-testnet.rpc.thirdweb.com";
      rpcFallbacks = [
        http(teaRpcUrl, {
          timeout: 10000,
        }),
      ];
    } else {
      const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];
      if (rpcOverrideUrl) {
        rpcFallbacks = [http(rpcOverrideUrl)];
      } else {
        const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
        if (alchemyHttpUrl) {
          const isUsingDefaultKey = scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
          // If using default Scaffold-ETH 2 API key, we prioritize the default RPC
          rpcFallbacks = isUsingDefaultKey ? [http(), http(alchemyHttpUrl)] : [http(alchemyHttpUrl), http()];
        } else {
          rpcFallbacks = [http()];
        }
      }
    }

    return createClient({
      chain,
      transport: fallback(rpcFallbacks, {
        rank: true,
        retryCount: 5,
        retryDelay: 1000,
      }),
      ...(chain.id !== (hardhat as Chain).id
        ? {
            pollingInterval: scaffoldConfig.pollingInterval,
          }
        : {}),
    });
  },
});
