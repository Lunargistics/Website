"use client";

import type { NextPage } from "next";
import { useState } from "react";
import { useAccount } from "wagmi";
import { SmartWalletCreator } from "~~/components/SmartWalletCreator";
import { DocumentUploadForm } from "~~/components/DocumentUploadForm";
import { DocumentMinter } from "~~/components/DocumentMinter";
import { AIAnalysisPanel } from "~~/components/AIAnalysisPanel";
import { AIComplianceDashboard } from "~~/components/AIComplianceDashboard";
import { 
  RocketLaunchIcon, 
  DocumentTextIcon, 
  WalletIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

const LicensingPage: NextPage = () => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"wallet" | "upload" | "mint">("wallet");
  const [userDocuments, setUserDocuments] = useState<any[]>([]);

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

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-10 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <header className="mb-8 sm:mb-12 text-center px-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Space Mission Licensing Portal
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-base-content/80 max-w-3xl mx-auto">
            Secure digital vault for your mission-critical documents and licenses
          </p>
        </header>

        {!isConnected ? (
          <div className="text-center py-20">
            <div className="card bg-base-200 max-w-md mx-auto p-8">
              <ShieldCheckIcon className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Connect Your Account</h2>
              <p className="text-base-content/70 mb-6">
                Please connect your account to access the licensing portal
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-8 overflow-x-auto">
              <div className="flex items-center space-x-2 sm:space-x-4 px-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setActiveTab(step.id as any)}
                      className={`flex flex-col items-center p-2 sm:p-4 rounded-lg transition-all min-w-[80px] sm:min-w-[120px] ${
                        activeTab === step.id
                          ? "bg-primary text-primary-content scale-105"
                          : "bg-base-200 hover:bg-base-300"
                      }`}
                    >
                      <step.icon className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                      <span className="text-xs sm:text-sm font-semibold text-center">{step.name}</span>
                    </button>
                    {index < steps.length - 1 && (
                      <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5 mx-1 sm:mx-2 text-base-content/50 flex-shrink-0" />
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
                onAnalysisComplete={(analysis) => {
                  console.log('Mission analysis:', analysis);
                }}
              />
              
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold mb-2">
                  {steps.find(s => s.id === activeTab)?.name}
                </h2>
                <p className="text-base-content/70">
                  {steps.find(s => s.id === activeTab)?.description}
                </p>
              </div>

              {activeTab === "wallet" && <SmartWalletCreator />}
              {activeTab === "upload" && <DocumentUploadForm />}
              {activeTab === "mint" && <DocumentMinter />}
            </div>

            <div className="mt-8 sm:mt-16 bg-base-200 p-4 sm:p-8 rounded-lg">
              <h3 className="text-xl sm:text-2xl font-bold mb-4">How It Works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="badge badge-primary">1</div>
                    <h4 className="font-semibold">Create Your Vault</h4>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Initialize a secure digital container that will hold all your mission documentation
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="badge badge-primary">2</div>
                    <h4 className="font-semibold">Upload Documents</h4>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Store launch licenses, safety reports, and compliance documents in your secure vault
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="badge badge-primary">3</div>
                    <h4 className="font-semibold">Control Access</h4>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Grant verified access to FAA, NASA, and mission partners as needed
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="alert alert-info max-w-2xl mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <span className="font-semibold">Secure Storage:</span> Documents are stored on distributed secure storage. Add your Pinata JWT to .env.local to enable uploads.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LicensingPage;
