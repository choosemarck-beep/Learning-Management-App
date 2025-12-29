import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const dynamic = 'force-dynamic';

// GET - Fetch all carousel images (admin)
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
      const images = await prisma.carouselImage.findMany({
        orderBy: [
          { order: "asc" },
          { createdAt: "desc" },
        ],
      });

      return NextResponse.json(
        { success: true, data: images },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching carousel images:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch carousel images" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/carousel:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST - Create new carousel image
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
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const orderParam = formData.get("order");
    const isActiveParam = formData.get("isActive");
    const order = orderParam ? parseInt(orderParam as string, 10) : undefined;
    const isActive = isActiveParam ? isActiveParam === "true" : true;

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
    const filename = `carousel-${timestamp}.${file.name.split('.').pop()}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "carousel");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Generate public URL
    const imageUrl = `/uploads/carousel/${filename}`;

    // Wrap Prisma queries in try-catch
    try {
      // Determine order - use provided order or append at end
      let newOrder: number;
      if (order !== undefined) {
        newOrder = order;
      } else {
        const maxOrder = await prisma.carouselImage.aggregate({
          _max: { order: true },
        });
        newOrder = (maxOrder._max.order ?? -1) + 1;
      }

      // Create carousel image record
      const carouselImage = await prisma.carouselImage.create({
        data: {
          imageUrl,
          title: title || null,
          description: description || null,
          order: newOrder,
          isActive,
          createdBy: currentUser.id,
        },
      });

      return NextResponse.json(
        { success: true, data: carouselImage },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error creating carousel image:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to create carousel image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/carousel:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

