import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  userName,
  resetUrl,
}) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>LEARNING</Text>
            <Text style={logoText}>MANAGEMENT</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Ready to Get Back on Track, {userName}?</Text>

            <Text style={paragraph}>
              We received a request to reset your password. No worries - we've got you covered! 
              Click the button below to create a new secure password and get back to your learning journey.
            </Text>

            <Section style={buttonContainer}>
              <Link href={resetUrl} style={button}>
                Reset My Password
              </Link>
            </Section>

            <Text style={paragraph}>
              <strong>What happens next?</strong>
            </Text>

            <Text style={listItem}>• You'll be able to set a new secure password</Text>
            <Text style={listItem}>• Your account will be ready to continue learning</Text>
            <Text style={listItem}>• You can pick up right where you left off!</Text>

            <Text style={paragraph}>
              <strong>Quick tip:</strong> If the button doesn't work, copy and paste this link into your browser:
            </Text>

            <Section style={linkBox}>
              <Text style={linkText}>{resetUrl}</Text>
            </Section>

            <Text style={infoBox}>
              <strong>Time-sensitive:</strong> This link will expire in 1 hour for your security. 
              If you didn't request this, you can safely ignore this email - your account remains secure.
            </Text>

            <Text style={paragraph}>
              Once you're back in, you'll be able to continue earning XP, unlocking achievements, 
              and climbing the leaderboard! We're excited to see you back and ready to continue 
              your learning journey.
            </Text>

            <Hr style={divider} />

            <Text style={footer}>
              This is an automated message. Please do not reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#0F172A",
  fontFamily: '"Glacial Indifference", Arial, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
};

const header = {
  background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
  padding: "30px 20px",
  textAlign: "center" as const,
  borderRadius: "8px 8px 0 0",
};

const logoText = {
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0",
  letterSpacing: "2px",
};

const content = {
  backgroundColor: "#1E293B",
  padding: "30px 20px",
  borderRadius: "0 0 8px 8px",
};

const heading = {
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: "700",
  marginBottom: "20px",
  textAlign: "center" as const,
  background: "linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const paragraph = {
  color: "#CBD5E1",
  fontSize: "16px",
  lineHeight: "1.6",
  marginBottom: "16px",
};

const listItem = {
  color: "#CBD5E1",
  fontSize: "16px",
  lineHeight: "1.8",
  marginBottom: "8px",
  paddingLeft: "8px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#8B5CF6",
  color: "#FFFFFF",
  padding: "14px 32px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  transition: "background-color 0.3s",
  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
};

const linkBox = {
  backgroundColor: "#0F172A",
  border: "1px solid rgba(139, 92, 246, 0.3)",
  borderRadius: "6px",
  padding: "12px",
  margin: "16px 0",
  wordBreak: "break-all" as const,
};

const linkText = {
  color: "#8B5CF6",
  fontSize: "12px",
  fontFamily: "monospace",
  margin: "0",
  lineHeight: "1.5",
};

const infoBox = {
  color: "#FBBF24",
  fontSize: "14px",
  lineHeight: "1.6",
  marginTop: "20px",
  marginBottom: "20px",
  padding: "12px",
  backgroundColor: "rgba(251, 191, 36, 0.1)",
  borderRadius: "6px",
  borderLeft: "3px solid #FBBF24",
};

const divider = {
  borderColor: "#334155",
  margin: "30px 0",
};

const footer = {
  color: "#94A3B8",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "20px",
};

export default PasswordResetEmail;

