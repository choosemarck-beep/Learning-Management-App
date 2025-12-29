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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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
      thumbnailUrl = await uploadToCloudinary(buffer, 'thumbnails/courses', filename, 'image');
      console.log(`[CourseThumbnail] Successfully uploaded to Cloudinary: ${thumbnailUrl}`);
    } catch (uploadError) {
      console.error("[CourseThumbnail] Cloudinary upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload thumbnail. Please try again." },
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

