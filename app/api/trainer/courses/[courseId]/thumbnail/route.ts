import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary/config";

/**
 * POST - Upload thumbnail image for a course
 * Only trainers who created the course can upload thumbnails
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access only" },
        { status: 403 }
      );
    }

    const { courseId } = await params;

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        createdBy: currentUser.id,
      },
      select: {
        id: true,
        thumbnail: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("thumbnail") as File;

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

    // Validate file size (max 5MB)
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
      console.error("[CourseThumbnail] Error converting file to buffer:", bufferError);
      return NextResponse.json(
        { success: false, error: "Failed to process file" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `course-thumbnail-${courseId}-${timestamp}.${fileExtension}`;

    // Delete old thumbnail from Cloudinary if it exists
    if (course.thumbnail) {
      const publicId = extractPublicIdFromUrl(course.thumbnail);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId, 'image');
          console.log(`[CourseThumbnail] Deleted old thumbnail from Cloudinary: ${publicId}`);
        } catch (error) {
          console.error("[CourseThumbnail] Error deleting old thumbnail (non-critical):", error);
          // Continue even if deletion fails
        }
      }
    }

    // Upload to Cloudinary
    let thumbnailUrl: string;
    try {
      console.log("[CourseThumbnail] Starting Cloudinary upload:", { 
        filename, 
        size: buffer.length,
        hasCloudinaryConfig: !!(
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        ),
      });
      thumbnailUrl = await uploadToCloudinary(buffer, 'thumbnails/courses', filename, 'image');
      console.log(`[CourseThumbnail] Successfully uploaded to Cloudinary: ${thumbnailUrl}`);
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
      
      console.error("[CourseThumbnail] Cloudinary upload error:", {
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
            : "Failed to upload thumbnail. Please try again.",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }

    // Update course record
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { thumbnail: thumbnailUrl },
      select: {
        id: true,
        thumbnail: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          thumbnailUrl: updatedCourse.thumbnail,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading course thumbnail:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload thumbnail",
      },
      { status: 500 }
    );
  }
}

