import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendOnboardingEmail } from "@/lib/email/sendEmail";
import { checkRateLimit, getClientIP, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";

const signupSchema = z.object({
  // Step 1: Personal Information
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  // Step 2: Employee Details
  employeeNumber: z.string().min(1, "Employee number is required"),
  hireType: z.enum(["DIRECT_HIRE", "AGENCY"], {
    required_error: "Please select a hire type",
  }),
  companyId: z.string().min(1, "Please select a company or agency"),
  positionId: z.string().min(1, "Please select a position"),
  department: z.string().min(1, "Department is required"),
  branch: z.string().min(1, "Branch is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  // Step 3: Account Setup
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(
    clientIP,
    "signup",
    RATE_LIMIT_CONFIGS.signup
  );

  if (!rateLimitResult.allowed) {
    const resetTimeSeconds = Math.ceil(
      (rateLimitResult.resetTime - Date.now()) / 1000
    );
    return NextResponse.json(
      {
        success: false,
        error: "Too many signup attempts. Please try again later.",
        retryAfter: resetTimeSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetTimeSeconds.toString(),
          "X-RateLimit-Limit": RATE_LIMIT_CONFIGS.signup.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);
    const {
      name,
      email,
      phone,
      password,
      employeeNumber,
      hireType,
      companyId,
      positionId,
      department,
      branch,
      hireDate,
    } = validatedData;

    // Check if user already exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if employee number already exists (if provided)
    if (employeeNumber) {
      const existingUserByEmployeeNumber = await prisma.user.findFirst({
        where: { 
          employeeNumber: employeeNumber
        },
      });

      if (existingUserByEmployeeNumber) {
        return NextResponse.json(
          { error: "Employee number already exists" },
          { status: 400 }
        );
      }
    }

    // Fetch position to auto-detect role
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      select: { role: true },
    });

    // Auto-detect role from position, default to EMPLOYEE if not found
    const userRole = position?.role || "EMPLOYEE";

    // Validate that only EMPLOYEE or BRANCH_MANAGER can register
    if (userRole !== "EMPLOYEE" && userRole !== "BRANCH_MANAGER") {
      return NextResponse.json(
        { error: "Invalid role for self-registration" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parse hire date
    const parsedHireDate = hireDate ? new Date(hireDate) : null;

    // Create user with all employee fields
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        employeeNumber,
        hireType,
        companyId,
        positionId,
        department,
        branch,
        hireDate: parsedHireDate,
        role: userRole, // Auto-detected from position
        status: "PENDING", // Requires admin approval
        emailVerified: false,
        onboardingCompleted: false,
        xp: 0,
        level: 1,
        rank: "Deckhand",
        streak: 0,
        diamonds: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    // Send onboarding email (non-blocking - don't fail signup if email fails)
    let emailSent = false;
    let emailError: any = null;
    try {
      const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
      await sendOnboardingEmail(user.email, user.name, loginUrl);
      emailSent = true;
      console.log("✅ Onboarding email sent successfully to:", user.email);
    } catch (error) {
      emailError = error;
      console.error("❌ Failed to send onboarding email:", {
        email: user.email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Continue even if email fails - user is still created
    }

    return NextResponse.json(
      {
        message: "Account created successfully. Your enrollment is subject to approval. Please check your email for confirmation.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Log the full error for debugging
    console.error("Signup error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    // Return more detailed error in development, generic in production
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? error instanceof Error
          ? error.message
          : String(error)
        : "Internal server error";

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined
      },
      { status: 500 }
    );
  }
}

