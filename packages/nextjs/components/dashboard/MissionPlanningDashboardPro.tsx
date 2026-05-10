"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Database,
  Eye,
  FileText,
  Globe,
  Pause,
  Play,
  Rocket,
  Satellite as SatelliteIcon,
  Save,
  Settings,
} from "lucide-react";
import { useAccount } from "wagmi";
// import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import orekitService, { OrekitOrbitData, OrekitPropagationResult } from "~~/services/orekit/orekitService";

// Dynamic import for WorldWind component
const WorldWindGlobe = dynamic(() => import("~~/components/visualization/WorldWindGlobe"), {
  ssr: false,
}) as React.ComponentType<{
  satellites?: any[];
  groundStations?: any[];
  trajectories?: any[];
  config?: {
    enableAtmosphere?: boolean;
    enableStarField?: boolean;
    terrainExaggeration?: number;
  };
  onSatelliteClick?: (satellite: any) => void;
  onLocationPick?: (lat: number, lon: number, alt: number) => void;
}>;

enum MissionType {
  EARTH_OBSERVATION = "EARTH_OBSERVATION",
  COMMUNICATION = "COMMUNICATION",
  NAVIGATION = "NAVIGATION",
  SCIENTIFIC = "SCIENTIFIC",
  EXPLORATION = "EXPLORATION",
  TECHNOLOGY_DEMO = "TECHNOLOGY_DEMO",
}

interface MissionData {
  id?: string;
  name: string;
  type: MissionType;
  description: string;
  objectives: string[];
  launchDate: string;
  endDate: string;
  orbit?: OrekitOrbitData;
  groundStations?: GroundStation[];
  requirements?: Requirement[];
  equipment?: Equipment[];
  phases?: MissionPhase[];
  budget?: {
    total: number;
    allocated: number;
    spent: number;
  };
}

interface GroundStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  coverageRadius?: number;
  antennaType?: string;
  capabilities?: string[];
}

interface Requirement {
  id: string;
  category: string;
  description: string;
  verification: string;
  status: "PENDING" | "IN_PROGRESS" | "VERIFIED" | "FAILED";
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  mass: number;
  power: number;
  dataRate?: number;
  status: "OPERATIONAL" | "DEGRADED" | "FAILED";
}

interface MissionPhase {
  name: string;
  startDate: Date;
  endDate: Date;
  objectives: string[];
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
}

