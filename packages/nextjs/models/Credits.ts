// Credit domain types. Migrated from Mongoose to Prisma + Postgres.
// The Prisma models (CreditBalance, CreditTransaction, CreditPackage,
// CreditUsageAnalytics) live in prisma/schema.prisma. This file now only
// exports shared enums, constants, and plain TS interfaces used by the
// credits/stripe services.

// Credit Transaction Types
export enum TransactionType {
  PURCHASE = "purchase",
  USAGE = "usage",
  REFUND = "refund",
  BONUS = "bonus",
  ADMIN_ADJUSTMENT = "admin_adjustment",
}

// API Endpoint Credit Costs
export const API_CREDIT_COSTS = {
  "/api/missions": 1, // Basic mission operations
  "/api/missions/create": 5, // Creating missions
  "/api/orbit/propagate": 3, // Orbital calculations
  "/api/orekit": 10, // Advanced Orekit calculations
  "/api/constellation": 15, // Constellation analysis
  "/api/documents/generate": 5, // Document generation
  "/api/venice": 20, // AI-powered planning
  "/api/icd/generate": 8, // ICD generation
  "/api/drivers/generate": 12, // Driver generation
} as const;

// Credit Balance
export interface ICreditBalance {
  userId: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  lastUpdated: Date;
  createdAt: Date;
}

// Credit Transaction
export interface ICreditTransaction {
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  apiEndpoint?: string;
  stripePaymentIntentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Credit Package (for Stripe products)
export interface ICreditPackage {
  name: string;
  credits: number;
  price: number; // in cents
  stripePriceId: string;
  stripeProductId: string;
  description?: string;
  popular?: boolean;
  bonusCredits?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Credit Usage Analytics
export interface ICreditUsageAnalytics {
  userId: string;
  date: Date; // Daily aggregation
  totalUsed: number;
  usageByEndpoint: Record<string, number>;
  createdAt: Date;
}
