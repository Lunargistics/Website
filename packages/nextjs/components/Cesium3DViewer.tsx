"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Cesium requires window object, so we need to load it dynamically
const Cesium3DViewerComponent = () => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    // Load Cesium dynamically
    const loadCesium = async () => {
      if (typeof window === "undefined") return;

      try {
        // Import Cesium
        const CesiumModule = await import("cesium");
        const Cesium = CesiumModule.default || CesiumModule;

        // Set Cesium base URL for assets - use CDN as fallback
        (window as any).CESIUM_BASE_URL = "https://cdn.jsdelivr.net/npm/cesium@1.133.1/Build/Cesium/";

        if (!cesiumContainer.current || viewerRef.current) return;

        // Initialize Cesium Viewer with error handling
        const viewer = new (Cesium as any).Viewer(cesiumContainer.current, {
          terrainProvider: false, // Disable terrain initially to avoid errors
          baseLayerPicker: false,
          geocoder: false,
          homeButton: true,
          sceneModePicker: true,
          navigationHelpButton: false,
          animation: true,
          timeline: true,
          fullscreenButton: false,
          vrButton: false,
        });

        viewerRef.current = viewer;

        // Add sample satellites
        addSatellite(viewer, Cesium, {
          name: "ISS",
          tle1: "1 25544U 98067A   24345.52795139  .00012506  00000-0  22495-3 0  9991",
          tle2: "2 25544  51.6415 208.4057 0002769  35.9667  61.6291 15.50381554436915",
          color: (Cesium as any).Color.YELLOW,
        });

        // Add asteroid belt visualization
        addAsteroidBelt(viewer, Cesium);

        // Add Moon and Mars
        addCelestialBodies(viewer, Cesium);
      } catch (error) {
        console.error("Error initializing Cesium viewer:", error);
      }
    };

    loadCesium();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  const addSatellite = async (viewer: any, Cesium: any, satelliteData: any) => {
    const satelliteJs = await import("satellite.js");

    const satrec = satelliteJs.twoline2satrec(satelliteData.tle1, satelliteData.tle2);
    const totalSeconds = 60 * 60 * 24; // 24 hours
    const timestep = 60; // 1 minute

    const start = Cesium.JulianDate.now();
    const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.timeline.zoomTo(start, stop);
    viewer.clock.multiplier = 40;
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;

    const positionsOverTime = new Cesium.SampledPositionProperty();

    for (let i = 0; i < totalSeconds; i += timestep) {
      const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
      const jsDate = Cesium.JulianDate.toDate(time);

      const positionAndVelocity = satelliteJs.propagate(satrec, jsDate);
      if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== "boolean") {
        const positionEci = positionAndVelocity.position;

        const position = new Cesium.Cartesian3(positionEci.x * 1000, positionEci.y * 1000, positionEci.z * 1000);

        positionsOverTime.addSample(time, position);
      }
    }

    const entity = viewer.entities.add({
      name: satelliteData.name,
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: start,
          stop: stop,
        }),
      ]),
      position: positionsOverTime,
      point: {
        pixelSize: 8,
        color: satelliteData.color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      path: {
        resolution: 1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.1,
          color: satelliteData.color,
        }),
        width: 3,
        leadTime: 3600,
        trailTime: 3600,
      },
    });

    viewer.trackedEntity = entity;
  };

  const addAsteroidBelt = (viewer: any, Cesium: any) => {
    // Simplified asteroid belt visualization
    const asteroidBeltInner = 2.1 * 149597870.7 * 1000; // 2.1 AU in meters
    const asteroidBeltOuter = 3.3 * 149597870.7 * 1000; // 3.3 AU in meters

    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * 2 * Math.PI;
      const radius = asteroidBeltInner + Math.random() * (asteroidBeltOuter - asteroidBeltInner);

      viewer.entities.add({
        name: `Asteroid ${i}`,
        position: Cesium.Cartesian3.fromRadians(angle, 0, radius),
        point: {
          pixelSize: 2,
          color: Cesium.Color.GRAY,
        },
      });
    }
  };

  const addCelestialBodies = (viewer: any, Cesium: any) => {
    // Add Moon
    viewer.entities.add({
      name: "Moon",
      position: Cesium.Cartesian3.fromRadians(0, 0, 384400 * 1000),
      ellipsoid: {
        radii: new Cesium.Cartesian3(1737400, 1737400, 1737400),
        material: Cesium.Color.LIGHTGRAY,
      },
    });

    // Add Mars (simplified position)
    viewer.entities.add({
      name: "Mars",
      position: Cesium.Cartesian3.fromRadians(0, 0, 227939200 * 1000),
      ellipsoid: {
        radii: new Cesium.Cartesian3(3389500, 3389500, 3389500),
        material: Cesium.Color.ORANGERED,
      },
    });
  };

  return (
    <div className="cesium-viewer-container h-[600px] w-full rounded-lg overflow-hidden">
      <div ref={cesiumContainer} className="h-full w-full" />
    </div>
  );
};

// Export with dynamic import to avoid SSR issues
export default dynamic(() => Promise.resolve(Cesium3DViewerComponent), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-base-200 rounded-lg flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  ),
});
