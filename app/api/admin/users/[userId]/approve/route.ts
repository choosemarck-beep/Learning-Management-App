import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { sendApprovalEmail } from "@/lib/email/sendEmail";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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
    // Wrap getCurrentUser in try-catch
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;

    // Wrap Prisma queries in try-catch
    try {
      // Check if user exists
      const userToApprove = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToApprove) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Update user status to APPROVED
      const approvedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: user.id,
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

      // Send approval email (non-blocking - don't fail approval if email fails)
      let emailSent = false;
      let emailError: any = null;
      try {
        // Use NEXTAUTH_URL from environment (set in Vercel) or construct from request
        // Never use hardcoded localhost - this breaks in production
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");
        const baseUrl = process.env.NEXTAUTH_URL || origin || (host ? `https://${host}` : "");
        const loginUrl = baseUrl ? `${baseUrl}/login` : "/login";
        
        await sendApprovalEmail(
          approvedUser.email,
          approvedUser.name,
          loginUrl
        );
        emailSent = true;
        console.log("✅ Approval email sent successfully to:", approvedUser.email);
      } catch (error) {
        emailError = error;
        console.error("❌ Failed to send approval email:", {
          email: approvedUser.email,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Continue even if email fails - user is still approved
      }

      const response = NextResponse.json(
        {
          success: true,
          message: "User approved successfully",
          data: approvedUser,
          emailSent, // Indicate if email was sent successfully
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
    } catch (dbError) {
      console.error("Database error approving user:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to approve user" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/users/[userId]/approve:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

