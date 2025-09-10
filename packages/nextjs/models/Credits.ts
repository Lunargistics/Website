import mongoose, { Document, Schema } from "mongoose";

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

// Credit Balance Schema
export interface ICreditBalance extends Document {
  userId: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  lastUpdated: Date;
  createdAt: Date;
}

const CreditBalanceSchema = new Schema<ICreditBalance>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalPurchased: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalUsed: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Credit Transaction Schema
export interface ICreditTransaction extends Document {
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

const CreditTransactionSchema = new Schema<ICreditTransaction>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(TransactionType),
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceBefore: {
    type: Number,
    required: true,
    min: 0,
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  apiEndpoint: {
    type: String,
    required: false,
  },
  stripePaymentIntentId: {
    type: String,
    required: false,
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Credit Package Schema (for Stripe products)
export interface ICreditPackage extends Document {
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

const CreditPackageSchema = new Schema<ICreditPackage>({
  name: {
    type: String,
    required: true,
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stripePriceId: {
    type: String,
    required: true,
    unique: true,
  },
  stripeProductId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  popular: {
    type: Boolean,
    default: false,
  },
  bonusCredits: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
CreditPackageSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Credit Usage Analytics Schema
export interface ICreditUsageAnalytics extends Document {
  userId: string;
  date: Date; // Daily aggregation
  totalUsed: number;
  usageByEndpoint: Record<string, number>;
  createdAt: Date;
}

const CreditUsageAnalyticsSchema = new Schema<ICreditUsageAnalytics>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  totalUsed: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  usageByEndpoint: {
    type: Schema.Types.Mixed,
    required: true,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for user + date uniqueness
CreditUsageAnalyticsSchema.index({ userId: 1, date: 1 }, { unique: true });

// Export models
export const CreditBalance =
  mongoose.models.CreditBalance || mongoose.model<ICreditBalance>("CreditBalance", CreditBalanceSchema);
export const CreditTransaction =
  mongoose.models.CreditTransaction || mongoose.model<ICreditTransaction>("CreditTransaction", CreditTransactionSchema);
export const CreditPackage =
  mongoose.models.CreditPackage || mongoose.model<ICreditPackage>("CreditPackage", CreditPackageSchema);
export const CreditUsageAnalytics =
  mongoose.models.CreditUsageAnalytics ||
  mongoose.model<ICreditUsageAnalytics>("CreditUsageAnalytics", CreditUsageAnalyticsSchema);
