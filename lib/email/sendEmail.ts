import { render } from "@react-email/render";
import { sendEmail as sendEmailViaResend } from "./client";
import { OnboardingEmail } from "./templates/onboarding";

/**
 * Send onboarding email to new user
 * @param email - User's email address
 * @param userName - User's name
 * @param loginUrl - URL to login page
 */
export async function sendOnboardingEmail(
  email: string,
  userName: string,
  loginUrl: string
) {
  try {
    // Render React Email component to HTML
    const html = await render(
      OnboardingEmail({
        userName,
        loginUrl,
      })
    );

    // Send email via Resend
    await sendEmailViaResend({
      to: email,
      subject: "Welcome to Learning Management - Account Pending Approval",
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send onboarding email:", error);
    throw error;
  }
}

