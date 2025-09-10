/**
 * Orbit Service - Comprehensive orbital mechanics calculations
 * Replacement for Orekit using JavaScript libraries
 */

import * as satellite from 'satellite.js';
import { parseTLE } from 'tle.js';

// Types
export interface OrbitalElements {
  semiMajorAxis: number; // km
  eccentricity: number;
  inclination: number; // degrees
  raan: number; // Right Ascension of Ascending Node - degrees
  argumentOfPerigee: number; // degrees
  trueAnomaly: number; // degrees
  meanAnomaly?: number; // degrees
  epoch: Date;
}

export interface StateVector {
  position: {
    x: number; // km
    y: number; // km
    z: number; // km
  };
  velocity: {
    x: number; // km/s
    y: number; // km/s
    z: number; // km/s
  };
  epoch: Date;
}

export interface GroundStation {
  name: string;
  latitude: number; // degrees
  longitude: number; // degrees
  elevation: number; // meters
  minElevationAngle?: number; // degrees (default 5)
}

export interface GroundTrack {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: Date;
}

export interface AccessWindow {
  aos: Date; // Acquisition of Signal
  los: Date; // Loss of Signal
  maxElevation: number; // degrees
  duration: number; // seconds
  groundStation: string;
}

export interface EclipseEvent {
  type: 'penumbra_entry' | 'penumbra_exit' | 'umbra_entry' | 'umbra_exit';
  timestamp: Date;
  duration?: number; // seconds (for complete eclipse periods)
}

export interface ManeuverPlan {
  deltaV: {
    radial: number; // m/s
    alongTrack: number; // m/s
    crossTrack: number; // m/s
  };
  burnTime: number; // seconds
  timestamp: Date;
  resultingOrbit: OrbitalElements;
}

export interface SensorFootprint {
  center: {
    latitude: number;
    longitude: number;
  };
  corners: {
    latitude: number;
    longitude: number;
  }[];
  area: number; // km²
  timestamp: Date;
}

export interface ConstellationConfig {
  satellites: {
    id: string;
    tle?: string;
    elements?: OrbitalElements;
    state?: StateVector;
  }[];
  phasing?: {
    type: 'walker' | 'custom';
    planes?: number;
    satellitesPerPlane?: number;
  };
}

// Constants
const EARTH_RADIUS = 6371; // km
const EARTH_MU = 398600.4418; // km³/s²
const J2 = 0.00108263; // Earth's J2 perturbation
const EARTH_FLATTENING = 1 / 298.257223563;

class OrbitService {
  /**
   * Parse TLE data
   */
  parseTLE(tleLine1: string, tleLine2: string): satellite.SatRec {
    return satellite.twoline2satrec(tleLine1, tleLine2);
  }

