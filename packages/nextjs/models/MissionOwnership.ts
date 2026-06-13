/**
 * MissionOwnership domain types.
 *
 * Durable store for mission ownership, delegation, sharing, and transfer history.
 * Backs lib/auth/ownership.ts so RBAC/ownership survives process restarts.
 *
 * Migrated from Mongoose to Prisma + Postgres. This file no longer defines a
 * Mongoose schema/model; it only exports the plain data shape. Persistence goes
 * through the shared Prisma client (`prisma.missionOwnership`).
 *
 * `delegatedTo` / `sharedWith` / `transferHistory` are stored as Json columns
 * (DelegatedAccess/SharedAccess/OwnershipTransfer from lib/auth/ownership.ts);
 * the whole record is rewritten on every mutation.
 */

export interface IMissionOwnership {
  id: string;
  missionId: string;
  ownerId: string;
  organizationId: string;
  createdAt: Date;
  delegatedTo: any[];
  sharedWith: any[];
  transferHistory: any[];
}
