import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendPasswordResetEmail } from "@/lib/email/sendEmail";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true },
    });

    // Security: Don't reveal if email exists or not
    // Always return success message to prevent email enumeration
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json(
        { success: true, message: "If that email exists, we've sent a password reset link." },
        { status: 200 }
      );
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour expiry

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpires: resetTokenExpires,
      },
    });

    // Generate reset URL - use NEXTAUTH_URL from environment (set in Vercel) or construct from request
    // Never use hardcoded localhost - this breaks in production
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const baseUrl = process.env.NEXTAUTH_URL || origin || (host ? `https://${host}` : "");
    const resetUrl = baseUrl ? `${baseUrl}/reset-password?token=${resetToken}` : `/reset-password?token=${resetToken}`;

    // Send password reset email using professional template
    try {
      await sendPasswordResetEmail(
        user.email,
        user.name || "Explorer",
        resetUrl
      );
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      // Don't fail the request if email fails (user might have typo, etc.)
      // Still return success to prevent email enumeration
      return NextResponse.json(
        { success: true, message: "If that email exists, we've sent a password reset link." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Password reset link sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

