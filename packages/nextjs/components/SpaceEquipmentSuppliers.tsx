"use client";

import React, { useEffect, useState } from "react";
import {
  Battery,
  Camera,
  ChevronRight,
  Cpu,
  DollarSign,
  ExternalLink,
  Info,
  Package,
  Radio,
  Satellite,
  Search,
  Shield,
  Star,
} from "lucide-react";

// Equipment categories based on CubeSat subsystems
const EQUIPMENT_CATEGORIES = {
  OBC: "On-Board Computer",
  EPS: "Electrical Power System",
  ADCS: "Attitude Determination and Control",
  COMM: "Communication",
  PAYLOAD: "Payload",
  STRUCTURE: "Structure",
  THERMAL: "Thermal Control",
  PROPULSION: "Propulsion",
};

interface Equipment {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  supplier: "CubeSat Shop" | "Satsearch" | "EnduroSat" | "GomSpace" | "ISIS" | "NanoAvionics";
  price?: string;
  specifications: {
    [key: string]: string | number;
  };
  compatibility: string[];
  image?: string;
  url?: string;
  inStock?: boolean;
  leadTime?: string;
  rating?: number;
  description: string;
}

// Mock data - In production, this would come from actual supplier APIs
const MOCK_EQUIPMENT_DATABASE: Equipment[] = [
  // On-Board Computers
  {
    id: "obc-1",
    name: "ISIS On-Board Computer",
    category: "OBC",
    manufacturer: "ISIS - Innovative Solutions In Space",
    supplier: "CubeSat Shop",
    price: "$8,500",
    specifications: {
      processor: "ARM Cortex-M7",
      ram: "512 MB",
      storage: "8 GB",
      power: "0.5-2W",
      interfaces: "I2C, SPI, UART, CAN",
      size: "96x90x15mm",
    },
    compatibility: ["1U", "2U", "3U", "6U", "12U"],
    description: "High-performance OBC with radiation-tolerant design",
    url: "https://www.cubesatshop.com/product/isis-obc",
    inStock: true,
    leadTime: "8-12 weeks",
    rating: 4.5,
  },
  {
    id: "obc-2",
    name: "EnduroSat OBC Type II",
    category: "OBC",
    manufacturer: "EnduroSat",
    supplier: "EnduroSat",
    price: "$6,200",
    specifications: {
      processor: "ARM Cortex-A9",
      ram: "256 MB",
      storage: "4 GB",
      power: "0.8W typical",
      interfaces: "I2C, SPI, UART, USB",
      size: "90x96x15mm",
    },
    compatibility: ["1U", "1.5U", "2U", "3U", "6U"],
    description: "Compact and efficient OBC for CubeSat missions",
    url: "https://www.endurosat.com/cubesat-store/cubesat-obc",
    inStock: true,
    leadTime: "6-10 weeks",
    rating: 4.3,
  },
  {
    id: "obc-3",
    name: "GomSpace NanoMind A3200",
    category: "OBC",
    manufacturer: "GomSpace",
    supplier: "GomSpace",
    price: "$12,000",
    specifications: {
      processor: "ARM Cortex-M4",
      ram: "1 GB",
      storage: "16 GB",
      power: "0.3-1.5W",
      interfaces: "I2C, SPI, CAN, RS485",
      size: "96x90x12.4mm",
    },
    compatibility: ["1U", "2U", "3U", "6U", "12U", "27U"],
    description: "Space-proven OBC with extensive flight heritage",
    url: "https://gomspace.com/shop/subsystems/command-and-data-handling",
    inStock: false,
    leadTime: "12-16 weeks",
    rating: 4.7,
  },

  // Electrical Power Systems
  {
    id: "eps-1",
    name: "NanoPower P31u",
    category: "EPS",
    manufacturer: "GomSpace",
    supplier: "Satsearch",
    price: "$7,800",
    specifications: {
      input: "Solar panels 6-30V",
      output: "3.3V, 5V, 12V rails",
      battery: "Li-Ion 30Wh",
      efficiency: "92%",
      channels: "8 switched outputs",
      size: "96x90x15mm",
    },
    compatibility: ["1U", "2U", "3U"],
    description: "Compact EPS with integrated battery charging",
    url: "https://satsearch.co/products/gomspace-nanopower-p31u",
    inStock: true,
    leadTime: "10-14 weeks",
    rating: 4.4,
  },
  {
    id: "eps-2",
    name: "EnduroSat 3U EPS II",
    category: "EPS",
    manufacturer: "EnduroSat",
    supplier: "EnduroSat",
    price: "$5,500",
    specifications: {
      input: "Solar panels up to 120W",
      output: "3.3V, 5V, 12V, unregulated",
      battery: "40Wh Li-Ion",
      efficiency: "95%",
      mppt: "4 channels",
      size: "90x96x20mm",
    },
    compatibility: ["3U", "6U"],
    description: "High-efficiency EPS with MPPT tracking",
    inStock: true,
    leadTime: "8-10 weeks",
    rating: 4.6,
  },

  // Communication Systems
  {
    id: "comm-1",
    name: "ISIS UHF/VHF Transceiver",
    category: "COMM",
    manufacturer: "ISIS",
    supplier: "CubeSat Shop",
    price: "$4,200",
    specifications: {
      frequency: "UHF: 435-438 MHz, VHF: 145-146 MHz",
      dataRate: "9600 bps",
      power: "2W RF output",
      sensitivity: "-120 dBm",
      interfaces: "I2C, UART",
      size: "96x90x15mm",
    },
    compatibility: ["1U", "2U", "3U", "6U"],
    description: "Reliable UHF/VHF transceiver for TT&C",
    url: "https://www.cubesatshop.com/product/isis-uhf-vhf-transceiver",
    inStock: true,
    leadTime: "8-12 weeks",
    rating: 4.5,
  },
  {
    id: "comm-2",
    name: "EnduroSat S-Band Transmitter",
    category: "COMM",
    manufacturer: "EnduroSat",
    supplier: "EnduroSat",
    price: "$8,900",
    specifications: {
      frequency: "2.2-2.3 GHz",
      dataRate: "Up to 2 Mbps",
      power: "2W RF output",
      modulation: "BPSK, QPSK",
      interfaces: "SPI, UART",
      size: "90x96x24mm",
    },
    compatibility: ["3U", "6U", "12U"],
    description: "High-speed S-band transmitter for payload data",
    inStock: false,
    leadTime: "12-16 weeks",
    rating: 4.3,
  },

  // ADCS Systems
  {
    id: "adcs-1",
    name: "CubeADCS 3-Axis Bundle",
    category: "ADCS",
    manufacturer: "CubeSpace",
    supplier: "Satsearch",
    price: "$28,000",
    specifications: {
      pointing: "1° accuracy",
      sensors: "Sun sensors, magnetometer, gyros",
      actuators: "3x reaction wheels, 3x magnetorquers",
      power: "2.5W average",
      interfaces: "I2C, CAN",
      size: "Full 1U volume",
    },
    compatibility: ["3U", "6U", "12U"],
    description: "Complete 3-axis stabilization system",
    url: "https://satsearch.co/products/cubespace-cubeadcs",
    inStock: true,
    leadTime: "14-18 weeks",
    rating: 4.6,
  },

  // Payload Equipment
  {
    id: "payload-1",
    name: "Simera Sense xScape100",
    category: "PAYLOAD",
    manufacturer: "Simera Sense",
    supplier: "Satsearch",
    price: "$45,000",
    specifications: {
      resolution: "5m GSD from 500km",
      swath: "50km",
      spectral: "RGB + NIR",
      dataInterface: "LVDS",
      power: "8W peak",
      size: "1U volume",
    },
    compatibility: ["3U", "6U", "12U"],
    description: "Multispectral imaging payload",
    inStock: false,
    leadTime: "20-24 weeks",
    rating: 4.8,
  },

  // Solar Panels
  {
    id: "eps-3",
    name: "EnduroSat 3U Solar Panel",
    category: "EPS",
    manufacturer: "EnduroSat",
    supplier: "EnduroSat",
    price: "$2,800",
    specifications: {
      power: "7W @ 28°C",
      efficiency: "30% triple junction",
      voltage: "8.4V nominal",
      dimensions: "340x100mm",
      weight: "130g",
      coating: "AR coating",
    },
    compatibility: ["3U", "6U"],
    description: "High-efficiency deployable solar panel",
    inStock: true,
    leadTime: "6-8 weeks",
    rating: 4.5,
  },

  // Antennas
  {
    id: "comm-3",
    name: "ISIS Deployable Antenna System",
    category: "COMM",
    manufacturer: "ISIS",
    supplier: "CubeSat Shop",
    price: "$1,800",
    specifications: {
      frequency: "VHF/UHF",
      elements: "4x tape spring",
      deployment: "Burn wire mechanism",
      length: "550mm deployed",
      interfaces: "I2C",
      size: "98x98x7mm stowed",
    },
    compatibility: ["1U", "2U", "3U", "6U"],
    description: "Reliable deployable antenna system",
    url: "https://www.cubesatshop.com/product/isis-antenna",
    inStock: true,
    leadTime: "8-10 weeks",
    rating: 4.7,
  },
];

