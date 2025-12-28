import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          // Normalize email to lowercase for case-insensitive lookup
          const normalizedEmail = email.toLowerCase().trim();
          // Trim password to remove any accidental whitespace
          const trimmedPassword = password.trim();

          console.log("Login attempt:", { email: normalizedEmail, passwordLength: trimmedPassword.length });

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              status: true,
              role: true,
              avatar: true,
              employeeNumber: true,
            },
          });

          if (!user) {
            console.error("Login attempt failed: User not found", { email: normalizedEmail });
            return null;
          }

          if (!user.password) {
            console.error("Login attempt failed: User has no password", { userId: user.id, email: normalizedEmail });
            return null;
          }

          // Check if user is approved
          if (user.status !== "APPROVED") {
            // Return null to reject login, but we'll handle the error message in login page
            // by checking the user status separately if needed
            // For now, we'll use a custom error code that NextAuth can pass through
            const error = new Error(
              user.status === "PENDING"
                ? "PENDING_APPROVAL"
                : user.status === "REJECTED"
                ? "ACCOUNT_REJECTED"
                : "ACCOUNT_NOT_APPROVED"
            );
            // Set a custom property that we can check
            (error as any).code = user.status === "PENDING" ? "PENDING_APPROVAL" : "ACCOUNT_REJECTED";
            console.error("Login attempt failed: Account not approved", { 
              userId: user.id, 
              email: normalizedEmail, 
              status: user.status 
            });
            throw error;
          }

          const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);

          if (!isPasswordValid) {
            console.error("Login attempt failed: Invalid password", { 
              userId: user.id, 
              email: normalizedEmail,
              passwordLength: trimmedPassword.length,
              passwordHashPrefix: user.password.substring(0, 10) + "..."
            });
            return null;
          }

          console.log("Login successful", { userId: user.id, email: normalizedEmail, role: user.role });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            employeeNumber: user.employeeNumber,
          };
        } catch (error) {
          // Re-throw approval errors so they can be handled in login page
          if (error instanceof Error && (error.message.includes("APPROVAL") || error.message.includes("REJECTED"))) {
            throw error;
          }
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial login - set user data from authorize function
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatar = user.avatar;
        token.role = user.role;
        token.employeeNumber = (user as any).employeeNumber;
      }
      
      // When session is updated (e.g., after avatar upload), fetch latest user data
      if (trigger === "update") {
        try {
          const updatedUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              role: true,
              employeeNumber: true,
            },
          });
          
          if (updatedUser) {
            token.id = updatedUser.id;
            token.email = updatedUser.email;
            token.name = updatedUser.name;
            token.avatar = updatedUser.avatar;
            token.role = updatedUser.role;
            token.employeeNumber = updatedUser.employeeNumber;
          }
        } catch (error) {
          console.error("Error fetching updated user data:", error);
          // Keep existing token data if fetch fails
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.avatar = token.avatar as string | null;
        session.user.role = token.role as
          | "SUPER_ADMIN"
          | "ADMIN"
          | "REGIONAL_MANAGER"
          | "AREA_MANAGER"
          | "BRANCH_MANAGER"
          | "EMPLOYEE"
          | "TRAINER";
        session.user.employeeNumber = token.employeeNumber as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Trust the Cloudflare tunnel URL
};

