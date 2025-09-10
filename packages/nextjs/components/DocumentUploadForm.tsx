import { useState } from "react";
import { PinataSDK } from "pinata-web3";
import { Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { SparklesIcon } from "@heroicons/react/24/outline";
import deployedContracts from "~~/contracts/deployedContracts";
import { veniceAI } from "~~/services/veniceAI";
import { notification } from "~~/utils/scaffold-eth";

const DOCUMENT_NFT_ABI = deployedContracts[31337].SpaceDocumentNFT.abi;

interface DocumentFormData {
  title: string;
  description: string;
  documentType: string;
  missionName: string;
  launchDate: string;
  responsibleEntity: string;
  file: File | null;
}

export const DocumentUploadForm = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [isUploading, setIsUploading] = useState(false);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [formData, setFormData] = useState<DocumentFormData>({
    title: "",
    description: "",
    documentType: "License",
    missionName: "",
    launchDate: "",
    responsibleEntity: "",
    file: null,
  });

  const documentNFTAddress = deployedContracts[31337].SpaceDocumentNFT.address as Address;
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadToIPFS = async () => {
    if (!formData.file) {
      notification.error("Please select a file to upload");
      return;
    }

    if (!pinataJWT || pinataJWT === "YOUR_PINATA_JWT_HERE") {
      notification.error("Please add your Pinata JWT token to .env.local");
      return;
    }

    if (!walletClient || !address) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!documentNFTAddress) {
      notification.error("Document NFT contract address not configured");
      return;
    }

    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      // AI Analysis of document before upload
      if (formData.file) {
        const fileContent = await formData.file.text();
        const analysis = await veniceAI.analyzeDocument(
          fileContent.substring(0, 5000), // Analyze first 5000 chars
          formData.documentType,
          formData.missionName,
        );

        setAiInsights(analysis.summary);

        if (analysis.expiryRisk) {
          notification.warning("AI Alert: Document may have expiry concerns");
        }

        if (analysis.missingFields.length > 0) {
          notification.info(`AI suggests checking: ${analysis.missingFields.join(", ")}`);
        }
      }
      setIsAnalyzing(false);

      const pinata = new PinataSDK({ pinataJwt: pinataJWT });

      // Upload file to IPFS
      const fileUpload = await pinata.upload.file(formData.file);
      const fileHash = fileUpload.IpfsHash;

      // Create metadata
      const metadata = {
        name: formData.title,
        description: formData.description,
        image: `ipfs://${fileHash}`,
        attributes: [
          { trait_type: "Document Type", value: formData.documentType },
          { trait_type: "Mission Name", value: formData.missionName },
          { trait_type: "Launch Date", value: formData.launchDate },
          { trait_type: "Responsible Entity", value: formData.responsibleEntity },
          { trait_type: "Upload Date", value: new Date().toISOString() },
          { trait_type: "Uploader", value: address },
        ],
      };

      // Upload metadata to IPFS
      const metadataUpload = await pinata.upload.json(metadata);
      const metadataURI = `ipfs://${metadataUpload.IpfsHash}`;

      const hash = await walletClient.writeContract({
        address: documentNFTAddress,
        abi: DOCUMENT_NFT_ABI,
        functionName: "createDocument",
        args: [metadataURI, formData.documentType],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = receipt.logs.filter(log => log.address.toLowerCase() === documentNFTAddress.toLowerCase());

      if (logs.length > 0 && logs[0].topics[1]) {
        const newTokenId = BigInt(logs[0].topics[1]).toString();
        setTokenId(newTokenId);
      }

      notification.success("Document uploaded and secured successfully!");

      setFormData({
        title: "",
        description: "",
        documentType: "License",
        missionName: "",
        launchDate: "",
        responsibleEntity: "",
        file: null,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      notification.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl w-full">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title text-lg sm:text-xl">Upload Mission Document</h2>
        <p className="text-xs sm:text-sm opacity-70">Securely store your launch licenses and compliance documents</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Document Title*</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Launch License #123"
              className="input input-bordered"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Document Type*</span>
            </label>
            <select
              name="documentType"
              className="select select-bordered"
              value={formData.documentType}
              onChange={handleInputChange}
            >
              <option value="License">License</option>
              <option value="Permit">Permit</option>
              <option value="Safety Report">Safety Report</option>
              <option value="Environmental Assessment">Environmental Assessment</option>
              <option value="Technical Specification">Technical Specification</option>
              <option value="Insurance">Insurance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Mission Name*</span>
            </label>
            <input
              type="text"
              name="missionName"
              placeholder="e.g., Artemis III"
              className="input input-bordered"
              value={formData.missionName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Launch Date</span>
            </label>
            <input
              type="date"
              name="launchDate"
              className="input input-bordered"
              value={formData.launchDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Responsible Entity*</span>
            </label>
            <input
              type="text"
              name="responsibleEntity"
              placeholder="e.g., SpaceX, NASA"
              className="input input-bordered"
              value={formData.responsibleEntity}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Document File*</span>
            </label>
            <input
              type="file"
              className="file-input file-input-bordered"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.png"
              required
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <input
            type="text"
            name="description"
            placeholder="Brief description of the document"
            className="input input-bordered"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        {/* AI Insights Display */}
        {aiInsights && (
          <div className="alert alert-info mt-4">
            <SparklesIcon className="h-5 w-5" />
            <div>
              <span className="font-semibold">AI Analysis:</span>
              <p className="text-xs mt-1">{aiInsights}</p>
            </div>
          </div>
        )}

        <div className="card-actions justify-end mt-4">
          <button
            className={`btn btn-primary btn-sm sm:btn-md ${isUploading || isAnalyzing ? "loading" : ""}`}
            onClick={uploadToIPFS}
            disabled={
              isUploading || !formData.file || !formData.title || !formData.missionName || !formData.responsibleEntity
            }
          >
            {isAnalyzing ? "Analyzing..." : isUploading ? "Uploading..." : "Upload & Secure"}
          </button>
        </div>

        {tokenId && (
          <div className="alert alert-success mt-4">
            <div className="w-full">
              <span className="text-sm sm:text-base">Document Secured!</span>
              <p className="text-xs mt-1">Document ID: {tokenId}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
