"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { 
  PlusCircle, Upload, Download, Save, Play, Pause, Settings, 
  FileText, Rocket, Globe, Satellite as SatelliteIcon, CheckCircle, 
  XCircle, AlertCircle, Eye, FileCode, Database, Map
} from "lucide-react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { formatEther, parseEther } from "viem";

// Mock types for now
interface MissionData {
  id: string;
  name: string;
  description: string;
}

interface OrbitData {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
}

interface EquipmentData {
  id: string;
  name: string;
  type: string;
}

interface OrbitalElements {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  raan: number;
  argumentOfPerigee: number;
  trueAnomaly: number;
}

interface GroundStation {
  name: string;
  latitude: number;
  longitude: number;
}

interface StateVector {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
}

// Mock services
const pinataService = {
  uploadMissionData: async (data: any) => ({ cid: "mock-cid" }),
  getMissionData: async (cid: string) => ({} as MissionData),
};

const orbitService = {
  calculateOrbit: (elements: OrbitalElements) => ({ position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 } }),
  propagateOrbit: (state: StateVector, time: number) => state,
};

const documentGenerator = {
  generateMissionDocument: (data: any) => "# Mission Document\n\nGenerated document content...",
};

// Mission phases and types
enum MissionPhase {
  PrePhaseA = "Pre-Phase A",
  PhaseA = "Phase A",
  PhaseB = "Phase B",
  PhaseC = "Phase C",
  PhaseD = "Phase D",
  PhaseE = "Phase E",
  PhaseF = "Phase F",
  Completed = "Completed",
  Cancelled = "Cancelled"
}

enum MissionType {
  EarthObservation = "Earth Observation",
  Communications = "Communications",
  Science = "Science",
  Navigation = "Navigation",
  Technology = "Technology",
  HumanSpaceflight = "Human Spaceflight",
  Exploration = "Exploration",
  Commercial = "Commercial"
}

interface MissionDesign {
  name: string;
  type: MissionType;
  description: string;
  objectives: string[];
  launchDate: string;
  endDate: string;
  orbit?: OrbitalElements;
  tle?: { line1: string; line2: string };
  equipment: any[];
  groundStations: GroundStation[];
  requirements: { id: string; description: string; verified: boolean }[];
  phase: MissionPhase;
  budget: {
    total: number;
    allocated: number;
    spent: number;
  };
}

const subTabs = [
  { id: "design", label: "Mission Design", icon: Settings },
  { id: "orbit", label: "Orbit Analysis", icon: Globe },
  { id: "equipment", label: "Equipment", icon: SatelliteIcon },
  { id: "ait", label: "AIT Planning", icon: CheckCircle },
  { id: "compliance", label: "Compliance", icon: FileText },
  { id: "visualization", label: "3D View", icon: Eye },
  { id: "icd", label: "ICD & Drivers", icon: FileCode },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "api", label: "API & Export", icon: Database },
];

