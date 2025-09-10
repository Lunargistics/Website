"use client";

import React, { useEffect, useRef, useState } from "react";
import * as satellite from "satellite.js";

// Orbital mechanics calculations similar to Orekit
export class OrbitalMechanics {
  // Convert TLE to orbital elements
  static tleToOrbitalElements(line1: string, line2: string) {
    const satrec = satellite.twoline2satrec(line1, line2);
    const positionAndVelocity = satellite.propagate(satrec, new Date());

    if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== "boolean") {
      const positionEci = positionAndVelocity.position;
      const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;

      // Calculate orbital elements
      const r = Math.sqrt(positionEci.x ** 2 + positionEci.y ** 2 + positionEci.z ** 2);
      const v = Math.sqrt(velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2);

      // Semi-major axis (km)
      const mu = 398600.4418; // Earth's gravitational parameter
      const a = 1 / (2 / r - v ** 2 / mu);

      // Eccentricity
      const h = this.crossProduct(positionEci, velocityEci);
      const hMag = Math.sqrt(h.x ** 2 + h.y ** 2 + h.z ** 2);
      const e = Math.sqrt(1 - hMag ** 2 / (mu * a));

      // Inclination (degrees)
      const i = Math.acos(h.z / hMag) * (180 / Math.PI);

      // Period (minutes)
      const period = (2 * Math.PI * Math.sqrt(a ** 3 / mu)) / 60;

      return {
        semiMajorAxis: a,
        eccentricity: e,
        inclination: i,
        period: period,
        apogee: a * (1 + e) - 6371, // Altitude above Earth's surface
        perigee: a * (1 - e) - 6371,
      };
    }

    return null;
  }

  // Cross product helper
  static crossProduct(a: satellite.EciVec3<number>, b: satellite.EciVec3<number>) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  // Calculate satellite position at given time
  static getSatellitePosition(tle1: string, tle2: string, date: Date) {
    const satrec = satellite.twoline2satrec(tle1, tle2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== "boolean") {
      const positionEci = positionAndVelocity.position;
      const gmst = satellite.gstime(date);
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      return {
        longitude: satellite.degreesLong(positionGd.longitude),
        latitude: satellite.degreesLat(positionGd.latitude),
        altitude: positionGd.height,
      };
    }

    return undefined;
  }

  // Calculate next pass over a location
  static getNextPass(tle1: string, tle2: string, observerLat: number, observerLon: number, observerAlt: number = 0) {
    const satrec = satellite.twoline2satrec(tle1, tle2);
    const observerGd = {
      longitude: satellite.radiansLong(observerLon),
      latitude: satellite.radiansLat(observerLat),
      height: observerAlt,
    };

    const passes = [];
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours

    for (let time = new Date(now); time < endTime; time.setMinutes(time.getMinutes() + 1)) {
      const positionAndVelocity = satellite.propagate(satrec, time);

      if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== "boolean") {
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(time);
        const positionEcf = satellite.eciToEcf(positionEci, gmst);
        const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

        if (lookAngles.elevation > 0) {
          passes.push({
            time: new Date(time),
            elevation: lookAngles.elevation * (180 / Math.PI),
            azimuth: lookAngles.azimuth * (180 / Math.PI),
            range: lookAngles.rangeSat,
          });
        }
      }
    }

    return passes;
  }
}

// Space object tracking component
interface SpaceObject {
  id: string;
  name: string;
  type: "satellite" | "asteroid" | "debris";
  tle?: { line1: string; line2: string };
  orbitalElements?: any;
  position?: { longitude: number; latitude: number; altitude: number };
}