  /**
   * Propagate orbit from TLE
   */
  propagateFromTLE(
    tleLine1: string,
    tleLine2: string,
    date: Date
  ): StateVector {
    const satrec = this.parseTLE(tleLine1, tleLine2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (typeof positionAndVelocity.position === 'boolean' || 
        typeof positionAndVelocity.velocity === 'boolean') {
      throw new Error('Propagation failed');
    }

    return {
      position: {
        x: positionAndVelocity.position.x,
        y: positionAndVelocity.position.y,
        z: positionAndVelocity.position.z,
      },
      velocity: {
        x: positionAndVelocity.velocity.x,
        y: positionAndVelocity.velocity.y,
        z: positionAndVelocity.velocity.z,
      },
      epoch: date,
    };
  }

  /**
   * Convert state vector to orbital elements
   */
  stateToElements(state: StateVector): OrbitalElements {
    const r = Math.sqrt(
      state.position.x ** 2 + 
      state.position.y ** 2 + 
      state.position.z ** 2
    );
    const v = Math.sqrt(
      state.velocity.x ** 2 + 
      state.velocity.y ** 2 + 
      state.velocity.z ** 2
    );

    // Specific orbital energy
    const energy = (v ** 2) / 2 - EARTH_MU / r;
    
    // Semi-major axis
    const a = -EARTH_MU / (2 * energy);
    
    // Eccentricity vector
    const ex = (state.velocity.y * (state.position.z * state.velocity.y - state.position.y * state.velocity.z) - 
               state.velocity.z * (state.position.x * state.velocity.z - state.position.z * state.velocity.x)) / EARTH_MU - 
               state.position.x / r;
    const ey = (state.velocity.z * (state.position.x * state.velocity.z - state.position.z * state.velocity.x) - 
               state.velocity.x * (state.position.z * state.velocity.y - state.position.y * state.velocity.z)) / EARTH_MU - 
               state.position.y / r;
    const ez = (state.velocity.x * (state.position.y * state.velocity.x - state.position.x * state.velocity.y) - 
               state.velocity.y * (state.position.x * state.velocity.z - state.position.z * state.velocity.x)) / EARTH_MU - 
               state.position.z / r;
    const e = Math.sqrt(ex ** 2 + ey ** 2 + ez ** 2);

    // Angular momentum
    const hx = state.position.y * state.velocity.z - state.position.z * state.velocity.y;
    const hy = state.position.z * state.velocity.x - state.position.x * state.velocity.z;
    const hz = state.position.x * state.velocity.y - state.position.y * state.velocity.x;
    const h = Math.sqrt(hx ** 2 + hy ** 2 + hz ** 2);

    // Inclination
    const i = Math.acos(hz / h) * 180 / Math.PI;

    // Right ascension of ascending node
    const nx = -hy;
    const ny = hx;
    const n = Math.sqrt(nx ** 2 + ny ** 2);
    let raan = Math.atan2(ny, nx) * 180 / Math.PI;
    if (raan < 0) raan += 360;

    // Argument of perigee
    let argp = 0;
    if (n !== 0 && e !== 0) {
      const w = Math.acos((nx * ex + ny * ey) / (n * e));
      argp = (ez < 0 ? 360 - w : w) * 180 / Math.PI;
    }

    // True anomaly
    const cosNu = (state.position.x * ex + state.position.y * ey + state.position.z * ez) / (r * e);
    const nu = Math.acos(Math.max(-1, Math.min(1, cosNu))) * 180 / Math.PI;

    return {
      semiMajorAxis: a,
      eccentricity: e,
      inclination: i,
      raan: raan,
      argumentOfPerigee: argp,
      trueAnomaly: nu,
      epoch: state.epoch,
    };
  }

  /**
   * Convert orbital elements to state vector
   */
  elementsToState(elements: OrbitalElements): StateVector {
    const { semiMajorAxis: a, eccentricity: e, inclination: i, raan, argumentOfPerigee: w, trueAnomaly: nu } = elements;
    
    // Convert degrees to radians
    const iRad = i * Math.PI / 180;
    const raanRad = raan * Math.PI / 180;
    const wRad = w * Math.PI / 180;
    const nuRad = nu * Math.PI / 180;

    // Calculate position in perifocal frame
    const p = a * (1 - e ** 2);
    const r = p / (1 + e * Math.cos(nuRad));
    
    const posPerifocal = {
      x: r * Math.cos(nuRad),
      y: r * Math.sin(nuRad),
      z: 0,
    };

    // Calculate velocity in perifocal frame
    const velPerifocal = {
      x: -Math.sqrt(EARTH_MU / p) * Math.sin(nuRad),
      y: Math.sqrt(EARTH_MU / p) * (e + Math.cos(nuRad)),
      z: 0,
    };

    // Rotation matrices
    const cosRaan = Math.cos(raanRad);
    const sinRaan = Math.sin(raanRad);
    const cosI = Math.cos(iRad);
    const sinI = Math.sin(iRad);
    const cosW = Math.cos(wRad);
    const sinW = Math.sin(wRad);

    // Transform to inertial frame
    const position = {
      x: (cosRaan * cosW - sinRaan * sinW * cosI) * posPerifocal.x +
         (-cosRaan * sinW - sinRaan * cosW * cosI) * posPerifocal.y,
      y: (sinRaan * cosW + cosRaan * sinW * cosI) * posPerifocal.x +
         (-sinRaan * sinW + cosRaan * cosW * cosI) * posPerifocal.y,
      z: (sinW * sinI) * posPerifocal.x + (cosW * sinI) * posPerifocal.y,
    };

    const velocity = {
      x: (cosRaan * cosW - sinRaan * sinW * cosI) * velPerifocal.x +
         (-cosRaan * sinW - sinRaan * cosW * cosI) * velPerifocal.y,
      y: (sinRaan * cosW + cosRaan * sinW * cosI) * velPerifocal.x +
         (-sinRaan * sinW + cosRaan * cosW * cosI) * velPerifocal.y,
      z: (sinW * sinI) * velPerifocal.x + (cosW * sinI) * velPerifocal.y,
    };

    return {
      position,
      velocity,
      epoch: elements.epoch,
    };
  }

  /**
   * Calculate ground track
   */
  calculateGroundTrack(
    satrec: satellite.SatRec | OrbitalElements,
    startTime: Date,
    endTime: Date,
    stepMinutes: number = 1
  ): GroundTrack[] {
    const track: GroundTrack[] = [];
    const steps = Math.floor((endTime.getTime() - startTime.getTime()) / (stepMinutes * 60 * 1000));

    for (let i = 0; i <= steps; i++) {
      const time = new Date(startTime.getTime() + i * stepMinutes * 60 * 1000);
      
      let state: StateVector;
      if ('epochyr' in satrec) {
        // It's a satrec from TLE
        const positionAndVelocity = satellite.propagate(satrec, time);
        if (typeof positionAndVelocity.position === 'boolean') continue;
        
        state = {
          position: {
            x: positionAndVelocity.position.x,
            y: positionAndVelocity.position.y,
            z: positionAndVelocity.position.z,
          },
          velocity: {
            x: positionAndVelocity.velocity?.x || 0,
            y: positionAndVelocity.velocity?.y || 0,
            z: positionAndVelocity.velocity?.z || 0,
          },
          epoch: time,
        };
      } else {
        // It's orbital elements
        state = this.propagateFromElements(satrec, time);
      }

      const gmst = satellite.gstime(time);
      const geodetic = satellite.eciToGeodetic(state.position, gmst);

      track.push({
        latitude: satellite.degreesLat(geodetic.latitude),
        longitude: satellite.degreesLong(geodetic.longitude),
        altitude: geodetic.height,
        timestamp: time,
      });
    }

    return track;
  }

  /**
   * Calculate ground station visibility windows
   */
  calculateAccess(
    satrec: satellite.SatRec | OrbitalElements,
    groundStation: GroundStation,
    startTime: Date,
    endTime: Date,
    stepSeconds: number = 10
  ): AccessWindow[] {
    const windows: AccessWindow[] = [];
    const minElevation = groundStation.minElevationAngle || 5;
    
    let inPass = false;
    let aosTime: Date | null = null;
    let maxElevation = 0;

    const observer = {
      latitude: satellite.degreesToRadians(groundStation.latitude),
      longitude: satellite.degreesToRadians(groundStation.longitude),
      height: groundStation.elevation / 1000, // Convert to km
    };

    const steps = Math.floor((endTime.getTime() - startTime.getTime()) / (stepSeconds * 1000));

    for (let i = 0; i <= steps; i++) {
      const time = new Date(startTime.getTime() + i * stepSeconds * 1000);
      
      let positionEci: any;
      if ('epochyr' in satrec) {
        const propagated = satellite.propagate(satrec, time);
        if (typeof propagated.position === 'boolean') continue;
        positionEci = propagated.position;
      } else {
        const state = this.propagateFromElements(satrec, time);
        positionEci = state.position;
      }

      const gmst = satellite.gstime(time);
      const positionEcf = satellite.eciToEcf(positionEci, gmst);
      const lookAngles = satellite.ecfToLookAngles(observer, positionEcf);
      const elevationDeg = satellite.radiansToDegrees(lookAngles.elevation);

      if (elevationDeg >= minElevation) {
        if (!inPass) {
          // AOS
          inPass = true;
          aosTime = time;
          maxElevation = elevationDeg;
        } else {
          maxElevation = Math.max(maxElevation, elevationDeg);
        }
      } else {
        if (inPass && aosTime) {
          // LOS
          windows.push({
            aos: aosTime,
            los: time,
            maxElevation: maxElevation,
            duration: (time.getTime() - aosTime.getTime()) / 1000,
            groundStation: groundStation.name,
          });
          inPass = false;
          aosTime = null;
          maxElevation = 0;
        }
      }
    }

    // Handle case where pass extends beyond endTime
    if (inPass && aosTime) {
      windows.push({
        aos: aosTime,
        los: endTime,
        maxElevation: maxElevation,
        duration: (endTime.getTime() - aosTime.getTime()) / 1000,
        groundStation: groundStation.name,
      });
    }

    return windows;
  }

  /**
   * Calculate eclipse events
   */
  calculateEclipses(
    satrec: satellite.SatRec | OrbitalElements,
    startTime: Date,
    endTime: Date,
    stepSeconds: number = 60
  ): EclipseEvent[] {
    const events: EclipseEvent[] = [];
    const sunRadius = 695700; // km
    const earthRadius = EARTH_RADIUS;
    
    let inPenumbra = false;
    let inUmbra = false;
    let penumbraEntry: Date | null = null;
    let umbraEntry: Date | null = null;

    const steps = Math.floor((endTime.getTime() - startTime.getTime()) / (stepSeconds * 1000));

    for (let i = 0; i <= steps; i++) {
      const time = new Date(startTime.getTime() + i * stepSeconds * 1000);
      
      let positionEci: any;
      if ('epochyr' in satrec) {
        const propagated = satellite.propagate(satrec, time);
        if (typeof propagated.position === 'boolean') continue;
        positionEci = propagated.position;
      } else {
        const state = this.propagateFromElements(satrec, time);
        positionEci = state.position;
      }

      // Simplified eclipse detection
      // In reality, this would require sun position calculation
      const r = Math.sqrt(positionEci.x ** 2 + positionEci.y ** 2 + positionEci.z ** 2);
      const sunAngle = this.calculateSunAngle(time, positionEci);
      
      const umbraAngle = Math.atan(earthRadius / r);
      const penumbraAngle = Math.atan((earthRadius + 100) / r); // 100km atmosphere

      const isInUmbra = sunAngle < umbraAngle;
      const isInPenumbra = sunAngle < penumbraAngle;

      // Penumbra events
      if (isInPenumbra && !inPenumbra) {
        penumbraEntry = time;
        events.push({
          type: 'penumbra_entry',
          timestamp: time,
        });
        inPenumbra = true;
      } else if (!isInPenumbra && inPenumbra) {
        events.push({
          type: 'penumbra_exit',
          timestamp: time,
          duration: penumbraEntry ? (time.getTime() - penumbraEntry.getTime()) / 1000 : undefined,
        });
        inPenumbra = false;
      }

      // Umbra events
      if (isInUmbra && !inUmbra) {
        umbraEntry = time;
        events.push({
          type: 'umbra_entry',
          timestamp: time,
        });
        inUmbra = true;
      } else if (!isInUmbra && inUmbra) {
        events.push({
          type: 'umbra_exit',
          timestamp: time,
          duration: umbraEntry ? (time.getTime() - umbraEntry.getTime()) / 1000 : undefined,
        });
        inUmbra = false;
      }
    }

    return events;
  }

  /**
   * Calculate sun angle (simplified)
   */
  private calculateSunAngle(time: Date, position: any): number {
    // Simplified sun position calculation
    const dayOfYear = this.getDayOfYear(time);
    const declination = 23.45 * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365);
    const hourAngle = (time.getUTCHours() + time.getUTCMinutes() / 60 - 12) * 15;
    
    // This is a very simplified calculation
    // In reality, you'd need proper sun ephemeris
    const sunX = Math.cos(declination * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180);
    const sunY = Math.cos(declination * Math.PI / 180) * Math.sin(hourAngle * Math.PI / 180);
    const sunZ = Math.sin(declination * Math.PI / 180);
    
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const dotProduct = (position.x * sunX + position.y * sunY + position.z * sunZ) / r;
    
    return Math.acos(Math.max(-1, Math.min(1, dotProduct)));
  }

