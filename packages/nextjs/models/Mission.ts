/**
 * Mission domain types.
 *
 * Migrated from Mongoose to Prisma + Postgres. This file no longer defines a
 * Mongoose schema/model; it only exports the shared enums and plain data shapes.
 * Persistence goes through the shared Prisma client (`prisma.mission`), and the
 * former instance/static methods now live in `services/database/dataService.ts`.
 */

export enum MissionStatus {
  DRAFT = "DRAFT",
  PLANNING = "PLANNING",
  IN_DEVELOPMENT = "IN_DEVELOPMENT",
  TESTING = "TESTING",
  READY_FOR_LAUNCH = "READY_FOR_LAUNCH",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum MissionType {
  EARTH_OBSERVATION = "EARTH_OBSERVATION",
  COMMUNICATIONS = "COMMUNICATIONS",
  SCIENCE = "SCIENCE",
  TECHNOLOGY_DEMO = "TECHNOLOGY_DEMO",
  NAVIGATION = "NAVIGATION",
  SPACE_EXPLORATION = "SPACE_EXPLORATION",
  COMMERCIAL = "COMMERCIAL",
}

export interface OrbitalElements {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  rightAscension: number;
  argumentOfPerigee: number;
  trueAnomaly: number;
  epoch: Date;
}

export interface GroundStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  minElevationAngle?: number;
  active: boolean;
}

export interface MissionPhase {
  name: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  description: string;
  milestones: string[];
  risks: string[];
}

export interface IMission {
  id: string;
  missionId: string;
  name: string;
  description: string;
  type: MissionType;
  status: MissionStatus;
  owner: string;
  collaborators: string[];
  organization?: string;

  // Mission timeline
  launchDate?: Date;
  endDate?: Date;
  phases: MissionPhase[];

  // Orbital parameters
  orbit?: OrbitalElements;
  tle?: string[];
  groundStations: GroundStation[];

  // Equipment and requirements
  equipment: string[];
  requirements: string[];
  standards: string[];

  // Documentation
  documents: string[];
  ipfsHash?: string;
  contractAddress?: string;

  // Metadata
  tags: string[];
  budget?: number;
  riskLevel?: string;
  complianceStatus?: string;
  aitPlan?: string;

  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: string;
}