export default function SpaceEquipmentSuppliers() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [equipment, setEquipment] = useState<Equipment[]>(MOCK_EQUIPMENT_DATABASE);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [missionRequirements, setMissionRequirements] = useState({
    size: "3U",
    budget: 100000,
    orbit: "LEO",
    mission: "Earth Observation",
  });
  const [recommendations, setRecommendations] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter equipment based on category and search
  useEffect(() => {
    let filtered = MOCK_EQUIPMENT_DATABASE;

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(eq => eq.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        eq =>
          eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          eq.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          eq.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setEquipment(filtered);
  }, [selectedCategory, searchQuery]);

  // Generate recommendations based on mission requirements
  useEffect(() => {
    const getRecommendations = () => {
      const recommended = MOCK_EQUIPMENT_DATABASE.filter(eq => {
        // Check compatibility with satellite size
        if (eq.compatibility && !eq.compatibility.includes(missionRequirements.size)) {
          return false;
        }

        // Basic budget filtering (in production, this would be more sophisticated)
        const price = parseInt(eq.price?.replace(/[^0-9]/g, "") || "0");
        if (price > missionRequirements.budget / 5) {
          // Assume each subsystem shouldn't exceed 20% of budget
          return false;
        }

        return true;
      });

      // Sort by rating if available
      recommended.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      setRecommendations(recommended.slice(0, 6));
    };

    getRecommendations();
  }, [missionRequirements]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "OBC":
        return <Cpu className="w-5 h-5" />;
      case "EPS":
        return <Battery className="w-5 h-5" />;
      case "COMM":
        return <Radio className="w-5 h-5" />;
      case "PAYLOAD":
        return <Camera className="w-5 h-5" />;
      case "ADCS":
        return <Satellite className="w-5 h-5" />;
      case "STRUCTURE":
        return <Package className="w-5 h-5" />;
      case "THERMAL":
        return <Shield className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const fetchFromSupplier = async (supplier: string) => {
    setIsLoading(true);
    console.log("Fetching equipment from supplier:", supplier);
    // Simulate API call to supplier
    setTimeout(() => {
      setIsLoading(false);
      // In production, this would fetch real data from supplier APIs
    }, 1000);
  };

  return (
    <div className="space-equipment-suppliers">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Space Equipment Marketplace</h2>
        <p className="text-sm opacity-70">
          Browse and compare equipment from CubeSat Shop, Satsearch, and other leading suppliers
        </p>
      </div>

      {/* Mission Requirements */}
      <div className="bg-base-100 rounded-lg p-4 mb-6">
        <h3 className="font-bold mb-3">Mission Requirements</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label label-text text-xs">Satellite Size</label>
            <select
              className="select select-sm select-bordered w-full"
              value={missionRequirements.size}
              onChange={e => setMissionRequirements({ ...missionRequirements, size: e.target.value })}
            >
              <option>1U</option>
              <option>2U</option>
              <option>3U</option>
              <option>6U</option>
              <option>12U</option>
            </select>
          </div>
          <div>
            <label className="label label-text text-xs">Budget ($)</label>
            <input
              type="number"
              className="input input-sm input-bordered w-full"
              value={missionRequirements.budget}
              onChange={e => setMissionRequirements({ ...missionRequirements, budget: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="label label-text text-xs">Orbit</label>
            <select
              className="select select-sm select-bordered w-full"
              value={missionRequirements.orbit}
              onChange={e => setMissionRequirements({ ...missionRequirements, orbit: e.target.value })}
            >
              <option>LEO</option>
              <option>SSO</option>
              <option>GEO</option>
              <option>MEO</option>
            </select>
          </div>
          <div>
            <label className="label label-text text-xs">Mission Type</label>
            <select
              className="select select-sm select-bordered w-full"
              value={missionRequirements.mission}
              onChange={e => setMissionRequirements({ ...missionRequirements, mission: e.target.value })}
            >
              <option>Earth Observation</option>
              <option>Communication</option>
              <option>Technology Demo</option>
              <option>Science</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            type="text"
            placeholder="Search equipment, manufacturers..."
            className="input input-bordered w-full pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="select select-bordered"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          {Object.entries(EQUIPMENT_CATEGORIES).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {/* Recommended Equipment */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-3">Recommended for Your Mission</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map(eq => (
              <div
                key={eq.id}
                className="card bg-success/10 border border-success/30 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedEquipment(eq)}
              >
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getCategoryIcon(eq.category)}
                        <span className="badge badge-sm badge-success">Recommended</span>
                      </div>
                      <h4 className="font-semibold text-sm">{eq.name}</h4>
                      <p className="text-xs opacity-70">{eq.manufacturer}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold">{eq.price}</span>
                        {eq.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current text-warning" />
                            <span className="text-xs">{eq.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment List */}
        <div className="lg:col-span-2">
          <div className="grid gap-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="opacity-70">No equipment found</p>
              </div>
            ) : (
              equipment.map(eq => (
                <div
                  key={eq.id}
                  className="card bg-base-100 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedEquipment(eq)}
                >
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(eq.category)}
                          <span className="badge badge-sm">
                            {EQUIPMENT_CATEGORIES[eq.category as keyof typeof EQUIPMENT_CATEGORIES]}
                          </span>
                          <span className="badge badge-sm badge-outline">{eq.supplier}</span>
                        </div>
                        <h3 className="font-bold">{eq.name}</h3>
                        <p className="text-sm opacity-70 mb-2">{eq.manufacturer}</p>
                        <p className="text-xs mb-3">{eq.description}</p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {eq.compatibility.slice(0, 3).map(compat => (
                            <span key={compat} className="badge badge-xs">
                              {compat}
                            </span>
                          ))}
                          {eq.compatibility.length > 3 && (
                            <span className="badge badge-xs">+{eq.compatibility.length - 3}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {eq.price && <span className="font-bold text-lg">{eq.price}</span>}
                            {eq.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-current text-warning" />
                                <span className="text-sm">{eq.rating}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {eq.inStock !== undefined && (
                              <span className={`badge badge-sm ${eq.inStock ? "badge-success" : "badge-warning"}`}>
                                {eq.inStock ? "In Stock" : "Pre-order"}
                              </span>
                            )}
                            {eq.leadTime && <span className="text-xs opacity-60">{eq.leadTime}</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 opacity-50" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Equipment Details */}
        <div className="lg:col-span-1">
          {selectedEquipment ? (
            <div className="card bg-base-100 sticky top-4">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title text-lg">{selectedEquipment.name}</h3>
                  <button className="btn btn-sm btn-ghost" onClick={() => setSelectedEquipment(null)}>
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Manufacturer</p>
                    <p className="text-sm opacity-70">{selectedEquipment.manufacturer}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-1">Supplier</p>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-outline">{selectedEquipment.supplier}</span>
                      {selectedEquipment.url && (
                        <a
                          href={selectedEquipment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-ghost"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {selectedEquipment.price && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Price</p>
                      <p className="text-xl font-bold text-primary">{selectedEquipment.price}</p>
                      {selectedEquipment.leadTime && (
                        <p className="text-xs opacity-60">Lead time: {selectedEquipment.leadTime}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold mb-2">Specifications</p>
                    <div className="space-y-1">
                      {Object.entries(selectedEquipment.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="opacity-70 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                          <span className="font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Compatibility</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEquipment.compatibility.map(compat => (
                        <span key={compat} className="badge badge-sm">
                          {compat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="space-y-2">
                    <button className="btn btn-primary btn-block">
                      <DollarSign className="w-4 h-4" />
                      Request Quote
                    </button>
                    <button className="btn btn-outline btn-block">
                      <Info className="w-4 h-4" />
                      Technical Datasheet
                    </button>
                  </div>

                  {/* Compatibility Check */}
                  <div className="alert alert-info">
                    <Info className="w-4 h-4" />
                    <div>
                      <p className="text-xs font-semibold">Compatibility Check</p>
                      <p className="text-xs">
                        {selectedEquipment.compatibility.includes(missionRequirements.size)
                          ? `✓ Compatible with ${missionRequirements.size} CubeSat`
                          : `⚠ May not be compatible with ${missionRequirements.size}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-base-100">
              <div className="card-body">
                <div className="text-center py-8">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm opacity-70">Select equipment to view details</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Badges */}
      <div className="mt-8 p-4 bg-base-100 rounded-lg">
        <p className="text-sm font-semibold mb-3">Trusted Suppliers</p>
        <div className="flex flex-wrap gap-3">
          {["CubeSat Shop", "Satsearch", "EnduroSat", "GomSpace", "ISIS", "NanoAvionics"].map(supplier => (
            <button key={supplier} className="btn btn-sm btn-outline" onClick={() => fetchFromSupplier(supplier)}>
              {supplier}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
