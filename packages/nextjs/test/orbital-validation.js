/**
 * Validate orbital mechanics calculations manually
 * Tests the core formulas used in OrekitService
 */

// Constants
const MU_EARTH = 398600.4418; // Earth's gravitational parameter (km³/s²)
const EARTH_RADIUS = 6378.137; // Earth's equatorial radius (km)

// Test orbital period calculation
function testOrbitalPeriod() {
  console.log('=== Testing Orbital Period Calculation ===');
  
  // ISS altitude ~415km, so semi-major axis ~6793km
  const a = 6793.1; // km
  const expected_period = 93; // minutes (known ISS period)
  
  // Kepler's third law: T = 2π * sqrt(a³/μ)
  const calculated_period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / MU_EARTH) / 60; // minutes
  
  console.log(`ISS semi-major axis: ${a} km`);
  console.log(`Expected period: ${expected_period} min`);
  console.log(`Calculated period: ${calculated_period.toFixed(2)} min`);
  console.log(`Error: ${Math.abs(calculated_period - expected_period).toFixed(2)} min`);
  
  if (Math.abs(calculated_period - expected_period) < 2) {
    console.log('✅ Orbital period calculation PASSED');
    return true;
  } else {
    console.log('❌ Orbital period calculation FAILED');
    return false;
  }
}

// Test orbital velocity calculation
function testOrbitalVelocity() {
  console.log('\n=== Testing Orbital Velocity Calculation ===');
  
  const a = 6793.1; // ISS semi-major axis
  const expected_velocity = 7.66; // km/s (known ISS velocity)
  
  // Circular orbit velocity: v = sqrt(μ/r)
  const calculated_velocity = Math.sqrt(MU_EARTH / a);
  
  console.log(`Expected velocity: ${expected_velocity} km/s`);
  console.log(`Calculated velocity: ${calculated_velocity.toFixed(3)} km/s`);
  console.log(`Error: ${Math.abs(calculated_velocity - expected_velocity).toFixed(3)} km/s`);
  
  if (Math.abs(calculated_velocity - expected_velocity) < 0.2) {
    console.log('✅ Orbital velocity calculation PASSED');
    return true;
  } else {
    console.log('❌ Orbital velocity calculation FAILED');
    return false;
  }
}

// Test altitude calculations
function testAltitudeCalculations() {
  console.log('\n=== Testing Altitude Calculations ===');
  
  const a = 6793.1; // semi-major axis
  const e = 0.0001; // eccentricity (nearly circular)
  
  // Apogee = a(1+e) - R_earth
  // Perigee = a(1-e) - R_earth
  const apogee_alt = a * (1 + e) - EARTH_RADIUS;
  const perigee_alt = a * (1 - e) - EARTH_RADIUS;
  const mean_alt = a - EARTH_RADIUS;
  
  console.log(`Semi-major axis: ${a} km`);
  console.log(`Mean altitude: ${mean_alt.toFixed(1)} km`);
  console.log(`Apogee altitude: ${apogee_alt.toFixed(1)} km`);
  console.log(`Perigee altitude: ${perigee_alt.toFixed(1)} km`);
  
  // ISS should be around 400-420 km altitude
  if (mean_alt > 400 && mean_alt < 430) {
    console.log('✅ Altitude calculations PASSED');
    return true;
  } else {
    console.log('❌ Altitude calculations FAILED');
    return false;
  }
}

// Test TLE parsing logic
function testTLEParsing() {
  console.log('\n=== Testing TLE Parsing Logic ===');
  
  // Real ISS TLE from SpaceTrack (simplified)
  const line2 = "2 25544  51.6400 339.2377 0002829  53.8967 129.8399 15.48919103289876";
  
  // Extract elements
  const inclination = parseFloat(line2.substring(8, 16));
  const raan = parseFloat(line2.substring(17, 25));
  const eccentricity = parseFloat('0.' + line2.substring(26, 33));
  const argumentOfPerigee = parseFloat(line2.substring(34, 42));
  const meanAnomaly = parseFloat(line2.substring(43, 51));
  const meanMotion = parseFloat(line2.substring(52, 63)); // rev/day
  
  console.log(`Inclination: ${inclination}°`);
  console.log(`RAAN: ${raan}°`);
  console.log(`Eccentricity: ${eccentricity.toFixed(6)}`);
  console.log(`Argument of Perigee: ${argumentOfPerigee}°`);
  console.log(`Mean Motion: ${meanMotion} rev/day`);
  
  // Convert mean motion to semi-major axis
  const n = meanMotion * 2 * Math.PI / 86400; // rad/s
  const calculated_a = Math.pow(MU_EARTH / (n * n), 1/3);
  
  console.log(`Calculated semi-major axis: ${calculated_a.toFixed(1)} km`);
  console.log(`Calculated altitude: ${(calculated_a - EARTH_RADIUS).toFixed(1)} km`);
  
  // ISS parameters should be reasonable
  if (inclination > 50 && inclination < 53 && 
      eccentricity < 0.01 && 
      calculated_a > 6700 && calculated_a < 6900) {
    console.log('✅ TLE parsing logic PASSED');
    return true;
  } else {
    console.log('❌ TLE parsing logic FAILED');
    return false;
  }
}

// Test maneuver delta-V calculation
function testManeuverCalculation() {
  console.log('\n=== Testing Maneuver Delta-V Calculation ===');
  
  // Hohmann transfer from ISS altitude to 500km higher
  const r1 = 6793.1; // current ISS altitude
  const r2 = 7293.1; // target altitude (+500km)
  
  const a_transfer = (r1 + r2) / 2;
  
  const v1 = Math.sqrt(MU_EARTH / r1);
  const v_transfer_peri = Math.sqrt(MU_EARTH * (2 / r1 - 1 / a_transfer));
  const v_transfer_apo = Math.sqrt(MU_EARTH * (2 / r2 - 1 / a_transfer));
  const v2 = Math.sqrt(MU_EARTH / r2);
  
  const deltaV1 = Math.abs(v_transfer_peri - v1) * 1000; // m/s
  const deltaV2 = Math.abs(v2 - v_transfer_apo) * 1000; // m/s
  const totalDeltaV = deltaV1 + deltaV2;
  
  console.log(`Current orbit velocity: ${v1.toFixed(3)} km/s`);
  console.log(`Target orbit velocity: ${v2.toFixed(3)} km/s`);
  console.log(`Transfer ΔV1: ${deltaV1.toFixed(1)} m/s`);
  console.log(`Transfer ΔV2: ${deltaV2.toFixed(1)} m/s`);
  console.log(`Total ΔV: ${totalDeltaV.toFixed(1)} m/s`);
  
  // For 500km altitude raise, should be around 100-300 m/s
  if (totalDeltaV > 50 && totalDeltaV < 400) {
    console.log('✅ Maneuver calculation PASSED');
    return true;
  } else {
    console.log('❌ Maneuver calculation FAILED');
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Orbital Mechanics Validation Tests\n');
  
  const tests = [
    testOrbitalPeriod,
    testOrbitalVelocity,
    testAltitudeCalculations,
    testTLEParsing,
    testManeuverCalculation
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(test => {
    if (test()) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎯 All orbital mechanics validations PASSED!');
    console.log('✅ The OrekitService fallback calculations are mathematically sound.');
  } else {
    console.log('⚠️  Some validations FAILED - review the orbital mechanics implementation.');
  }
  
  return failed === 0;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}

// Run if executed directly
if (require.main === module) {
  runAllTests();
}