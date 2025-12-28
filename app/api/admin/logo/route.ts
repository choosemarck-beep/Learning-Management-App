import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// GET - Fetch logo settings
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

    // Get or create logo settings
    let settings;
    try {
      settings = await prisma.appLogoSettings.findFirst();
    } catch (error) {
      console.error("Error accessing appLogoSettings model:", error);
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
        settings = await prisma.appLogoSettings.create({
          data: {},
        });
      } catch (error) {
        console.error("Error creating logo settings:", error);
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
    console.error("Error fetching logo settings:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      { success: false, error: `Failed to fetch logo settings: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST - Upload new logo image
export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for logo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'png';
    const filename = `logo-${timestamp}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "logo");
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
        console.log("Created uploads directory:", uploadsDir);
      }
    } catch (error) {
      console.error("Error creating uploads directory:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create uploads directory" },
        { status: 500 }
      );
    }

    // Get existing settings to delete old image
    let settings;
    try {
      settings = await prisma.appLogoSettings.findFirst();
    } catch (error) {
      console.error("Error accessing appLogoSettings model:", error);
      return NextResponse.json(
        { success: false, error: "Database model not available. Please regenerate Prisma client." },
        { status: 500 }
      );
    }
    
    // Delete old image if it exists
    if (settings?.imageUrl) {
      const oldImagePath = join(process.cwd(), "public", settings.imageUrl);
      if (existsSync(oldImagePath)) {
        try {
          await unlink(oldImagePath);
          console.log("Deleted old logo image:", oldImagePath);
        } catch (error) {
          console.error("Error deleting old image:", error);
          // Continue even if deletion fails
        }
      }
    }

    // Save new file
    const filepath = join(uploadsDir, filename);
    try {
      await writeFile(filepath, buffer);
      console.log("Saved logo image to:", filepath);
    } catch (error) {
      console.error("Error writing file:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save image file" },
        { status: 500 }
      );
    }

    // Generate public URL
    const imageUrl = `/uploads/logo/${filename}`;

    // Update or create settings
    try {
      if (settings) {
        settings = await prisma.appLogoSettings.update({
          where: { id: settings.id },
          data: { imageUrl },
        });
      } else {
        settings = await prisma.appLogoSettings.create({
          data: { imageUrl },
        });
      }
      console.log("Updated logo settings:", settings);
    } catch (error) {
      console.error("Error updating database:", error);
      // Try to delete the file we just created
      try {
        await unlink(filepath);
      } catch (deleteError) {
        console.error("Error cleaning up file:", deleteError);
      }
      return NextResponse.json(
        { success: false, error: "Failed to update database" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: settings },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading logo image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to upload logo image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE - Remove logo image (reset to default)
export async function DELETE(request: NextRequest) {
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

    // Get existing settings
    const settings = await prisma.appLogoSettings.findFirst();

    if (settings?.imageUrl) {
      // Delete the image file
      const imagePath = join(process.cwd(), "public", settings.imageUrl);
      if (existsSync(imagePath)) {
        try {
          await unlink(imagePath);
        } catch (error) {
          console.error("Error deleting image:", error);
        }
      }

      // Update settings to remove image URL
      await prisma.appLogoSettings.update({
        where: { id: settings.id },
        data: { imageUrl: null },
      });
    }

    return NextResponse.json(
      { success: true, message: "Logo image removed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting logo image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete logo image" },
      { status: 500 }
    );
  }
}

