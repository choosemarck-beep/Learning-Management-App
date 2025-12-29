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

      // Check Cloudinary configuration before upload
      const hasCloudinaryConfig = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );
      
      if (!hasCloudinaryConfig) {
        console.error("[SplashScreen] Cloudinary configuration missing:", {
          hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
          hasApiKey: !!process.env.CLOUDINARY_API_KEY,
          hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
        });
        return NextResponse.json(
          { 
            success: false, 
            error: "Image upload service is not configured. Please contact your administrator.",
            details: process.env.NODE_ENV === "development" 
              ? "Cloudinary environment variables are missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Vercel."
              : undefined,
          },
          { status: 500 }
        );
      }

      // Upload to Cloudinary
      let imageUrl: string;
      try {
        console.log("[SplashScreen] Starting Cloudinary upload:", { filename, size: buffer.length });
        imageUrl = await uploadToCloudinary(buffer, 'splash', filename, 'image');
        console.log(`[SplashScreen] Successfully uploaded to Cloudinary: ${imageUrl}`);
      } catch (uploadError) {
        const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
        console.error("[SplashScreen] Cloudinary upload error:", {
          message: errorMessage,
          stack: uploadError instanceof Error ? uploadError.stack : undefined,
          filename,
          bufferSize: buffer.length,
        });
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to upload splash screen. Please try again.",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
          },
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

    // Wrap Prisma queries in try-catch
    try {
      // Get existing settings
      const settings = await prisma.splashScreenSettings.findFirst();

      if (settings?.imageUrl) {
        // Delete the image from Cloudinary
        const publicId = extractPublicIdFromUrl(settings.imageUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId, 'image');
            console.log(`[SplashScreen] Deleted image from Cloudinary: ${publicId}`);
          } catch (error) {
            console.error("[SplashScreen] Error deleting from Cloudinary (non-critical):", error);
            // Continue even if deletion fails
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

