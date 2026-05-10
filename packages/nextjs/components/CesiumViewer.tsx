"use client";

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import ErrorBoundary from './ErrorBoundary';

interface CesiumViewerProps {
  satellites?: any[];
  groundStations?: any[];
  trajectories?: any[];
  onEntityClick?: (entity: any) => void;
  defaultView?: {
    longitude: number;
    latitude: number;
    height: number;
  };
}

export function CesiumViewer({
  satellites = [],
  groundStations = [],
  trajectories = [],
  onEntityClick,
  defaultView = { longitude: 0, latitude: 0, height: 20000000 }
}: CesiumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isCesiumLoaded, setIsCesiumLoaded] = useState(false);
  const [cesiumError, setCesiumError] = useState<string | null>(null);

  // Initialize Cesium
  useEffect(() => {
    if (!isCesiumLoaded || !containerRef.current) return;

    try {
      const Cesium = (window as any).Cesium;
      if (!Cesium) {
        throw new Error('Cesium library not loaded');
      }

      // Create Cesium viewer with professional configuration
      const viewer = new Cesium.Viewer(containerRef.current, {
        terrainProvider: Cesium.createWorldTerrain(),
        imageryProvider: new Cesium.IonImageryProvider({ assetId: 3954 }),
        baseLayerPicker: true,
        fullscreenButton: true,
        vrButton: false,
        geocoder: true,
        homeButton: true,
        infoBox: true,
        sceneModePicker: true,
        selectionIndicator: true,
        timeline: true,
        navigationHelpButton: true,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: false,
        shouldAnimate: true,
        shadows: true,
      });

      // Configure scene
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.atmosphereHue = 0.1;
      viewer.scene.globe.atmosphereSaturation = 1.5;
      viewer.scene.globe.atmosphereBrightness = 2.0;

      // Set initial camera position
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          defaultView.longitude,
          defaultView.latitude,
          defaultView.height
        ),
      });

      // Add click handler
      viewer.selectedEntityChanged.addEventListener((selectedEntity: any) => {
        if (selectedEntity && onEntityClick) {
          onEntityClick(selectedEntity);
        }
      });

      viewerRef.current = viewer;

      // Clock setup for real-time tracking
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
      viewer.clock.multiplier = 1;
      viewer.clock.shouldAnimate = true;

    } catch (error) {
      console.error('Error initializing Cesium:', error);
      setCesiumError(error instanceof Error ? error.message : 'Failed to initialize Cesium');
    }

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, [isCesiumLoaded, defaultView, onEntityClick]);

  // Update satellites
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;

    // Clear existing satellites
    const entitiesToRemove = viewer.entities.values.filter((entity: any) => 
      entity.id.startsWith('satellite_')
    );
    entitiesToRemove.forEach((entity: any) => viewer.entities.remove(entity));

    // Add new satellites
    satellites.forEach((satellite, index) => {
      try {
        const entity = viewer.entities.add({
          id: `satellite_${index}`,
          name: satellite.name,
          position: Cesium.Cartesian3.fromDegrees(
            satellite.longitude,
            satellite.latitude,
            satellite.altitude
          ),
          billboard: {
            image: '/satellite-icon.png',
            scale: 0.3,
            heightReference: Cesium.HeightReference.NONE,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
          },
          label: {
            text: satellite.name,
            font: '12pt Helvetica',
            fillColor: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -40),
          },
          description: `
            <h3>${satellite.name}</h3>
            <p>Altitude: ${Math.round(satellite.altitude / 1000)} km</p>
            <p>Latitude: ${satellite.latitude.toFixed(2)}°</p>
            <p>Longitude: ${satellite.longitude.toFixed(2)}°</p>
          `,
        });

        // Add satellite properties
        entity.satellite = satellite;
      } catch (error) {
        console.error(`Error adding satellite ${satellite.name}:`, error);
      }
    });
  }, [satellites]);

  // Update ground stations
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;

    // Clear existing ground stations
    const entitiesToRemove = viewer.entities.values.filter((entity: any) => 
      entity.id.startsWith('ground_station_')
    );
    entitiesToRemove.forEach((entity: any) => viewer.entities.remove(entity));

    // Add new ground stations
    groundStations.forEach((station, index) => {
      try {
        const entity = viewer.entities.add({
          id: `ground_station_${index}`,
          name: station.name,
          position: Cesium.Cartesian3.fromDegrees(
            station.longitude,
            station.latitude,
            0
          ),
          billboard: {
            image: '/ground-station-icon.png',
            scale: 0.4,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            color: Cesium.Color.CYAN,
          },
          label: {
            text: station.name,
            font: '12pt Helvetica',
            fillColor: Cesium.Color.CYAN,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -40),
          },
          // Coverage circle
          ellipse: station.coverageRadius ? {
            semiMinorAxis: station.coverageRadius * 1000,
            semiMajorAxis: station.coverageRadius * 1000,
            material: Cesium.Color.CYAN.withAlpha(0.2),
            outline: true,
            outlineColor: Cesium.Color.CYAN,
            height: 0,
          } : undefined,
        });

        entity.groundStation = station;
      } catch (error) {
        console.error(`Error adding ground station ${station.name}:`, error);
      }
    });
  }, [groundStations]);

  // Update trajectories
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;

    // Clear existing trajectories
    const entitiesToRemove = viewer.entities.values.filter((entity: any) => 
      entity.id.startsWith('trajectory_')
    );
    entitiesToRemove.forEach((entity: any) => viewer.entities.remove(entity));

    // Add new trajectories
    trajectories.forEach((trajectory, index) => {
      try {
        const positions = trajectory.points.map((point: any) =>
          Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.altitude)
        );

        viewer.entities.add({
          id: `trajectory_${index}`,
          name: trajectory.name || `Trajectory ${index + 1}`,
          polyline: {
            positions: positions,
            width: 2,
            material: Cesium.Color.fromCssColorString(trajectory.color || '#00FF00'),
            clampToGround: false,
          },
        });
      } catch (error) {
        console.error(`Error adding trajectory ${index}:`, error);
      }
    });
  }, [trajectories]);

  if (cesiumError) {
    return (
      <div className="w-full h-full bg-red-100 border border-red-400 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-700">
          <h3 className="font-bold mb-2">Cesium Error</h3>
          <p className="text-sm">{cesiumError}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      name="CesiumViewer"
      level="component"
      fallback={
        <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-blue-400 mb-4">🌎</div>
            <p className="mb-2">Cesium 3D globe failed to load</p>
            <p className="text-sm text-gray-400">Check WebGL support or refresh the page</p>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error("CesiumViewer Error:", {
          error,
          errorInfo,
          satellites: satellites.length,
          groundStations: groundStations.length,
          trajectories: trajectories.length,
          cesiumLoaded: isCesiumLoaded,
          hasWebGL: typeof window !== 'undefined' && !!window.WebGLRenderingContext,
        });
      }}
    >
      <div className="relative w-full h-full">
        <Script
          src="https://cesium.com/downloads/cesiumjs/releases/1.104/Build/Cesium/Cesium.js"
          strategy="beforeInteractive"
          onLoad={() => {
            console.log('Cesium loaded successfully');
            
            // Set Cesium Ion access token if available
            const Cesium = (window as any).Cesium;
            if (Cesium && process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN) {
              Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN;
            }
            
            setIsCesiumLoaded(true);
          }}
          onError={(e) => {
            console.error('Failed to load Cesium:', e);
            setCesiumError('Failed to load Cesium library');
          }}
        />

        <link 
          href="https://cesium.com/downloads/cesiumjs/releases/1.104/Build/Cesium/Widgets/widgets.css" 
          rel="stylesheet" 
        />

        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />

        {!isCesiumLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 rounded-lg">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading Cesium 3D Globe...</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <p className="font-bold mb-1">Cesium Controls:</p>
          <p>• Left click + drag: Rotate</p>
          <p>• Right click + drag: Pan</p>
          <p>• Scroll: Zoom</p>
          <p>• Middle click + drag: Tilt</p>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default CesiumViewer;