  /**
   * Get day of year
   */
  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Plan orbital maneuver
   */
  planManeuver(
    currentOrbit: OrbitalElements,
    targetOrbit: OrbitalElements,
    maneuverTime: Date
  ): ManeuverPlan {
    // Simplified Hohmann transfer calculation
    const r1 = currentOrbit.semiMajorAxis;
    const r2 = targetOrbit.semiMajorAxis;
    
    // Transfer orbit semi-major axis
    const aTransfer = (r1 + r2) / 2;
    
    // Velocity changes
    const v1 = Math.sqrt(EARTH_MU / r1);
    const vTransfer1 = Math.sqrt(EARTH_MU * (2 / r1 - 1 / aTransfer));
    const deltaV1 = Math.abs(vTransfer1 - v1);
    
    const v2 = Math.sqrt(EARTH_MU / r2);
    const vTransfer2 = Math.sqrt(EARTH_MU * (2 / r2 - 1 / aTransfer));
    const deltaV2 = Math.abs(v2 - vTransfer2);
    
    // Total delta-v
    const totalDeltaV = deltaV1 + deltaV2;
    
    // Simplified burn time (would need specific impulse in reality)
    const burnTime = totalDeltaV / 0.001; // Assuming 1 mm/s² acceleration
    
    return {
      deltaV: {
        radial: 0,
        alongTrack: totalDeltaV * 1000, // Convert to m/s
        crossTrack: 0,
      },
      burnTime: burnTime,
      timestamp: maneuverTime,
      resultingOrbit: targetOrbit,
    };
  }

