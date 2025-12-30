import { render } from "@react-email/render";
import { sendEmail as sendEmailViaResend } from "./client";
import { OnboardingEmail } from "./templates/onboarding";
import { TrainerOnboardingEmail } from "./templates/trainer-onboarding";

/**
 * Send onboarding email to new staff member (employees, branch managers, etc.)
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

/**
 * Send onboarding email to new trainer
 * @param email - Trainer's email address
 * @param userName - Trainer's name
 * @param password - Generated password for the trainer
 * @param loginUrl - URL to login page
 */
export async function sendTrainerOnboardingEmail(
  email: string,
  userName: string,
  password: string,
  loginUrl: string
) {
  try {
    // Render React Email component to HTML
    const html = await render(
      TrainerOnboardingEmail({
        userName,
        email,
        password,
        loginUrl,
      })
    );

    // Send email via Resend
    await sendEmailViaResend({
      to: email,
      subject: "Welcome to Learning Management - Your Trainer Account is Ready",
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send trainer onboarding email:", error);
    throw error;
  }
}

