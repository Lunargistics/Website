/**
 * Orekit Orbital Mechanics API
 * Professional orbital calculations with rate limiting and input validation
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "~~/lib/creditMiddleware";
import { InputSanitizer, withRateLimit } from "~~/lib/rate-limit";
import {
  GroundStationSchema,
  LaunchWindowRequestSchema,
  ManeuverRequestSchema,
  OrbitDataSchema,
  SolarPowerRequestSchema, // TLESchema, // Future use for TLE validation
  validateRequest,
} from "~~/lib/validation";
import OrekitService from "~~/services/orekit/orekitService";

// POST /api/orekit - Orbital mechanics calculations
export async function POST(request: NextRequest) {
  return withRateLimit(request, "orbital", async () => {
    return withAuth(request, async _userId => {
      try {
        const rawBody = await request.json();
        const body = InputSanitizer.sanitizeObject(rawBody);

        if (!body.action) {
          return NextResponse.json(
            {
              error: "Action is required",
              code: "MISSING_ACTION",
              availableActions: [
                "propagateOrbit",
                "analyzeOrbit",
                "tleToKeplerian",
                "calculateGroundPasses",
                "calculateManeuver",
                "calculateLaunchWindow",
                "predictSolarPower",
                "calculateStationKeeping",
              ],
            },
            { status: 400 },
          );
        }

        const action = InputSanitizer.sanitizeString(body.action, 50);

        switch (action) {
          case "propagateOrbit": {
            if (!body.orbit) {
              return NextResponse.json(
                {
                  error: "Orbit data is required",
                },
                { status: 400 },
              );
            }

            const validation = validateRequest(OrbitDataSchema, body.orbit);
            if (!validation.success) {
              return NextResponse.json(
                {
                  error: "Invalid orbit data",
                  details: validation.error,
                },
                { status: 400 },
              );
            }

            const targetTime = body.targetTime ? new Date(body.targetTime) : new Date(Date.now() + 3600000);
            if (!targetTime || isNaN(targetTime.getTime())) {
              return NextResponse.json(
                {
                  error: "Invalid target time",
                },
                { status: 400 },
              );
            }

            const options = body.options ? InputSanitizer.sanitizeObject(body.options) : {};

            const result = await OrekitService.propagateOrbit(validation.data, targetTime, options);

            return NextResponse.json({
              action: "propagateOrbit",
              result,
              metadata: {
                targetTime: targetTime.toISOString(),
                options,
                calculatedAt: new Date().toISOString(),
              },
              success: true,
            });
          }

          case "analyzeOrbit": {
            if (!body.orbit) {
              return NextResponse.json(
                {
                  error: "Orbit data is required",
                },
                { status: 400 },
              );
            }

            const validation = validateRequest(OrbitDataSchema, body.orbit);
            if (!validation.success) {
              return NextResponse.json(
                {
                  error: "Invalid orbit data",
                  details: validation.error,
                },
                { status: 400 },
              );
            }

            const result = await OrekitService.analyzeOrbit(validation.data);

            return NextResponse.json({
              action: "analyzeOrbit",
              result,
              metadata: {
                calculatedAt: new Date().toISOString(),
                orbitType: classifyOrbit(result),
              },
              success: true,
            });
          }

          case "tleToKeplerian": {
            if (!body.tle || !body.tle.line1 || !body.tle.line2) {
              return NextResponse.json(
                {
                  error: "TLE lines are required",
                  expected: {
                    tle: {
                      line1: "69-character TLE line 1",
                      line2: "69-character TLE line 2",
                    },
                  },
                },
                { status: 400 },
              );
            }

            try {
              const line1 = InputSanitizer.sanitizeString(body.tle.line1, 69);
              const line2 = InputSanitizer.sanitizeString(body.tle.line2, 69);

              // Validate TLE format
              if (line1.length !== 69 || line2.length !== 69) {
                return NextResponse.json(
                  {
                    error: "TLE lines must be exactly 69 characters",
                    received: {
                      line1Length: line1.length,
                      line2Length: line2.length,
                    },
                  },
                  { status: 400 },
                );
              }

              if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) {
                return NextResponse.json(
                  {
                    error: "Invalid TLE format - lines must start with '1 ' and '2 '",
                  },
                  { status: 400 },
                );
              }

              const result = await OrekitService.tleToKeplerian(line1, line2);

              return NextResponse.json({
                action: "tleToKeplerian",
                result,
                metadata: {
                  satNumber: line1.substring(2, 7).trim(),
                  classification: line1.substring(7, 8),
                  epochYear: line1.substring(18, 20),
                  epochDay: line1.substring(20, 32),
                  calculatedAt: new Date().toISOString(),
                },
                success: true,
              });
            } catch (error) {
              return NextResponse.json(
                {
                  error: "TLE parsing failed",
                  details: error instanceof Error ? error.message : "Invalid TLE format",
                },
                { status: 400 },
              );
            }
          }

          case "calculateGroundPasses": {
            if (!body.orbit || !body.groundStation) {
              return NextResponse.json(
                {
                  error: "Orbit and ground station data are required",
                },
                { status: 400 },
              );
            }

            const orbitValidation = validateRequest(OrbitDataSchema, body.orbit);
            if (!orbitValidation.success) {
              return NextResponse.json(
                {
                  error: "Invalid orbit data",
                  details: orbitValidation.error,
                },
                { status: 400 },
              );
            }

            const stationValidation = validateRequest(GroundStationSchema, body.groundStation);
            if (!stationValidation.success) {
              return NextResponse.json(
                {
                  error: "Invalid ground station data",
                  details: stationValidation.error,
                },
                { status: 400 },
              );
            }

            const startTime = body.startTime ? new Date(body.startTime) : new Date();
            const endTime = body.endTime ? new Date(body.endTime) : new Date(startTime.getTime() + 86400000);

            if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
              return NextResponse.json(
                {
                  error: "Invalid start or end time",
                },
                { status: 400 },
              );
            }

            if (startTime >= endTime) {
              return NextResponse.json(
                {
                  error: "Start time must be before end time",
                },
                { status: 400 },
              );
            }

            // Limit calculation window to prevent excessive computation
            const maxDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
            if (endTime.getTime() - startTime.getTime() > maxDuration) {
              return NextResponse.json(
                {
                  error: "Time range too large - maximum 7 days allowed",
                },
                { status: 400 },
              );
            }

            const result = await OrekitService.calculateGroundPasses(
              orbitValidation.data,
              stationValidation.data,
              startTime,
              endTime,
            );

            return NextResponse.json({
              action: "calculateGroundPasses",
              result,
              metadata: {
                groundStation: stationValidation.data,
                timeRange: {
                  start: startTime.toISOString(),
                  end: endTime.toISOString(),
                  durationHours: (endTime.getTime() - startTime.getTime()) / 3600000,
                },
                calculatedAt: new Date().toISOString(),
              },
              success: true,
            });
          }

          case "calculateManeuver": {
            if (!body.currentOrbit || !body.targetOrbit || !body.maneuverType) {
              return NextResponse.json(
                {
                  error: "Current orbit, target orbit, and maneuver type are required",
                },
                { status: 400 },
              );
            }

            const validation = validateRequest(ManeuverRequestSchema, {
              currentOrbit: body.currentOrbit,
              targetOrbit: body.targetOrbit,
              maneuverType: body.maneuverType,
            });

            if (!validation.success) {
              return NextResponse.json(
                {
                  error: "Invalid maneuver data",
                  details: validation.error,
                },
                { status: 400 },
              );
            }

            // For now, only HOHMANN transfers are implemented
            const supportedTypes = ["HOHMANN", "BIELLIPTICAL", "PLANE_CHANGE", "COMBINED"];
            const maneuverType = supportedTypes.includes(validation.data.maneuverType)
              ? (validation.data.maneuverType as "HOHMANN" | "BIELLIPTICAL" | "PLANE_CHANGE" | "COMBINED")
              : "HOHMANN";

            const result = await OrekitService.calculateManeuver(
              validation.data.currentOrbit,
              validation.data.targetOrbit,
              maneuverType,
            );

            // Calculate fuel requirements if spacecraft mass provided
            const spacecraftMass = body.spacecraftMass
              ? InputSanitizer.sanitizeNumber(body.spacecraftMass, 1, 100000)
              : null;
            const specificImpulse = body.specificImpulse
              ? InputSanitizer.sanitizeNumber(body.specificImpulse, 100, 500)
              : 300;

            let fuelRequirements = null;
            if (spacecraftMass) {
              const g0 = 9.80665;
              const massRatio = Math.exp(result.deltaV / ((specificImpulse * g0) / 1000));
              const propellantMass = spacecraftMass * (massRatio - 1);

              fuelRequirements = {
                propellantMass: Math.round(propellantMass * 100) / 100,
                massRatio: Math.round(massRatio * 1000) / 1000,
                finalMass: Math.round((spacecraftMass - propellantMass) * 100) / 100,
              };
            }

            return NextResponse.json({
              action: "calculateManeuver",
              result,
              fuelRequirements,
              metadata: {
                spacecraftMass,
                specificImpulse,
                maneuverType: validation.data.maneuverType,
                calculatedAt: new Date().toISOString(),
              },
              success: true,
            });
          }

          case "calculateLaunchWindow": {
            if (!body.launchSite || !body.targetOrbit) {
              return NextResponse.json(
                {
                  error: "Launch site and target orbit are required",
                },
                { status: 400 },
              );
            }

            // Set default search times if not provided
            const searchStart = body.searchStart ? new Date(body.searchStart) : new Date();
            const searchEnd = body.searchEnd
              ? new Date(body.searchEnd)
              : new Date(searchStart.getTime() + 30 * 86400000); // 30 days

            const validation = validateRequest(LaunchWindowRequestSchema, {
              launchSite: body.launchSite,
              targetOrbit: body.targetOrbit,
              searchStart: searchStart.toISOString(),
              searchEnd: searchEnd.toISOString(),
            });

            if (!validation.success) {
              return NextResponse.json(
                {
                  error: "Invalid launch window data",
                  details: validation.error,
                },
                { status: 400 },
              );
            }

            const result = await OrekitService.calculateLaunchWindow(
              validation.data.launchSite,
              validation.data.targetOrbit,
              searchStart,
              searchEnd,
            );

            return NextResponse.json({
              action: "calculateLaunchWindow",
              result,
              metadata: {
                searchDays: (searchEnd.getTime() - searchStart.getTime()) / 86400000,
                launchConstraints: {
                  minInclination: Math.abs(validation.data.launchSite.latitude),
                  energyOptimal: validation.data.launchSite.latitude < validation.data.targetOrbit.inclination,
                },
                calculatedAt: new Date().toISOString(),
              },
              success: true,
            });
          }

          case "predictSolarPower": {
            if (!body.orbit || !body.spacecraftConfig) {
              return NextResponse.json(
                {
                  error: "Orbit and spacecraft configuration are required",
                },
                { status: 400 },
              );
            }

            const startTime = body.startTime ? new Date(body.startTime) : new Date();
            const duration = body.duration ? InputSanitizer.sanitizeNumber(body.duration, 1, 168) : 24; // Max 1 week

            const validation = validateRequest(SolarPowerRequestSchema, {
              orbit: body.orbit,
              spacecraftConfig: body.spacecraftConfig,
              startTime: startTime.toISOString(),
              duration,
            });

            if (!validation.success) {
              return NextResponse.json(
                {
                  error: "Invalid solar power prediction data",
                  details: validation.error,
                },
                { status: 400 },
              );
            }

            const result = await OrekitService.predictSolarPower(
              validation.data.orbit,
              validation.data.spacecraftConfig,
              startTime,
              duration,
            );

            // Calculate summary statistics
            const totalPower = result.reduce((sum, p) => sum + p.power, 0);
            const avgPower = totalPower / result.length;
            const maxPower = Math.max(...result.map(p => p.power));
            const eclipseTime = result.filter(p => p.eclipsed).length;

            return NextResponse.json({
              action: "predictSolarPower",
              result,
              summary: {
                averagePower: Math.round(avgPower * 100) / 100,
                maximumPower: Math.round(maxPower * 100) / 100,
                totalEnergy: Math.round(totalPower * 100) / 100,
                eclipsePercentage: Math.round((eclipseTime / result.length) * 10000) / 100,
                eclipseHoursPerDay: Math.round((eclipseTime / result.length) * 24 * 100) / 100,
              },
              metadata: {
                duration,
                dataPoints: result.length,
                calculatedAt: new Date().toISOString(),
              },
              success: true,
            });
          }

          case "calculateStationKeeping": {
            if (!body.orbit || !body.tolerances || typeof body.duration !== "number") {
              return NextResponse.json(
                {
                  error: "Orbit, tolerances, and duration are required",
                },
                { status: 400 },
              );
            }

            const orbitValidation = validateRequest(OrbitDataSchema, body.orbit);
            if (!orbitValidation.success) {
              return NextResponse.json(
                {
                  error: "Invalid orbit data",
                  details: orbitValidation.error,
                },
                { status: 400 },
              );
            }

            const tolerancesData = InputSanitizer.sanitizeObject(body.tolerances);
            const tolerances = {
              semiMajorAxis: InputSanitizer.sanitizeNumber(tolerancesData.semiMajorAxis || 1, 0.1, 100),
              eccentricity: InputSanitizer.sanitizeNumber(tolerancesData.eccentricity || 0.001, 0.0001, 0.1),
              inclination: InputSanitizer.sanitizeNumber(tolerancesData.inclination || 0.1, 0.01, 10),
            };
            const duration = InputSanitizer.sanitizeNumber(body.duration, 1, 365); // Max 1 year

            const result = await OrekitService.calculateStationKeeping(orbitValidation.data, tolerances, duration);

            return NextResponse.json({
              action: "calculateStationKeeping",
              result,
              metadata: {
                duration,
                tolerances,
                maneuverCount: result.maneuvers.length,
                estimatedCost: {
                  fuelKg: result.fuelRequired,
                  deltaVTotal: result.totalDeltaV,
                },
                calculatedAt: new Date().toISOString(),
              },
              success: true,
            });
          }

          // Legacy action support for backward compatibility
          case "parseTLE":
          case "tleToKeplerian":
            if (!body.data?.line1 || !body.data?.line2) {
              return NextResponse.json(
                {
                  error: "TLE data is required",
                  hint: "Use action 'tleToKeplerian' with tle.line1 and tle.line2",
                },
                { status: 400 },
              );
            }

            const legacyResult = await OrekitService.tleToKeplerian(body.data.line1, body.data.line2);
            return NextResponse.json({
              action: "tleToKeplerian",
              result: legacyResult,
              legacy: true,
              success: true,
            });

          default:
            return NextResponse.json(
              {
                error: "Unknown action",
                code: "UNKNOWN_ACTION",
                received: action,
                availableActions: [
                  "propagateOrbit",
                  "analyzeOrbit",
                  "tleToKeplerian",
                  "calculateGroundPasses",
                  "calculateManeuver",
                  "calculateLaunchWindow",
                  "predictSolarPower",
                  "calculateStationKeeping",
                ],
              },
              { status: 400 },
            );
        }
      } catch (error) {
        console.error("Error in orbital calculation:", error);

        // Provide more specific error information
        if (error instanceof Error) {
          if (error.message.includes("Invalid orbit")) {
            return NextResponse.json(
              {
                error: "Invalid orbital parameters",
                details: error.message,
                code: "INVALID_ORBIT_DATA",
              },
              { status: 400 },
            );
          } else if (error.message.includes("Rate limit")) {
            return NextResponse.json(
              {
                error: "Rate limit exceeded",
                details: error.message,
                code: "RATE_LIMIT_EXCEEDED",
              },
              { status: 429 },
            );
          }
        }

        return NextResponse.json(
          {
            error: "Orbital calculation failed",
            code: "CALCULATION_ERROR",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    });
  });
}

// Helper function to classify orbits
function classifyOrbit(analysis: any): string {
  const { apoapsisAltitude, periapsisAltitude, sunSynchronous } = analysis;

  if (periapsisAltitude < 200) return "Suborbital";
  if (sunSynchronous) return "Sun-Synchronous";
  if (apoapsisAltitude < 2000) return "LEO (Low Earth Orbit)";
  if (apoapsisAltitude > 35700 && apoapsisAltitude < 35800 && periapsisAltitude > 35700) {
    return "GEO (Geostationary)";
  }
  if (periapsisAltitude < 2000 && apoapsisAltitude > 35000) {
    return "GTO (Geostationary Transfer)";
  }
  if (apoapsisAltitude > 20000) return "HEO (High Earth Orbit)";
  return "MEO (Medium Earth Orbit)";
}
