/**
 * Request validation schemas using Zod
 * Ensures all API requests are properly validated
 */
import { z } from 'zod';

// Mission validation schema
const MissionSchema = z.object({
  name: z.string()
    .min(1, "Mission name is required")
    .max(100, "Mission name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Mission name can only contain letters, numbers, spaces, hyphens, and underscores"),
  
  type: z.enum([
    "Earth Observation",
    "Communication", 
    "Scientific Research",
    "Technology Demonstration",
    "Navigation",
    "Weather Monitoring",
    "Deep Space",
    "Planetary Exploration",
    "Space Debris Removal",
    "Manufacturing",
    "Resource Extraction",
    "Space Tourism",
    "Other"
  ]),
  
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
  
  objectives: z.array(z.string().min(1)).min(1, "At least one objective is required"),
  
  phases: z.array(z.object({
    name: z.string().min(1, "Phase name is required"),
    startDate: z.string().datetime("Invalid start date format"),
    endDate: z.string().datetime("Invalid end date format"),
    status: z.enum(["Planned", "In Progress", "Completed", "On Hold", "Cancelled"])
  })).optional(),
  
  equipment: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    specs: z.record(z.string(), z.any())
  })).optional(),
  
  orbit: z.object({
    semiMajorAxis: z.number().min(6378.137, "Semi-major axis must be greater than Earth's radius"),
    eccentricity: z.number().min(0).max(0.99, "Eccentricity must be between 0 and 0.99"),
    inclination: z.number().min(0).max(180, "Inclination must be between 0 and 180 degrees"),
    raan: z.number().min(0).max(360, "RAAN must be between 0 and 360 degrees"),
    argumentOfPerigee: z.number().min(0).max(360, "Argument of perigee must be between 0 and 360 degrees"),
    trueAnomaly: z.number().min(0).max(360, "True anomaly must be between 0 and 360 degrees"),
    epoch: z.string().datetime("Invalid epoch format")
  }).optional(),
  
  groundStations: z.array(z.object({
    name: z.string().min(1),
    latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90 degrees"),
    longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180 degrees"),
    elevation: z.number().min(0, "Elevation must be non-negative")
  })).optional(),
  
  requirements: z.array(z.object({
    id: z.string().min(1),
    description: z.string().min(1),
    verified: z.boolean()
  })).optional(),
  
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Orbital data validation
const OrbitDataSchema = z.object({
  semiMajorAxis: z.number().min(6378.137, "Semi-major axis must be greater than Earth's radius"),
  eccentricity: z.number().min(0).max(0.99, "Eccentricity must be between 0 and 0.99"),
  inclination: z.number().min(0).max(180, "Inclination must be between 0 and 180 degrees"),
  raan: z.number().min(0).max(360, "RAAN must be between 0 and 360 degrees"),
  argumentOfPerigee: z.number().min(0).max(360, "Argument of perigee must be between 0 and 360 degrees"),
  trueAnomaly: z.number().min(0).max(360, "True anomaly must be between 0 and 360 degrees"),
  epoch: z.date()
});

// TLE validation with enhanced checksums and format validation
const TLESchema = z.object({
  line1: z.string()
    .length(69, "TLE Line 1 must be exactly 69 characters")
    .refine((line) => validateTLELine1(line), "Invalid TLE Line 1 format or checksum"),
  
  line2: z.string()
    .length(69, "TLE Line 2 must be exactly 69 characters")
    .refine((line) => validateTLELine2(line), "Invalid TLE Line 2 format or checksum")
});

// Enhanced TLE validation functions
function validateTLELine1(line: string): boolean {
  // Check basic format
  if (!/^1 \d{5}[A-Z ] \d{2}\d{3}[A-Z ]{3} \d{5}\.\d{8} [+-]?\.?\d{8} [+-]?\d{5}[+-]\d [+-]?\d{5}[+-]\d \d \d{4}/.test(line)) {
    return false;
  }
  
  // Verify checksum
  const checksum = calculateTLEChecksum(line.substring(0, 68));
  return checksum === parseInt(line.charAt(68));
}