  /**
   * Calculate sensor field of view footprint
   */
  calculateSensorFootprint(
    satellitePosition: StateVector,
    sensorFOV: number, // degrees
    pointingVector?: { x: number; y: number; z: number }
  ): SensorFootprint {
    const r = Math.sqrt(
      satellitePosition.position.x ** 2 +
      satellitePosition.position.y ** 2 +
      satellitePosition.position.z ** 2
    );
    
    const altitude = r - EARTH_RADIUS;
    const halfAngle = sensorFOV / 2 * Math.PI / 180;
    
    // Ground swath width
    const swathWidth = 2 * altitude * Math.tan(halfAngle);
    
    // Convert satellite position to geodetic
    const gmst = satellite.gstime(satellitePosition.epoch);
    const geodetic = satellite.eciToGeodetic(satellitePosition.position, gmst);
    
    const centerLat = satellite.degreesLat(geodetic.latitude);
    const centerLon = satellite.degreesLong(geodetic.longitude);
    
    // Calculate footprint corners (simplified rectangular approximation)
    const latOffset = (swathWidth / 2) / 111; // Rough conversion km to degrees
    const lonOffset = (swathWidth / 2) / (111 * Math.cos(centerLat * Math.PI / 180));
    
    const corners = [
      { latitude: centerLat + latOffset, longitude: centerLon + lonOffset },
      { latitude: centerLat + latOffset, longitude: centerLon - lonOffset },
      { latitude: centerLat - latOffset, longitude: centerLon - lonOffset },
      { latitude: centerLat - latOffset, longitude: centerLon + lonOffset },
    ];
    
    const area = swathWidth * swathWidth; // Simplified area calculation
    
    return {
      center: {
        latitude: centerLat,
        longitude: centerLon,
      },
      corners: corners,
      area: area,
      timestamp: satellitePosition.epoch,
    };
  }

