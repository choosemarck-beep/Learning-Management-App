/**
 * Rate Limit Middleware Wrapper
 * Wraps API route handlers with rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS, RateLimitConfig } from "./rateLimit";

type RouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API route handler with rate limiting
 * @param handler - The route handler function
 * @param endpoint - Endpoint name for rate limiting (e.g., "login", "signup")
 * @param config - Optional custom rate limit configuration (uses predefined configs if not provided)
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit(
  handler: RouteHandler,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS | string,
  config?: RateLimitConfig
): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    // Get rate limit configuration
    const rateLimitConfig: RateLimitConfig =
      config ||
      (endpoint in RATE_LIMIT_CONFIGS
        ? RATE_LIMIT_CONFIGS[endpoint as keyof typeof RATE_LIMIT_CONFIGS]
        : {
            maxRequests: 10,
            windowMs: 60 * 1000, // Default: 10 requests per minute
          });

    // Get client identifier (IP address)
    const clientIP = getClientIP(request);

    // Check rate limit
    const rateLimitResult = checkRateLimit(
      clientIP,
      endpoint,
      rateLimitConfig
    );

    if (!rateLimitResult.allowed) {
      // Rate limit exceeded
      const resetTimeSeconds = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000
      );

      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
          retryAfter: resetTimeSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetTimeSeconds.toString(),
            "X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(request, context);

    // Clone response to add headers (if response is not already a NextResponse)
    if (response instanceof NextResponse) {
      response.headers.set(
        "X-RateLimit-Limit",
        rateLimitConfig.maxRequests.toString()
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        rateLimitResult.resetTime.toString()
      );
    }

    return response;
  };
}

