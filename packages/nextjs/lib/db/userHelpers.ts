/**
 * Shared user helpers for the Prisma-backed USER/AUTH domain.
 *
 * These are plain-function ports of the former Mongoose instance/static methods
 * (password hashing/compare, userId generation, login-attempt/lockout logic,
 * API key generation/validation, user search). All persistence goes through the
 * shared Prisma client.
 */
import { Prisma, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "~~/lib/prisma";
import { UserRole } from "~~/models/User";

/** Shape of an embedded API key entry stored in the `apiKeys` Json column. */
export interface ApiKeyEntry {
  key: string;
  name: string;
  createdAt: string | Date;
  lastUsed?: string | Date;
  permissions: string[];
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Generate a new business `userId`. Matches the former pre-save hook. */
export function generateUserId(): string {
  return `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Hash a plaintext password with bcrypt (replaces the pre-save hook). */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Compare a candidate password against a user's stored hash. */
export async function comparePassword(candidatePassword: string, passwordHash?: string | null): Promise<boolean> {
  if (!passwordHash) return false;
  return bcrypt.compare(candidatePassword, passwordHash);
}

/** Whether an account is currently locked out. */
export function isLocked(user: Pick<User, "lockUntil">): boolean {
  return !!(user.lockUntil && user.lockUntil > new Date());
}

/** Role check. */
export function hasRole(user: Pick<User, "roles">, role: UserRole): boolean {
  return user.roles.includes(role);
}

/** Permission check. Admins implicitly have all permissions. */
export function hasPermission(user: Pick<User, "roles" | "permissions">, permission: string): boolean {
  if (user.roles.includes(UserRole.ADMIN)) return true;
  return user.permissions.includes(permission);
}

/**
 * Increment a user's login attempts, locking the account after too many
 * failures. Ports `UserSchema.methods.incrementLoginAttempts`.
 */
export async function incrementLoginAttempts(user: Pick<User, "id" | "loginAttempts" | "lockUntil">): Promise<void> {
  // Reset attempts if a previous lock has expired.
  if (user.lockUntil && user.lockUntil < new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 1, lockUntil: null },
    });
    return;
  }

  const nextAttempts = user.loginAttempts + 1;
  const data: Prisma.UserUpdateInput = { loginAttempts: nextAttempts };

  // Lock account after 5 attempts for 2 hours.
  if (nextAttempts >= MAX_LOGIN_ATTEMPTS && !isLocked(user)) {
    data.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  await prisma.user.update({ where: { id: user.id }, data });
}

/** Reset login attempts and record a successful login. */
export async function resetLoginAttempts(user: Pick<User, "id">): Promise<void> {
  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lastLogin: new Date(), lockUntil: null },
  });
}

/**
 * Generate a new API key for a user, persist its hash, and return the plaintext
 * key (shown to the caller only once). Ports `methods.generateApiKey`.
 */
export async function generateApiKey(
  user: Pick<User, "id" | "apiKeys">,
  name: string,
  permissions: string[] = [],
): Promise<string> {
  const key = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;

  const apiKeys = (user.apiKeys as unknown as ApiKeyEntry[]) ?? [];
  apiKeys.push({
    key: await bcrypt.hash(key, 10),
    name,
    createdAt: new Date().toISOString(),
    permissions,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { apiKeys: apiKeys as unknown as Prisma.InputJsonValue },
  });

  return key;
}

/**
 * Validate a plaintext API key against a user's stored hashes. On success the
 * matched key's `lastUsed` is bumped. Ports `methods.validateApiKey`.
 */
export async function validateApiKey(user: Pick<User, "id" | "apiKeys">, key: string): Promise<boolean> {
  const apiKeys = (user.apiKeys as unknown as ApiKeyEntry[]) ?? [];

  for (const apiKey of apiKeys) {
    if (await bcrypt.compare(key, apiKey.key)) {
      apiKey.lastUsed = new Date().toISOString();
      await prisma.user.update({
        where: { id: user.id },
        data: { apiKeys: apiKeys as unknown as Prisma.InputJsonValue },
      });
      return true;
    }
  }

  return false;
}

/** Find a user by email (case-insensitive). Ports `statics.findByEmail`. */
export function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

/** Find a user by wallet address. Ports `statics.findByWallet`. */
export function findByWallet(walletAddress: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { walletAddress } });
}

/**
 * Find the user that owns a given plaintext API key. Ports `statics.findByApiKey`.
 * Scans users that have at least one API key configured.
 */
export async function findByApiKey(key: string): Promise<User | null> {
  const users = await prisma.user.findMany({
    where: { NOT: { apiKeys: { equals: [] } } },
  });

  for (const user of users) {
    if (await validateApiKey(user, key)) {
      return user;
    }
  }

  return null;
}

/**
 * Search users by name / email / organization (case-insensitive substring).
 * Ports `statics.searchUsers`.
 */
export function searchUsers(query: string): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { organization: { contains: query, mode: "insensitive" } },
      ],
    },
  });
}
