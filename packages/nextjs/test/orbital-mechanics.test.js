/**
 * Test orbital mechanics calculations with known data
 * Validates the OrekitService fallback calculations
 */

// Test ISS orbital data (approximate)
const ISS_TLE_LINE1 = "1 25544U 98067A   21001.00000000  .00001234  00000-0  12345-4 0  9998";
const ISS_TLE_LINE2 = "2 25544  51.6400  12.3456 0000123  45.6789 314.1234 15.49123456123457";

const ISS_ORBIT_ELEMENTS = {
  epoch: new Date("2021-01-01T00:00:00Z"),
  semiMajorAxis: 6793.1, // km (approximate ISS altitude ~415km)
  eccentricity: 0.0001,
  inclination: 51.64,
  raan: 12.3456,
  argumentOfPerigee: 45.6789,
  trueAnomaly: 314.1234,
};

// Test with simple circular orbit
const CIRCULAR_ORBIT = {
  epoch: new Date("2024-01-01T00:00:00Z"),
  semiMajorAxis: 7000, // 622 km altitude
  eccentricity: 0.0,
  inclination: 0.0,
  raan: 0.0,
  argumentOfPerigee: 0.0,
  trueAnomaly: 0.0,
};

async function testOrbitalCalculations() {
  console.log("Testing Orbital Mechanics Calculations...\n");

  try {
    // Import the service (Node.js environment)
    const { OrekitService } = await import("../services/orekit/orekitService.ts");
    const orekitService = new OrekitService();

    // Test 1: Orbit Analysis
    console.log("=== Test 1: Orbit Analysis ===");
    const analysis = await orekitService.analyzeOrbit(ISS_ORBIT_ELEMENTS);
    console.log("ISS Orbit Analysis:");
    console.log(`  Orbital Period: ${analysis.orbitalPeriod.toFixed(2)} minutes`);
    console.log(`  Apoapsis: ${analysis.apoapsisAltitude.toFixed(1)} km`);
    console.log(`  Periapsis: ${analysis.periapsisAltitude.toFixed(1)} km`);
    console.log(`  Sun Synchronous: ${analysis.sunSynchronous}`);

    // Validate ISS period (should be ~93 minutes)
    if (Math.abs(analysis.orbitalPeriod - 93) > 5) {
      console.error("❌ ISS orbital period incorrect");
    } else {
      console.log("✅ ISS orbital period reasonable");
    }

    // Test 2: TLE to Keplerian conversion
    console.log("\n=== Test 2: TLE Conversion ===");
    const keplerian = await orekitService.tleToKeplerian(ISS_TLE_LINE1, ISS_TLE_LINE2);
    console.log("Converted TLE to Keplerian:");
    console.log(`  Semi-major axis: ${keplerian.semiMajorAxis.toFixed(1)} km`);
    console.log(`  Eccentricity: ${keplerian.eccentricity.toFixed(6)}`);
    console.log(`  Inclination: ${keplerian.inclination.toFixed(2)}°`);

    // Test 3: Orbit Propagation
    console.log("\n=== Test 3: Orbit Propagation ===");
    const targetTime = new Date(ISS_ORBIT_ELEMENTS.epoch.getTime() + 3600000); // 1 hour later
    const propagation = await orekitService.propagateOrbit(ISS_ORBIT_ELEMENTS, targetTime);

    if (propagation.length > 0) {
      const result = propagation[0];
      console.log("Propagated position after 1 hour:");
      console.log(
        `  Position: (${result.position.x.toFixed(1)}, ${result.position.y.toFixed(1)}, ${result.position.z.toFixed(1)}) km`,
      );
      console.log(
        `  Velocity: (${result.velocity.vx.toFixed(3)}, ${result.velocity.vy.toFixed(3)}, ${result.velocity.vz.toFixed(3)}) km/s`,
      );
      console.log(`  Lat/Lon: ${result.latitude.toFixed(2)}°, ${result.longitude.toFixed(2)}°`);
      console.log(`  Altitude: ${result.altitude.toFixed(1)} km`);

      // Validate reasonable orbital velocity (should be ~7.5 km/s)
      const speed = Math.sqrt(result.velocity.vx ** 2 + result.velocity.vy ** 2 + result.velocity.vz ** 2);
      console.log(`  Orbital speed: ${speed.toFixed(3)} km/s`);

      if (speed < 6 || speed > 9) {
        console.error("❌ Orbital velocity unreasonable");
      } else {
        console.log("✅ Orbital velocity reasonable");
      }

      // Validate altitude is maintained (circular orbit assumption)
      if (Math.abs(result.altitude - (ISS_ORBIT_ELEMENTS.semiMajorAxis - 6378.137)) > 50) {
        console.error("❌ Altitude not maintained in propagation");
      } else {
        console.log("✅ Altitude reasonably maintained");
      }
    }

    // Test 4: Ground Pass Calculation
    console.log("\n=== Test 4: Ground Pass Calculation ===");
    const groundStation = {
      latitude: 28.5, // Kennedy Space Center
      longitude: -80.6,
      altitude: 0.01,
      minElevation: 10,
    };

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 86400000); // 24 hours

    const passes = await orekitService.calculateGroundPasses(ISS_ORBIT_ELEMENTS, groundStation, startTime, endTime);

    console.log(`Ground passes for KSC: ${passes.length}`);
    if (passes.length > 0) {
      console.log(`First pass: ${passes[0].startTime.toISOString()}`);
      console.log(`  Duration: ${passes[0].duration} seconds`);
      console.log(`  Max elevation: ${passes[0].maxElevation.toFixed(1)}°`);

      if (passes.length < 10 || passes.length > 20) {
        console.error("❌ Unexpected number of daily passes");
      } else {
        console.log("✅ Reasonable number of daily passes");
      }
    }

    // Test 5: Maneuver Calculation
    console.log("\n=== Test 5: Maneuver Calculation ===");
    const targetOrbit = {
      ...ISS_ORBIT_ELEMENTS,
      semiMajorAxis: 7100, // Raise orbit by ~300km
    };

    const maneuver = await orekitService.calculateManeuver(ISS_ORBIT_ELEMENTS, targetOrbit, "HOHMANN");

    console.log("Hohmann Transfer:");
    console.log(`  Delta-V: ${maneuver.deltaV.toFixed(1)} m/s`);
    console.log(`  Burn time: ${maneuver.burnTime.toFixed(1)} seconds`);

    if (maneuver.deltaV < 50 || maneuver.deltaV > 500) {
      console.error("❌ Delta-V for altitude change unreasonable");
    } else {
      console.log("✅ Delta-V for altitude change reasonable");
    }

    console.log("\n🎯 Orbital mechanics test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Run tests if this file is executed directly
if (typeof require !== "undefined" && require.main === module) {
  testOrbitalCalculations();
}

module.exports = { testOrbitalCalculations };
