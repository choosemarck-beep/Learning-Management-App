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

interface ApprovalEmailProps {
  userName: string;
  loginUrl: string;
}

export const ApprovalEmail: React.FC<ApprovalEmailProps> = ({
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
            <Text style={heading}>You're Approved - Let's Start Learning!</Text>

            <Text style={paragraph}>
              Congratulations, {userName}! Your account has been approved and you're all set 
              to begin your learning adventure. Get ready to earn XP, unlock achievements, and 
              climb the leaderboard!
            </Text>

            <Text style={paragraph}>
              <strong>Your learning journey starts now:</strong>
            </Text>

            <Text style={listItem}>• Explore courses and start earning XP</Text>
            <Text style={listItem}>• Unlock achievements and badges as you progress</Text>
            <Text style={listItem}>• Compete on leaderboards and see how you rank</Text>
            <Text style={listItem}>• Complete training modules and level up</Text>
            <Text style={listItem}>• Track your progress and celebrate every milestone</Text>
            <Text style={listItem}>• Connect with your team and share your success</Text>

            <Section style={buttonContainer}>
              <Link href={loginUrl} style={button}>
                Start Learning Now
              </Link>
            </Section>

            <Text style={paragraph}>
              We're excited to see you succeed! Every course you complete, every quiz you ace, 
              and every achievement you unlock brings you closer to becoming a learning champion. 
              Let's make this journey amazing together!
            </Text>

            <Text style={paragraph}>
              If you have any questions or need help getting started, our support team is here 
              to help you succeed!
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

export default ApprovalEmail;

