/**
 * API Rate Limiting System
 * Implements token bucket algorithm with Redis for distributed rate limiting
 */

import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import { getProductionConfig } from '@/lib/config/production.config';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  handler?: (req: NextRequest) => Response;
  skip?: (req: NextRequest) => boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

interface BucketState {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private redis: Redis | null = null;
  private inMemoryStore: Map<string, BucketState> = new Map();
  private useRedis: boolean = false;
  private config = getProductionConfig();

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      if (this.config.database.redisUrl) {
        this.redis = new Redis(this.config.database.redisUrl, {
          password: this.config.database.redisPassword,
          enableTLS: this.config.database.redisTLSEnabled,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              console.error('Redis connection failed, falling back to in-memory store');
              this.useRedis = false;
              return null;
            }
            return Math.min(times * 100, 3000);
          },
        });

        this.redis.on('connect', () => {
          console.log('✅ Redis connected for rate limiting');
          this.useRedis = true;
        });

        this.redis.on('error', (err) => {
          console.error('Redis error:', err);
          this.useRedis = false;
        });
      }
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.useRedis = false;
    }
  }

  /**
   * Check if request is allowed based on rate limit
   */
  async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = this.parseTimeString(config.windowMs);
    const maxTokens = config.maxRequests;
    const refillRate = maxTokens / windowMs;

    if (this.useRedis && this.redis) {
      return this.checkLimitRedis(identifier, maxTokens, windowMs, refillRate, now);
    } else {
      return this.checkLimitInMemory(identifier, maxTokens, windowMs, refillRate, now);
    }
  }

  /**
   * Check rate limit using Redis
   */
  private async checkLimitRedis(
    identifier: string,
    maxTokens: number,
    windowMs: number,
    refillRate: number,
    now: number
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`;
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis!.pipeline();
      
      // Get current bucket state
      pipeline.hgetall(key);
      
      const results = await pipeline.exec();
      const bucketData = results?.[0]?.[1] as any || {};
      
      let tokens = parseFloat(bucketData.tokens || maxTokens.toString());
      let lastRefill = parseInt(bucketData.lastRefill || now.toString());
      
      // Calculate tokens to add based on time passed
      const timePassed = now - lastRefill;
      const tokensToAdd = timePassed * refillRate;
      tokens = Math.min(maxTokens, tokens + tokensToAdd);
      
      // Check if request is allowed
      const allowed = tokens >= 1;
      
      if (allowed) {
        tokens -= 1;
      }
      
      // Update bucket state
      await this.redis!.pipeline()
        .hset(key, 'tokens', tokens.toString())
        .hset(key, 'lastRefill', now.toString())
        .expire(key, Math.ceil(windowMs / 1000))
        .exec();
      
      const resetAt = new Date(now + windowMs);
      const remaining = Math.floor(tokens);
      
      return {
        allowed,
        limit: maxTokens,
        remaining: Math.max(0, remaining),
        resetAt,
        retryAfter: allowed ? undefined : Math.ceil((1 - tokens) / refillRate),
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fallback to in-memory
      return this.checkLimitInMemory(identifier, maxTokens, windowMs, refillRate, now);
    }
  }

  /**
   * Check rate limit using in-memory store
   */
  private checkLimitInMemory(
    identifier: string,
    maxTokens: number,
    windowMs: number,
    refillRate: number,
    now: number
  ): RateLimitResult {
    let bucket = this.inMemoryStore.get(identifier);
    
    if (!bucket) {
      bucket = {
        tokens: maxTokens,
        lastRefill: now,
      };
    }
    
    // Calculate tokens to add based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = timePassed * refillRate;
    bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // Check if request is allowed
    const allowed = bucket.tokens >= 1;
    
    if (allowed) {
      bucket.tokens -= 1;
    }
    
    // Update store
    this.inMemoryStore.set(identifier, bucket);
    
    // Clean up old entries periodically
    this.cleanupInMemoryStore(windowMs);
    
    const resetAt = new Date(now + windowMs);
    const remaining = Math.floor(bucket.tokens);
    
    return {
      allowed,
      limit: maxTokens,
      remaining: Math.max(0, remaining),
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil((1 - bucket.tokens) / refillRate),
    };
  }

  /**
   * Clean up expired entries from in-memory store
   */
  private cleanupInMemoryStore(windowMs: number): void {
    const now = Date.now();
    const expiry = now - windowMs * 2;
    
    for (const [key, bucket] of this.inMemoryStore.entries()) {
      if (bucket.lastRefill < expiry) {
        this.inMemoryStore.delete(key);
      }
    }
  }

  /**
   * Parse time string to milliseconds
   */
  private parseTimeString(time: string | number): number {
    if (typeof time === 'number') {
      return time;
    }
    
    const units: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    
    const match = time.match(/^(\d+)([mshd]?)$/);
    if (!match) {
      throw new Error(`Invalid time string: ${time}`);
    }
    
    const value = parseInt(match[1]);
    const unit = match[2] || 'ms';
    
    return value * (units[unit] || 1);
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `rate_limit:${identifier}`;
    
    if (this.useRedis && this.redis) {
      await this.redis.del(key);
    } else {
      this.inMemoryStore.delete(identifier);
    }
  }

  /**
   * Get current limit status for an identifier
   */
  async getStatus(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = this.parseTimeString(config.windowMs);
    const maxTokens = config.maxRequests;
    
    if (this.useRedis && this.redis) {
      const key = `rate_limit:${identifier}`;
      const bucketData = await this.redis.hgetall(key);
      
      const tokens = parseFloat(bucketData.tokens || maxTokens.toString());
      const lastRefill = parseInt(bucketData.lastRefill || now.toString());
      
      const timePassed = now - lastRefill;
      const refillRate = maxTokens / windowMs;
      const currentTokens = Math.min(maxTokens, tokens + timePassed * refillRate);
      
      return {
        allowed: currentTokens >= 1,
        limit: maxTokens,
        remaining: Math.floor(currentTokens),
        resetAt: new Date(now + windowMs),
      };
    } else {
      const bucket = this.inMemoryStore.get(identifier);
      
      if (!bucket) {
        return {
          allowed: true,
          limit: maxTokens,
          remaining: maxTokens,
          resetAt: new Date(now + windowMs),
        };
      }
      
      const timePassed = now - bucket.lastRefill;
      const refillRate = maxTokens / windowMs;
      const currentTokens = Math.min(maxTokens, bucket.tokens + timePassed * refillRate);
      
      return {
        allowed: currentTokens >= 1,
        limit: maxTokens,
        remaining: Math.floor(currentTokens),
        resetAt: new Date(now + windowMs),
      };
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware factory
 */
export function createRateLimitMiddleware(options: Partial<RateLimitConfig> = {}) {
  const config: RateLimitConfig = {
    windowMs: options.windowMs || '15m',
    maxRequests: options.maxRequests || 100,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: options.keyGenerator || defaultKeyGenerator,
    handler: options.handler || defaultRateLimitHandler,
    skip: options.skip || (() => false),
  };

  return async function rateLimitMiddleware(req: NextRequest): Promise<Response | null> {
    // Check if should skip
    if (config.skip && config.skip(req)) {
      return null;
    }

    // Generate key for this request
    const key = config.keyGenerator!(req);

    // Check rate limit
    const result = await rateLimiter.checkLimit(key, config);

    // Add headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      if (result.retryAfter) {
        headers.set('Retry-After', result.retryAfter.toString());
      }
      return config.handler!(req);
    }

    return null;
  };
}

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  return `${req.nextUrl.pathname}:${ip}`;
}

/**
 * Default rate limit exceeded handler
 */
function defaultRateLimitHandler(req: NextRequest): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create API-specific rate limiters
 */
export const apiRateLimiters = {
  // Standard API rate limit
  standard: createRateLimitMiddleware({
    windowMs: '15m',
    maxRequests: 100,
  }),

  // Strict rate limit for sensitive operations
  strict: createRateLimitMiddleware({
    windowMs: '15m',
    maxRequests: 10,
  }),

  // Relaxed rate limit for read operations
  relaxed: createRateLimitMiddleware({
    windowMs: '15m',
    maxRequests: 500,
  }),

  // Authentication endpoints
  auth: createRateLimitMiddleware({
    windowMs: '15m',
    maxRequests: 5,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      return `auth:${ip}`;
    },
  }),

  // File upload endpoints
  upload: createRateLimitMiddleware({
    windowMs: '1h',
    maxRequests: 20,
  }),

  // Export/download endpoints
  export: createRateLimitMiddleware({
    windowMs: '1h',
    maxRequests: 50,
  }),

  // Orbit calculation endpoints (resource intensive)
  orbit: createRateLimitMiddleware({
    windowMs: '5m',
    maxRequests: 20,
  }),

  // IPFS operations
  ipfs: createRateLimitMiddleware({
    windowMs: '15m',
    maxRequests: 30,
  }),
};

// Export rate limiter instance for direct use
export { rateLimiter };

/**
 * Rate limit decorator for class methods
 */
export function rateLimit(windowMs: string = '15m', maxRequests: number = 100) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [req] = args;
      const key = defaultKeyGenerator(req);
      
      const result = await rateLimiter.checkLimit(key, {
        windowMs,
        maxRequests,
      });

      if (!result.allowed) {
        throw new Error('Rate limit exceeded');
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}