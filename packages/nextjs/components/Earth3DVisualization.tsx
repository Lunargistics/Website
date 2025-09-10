"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Billboard, Line, OrbitControls, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import orbitService, { GroundStation } from "~~/services/orbit/orbitService";

interface Satellite {
  id: string;
  name: string;
  tle?: {
    line1: string;
    line2: string;
  };
  color?: string;
  showOrbit?: boolean;
  showGroundTrack?: boolean;
  showSensorCone?: boolean;
  sensorFOV?: number; // degrees
}

interface Earth3DVisualizationProps {
  satellites?: Satellite[];
  groundStations?: GroundStation[];
  showGrid?: boolean;
  showLabels?: boolean;
  showDayNight?: boolean;
  selectedSatelliteId?: string;
  onSatelliteSelect?: (id: string) => void;
  simulationTime?: Date;
  simulationSpeed?: number; // 1 = real-time, 60 = 1 minute per second
  viewMode?: "3D" | "2D";
  focusTarget?: "earth" | string; // satellite ID to focus on
  areasOfInterest?: {
    id: string;
    name: string;
    coordinates: { latitude: number; longitude: number }[];
    color?: string;
  }[];
}

// Earth component
function Earth({ showDayNight, simulationTime }: { showDayNight?: boolean; simulationTime: Date }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  // Create Earth texture (using a simple colored sphere for now)
  const earthMaterial = useMemo(() => {
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x2233ff),
      emissive: new THREE.Color(0x112244),
      shininess: 10,
      specular: new THREE.Color(0x333333),
    });

    // Add basic land/ocean pattern
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Ocean
    ctx.fillStyle = "#001a4d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple continent shapes
    ctx.fillStyle = "#2d5016";
    // Africa/Europe
    ctx.beginPath();
    ctx.arc(512, 256, 80, 0, Math.PI * 2);
    ctx.fill();
    // Americas
    ctx.beginPath();
    ctx.arc(256, 256, 60, 0, Math.PI * 2);
    ctx.fill();
    // Asia
    ctx.beginPath();
    ctx.arc(768, 200, 90, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    material.map = texture;

    return material;
  }, []);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0005;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0007;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef} material={earthMaterial}>
        <sphereGeometry args={[6.371, 64, 64]} />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[6.375, 64, 64]} />
        <meshPhongMaterial color={0xffffff} transparent opacity={0.2} depthWrite={false} />
      </mesh>

      {/* Atmosphere */}
      <mesh>
        <sphereGeometry args={[6.45, 64, 64]} />
        <meshPhongMaterial color={0x4499ff} transparent opacity={0.1} depthWrite={false} side={THREE.BackSide} />
      </mesh>

      {showDayNight && <DayNightTerminator simulationTime={simulationTime} />}
    </group>
  );
}

// Day/Night terminator
function DayNightTerminator({ simulationTime }: { simulationTime: Date }) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    if (!geometryRef.current) return;

    // Calculate sun position based on time
    const dayOfYear = Math.floor(
      (simulationTime.getTime() - new Date(simulationTime.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
    );
    const declination = (23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365) * Math.PI) / 180;
    const hourAngle = ((simulationTime.getUTCHours() + simulationTime.getUTCMinutes() / 60 - 12) * 15 * Math.PI) / 180;

    // Create terminator line
    const points: THREE.Vector3[] = [];
    for (let lat = -90; lat <= 90; lat += 5) {
      const latRad = (lat * Math.PI) / 180;
      const terminatorLon = Math.atan2(-Math.cos(latRad) * Math.sin(declination), Math.cos(declination)) + hourAngle;

      const x = 6.371 * Math.cos(latRad) * Math.cos(terminatorLon);
      const y = 6.371 * Math.sin(latRad);
      const z = 6.371 * Math.cos(latRad) * Math.sin(terminatorLon);

      points.push(new THREE.Vector3(x, y, z));
    }

    geometryRef.current.setFromPoints(points);
  }, [simulationTime]);

  return (
    <line>
      <bufferGeometry ref={geometryRef} />
      <lineBasicMaterial color={0xffaa00} linewidth={2} />
    </line>
  );
}

