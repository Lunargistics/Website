"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

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
const LicensingDashboard = dynamic(
  () => import("~~/components/dashboard/LicensingDashboard").then(mod => mod.LicensingDashboard),
  { ssr: false },
);
const LogisticsDashboard = dynamic(
  () => import("~~/components/dashboard/LogisticsDashboard").then(mod => mod.LogisticsDashboard),
  { ssr: false },
);
const ActivitiesDashboard = dynamic(
  () => import("~~/components/dashboard/ActivitiesDashboard").then(mod => mod.ActivitiesDashboard),
  { ssr: false },
);
const LaunchesDashboard = dynamic(
  () => import("~~/components/dashboard/LaunchesDashboard").then(mod => mod.LaunchesDashboard),
  { ssr: false },
);
const MissionPlanningDashboard = dynamic(
  () => import("~~/components/dashboard/MissionPlanningDashboard").then(mod => mod.MissionPlanningDashboard),
  { ssr: false },
);
const ImplementSpace = dynamic(() => import("../implement-space/page"), { ssr: false });
const CreditsManager = dynamic(() => import("~~/components/CreditsManager"), { ssr: false });
// const CreditNotifications = dynamic(() => import("~~/components/CreditNotifications"), { ssr: false });
const SpaceEngineerDashboard = dynamic(
  () => import("~~/components/dashboard/SpaceEngineerDashboard").then(mod => mod.default),
  {
    ssr: false,
  },
);

const menuCategories = [
  {
    name: "Main",
    items: [
      { id: "overview", label: "Overview", icon: "🏠" },
      { id: "space-engineer", label: "Space Engineer", icon: "🛰️" },
      { id: "profile", label: "Profile", icon: "👤" },
      { id: "feed", label: "Social Feed", icon: "🌐" },
    ],
  },
  {
    name: "Mission & Operations",
    items: [
      { id: "mission-planning", label: "Mission Planning", icon: "🛸" },
      { id: "implement-space", label: "Implement Space", icon: "✨" },
      { id: "launches", label: "Launches", icon: "🚀" },
      { id: "activities", label: "Activities", icon: "📊" },
    ],
  },
  {
    name: "Assets & Finance",
    items: [
      { id: "credits", label: "Credits", icon: "⚡" },
      { id: "smart-wallets", label: "Smart Wallets", icon: "💳" },
      { id: "asteroids", label: "Asteroids", icon: "☄️" },
      { id: "outputs", label: "My Outputs", icon: "📊" },
    ],
  },
  {
    name: "Documents & Legal",
    items: [
      { id: "document-upload", label: "Document Upload", icon: "📄" },
      { id: "document-minter", label: "Document Minter", icon: "🎫" },
      { id: "licensing", label: "Licensing", icon: "📜" },
      { id: "logistics", label: "Logistics", icon: "📦" },
    ],
  },
  {
    name: "Developer",
    items: [{ id: "test-panel", label: "Test Panel", icon: "🧪" }],
  },
];

export default function DashboardPage() {
  const { ready, authenticated, login } = usePrivy();
  const _router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Main"]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      // Open Privy login and stay on the page
      try {
        login();
      } catch {}
    }
  }, [ready, authenticated, login]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!authenticated) return null;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => (prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]));
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <SpaceEngineerDashboard />;
      case "space-engineer":
        return <SpaceEngineerDashboard />;
      case "mission-planning":
        return <MissionPlanningDashboard />;
      case "implement-space":
        return (
          <div className="space-y-6">
            <ImplementSpace />
          </div>
        );
      case "credits":
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Credits Management</h2>
            <CreditsManager />
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
      case "outputs":
        const UserOutputHistory = dynamic(() => import("~~/components/UserOutputHistory"), { ssr: false });
        return <UserOutputHistory />;
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
        return <LicensingDashboard />;
      case "launches":
        return <LaunchesDashboard />;
      case "activities":
        return <ActivitiesDashboard />;
      case "logistics":
        return <LogisticsDashboard />;
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
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out flex flex-col`}
      >
        <div className="flex-1 overflow-y-auto">
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

            <nav className="space-y-4">
              {menuCategories.map(category => (
                <div key={category.name}>
                  {sidebarOpen ? (
                    <>
                      <button
                        onClick={() => toggleCategory(category.name)}
                        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition"
                      >
                        <span>{category.name}</span>
                        <span className="text-gray-600">{expandedCategories.includes(category.name) ? "−" : "+"}</span>
                      </button>
                      {expandedCategories.includes(category.name) && (
                        <div className="mt-2 space-y-1">
                          {category.items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                                activeTab === item.id
                                  ? "bg-purple-600/20 text-white border-l-4 border-purple-500"
                                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
                              }`}
                            >
                              <span className={`text-lg ${activeTab === item.id ? "text-purple-400" : ""}`}>
                                {item.icon}
                              </span>
                              <span className="text-sm">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1">
                      {category.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          title={item.label}
                          className={`w-full flex items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 ${
                            activeTab === item.id
                              ? "bg-purple-600/20 text-purple-400 border-l-4 border-purple-500"
                              : "text-gray-400 hover:bg-gray-700 hover:text-white"
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className={`${!sidebarOpen && "hidden"} mb-2`}>
            <p className="text-xs text-gray-400">Logged in as:</p>
            <p className="text-sm font-semibold text-white truncate">Privy user</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto bg-gray-900">{renderContent()}</main>

      {/* Credit Notifications - optional until user IDs are wired through Privy */}
      {/* <CreditNotifications userId={privyUserId} /> */}
    </div>
  );
}
