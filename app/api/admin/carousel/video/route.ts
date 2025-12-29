import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary/config";

export const dynamic = 'force-dynamic';

// POST - Upload carousel video
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
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "File must be a video" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB for videos)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Video size must be less than 50MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'mp4';
    const filename = `carousel-video-${timestamp}.${fileExtension}`;

    // Get existing video URL for deletion
    let existingSettings = await prisma.carouselSettings.findFirst({
      select: { videoUrl: true },
    });

    // Upload to Cloudinary
    let videoUrl: string;
    try {
      videoUrl = await uploadToCloudinary(buffer, 'carousel', filename, 'video');
      console.log(`[CarouselVideo] Successfully uploaded to Cloudinary: ${videoUrl}`);
    } catch (uploadError) {
      console.error("[CarouselVideo] Cloudinary upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload video. Please try again." },
        { status: 500 }
      );
    }

    // Delete old video from Cloudinary if it exists
    if (existingSettings?.videoUrl) {
      const publicId = extractPublicIdFromUrl(existingSettings.videoUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId, 'video');
          console.log(`[CarouselVideo] Deleted old video from Cloudinary: ${publicId}`);
        } catch (deleteError) {
          console.error("[CarouselVideo] Error deleting old video (non-critical):", deleteError);
          // Continue - deletion failure is not critical
        }
      }
    }

    // Wrap Prisma queries in try-catch
    try {
      // Update carousel settings to VIDEO mode
      let settings = await prisma.carouselSettings.findFirst();
      if (!settings) {
        settings = await prisma.carouselSettings.create({
          data: {
            mode: "VIDEO",
            videoUrl,
            updatedBy: currentUser.id,
          },
        });
      } else {
        settings = await prisma.carouselSettings.update({
          where: { id: settings.id },
          data: {
            mode: "VIDEO",
            videoUrl,
            updatedBy: currentUser.id,
          },
        });
      }

      return NextResponse.json(
        { success: true, data: { videoUrl, settings } },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error uploading carousel video:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to upload carousel video" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/carousel/video:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

