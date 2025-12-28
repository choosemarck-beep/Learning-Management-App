import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";

// Generate random password (reused from create-trainer route)
function generateRandomPassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;

  let password = "";
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
});

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
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = params;
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Prevent self-password reset
    if (userId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Cannot reset your own password" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToReset = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToReset) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent resetting super admin password unless requester is also super admin
    if (userToReset.role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Only super admin can reset super admin passwords" },
        { status: 403 }
      );
    }

    // Generate or use provided password
    const newPassword = validatedData.newPassword || generateRandomPassword(12);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        password: newPassword, // Return plain password for admin to share
        message: "Password reset successfully",
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
    console.error("Error resetting password:", error);
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
        error: "Failed to reset password",
      },
      { status: 500 }
    );
  }
}

