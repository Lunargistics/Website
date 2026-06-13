/**
 * Prisma-backed test database helpers (Postgres).
 *
 * These power the gated integration tests (RUN_INTEGRATION_TESTS). Unlike the
 * old mongodb-memory-server harness, Postgres has no in-memory equivalent, so a
 * real test database is required: point DATABASE_URL at a disposable Postgres
 * whose schema has been applied (`prisma migrate deploy` or `prisma db push`)
 * before running the suite.
 */
import prisma from "../../lib/prisma";

// Every model table. TRUNCATE ... CASCADE wipes them in one statement.
const TABLES = [
  "User",
  "Mission",
  "Document",
  "Equipment",
  "GeneratedOutput",
  "Post",
  "AuditLog",
  "MissionOwnership",
  "CreditBalance",
  "CreditTransaction",
  "CreditPackage",
  "CreditUsageAnalytics",
];

export const setupTestDatabase = async () => {
  await prisma.$connect();
};

export const teardownTestDatabase = async () => {
  await prisma.$disconnect();
};

export const clearTestDatabase = async () => {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.map(t => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`);
};
