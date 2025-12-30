import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary/config";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error("Invalid file type:", file.type);
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB - safety net after client-side compression)
    // Client-side compression should reduce files to < 500KB, but we allow larger
    // as a safety net in case compression fails or is bypassed
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      console.error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: 10MB)`
      );
      return NextResponse.json(
        {
          success: false,
          error: `File size must be less than 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    console.log(
      `Uploading avatar: ${file.type}, ${(file.size / 1024).toFixed(2)}KB`
    );

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
      console.error("[Avatar] Error converting file to buffer:", bufferError);
      return NextResponse.json(
        { success: false, error: "Failed to process file" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const filename = `avatar-${currentUser.id}-${timestamp}.${fileExtension}`;

    // Get old avatar URL for deletion
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { avatar: true },
    });

    // Upload to Cloudinary
    let avatarUrl: string;
    try {
      console.log("[Avatar] Starting Cloudinary upload:", { 
        filename, 
        size: buffer.length,
        hasCloudinaryConfig: !!(
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        ),
      });
      
      avatarUrl = await uploadToCloudinary(buffer, 'avatars', filename, 'image');
      console.log(`[Avatar] Successfully uploaded to Cloudinary: ${avatarUrl}`);
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
      
      console.error("[Avatar] Cloudinary upload error:", {
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
            : "Failed to upload avatar. Please try again.",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }

    // Delete old avatar from Cloudinary if it exists and is a Cloudinary URL
    if (user?.avatar) {
      const publicId = extractPublicIdFromUrl(user.avatar);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId, 'image');
          console.log(`[Avatar] Deleted old avatar from Cloudinary: ${publicId}`);
        } catch (deleteError) {
          console.error("[Avatar] Error deleting old avatar (non-critical):", deleteError);
          // Continue - deletion failure is not critical
        }
      }
    }

    // Update user avatar in database
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { avatar: avatarUrl },
    });

    console.log(`Avatar updated for user: ${currentUser.id}`);

    return NextResponse.json(
      { success: true, avatarUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading avatar:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}

