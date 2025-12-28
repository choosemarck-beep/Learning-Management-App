import { Resend } from "resend";

// Initialize Resend client
// This abstraction allows easy switching to other email services later
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email service abstraction
export async function sendEmail({
  to,
  subject,
  html,
  from = "Learning Management <onboarding@resend.dev>",
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    const errorMsg = "Email service is not configured. Please contact support.";
    console.error("❌ Email service configuration error: RESEND_API_KEY is not set");
    throw new Error(errorMsg);
  }

  // Warning about Resend free tier limitations
  if (from.includes("onboarding@resend.dev")) {
    console.warn("⚠️  Using onboarding@resend.dev - This can only send to your Resend account email.");
    console.warn("⚠️  To send to any email, verify a domain at https://resend.com/domains");
  }

  try {
    console.log("📧 Attempting to send email to:", to);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Email sending error:", {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
      });
      // Don't expose internal error details to client
      throw new Error("Failed to send email. Please try again later.");
    }

    console.log("✅ Email sent successfully:", {
      to,
      id: data?.id,
    });
    return data;
  } catch (error) {
    console.error("❌ Email sending error:", {
      error: error instanceof Error ? error.message : String(error),
      to,
      from,
    });
    throw error;
  }
}

