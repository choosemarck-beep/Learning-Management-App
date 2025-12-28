import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(
    clientIP,
    "passwordChange",
    RATE_LIMIT_CONFIGS.passwordChange
  );

  if (!rateLimitResult.allowed) {
    const resetTimeSeconds = Math.ceil(
      (rateLimitResult.resetTime - Date.now()) / 1000
    );
    return NextResponse.json(
      {
        success: false,
        error: "Too many password change attempts. Please try again later.",
        retryAfter: resetTimeSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetTimeSeconds.toString(),
          "X-RateLimit-Limit": RATE_LIMIT_CONFIGS.passwordChange.maxRequests.toString(),
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
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!userWithPassword || !userWithPassword.password) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      userWithPassword.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(
      validatedData.newPassword,
      userWithPassword.password
    );

    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "Failed to change password",
      },
      { status: 500 }
    );
  }
}

