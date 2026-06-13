/**
 * Real orbital-mechanics tests against the OrekitService JS fallback.
 *
 * In jsdom (`window` defined) OrekitService.initialize() short-circuits to
 * "mock mode" and every command is served by the pure-JS `calculateWithFallback`
 * implementation — no Java bridge, no child process. These tests therefore
 * exercise the actual production calculation code paths, not mocks of them, and
 * assert the results against textbook two-body / Keplerian values.
 */
import orekitService, { OrekitOrbitData } from "~~/services/orekit/orekitService";

const MU_EARTH = 398600.4418; // km³/s²
const EARTH_RADIUS = 6378.137; // km

// Near-circular ISS-like LEO.
const ISS_ORBIT: OrekitOrbitData = {
  epoch: new Date("2021-01-01T00:00:00Z"),
  semiMajorAxis: 6793.1,
  eccentricity: 0.0001,
  inclination: 51.64,
  raan: 12.3456,
  argumentOfPerigee: 45.6789,
  trueAnomaly: 314.1234,
};

// Perfectly circular equatorial orbit (analytically convenient).
const CIRCULAR_ORBIT: OrekitOrbitData = {
  epoch: new Date("2024-01-01T00:00:00Z"),
  semiMajorAxis: 7000,
  eccentricity: 0,
  inclination: 0,
  raan: 0,
  argumentOfPerigee: 0,
  trueAnomaly: 0,
};

describe("OrekitService.analyzeOrbit (JS fallback)", () => {
  it("computes ISS orbital period within the real ~92-93 min envelope", async () => {
    const result = await orekitService.analyzeOrbit(ISS_ORBIT);

    // Kepler's third law: T = 2π√(a³/μ).
    const expectedMinutes = (2 * Math.PI * Math.sqrt(ISS_ORBIT.semiMajorAxis ** 3 / MU_EARTH)) / 60;
    expect(result.orbitalPeriod).toBeCloseTo(expectedMinutes, 3);
    expect(result.orbitalPeriod).toBeGreaterThan(92);
    expect(result.orbitalPeriod).toBeLessThan(93);
  });

  it("derives apoapsis/periapsis altitudes consistent with the ISS altitude (~415 km)", async () => {
    const result = await orekitService.analyzeOrbit(ISS_ORBIT);

    const a = ISS_ORBIT.semiMajorAxis;
    const e = ISS_ORBIT.eccentricity;
    expect(result.apoapsisAltitude).toBeCloseTo(a * (1 + e) - EARTH_RADIUS, 6);
    expect(result.periapsisAltitude).toBeCloseTo(a * (1 - e) - EARTH_RADIUS, 6);
    // Apoapsis is never below periapsis.
    expect(result.apoapsisAltitude).toBeGreaterThanOrEqual(result.periapsisAltitude);
    expect(result.apoapsisAltitude).toBeGreaterThan(410);
    expect(result.apoapsisAltitude).toBeLessThan(420);
  });

  it("yields equal apoapsis and periapsis for a circular orbit", async () => {
    const result = await orekitService.analyzeOrbit(CIRCULAR_ORBIT);

    expect(result.apoapsisAltitude).toBeCloseTo(result.periapsisAltitude, 6);
    expect(result.apoapsisAltitude).toBeCloseTo(CIRCULAR_ORBIT.semiMajorAxis - EARTH_RADIUS, 6);
    expect(result.eclipseDuration).toBeGreaterThan(0);
    expect(typeof result.sunSynchronous).toBe("boolean");
  });

  it("monotonically increases orbital period with semi-major axis", async () => {
    const low = await orekitService.analyzeOrbit({ ...CIRCULAR_ORBIT, semiMajorAxis: 7000 });
    const high = await orekitService.analyzeOrbit({ ...CIRCULAR_ORBIT, semiMajorAxis: 8000 });
    expect(high.orbitalPeriod).toBeGreaterThan(low.orbitalPeriod);
  });
});

describe("OrekitService.propagateOrbit (JS fallback)", () => {
  it("keeps altitude constant around a circular orbit", async () => {
    const target = new Date(CIRCULAR_ORBIT.epoch.getTime() + 30 * 60 * 1000); // +30 min
    const [state] = await orekitService.propagateOrbit(CIRCULAR_ORBIT, target);

    expect(state).toBeDefined();
    // Circular orbit ⇒ radius == a at all times ⇒ altitude == a - R.
    expect(state.altitude).toBeCloseTo(CIRCULAR_ORBIT.semiMajorAxis - EARTH_RADIUS, 3);
    expect(state.timestamp.getTime()).toBe(target.getTime());
  });

  it("produces a position vector whose magnitude matches the orbital radius", async () => {
    const target = new Date(CIRCULAR_ORBIT.epoch.getTime() + 12 * 60 * 1000);
    const [state] = await orekitService.propagateOrbit(CIRCULAR_ORBIT, target);

    const radius = Math.hypot(state.position.x, state.position.y, state.position.z);
    expect(radius).toBeCloseTo(CIRCULAR_ORBIT.semiMajorAxis, 3);
    // Sub-satellite point must be a valid geodetic coordinate even though Earth
    // rotation accumulates over the propagation (longitude is wrapped to [-180,180)).
    expect(Math.abs(state.latitude)).toBeLessThanOrEqual(90);
    expect(state.longitude).toBeGreaterThanOrEqual(-180);
    expect(state.longitude).toBeLessThan(180);
  });

  it("wraps ground-track longitude into range even after a long (multi-orbit) propagation", async () => {
    const target = new Date(CIRCULAR_ORBIT.epoch.getTime() + 6 * 60 * 60 * 1000); // +6 hours
    const [state] = await orekitService.propagateOrbit(CIRCULAR_ORBIT, target);

    expect(state.longitude).toBeGreaterThanOrEqual(-180);
    expect(state.longitude).toBeLessThan(180);
    expect(state.altitude).toBeCloseTo(CIRCULAR_ORBIT.semiMajorAxis - EARTH_RADIUS, 3);
  });

  it("rejects invalid orbit data instead of returning garbage", async () => {
    await expect(
      orekitService.propagateOrbit(
        { ...CIRCULAR_ORBIT, semiMajorAxis: 0 },
        new Date(CIRCULAR_ORBIT.epoch.getTime() + 1000),
      ),
    ).rejects.toThrow();
  });

  it("rejects an invalid target time", async () => {
    await expect(orekitService.propagateOrbit(CIRCULAR_ORBIT, new Date("not-a-date"))).rejects.toThrow();
  });
});
