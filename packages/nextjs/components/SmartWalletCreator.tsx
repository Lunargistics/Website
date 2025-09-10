import { useState } from "react";
import { Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth";

const REGISTRY_ABI = deployedContracts[31337].ERC6551Registry.abi;

export const SmartWalletCreator = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [tokenContract, setTokenContract] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const registryAddress = deployedContracts[31337].ERC6551Registry.address as Address;
  const implementationAddress = deployedContracts[31337].SpaceSmartWallet.address as Address;

  const getAIRecommendations = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/venice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyzeDocument",
          data: {
            content: `Planning to create digital vault for mission ${tokenContract || "TBD"} with vault number ${tokenId || "TBD"}`,
            documentType: "Vault Setup",
            missionName: tokenContract || "New Mission",
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAiRecommendations(result.analysis || "Digital vault recommended for secure document storage");
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiRecommendations("Create a secure digital vault to store your mission-critical documents");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createSmartWallet = async () => {
    if (!walletClient || !publicClient || !address) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!tokenContract || !tokenId) {
      notification.error("Please enter token contract and ID");
      return;
    }

    if (!registryAddress || !implementationAddress) {
      notification.error("Contract addresses not configured");
      return;
    }

    setIsCreating(true);
    try {
      const salt = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const chainId = await publicClient.getChainId();

      const predictedAddress = await publicClient.readContract({
        address: registryAddress,
        abi: REGISTRY_ABI,
        functionName: "account",
        args: [
          implementationAddress,
          salt as `0x${string}`,
          BigInt(chainId),
          tokenContract as Address,
          BigInt(tokenId),
        ],
      });

      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: REGISTRY_ABI,
        functionName: "createAccount",
        args: [
          implementationAddress,
          salt as `0x${string}`,
          BigInt(chainId),
          tokenContract as Address,
          BigInt(tokenId),
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setSmartWalletAddress(predictedAddress);
      notification.success("Digital vault created successfully!");
    } catch (error) {
      console.error("Error creating smart wallet:", error);
      notification.error("Failed to create smart wallet");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl w-full">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title text-lg sm:text-xl">Create Digital Vault</h2>
        <p className="text-xs sm:text-sm opacity-70">
          Initialize a secure container for your mission documents and licenses
        </p>

        {!smartWalletAddress && (
          <button
            className={`btn btn-outline btn-sm ${isAnalyzing ? "loading" : ""}`}
            onClick={getAIRecommendations}
            disabled={isAnalyzing}
          >
            <SparklesIcon className="h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Get AI Setup Advice"}
          </button>
        )}

        {aiRecommendations && !smartWalletAddress && (
          <div className="alert alert-info">
            <ShieldCheckIcon className="h-5 w-5" />
            <span className="text-xs">{aiRecommendations}</span>
          </div>
        )}

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Mission ID</span>
          </label>
          <input
            type="text"
            placeholder="Enter your mission identifier"
            className="input input-bordered w-full"
            value={tokenContract}
            onChange={e => setTokenContract(e.target.value)}
          />
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Vault Number</span>
          </label>
          <input
            type="text"
            placeholder="Enter vault number (e.g., 1)"
            className="input input-bordered w-full"
            value={tokenId}
            onChange={e => setTokenId(e.target.value)}
          />
        </div>

        <div className="card-actions justify-end mt-4">
          <button
            className={`btn btn-primary btn-sm sm:btn-md ${isCreating ? "loading" : ""}`}
            onClick={createSmartWallet}
            disabled={isCreating || !tokenContract || !tokenId}
          >
            {isCreating ? "Creating..." : "Create Digital Vault"}
          </button>
        </div>

        {smartWalletAddress && (
          <div className="alert alert-success mt-4">
            <div className="w-full">
              <span className="text-sm sm:text-base">Digital Vault Created!</span>
              <p className="text-xs break-all mt-1">Vault ID: {smartWalletAddress}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