function validateTLELine2(line: string): boolean {
  // Check basic format  
  if (!/^2 \d{5} \d{3}\.\d{4} \d{3}\.\d{4} \d{7} \d{3}\.\d{4} \d{3}\.\d{4} \d{2}\.\d{8}/.test(line)) {
    return false;
  }
  
  // Additional orbital element validation
  const inclination = parseFloat(line.substring(8, 16));
  const eccentricity = parseFloat("0." + line.substring(26, 33));
  const meanMotion = parseFloat(line.substring(52, 63));
  
  if (inclination < 0 || inclination > 180) return false;
  if (eccentricity < 0 || eccentricity >= 1) return false;
  if (meanMotion <= 0 || meanMotion > 17) return false; // Max ~17 revs/day for LEO
  
  // Verify checksum
  const checksum = calculateTLEChecksum(line.substring(0, 68));
  return checksum === parseInt(line.charAt(68));
}

function calculateTLEChecksum(line: string): number {
  let sum = 0;
  for (let i = 0; i < line.length; i++) {
    const char = line.charAt(i);
    if (/\d/.test(char)) {
      sum += parseInt(char);
    } else if (char === '-') {
      sum += 1;
    }
  }
  return sum % 10;
}

// Ground station validation
const GroundStationSchema = z.object({
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90 degrees"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180 degrees"),
  altitude: z.number().min(0, "Altitude must be non-negative"),
  minElevation: z.number().min(0).max(90, "Minimum elevation must be between 0 and 90 degrees").optional()
});

// Equipment validation
const EquipmentSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  category: z.enum([
    "Power",
    "Communication",
    "Navigation",
    "Sensors",
    "Propulsion",
    "Structure",
    "Thermal",
    "Data Handling",
    "Attitude Control",
    "Other"
  ]),
  specifications: z.object({
    mass: z.number().min(0, "Mass must be non-negative"),
    power: z.number().min(0, "Power must be non-negative"),
    dataRate: z.number().min(0, "Data rate must be non-negative"),
    volume: z.number().min(0, "Volume must be non-negative"),
    dimensions: z.object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0)
    }),
    interfaces: z.array(z.string()),
    operatingTemp: z.object({
      min: z.number(),
      max: z.number()
    }),
    trl: z.number().min(1).max(9, "TRL must be between 1 and 9"),
    heritage: z.number().min(0).max(10, "Heritage must be between 0 and 10"),
    spaceQualified: z.boolean()
  })
});

// Credit purchase validation
const CreditPurchaseSchema = z.object({
  packageId: z.string().min(1, "Package ID is required"),
  returnUrl: z.string().url("Invalid return URL").optional()
});

// Launch window request validation
const LaunchWindowRequestSchema = z.object({
  launchSite: GroundStationSchema,
  targetOrbit: OrbitDataSchema,
  searchStart: z.string().datetime("Invalid search start time"),
  searchEnd: z.string().datetime("Invalid search end time"),
  constraints: z.object({
    maxLaunchAzimuth: z.number().min(0).max(360).optional(),
    minLaunchAzimuth: z.number().min(0).max(360).optional(),
    maxWindSpeed: z.number().min(0).optional(),
    weatherRequirements: z.array(z.string()).optional(),
    vehicleConstraints: z.object({
      maxPayloadMass: z.number().min(0).optional(),
      C3Capability: z.number().optional(), // Characteristic energy
      fairing: z.object({
        diameter: z.number().min(0).optional(),
        height: z.number().min(0).optional()
      }).optional()
    }).optional()
  }).optional()
}).refine((data) => {
  const start = new Date(data.searchStart);
  const end = new Date(data.searchEnd);
  const now = new Date();
  
  // Start time must be in the future
  if (start <= now) return false;
  
  // End time must be after start time
  if (start >= end) return false;
  
  // Search window shouldn't be too long (max 1 year)
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > oneYear) return false;
  
  return true;
}, {
  message: "Invalid time window: start must be in future, end after start, and window less than 1 year",
  path: ["searchEnd"]
}).refine((data) => {
  // Validate azimuth constraints if both are provided
  if (data.constraints?.minLaunchAzimuth !== undefined && data.constraints?.maxLaunchAzimuth !== undefined) {
    return data.constraints.minLaunchAzimuth <= data.constraints.maxLaunchAzimuth;
  }
  return true;
}, {
  message: "Minimum launch azimuth must be less than or equal to maximum launch azimuth",
  path: ["constraints", "maxLaunchAzimuth"]
});