  /**
   * Propagate orbit with J2 perturbation
   */
  propagateFromElements(
    elements: OrbitalElements,
    targetTime: Date
  ): StateVector {
    const dt = (targetTime.getTime() - elements.epoch.getTime()) / 1000; // seconds
    
    // Mean motion
    const n = Math.sqrt(EARTH_MU / Math.pow(elements.semiMajorAxis, 3));
    
    // J2 secular rates
    const p = elements.semiMajorAxis * (1 - elements.eccentricity ** 2);
    const incRad = elements.inclination * Math.PI / 180;
    
    const raanDot = -1.5 * n * J2 * Math.pow(EARTH_RADIUS / p, 2) * Math.cos(incRad);
    const argpDot = 0.75 * n * J2 * Math.pow(EARTH_RADIUS / p, 2) * (5 * Math.cos(incRad) ** 2 - 1);
    const mDot = n + 0.75 * n * J2 * Math.pow(EARTH_RADIUS / p, 2) * 
                 Math.sqrt(1 - elements.eccentricity ** 2) * (3 * Math.cos(incRad) ** 2 - 1);
    
    // Update elements
    const newElements: OrbitalElements = {
      ...elements,
      raan: (elements.raan + raanDot * dt * 180 / Math.PI) % 360,
      argumentOfPerigee: (elements.argumentOfPerigee + argpDot * dt * 180 / Math.PI) % 360,
      meanAnomaly: (elements.meanAnomaly || 0 + mDot * dt * 180 / Math.PI) % 360,
      epoch: targetTime,
    };
    
    // Convert mean anomaly to true anomaly
    const M = newElements.meanAnomaly! * Math.PI / 180;
    const e = elements.eccentricity;
    
    // Solve Kepler's equation (simplified)
    let E = M;
    for (let i = 0; i < 10; i++) {
      E = M + e * Math.sin(E);
    }
    
    const nu = Math.atan2(
      Math.sqrt(1 - e ** 2) * Math.sin(E),
      Math.cos(E) - e
    ) * 180 / Math.PI;
    
    newElements.trueAnomaly = nu;
    
    return this.elementsToState(newElements);
  }

