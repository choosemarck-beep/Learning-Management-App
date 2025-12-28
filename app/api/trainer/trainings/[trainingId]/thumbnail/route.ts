import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * POST - Upload thumbnail image for a training
 * Only trainers who created the training can upload thumbnails
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
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

    const { trainingId } = await params;

    // Verify training ownership
    const training = await prisma.training.findFirst({
      where: {
        id: trainingId,
        createdBy: currentUser.id,
      },
      select: {
        id: true,
        videoThumbnail: true,
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found or you don't have permission to edit it" },
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
    const filename = `training-thumbnail-${trainingId}-${timestamp}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "thumbnails");
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
        console.log("Created thumbnails uploads directory:", uploadsDir);
      }
    } catch (error) {
      console.error("Error creating uploads directory:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create uploads directory" },
        { status: 500 }
      );
    }

    // Delete old thumbnail if it exists
    if (training.videoThumbnail) {
      const oldThumbnailPath = join(process.cwd(), "public", training.videoThumbnail);
      if (existsSync(oldThumbnailPath)) {
        try {
          await unlink(oldThumbnailPath);
          console.log("Deleted old thumbnail:", oldThumbnailPath);
        } catch (error) {
          console.error("Error deleting old thumbnail:", error);
          // Continue even if deletion fails
        }
      }
    }

    // Save new file
    const filepath = join(uploadsDir, filename);
    try {
      await writeFile(filepath, buffer);
      console.log("Saved thumbnail to:", filepath);
    } catch (error) {
      console.error("Error writing file:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save thumbnail file" },
        { status: 500 }
      );
    }

    // Generate public URL
    const thumbnailUrl = `/uploads/thumbnails/${filename}`;

    // Update training record
    const updatedTraining = await prisma.training.update({
      where: { id: trainingId },
      data: {
        videoThumbnail: thumbnailUrl,
      },
      select: {
        id: true,
        videoThumbnail: true,
      },
    });

    return NextResponse.json(
      { success: true, data: { thumbnailUrl: updatedTraining.videoThumbnail } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading thumbnail:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