export default function SpaceVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedObject, setSelectedObject] = useState<SpaceObject | null>(null);
  const [spaceObjects, setSpaceObjects] = useState<SpaceObject[]>([]);
  const [tracking, setTracking] = useState(false);

  // Sample ISS TLE for demonstration
  const ISS_TLE = {
    line1: "1 25544U 98067A   24345.52795139  .00012506  00000-0  22495-3 0  9991",
    line2: "2 25544  51.6415 208.4057 0002769  35.9667  61.6291 15.50381554436915",
  };

  useEffect(() => {
    // Initialize space objects with ISS as example
    const iss: SpaceObject = {
      id: "iss",
      name: "International Space Station",
      type: "satellite",
      tle: ISS_TLE,
    };

    // Calculate orbital elements
    if (iss.tle) {
      iss.orbitalElements = OrbitalMechanics.tleToOrbitalElements(iss.tle.line1, iss.tle.line2);
      iss.position = OrbitalMechanics.getSatellitePosition(iss.tle.line1, iss.tle.line2, new Date());
    }

    setSpaceObjects([iss]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update positions in real-time
  useEffect(() => {
    if (!tracking) return;

    const interval = setInterval(() => {
      setSpaceObjects(objects =>
        objects.map(obj => {
          if (obj.tle) {
            const position = OrbitalMechanics.getSatellitePosition(obj.tle.line1, obj.tle.line2, new Date());
            return { ...obj, position };
          }
          return obj;
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [tracking]);

  // Simple 2D visualization using Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Earth
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const earthRadius = 100;

    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#4169E1";
    ctx.fill();
    ctx.strokeStyle = "#87CEEB";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    for (let i = -180; i <= 180; i += 30) {
      const x = centerX + (i / 180) * earthRadius;
      ctx.beginPath();
      ctx.moveTo(x, centerY - earthRadius);
      ctx.lineTo(x, centerY + earthRadius);
      ctx.stroke();
    }

    for (let i = -90; i <= 90; i += 30) {
      const y = centerY + (i / 90) * earthRadius;
      ctx.beginPath();
      ctx.moveTo(centerX - earthRadius, y);
      ctx.lineTo(centerX + earthRadius, y);
      ctx.stroke();
    }

    // Draw space objects
    spaceObjects.forEach(obj => {
      if (obj.position) {
        const x = centerX + (obj.position.longitude / 180) * earthRadius;
        const y = centerY - (obj.position.latitude / 90) * earthRadius;

        // Draw orbit trace
        if (obj.tle) {
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();

          for (let t = 0; t < 90; t += 5) {
            const futureTime = new Date(Date.now() + t * 60 * 1000);
            const futurePos = OrbitalMechanics.getSatellitePosition(obj.tle.line1, obj.tle.line2, futureTime);

            if (futurePos) {
              const fx = centerX + (futurePos.longitude / 180) * earthRadius;
              const fy = centerY - (futurePos.latitude / 90) * earthRadius;

              if (t === 0) {
                ctx.moveTo(fx, fy);
              } else {
                ctx.lineTo(fx, fy);
              }
            }
          }

          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw object
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = obj.type === "satellite" ? "#FFD700" : "#FF6347";
        ctx.fill();

        // Draw label
        ctx.fillStyle = "#FFF";
        ctx.font = "12px sans-serif";
        ctx.fillText(obj.name, x + 10, y);
      }
    });
  }, [spaceObjects]);

  return (
    <div className="space-visualization bg-base-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Space Object Tracking</h2>
        <button onClick={() => setTracking(!tracking)} className={`btn ${tracking ? "btn-error" : "btn-success"}`}>
          {tracking ? "Stop Tracking" : "Start Tracking"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <canvas ref={canvasRef} width={600} height={400} className="w-full border border-base-300 rounded-lg" />
        </div>

        <div className="space-y-4">
          <div className="card bg-base-100">
            <div className="card-body">
              <h3 className="card-title text-lg">Tracked Objects</h3>
              <div className="space-y-2">
                {spaceObjects.map(obj => (
                  <div
                    key={obj.id}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedObject?.id === obj.id ? "bg-primary/20" : "bg-base-200"
                    }`}
                    onClick={() => setSelectedObject(obj)}
                  >
                    <div className="font-semibold">{obj.name}</div>
                    <div className="text-sm opacity-70">Type: {obj.type}</div>
                    {obj.position && (
                      <div className="text-xs mt-1">
                        <div>Lat: {obj.position.latitude.toFixed(2)}°</div>
                        <div>Lon: {obj.position.longitude.toFixed(2)}°</div>
                        <div>Alt: {obj.position.altitude.toFixed(0)} km</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedObject?.orbitalElements && (
            <div className="card bg-base-100">
              <div className="card-body">
                <h3 className="card-title text-lg">Orbital Elements</h3>
                <div className="text-sm space-y-1">
                  <div>Semi-major Axis: {selectedObject.orbitalElements.semiMajorAxis.toFixed(2)} km</div>
                  <div>Eccentricity: {selectedObject.orbitalElements.eccentricity.toFixed(4)}</div>
                  <div>Inclination: {selectedObject.orbitalElements.inclination.toFixed(2)}°</div>
                  <div>Period: {selectedObject.orbitalElements.period.toFixed(2)} min</div>
                  <div>Apogee: {selectedObject.orbitalElements.apogee.toFixed(2)} km</div>
                  <div>Perigee: {selectedObject.orbitalElements.perigee.toFixed(2)} km</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