  /**
   * Create Walker constellation
   */
  createWalkerConstellation(
    totalSatellites: number,
    planes: number,
    altitude: number, // km
    inclination: number // degrees
  ): ConstellationConfig {
    const satellitesPerPlane = Math.floor(totalSatellites / planes);
    const satellites: ConstellationConfig['satellites'] = [];
    
    for (let p = 0; p < planes; p++) {
      const raan = (360 / planes) * p;
      
      for (let s = 0; s < satellitesPerPlane; s++) {
        const meanAnomaly = (360 / satellitesPerPlane) * s;
        
        const elements: OrbitalElements = {
          semiMajorAxis: EARTH_RADIUS + altitude,
          eccentricity: 0,
          inclination: inclination,
          raan: raan,
          argumentOfPerigee: 0,
          trueAnomaly: meanAnomaly, // Simplified
          meanAnomaly: meanAnomaly,
          epoch: new Date(),
        };
        
        satellites.push({
          id: `SAT_${p}_${s}`,
          elements: elements,
        });
      }
    }
    
    return {
      satellites: satellites,
      phasing: {
        type: 'walker',
        planes: planes,
        satellitesPerPlane: satellitesPerPlane,
      },
    };
  }

  /**
   * Calculate inter-satellite links
   */
  calculateInterSatelliteLinks(
    constellation: ConstellationConfig,
    time: Date,
    maxRange: number = 5000 // km
  ): Array<{
    sat1: string;
    sat2: string;
    distance: number;
    isVisible: boolean;
  }> {
    const links: Array<{
      sat1: string;
      sat2: string;
      distance: number;
      isVisible: boolean;
    }> = [];
    
    const positions: Map<string, StateVector> = new Map();
    
    // Calculate all positions
    for (const sat of constellation.satellites) {
      let state: StateVector;
      
      if (sat.tle) {
        const [line1, line2] = sat.tle.split('\n');
        state = this.propagateFromTLE(line1, line2, time);
      } else if (sat.elements) {
        state = this.propagateFromElements(sat.elements, time);
      } else if (sat.state) {
        state = sat.state;
      } else {
        continue;
      }
      
      positions.set(sat.id, state);
    }
    
    // Calculate distances between all pairs
    const satIds = Array.from(positions.keys());
    for (let i = 0; i < satIds.length; i++) {
      for (let j = i + 1; j < satIds.length; j++) {
        const pos1 = positions.get(satIds[i])!;
        const pos2 = positions.get(satIds[j])!;
        
        const distance = Math.sqrt(
          Math.pow(pos1.position.x - pos2.position.x, 2) +
          Math.pow(pos1.position.y - pos2.position.y, 2) +
          Math.pow(pos1.position.z - pos2.position.z, 2)
        );
        
        // Check line of sight (simplified - just checking if Earth is in the way)
        const isVisible = this.checkLineOfSight(pos1.position, pos2.position);
        
        links.push({
          sat1: satIds[i],
          sat2: satIds[j],
          distance: distance,
          isVisible: isVisible && distance <= maxRange,
        });
      }
    }
    
    return links;
  }

