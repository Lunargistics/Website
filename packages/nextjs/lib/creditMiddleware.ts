import { NextRequest, NextResponse } from "next/server";
import { CreditsService } from "../services/credits/creditsService";
import { withRateLimit } from "./rateLimit";
import { getToken } from "next-auth/jwt";

export interface CreditCheckResult {
  allowed: boolean;
  userId?: string;
  creditsRequired: number;
  currentBalance: number;
  message: string;
}

/**
 * Middleware that combines authentication, rate limiting, and credit checking
 */
export async function withCredits(
  request: NextRequest,
  handler: (userId: string) => Promise<NextResponse>,
  customCreditCost?: number,
): Promise<NextResponse> {
  try {
    // First apply rate limiting
    return withRateLimit(request, async () => {
      // Check authentication
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token || !token.sub) {
        return NextResponse.json(
          {
            error: "Authentication required",
            code: "AUTH_REQUIRED",
            details: { message: "Please log in to access this API" },
          },
          { status: 401 },
        );
      }

      const userId = token.sub;
      const endpoint = request.nextUrl.pathname;

      // Check and consume credits
      const creditResult = await checkAndConsumeCredits(userId, endpoint, customCreditCost);

      if (!creditResult.allowed) {
        return NextResponse.json(
          {
            error: creditResult.message,
            code: "INSUFFICIENT_CREDITS",
            details: {
              required: creditResult.creditsRequired,
              current: creditResult.currentBalance,
              endpoint,
            },
          },
          {
            status: 402, // Payment Required
            headers: {
              "X-Credits-Required": creditResult.creditsRequired.toString(),
              "X-Credits-Current": creditResult.currentBalance.toString(),
            },
          },
        );
      }

      // Execute the handler with userId
      const response = await handler(userId);

      // Add credit information to response headers
      response.headers.set("X-Credits-Used", creditResult.creditsRequired.toString());
      response.headers.set(
        "X-Credits-Remaining",
        (creditResult.currentBalance - creditResult.creditsRequired).toString(),
      );

      return response;
    });
  } catch (error) {
    console.error("Credit middleware error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "MIDDLEWARE_ERROR",
        details: { message: "Failed to process request" },
      },
      { status: 500 },
    );
  }
}

/**
 * Check user's credits and consume if sufficient
 */
async function checkAndConsumeCredits(
  userId: string,
  endpoint: string,
  customCreditCost?: number,
): Promise<CreditCheckResult> {
  try {
    const creditsRequired = customCreditCost || CreditsService.getCreditCost(endpoint);

    // Check if user has sufficient credits
    const hasCredits = await CreditsService.hasCredits(userId, creditsRequired);

    if (!hasCredits) {
      const balance = await CreditsService.getUserBalance(userId);
      return {
        allowed: false,
        userId,
        creditsRequired,
        currentBalance: balance.balance,
        message: `Insufficient credits. Required: ${creditsRequired}, Available: ${balance.balance}`,
      };
    }

    // Consume the credits
    const consumeResult = await CreditsService.consumeCredits(userId, endpoint, customCreditCost);

    if (!consumeResult.success) {
      return {
        allowed: false,
        userId,
        creditsRequired,
        currentBalance: consumeResult.newBalance,
        message: consumeResult.message,
      };
    }

    return {
      allowed: true,
      userId,
      creditsRequired,
      currentBalance: consumeResult.newBalance + creditsRequired, // Balance before consumption
      message: "Credits consumed successfully",
    };
  } catch (error) {
    console.error("Error checking/consuming credits:", error);

    // In case of error, get current balance for error response
    try {
      const balance = await CreditsService.getUserBalance(userId);
      return {
        allowed: false,
        userId,
        creditsRequired: customCreditCost || CreditsService.getCreditCost(endpoint),
        currentBalance: balance.balance,
        message: "Error processing credit transaction",
      };
    } catch (balanceError) {
      return {
        allowed: false,
        userId,
        creditsRequired: customCreditCost || CreditsService.getCreditCost(endpoint),
        currentBalance: 0,
        message: "Error accessing credit information",
      };
    }
  }
}

/**
 * Middleware for free endpoints that only require authentication
 */
export async function withAuth(
  request: NextRequest,
  handler: (userId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return withRateLimit(request, async () => {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token || !token.sub) {
        return NextResponse.json(
          {
            error: "Authentication required",
            code: "AUTH_REQUIRED",
          },
          { status: 401 },
        );
      }

      return handler(token.sub);
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "MIDDLEWARE_ERROR",
      },
      { status: 500 },
    );
  }
}

/**
 * Public middleware for endpoints that don't require authentication
 */
export async function withPublic(request: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> {
  return withRateLimit(request, handler);
}

/**
 * Admin middleware for administrative endpoints
 */
export async function withAdmin(
  request: NextRequest,
  handler: (userId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user has admin role
    if (token.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return handler(token.sub);
  } catch (error) {
    console.error("Admin middleware error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Get user's current credit balance (utility function)
 */
export async function getUserCredits(request: NextRequest): Promise<{
  balance: number;
  userId: string;
} | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return null;
    }

    const balance = await CreditsService.getUserBalance(token.sub);
    return {
      balance: balance.balance,
      userId: token.sub,
    };
  } catch (error) {
    console.error("Error getting user credits:", error);
    return null;
  }
}
