import { useState } from "react";
import { Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  CheckCircleIcon,
  DocumentTextIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Wallets</h1>
          <p className="text-gray-400">Create and manage your digital vaults</p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <LockClosedIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Digital Vault</h2>
              <p className="text-sm text-gray-400">
                Initialize a secure container for your mission documents and licenses
              </p>
            </div>
          </div>

          {/* AI Recommendations Button */}
          {!smartWalletAddress && (
            <button
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 mb-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-600/20 ${
                isAnalyzing ? "opacity-75 cursor-not-allowed" : ""
              }`}
              onClick={getAIRecommendations}
              disabled={isAnalyzing}
            >
              <SparklesIcon className={`w-5 h-5 ${isAnalyzing ? "animate-spin" : ""}`} />
              {isAnalyzing ? "Analyzing Setup Requirements..." : "Get AI Setup Advice"}
            </button>
          )}

          {/* AI Recommendations Display */}
          {aiRecommendations && !smartWalletAddress && (
            <div className="mb-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">{aiRecommendations}</p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <KeyIcon className="w-4 h-4 text-gray-400" />
                Mission ID
              </label>
              <input
                type="text"
                placeholder="Enter your mission identifier"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                value={tokenContract}
                onChange={e => setTokenContract(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Unique identifier for your space mission</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                Vault Number
              </label>
              <input
                type="text"
                placeholder="Enter vault number (e.g., 1)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                value={tokenId}
                onChange={e => setTokenId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Sequential vault identifier for this mission</p>
            </div>
          </div>

          {/* Create Button */}
          <div className="mt-8 flex justify-end">
            <button
              className={`flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-600/20 ${
                isCreating || !tokenContract || !tokenId ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={createSmartWallet}
              disabled={isCreating || !tokenContract || !tokenId}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Vault...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-5 h-5" />
                  Create Digital Vault
                </>
              )}
            </button>
          </div>

          {/* Success Message */}
          {smartWalletAddress && (
            <div className="mt-6 p-4 bg-green-600/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-400 mb-1">Digital Vault Created Successfully!</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Vault ID:</span>
                    <code className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded font-mono break-all">
                      {smartWalletAddress}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <LockClosedIcon className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Secure Storage</h3>
            </div>
            <p className="text-sm text-gray-400">Military-grade encryption for your mission-critical documents</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <KeyIcon className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">Access Control</h3>
            </div>
            <p className="text-sm text-gray-400">Granular permissions for team members and stakeholders</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <DocumentTextIcon className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="font-semibold text-white">Compliance Ready</h3>
            </div>
            <p className="text-sm text-gray-400">Built-in support for regulatory documentation requirements</p>
          </div>
        </div>
      </div>
    </div>
  );
};
