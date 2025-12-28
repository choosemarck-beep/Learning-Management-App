import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";

/**
 * Test endpoint to verify Resend email configuration
 * Usage: POST /api/test-email with { "to": "your-email@example.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to || !to.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address required" },
        { status: 400 }
      );
    }

    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        {
          error: "Email service is not configured",
        },
        { status: 500 }
      );
    }

    // Try to send a test email
    try {
      const result = await sendEmail({
        to,
        subject: "Test Email from Learning Management",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0F172A; color: #FFFFFF;">
            <h1 style="color: #8B5CF6;">Test Email</h1>
            <p>This is a test email from your Learning Management app.</p>
            <p>If you received this, your email configuration is working correctly!</p>
          </div>
        `,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Test email sent successfully",
          data: result,
        },
        { status: 200 }
      );
    } catch (emailError: any) {
      console.error("Test email error:", emailError);
      // Don't expose error details or troubleshooting info to client
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send test email",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email route error:", error);
    // Don't expose error details to client
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

