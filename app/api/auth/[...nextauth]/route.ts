import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { NextResponse } from "next/server";

// Wrap POST handler with rate limiting for login attempts
const originalPOST = handlers.POST;

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  // Apply rate limiting for login attempts
  // Note: This applies to all NextAuth POST requests, but login is the main concern
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(
    clientIP,
    "login",
    RATE_LIMIT_CONFIGS.login
  );

  if (!rateLimitResult.allowed) {
    const resetTimeSeconds = Math.ceil(
      (rateLimitResult.resetTime - Date.now()) / 1000
    );
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        retryAfter: resetTimeSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetTimeSeconds.toString(),
          "X-RateLimit-Limit": RATE_LIMIT_CONFIGS.login.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  // Call original NextAuth handler
  const response = await originalPOST(request);

  // Add rate limit headers if response is a NextResponse
  if (response instanceof NextResponse) {
    response.headers.set(
      "X-RateLimit-Limit",
      RATE_LIMIT_CONFIGS.login.maxRequests.toString()
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
}

