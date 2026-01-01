import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendTrainerOnboardingEmail } from "@/lib/email/sendEmail";

export const dynamic = 'force-dynamic';

// Generate random password
function generateRandomPassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;

  let password = "";
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

const createTrainerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  employeeNumber: z.string().optional(),
  phone: z.string().optional(),
  companyId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Wrap getCurrentUser in try-catch
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only ADMIN and SUPER_ADMIN can create trainers
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = createTrainerSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Wrap Prisma queries in try-catch
    try {
      // Check if email already exists
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUserByEmail) {
        return NextResponse.json(
          { 
            success: false, 
            error: "A user with this email address already exists. Please use a different email.",
            field: "email",
          },
          { status: 400 }
        );
      }

      // Check if employeeNumber already exists (if provided)
      if (validatedData.employeeNumber && validatedData.employeeNumber.trim() !== "") {
        const existingUserByEmployeeNumber = await prisma.user.findUnique({
          where: { employeeNumber: validatedData.employeeNumber.trim() },
        });

        if (existingUserByEmployeeNumber) {
          return NextResponse.json(
            { 
              success: false, 
              error: "A user with this employee number already exists. Please use a different employee number or leave it blank.",
              field: "employeeNumber",
            },
            { status: 400 }
          );
        }
      }

      // Generate random password
      const generatedPassword = generateRandomPassword(12);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      // Find the "Trainer" position (default for all admin-created accounts)
      const trainerPosition = await prisma.position.findFirst({
        where: {
          title: "Trainer",
          isActive: true,
        },
      });

      // Create trainer user with default Trainer position
      const trainer = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: "TRAINER",
          status: "APPROVED", // Trainers are auto-approved
          emailVerified: true,
          onboardingCompleted: false,
          approvedAt: new Date(),
          approvedBy: user.id,
          employeeNumber: validatedData.employeeNumber || null,
          phone: validatedData.phone || null,
          companyId: validatedData.companyId || null,
          positionId: trainerPosition?.id || null, // Default to Trainer position
          hireType: "DIRECT_HIRE", // Trainers default to direct hire
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          position: {
            select: {
              id: true,
              title: true,
              role: true,
            },
          },
        },
      });

      // Send trainer onboarding email (non-blocking - don't fail creation if email fails)
      let emailSent = false;
      let emailError: any = null;
      try {
        // Use NEXTAUTH_URL from environment (set in Vercel) or construct from request
        // Never use hardcoded localhost - this breaks in production
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");
        const baseUrl = process.env.NEXTAUTH_URL || origin || (host ? `https://${host}` : "");
        const loginUrl = baseUrl ? `${baseUrl}/login` : "/login";
        
        await sendTrainerOnboardingEmail(
          trainer.email,
          trainer.name,
          generatedPassword,
          loginUrl
        );
        emailSent = true;
        console.log("✅ Trainer onboarding email sent successfully to:", trainer.email);
      } catch (error) {
        emailError = error;
        console.error("❌ Failed to send trainer onboarding email:", {
          email: trainer.email,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Continue even if email fails - trainer is still created
      }

      return NextResponse.json(
        {
          success: true,
          data: trainer,
          password: generatedPassword, // Return plain password for admin to copy
          message: "Trainer created successfully",
          emailSent, // Indicate if email was sent successfully
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error creating trainer:", dbError);
      
      // Handle Prisma unique constraint errors
      if (dbError && typeof dbError === "object" && "code" in dbError) {
        const prismaError = dbError as { code: string; meta?: any };
        
        if (prismaError.code === "P2002") {
          // Unique constraint violation
          const target = prismaError.meta?.target || [];
          let errorMessage = "A trainer with this information already exists.";
          
          if (target.includes("email")) {
            errorMessage = "A user with this email address already exists. Please use a different email.";
          } else if (target.includes("employeeNumber")) {
            errorMessage = "A user with this employee number already exists. Please use a different employee number or leave it blank.";
          } else if (target.includes("phone")) {
            errorMessage = "A user with this phone number already exists. Please use a different phone number or leave it blank.";
          }
          
          return NextResponse.json(
            { 
              success: false, 
              error: errorMessage,
              code: prismaError.code,
              field: target[0] || null,
            },
            { status: 400 }
          );
        }
        
        if (prismaError.code === "P2003") {
          // Foreign key constraint violation
          return NextResponse.json(
            { 
              success: false, 
              error: "Invalid company or position selected. Please select a valid option.",
              code: prismaError.code,
            },
            { status: 400 }
          );
        }
        
        if (prismaError.code === "P1001") {
          // Database connection error
          return NextResponse.json(
            { 
              success: false, 
              error: "Database connection error. Please try again later.",
              code: prismaError.code,
            },
            { status: 503 }
          );
        }
      }
      
      // Generic database error
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to create trainer account. Please try again.",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/users/create-trainer:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

