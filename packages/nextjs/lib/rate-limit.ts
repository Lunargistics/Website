/**
 * Advanced Rate Limiting System
 * Implements sliding window rate limiting with Redis-like functionality using in-memory store
 */
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: NextRequest, remaining: number) => void;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[];
}

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

class SlidingWindowRateLimit {
  private store = new RateLimitStore();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: this.defaultKeyGenerator,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      onLimitReached: () => {},
      ...config,
    };
  }

  private defaultKeyGenerator(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || '127.0.0.1';
    return `rate_limit:${ip}:${req.nextUrl.pathname}`;
  }

  async check(req: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalRequests: number;
  }> {
    const key = this.config.keyGenerator(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    let entry = this.store.get(key);
    
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        requests: []
      };
    }

    // Remove requests outside the current window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    entry.count = entry.requests.length;

    // Check if we can allow this request
    const allowed = entry.count < this.config.maxRequests;
    
    if (allowed) {
      entry.requests.push(now);
      entry.count = entry.requests.length;
      entry.resetTime = Math.max(entry.resetTime, now + this.config.windowMs);
    } else {
      this.config.onLimitReached(req, this.config.maxRequests - entry.count);
    }

    this.store.set(key, entry);

    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      totalRequests: entry.count
    };
  }

  async reset(req: NextRequest): Promise<void> {
    const key = this.config.keyGenerator(req);
    this.store.delete(key);
  }

  destroy(): void {
    this.store.destroy();
  }
}

// Rate limit configurations for different endpoints
const rateLimitConfigs = {
  // Expensive orbital calculations
  orbital: new SlidingWindowRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
    onLimitReached: (req, remaining) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
      console.warn(`Rate limit exceeded for orbital calculations: ${ip} on ${req.nextUrl.pathname}`);
    }
  }),

  // IPFS operations
  ipfs: new SlidingWindowRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
    onLimitReached: (req, remaining) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
      console.warn(`Rate limit exceeded for IPFS operations: ${ip} on ${req.nextUrl.pathname}`);
    }
  }),

  // API endpoints
  api: new SlidingWindowRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    onLimitReached: (req, remaining) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
      console.warn(`Rate limit exceeded for API: ${ip} on ${req.nextUrl.pathname}`);
    }
  }),

  // Authentication endpoints
  auth: new SlidingWindowRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    onLimitReached: (req, remaining) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
      console.warn(`Rate limit exceeded for auth: ${ip} on ${req.nextUrl.pathname}`);
    }
  }),

  // Credit purchases (more restrictive)
  credits: new SlidingWindowRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 purchases per minute
    onLimitReached: (req, remaining) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
      console.warn(`Rate limit exceeded for credit purchases: ${ip} on ${req.nextUrl.pathname}`);
    }
  })
};

// Rate limiting middleware
export async function withRateLimit(
  req: NextRequest, 
  type: keyof typeof rateLimitConfigs,
  handler: () => Promise<Response>
): Promise<Response> {
  const rateLimit = rateLimitConfigs[type];
  const result = await rateLimit.check(req);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          maxRequests: rateLimitConfigs[type].config.maxRequests,
          windowMs: rateLimitConfigs[type].config.windowMs,
          remaining: result.remaining,
          resetTime: result.resetTime,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': (rateLimitConfigs[type] as any).config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = await handler();
  
  response.headers.set('X-RateLimit-Limit', (rateLimitConfigs[type] as any).config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

  return response;
}

// Advanced input sanitization
export class InputSanitizer {
  private static readonly MAX_STRING_LENGTH = 10000;
  private static readonly MAX_ARRAY_LENGTH = 1000;
  private static readonly MAX_OBJECT_DEPTH = 10;
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /@import/gi,
    /binding\s*:/gi
  ];

  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|\*\/|\/\*)/gi,
    /(\bOR\b|\bAND\b).*[=<>]/gi,
    /['"];\s*(DROP|DELETE|UPDATE|INSERT)/gi
  ];

  static sanitizeString(input: string, maxLength = this.MAX_STRING_LENGTH): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Length check
    if (input.length > maxLength) {
      throw new Error(`String length exceeds maximum of ${maxLength} characters`);
    }

    // Remove dangerous patterns
    let sanitized = input;
    for (const pattern of this.DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Check for SQL injection patterns
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new Error('Potentially dangerous SQL pattern detected');
      }
    }

    // Encode HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  static sanitizeNumber(input: number, min = -Infinity, max = Infinity): number {
    if (typeof input !== 'number' || !Number.isFinite(input)) {
      throw new Error('Input must be a finite number');
    }

    if (input < min || input > max) {
      throw new Error(`Number must be between ${min} and ${max}`);
    }

    return input;
  }

  static sanitizeArray<T>(
    input: T[], 
    itemSanitizer: (item: T) => T,
    maxLength = this.MAX_ARRAY_LENGTH
  ): T[] {
    if (!Array.isArray(input)) {
      throw new Error('Input must be an array');
    }

    if (input.length > maxLength) {
      throw new Error(`Array length exceeds maximum of ${maxLength} items`);
    }

    return input.map(itemSanitizer);
  }

  static sanitizeObject(
    input: Record<string, any>, 
    depth = 0,
    maxDepth = this.MAX_OBJECT_DEPTH
  ): Record<string, any> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('Input must be a plain object');
    }

    if (depth > maxDepth) {
      throw new Error(`Object nesting exceeds maximum depth of ${maxDepth}`);
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
      // Sanitize key
      const sanitizedKey = this.sanitizeString(key, 100);

      // Sanitize value based on type
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = this.sanitizeNumber(value);
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey] = this.sanitizeArray(value, (item) => {
          if (typeof item === 'object' && item !== null) {
            return this.sanitizeObject(item, depth + 1, maxDepth);
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value, depth + 1, maxDepth);
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else {
        // Skip undefined, functions, symbols, etc.
        continue;
      }
    }

    return sanitized;
  }

  // Specific sanitizers for different data types
  static sanitizeTLE(line: string): string {
    const sanitized = this.sanitizeString(line, 69);
    
    // TLE lines must be exactly 69 characters
    if (sanitized.length !== 69) {
      throw new Error('TLE line must be exactly 69 characters');
    }

    // Basic format validation
    if (!/^[12] \d/.test(sanitized)) {
      throw new Error('Invalid TLE line format');
    }

    return sanitized;
  }

  static sanitizeLatitude(lat: number): number {
    const sanitized = this.sanitizeNumber(lat, -90, 90);
    return Math.round(sanitized * 1000000) / 1000000; // 6 decimal places
  }

  static sanitizeLongitude(lon: number): number {
    const sanitized = this.sanitizeNumber(lon, -180, 180);
    return Math.round(sanitized * 1000000) / 1000000; // 6 decimal places
  }

  static sanitizeAltitude(alt: number): number {
    return this.sanitizeNumber(alt, -500, 100000); // -500m to 100,000km
  }

  static sanitizeIPFSHash(hash: string): string {
    const sanitized = this.sanitizeString(hash, 100);
    
    // Basic IPFS hash validation
    if (!/^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^baf[a-z0-9]{56}$/.test(sanitized)) {
      throw new Error('Invalid IPFS hash format');
    }

    return sanitized;
  }

  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email, 254);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized.toLowerCase();
  }
}

export { SlidingWindowRateLimit, rateLimitConfigs };