import { useCallback, useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth";

const DOCUMENT_NFT_ABI = deployedContracts[31337].SpaceDocumentNFT.abi;

interface Document {
  tokenId: string;
  metadataURI: string;
  admin: string;
  documentType: string;
  timestamp: string;
  active: boolean;
}

export const DocumentMinter = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [mintAmount, setMintAmount] = useState("1");
  const [authorizedAddress, setAuthorizedAddress] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [batchRecipients, setBatchRecipients] = useState("");
  const [batchAmounts, setBatchAmounts] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<string | null>(null);

  const documentNFTAddress = deployedContracts[31337].SpaceDocumentNFT.address as Address;

  const loadUserDocuments = useCallback(async () => {
    if (!address || !documentNFTAddress || !publicClient) return;

    setIsLoading(true);
    try {
      const tokenIds = (await publicClient.readContract({
        address: documentNFTAddress,
        abi: DOCUMENT_NFT_ABI,
        functionName: "getUserDocuments",
        args: [address],
      })) as bigint[];

      const documents = await Promise.all(
        tokenIds.map(async tokenId => {
          try {
            const doc = (await publicClient.readContract({
              address: documentNFTAddress,
              abi: DOCUMENT_NFT_ABI,
              functionName: "getDocument",
              args: [tokenId],
            })) as any;

            return {
              tokenId: tokenId.toString(),
              metadataURI: doc.metadataURI,
              admin: doc.admin,
              documentType: doc.documentType,
              timestamp: doc.timestamp.toString(),
              active: doc.active,
            };
          } catch (innerErr) {
            console.error("Error reading document details:", innerErr);
            return null as any;
          }
        }),
      );

      setUserDocuments(documents.filter(Boolean));
    } catch (error) {
      console.error("Error loading documents:", error);
      setUserDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, documentNFTAddress, publicClient]);

  useEffect(() => {
    if (address && documentNFTAddress && publicClient) {
      loadUserDocuments();
    }
  }, [address, documentNFTAddress, publicClient, loadUserDocuments]);

  const validateAccess = async () => {
    if (!selectedTokenId || !recipientAddress) {
      notification.error("Please select document and recipient");
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch("/api/venice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validateAccess",
          data: {
            documentId: selectedTokenId,
            recipient: recipientAddress,
            documentType: userDocuments.find(d => d.tokenId === selectedTokenId)?.documentType,
          },
        }),
      });

      const result = await response.json();
      if (result.analysis) {
        setValidationStatus(result.analysis);
        notification.info("AI validation complete");
      }
    } catch (error) {
      console.error("Validation error:", error);
      setValidationStatus("Validation complete - Manual review recommended");
    } finally {
      setIsValidating(false);
    }
  };

  const mintDocument = async () => {
    if (!walletClient || !address || !documentNFTAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!selectedTokenId || !recipientAddress || !mintAmount) {
      notification.error("Please fill all fields");
      return;
    }

    setIsMinting(true);
    try {
      const hash = await walletClient.writeContract({
        address: documentNFTAddress,
        abi: DOCUMENT_NFT_ABI,
        functionName: "mintDocument",
        args: [BigInt(selectedTokenId), recipientAddress as Address, BigInt(mintAmount)],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      notification.success("Document NFT minted successfully!");

      setRecipientAddress("");
      setMintAmount("1");
    } catch (error) {
      console.error("Error minting document:", error);
      notification.error("Failed to mint document");
    } finally {
      setIsMinting(false);
    }
  };

  const mintBatch = async () => {
    if (!walletClient || !address || !documentNFTAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!selectedTokenId || !batchRecipients || !batchAmounts) {
      notification.error("Please fill all batch fields");
      return;
    }

    const recipients = batchRecipients.split(",").map(addr => addr.trim() as Address);
    const amounts = batchAmounts.split(",").map(amt => BigInt(amt.trim()));

    if (recipients.length !== amounts.length) {
      notification.error("Recipients and amounts must have same length");
      return;
    }

    setIsMinting(true);
    try {
      const hash = await walletClient.writeContract({
        address: documentNFTAddress,
        abi: DOCUMENT_NFT_ABI,
        functionName: "mintBatch",
        args: [BigInt(selectedTokenId), recipients, amounts],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      notification.success("Batch mint successful!");

      setBatchRecipients("");
      setBatchAmounts("");
    } catch (error) {
      console.error("Error batch minting:", error);
      notification.error("Failed to batch mint");
    } finally {
      setIsMinting(false);
    }
  };

  const authorizeMinter = async (authorized: boolean) => {
    if (!walletClient || !address || !documentNFTAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!selectedTokenId || !authorizedAddress) {
      notification.error("Please select a document and enter an address");
      return;
    }

    setIsAuthorizing(true);
    try {
      const hash = await walletClient.writeContract({
        address: documentNFTAddress,
        abi: DOCUMENT_NFT_ABI,
        functionName: "authorizeMinter",
        args: [BigInt(selectedTokenId), authorizedAddress as Address, authorized],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      notification.success(`Minter ${authorized ? "authorized" : "revoked"} successfully!`);

      setAuthorizedAddress("");
    } catch (error) {
      console.error("Error authorizing minter:", error);
      notification.error("Failed to authorize minter");
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl w-full">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title text-lg sm:text-xl">Share Document Access</h2>
        <p className="text-xs sm:text-sm opacity-70">Grant verified access to regulatory bodies and mission partners</p>

        {isLoading ? (
          <div className="loading loading-spinner loading-lg mx-auto"></div>
        ) : (
          <>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Select Your Document</span>
              </label>
              <select
                className="select select-bordered"
                value={selectedTokenId}
                onChange={e => setSelectedTokenId(e.target.value)}
              >
                <option value="">Select a document</option>
                {userDocuments.map(doc => (
                  <option key={doc.tokenId} value={doc.tokenId}>
                    Document #{doc.tokenId} - {doc.documentType}
                  </option>
                ))}
              </select>
            </div>

            {selectedTokenId && (
              <>
                <div className="divider">Grant Single Access</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Recipient Organization ID</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter organization identifier"
                      className="input input-bordered"
                      value={recipientAddress}
                      onChange={e => setRecipientAddress(e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Number of Copies</span>
                    </label>
                    <input
                      type="number"
                      placeholder="1"
                      className="input input-bordered"
                      value={mintAmount}
                      onChange={e => setMintAmount(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                {validationStatus && (
                  <div className="alert alert-info mb-3">
                    <SparklesIcon className="h-4 w-4" />
                    <span className="text-xs">{validationStatus}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className={`btn btn-outline btn-sm sm:btn-md ${isValidating ? "loading" : ""}`}
                    onClick={validateAccess}
                    disabled={isValidating || isMinting || !recipientAddress}
                  >
                    <ShieldCheckIcon className="h-4 w-4" />
                    {isValidating ? "Validating..." : "Validate Access"}
                  </button>
                  <button
                    className={`btn btn-primary btn-sm sm:btn-md flex-1 ${isMinting ? "loading" : ""}`}
                    onClick={mintDocument}
                    disabled={isMinting || !recipientAddress || !mintAmount}
                  >
                    {isMinting ? "Granting..." : "Grant Access"}
                  </button>
                </div>

                <div className="divider">Grant Multiple Access</div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Organization IDs (comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="NASA, FAA, SpaceX"
                    className="input input-bordered"
                    value={batchRecipients}
                    onChange={e => setBatchRecipients(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Amounts (comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="1, 2, 3"
                    className="input input-bordered"
                    value={batchAmounts}
                    onChange={e => setBatchAmounts(e.target.value)}
                  />
                </div>

                <button
                  className={`btn btn-secondary btn-sm sm:btn-md w-full sm:w-auto ${isMinting ? "loading" : ""}`}
                  onClick={mintBatch}
                  disabled={isMinting || !batchRecipients || !batchAmounts}
                >
                  {isMinting ? "Granting..." : "Grant Batch"}
                </button>

                <div className="divider">Delegate Access Control</div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Delegate Organization ID</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter organization to delegate to"
                    className="input input-bordered"
                    value={authorizedAddress}
                    onChange={e => setAuthorizedAddress(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className={`btn btn-success btn-sm sm:btn-md flex-1 ${isAuthorizing ? "loading" : ""}`}
                    onClick={() => authorizeMinter(true)}
                    disabled={isAuthorizing || !authorizedAddress}
                  >
                    Authorize
                  </button>
                  <button
                    className={`btn btn-error btn-sm sm:btn-md flex-1 ${isAuthorizing ? "loading" : ""}`}
                    onClick={() => authorizeMinter(false)}
                    disabled={isAuthorizing || !authorizedAddress}
                  >
                    Revoke
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
