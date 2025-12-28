/**
 * Rate Limiting Utility
 * In-memory rate limiting for API endpoints
 * 
 * Note: For production, consider using Redis or a dedicated rate limiting service
 * This implementation uses a simple Map-based store suitable for development
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit tracking
// Key format: `${endpoint}:${identifier}` (e.g., "login:192.168.1.1")
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval to remove expired entries (runs every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Start cleanup interval
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (typically IP address)
 * @param endpoint - Endpoint name (e.g., "login", "signup")
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry exists or window has expired, create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP address from request
 * Handles various proxy headers (X-Forwarded-For, X-Real-IP)
 */
export function getClientIP(request: Request): string {
  // Try X-Forwarded-For header (first IP in chain)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  // Try X-Real-IP header
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to unknown (shouldn't happen in production with proper proxy)
  return "unknown";
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  signup: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  passwordChange: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  adminAction: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

