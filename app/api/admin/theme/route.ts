import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { themeUpdateSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// GET - Fetch current theme settings
export async function GET(request: NextRequest) {
  try {
    // Wrap getCurrentUser in try-catch
    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Wrap Prisma queries in try-catch
    try {
      // Get or create theme settings
      let settings = await prisma.themeSettings.findFirst();

      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.themeSettings.create({
          data: {},
        });
      }

      return NextResponse.json(
        { success: true, data: settings },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching theme settings:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch theme settings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/theme:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PATCH - Update theme settings
export async function PATCH(request: NextRequest) {
  try {
    // Wrap getCurrentUser in try-catch
    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
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
      validatedData = themeUpdateSchema.parse(body);
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
      // Verify password - Get user with password to verify
      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { password: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 401 }
        );
      }

      // Build update data from validated fields (exclude password)
      const updateData: Record<string, string | null | boolean> = {};
      const { password, ...themeFields } = validatedData;
      
      for (const [key, value] of Object.entries(themeFields)) {
        if (value !== undefined) {
          if (key === "galaxyBackgroundEnabled") {
            // Boolean field
            updateData[key] = value === true;
          } else {
            // String fields (can be null or empty string)
            updateData[key] = value === "" ? null : value;
          }
        }
      }

      // Get existing settings
      let settings = await prisma.themeSettings.findFirst();

      // Update or create settings
      if (settings) {
        settings = await prisma.themeSettings.update({
          where: { id: settings.id },
          data: updateData,
        });
      } else {
        settings = await prisma.themeSettings.create({
          data: updateData,
        });
      }

      return NextResponse.json(
        { success: true, data: settings },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error updating theme settings:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to update theme settings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in PATCH /api/admin/theme:", error);
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

