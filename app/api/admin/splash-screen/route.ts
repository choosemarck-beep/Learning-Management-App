import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// GET - Fetch splash screen settings
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

    // Get or create splash screen settings
    let settings;
    try {
      settings = await prisma.splashScreenSettings.findFirst();
    } catch (error) {
      console.error("Error accessing splashScreenSettings model:", error);
      // If model doesn't exist, return error
      return NextResponse.json(
        { success: false, error: "Database model not available. Please regenerate Prisma client." },
        { status: 500 }
      );
    }

    if (!settings) {
      // Create default settings if none exist
      try {
        settings = await prisma.splashScreenSettings.create({
          data: {},
        });
      } catch (error) {
        console.error("Error creating splash screen settings:", error);
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
    console.error("Error fetching splash screen settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch splash screen settings" },
      { status: 500 }
    );
  }
}

// POST - Upload new splash screen image
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

    // Validate file size (max 10MB for splash screen)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'png';
    const filename = `splash-${timestamp}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "splash");
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
      settings = await prisma.splashScreenSettings.findFirst();
    } catch (error) {
      console.error("Error accessing splashScreenSettings model:", error);
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
          console.log("Deleted old splash screen image:", oldImagePath);
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
      console.log("Saved splash screen image to:", filepath);
    } catch (error) {
      console.error("Error writing file:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save image file" },
        { status: 500 }
      );
    }

    // Generate public URL
    const imageUrl = `/uploads/splash/${filename}`;

    // Update or create settings
    try {
      if (settings) {
        settings = await prisma.splashScreenSettings.update({
          where: { id: settings.id },
          data: { imageUrl },
        });
      } else {
        settings = await prisma.splashScreenSettings.create({
          data: { imageUrl },
        });
      }
      console.log("Updated splash screen settings:", settings);
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
    console.error("Error uploading splash screen image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to upload splash screen image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE - Remove splash screen image (reset to default)
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
    const settings = await prisma.splashScreenSettings.findFirst();

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
      await prisma.splashScreenSettings.update({
        where: { id: settings.id },
        data: { imageUrl: null },
      });
    }

    return NextResponse.json(
      { success: true, message: "Splash screen image removed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting splash screen image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete splash screen image" },
      { status: 500 }
    );
  }
}