// Maneuver calculation validation with enhanced physics constraints
const ManeuverRequestSchema = z.object({
  currentOrbit: OrbitDataSchema,
  targetOrbit: OrbitDataSchema,
  maneuverType: z.enum(["HOHMANN", "BIELLIPTICAL", "PLANE_CHANGE", "COMBINED", "LAMBERT", "LOW_THRUST"]),
  constraints: z.object({
    maxDeltaV: z.number().min(0).max(20000).optional(), // m/s, typical spacecraft capability
    maxThrustLevel: z.number().min(0).optional(), // Newtons
    propellantMass: z.number().min(0).optional(), // kg
    specificImpulse: z.number().min(100).max(500).optional(), // seconds, typical range
    maxManeuverDuration: z.number().min(0).optional(), // seconds
    minPeriapsis: z.number().min(6378137).optional(), // meters, above Earth surface
    tolerances: z.object({
      position: z.number().min(0).default(1000), // meters
      velocity: z.number().min(0).default(1), // m/s
      time: z.number().min(0).default(60) // seconds
    }).optional()
  }).optional()
}).refine((data) => {
  // Validate orbit compatibility for maneuver types
  const current = data.currentOrbit;
  const target = data.targetOrbit;
  
  // Check for reasonable orbit changes
  const altitudeChange = Math.abs(target.semiMajorAxis - current.semiMajorAxis);
  const inclinationChange = Math.abs(target.inclination - current.inclination);
  
  // Plane change maneuvers require significant inclination change
  if (data.maneuverType === "PLANE_CHANGE" && inclinationChange < 0.1) {
    return false;
  }
  
  // Hohmann transfers should be between similar orbital planes
  if (data.maneuverType === "HOHMANN" && inclinationChange > 5) {
    return false;
  }
  
  // Altitude change should be reasonable (not more than 10x current orbit)
  if (altitudeChange > current.semiMajorAxis * 10) {
    return false;
  }
  
  return true;
}, {
  message: "Invalid orbit configuration for selected maneuver type",
  path: ["maneuverType"]
});

// Solar power prediction validation with realistic spacecraft parameters
const SolarPowerRequestSchema = z.object({
  orbit: OrbitDataSchema,
  spacecraftConfig: z.object({
    solarPanelArea: z.number().min(0.1, "Solar panel area must be at least 0.1 m²").max(10000, "Solar panel area too large"),
    solarPanelEfficiency: z.number().min(0.05, "Efficiency too low").max(0.45, "Efficiency exceeds current technology"),
    batteryCapacity: z.number().min(1, "Battery capacity must be at least 1 Wh").max(1000000, "Battery capacity too large"),
    powerConsumption: z.object({
      average: z.number().min(0, "Average power consumption must be non-negative"),
      peak: z.number().min(0, "Peak power consumption must be non-negative"),
      standby: z.number().min(0, "Standby power consumption must be non-negative")
    }),
    batteryDOD: z.number().min(0.1).max(0.9).default(0.8), // Depth of Discharge
    chargeEfficiency: z.number().min(0.7).max(0.98).default(0.85),
    dischargeEfficiency: z.number().min(0.8).max(0.98).default(0.90),
    degradationRate: z.number().min(0).max(0.1).default(0.025), // %/year
    temperatureCoefficient: z.number().min(-0.01).max(0).default(-0.004), // %/°C
    orientationStrategy: z.enum(["SUN_POINTING", "EARTH_POINTING", "INERTIAL", "CUSTOM"]).default("SUN_POINTING")
  }),
  startTime: z.string().datetime("Invalid start time"),
  duration: z.number().min(60, "Duration must be at least 60 seconds").max(31536000, "Duration cannot exceed 1 year"), // seconds
  analysisOptions: z.object({
    includeEclipses: z.boolean().default(true),
    includeThermalEffects: z.boolean().default(true),
    includeAttitudeConstraints: z.boolean().default(false),
    sampleRate: z.number().min(1).max(3600).default(60), // seconds
    outputFormat: z.enum(["SUMMARY", "DETAILED", "HOURLY", "DAILY"]).default("SUMMARY")
  }).optional()
}).refine((data) => {
  const config = data.spacecraftConfig;
  
  // Peak power cannot be less than average power
  if (config.powerConsumption.peak < config.powerConsumption.average) {
    return false;
  }
  
  // Average power cannot be less than standby power
  if (config.powerConsumption.average < config.powerConsumption.standby) {
    return false;
  }
  
  // Battery capacity should be reasonable for power consumption
  const minBatteryCapacity = config.powerConsumption.average * 2; // At least 2 hours
  if (config.batteryCapacity < minBatteryCapacity) {
    return false;
  }
  
  return true;
}, {
  message: "Invalid spacecraft power configuration",
  path: ["spacecraftConfig"]
});

