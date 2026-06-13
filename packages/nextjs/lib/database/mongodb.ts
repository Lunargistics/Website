/**
 * Database connection helpers (Prisma / Postgres).
 *
 * Thin wrappers kept for backwards compatibility with existing call-sites that
 * import `connectDB` / `disconnectDB`. Prisma manages its own pooling and
 * connects lazily, so these are mostly no-ops over the shared client.
 */
import prisma from "../prisma";

export async function connectDB() {
  await prisma.$connect();
  return prisma;
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
}
