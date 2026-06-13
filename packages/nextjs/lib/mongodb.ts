/**
 * Database connection shim (Prisma / Postgres).
 *
 * This module historically exported a Mongoose `dbConnect()`. The app now uses
 * Prisma; this is kept as a thin, idempotent connector so existing
 * `await dbConnect()` call-sites keep working unchanged. Prisma also connects
 * lazily on first query, so calling this is optional.
 */
import prisma from "./prisma";

async function dbConnect() {
  await prisma.$connect();
  return prisma;
}

export default dbConnect;
