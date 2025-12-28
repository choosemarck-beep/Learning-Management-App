import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    // Use file extension from uploaded file (could be jpg after compression)
    const fileExtension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const filename = `avatar-${currentUser.id}-${timestamp}.${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    console.log(
      `Avatar saved: ${filename}, ${(buffer.length / 1024).toFixed(2)}KB`
    );

    // Generate public URL
    const avatarUrl = `/uploads/avatars/${filename}`;

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

