"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Code,
  DollarSign,
  Download,
  Globe,
  MapPin,
  Package,
  Plus,
  Radio,
  Satellite,
  Search,
  Shield,
  Star,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";

// PNT Element Types matching the contract
enum ElementType {
  GPS_WIDGET,
  GALILEO_WIDGET,
  GLONASS_WIDGET,
  BEIDOU_WIDGET,
  TIMING_SYNC,
  ORBIT_TRACKER,
  GROUND_STATION,
  SIGNAL_PROCESSOR,
  CUSTOM_ALGORITHM,
}

interface SpaceElement {
  tokenId: string;
  creator: string;
  elementType: ElementType;
  name: string;
  description: string;
  widgetCode: string;
  documentation: string;
  version: number;
  createdAt: number;
  lastUpdated: number;
  isActive: boolean;
  usageCount: number;
  rating: number;
  ratingCount: number;
  price?: string;
  imageUrl?: string;
}

interface MarketplaceStats {
  totalElements: number;
  totalVolume: string;
  totalCreators: number;
  avgRating: number;
}

const elementTypeIcons = {
  [ElementType.GPS_WIDGET]: Satellite,
  [ElementType.GALILEO_WIDGET]: Globe,
  [ElementType.GLONASS_WIDGET]: Radio,
  [ElementType.BEIDOU_WIDGET]: MapPin,
  [ElementType.TIMING_SYNC]: Zap,
  [ElementType.ORBIT_TRACKER]: TrendingUp,
  [ElementType.GROUND_STATION]: Shield,
  [ElementType.SIGNAL_PROCESSOR]: Code,
  [ElementType.CUSTOM_ALGORITHM]: Package,
};

const elementTypeNames = {
  [ElementType.GPS_WIDGET]: "GPS Widget",
  [ElementType.GALILEO_WIDGET]: "Galileo Widget",
  [ElementType.GLONASS_WIDGET]: "GLONASS Widget",
  [ElementType.BEIDOU_WIDGET]: "BeiDou Widget",
  [ElementType.TIMING_SYNC]: "Timing Sync",
  [ElementType.ORBIT_TRACKER]: "Orbit Tracker",
  [ElementType.GROUND_STATION]: "Ground Station",
  [ElementType.SIGNAL_PROCESSOR]: "Signal Processor",
  [ElementType.CUSTOM_ALGORITHM]: "Custom Algorithm",
};