  /**
   * Check line of sight between two positions
   */
  private checkLineOfSight(
    pos1: { x: number; y: number; z: number },
    pos2: { x: number; y: number; z: number }
  ): boolean {
    // Vector from pos1 to pos2
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    
    // Check if line intersects Earth sphere
    // Using parametric line equation and sphere equation
    const a = dx * dx + dy * dy + dz * dz;
    const b = 2 * (pos1.x * dx + pos1.y * dy + pos1.z * dz);
    const c = pos1.x * pos1.x + pos1.y * pos1.y + pos1.z * pos1.z - EARTH_RADIUS * EARTH_RADIUS;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      return true; // No intersection with Earth
    }
    
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    // Check if intersection is between the two satellites
    return !(t1 > 0 && t1 < 1) && !(t2 > 0 && t2 < 1);
  }

  /**
   * Export to CCSDS OEM format
   */
  exportToOEM(
    ephemerides: StateVector[],
    metadata: {
      objectName: string;
      objectId: string;
      centerName?: string;
      refFrame?: string;
    }
  ): string {
    let oem = 'CCSDS_OEM_VERS = 2.0\n';
    oem += `CREATION_DATE = ${new Date().toISOString()}\n`;
    oem += `ORIGINATOR = MissionPlanningSuite\n\n`;
    
    oem += 'META_START\n';
    oem += `OBJECT_NAME = ${metadata.objectName}\n`;
    oem += `OBJECT_ID = ${metadata.objectId}\n`;
    oem += `CENTER_NAME = ${metadata.centerName || 'EARTH'}\n`;
    oem += `REF_FRAME = ${metadata.refFrame || 'EME2000'}\n`;
    oem += 'TIME_SYSTEM = UTC\n';
    oem += `START_TIME = ${ephemerides[0].epoch.toISOString()}\n`;
    oem += `STOP_TIME = ${ephemerides[ephemerides.length - 1].epoch.toISOString()}\n`;
    oem += 'META_STOP\n\n';
    
    oem += 'DATA_START\n';
    for (const state of ephemerides) {
      oem += `${state.epoch.toISOString()} `;
      oem += `${state.position.x.toFixed(6)} ${state.position.y.toFixed(6)} ${state.position.z.toFixed(6)} `;
      oem += `${state.velocity.x.toFixed(9)} ${state.velocity.y.toFixed(9)} ${state.velocity.z.toFixed(9)}\n`;
    }
    oem += 'DATA_STOP\n';
    
    return oem;
  }

  /**
   * Import from CCSDS OEM format
   */
  importFromOEM(oemContent: string): {
    metadata: any;
    ephemerides: StateVector[];
  } {
    const lines = oemContent.split('\n');
    const metadata: any = {};
    const ephemerides: StateVector[] = [];
    
    let inMeta = false;
    let inData = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === 'META_START') {
        inMeta = true;
      } else if (trimmed === 'META_STOP') {
        inMeta = false;
      } else if (trimmed === 'DATA_START') {
        inData = true;
      } else if (trimmed === 'DATA_STOP') {
        inData = false;
      } else if (inMeta) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join('=').trim();
        }
      } else if (inData && trimmed) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 7) {
          ephemerides.push({
            position: {
              x: parseFloat(parts[1]),
              y: parseFloat(parts[2]),
              z: parseFloat(parts[3]),
            },
            velocity: {
              x: parseFloat(parts[4]),
              y: parseFloat(parts[5]),
              z: parseFloat(parts[6]),
            },
            epoch: new Date(parts[0]),
          });
        }
      }
    }
    
    return { metadata, ephemerides };
  }
}

// Export singleton instance
const orbitService = new OrbitService();
export default orbitService;
