import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { themeUpdateSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// GET - Fetch current theme settings
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

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

    // Get or create theme settings
    let settings;
    try {
      settings = await prisma.themeSettings.findFirst();
    } catch (error) {
      console.error("Error accessing themeSettings model:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { success: false, error: `Database error: ${errorMessage}. Please restart the dev server after regenerating Prisma client.` },
        { status: 500 }
      );
    }

    if (!settings) {
      // Create default settings if none exist
      try {
        settings = await prisma.themeSettings.create({
          data: {},
        });
      } catch (error) {
        console.error("Error creating theme settings:", error);
        return NextResponse.json(
          { success: false, error: "Failed to create settings" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: true, data: settings },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching theme settings:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      { success: false, error: `Failed to fetch theme settings: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PATCH - Update theme settings
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

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

    const body = await request.json();

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

    // Verify password

    // Get user with password to verify
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
  } catch (error) {
    console.error("Error updating theme settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update theme settings" },
      { status: 500 }
    );
  }
}

