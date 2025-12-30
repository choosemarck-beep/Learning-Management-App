import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary/config";

export const dynamic = 'force-dynamic';

// GET - Fetch logo settings
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
      // Get or create logo settings
      let settings = await prisma.appLogoSettings.findFirst();

      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.appLogoSettings.create({
          data: {},
        });
      }

      return NextResponse.json(
        { success: true, data: settings },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching logo settings:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch logo settings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/logo:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST - Upload new logo image
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

    // Validate file size (max 5MB for logo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Validate file name
    if (!file.name || typeof file.name !== 'string' || file.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: "File name is required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    let buffer: Buffer;
    try {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      
      // Validate buffer was created successfully
      if (!buffer || buffer.length === 0) {
        return NextResponse.json(
          { success: false, error: "File buffer is empty" },
          { status: 400 }
        );
      }
    } catch (bufferError) {
      console.error("[Logo] Error converting file to buffer:", bufferError);
      return NextResponse.json(
        { success: false, error: "Failed to process file" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'png';
    const filename = `logo-${timestamp}.${fileExtension}`;

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
    
    // Delete old image from Cloudinary if it exists
    if (settings?.imageUrl) {
      const publicId = extractPublicIdFromUrl(settings.imageUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId, 'image');
          console.log(`[Logo] Deleted old logo from Cloudinary: ${publicId}`);
        } catch (error) {
          console.error("[Logo] Error deleting old logo (non-critical):", error);
          // Continue even if deletion fails
        }
      }
    }

    // Upload to Cloudinary
    let imageUrl: string;
    try {
      console.log("[Logo] Starting Cloudinary upload:", { 
        filename, 
        size: buffer.length,
        hasCloudinaryConfig: !!(
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        ),
      });
      imageUrl = await uploadToCloudinary(buffer, 'logo', filename, 'image');
      console.log(`[Logo] Successfully uploaded to Cloudinary: ${imageUrl}`);
    } catch (uploadError) {
      // Extract meaningful error message from Cloudinary error structure
      const errorMessage = uploadError instanceof Error 
        ? uploadError.message 
        : (uploadError && typeof uploadError === 'object' && 'message' in uploadError)
          ? String((uploadError as any).message)
          : String(uploadError);
      
      // Check if it's a configuration error
      const isConfigError = errorMessage.includes('Cloudinary configuration') || 
                          errorMessage.includes('missing') ||
                          errorMessage.includes('placeholder');
      
      console.error("[Logo] Cloudinary upload error:", {
        message: errorMessage,
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        filename,
        bufferSize: buffer.length,
        isConfigError,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: isConfigError 
            ? "Image upload service is not configured. Please contact your administrator."
            : "Failed to upload logo. Please try again.",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }

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
      // If database update fails, try to delete from Cloudinary
      try {
        const publicId = extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          await deleteFromCloudinary(publicId, 'image');
          console.log(`[Logo] Cleaned up uploaded image from Cloudinary: ${publicId}`);
        }
      } catch (deleteError) {
        console.error("[Logo] Error cleaning up Cloudinary image (non-critical):", deleteError);
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
      const settings = await prisma.appLogoSettings.findFirst();

      if (settings?.imageUrl) {
        // Delete the image from Cloudinary
        const publicId = extractPublicIdFromUrl(settings.imageUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId, 'image');
            console.log(`[Logo] Deleted logo from Cloudinary: ${publicId}`);
          } catch (error) {
            console.error("[Logo] Error deleting from Cloudinary (non-critical):", error);
            // Continue even if deletion fails
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
    } catch (dbError) {
      console.error("Database or file operation error deleting logo:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to delete logo image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/logo:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