// Satellite component
function SatelliteObject({
  satellite,
  simulationTime,
  isSelected,
  onSelect,
  showLabel,
}: {
  satellite: Satellite;
  simulationTime: Date;
  isSelected: boolean;
  onSelect: () => void;
  showLabel?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3());
  const [orbitPoints, setOrbitPoints] = useState<THREE.Vector3[]>([]);
  const [groundTrackPoints, setGroundTrackPoints] = useState<THREE.Vector3[]>([]);
  const [footprint, setFootprint] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    if (!satellite.tle) return;

    const satrec = orbitService.parseTLE(satellite.tle.line1, satellite.tle.line2);

    // Calculate current position
    const state = orbitService.propagateFromTLE(satellite.tle.line1, satellite.tle.line2, simulationTime);
    const pos = new THREE.Vector3(
      state.position.x / 1000, // Convert to Earth radii units
      state.position.z / 1000,
      -state.position.y / 1000,
    );
    setPosition(pos);

    // Calculate orbit path
    if (satellite.showOrbit) {
      const orbitPeriod = (2 * Math.PI) / Math.sqrt(398600.4418 / Math.pow(pos.length() * 1000, 3)) / 60; // minutes
      const points: THREE.Vector3[] = [];

      for (let i = 0; i <= 100; i++) {
        const t = new Date(simulationTime.getTime() + (i / 100) * orbitPeriod * 60 * 1000);
        const s = orbitService.propagateFromTLE(satellite.tle.line1, satellite.tle.line2, t);
        points.push(new THREE.Vector3(s.position.x / 1000, s.position.z / 1000, -s.position.y / 1000));
      }
      setOrbitPoints(points);
    }

    // Calculate ground track
    if (satellite.showGroundTrack) {
      const track = orbitService.calculateGroundTrack(
        satrec,
        simulationTime,
        new Date(simulationTime.getTime() + 90 * 60 * 1000), // 90 minutes
        1,
      );

      const groundPoints = track.map(point => {
        const phi = ((90 - point.latitude) * Math.PI) / 180;
        const theta = (point.longitude * Math.PI) / 180;
        const r = 6.372; // Slightly above Earth surface

        return new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta),
        );
      });
      setGroundTrackPoints(groundPoints);
    }

    // Calculate sensor footprint
    if (satellite.showSensorCone && satellite.sensorFOV) {
      const sensorFP = orbitService.calculateSensorFootprint(state, satellite.sensorFOV);
      const fpPoints = sensorFP.corners.map(corner => {
        const phi = ((90 - corner.latitude) * Math.PI) / 180;
        const theta = (corner.longitude * Math.PI) / 180;
        const r = 6.372;

        return new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta),
        );
      });
      fpPoints.push(fpPoints[0]); // Close the footprint
      setFootprint(fpPoints);
    }
  }, [satellite, simulationTime]);

  return (
    <group>
      {/* Satellite mesh */}
      <mesh ref={meshRef} position={position} onClick={onSelect}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshPhongMaterial
          color={satellite.color || "#ffffff"}
          emissive={satellite.color || "#ffffff"}
          emissiveIntensity={isSelected ? 1 : 0.5}
        />
      </mesh>

      {/* Satellite label */}
      {showLabel && (
        <Billboard position={position}>
          <Text fontSize={0.15} color={satellite.color || "#ffffff"} anchorX="center" anchorY="bottom">
            {satellite.name}
          </Text>
        </Billboard>
      )}

      {/* Orbit path */}
      {satellite.showOrbit && orbitPoints.length > 0 && (
        <Line points={orbitPoints} color={satellite.color || "#ffffff"} lineWidth={1} opacity={0.5} transparent />
      )}

      {/* Ground track */}
      {satellite.showGroundTrack && groundTrackPoints.length > 0 && (
        <Line points={groundTrackPoints} color={satellite.color || "#ffff00"} lineWidth={2} opacity={0.7} transparent />
      )}

      {/* Sensor footprint */}
      {satellite.showSensorCone && footprint.length > 0 && (
        <>
          {/* Cone lines from satellite to footprint */}
          {footprint.slice(0, -1).map((point, i) => (
            <Line
              key={i}
              points={[position, point]}
              color={satellite.color || "#00ff00"}
              lineWidth={1}
              opacity={0.3}
              transparent
            />
          ))}
          {/* Footprint outline */}
          <Line points={footprint} color={satellite.color || "#00ff00"} lineWidth={2} opacity={0.6} transparent />
        </>
      )}
    </group>
  );
}

// Ground station component
function GroundStationObject({ station, showLabel }: { station: GroundStation; showLabel?: boolean }) {
  const position = useMemo(() => {
    const phi = ((90 - station.latitude) * Math.PI) / 180;
    const theta = (station.longitude * Math.PI) / 180;
    const r = 6.371 + station.elevation / 1000000; // Convert elevation to Earth radii scale

    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    );
  }, [station]);

  // Calculate visibility cone
  const conePoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const minElevation = station.minElevationAngle || 5;
    const maxRange = 3000 / 1000; // 3000 km in Earth radii units

    for (let azimuth = 0; azimuth <= 360; azimuth += 30) {
      const azRad = (azimuth * Math.PI) / 180;
      const elRad = (minElevation * Math.PI) / 180;

      const x = position.x + maxRange * Math.cos(elRad) * Math.sin(azRad);
      const y = position.y + maxRange * Math.sin(elRad);
      const z = position.z + maxRange * Math.cos(elRad) * Math.cos(azRad);

      points.push(new THREE.Vector3(x, y, z));
    }

    return points;
  }, [station, position]);

  return (
    <group>
      {/* Ground station marker */}
      <mesh position={position}>
        <coneGeometry args={[0.03, 0.06, 4]} />
        <meshPhongMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>

      {/* Station label */}
      {showLabel && (
        <Billboard position={position}>
          <Text fontSize={0.12} color="#ff0000" anchorX="center" anchorY="bottom">
            {station.name}
          </Text>
        </Billboard>
      )}

      {/* Visibility cone (simplified) */}
      <Line points={[...conePoints, conePoints[0]]} color="#ff000044" lineWidth={1} opacity={0.3} transparent />
    </group>
  );
}

