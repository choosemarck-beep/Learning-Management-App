import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendEmail } from "@/lib/email/client";
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

    // Send password reset email
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset Your Password - Learning Management",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Your Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #0F172A; color: #FFFFFF; padding: 20px; line-height: 1.6;">
              <div style="max-width: 600px; margin: 0 auto; background-color: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 30px; border: 1px solid rgba(139, 92, 246, 0.2);">
                <h1 style="color: #8B5CF6; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h1>
                <p style="color: #CBD5E1; font-size: 16px; margin-bottom: 20px;">
                  Hello ${user.name || "there"},
                </p>
                <p style="color: #CBD5E1; font-size: 16px; margin-bottom: 20px;">
                  We received a request to reset your password. Click the button below to create a new password:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background-color: #8B5CF6; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Reset Password
                  </a>
                </div>
                <p style="color: #CBD5E1; font-size: 14px; margin-bottom: 10px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="color: #8B5CF6; font-size: 12px; word-break: break-all; margin-bottom: 20px;">
                  ${resetUrl}
                </p>
                <p style="color: #94A3B8; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                  <strong>Important:</strong> This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
                </p>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 20px;">
                  If the button doesn't work, copy and paste the link above into your browser.
                </p>
              </div>
            </body>
          </html>
        `,
      });
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

