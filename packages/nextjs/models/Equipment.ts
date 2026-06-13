/**
 * Equipment domain types.
 *
 * Migrated from Mongoose to Prisma + Postgres. This file no longer defines a
 * Mongoose schema/model; it only exports the shared enums and plain data shapes.
 * Persistence goes through the shared Prisma client (`prisma.equipment`), and the
 * former instance/static methods now live in `services/database/dataService.ts`.
 */

export enum EquipmentCategory {
  SATELLITE_BUS = "SATELLITE_BUS",
  PAYLOAD = "PAYLOAD",
  POWER_SYSTEM = "POWER_SYSTEM",
  COMMUNICATION = "COMMUNICATION",
  PROPULSION = "PROPULSION",
  ATTITUDE_CONTROL = "ATTITUDE_CONTROL",
  THERMAL_CONTROL = "THERMAL_CONTROL",
  GROUND_SUPPORT = "GROUND_SUPPORT",
  SOFTWARE = "SOFTWARE",
  TEST_EQUIPMENT = "TEST_EQUIPMENT",
}

export enum EquipmentStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE",
  RETIRED = "RETIRED",
  PROTOTYPE = "PROTOTYPE",
  FLIGHT_QUALIFIED = "FLIGHT_QUALIFIED",
}

export interface TechnicalSpecs {
  mass?: number; // kg
  power?: number; // watts
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  operatingTemp?: {
    min: number;
    max: number;
    unit: string;
  };
  dataRate?: number; // Mbps
  frequency?: number; // MHz/GHz
  voltage?: number; // V
  current?: number; // A
  [key: string]: any;
}

export interface InterfaceSpec {
  name: string;
  type: string; // electrical, mechanical, data, thermal
  protocol?: string;
  connector?: string;
  pinout?: string[];
  dataFormat?: string;
}

export interface IEquipment {
  id: string;
  equipmentId: string;
  name: string;
  description: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  manufacturer: string;
  modelName: string;
  serialNumber?: string;

  // Technical specifications
  specifications: TechnicalSpecs;
  interfaces: InterfaceSpec[];

  // Standards and compliance
  standards: string[];
  certifications: string[];
  heritage?: string; // Previous missions/usage
  trl?: number; // Technology Readiness Level (1-9)

  // Cost and availability
  unitCost?: number;
  leadTime?: number; // days
  quantity?: number;
  supplier?: string;

  // Documentation
  datasheet?: string; // URL or IPFS hash
  manuals?: string[];
  testReports?: string[];
  images?: string[];

  // NFT/Blockchain
  nftTokenId?: string;
  contractAddress?: string;
  ipfsHash?: string;

  // Relationships (plain id references)
  compatibleWith: string[];
  incompatibleWith: string[];
  missions: string[];

  // Metadata
  tags: string[];
  notes?: string;
  createdBy: string;
  organization?: string;

  createdAt: Date;
  updatedAt: Date;
}
