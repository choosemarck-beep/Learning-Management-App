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
            <Text style={heading}>Welcome to Your Learning Journey, {userName}!</Text>

            <Text style={paragraph}>
              We're thrilled to have you join our learning community! You've taken the first step 
              toward unlocking your potential and earning amazing achievements.
            </Text>

            <Text style={paragraph}>
              <strong>Great news:</strong> Your account is being reviewed and will be approved soon! 
              Our team is working to get you started on your learning adventure as quickly as possible.
            </Text>

            <Text style={paragraph}>
              <strong>What's waiting for you once you're approved:</strong>
            </Text>

            <Text style={listItem}>• Access exciting courses and training materials</Text>
            <Text style={listItem}>• Earn XP and level up as you learn</Text>
            <Text style={listItem}>• Unlock achievements and badges</Text>
            <Text style={listItem}>• Compete on leaderboards and climb the ranks</Text>
            <Text style={listItem}>• Track your progress and celebrate milestones</Text>

            <Text style={paragraph}>
              We'll send you an email the moment your account is approved - then you can start 
              your learning journey right away! Get ready to level up!
            </Text>

            <Text style={paragraph}>
              If you have any questions, our support team is here to help you succeed!
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