// Helper function to validate request body with detailed error reporting
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string; details?: any[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root';
        return `${path}: ${err.message}`;
      }).join('; ');
      
      const details = error.issues.map(err => ({
        path: err.path,
        message: err.message,
        code: err.code,
        received: 'received' in err ? err.received : undefined,
        expected: 'expected' in err ? err.expected : undefined
      }));
      
      return { 
        success: false, 
        error: errorMessages,
        details: details
      };
    }
    return { success: false, error: "Validation failed" };
  }
}

// Enhanced validation for complex orbital mechanics data
export function validateOrbitalParameters(orbit: any): { valid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!orbit) {
    errors.push("Orbit data is required");
    return { valid: false, warnings, errors };
  }
  
  // Check for physically realistic values
  if (orbit.semiMajorAxis < 6578137) { // 200km altitude minimum
    warnings.push("Semi-major axis indicates very low orbit (below 200km)");
  }
  
  if (orbit.semiMajorAxis > 384400000) { // Beyond lunar orbit
    warnings.push("Semi-major axis exceeds lunar orbital distance");
  }
  
  if (orbit.eccentricity > 0.9) {
    warnings.push("Very high eccentricity orbit may be unstable");
  }
  
  // Check for retrograde orbits
  if (orbit.inclination > 90 && orbit.inclination <= 180) {
    warnings.push("Retrograde orbit detected");
  }
  
  // Validate orbital period
  const MU_EARTH = 398600441800000; // m³/s²
  const period = 2 * Math.PI * Math.sqrt(Math.pow(orbit.semiMajorAxis, 3) / MU_EARTH);
  
  if (period < 5400) { // 90 minutes
    warnings.push("Orbital period very short - may not be sustainable");
  }
  
  if (period > 86400 * 365) { // 1 year
    warnings.push("Orbital period exceeds 1 year");
  }
  
  // Check argument relationships
  if (orbit.raan < 0 || orbit.raan > 360) {
    errors.push("RAAN must be between 0 and 360 degrees");
  }
  
  if (orbit.argumentOfPerigee < 0 || orbit.argumentOfPerigee > 360) {
    errors.push("Argument of perigee must be between 0 and 360 degrees");
  }
  
  if (orbit.trueAnomaly < 0 || orbit.trueAnomaly > 360) {
    errors.push("True anomaly must be between 0 and 360 degrees");
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}

// Validate TLE data completeness and consistency
export function validateTLEConsistency(tle: { line1: string; line2: string }): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!tle.line1 || !tle.line2) {
    issues.push("Both TLE lines are required");
    return { valid: false, issues };
  }
  
  // Extract satellite numbers from both lines
  const satNum1 = tle.line1.substring(2, 7);
  const satNum2 = tle.line2.substring(2, 7);
  
  if (satNum1 !== satNum2) {
    issues.push("Satellite numbers don't match between TLE lines");
  }
  
  // Extract and validate epoch year
  const epochYear = parseInt(tle.line1.substring(18, 20));
  const currentYear = new Date().getFullYear() % 100;
  
  if (Math.abs(epochYear - currentYear) > 50) {
    issues.push("TLE epoch appears to be very old or invalid");
  }
  
  // Validate mean motion (revolutions per day)
  const meanMotion = parseFloat(tle.line2.substring(52, 63));
  if (meanMotion <= 0 || meanMotion > 20) {
    issues.push("Mean motion out of reasonable range (0-20 rev/day)");
  }
  
  // Validate inclination
  const inclination = parseFloat(tle.line2.substring(8, 16));
  if (inclination < 0 || inclination > 180) {
    issues.push("Inclination out of valid range (0-180 degrees)");
  }
  
  // Validate eccentricity
  const eccentricity = parseFloat("0." + tle.line2.substring(26, 33));
  if (eccentricity < 0 || eccentricity >= 1) {
    issues.push("Eccentricity out of valid range (0 <= e < 1)");
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Export all schemas
export {
  MissionSchema,
  OrbitDataSchema,
  TLESchema,
  GroundStationSchema,
  EquipmentSchema,
  CreditPurchaseSchema,
  LaunchWindowRequestSchema,
  ManeuverRequestSchema,
  SolarPowerRequestSchema
};