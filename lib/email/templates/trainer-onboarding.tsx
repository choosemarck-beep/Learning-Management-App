import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface TrainerOnboardingEmailProps {
  userName: string;
  email: string;
  password: string;
  loginUrl: string;
}

export const TrainerOnboardingEmail: React.FC<TrainerOnboardingEmailProps> = ({
  userName,
  email,
  password,
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
            <Text style={heading}>Welcome, Trainer {userName}!</Text>

            <Text style={paragraph}>
              Your trainer account has been created and approved. You now have
              access to the Learning Management platform to create and manage
              training content.
            </Text>

            <Text style={paragraph}>
              <strong>Your Login Credentials:</strong>
            </Text>

            <Section style={credentialsBox}>
              <Text style={credentialLabel}>Email:</Text>
              <Text style={credentialValue}>{email}</Text>
              
              <Text style={credentialLabel}>Password:</Text>
              <Text style={credentialValue}>{password}</Text>
            </Section>

            <Text style={warningText}>
              ⚠️ Please save these credentials securely. You can change your
              password after logging in.
            </Text>

            <Text style={paragraph}>
              <strong>As a Trainer, you can:</strong>
            </Text>

            <Text style={listItem}>• Create and manage training courses</Text>
            <Text style={listItem}>• Upload training videos and materials</Text>
            <Text style={listItem}>• Create quizzes and assessments</Text>
            <Text style={listItem}>• Track employee progress and completion</Text>
            <Text style={listItem}>• Manage training content and updates</Text>

            <Section style={buttonContainer}>
              <a href={loginUrl} style={button}>
                Login to Your Account
              </a>
            </Section>

            <Text style={paragraph}>
              If you have any questions or need assistance, please contact your
              administrator or support team.
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
  backgroundColor: "#1E1B4B",
  padding: "30px 20px",
  textAlign: "center" as const,
  borderRadius: "8px 8px 0 0",
};

const logoText = {
  color: "#8B5CF6",
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
};

const paragraph = {
  color: "#CBD5E1",
  fontSize: "16px",
  lineHeight: "1.6",
  marginBottom: "16px",
};

const credentialsBox = {
  backgroundColor: "#0F172A",
  border: "2px solid #8B5CF6",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const credentialLabel = {
  color: "#8B5CF6",
  fontSize: "14px",
  fontWeight: "600",
  marginTop: "12px",
  marginBottom: "4px",
};

const credentialValue = {
  color: "#FFFFFF",
  fontSize: "16px",
  fontFamily: "monospace",
  backgroundColor: "#1E293B",
  padding: "8px 12px",
  borderRadius: "4px",
  marginBottom: "8px",
  wordBreak: "break-all" as const,
};

const warningText = {
  color: "#FBBF24",
  fontSize: "14px",
  fontStyle: "italic",
  marginTop: "16px",
  marginBottom: "20px",
  padding: "12px",
  backgroundColor: "rgba(251, 191, 36, 0.1)",
  borderRadius: "4px",
  borderLeft: "3px solid #FBBF24",
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
  padding: "14px 28px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  transition: "background-color 0.3s",
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