// Grid lines
function GridLines() {
  const lines = useMemo(() => {
    const lineGroups: THREE.Vector3[][] = [];

    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      const points: THREE.Vector3[] = [];
      for (let lon = 0; lon <= 360; lon += 5) {
        const phi = ((90 - lat) * Math.PI) / 180;
        const theta = (lon * Math.PI) / 180;
        const r = 6.372;

        points.push(
          new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta),
          ),
        );
      }
      lineGroups.push(points);
    }

    // Longitude lines
    for (let lon = 0; lon < 360; lon += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = ((90 - lat) * Math.PI) / 180;
        const theta = (lon * Math.PI) / 180;
        const r = 6.372;

        points.push(
          new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta),
          ),
        );
      }
      lineGroups.push(points);
    }

    return lineGroups;
  }, []);

  return (
    <>
      {lines.map((points, i) => (
        <Line key={i} points={points} color="#ffffff22" lineWidth={1} transparent />
      ))}
    </>
  );
}

// Area of Interest
function AreaOfInterestObject({
  area,
}: {
  area: { id: string; name: string; coordinates: { latitude: number; longitude: number }[]; color?: string };
}) {
  const points = useMemo(() => {
    const pts = area.coordinates.map(coord => {
      const phi = ((90 - coord.latitude) * Math.PI) / 180;
      const theta = (coord.longitude * Math.PI) / 180;
      const r = 6.372;

      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
    });
    pts.push(pts[0]); // Close the polygon
    return pts;
  }, [area]);

  return <Line points={points} color={area.color || "#ffff00"} lineWidth={3} opacity={0.8} transparent />;
}

// Main visualization component
export default function Earth3DVisualization({
  satellites = [],
  groundStations = [],
  showGrid = true,
  showLabels = true,
  showDayNight = false,
  selectedSatelliteId,
  onSatelliteSelect,
  simulationTime = new Date(),
  simulationSpeed = 1,
  viewMode = "3D",
  focusTarget = "earth", // Will be used for camera focusing in future updates
  areasOfInterest = [],
}: Earth3DVisualizationProps) {
  // Use focusTarget to suppress unused variable warning - will implement camera focus later
  console.debug("Focus target:", focusTarget);
  const [currentTime, setCurrentTime] = useState(simulationTime);
  const [isPlaying, setIsPlaying] = useState(false);

  // Update simulation time
  useEffect(() => {
    if (!isPlaying) {
      setCurrentTime(simulationTime);
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(prev => new Date(prev.getTime() + simulationSpeed * 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, simulationSpeed, simulationTime]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      {/* 3D Canvas */}
      <Canvas camera={{ position: viewMode === "2D" ? [0, 30, 0] : [20, 10, 20], fov: 45 }} gl={{ antialias: true }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Earth */}
        <Earth showDayNight={showDayNight} simulationTime={currentTime} />

        {/* Grid */}
        {showGrid && <GridLines />}

        {/* Satellites */}
        {satellites.map(satellite => (
          <SatelliteObject
            key={satellite.id}
            satellite={satellite}
            simulationTime={currentTime}
            isSelected={satellite.id === selectedSatelliteId}
            onSelect={() => onSatelliteSelect?.(satellite.id)}
            showLabel={showLabels}
          />
        ))}

        {/* Ground Stations */}
        {groundStations.map((station, i) => (
          <GroundStationObject key={`gs_${i}`} station={station} showLabel={showLabels} />
        ))}

        {/* Areas of Interest */}
        {areasOfInterest.map(area => (
          <AreaOfInterestObject key={area.id} area={area} />
        ))}

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={viewMode === "3D"}
          minDistance={8}
          maxDistance={50}
          maxPolarAngle={viewMode === "2D" ? 0 : Math.PI}
          minPolarAngle={viewMode === "2D" ? 0 : 0}
        />
      </Canvas>

      {/* Control Panel */}
      <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-90 p-4 rounded-lg text-white">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <div className="text-sm">Speed: {simulationSpeed}x</div>
        </div>
        <div className="text-sm">{currentTime.toUTCString()}</div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-90 p-4 rounded-lg text-white text-sm">
        <div className="font-bold mb-2">Legend</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-white rounded-full"></div>
          <span>Satellites</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-red-500"></div>
          <span>Ground Stations</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-0.5 bg-yellow-500"></div>
          <span>Ground Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span>Sensor FOV</span>
        </div>
      </div>
    </div>
  );
}