export default function PNTMarketplacePage() {
  const { status } = useSession();
  const router = useRouter();
  const { isConnected } = useAccount();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ElementType | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "rating" | "price">("newest");
  const [spaceElements, setSpaceElements] = useState<SpaceElement[]>([]);
  const [marketStats, setMarketStats] = useState<MarketplaceStats>({
    totalElements: 0,
    totalVolume: "0",
    totalCreators: 0,
    avgRating: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SpaceElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for creating new element
  const [newElement, setNewElement] = useState({
    elementType: ElementType.GPS_WIDGET,
    name: "",
    description: "",
    widgetCode: "",
    documentation: "",
    price: "0.01",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Load mock data for demonstration
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock space elements for demonstration
    const mockElements: SpaceElement[] = [
      {
        tokenId: "1",
        creator: "0x1234...5678",
        elementType: ElementType.GPS_WIDGET,
        name: "Advanced GPS Tracker",
        description: "High-precision GPS tracking widget with real-time updates and predictive algorithms",
        widgetCode: "QmX...abc",
        documentation: "QmY...def",
        version: 3,
        createdAt: Date.now() - 86400000 * 5,
        lastUpdated: Date.now() - 86400000,
        isActive: true,
        usageCount: 152,
        rating: 920,
        ratingCount: 45,
        price: "0.05",
        imageUrl: "/images/gps-widget.png",
      },
      {
        tokenId: "2",
        creator: "0x8765...4321",
        elementType: ElementType.ORBIT_TRACKER,
        name: "Multi-Satellite Orbit Predictor",
        description: "Track and predict orbits for multiple satellites simultaneously with SGP4/SDP4 models",
        widgetCode: "QmZ...ghi",
        documentation: "QmA...jkl",
        version: 2,
        createdAt: Date.now() - 86400000 * 10,
        lastUpdated: Date.now() - 86400000 * 2,
        isActive: true,
        usageCount: 89,
        rating: 850,
        ratingCount: 28,
        price: "0.08",
        imageUrl: "/images/orbit-tracker.png",
      },
      {
        tokenId: "3",
        creator: "0xabcd...efgh",
        elementType: ElementType.TIMING_SYNC,
        name: "Atomic Clock Synchronizer",
        description: "Synchronize with atomic clock references for ultra-precise timing applications",
        widgetCode: "QmB...mno",
        documentation: "QmC...pqr",
        version: 1,
        createdAt: Date.now() - 86400000 * 3,
        lastUpdated: Date.now() - 86400000 * 3,
        isActive: true,
        usageCount: 234,
        rating: 950,
        ratingCount: 67,
        price: "0.12",
        imageUrl: "/images/timing-sync.png",
      },
      {
        tokenId: "4",
        creator: "0x9876...5432",
        elementType: ElementType.SIGNAL_PROCESSOR,
        name: "GNSS Signal Analyzer",
        description: "Advanced signal processing for GNSS data with noise reduction and multipath mitigation",
        widgetCode: "QmD...stu",
        documentation: "QmE...vwx",
        version: 4,
        createdAt: Date.now() - 86400000 * 15,
        lastUpdated: Date.now() - 86400000 * 4,
        isActive: true,
        usageCount: 178,
        rating: 880,
        ratingCount: 52,
        price: "0.10",
        imageUrl: "/images/signal-processor.png",
      },
      {
        tokenId: "5",
        creator: "0xfedc...ba98",
        elementType: ElementType.GROUND_STATION,
        name: "Virtual Ground Station Controller",
        description: "Complete ground station management system with automated tracking and data acquisition",
        widgetCode: "QmF...yz1",
        documentation: "QmG...234",
        version: 2,
        createdAt: Date.now() - 86400000 * 7,
        lastUpdated: Date.now() - 86400000 * 1,
        isActive: true,
        usageCount: 45,
        rating: 900,
        ratingCount: 19,
        price: "0.15",
        imageUrl: "/images/ground-station.png",
      },
    ];

    setSpaceElements(mockElements);
    setMarketStats({
      totalElements: mockElements.length,
      totalVolume: "2.45",
      totalCreators: 5,
      avgRating: 880,
    });
    setIsLoading(false);
  };

  const handleCreateElement = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Here you would call the smart contract to create the NFT
    toast.success("SpaceElement NFT created successfully!");
    setShowCreateModal(false);

    // Reset form
    setNewElement({
      elementType: ElementType.GPS_WIDGET,
      name: "",
      description: "",
      widgetCode: "",
      documentation: "",
      price: "0.01",
    });
  };

  const handlePurchaseElement = async (element: SpaceElement) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Here you would call the smart contract to purchase the NFT
    toast.success(`Purchased ${element.name} successfully!`);
  };

  const filteredElements = spaceElements
    .filter(element => {
      if (selectedType !== null && element.elementType !== selectedType) return false;
      if (
        searchQuery &&
        !element.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !element.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "popular":
          return b.usageCount - a.usageCount;
        case "rating":
          return b.rating - a.rating;
        case "price":
          return parseFloat(a.price || "0") - parseFloat(b.price || "0");
        default:
          return 0;
      }
    });

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Satellite className="w-10 h-10 text-purple-400" />
            PNT SpaceElements Marketplace
          </h1>
          <p className="text-xl text-purple-200">
            Buy, sell, and deploy Position Navigation Timing widgets as NFTs with built-in royalties
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-purple-200 text-sm">Total Elements</p>
                <p className="text-2xl font-bold text-white">{marketStats.totalElements}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-purple-200 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-white">{marketStats.totalVolume} ETH</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-purple-200 text-sm">Creators</p>
                <p className="text-2xl font-bold text-white">{marketStats.totalCreators}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-purple-200 text-sm">Avg Rating</p>
                <p className="text-2xl font-bold text-white">{(marketStats.avgRating / 10).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8 border border-purple-500/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="text"
                  placeholder="Search SpaceElements..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <select
              value={selectedType === null ? "" : selectedType}
              onChange={e => setSelectedType(e.target.value === "" ? null : parseInt(e.target.value))}
              className="px-4 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="">All Types</option>
              {Object.entries(elementTypeNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Price: Low to High</option>
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Element
            </button>
          </div>
        </div>

        {/* Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredElements.map(element => {
            const Icon = elementTypeIcons[element.elementType];
            return (
              <div
                key={element.tokenId}
                className="bg-white/10 backdrop-blur-lg rounded-lg border border-purple-500/20 overflow-hidden hover:border-purple-400/50 transition-all cursor-pointer"
                onClick={() => setSelectedElement(element)}
              >
                <div className="h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                  <Icon className="w-24 h-24 text-purple-400" />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-white flex-1">{element.name}</h3>
                    <span className="text-xs bg-purple-600/30 text-purple-200 px-2 py-1 rounded-full">
                      v{element.version}
                    </span>
                  </div>

                  <p className="text-sm text-purple-200 mb-3 line-clamp-2">{element.description}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-white/10 text-purple-200 px-2 py-1 rounded">
                      {elementTypeNames[element.elementType]}
                    </span>
                    <span className="text-xs text-purple-300">{element.usageCount} uses</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white">
                        {(element.rating / 10).toFixed(1)}% ({element.ratingCount})
                      </span>
                    </div>
                    <span className="text-xs text-purple-300">by {element.creator.slice(0, 6)}...</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-white">{element.price} ETH</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handlePurchaseElement(element);
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredElements.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No SpaceElements Found</h3>
            <p className="text-purple-200">Try adjusting your filters or create the first one!</p>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Create New SpaceElement NFT</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Element Type</label>
                  <select
                    value={newElement.elementType}
                    onChange={e => setNewElement({ ...newElement, elementType: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    {Object.entries(elementTypeNames).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={newElement.name}
                    onChange={e => setNewElement({ ...newElement, name: e.target.value })}
                    placeholder="Enter element name"
                    className="w-full px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-2">Description</label>
                  <textarea
                    value={newElement.description}
                    onChange={e => setNewElement({ ...newElement, description: e.target.value })}
                    placeholder="Describe your SpaceElement..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-2">Widget Code (IPFS Hash)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newElement.widgetCode}
                      onChange={e => setNewElement({ ...newElement, widgetCode: e.target.value })}
                      placeholder="QmX..."
                      className="flex-1 px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                    />
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-2">Documentation (IPFS Hash)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newElement.documentation}
                      onChange={e => setNewElement({ ...newElement, documentation: e.target.value })}
                      placeholder="QmY..."
                      className="flex-1 px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                    />
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-2">Initial Price (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newElement.price}
                    onChange={e => setNewElement({ ...newElement, price: e.target.value })}
                    placeholder="0.01"
                    className="w-full px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-sm text-purple-200">
                    <strong>Royalty Info:</strong> You will receive 7.5% royalties on all secondary sales of this
                    SpaceElement NFT, automatically enforced through ERC2981 and SeaPort protocol.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateElement}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Create & Mint NFT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Element Detail Modal */}
        {selectedElement && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedElement.name}</h2>
                <button
                  onClick={() => setSelectedElement(null)}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="h-64 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg flex items-center justify-center mb-4">
                    {(() => {
                      const Icon = elementTypeIcons[selectedElement.elementType];
                      return <Icon className="w-32 h-32 text-purple-400" />;
                    })()}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200">Type:</span>
                      <span className="text-white">{elementTypeNames[selectedElement.elementType]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200">Version:</span>
                      <span className="text-white">v{selectedElement.version}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200">Creator:</span>
                      <span className="text-white font-mono text-sm">{selectedElement.creator}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200">Usage Count:</span>
                      <span className="text-white">{selectedElement.usageCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200">Rating:</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-white">
                          {(selectedElement.rating / 10).toFixed(1)}% ({selectedElement.ratingCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Description</h3>
                    <p className="text-purple-200">{selectedElement.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Technical Details</h3>
                    <div className="space-y-2">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-purple-300 mb-1">Widget Code (IPFS)</p>
                        <p className="text-white font-mono text-sm break-all">{selectedElement.widgetCode}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-purple-300 mb-1">Documentation (IPFS)</p>
                        <p className="text-white font-mono text-sm break-all">{selectedElement.documentation}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Price & Purchase</h3>
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-white">{selectedElement.price} ETH</span>
                        <span className="text-sm text-purple-200">+ 7.5% creator royalty</span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            handlePurchaseElement(selectedElement);
                            setSelectedElement(null);
                          }}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                        >
                          <DollarSign className="w-5 h-5" />
                          Purchase NFT
                        </button>
                        <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                          <Download className="w-5 h-5" />
                          Docs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
