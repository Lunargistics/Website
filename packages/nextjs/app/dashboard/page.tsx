"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

// Dynamically import components to avoid SSR issues
const SmartWalletCreator = dynamic(() => import("~~/components/SmartWalletCreator"), { ssr: false });
const DocumentUploadForm = dynamic(() => import("~~/components/DocumentUploadForm"), { ssr: false });
const DocumentMinter = dynamic(() => import("~~/components/DocumentMinter"), { ssr: false });
const AsteroidAPI = dynamic(() => import("~~/components/AsteroidAPI").then(mod => mod.AsteroidDataFetcher), {
  ssr: false,
});
const Profile = dynamic(() => import("~~/components/Profile"), { ssr: false });
const SocialFeed = dynamic(() => import("~~/components/SocialFeed"), { ssr: false });

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Welcome to Lunar Gistics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Smart Wallets</h3>
                <p className="text-gray-600">Manage your ERC-6551 smart wallets</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Documents</h3>
                <p className="text-gray-600">Upload and mint space documents as NFTs</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Asteroids</h3>
                <p className="text-gray-600">Track and trade asteroid commodities</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Launches</h3>
                <p className="text-gray-600">Monitor space launch activities</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Licensing</h3>
                <p className="text-gray-600">Manage space operation licenses</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Logistics</h3>
                <p className="text-gray-600">Track space logistics operations</p>
              </div>
            </div>
          </div>
        );
      case "feed":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Space Community Feed</h2>
            <SocialFeed />
          </div>
        );
      case "profile":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Your Profile</h2>
            <Profile />
          </div>
        );
      case "smart-wallets":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Smart Wallets</h2>
            <SmartWalletCreator />
          </div>
        );
      case "document-upload":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Document Upload</h2>
            <DocumentUploadForm />
          </div>
        );
      case "document-minter":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Document Minter</h2>
            <DocumentMinter />
          </div>
        );
      case "asteroids":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Asteroids</h2>
            <AsteroidAPI />
          </div>
        );
      case "licensing":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Licensing</h2>
            <iframe src="/licensing" className="w-full h-[800px] border-0 rounded-lg" title="Licensing" />
          </div>
        );
      case "launches":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Launches</h2>
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-indigo-900 text-white transition-all duration-300 ease-in-out`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`font-bold text-xl ${!sidebarOpen && "hidden"}`}>Lunar Gistics</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-indigo-800 p-2 rounded-lg transition"
            >
              {sidebarOpen ? "←" : "→"}
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeTab === item.id ? "bg-indigo-800 text-white" : "hover:bg-indigo-800 text-indigo-100"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-indigo-800">
          <div className={`${!sidebarOpen && "hidden"} mb-4`}>
            <p className="text-sm text-indigo-200">Logged in as:</p>
            <p className="font-semibold">{session.user.username}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition"
          >
            {sidebarOpen ? "Sign Out" : "↪"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">{renderContent()}</main>
    </div>
  );
}