export function MissionPlanningDashboardPro() {
  // State management
  const [mission, setMission] = useState<MissionData>({
    name: "",
    type: MissionType.EARTH_OBSERVATION,
    description: "",
    objectives: [],
    launchDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    groundStations: [],
    requirements: [],
    equipment: [],
    phases: [],
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTime, setSimulationTime] = useState(new Date());
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  // Orbital mechanics state
  const [propagatedPositions, setPropagatedPositions] = useState<OrekitPropagationResult[]>([]);
  const [groundPasses, setGroundPasses] = useState<any[]>([]);
  const [maneuvers, setManeuvers] = useState<any[]>([]);
  // const [eclipseEvents, setEclipseEvents] = useState<any[]>([]); // For future eclipse prediction feature

  // Visualization state
  const [satellites, setSatellites] = useState<any[]>([]);
  const [trajectories, setTrajectories] = useState<any[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<any>(null);

  // TLE input state
  const [tleLine1, setTleLine1] = useState("");
  const [tleLine2, setTleLine2] = useState("");

  // Contract interaction - MissionRegistry is only available on Hardhat network
  // const { writeContractAsync: writeMissionRegistry } = useScaffoldWriteContract("MissionRegistry" as any);
  const { address } = useAccount();

  // Initialize Orekit service
  useEffect(() => {
    const initOrekit = async () => {
      try {
        await orekitService.initialize();
        console.log("✅ Orekit service initialized");
      } catch (error) {
        console.error("Failed to initialize Orekit:", error);
      }
    };
    initOrekit();
  }, []);

  // Propagate orbit using Orekit
  const propagateOrbit = useCallback(async () => {
    if (!mission.orbit) return;

    try {
      const results = await orekitService.propagateOrbit(
        mission.orbit,
        new Date(simulationTime.getTime() + 90 * 60 * 1000), // 90 minutes ahead
        {
          includeJ2: true,
          includeDrag: true,
          includeSolarPressure: true,
          stepSize: 60, // 1-minute steps
        },
      );

      setPropagatedPositions(results);

      // Update visualization
      const satPositions = results.map(r => ({
        name: mission.name,
        latitude: r.latitude,
        longitude: r.longitude,
        altitude: r.altitude,
        timestamp: r.timestamp,
      }));
      setSatellites([satPositions[satPositions.length - 1]]); // Current position

      // Create trajectory
      const trajectory = {
        color: "#00FF00",
        points: results.map(r => ({
          latitude: r.latitude,
          longitude: r.longitude,
          altitude: r.altitude,
        })),
      };
      setTrajectories([trajectory]);
    } catch (error) {
      console.error("Propagation failed:", error);
    }
  }, [mission, simulationTime]);

  // Calculate ground station passes (currently shown in UI but can be activated when needed)
  const _calculateGroundPasses = useCallback(async () => {
    if (!mission.orbit || !mission.groundStations?.length) return;

    try {
      const passes = await Promise.all(
        mission.groundStations.map(async station => {
          const stationPasses = await orekitService.calculateGroundPasses(
            mission.orbit!,
            {
              latitude: station.latitude,
              longitude: station.longitude,
              altitude: station.altitude,
              minElevation: 10,
            },
            simulationTime,
            new Date(simulationTime.getTime() + 24 * 60 * 60 * 1000),
          );
          return { station, passes: stationPasses };
        }),
      );
      setGroundPasses(passes);
    } catch (error) {
      console.error("Ground pass calculation failed:", error);
    }
  }, [mission, simulationTime]);

  // Parse TLE using Orekit
  const parseTLE = async () => {
    if (!tleLine1 || !tleLine2) return;

    try {
      const keplerianElements = await orekitService.tleToKeplerian(tleLine1, tleLine2);
      setMission(prev => ({ ...prev, orbit: keplerianElements }));

      // Immediately propagate the new orbit
      await propagateOrbit();
    } catch (error) {
      console.error("TLE parsing failed:", error);
    }
  };

  // Calculate optimal maneuver (can be activated via UI when needed)
  const _calculateManeuver = async (targetOrbit: OrekitOrbitData) => {
    if (!mission.orbit) return;

    try {
      const maneuver = await orekitService.calculateManeuver(mission.orbit, targetOrbit, "HOHMANN");
      setManeuvers(prev => [...prev, maneuver]);
    } catch (error) {
      console.error("Maneuver calculation failed:", error);
    }
  };

  // Analyze orbit
  const analyzeOrbit = async () => {
    if (!mission.orbit) return;

    try {
      const analysis = await orekitService.analyzeOrbit(mission.orbit);
      console.log("Orbit Analysis:", analysis);
      return analysis;
    } catch (error) {
      console.error("Orbit analysis failed:", error);
    }
  };

  // Simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSimulationTime(prev => new Date(prev.getTime() + simulationSpeed * 1000));
      propagateOrbit();
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, propagateOrbit]);

  // Save mission to blockchain
  const saveMissionToBlockchain = async () => {
    if (!mission.name || !address) return;

    try {
      // Prepare mission data
      const missionData = {
        ...mission,
        creator: address,
        timestamp: Date.now(),
      };

      // Pin to IPFS (mock for now)
      const _ipfsHash = "QmMockHash" + Date.now();

      // Save to blockchain - Only available on Hardhat network
      // await writeMissionRegistry({
      //   functionName: "createMission" as any,
      //   args: [
      //     mission.name,
      //     Object.values(MissionType).indexOf(mission.type) as any,
      //     ipfsHash,
      //     BigInt(new Date(mission.launchDate).getTime() / 1000) as any,
      //     BigInt(new Date(mission.endDate).getTime() / 1000) as any,
      //   ],
      // });

      console.log("Mission saved to blockchain:", missionData);
    } catch (error) {
      console.error("Failed to save mission:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Rocket className="h-8 w-8 text-purple-500" />
              Mission Planning Dashboard Pro
            </h1>
            <p className="text-gray-400 mt-1">Professional mission design with NASA WorldWind & Orekit</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={saveMissionToBlockchain}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition"
            >
              <Save className="h-4 w-4" />
              Save Mission
            </button>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-4 py-2 ${isSimulating ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"} rounded-lg flex items-center gap-2 transition`}
            >
              {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isSimulating ? "Stop" : "Start"} Simulation
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex gap-6">
            {[
              { id: "overview", label: "Overview", icon: Eye },
              { id: "orbit", label: "Orbital Mechanics", icon: SatelliteIcon },
              { id: "visualization", label: "3D Visualization", icon: Globe },
              { id: "groundtrack", label: "Ground Track", icon: Globe },
              { id: "equipment", label: "Equipment", icon: Settings },
              { id: "requirements", label: "Requirements", icon: FileText },
              { id: "data", label: "Data & Telemetry", icon: Database },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-2 border-b-2 transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === "visualization" && (
              <div className="bg-gray-800 rounded-lg p-4 h-[600px]">
                <h2 className="text-xl font-semibold mb-4">NASA WorldWind Visualization</h2>
                <WorldWindGlobe
                  satellites={satellites}
                  groundStations={mission.groundStations || []}
                  trajectories={trajectories}
                  config={{
                    enableAtmosphere: true,
                    enableStarField: true,
                    terrainExaggeration: 2,
                  }}
                  onSatelliteClick={setSelectedSatellite}
                  onLocationPick={(lat: number, lon: number, alt: number) => {
                    console.log("Location picked:", { lat, lon, alt });
                  }}
                />
              </div>
            )}

            {activeTab === "orbit" && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Orbital Mechanics (Orekit)</h2>

                {/* TLE Input */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Import TLE</h3>
                  <input
                    type="text"
                    placeholder="TLE Line 1"
                    value={tleLine1}
                    onChange={e => setTleLine1(e.target.value)}
                    className="w-full bg-gray-700 px-3 py-2 rounded mb-2"
                  />
                  <input
                    type="text"
                    placeholder="TLE Line 2"
                    value={tleLine2}
                    onChange={e => setTleLine2(e.target.value)}
                    className="w-full bg-gray-700 px-3 py-2 rounded mb-2"
                  />
                  <button onClick={parseTLE} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">
                    Parse TLE
                  </button>
                </div>

                {/* Orbital Elements Display */}
                {mission.orbit && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-4 rounded">
                      <h3 className="font-semibold mb-2">Keplerian Elements</h3>
                      <div className="space-y-1 text-sm">
                        <p>Semi-Major Axis: {mission.orbit.semiMajorAxis?.toFixed(2)} km</p>
                        <p>Eccentricity: {mission.orbit.eccentricity?.toFixed(4)}</p>
                        <p>Inclination: {mission.orbit.inclination?.toFixed(2)}°</p>
                        <p>RAAN: {mission.orbit.raan?.toFixed(2)}°</p>
                        <p>Arg of Perigee: {mission.orbit.argumentOfPerigee?.toFixed(2)}°</p>
                        <p>True Anomaly: {mission.orbit.trueAnomaly?.toFixed(2)}°</p>
                      </div>
                    </div>

                    <div className="bg-gray-700 p-4 rounded">
                      <h3 className="font-semibold mb-2">Orbit Analysis</h3>
                      <button
                        onClick={analyzeOrbit}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition"
                      >
                        Analyze Orbit
                      </button>
                    </div>
                  </div>
                )}

                {/* Propagation Results */}
                {propagatedPositions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Propagation Results</h3>
                    <div className="bg-gray-700 p-4 rounded max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-2">Time</th>
                            <th className="text-left">Lat</th>
                            <th className="text-left">Lon</th>
                            <th className="text-left">Alt (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propagatedPositions.slice(0, 10).map((pos, idx) => (
                            <tr key={idx} className="border-b border-gray-600">
                              <td className="py-1">{new Date(pos.timestamp).toLocaleTimeString()}</td>
                              <td>{pos.latitude.toFixed(2)}°</td>
                              <td>{pos.longitude.toFixed(2)}°</td>
                              <td>{pos.altitude.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Mission Overview</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mission Name</label>
                    <input
                      type="text"
                      value={mission.name}
                      onChange={e => setMission(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-700 px-3 py-2 rounded"
                      placeholder="Enter mission name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Mission Type</label>
                    <select
                      value={mission.type}
                      onChange={e => setMission(prev => ({ ...prev, type: e.target.value as MissionType }))}
                      className="w-full bg-gray-700 px-3 py-2 rounded"
                    >
                      {Object.values(MissionType).map(type => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={mission.description}
                      onChange={e => setMission(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-gray-700 px-3 py-2 rounded h-32"
                      placeholder="Enter mission description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Launch Date</label>
                      <input
                        type="date"
                        value={mission.launchDate.split("T")[0]}
                        onChange={e => setMission(prev => ({ ...prev, launchDate: e.target.value }))}
                        className="w-full bg-gray-700 px-3 py-2 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={mission.endDate.split("T")[0]}
                        onChange={e => setMission(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full bg-gray-700 px-3 py-2 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Simulation Controls */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Simulation Controls</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Simulation Time</label>
                  <p className="font-mono">{simulationTime.toISOString()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Speed</label>
                  <div className="flex gap-2 mt-1">
                    {[1, 10, 60, 3600].map(speed => (
                      <button
                        key={speed}
                        onClick={() => setSimulationSpeed(speed)}
                        className={`px-3 py-1 rounded text-sm ${
                          simulationSpeed === speed ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"
                        } transition`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Ground Station Passes */}
            {groundPasses.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Ground Station Passes</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {groundPasses.map((stationData, idx) => (
                    <div key={idx} className="bg-gray-700 p-3 rounded">
                      <p className="font-semibold text-sm">{stationData.station.name}</p>
                      <div className="text-xs text-gray-400 mt-1">
                        {stationData.passes.slice(0, 3).map((pass: any, pidx: number) => (
                          <div key={pidx}>
                            {new Date(pass.startTime).toLocaleTimeString()} - Max El: {pass.maxElevation.toFixed(1)}°
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Satellite Info */}
            {selectedSatellite && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Selected Satellite</h3>
                <div className="space-y-2 text-sm">
                  <p>Name: {selectedSatellite.name}</p>
                  <p>Lat: {selectedSatellite.latitude?.toFixed(2)}°</p>
                  <p>Lon: {selectedSatellite.longitude?.toFixed(2)}°</p>
                  <p>Alt: {selectedSatellite.altitude?.toFixed(1)} km</p>
                </div>
              </div>
            )}

            {/* Maneuver Planning */}
            {maneuvers.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Planned Maneuvers</h3>
                <div className="space-y-2">
                  {maneuvers.map((maneuver, idx) => (
                    <div key={idx} className="bg-gray-700 p-3 rounded">
                      <p className="font-semibold text-sm">{maneuver.type}</p>
                      <p className="text-xs text-gray-400">ΔV: {maneuver.deltaV.toFixed(2)} m/s</p>
                      <p className="text-xs text-gray-400">Epoch: {new Date(maneuver.epoch).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionPlanningDashboardPro;
