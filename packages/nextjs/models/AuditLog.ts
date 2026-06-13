/**
 * AuditLog domain types.
 *
 * Migrated from Mongoose to Prisma + Postgres. This file no longer defines a
 * Mongoose schema/model; it only exports the plain data shape. Persistence goes
 * through the shared Prisma client (`prisma.auditLog`). Buffering/batch-insert
 * and queries live in `lib/security/auditLog.ts`; the former static query
 * helpers (findByUser/findByMission/getStatistics) live in
 * `services/database/dataService.ts`.
 *
 * Note: the former 2-year TTL index cannot be expressed in Prisma; retention,
 * if needed, should be handled by a scheduled cleanup job.
 */
import { AuditEventType, AuditSeverity } from "~~/lib/security/auditLog";

export interface IAuditLog {
  id: string;
  auditId: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  missionId?: string;
  metadata?: any;
  result: "SUCCESS" | "FAILURE";
  errorMessage?: string;
  duration?: number;
  signature?: string;

  // Compliance fields
  complianceStandard?: string;
  complianceStatus?: string;

  // Session tracking
  sessionId?: string;
  requestId?: string;

  // Additional context
  environment?: string;
  apiVersion?: string;
  clientVersion?: string;
}
