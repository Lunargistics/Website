"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  ArrowRightIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { AIAnalysisPanel } from "~~/components/AIAnalysisPanel";
import { AIComplianceDashboard } from "~~/components/AIComplianceDashboard";
import { DocumentMinter } from "~~/components/DocumentMinter";
import { DocumentUploadForm } from "~~/components/DocumentUploadForm";
import { SmartWalletCreator } from "~~/components/SmartWalletCreator";

export const LicensingDashboard = () => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"wallet" | "upload" | "mint">("wallet");
  const [userDocuments] = useState<any[]>([]);

  const steps = [
    {
      id: "wallet",
      name: "Create Digital Vault",
      description: "Set up a secure digital container for your mission documents",
      icon: WalletIcon,
    },
    {
      id: "upload",
      name: "Upload Documents",
      description: "Store your launch licenses and compliance documents securely",
      icon: DocumentTextIcon,
    },
    {
      id: "mint",
      name: "Share Access",
      description: "Grant verified access to regulatory bodies and partners",
      icon: RocketLaunchIcon,
    },
  ];

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="bg-gray-800 border border-gray-700 max-w-md mx-auto p-8 rounded-xl">
          <ShieldCheckIcon className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-white">Connect Your Account</h2>
          <p className="text-gray-400 mb-6">Please connect your account to access the licensing portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-8 overflow-x-auto">
        <div className="flex items-center space-x-2 sm:space-x-4 px-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setActiveTab(step.id as any)}
                className={`flex flex-col items-center p-2 sm:p-4 rounded-lg transition-all min-w-[80px] sm:min-w-[120px] ${
                  activeTab === step.id
                    ? "bg-purple-600 text-white scale-105"
                    : "bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300"
                }`}
              >
                <step.icon className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm font-semibold text-center">{step.name}</span>
              </button>
              {index < steps.length - 1 && (
                <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5 mx-1 sm:mx-2 text-gray-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* AI Compliance Dashboard - Shows overall mission status */}
        <div className="mb-6">
          <AIComplianceDashboard />
        </div>

        {/* AI Analysis Panel - Shows mission readiness */}
        <AIAnalysisPanel
          documents={userDocuments}
          missionName="Current Mission"
          onAnalysisComplete={analysis => {
            console.log("Mission analysis:", analysis);
          }}
        />

        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold mb-2 text-white">{steps.find(s => s.id === activeTab)?.name}</h3>
          <p className="text-gray-400">{steps.find(s => s.id === activeTab)?.description}</p>
        </div>

        {activeTab === "wallet" && <SmartWalletCreator />}
        {activeTab === "upload" && <DocumentUploadForm />}
        {activeTab === "mint" && <DocumentMinter />}
      </div>

      <div className="mt-8 sm:mt-16 bg-gray-800 border border-gray-700 p-4 sm:p-8 rounded-lg">
        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h4 className="font-semibold text-white">Create Your Vault</h4>
            </div>
            <p className="text-sm text-gray-400">
              Initialize a secure digital container that will hold all your mission documentation
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h4 className="font-semibold text-white">Upload Documents</h4>
            </div>
            <p className="text-sm text-gray-400">
              Store launch licenses, safety reports, and compliance documents in your secure vault
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h4 className="font-semibold text-white">Control Access</h4>
            </div>
            <p className="text-sm text-gray-400">Grant verified access to FAA, NASA, and mission partners as needed</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="bg-blue-900/50 border border-blue-700 max-w-2xl mx-auto p-4 rounded-lg">
          <div className="flex items-center justify-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6 text-blue-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div className="text-left">
              <span className="font-semibold text-blue-300">Secure Storage:</span>
              <span className="text-blue-200">
                {" "}
                Documents are stored on distributed secure storage. Add your Pinata JWT to .env.local to enable uploads.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
