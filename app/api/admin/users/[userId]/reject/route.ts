import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Apply rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(
    clientIP,
    "adminAction",
    RATE_LIMIT_CONFIGS.adminAction
  );

  if (!rateLimitResult.allowed) {
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
          "X-RateLimit-Limit": RATE_LIMIT_CONFIGS.adminAction.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = params;

    // Check if user exists
    const userToReject = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToReject) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user status to REJECTED
    const rejectedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: "REJECTED",
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        position: {
          select: {
            id: true,
            title: true,
            role: true,
          },
        },
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "User rejected successfully",
        data: rejectedUser,
      },
      { status: 200 }
    );

    // Add rate limit headers
    response.headers.set(
      "X-RateLimit-Limit",
      RATE_LIMIT_CONFIGS.adminAction.maxRequests.toString()
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      rateLimitResult.resetTime.toString()
    );

    return response;
  } catch (error) {
    console.error("Error rejecting user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reject user",
      },
      { status: 500 }
    );
  }
}