export const MissionPlanningDashboard = () => {
  const { address } = useAccount();
  const [activeSubTab, setActiveSubTab] = useState("design");
  const [mission, setMission] = useState<MissionDesign>({
    name: "",
    type: MissionType.EarthObservation,
    description: "",
    objectives: [],
    launchDate: "",
    endDate: "",
    equipment: [],
    groundStations: [],
    requirements: [],
    phase: MissionPhase.PrePhaseA,
    budget: { total: 0, allocated: 0, spent: 0 }
  });
  
  const [satellites, setSatellites] = useState<any[]>([]);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string | undefined>();
  const [simulationTime, setSimulationTime] = useState(new Date());
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(60);
  
  const [tleInput, setTleInput] = useState({ line1: "", line2: "" });
  const [orbitalElements, setOrbitalElements] = useState<OrbitalElements | null>(null);
  const [groundTrack, setGroundTrack] = useState<any[]>([]);
  const [accessWindows, setAccessWindows] = useState<any[]>([]);
  
  const [selectedEquipment, setSelectedEquipment] = useState<Set<number>>(new Set());
  const [aitTasks, setAitTasks] = useState<any[]>([]);
  const [complianceChecklists, setComplianceChecklists] = useState<any[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");

  // Contract hooks
  const { writeContractAsync: writeMissionRegistry } = useScaffoldWriteContract("MissionRegistry");
  const { writeContractAsync: writeEquipmentNFT } = useScaffoldWriteContract("SpaceEquipmentNFT");
  const { writeContractAsync: writeStandardsCompliance } = useScaffoldWriteContract("StandardsCompliance");

  // Simulation loop
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimulationTime(prev => new Date(prev.getTime() + simulationSpeed * 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed]);

  // Parse TLE
  const handleTLEParse = useCallback(() => {
    if (!tleInput.line1 || !tleInput.line2) return;
    
    try {
      const state = orbitService.propagateFromTLE(tleInput.line1, tleInput.line2, new Date());
      const elements = orbitService.stateToElements(state);
      setOrbitalElements(elements);
      
      setSatellites([{
        id: "main",
        name: mission.name || "Satellite",
        tle: tleInput,
        color: "#00ff00",
        showOrbit: true,
        showGroundTrack: true,
        showSensorCone: true,
        sensorFOV: 15
      }]);
      
      const satrec = orbitService.parseTLE(tleInput.line1, tleInput.line2);
      const track = orbitService.calculateGroundTrack(
        satrec,
        new Date(),
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        5
      );
      setGroundTrack(track);
      
      if (mission.groundStations.length > 0) {
        const windows = mission.groundStations.flatMap(station =>
          orbitService.calculateAccess(
            satrec,
            station,
            new Date(),
            new Date(Date.now() + 24 * 60 * 60 * 1000),
            10
          )
        );
        setAccessWindows(windows);
      }
    } catch (error) {
      console.error("Error parsing TLE:", error);
    }
  }, [tleInput, mission.name, mission.groundStations]);

  // Save mission
  const handleSaveMission = async () => {
    if (!address) {
      setSaveStatus("Please connect wallet");
      return;
    }
    
    setIsSaving(true);
    setSaveStatus("Saving to IPFS...");
    
    try {
      const missionData: MissionData = {
        name: mission.name,
        type: mission.type,
        description: mission.description,
        objectives: mission.objectives,
        phases: Object.values(MissionPhase).map(phase => ({
          name: phase,
          startDate: mission.launchDate,
          endDate: mission.endDate,
          status: phase === mission.phase ? "active" : "pending"
        })),
        equipment: mission.equipment,
        orbit: orbitalElements || undefined,
        groundStations: mission.groundStations,
        requirements: mission.requirements,
        aitPlan: aitTasks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const ipfsHash = await pinataService.pinMissionData(missionData);
      setSaveStatus("Saved to IPFS! Creating on-chain record...");
      
      let orbitHash = "";
      if (tleInput.line1 && tleInput.line2) {
        const orbitData: OrbitData = {
          tle: tleInput,
          propagatedStates: groundTrack.map(point => ({
            epoch: point.timestamp.toISOString(),
            position: [point.latitude, point.longitude, point.altitude],
            velocity: [0, 0, 0]
          }))
        };
        orbitHash = await pinataService.pinOrbitData(orbitData, mission.name);
      }
      
      const tx = await writeMissionRegistry({
        functionName: "createMission",
        args: [
          mission.name,
          Object.values(MissionType).indexOf(mission.type),
          ipfsHash,
          BigInt(new Date(mission.launchDate).getTime() / 1000),
          BigInt(new Date(mission.endDate).getTime() / 1000)
        ]
      });
      
      setSaveStatus("Mission created successfully!");
      
      if (orbitHash && tx) {
        await writeMissionRegistry({
          functionName: "updateOrbitData",
          args: [1n, orbitHash]
        });
      }
    } catch (error) {
      console.error("Error saving mission:", error);
      setSaveStatus("Error saving mission");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(""), 5000);
    }
  };

  // Generate document
  const handleGenerateDocument = async (docType: string) => {
    const metadata = {
      title: `${mission.name} ${docType}`,
      type: docType as any,
      version: "1.0",
      date: new Date().toISOString(),
      authors: ["Mission Planning Suite"],
      reviewers: [],
      approvers: [],
      status: "Draft" as any
    };

    let content = "";
    switch (docType) {
      case "PDR":
        content = documentGenerator.generatePDR(
          mission as any,
          { tle: tleInput } as any,
          [],
          metadata
        );
        break;
      case "CDR":
        content = documentGenerator.generateCDR(
          mission as any,
          { tle: tleInput } as any,
          [],
          aitTasks,
          metadata
        );
        break;
      case "FRR":
        content = documentGenerator.generateFRR(
          mission as any,
          new Date(mission.launchDate),
          mission.groundStations,
          metadata
        );
        break;
    }

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mission.name}_${docType}_${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Rocket className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Mission Planning Suite</h2>
              <p className="text-sm text-gray-400">End-to-end mission design and analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Simulation controls */}
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className="p-1 hover:bg-gray-600 rounded text-white"
              >
                {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <select
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="bg-transparent text-sm text-white border-0 focus:ring-0"
              >
                <option value="1">1x</option>
                <option value="60">60x</option>
                <option value="3600">3600x</option>
              </select>
              <span className="text-xs text-gray-400">{simulationTime.toUTCString()}</span>
            </div>
            
            <button
              onClick={handleSaveMission}
              disabled={isSaving || !mission.name}
              className="btn btn-sm btn-primary"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        
        {saveStatus && (
          <div className="p-2 bg-blue-900 text-blue-300 rounded">
            {saveStatus}
          </div>
        )}
        
        {/* Sub-tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeSubTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Mission Design Tab */}
        {activeSubTab === "design" && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Mission Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Mission Name</label>
                  <input
                    type="text"
                    value={mission.name}
                    onChange={(e) => setMission({ ...mission, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Enter mission name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Mission Type</label>
                  <select
                    value={mission.type}
                    onChange={(e) => setMission({ ...mission, type: e.target.value as MissionType })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    {Object.values(MissionType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Current Phase</label>
                  <select
                    value={mission.phase}
                    onChange={(e) => setMission({ ...mission, phase: e.target.value as MissionPhase })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    {Object.values(MissionPhase).map(phase => (
                      <option key={phase} value={phase}>{phase}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea
                    value={mission.description}
                    onChange={(e) => setMission({ ...mission, description: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    rows={3}
                    placeholder="Mission description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Launch Date</label>
                    <input
                      type="datetime-local"
                      value={mission.launchDate}
                      onChange={(e) => setMission({ ...mission, launchDate: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={mission.endDate}
                      onChange={(e) => setMission({ ...mission, endDate: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Mission Objectives */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Mission Objectives</h3>
                
                <div className="space-y-2">
                  {mission.objectives.map((obj, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-1 p-2 bg-gray-700 rounded text-white">{obj}</span>
                      <button
                        onClick={() => {
                          const newObjectives = [...mission.objectives];
                          newObjectives.splice(i, 1);
                          setMission({ ...mission, objectives: newObjectives });
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add objective"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        const input = e.target as HTMLInputElement;
                        if (input.value) {
                          setMission({ 
                            ...mission, 
                            objectives: [...mission.objectives, input.value]
                          });
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <button className="btn btn-primary">
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Budget */}
                <div className="mt-6">
                  <h4 className="font-medium text-white mb-3">Budget</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Total Budget:</span>
                      <input
                        type="number"
                        value={mission.budget.total}
                        onChange={(e) => setMission({
                          ...mission,
                          budget: { ...mission.budget, total: Number(e.target.value) }
                        })}
                        className="w-32 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-right"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Allocated:</span>
                      <span className="font-medium text-white">${mission.budget.allocated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Spent:</span>
                      <span className="font-medium text-white">${mission.budget.spent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ground Stations */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ground Stations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {mission.groundStations.map((station, i) => (
                  <div key={i} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-white">{station.name}</span>
                      <button
                        onClick={() => {
                          const newStations = [...mission.groundStations];
                          newStations.splice(i, 1);
                          setMission({ ...mission, groundStations: newStations });
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">
                      <div>Lat: {station.latitude}°</div>
                      <div>Lon: {station.longitude}°</div>
                      <div>Elev: {station.elevation}m</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => {
                  const name = prompt("Station name:");
                  const lat = prompt("Latitude:");
                  const lon = prompt("Longitude:");
                  const elev = prompt("Elevation (m):");
                  
                  if (name && lat && lon && elev) {
                    setMission({
                      ...mission,
                      groundStations: [...mission.groundStations, {
                        name,
                        latitude: Number(lat),
                        longitude: Number(lon),
                        elevation: Number(elev),
                        minElevationAngle: 5
                      }]
                    });
                  }
                }}
                className="btn btn-sm btn-primary"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Ground Station
              </button>
            </div>
          </div>
        )}
        
        {/* Orbit Analysis Tab */}
        {activeSubTab === "orbit" && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TLE Input */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">TLE Input</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Line 1</label>
                    <input
                      type="text"
                      value={tleInput.line1}
                      onChange={(e) => setTleInput({ ...tleInput, line1: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-xs"
                      placeholder="1 25544U 98067A   21321.23456789  .00001234  00000-0  12345-4 0  9999"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Line 2</label>
                    <input
                      type="text"
                      value={tleInput.line2}
                      onChange={(e) => setTleInput({ ...tleInput, line2: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-xs"
                      placeholder="2 25544  51.6442 123.4567 0001234  45.6789 314.5678 15.48919393123456"
                    />
                  </div>
                  
                  <button
                    onClick={handleTLEParse}
                    className="btn btn-primary w-full"
                  >
                    Parse TLE & Calculate Orbit
                  </button>
                </div>
                
                {/* Sample TLEs */}
                <div className="mt-6">
                  <h4 className="font-medium text-white mb-2">Sample TLEs</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setTleInput({
                        line1: "1 25544U 98067A   21321.23456789  .00001234  00000-0  12345-4 0  9999",
                        line2: "2 25544  51.6442 123.4567 0001234  45.6789 314.5678 15.48919393123456"
                      })}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
                    >
                      ISS
                    </button>
                    <button
                      onClick={() => setTleInput({
                        line1: "1 43013U 17073A   21321.23456789  .00000123  00000-0  12345-5 0  9999",
                        line2: "2 43013  97.4567 123.4567 0001234  90.1234 270.1234 15.20123456789012"
                      })}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
                    >
                      Sun-Synchronous
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Orbital Elements */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Orbital Elements</h3>
                
                {orbitalElements ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Semi-major Axis:</span>
                      <span className="font-medium text-white">{orbitalElements.semiMajorAxis.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Eccentricity:</span>
                      <span className="font-medium text-white">{orbitalElements.eccentricity.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Inclination:</span>
                      <span className="font-medium text-white">{orbitalElements.inclination.toFixed(2)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">RAAN:</span>
                      <span className="font-medium text-white">{orbitalElements.raan.toFixed(2)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Arg of Perigee:</span>
                      <span className="font-medium text-white">{orbitalElements.argumentOfPerigee.toFixed(2)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">True Anomaly:</span>
                      <span className="font-medium text-white">{orbitalElements.trueAnomaly.toFixed(2)}°</span>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Altitude:</span>
                        <span className="font-medium text-white">{(orbitalElements.semiMajorAxis - 6371).toFixed(2)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Period:</span>
                        <span className="font-medium text-white">
                          {(2 * Math.PI * Math.sqrt(Math.pow(orbitalElements.semiMajorAxis, 3) / 398600.4418) / 60).toFixed(2)} min
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No orbital elements calculated yet
                  </div>
                )}
              </div>
            </div>
            
            {/* Access Windows */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ground Station Access Windows</h3>
              
              {accessWindows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="pb-2">Ground Station</th>
                        <th className="pb-2">AOS</th>
                        <th className="pb-2">LOS</th>
                        <th className="pb-2">Duration</th>
                        <th className="pb-2">Max Elevation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessWindows.slice(0, 10).map((window, i) => (
                        <tr key={i} className="text-white border-b border-gray-700">
                          <td className="py-2">{window.groundStation}</td>
                          <td className="py-2">{new Date(window.aos).toLocaleString()}</td>
                          <td className="py-2">{new Date(window.los).toLocaleString()}</td>
                          <td className="py-2">{Math.floor(window.duration / 60)} min {Math.floor(window.duration % 60)} sec</td>
                          <td className="py-2">{window.maxElevation.toFixed(1)}°</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {mission.groundStations.length === 0
                    ? "Add ground stations to calculate access windows"
                    : "Parse TLE to calculate access windows"}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Equipment Tab */}
        {activeSubTab === "equipment" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Equipment Selection</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["Bus", "Payload", "Power System", "Propulsion", "Communication"].map(category => (
                <div key={category} className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">{category}</h4>
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <label key={`${category}_${i}`} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEquipment.has(i)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedEquipment);
                            if (e.target.checked) {
                              newSelected.add(i);
                            } else {
                              newSelected.delete(i);
                            }
                            setSelectedEquipment(newSelected);
                          }}
                          className="checkbox checkbox-primary"
                        />
                        <span className="text-sm text-gray-300">Component {i}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="font-medium text-white mb-3">Configuration Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-400">Total Mass:</span>
                  <p className="text-xl font-bold text-white">{selectedEquipment.size * 50} kg</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Total Power:</span>
                  <p className="text-xl font-bold text-white">{selectedEquipment.size * 100} W</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Total Cost:</span>
                  <p className="text-xl font-bold text-white">${(selectedEquipment.size * 1000000).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* AIT Planning Tab */}
        {activeSubTab === "ait" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assembly, Integration & Test Planning</h3>
            
            <div className="mb-4">
              <button
                onClick={() => {
                  const taskName = prompt("Task name:");
                  if (taskName) {
                    setAitTasks([...aitTasks, {
                      id: Date.now(),
                      name: taskName,
                      type: "Test",
                      status: "Pending",
                      startDate: new Date().toISOString(),
                      duration: 1,
                      dependencies: []
                    }]);
                  }
                }}
                className="btn btn-primary"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Add AIT Task
              </button>
            </div>
            
            {aitTasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-2">Task</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Start Date</th>
                      <th className="pb-2">Duration</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aitTasks.map((task) => (
                      <tr key={task.id} className="text-white border-b border-gray-700">
                        <td className="py-2">{task.name}</td>
                        <td className="py-2">{task.type}</td>
                        <td className="py-2">
                          <span className={`badge ${
                            task.status === "Complete" ? "badge-success" :
                            task.status === "In Progress" ? "badge-warning" :
                            "badge-ghost"
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-2">{new Date(task.startDate).toLocaleDateString()}</td>
                        <td className="py-2">{task.duration} days</td>
                        <td className="py-2">
                          <button
                            onClick={() => setAitTasks(aitTasks.filter(t => t.id !== task.id))}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No AIT tasks defined yet
              </div>
            )}
          </div>
        )}
        
        {/* Compliance Tab */}
        {activeSubTab === "compliance" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Standards Compliance</h3>
            
            <div className="mb-4">
              <button
                onClick={() => {
                  const standard = prompt("Standard (e.g., ECSS-E-ST-50C):");
                  if (standard) {
                    setComplianceChecklists([...complianceChecklists, {
                      id: Date.now(),
                      standard: standard,
                      items: [],
                      compliance: "Not Assessed"
                    }]);
                  }
                }}
                className="btn btn-primary"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Standard
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complianceChecklists.map(checklist => (
                <div key={checklist.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-white">{checklist.standard}</h4>
                      <span className={`badge mt-1 ${
                        checklist.compliance === "Fully Compliant" ? "badge-success" :
                        checklist.compliance === "Partially Compliant" ? "badge-warning" :
                        "badge-ghost"
                      }`}>
                        {checklist.compliance}
                      </span>
                    </div>
                    <button
                      onClick={() => setComplianceChecklists(complianceChecklists.filter(c => c.id !== checklist.id))}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    {checklist.items.length} requirements tracked
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 3D Visualization Tab */}
        {activeSubTab === "visualization" && (
          <div className="h-[600px] bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-400">3D Visualization Coming Soon</p>
            </div>
          </div>
        )}
        
        {/* ICD & Drivers Tab */}
        {activeSubTab === "icd" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Interface Control & Driver Generation</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ICD Generation Section */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-4">Interface Control Documents</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Select Components</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                      <option>All Components</option>
                      <option>Satellite Bus ↔ Payload</option>
                      <option>Ground Station ↔ Satellite</option>
                      <option>Power System ↔ Bus</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">ICD Version</label>
                    <input
                      type="text"
                      placeholder="1.0"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded">
                      Generate ICD
                    </button>
                    <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">
                      View Template
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-sm text-gray-400 mb-2">Recent ICDs:</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">ICD-001-v1.2</span>
                        <span className="text-gray-500">2 days ago</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">ICD-002-v2.0</span>
                        <span className="text-gray-500">1 week ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Driver Generation Section */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-4">Driver Generation</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Component</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                      <option>High-Resolution Camera</option>
                      <option>S-Band Transceiver</option>
                      <option>Star Tracker</option>
                      <option>Reaction Wheel</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Target Language</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                      <option>C</option>
                      <option>C++</option>
                      <option>Python</option>
                      <option>Rust</option>
                      <option>VHDL</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Features</label>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm text-gray-300">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Error Handling
                      </label>
                      <label className="flex items-center text-sm text-gray-300">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Logging
                      </label>
                      <label className="flex items-center text-sm text-gray-300">
                        <input type="checkbox" className="mr-2" />
                        Unit Tests
                      </label>
                      <label className="flex items-center text-sm text-gray-300">
                        <input type="checkbox" className="mr-2" />
                        Simulation Mode
                      </label>
                    </div>
                  </div>
                  
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded">
                    Generate Driver
                  </button>
                </div>
              </div>
            </div>
            
            {/* Interface Matrix */}
            <div className="mt-6 bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-4">Interface Matrix</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Component</th>
                      <th className="text-left py-2 text-gray-400">Interface</th>
                      <th className="text-left py-2 text-gray-400">Protocol</th>
                      <th className="text-left py-2 text-gray-400">Data Rate</th>
                      <th className="text-left py-2 text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700">
                      <td className="py-2 text-gray-300">Payload Camera</td>
                      <td className="py-2 text-gray-300">SpaceWire</td>
                      <td className="py-2 text-gray-300">RMAP</td>
                      <td className="py-2 text-gray-300">200 Mbps</td>
                      <td className="py-2">
                        <span className="text-green-400">✓ Verified</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="py-2 text-gray-300">S-Band Radio</td>
                      <td className="py-2 text-gray-300">RS-422</td>
                      <td className="py-2 text-gray-300">CCSDS</td>
                      <td className="py-2 text-gray-300">115.2 kbps</td>
                      <td className="py-2">
                        <span className="text-yellow-400">⚠ Pending</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-700">
                      <td className="py-2 text-gray-300">Power System</td>
                      <td className="py-2 text-gray-300">CAN Bus</td>
                      <td className="py-2 text-gray-300">CANopen</td>
                      <td className="py-2 text-gray-300">1 Mbps</td>
                      <td className="py-2">
                        <span className="text-green-400">✓ Verified</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Documents Tab */}
        {activeSubTab === "documents" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Document Generation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["PDR", "CDR", "FRR", "Test Report", "Compliance Matrix"].map(docType => (
                <div key={docType} className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">{docType}</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    {docType === "PDR" && "Preliminary Design Review"}
                    {docType === "CDR" && "Critical Design Review"}
                    {docType === "FRR" && "Flight Readiness Review"}
                    {docType === "Test Report" && "Test campaign results"}
                    {docType === "Compliance Matrix" && "Standards compliance"}
                  </p>
                  <button
                    onClick={() => handleGenerateDocument(docType)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded"
                  >
                    Generate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* API & Export Tab */}
        {activeSubTab === "api" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">API & Export Options</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-white mb-3">Export Mission Data</h4>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const data = JSON.stringify({
                        mission,
                        orbitalElements,
                        tle: tleInput,
                        groundTrack,
                        accessWindows,
                        equipment: Array.from(selectedEquipment),
                        aitTasks,
                        complianceChecklists
                      }, null, 2);
                      const blob = new Blob([data], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `mission_${mission.name || "export"}_${Date.now()}.json`;
                      a.click();
                    }}
                    className="btn btn-primary"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export JSON
                  </button>
                  
                  <button
                    onClick={() => {
                      if (orbitalElements) {
                        const oem = orbitService.exportToOEM(
                          [orbitService.elementsToState(orbitalElements)],
                          {
                            objectName: mission.name || "SATELLITE",
                            objectId: "001"
                          }
                        );
                        const blob = new Blob([oem], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `orbit_${mission.name || "export"}_${Date.now()}.oem`;
                        a.click();
                      }
                    }}
                    disabled={!orbitalElements}
                    className="btn btn-secondary"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export OEM
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">API Endpoints</h4>
                <div className="bg-gray-700 rounded-lg p-4 font-mono text-sm">
                  <div className="text-gray-400 mb-2">Available endpoints:</div>
                  <div className="text-green-400">POST /api/missions</div>
                  <div className="text-green-400">GET /api/missions?id=123</div>
                  <div className="text-green-400">POST /api/orbit/propagate</div>
                  <div className="text-green-400">POST /api/constellation</div>
                  <div className="text-green-400">POST /api/documents/generate</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Import Data</h4>
                <label className="btn btn-secondary">
                  <Upload className="w-4 h-4 mr-1" />
                  Import Mission
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          try {
                            const data = JSON.parse(ev.target?.result as string);
                            setMission(data.mission || mission);
                            setOrbitalElements(data.orbitalElements || null);
                            setTleInput(data.tle || { line1: "", line2: "" });
                            setGroundTrack(data.groundTrack || []);
                            setAccessWindows(data.accessWindows || []);
                            setSelectedEquipment(new Set(data.equipment || []));
                            setAitTasks(data.aitTasks || []);
                            setComplianceChecklists(data.complianceChecklists || []);
                          } catch (error) {
                            console.error("Error importing mission:", error);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
