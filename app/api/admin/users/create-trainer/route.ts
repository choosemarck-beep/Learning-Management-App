import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

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
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 400 }
        );
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

      return NextResponse.json(
        {
          success: true,
          data: trainer,
          password: generatedPassword, // Return plain password for admin to copy
          message: "Trainer created successfully",
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error creating trainer:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to create trainer" },
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

