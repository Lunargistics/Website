"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

// Dynamically import components to avoid SSR issues
const SmartWalletCreator = dynamic(
  () => import("~~/components/SmartWalletCreator").then(mod => mod.SmartWalletCreator),
  { ssr: false },
);
const DocumentUploadForm = dynamic(
  () => import("~~/components/DocumentUploadForm").then(mod => mod.DocumentUploadForm),
  { ssr: false },
);
const DocumentMinter = dynamic(() => import("~~/components/DocumentMinter").then(mod => mod.DocumentMinter), {
  ssr: false,
});
const AsteroidAPI = dynamic(() => import("~~/components/AsteroidAPI").then(mod => mod.AsteroidDataFetcher), {
  ssr: false,
});
const Profile = dynamic(() => import("~~/components/Profile"), { ssr: false });
const SocialFeed = dynamic(() => import("~~/components/SocialFeed"), { ssr: false });
const SmartContractTestPanel = dynamic(() => import("~~/components/SmartContractTestPanel"), { ssr: false });

const menuItems = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "feed", label: "Social Feed", icon: "🌐" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "smart-wallets", label: "Smart Wallets", icon: "💳" },
  { id: "document-upload", label: "Document Upload", icon: "📄" },
  { id: "document-minter", label: "Document Minter", icon: "🎫" },
  { id: "asteroids", label: "Asteroids", icon: "☄️" },
  { id: "licensing", label: "Licensing", icon: "📜" },
  { id: "launches", label: "Launches", icon: "🚀" },
  { id: "activities", label: "Activities", icon: "📊" },
  { id: "logistics", label: "Logistics", icon: "📦" },
  { id: "test-panel", label: "Test Panel", icon: "🧪" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!session) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Welcome to Lunargistics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl hover:border-purple-500/50 transition-all duration-200">
                <h3 className="text-lg font-semibold mb-2 text-white">Smart Wallets</h3>
                <p className="text-gray-400">Manage your ERC-6551 smart wallets</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl hover:border-purple-500/50 transition-all duration-200">
                <h3 className="text-lg font-semibold mb-2 text-white">Documents</h3>
                <p className="text-gray-400">Upload and mint space documents as NFTs</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl hover:border-purple-500/50 transition-all duration-200">
                <h3 className="text-lg font-semibold mb-2 text-white">Asteroids</h3>
                <p className="text-gray-400">Track and trade asteroid commodities</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl hover:border-purple-500/50 transition-all duration-200">
                <h3 className="text-lg font-semibold mb-2 text-white">Launches</h3>
                <p className="text-gray-400">Monitor space launch activities</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl hover:border-purple-500/50 transition-all duration-200">
                <h3 className="text-lg font-semibold mb-2 text-white">Licensing</h3>
                <p className="text-gray-400">Manage space operation licenses</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl hover:border-purple-500/50 transition-all duration-200">
                <h3 className="text-lg font-semibold mb-2 text-white">Logistics</h3>
                <p className="text-gray-400">Track space logistics operations</p>
              </div>
            </div>
          </div>
        );
      case "feed":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Space Community Feed</h2>
            <SocialFeed />
          </div>
        );
      case "profile":
        return <Profile />;
      case "smart-wallets":
        return <SmartWalletCreator />;
      case "document-upload":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Document Upload</h2>
            <DocumentUploadForm />
          </div>
        );
      case "document-minter":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Document Minter</h2>
            <DocumentMinter />
          </div>
        );
      case "asteroids":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Asteroids</h2>
            <AsteroidAPI />
          </div>
        );
      case "licensing":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Licensing</h2>
            <iframe src="/licensing" className="w-full h-[800px] border-0 rounded-lg" title="Licensing" />
          </div>
        );
      case "launches":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Launches</h2>
            <iframe src="/launches" className="w-full h-[800px] border-0 rounded-lg" title="Launches" />
          </div>
        );
      case "activities":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Activities</h2>
            <iframe src="/activities" className="w-full h-[800px] border-0 rounded-lg" title="Activities" />
          </div>
        );
      case "logistics":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Logistics</h2>
            <iframe src="/logistics" className="w-full h-[800px] border-0 rounded-lg" title="Logistics" />
          </div>
        );
      case "test-panel":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Smart Contract Test Panel</h2>
            <SmartContractTestPanel />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`font-bold text-xl text-white ${!sidebarOpen && "hidden"}`}>Lunargistics</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition"
            >
              {sidebarOpen ? "←" : "→"}
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-purple-600/20 text-white border-l-4 border-purple-500"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span className={`text-xl ${activeTab === item.id ? "text-purple-400" : ""}`}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <div className={`${!sidebarOpen && "hidden"} mb-4`}>
            <p className="text-sm text-gray-400">Logged in as:</p>
            <p className="font-semibold text-white truncate">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 py-2 px-4 rounded-lg transition-all duration-200"
          >
            {sidebarOpen ? "Sign Out" : "↪"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto bg-gray-900">{renderContent()}</main>
    </div>
  );
}
