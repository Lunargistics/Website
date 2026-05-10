"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import ErrorBoundary from "../ErrorBoundary";

// WorldWind configuration interface
interface WorldWindConfig {
  enableAtmosphere?: boolean;
  enableStarField?: boolean;
  enableCompass?: boolean;
  enableLayerPicker?: boolean;
  terrainExaggeration?: number;
}

interface WorldWindGlobeProps {
  satellites?: any[];
  groundStations?: any[];
  trajectories?: any[];
  config?: WorldWindConfig;
  onSatelliteClick?: (satellite: any) => void;
  onLocationPick?: (lat: number, lon: number, alt: number) => void;
}

// NASA WorldWind Professional Visualization Component
export function WorldWindGlobe({
  satellites = [],
  groundStations = [],
  trajectories = [],
  config = {},
  onSatelliteClick,
  onLocationPick,
}: WorldWindGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wwd, setWwd] = useState<any>(null);
  const [layers, setLayers] = useState<Map<string, any>>(new Map());
  const [isWorldWindLoaded, setIsWorldWindLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !isWorldWindLoaded) return;

    // Initialize WorldWind
    const WorldWind = (window as any).WorldWind;
    if (!WorldWind) {
      console.error("WorldWind not loaded");
      return;
    }

    // Create WorldWindow with professional configuration
    const worldWindow = new WorldWind.WorldWindow(canvasRef.current);

    // Configure professional layers
    const layers = [
      // Base imagery layers
      { layer: new WorldWind.BMNGLayer(), enabled: true },
      { layer: new WorldWind.BMNGLandsatLayer(), enabled: false },
      // Only add Bing if key is configured to avoid runtime errors
      ...(WorldWind.BingAerialWithLabelsLayer && WorldWind.BingMapsKey
        ? [{ layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: false }]
        : []),

      // Reference layers
      { layer: new WorldWind.CompassLayer(), enabled: config.enableCompass !== false },
      { layer: new WorldWind.CoordinatesDisplayLayer(worldWindow), enabled: true },
      { layer: new WorldWind.ViewControlsLayer(worldWindow), enabled: true },

      // Atmospheric effects
      { layer: new WorldWind.AtmosphereLayer(), enabled: config.enableAtmosphere !== false },
      { layer: new WorldWind.StarFieldLayer(), enabled: config.enableStarField !== false },
    ];

    layers.forEach(({ layer, enabled }) => {
      layer.enabled = enabled;
      worldWindow.addLayer(layer);
    });

    // Configure terrain
    if (config.terrainExaggeration) {
      worldWindow.verticalExaggeration = config.terrainExaggeration;
    }

    // Create satellite layer
    const satelliteLayer = new WorldWind.RenderableLayer("Satellites");
    satelliteLayer.enabled = true;
    worldWindow.addLayer(satelliteLayer);

    // Create trajectory layer
    const trajectoryLayer = new WorldWind.RenderableLayer("Trajectories");
    trajectoryLayer.enabled = true;
    worldWindow.addLayer(trajectoryLayer);

    // Create ground station layer
    const groundStationLayer = new WorldWind.RenderableLayer("Ground Stations");
    groundStationLayer.enabled = true;
    worldWindow.addLayer(groundStationLayer);

    // Store layers for updates
    const layerMap = new Map();
    layerMap.set("satellites", satelliteLayer);
    layerMap.set("trajectories", trajectoryLayer);
    layerMap.set("groundStations", groundStationLayer);
    setLayers(layerMap);

    // Add pick listener for interaction
    const handlePick = (event: MouseEvent) => {
      const pickList = worldWindow.pick(worldWindow.canvasCoordinates(event.clientX, event.clientY));

      if (pickList.objects.length > 0) {
        const topObject = pickList.objects[0];
        if (topObject.userObject?.type === "satellite" && onSatelliteClick) {
          onSatelliteClick(topObject.userObject.data);
        } else if (topObject.isTerrain && onLocationPick) {
          const position = topObject.position;
          onLocationPick(position.latitude, position.longitude, position.altitude);
        }
      }
    };

    // Store the canvas element in a variable for cleanup
    const canvas = canvasRef.current;
    canvas.addEventListener("click", handlePick);

    setWwd(worldWindow);

    // Cleanup
    return () => {
      if (canvas) {
        canvas.removeEventListener("click", handlePick);
      }
    };
  }, [config, onLocationPick, onSatelliteClick, isWorldWindLoaded]);

  // Update satellites
  useEffect(() => {
    if (!wwd || !layers.has("satellites")) return;

    const WorldWind = (window as any).WorldWind;
    const satelliteLayer = layers.get("satellites");
    satelliteLayer.removeAllRenderables();

    satellites.forEach(satellite => {
      // Create satellite placemark
      const placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
      placemarkAttributes.imageSource = "/satellite-icon.png";
      placemarkAttributes.imageScale = 0.3;
      placemarkAttributes.imageOffset = new WorldWind.Offset(
        WorldWind.OFFSET_FRACTION,
        0.5,
        WorldWind.OFFSET_FRACTION,
        0.5,
      );

      const position = new WorldWind.Position(satellite.latitude, satellite.longitude, satellite.altitude);

      const placemark = new WorldWind.Placemark(position, false, placemarkAttributes);
      placemark.label = satellite.name;
      placemark.altitudeMode = WorldWind.ABSOLUTE;
      placemark.userObject = { type: "satellite", data: satellite };

      satelliteLayer.addRenderable(placemark);
    });

    wwd.redraw();
  }, [satellites, wwd, layers]);

  // Update trajectories
  useEffect(() => {
    if (!wwd || !layers.has("trajectories")) return;

    const WorldWind = (window as any).WorldWind;
    const trajectoryLayer = layers.get("trajectories");
    trajectoryLayer.removeAllRenderables();

    trajectories.forEach(trajectory => {
      const positions = trajectory.points.map(
        (point: any) => new WorldWind.Position(point.latitude, point.longitude, point.altitude),
      );

      const pathAttributes = new WorldWind.ShapeAttributes(null);
      pathAttributes.outlineColor = WorldWind.Color.colorFromHex(trajectory.color || "#00FF00");
      pathAttributes.outlineWidth = 2;

      const path = new WorldWind.Path(positions);
      path.attributes = pathAttributes;
      path.altitudeMode = WorldWind.ABSOLUTE;
      path.followTerrain = false;

      trajectoryLayer.addRenderable(path);
    });

    wwd.redraw();
  }, [trajectories, wwd, layers]);

  // Update ground stations
  useEffect(() => {
    if (!wwd || !layers.has("groundStations")) return;

    const WorldWind = (window as any).WorldWind;
    const groundStationLayer = layers.get("groundStations");
    groundStationLayer.removeAllRenderables();

    groundStations.forEach(station => {
      // Create ground station placemark
      const placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
      placemarkAttributes.imageSource = "/ground-station-icon.png";
      placemarkAttributes.imageScale = 0.4;
      placemarkAttributes.imageOffset = new WorldWind.Offset(
        WorldWind.OFFSET_FRACTION,
        0.5,
        WorldWind.OFFSET_FRACTION,
        0.5,
      );

      const position = new WorldWind.Position(station.latitude, station.longitude, 0);

      const placemark = new WorldWind.Placemark(position, false, placemarkAttributes);
      placemark.label = station.name;
      placemark.altitudeMode = WorldWind.CLAMP_TO_GROUND;

      // Add coverage circle if specified
      if (station.coverageRadius) {
        const circleAttributes = new WorldWind.ShapeAttributes(null);
        circleAttributes.outlineColor = WorldWind.Color.colorFromHex("#FF000080");
        circleAttributes.interiorColor = WorldWind.Color.colorFromHex("#FF000020");
        circleAttributes.outlineWidth = 2;

        const circle = new WorldWind.SurfaceCircle(position, station.coverageRadius * 1000);
        circle.attributes = circleAttributes;
        groundStationLayer.addRenderable(circle);
      }

      groundStationLayer.addRenderable(placemark);
    });

    wwd.redraw();
  }, [groundStations, wwd, layers]);

  return (
    <ErrorBoundary
      name="WorldWindGlobe"
      level="component"
      fallback={
        <div className="relative w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-red-400 mb-4">🌍</div>
            <p className="mb-2">Globe component failed to load</p>
            <p className="text-sm text-gray-400">Check WebGL support or refresh the page</p>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error("WorldWindGlobe Error:", {
          error,
          errorInfo,
          satellites: satellites.length,
          groundStations: groundStations.length,
          trajectories: trajectories.length,
          hasWebGL: typeof window !== "undefined" && !!window.WebGLRenderingContext,
          worldWindLoaded: isWorldWindLoaded,
        });
      }}
    >
      <div className="relative w-full h-full">
        <Script
          src="https://files.worldwind.arc.nasa.gov/artifactory/web/0.9.0/worldwind.min.js"
          strategy="afterInteractive"
          onLoad={() => setIsWorldWindLoaded(true)}
          onError={e => console.error("Failed to load WorldWind:", e)}
        />
        <canvas ref={canvasRef} className="w-full h-full" style={{ cursor: "grab" }} />

        {/* Layer Controls */}
        <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 space-y-2">
          <h3 className="text-white font-semibold mb-2">Layers</h3>
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              defaultChecked
              onChange={e => {
                if (layers.has("satellites")) {
                  layers.get("satellites").enabled = e.target.checked;
                  wwd?.redraw();
                }
              }}
              className="mr-2"
            />
            Satellites ({satellites.length})
          </label>
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              defaultChecked
              onChange={e => {
                if (layers.has("trajectories")) {
                  layers.get("trajectories").enabled = e.target.checked;
                  wwd?.redraw();
                }
              }}
              className="mr-2"
            />
            Trajectories ({trajectories.length})
          </label>
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              defaultChecked
              onChange={e => {
                if (layers.has("groundStations")) {
                  layers.get("groundStations").enabled = e.target.checked;
                  wwd?.redraw();
                }
              }}
              className="mr-2"
            />
            Ground Stations ({groundStations.length})
          </label>
        </div>

        {/* View Controls */}
        <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-2">
          <button
            onClick={() => {
              if (wwd) {
                wwd.navigator.lookAtLocation.latitude = 0;
                wwd.navigator.lookAtLocation.longitude = 0;
                wwd.navigator.range = 20000000;
                wwd.redraw();
              }
            }}
            className="text-white px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Reset View
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Export as dynamic component for Next.js SSR compatibility
export default dynamic(() => Promise.resolve({ default: WorldWindGlobe }), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px] bg-gray-900">
      <div className="text-white">Loading 3D Globe...</div>
    </div>
  ),
});
