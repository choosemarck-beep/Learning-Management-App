import { render } from "@react-email/render";
import { sendEmail as sendEmailViaSendGrid } from "./client";
import { OnboardingEmail } from "./templates/onboarding";
import { TrainerOnboardingEmail } from "./templates/trainer-onboarding";
import { ApprovalEmail } from "./templates/approval";
import { PasswordResetEmail } from "./templates/password-reset";

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

    // Send email via SendGrid
    await sendEmailViaSendGrid({
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

    // Send email via SendGrid
    await sendEmailViaSendGrid({
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

/**
 * Send approval email to user when their account is approved
 * @param email - User's email address
 * @param userName - User's name
 * @param loginUrl - URL to login page
 */
export async function sendApprovalEmail(
  email: string,
  userName: string,
  loginUrl: string
) {
  try {
    // Render React Email component to HTML
    const html = await render(
      ApprovalEmail({
        userName,
        loginUrl,
      })
    );

    // Send email via SendGrid
    await sendEmailViaSendGrid({
      to: email,
      subject: "Your Account Has Been Approved - Welcome to Learning Management!",
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send approval email:", error);
    throw error;
  }
}

/**
 * Send password reset email to user
 * @param email - User's email address
 * @param userName - User's name
 * @param resetUrl - Password reset URL with token
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetUrl: string
) {
  try {
    // Render React Email component to HTML
    const html = await render(
      PasswordResetEmail({
        userName,
        resetUrl,
      })
    );

    // Send email via SendGrid
    await sendEmailViaSendGrid({
      to: email,
      subject: "Reset Your Password - Get Back to Learning!",
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

