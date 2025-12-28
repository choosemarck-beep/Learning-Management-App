import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Link,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface OnboardingEmailProps {
  userName: string;
  loginUrl: string;
}

export const OnboardingEmail: React.FC<OnboardingEmailProps> = ({
  userName,
  loginUrl,
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
            <Text style={heading}>Welcome to Learning Management, {userName}!</Text>

            <Text style={paragraph}>
              Thank you for joining our learning platform. We're excited to have you
              on board!
            </Text>

            <Text style={paragraph}>
              Your enrollment is currently pending approval. Our team will review your
              account and send you a confirmation email once your account has been
              approved.
            </Text>

            <Text style={paragraph}>
              Once approved, you'll be able to:
            </Text>

            <Text style={listItem}>• Access all learning courses and materials</Text>
            <Text style={listItem}>• Track your progress and earn achievements</Text>
            <Text style={listItem}>• Connect with your team and see leaderboards</Text>

            <Text style={paragraph}>
              We'll notify you via email as soon as your account is approved. In the
              meantime, feel free to explore our platform and get ready for your
              learning journey!
            </Text>

            <Text style={paragraph}>
              If you have any questions, please don't hesitate to reach out to our
              support team.
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
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
  backgroundColor: "#1E1B4B",
};

const header = {
  textAlign: "center" as const,
  padding: "32px 0",
  borderBottom: "2px solid #8B5CF6",
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#8B5CF6",
  margin: "4px 0",
  letterSpacing: "2px",
};

const content = {
  padding: "32px 20px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#FFFFFF",
  marginBottom: "20px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#CBD5E1",
  marginBottom: "16px",
};

const listItem = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#CBD5E1",
  marginLeft: "20px",
  marginBottom: "8px",
};

const divider = {
  borderColor: "#8B5CF6",
  margin: "32px 0",
};

const footer = {
  fontSize: "12px",
  color: "#94A3B8",
  textAlign: "center" as const,
  marginTop: "32px",
};

export default OnboardingEmail;

