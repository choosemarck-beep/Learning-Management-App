import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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
    const filename = `carousel-video-${timestamp}.${file.name.split('.').pop()}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "carousel");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Generate public URL
    const videoUrl = `/uploads/carousel/${filename}`;

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

