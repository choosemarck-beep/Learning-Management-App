import sgMail from "@sendgrid/mail";

// Initialize SendGrid client
// This abstraction allows easy switching to other email services later
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email service abstraction
export async function sendEmail({
  to,
  subject,
  html,
  from = "Learning Management <noreply@sendgrid.net>",
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  // Check if API key is configured
  if (!process.env.SENDGRID_API_KEY) {
    const errorMsg = "Email service is not configured. Please contact support.";
    console.error("❌ Email service configuration error: SENDGRID_API_KEY is not set");
    throw new Error(errorMsg);
  }

  // Note: SendGrid free tier allows sending to any email address
  // For production, verify your sender domain in SendGrid dashboard
  // Default "from" address may not work - use a verified sender email

  try {
    console.log("📧 Attempting to send email:", {
      to,
      from,
      subject,
      hasApiKey: !!process.env.SENDGRID_API_KEY,
      apiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
    });
    
    const msg = {
      to,
      from,
      subject,
      html,
    };

    const [response, body] = await sgMail.send(msg);

    console.log("✅ Email sent successfully:", {
      to,
      statusCode: response.statusCode,
      headers: response.headers,
    });

    return {
      id: response.headers["x-message-id"]?.[0] || undefined,
      statusCode: response.statusCode,
    };
  } catch (error: any) {
    // SendGrid errors have a response property with error details
    const errorMessage = error?.response?.body?.errors?.[0]?.message || 
                        error?.message || 
                        "Failed to send email";
    
    console.error("❌ Email sending error:", {
      message: errorMessage,
      code: error?.code,
      response: error?.response?.body,
      to,
      from,
    });
    
    // Don't expose internal error details to client
    throw new Error("Failed to send email. Please try again later.");
  }
}

