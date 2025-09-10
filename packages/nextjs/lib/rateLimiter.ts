interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 15 * 60 * 1000) {
    // 5 requests per 15 minutes
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  private getKey(identifier: string): string {
    return identifier;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(identifier);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  reset(identifier: string) {
    const key = this.getKey(identifier);
    this.store.delete(key);
  }
}

// Create rate limiters for different endpoints
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 requests per 15 minutes
export const registerRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 registrations per hour
export const loginRateLimiter = new RateLimiter(10, 15 * 60 * 1000); // 10 login attempts per 15 minutes
export const resetRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 password resets per hour

export function getClientIP(request: Request): string {
  // Get IP from headers (in production, you'd get this from your proxy/load balancer)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const clientIP = request.headers.get("x-client-ip");

  return forwarded?.split(",")[0] || realIP || clientIP || "unknown";
}
