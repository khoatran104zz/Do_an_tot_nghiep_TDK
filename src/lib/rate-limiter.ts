import { NextRequest } from 'next/server';
import { apiError } from './api-response';

export interface RateLimitOptions {
  windowMs: number; // e.g. 60 * 1000 for 1 minute
  maxRequests: number; // e.g. 10 requests per window
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory Token Bucket / Sliding Window Rate Limiter
 * Environment-agnostic with automatic garbage collection of expired entries.
 */
export class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  private cleanupExpired() {
    const now = Date.now();
    if (now - this.lastCleanup < 60 * 1000) return;
    this.lastCleanup = now;

    for (const [key, record] of this.store.entries()) {
      if (record.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check rate limit for a specific identifier key
   */
  check(
    key: string,
    optionsOrMax: RateLimitOptions | number,
    windowMsInput?: number
  ): RateLimitResult {
    this.cleanupExpired();

    const options: RateLimitOptions =
      typeof optionsOrMax === 'number'
        ? { maxRequests: optionsOrMax, windowMs: windowMsInput || 60 * 1000 }
        : optionsOrMax;

    const now = Date.now();
    const fullKey = `${options.keyPrefix || 'rl'}:${key}`;
    const record = this.store.get(fullKey);

    if (!record || record.resetTime <= now) {
      const resetTime = now + options.windowMs;
      this.store.set(fullKey, { count: 1, resetTime });
      return {
        allowed: true,
        limit: options.maxRequests,
        remaining: Math.max(0, options.maxRequests - 1),
        resetTime,
        retryAfterSeconds: 0,
      };
    }

    if (record.count >= options.maxRequests) {
      return {
        allowed: false,
        limit: options.maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfterSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
      };
    }

    record.count += 1;
    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - record.count),
      resetTime: record.resetTime,
      retryAfterSeconds: 0,
    };
  }


  /**
   * Resolve client IP or identifier from NextRequest
   */
  resolveClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return '127.0.0.1';
  }

  /**
   * Helper to evaluate request rate limit and return 429 response if exceeded
   */
  apply(req: NextRequest, options: RateLimitOptions, customKey?: string) {
    const key = customKey || this.resolveClientIp(req);
    const result = this.check(key, options);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
      return {
        allowed: false,
        response: apiError(
          `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfterSeconds} giây.`,
          'RATE_LIMIT_EXCEEDED',
          429,
          { retryAfterSeconds }
        ),
      };
    }

    return { allowed: true, response: null };
  }
}

export const rateLimiter = new RateLimiter();
