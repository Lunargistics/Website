/**
 * Environment variable validation
 * Ensures all required environment variables are present and valid
 */
import { z } from "zod";

// Environment variable schema
const envSchema = z
  .object({
    // IPFS/Pinata Configuration
    NEXT_PUBLIC_PINATA_API_KEY: z.string().optional(),
    NEXT_PUBLIC_PINATA_SECRET_KEY: z.string().optional(),
    NEXT_PUBLIC_PINATA_JWT: z.string().optional(),
    NEXT_PUBLIC_PINATA_GATEWAY: z.string().url().default("https://gateway.pinata.cloud/ipfs/"),

    // Database
    MONGODB_URI: z.string().url().optional(),

    // Authentication
    NEXTAUTH_SECRET: z.string().min(32).optional(),
    NEXTAUTH_URL: z.string().url().optional(),

    // Privy Auth
    NEXT_PUBLIC_PRIVY_APP_ID: z.string().optional(),
    PRIVY_APP_SECRET: z.string().optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

    // Node Environment
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Optional API Keys
    SPACEX_API_KEY: z.string().optional(),
    NASA_API_KEY: z.string().optional(),

    // Deployment Environment Detection
    VERCEL: z.string().optional(),
    NETLIFY: z.string().optional(),
  })
  .refine(
    data => {
      // At least one IPFS authentication method must be present
      return data.NEXT_PUBLIC_PINATA_JWT || (data.NEXT_PUBLIC_PINATA_API_KEY && data.NEXT_PUBLIC_PINATA_SECRET_KEY);
    },
    {
      message: "Either PINATA_JWT or both PINATA_API_KEY and PINATA_SECRET_KEY must be provided",
      path: ["NEXT_PUBLIC_PINATA_JWT"],
    },
  );

// Validate environment variables
export function validateEnvironment() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Environment variable validation failed:");
    result.error.issues.forEach(issue => {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    });

    // In development, warn but continue
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Continuing with missing environment variables in development mode");
      return {
        success: false,
        error: result.error,
        data: process.env as any,
      };
    } else {
      throw new Error("Environment validation failed in production");
    }
  }

  console.log("✅ Environment variables validated successfully");
  return {
    success: true,
    data: result.data,
  };
}

// Get validated environment variables
export function getEnvironment() {
  const validation = validateEnvironment();
  return validation.data;
}

// Check if IPFS is properly configured
export function isIPFSConfigured(): boolean {
  const env = process.env;
  return !!(env.NEXT_PUBLIC_PINATA_JWT || (env.NEXT_PUBLIC_PINATA_API_KEY && env.NEXT_PUBLIC_PINATA_SECRET_KEY));
}

// Check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!process.env.MONGODB_URI;
}

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

// Check if authentication is configured
export function isAuthConfigured(): boolean {
  return !!(process.env.NEXTAUTH_SECRET && process.env.NEXT_PUBLIC_PRIVY_APP_ID);
}

// Runtime environment checks
export function checkRuntimeEnvironment() {
  const issues = [];

  if (!isIPFSConfigured()) {
    issues.push("IPFS/Pinata not configured - mission data storage will fail");
  }

  if (!isDatabaseConfigured()) {
    issues.push("MongoDB not configured - user data persistence will fail");
  }

  if (!isStripeConfigured()) {
    issues.push("Stripe not configured - credit purchases will fail");
  }

  if (!isAuthConfigured()) {
    issues.push("Authentication not configured - user login will fail");
  }

  if (issues.length > 0) {
    console.warn("⚠️  Runtime environment issues:");
    issues.forEach(issue => console.warn(`  - ${issue}`));
    return false;
  }

  console.log("✅ Runtime environment fully configured");
  return true;
}

// Export types
export type ValidatedEnvironment = z.infer<typeof envSchema>;
