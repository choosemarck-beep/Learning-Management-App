import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary/config";

export const dynamic = 'force-dynamic';

// GET - Fetch splash screen settings
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
      // Get or create splash screen settings
      let settings = await prisma.splashScreenSettings.findFirst();

      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.splashScreenSettings.create({
          data: {},
        });
      }

      return NextResponse.json(
        { success: true, data: settings },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching splash screen settings:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch splash screen settings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/splash-screen:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST - Upload new splash screen image
export async function POST(request: NextRequest) {
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

    // Wrap Prisma queries and file operations in try-catch
    try {
      // Get existing settings to delete old image
      let settings = await prisma.splashScreenSettings.findFirst();
      
      // Delete old image from Cloudinary if it exists
      if (settings?.imageUrl) {
        const publicId = extractPublicIdFromUrl(settings.imageUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId, 'image');
            console.log(`[SplashScreen] Deleted old image from Cloudinary: ${publicId}`);
          } catch (error) {
            console.error("[SplashScreen] Error deleting old image (non-critical):", error);
            // Continue even if deletion fails
          }
        }
      }

      // Upload to Cloudinary
      let imageUrl: string;
      try {
        imageUrl = await uploadToCloudinary(buffer, 'splash', filename, 'image');
        console.log(`[SplashScreen] Successfully uploaded to Cloudinary: ${imageUrl}`);
      } catch (uploadError) {
        console.error("[SplashScreen] Cloudinary upload error:", uploadError);
        return NextResponse.json(
          { success: false, error: "Failed to upload splash screen. Please try again." },
          { status: 500 }
        );
      }

      // Update or create settings
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

      return NextResponse.json(
        { success: true, data: settings },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database or file operation error uploading splash screen:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to upload splash screen image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/splash-screen:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE - Remove splash screen image (reset to default)
export async function DELETE(request: NextRequest) {
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

    // Wrap Prisma queries and file operations in try-catch
    try {
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
    } catch (dbError) {
      console.error("Database or file operation error deleting splash screen:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to delete splash screen image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/splash-screen:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

