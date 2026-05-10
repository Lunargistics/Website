"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import * as satellite from "satellite.js";
import ErrorBoundary from "./ErrorBoundary";

interface SatelliteData {
  name: string;
  tle1: string;
  tle2: string;
  color: string;
}

export default function WorldWind3DViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<any>(null);
  const [isWorldWindLoaded, setIsWorldWindLoaded] = useState(false);
  const [satellitePositions, setSatellitePositions] = useState<any[]>([]);

  // Sample satellite data
  const satellites: SatelliteData[] = [
    {
      name: "ISS",
      tle1: "1 25544U 98067A   24345.52795139  .00012506  00000-0  22495-3 0  9991",
      tle2: "2 25544  51.6415 208.4057 0002769  35.9667  61.6291 15.50381554436915",
      color: "yellow",
    },
    {
      name: "Hubble",
      tle1: "1 20580U 90037B   24345.51234567  .00000912  00000-0  43471-4 0  9991",
      tle2: "2 20580  28.4699 288.8102 0002853 357.3412  68.7521 15.09299865567890",
      color: "cyan",
    },
  ];

  // Calculate satellite position
  const calculateSatellitePosition = (tle1: string, tle2: string) => {
    try {
      const satrec = satellite.twoline2satrec(tle1, tle2);
      const now = new Date();
      const positionAndVelocity = satellite.propagate(satrec, now);

      if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== "boolean") {
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        return {
          latitude: satellite.degreesLat(positionGd.latitude),
          longitude: satellite.degreesLong(positionGd.longitude),
          altitude: positionGd.height * 1000, // Convert to meters
        };
      }
    } catch (error) {
      console.error("Error calculating satellite position:", error);
    }
    return null;
  };

  useEffect(() => {
    // Update satellite positions every second
    const interval = setInterval(() => {
      const positions = satellites.map(sat => ({
        ...sat,
        position: calculateSatellitePosition(sat.tle1, sat.tle2),
      }));
      setSatellitePositions(positions);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isWorldWindLoaded || !canvasRef.current) return;

    // Initialize WorldWind
    const initializeWorldWind = () => {
      try {
        // Access WorldWind from window object
        const WorldWind = (window as any).WorldWind;
        if (!WorldWind) {
          console.error("WorldWind not loaded");
          return;
        }

        // Create a WorldWindow for the canvas
        const wwd = new WorldWind.WorldWindow(canvasRef.current);
        globeRef.current = wwd;

        // Add layers
        wwd.addLayer(new WorldWind.BMNGOneImageLayer());
        wwd.addLayer(new WorldWind.BMNGLandsatLayer());
        // Only add Bing layer if key exists to avoid errors
        if (WorldWind.BingAerialWithLabelsLayer && WorldWind.BingMapsKey) {
          wwd.addLayer(new WorldWind.BingAerialWithLabelsLayer());
        }

        // Add atmosphere layer for better visualization
        const atmosphereLayer = new WorldWind.AtmosphereLayer();
        wwd.addLayer(atmosphereLayer);

        // Add star field for space context
        const starFieldLayer = new WorldWind.StarFieldLayer();
        wwd.addLayer(starFieldLayer);

        // Add coordinates display
        wwd.addLayer(new WorldWind.CoordinatesDisplayLayer(wwd));

        // Add compass
        wwd.addLayer(new WorldWind.CompassLayer());

        // Add view controls
        wwd.addLayer(new WorldWind.ViewControlsLayer(wwd));

        // Set initial view
        wwd.navigator.range = 20e6; // 20,000 km altitude
        wwd.navigator.lookAtLocation.latitude = 0;
        wwd.navigator.lookAtLocation.longitude = 0;

        // Add satellite placemarks
        const placemarkLayer = new WorldWind.RenderableLayer("Satellites");
        wwd.addLayer(placemarkLayer);

        // Update satellite positions on the globe
        const updateSatellites = () => {
          placemarkLayer.removeAllRenderables();

          satellitePositions.forEach(sat => {
            if (sat.position) {
              const placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
              placemarkAttributes.imageSource =
                WorldWind.configuration.baseUrl + "images/pushpins/plain-" + sat.color + ".png";
              placemarkAttributes.imageScale = 0.5;
              placemarkAttributes.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION,
                0.3,
                WorldWind.OFFSET_FRACTION,
                0.0,
              );
              placemarkAttributes.labelAttributes.color = WorldWind.Color.YELLOW;
              placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION,
                0.5,
                WorldWind.OFFSET_FRACTION,
                1.0,
              );

              const position = new WorldWind.Position(
                sat.position.latitude,
                sat.position.longitude,
                sat.position.altitude,
              );

              const placemark = new WorldWind.Placemark(position, false, placemarkAttributes);
              placemark.label =
                sat.name +
                "\n" +
                "Alt: " +
                Math.round(sat.position.altitude / 1000) +
                " km\n" +
                "Lat: " +
                sat.position.latitude.toFixed(2) +
                "°\n" +
                "Lon: " +
                sat.position.longitude.toFixed(2) +
                "°";
              placemark.alwaysOnTop = true;

              placemarkLayer.addRenderable(placemark);

              // Add orbit path
              const orbitPath = [];
              const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
              const now = new Date();

              // Calculate orbit for next 90 minutes
              for (let i = 0; i < 90; i++) {
                const futureTime = new Date(now.getTime() + i * 60000);
                const positionAndVelocity = satellite.propagate(satrec, futureTime);

                if (
                  positionAndVelocity &&
                  positionAndVelocity.position &&
                  typeof positionAndVelocity.position !== "boolean"
                ) {
                  const positionEci = positionAndVelocity.position;
                  const gmst = satellite.gstime(futureTime);
                  const positionGd = satellite.eciToGeodetic(positionEci, gmst);

                  orbitPath.push(
                    new WorldWind.Position(
                      satellite.degreesLat(positionGd.latitude),
                      satellite.degreesLong(positionGd.longitude),
                      positionGd.height * 1000,
                    ),
                  );
                }
              }

              if (orbitPath.length > 0) {
                const pathAttributes = new WorldWind.ShapeAttributes(null);
                pathAttributes.outlineColor = new WorldWind.Color(1, 1, 0, 0.5);
                pathAttributes.outlineWidth = 2;

                const path = new WorldWind.Path(orbitPath, pathAttributes);
                path.altitudeMode = WorldWind.ABSOLUTE;
                placemarkLayer.addRenderable(path);
              }
            }
          });

          wwd.redraw();
        };

        // Update satellites when positions change
        const updateInterval = setInterval(updateSatellites, 1000);

        // Add click handler
        const handlePick = (e: MouseEvent) => {
          const pickList = wwd.pick(wwd.canvasCoordinates(e.clientX, e.clientY));
          if (pickList.objects.length > 0) {
            const pickedObject = pickList.objects[0];
            if (pickedObject.userObject instanceof WorldWind.Placemark) {
              console.log("Clicked on:", pickedObject.userObject.label);
            }
          }
        };

        canvasRef.current?.addEventListener("click", handlePick);

        // Cleanup
        return () => {
          clearInterval(updateInterval);
          canvasRef.current?.removeEventListener("click", handlePick);
        };
      } catch (error) {
        console.error("Error initializing WorldWind:", error);
      }
    };

    // Initialize after a short delay to ensure WorldWind is fully loaded
    setTimeout(initializeWorldWind, 100);
  }, [isWorldWindLoaded, satellitePositions]);

  return (
    <ErrorBoundary 
      name="WorldWind3DViewer"
      level="section"
      fallback={
        <div className="h-[600px] w-full bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-red-400 mb-4">⚠️</div>
            <p>3D Globe visualization failed to load</p>
            <p className="text-sm text-gray-400 mt-2">Please refresh the page or check your browser support for WebGL</p>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error("WorldWind3DViewer Error:", { 
          error, 
          errorInfo,
          hasWebGL: !!window.WebGLRenderingContext,
          worldWindLoaded: isWorldWindLoaded
        });
      }}
    >
      <div className="worldwind-container relative h-[600px] w-full rounded-lg overflow-hidden bg-black">
        <Script
          src="https://files.worldwind.arc.nasa.gov/artifactory/web/0.9.0/worldwind.min.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("WorldWind loaded successfully");
            setIsWorldWindLoaded(true);
          }}
          onError={e => {
            console.error("Failed to load WorldWind:", e);
          }}
        />

        <canvas ref={canvasRef} className="w-full h-full" style={{ cursor: "grab" }} />

        {!isWorldWindLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-purple-500 mb-4"></div>
              <p className="text-white">Loading NASA WorldWind...</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <p className="font-bold mb-1">Controls:</p>
          <p>• Left click + drag: Rotate globe</p>
          <p>• Right click + drag: Tilt view</p>
          <p>• Scroll: Zoom in/out</p>
          <p>• Click satellites for info</p>
        </div>

        <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm max-w-xs">
          <p className="font-bold mb-1">Live Tracking:</p>
          {satellitePositions.map((sat, idx) => (
            <div key={idx} className="mt-1">
              <span className="text-yellow-400">{sat.name}:</span>
              {sat.position && (
                <span className="text-xs ml-1">
                  {sat.position.latitude.toFixed(1)}°, {sat.position.longitude.toFixed(1)}°,{" "}
                  {Math.round(sat.position.altitude / 1000)}km
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}
