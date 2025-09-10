import { NextRequest, NextResponse } from "next/server";
import { LRUCache } from "lru-cache";

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

type RateLimitConfig = {
  limit: number;
  window: number; // in milliseconds
  message?: string;
};

// Create different rate limit configurations for different API endpoints
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Mission APIs - more restrictive
  "/api/missions": {
    limit: 30,
    window: 60 * 1000, // 30 requests per minute
    message: "Too many mission requests, please try again later",
  },
  "/api/missions/create": {
    limit: 5,
    window: 60 * 1000, // 5 creates per minute
    message: "Mission creation rate limit exceeded",
  },

  // Orbital calculations - moderate limits
  "/api/orbit/propagate": {
    limit: 20,
    window: 60 * 1000, // 20 calculations per minute
    message: "Orbit calculation rate limit exceeded",
  },
  "/api/orekit": {
    limit: 20,
    window: 60 * 1000, // 20 requests per minute
    message: "Orekit calculation rate limit exceeded",
  },

  // Document generation - strict limits
  "/api/documents/generate": {
    limit: 5,
    window: 60 * 1000, // 5 documents per minute
    message: "Document generation rate limit exceeded",
  },

  // Constellation analysis - resource intensive
  "/api/constellation": {
    limit: 10,
    window: 60 * 1000, // 10 analyses per minute
    message: "Constellation analysis rate limit exceeded",
  },

  // Venice AI - strict limits
  "/api/venice": {
    limit: 10,
    window: 60 * 1000, // 10 AI requests per minute
    message: "AI request rate limit exceeded",
  },

  // Default for other endpoints
  default: {
    limit: 60,
    window: 60 * 1000, // 60 requests per minute
    message: "Rate limit exceeded, please try again later",
  },
};

export default function rateLimit(options?: Options) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: async (request: NextRequest, config?: RateLimitConfig) => {
      const pathname = request.nextUrl.pathname;
      const rateLimitConfig = config || rateLimitConfigs[pathname] || rateLimitConfigs.default;

      // Get identifier from IP address or user session
      const token = getIdentifier(request);
      const tokenCount = tokenCache.get(token) || [];
      const now = Date.now();

      // Filter out old entries outside the window
      const validTokens = tokenCount.filter(timestamp => now - timestamp < rateLimitConfig.window);

      if (validTokens.length >= rateLimitConfig.limit) {
        return {
          success: false,
          limit: rateLimitConfig.limit,
          remaining: 0,
          reset: new Date(validTokens[0] + rateLimitConfig.window),
          message: rateLimitConfig.message,
        };
      }

      // Add current request timestamp
      validTokens.push(now);
      tokenCache.set(token, validTokens);

      return {
        success: true,
        limit: rateLimitConfig.limit,
        remaining: rateLimitConfig.limit - validTokens.length,
        reset: new Date(now + rateLimitConfig.window),
      };
    },
  };
}

// Helper function to get unique identifier for rate limiting
function getIdentifier(request: NextRequest): string {
  // Try to get from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  // Use the first available IP or fallback to a default
  const ip = forwarded?.split(",")[0] || realIP || cfConnectingIP || "anonymous";

  // You could also include user ID if authenticated
  // const userId = request.headers.get("x-user-id");
  // return userId ? `user:${userId}` : `ip:${ip}`;

  return `ip:${ip}`;
}

// Middleware helper to apply rate limiting
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  customConfig?: RateLimitConfig,
): Promise<NextResponse> {
  const limiter = rateLimit();
  const result = await limiter.check(request, customConfig);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.message,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toISOString(),
          "Retry-After": Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  // Add rate limit headers to successful responses
  const response = await handler();
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toISOString());

  return response;
}

// Per-user rate limiting for authenticated endpoints
export function createUserRateLimit(userId: string, config: RateLimitConfig) {
  const cache = new LRUCache<string, number[]>({
    max: 1000,
    ttl: config.window,
  });

  return async function checkUserLimit(): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const now = Date.now();
    const userRequests = cache.get(userId) || [];
    const validRequests = userRequests.filter(timestamp => now - timestamp < config.window);

    if (validRequests.length >= config.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(validRequests[0] + config.window),
      };
    }

    validRequests.push(now);
    cache.set(userId, validRequests);

    return {
      allowed: true,
      remaining: config.limit - validRequests.length,
      resetAt: new Date(now + config.window),
    };
  };
}
