/**
 * User domain types.
 *
 * Migrated from Mongoose to Prisma + Postgres. This file no longer defines a
 * Mongoose schema/model; it only exports the shared `UserRole` enum and a plain
 * `IUser` data shape. The persistence layer is Prisma (`prisma.user`), and the
 * former instance/static methods now live in `lib/db/userHelpers.ts` as plain
 * functions.
 */

export enum UserRole {
  ADMIN = "ADMIN",
  MISSION_MANAGER = "MISSION_MANAGER",
  ENGINEER = "ENGINEER",
  ANALYST = "ANALYST",
  VIEWER = "VIEWER",
}

export interface IUser {
  id: string;
  userId: string;
  email: string;
  password?: string;
  name: string;
  roles: UserRole[];

  // Profile
  avatar?: string;
  bio?: string;
  organization?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  location?: string;
  timezone?: string;

  // Username
  username?: string;
  usernameLower?: string;

  // Authentication
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;

  // Web3
  walletAddress?: string;
  walletNonce?: string;

  // API Access
  apiKeys: {
    key: string;
    name: string;
    createdAt: Date;
    lastUsed?: Date;
    permissions: string[];
  }[];

  // Preferences
  preferences?: {
    theme?: "light" | "dark" | "auto";
    language?: string;
    notifications?: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
    defaultMissionView?: string;
  };

  // Social Features
  following: string[]; // Array of user IDs
  followers: string[]; // Array of user IDs
  followingCount: number;
  followerCount: number;

  // Metadata
  permissions: string[];
  credits: number;
  subscription?: {
    plan: string;
    status: string;
    expiresAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
